export const MAX_TICKERS = 4
export const TICKER_PLACEHOLDERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'] as const
export const TICKER_FIELD_NAMES = ['ticker-1', 'ticker-2', 'ticker-3', 'ticker-4'] as const

const TICKER_RE = /^[A-Z0-9.\-^=]{1,12}$/

export function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase()
}

export function parseTickerInputs(inputs: string[]): string[] {
  const seen = new Set<string>()
  const tickers: string[] = []
  for (const raw of inputs) {
    const ticker = normalizeTicker(raw)
    if (!ticker) continue
    if (!TICKER_RE.test(ticker)) {
      throw new Error(`Enter a valid ticker symbol (${ticker} is not valid).`)
    }
    if (seen.has(ticker)) continue
    seen.add(ticker)
    tickers.push(ticker)
    if (tickers.length >= MAX_TICKERS) break
  }
  return tickers
}

export function padTickerInputs(tickers: string[]): string[] {
  const next = tickers.slice(0, MAX_TICKERS)
  while (next.length < MAX_TICKERS) next.push('')
  return next
}

export function defaultTickerInputs(tickers: string[]): string[] {
  return tickers.length ? padTickerInputs(tickers) : [...TICKER_PLACEHOLDERS]
}

export function readTickerForm(form: HTMLFormElement): string[] {
  const data = new FormData(form)
  return TICKER_FIELD_NAMES.map((name) => String(data.get(name) ?? ''))
}
