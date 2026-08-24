import * as cheerio from 'cheerio'
import YahooFinance from 'yahoo-finance2'
import type { AnnualFinancials, RawStockData } from '../src/types.js'
import { fetchText, parsePercent } from './utils.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
  queue: { concurrency: 1, interval: 400 },
  fetchOptions: {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
})

const emptyYahoo: RawStockData['yahoo'] = {
  earningsHistory: [],
  earningsTrend: [],
  dividendHistory: [],
}

function isRateLimited(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /429|too many requests|failed to get crumb/i.test(message)
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      last = error
      if (!isRateLimited(error) || i === attempts - 1) throw error
      const waitMs = 700 * 2 ** i + Math.floor(Math.random() * 400)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
  throw last
}

export async function fetchFinvizStats(ticker: string): Promise<{
  stats: Record<string, string>
  companyName?: string
}> {
  const html = await withRetry(() => fetchText(`https://finviz.com/quote.ashx?t=${encodeURIComponent(ticker)}&p=d`))
  const $ = cheerio.load(html)
  const stats: Record<string, string> = {}
  $('table.snapshot-table2 tr').each((_, row) => {
    $(row)
      .find('td')
      .each((i, cell) => {
        if (i % 2 === 0) {
          const key = $(cell).text().trim()
          const val = $(cell).next().text().trim()
          if (key) stats[key] = val
        }
      })
  })
  if (Object.keys(stats).length === 0) {
    throw new Error(`No Finviz statistics found for ${ticker}`)
  }

  const headerName = $('a.tab-link-news').first().text().trim()
  const titleName = $('title')
    .text()
    .replace(new RegExp(`^${ticker}\\s*[-–]?\\s*`, 'i'), '')
    .replace(/\s*[|–-].*$/, '')
    .replace(/\s*(Stock Quote|Stock Price).*$/i, '')
    .trim()

  return { stats, companyName: headerName || titleName || undefined }
}

function annualFromYahoo(rows: Array<Record<string, unknown>>): AnnualFinancials[] {
  return rows
    .filter((r) => r.periodType === '12M' && typeof r.date === 'string')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-5)
    .map((r) => {
      const revenue = typeof r.totalRevenue === 'number' ? r.totalRevenue : null
      const grossProfit = typeof r.grossProfit === 'number' ? r.grossProfit : null
      const operatingIncome = typeof r.operatingIncome === 'number' ? r.operatingIncome : null
      const netIncome = typeof r.netIncome === 'number' ? r.netIncome : null
      const eps = typeof r.dilutedEPS === 'number' ? r.dilutedEPS : null
      const date = new Date(String(r.date))
      return {
        fiscalYearEnd: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        grossMargin: revenue && grossProfit != null ? grossProfit / revenue : null,
        operatingMargin: revenue && operatingIncome != null ? operatingIncome / revenue : null,
        netMargin: revenue && netIncome != null ? netIncome / revenue : null,
        totalRevenue: revenue,
        epsDiluted: eps,
      }
    })
}

async function fetchMacro(): Promise<{ sp500Yield: number | null; treasury10Y: number | null }> {
  try {
    const tnx = await withRetry(() => yf.quote('^TNX'))
    const spy = await withRetry(() => yf.quoteSummary('SPY', { modules: ['summaryDetail'] }))
    return {
      treasury10Y: typeof tnx.regularMarketPrice === 'number' ? tnx.regularMarketPrice / 100 : null,
      sp500Yield: spy.summaryDetail?.dividendYield ?? null,
    }
  } catch {
    return { sp500Yield: null, treasury10Y: null }
  }
}

function parseDualPercent(value: string | undefined, pick: 'first' | 'second' | 'last' = 'last'): number | null {
  if (!value) return null
  const parts = value.match(/-?\d+(?:\.\d+)?/g)
  if (!parts?.length) return null
  const raw = pick === 'first' ? parts[0] : pick === 'second' && parts[1] ? parts[1] : parts[parts.length - 1]
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n / 100 : null
}

async function fetchYahooBundle(symbol: string): Promise<{
  companyName?: string
  yahoo: RawStockData['yahoo']
  annualFinancials: AnnualFinancials[]
  macro: RawStockData['macro']
}> {
  const quoteSummary = await withRetry(() =>
    yf.quoteSummary(symbol, {
      modules: ['earningsHistory', 'earningsTrend', 'summaryDetail', 'price'],
    }),
  )
  const fundamentals = (await withRetry(() =>
    yf.fundamentalsTimeSeries(symbol, { period1: '2018-01-01', module: 'financials', type: 'annual' }),
  ).catch(() => [])) as Array<Record<string, unknown>>
  const chart = await withRetry(() => yf.chart(symbol, { period1: '2018-01-01', events: 'div' })).catch(
    () => ({ events: { dividends: {} as Record<string, { amount: number; date: number }> } }),
  )
  const dividends = (chart.events?.dividends ?? {}) as Record<string, { amount: number; date: number | Date | string }>
  const dividendHistory = Object.values(dividends)
    .map((d) => ({ amount: d.amount, date: new Date(d.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const macro = await fetchMacro()
  return {
    companyName: quoteSummary.price?.shortName ?? quoteSummary.price?.longName ?? undefined,
    annualFinancials: annualFromYahoo(fundamentals),
    macro,
    yahoo: {
      earningsHistory: (quoteSummary.earningsHistory?.history ?? []).map((h) => ({
        epsActual: h.epsActual ?? undefined,
        epsEstimate: h.epsEstimate ?? undefined,
        surprisePercent: h.surprisePercent ?? undefined,
        quarter: h.quarter ? new Date(h.quarter) : undefined,
      })),
      earningsTrend: (quoteSummary.earningsTrend?.trend ?? []).map((t) => ({
        period: t.period,
        growth: t.growth ?? undefined,
        earningsEstimate: {
          avg: t.earningsEstimate?.avg ?? undefined,
          growth: t.earningsEstimate?.growth ?? undefined,
        },
      })),
      fiveYearAvgDividendYield: quoteSummary.summaryDetail?.fiveYearAvgDividendYield,
      dividendRate: quoteSummary.summaryDetail?.dividendRate,
      dividendYield: quoteSummary.summaryDetail?.dividendYield,
      payoutRatio: quoteSummary.summaryDetail?.payoutRatio,
      dividendHistory,
    },
  }
}

export async function fetchRawStockData(ticker: string): Promise<RawStockData> {
  const symbol = ticker.trim().toUpperCase()
  const finviz = await fetchFinvizStats(symbol)

  let yahoo = emptyYahoo
  let annualFinancials: AnnualFinancials[] = []
  let macro: RawStockData['macro'] = { sp500Yield: null, treasury10Y: null }
  let companyName = finviz.companyName

  try {
    const bundle = await fetchYahooBundle(symbol)
    companyName = bundle.companyName ?? companyName
    annualFinancials = bundle.annualFinancials
    macro = bundle.macro
    yahoo = bundle.yahoo
  } catch (error) {
    if (!isRateLimited(error)) throw error
  }

  return {
    ticker: symbol,
    companyName,
    fetchedAt: new Date().toISOString(),
    finviz: finviz.stats,
    yahoo,
    annualFinancials,
    macro,
  }
}

export function finvizGrowthPercent(key: string, finviz: Record<string, string>): number | null {
  return parsePercent(finviz[key])
}

export { parseDualPercent }
