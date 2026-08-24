import { formatMarginYoY, formatPercent, formatRatio } from '../lib/format.ts'
import type { WorksheetValues } from '../types.ts'

interface Row {
  label: string
  value: string
  extra?: string
  highlight?: 'pass' | 'fail' | 'neutral'
}

function pct(v: number | null | undefined, digits = 2): string {
  if (v == null) return '—'
  return formatPercent(v, digits)
}

function num(v: number | null | undefined, digits = 2): string {
  if (v == null) return '—'
  return formatRatio(v, digits)
}

function yn(v: string): string {
  if (!v) return '—'
  return v
}

function buildRows(w: WorksheetValues): Array<{ section?: string; rows: Row[] }> {
  return [
    {
      rows: [
        { label: 'Price', value: w.price || '—' },
        { label: 'Market Cap (M=Million, B=Billion)', value: w.marketCap || '—' },
        { label: 'Micro, Small, Mid, Large or Mega Cap', value: w.capLabel || '—' },
        { label: 'Revenue (M=Million, B=Billion)', value: w.revenue || '—' },
        { label: 'Earnings Per Share (EPS)', value: w.eps || '—' },
        { label: 'Quarterly Revenue Growth YOY', value: pct(w.salesQoq) },
        { label: 'Quarterly Earnings Growth YOY', value: pct(w.epsQoq) },
        {
          label: 'Rev growth similar to earnings growth? (Y/N)',
          value: yn(w.revEarningsGrowthSimilar),
          highlight:
            w.revEarningsGrowthSimilar === 'Y' ? 'pass' : w.revEarningsGrowthSimilar === 'N' ? 'fail' : 'neutral',
        },
      ],
    },
    {
      section: 'Quick Fundamental Analysis Criteria',
      rows: [
        {
          label: '# of EPS Surprises in Last 4 Quarters',
          value: w.epsSurpriseCount != null ? String(w.epsSurpriseCount) : '—',
          highlight: w.epsSurpriseCount != null ? (w.epsSurpriseCount > 2 ? 'pass' : 'fail') : 'neutral',
        },
        {
          label: 'Increasing EPS Surprises? (Y/N)',
          value: yn(w.increasingEpsSurprises),
          extra: w.increasingSurprisesDetail,
          highlight: w.increasingEpsSurprises === 'Y' ? 'pass' : w.increasingEpsSurprises === 'N' ? 'fail' : 'neutral',
        },
        {
          label: 'Positive EPS Revisions? (Y/N)',
          value: yn(w.positiveEpsRevisions),
          extra: w.revisionChange != null ? pct(w.revisionChange) : undefined,
          highlight: w.positiveEpsRevisions === 'Y' ? 'pass' : w.positiveEpsRevisions === 'N' ? 'fail' : 'neutral',
        },
        {
          label: "Curr Year's Year Over Year (yoy) EPS % Growth",
          value: pct(w.epsGrowthCurrentYear),
          highlight: w.epsGrowthCurrentYear != null && w.epsGrowthCurrentYear >= 0.15 ? 'pass' : 'fail',
        },
        {
          label: "Next Year's Year Over Year (yoy) EPS % Growth",
          value: pct(w.epsGrowthNextYear),
          highlight: w.epsGrowthNextYear != null && w.epsGrowthNextYear >= 0.15 ? 'pass' : 'fail',
        },
        {
          label: '5-year Projected EPS Growth',
          value: pct(w.epsGrowth5YearProjected),
          highlight: w.epsGrowth5YearProjected != null && w.epsGrowth5YearProjected >= 0.15 ? 'pass' : 'fail',
        },
        { label: '3/5-year Historical EPS Growth', value: pct(w.epsGrowthHistorical) },
      ],
    },
    {
      section: 'Profitability Ratios',
      rows: [
        {
          label: 'Gross Margin (GM) for TTM',
          value: pct(w.grossMarginTtm),
          highlight: w.grossMarginTtm != null && w.grossMarginTtm >= 0.4 ? 'pass' : 'fail',
        },
        {
          label: 'Operating Margin (OM) for TTM',
          value: pct(w.operatingMarginTtm),
          highlight: w.operatingMarginTtm != null && w.operatingMarginTtm >= 0.15 ? 'pass' : 'fail',
        },
        {
          label: 'Net Profit Margin (NPM) for TTM',
          value: pct(w.netMarginTtm),
          highlight: w.netMarginTtm != null && w.netMarginTtm >= 0.07 ? 'pass' : 'fail',
        },
        { label: 'Fiscal Year Ends', value: w.fiscalYearEnds || '—' },
        { label: 'Year Over Year (yoy) Comparisons', value: w.yoyComparisonTtm || '—', extra: w.yoyComparisonYears },
        {
          label: 'GM Past Year',
          value: pct(w.gmPastYear),
        },
        {
          label: 'GM Recent Year',
          value: pct(w.gmRecentYear),
          highlight: w.gmRecentYear != null && w.gmRecentYear >= 0.4 ? 'pass' : 'fail',
        },
        {
          label: 'GM yoy % Change',
          value: formatMarginYoY(w.gmYoyChange),
        },
        { label: 'OM Past Year', value: pct(w.omPastYear) },
        {
          label: 'OM Recent Year',
          value: pct(w.omRecentYear),
          highlight: w.omRecentYear != null && w.omRecentYear >= 0.15 ? 'pass' : 'fail',
        },
        { label: 'OM yoy % Change', value: formatMarginYoY(w.omYoyChange) },
        { label: 'NPM Past Year', value: pct(w.npmPastYear) },
        {
          label: 'NPM Recent Year',
          value: pct(w.npmRecentYear),
          highlight: w.npmRecentYear != null && w.npmRecentYear >= 0.07 ? 'pass' : 'fail',
        },
        { label: 'NPM yoy % change', value: formatMarginYoY(w.npmYoyChange) },
      ],
    },
    {
      section: 'Management Effectiveness',
      rows: [
        {
          label: 'Return on Assets (ROA)',
          value: pct(w.roa),
          highlight: w.roa != null && w.roa >= 0.07 ? 'pass' : 'fail',
        },
        {
          label: 'Return on Equity (ROE)',
          value: pct(w.roe),
          highlight: w.roe != null && w.roe >= 0.15 ? 'pass' : 'fail',
        },
      ],
    },
    {
      section: 'Solvency Ratios',
      rows: [
        {
          label: 'Debt-to-Equity (D/E)',
          value: num(w.debtToEquity),
          highlight: w.debtToEquity != null && w.debtToEquity > 0 && w.debtToEquity < 0.5 ? 'pass' : 'fail',
        },
      ],
    },
    {
      section: 'Valuation Ratios',
      rows: [
        {
          label: 'Earnings Yield',
          value: pct(w.earningsYield),
          highlight: w.earningsYield != null && w.earningsYield >= 0.05 ? 'pass' : 'fail',
        },
        { label: 'Trailing Price Earnings Ratio (P/E)', value: num(w.trailingPe) },
        {
          label: 'Forward Price Earnings Ratio (P/E)',
          value: num(w.forwardPe),
          highlight:
            w.forwardPe != null && w.trailingPe != null
              ? w.forwardPe < w.trailingPe
                ? 'pass'
                : 'fail'
              : 'neutral',
        },
        {
          label: 'Price Earnings Growth Ratio (PEG)',
          value: num(w.peg),
          highlight: w.peg != null && w.peg > 0 && w.peg < 1 ? 'pass' : 'fail',
        },
        {
          label: 'Price to Sales Ratio (P/S)',
          value: num(w.priceToSales),
          highlight: w.priceToSales != null && w.priceToSales > 0 && w.priceToSales < 2 ? 'pass' : 'fail',
        },
        {
          label: 'Price to Book Ratio (P/B)',
          value: num(w.priceToBook),
          highlight: w.priceToBook != null && w.priceToBook > 0 && w.priceToBook < 3 ? 'pass' : 'fail',
        },
      ],
    },
    {
      section: 'Dividends/Income',
      rows: [
        { label: 'Current S&P 500 Yield', value: pct(w.sp500Yield) },
        { label: '10 Year Treasury Rate', value: pct(w.treasury10Y) },
        { label: '5 Year Average Yield', value: pct(w.fiveYearAvgYield) },
        { label: 'Dividend Yield TTM', value: pct(w.dividendYieldTtm) },
        { label: '5 Year Average Dividend Payout Ratio', value: pct(w.fiveYearPayoutRatio) },
        { label: 'Dividend', value: w.dividend != null ? `$${num(w.dividend)}` : '—' },
        { label: 'History of Paying and Raising Dividends', value: yn(w.dividendHistoryRaising) },
        { label: 'Stable Revenue Growth', value: yn(w.stableRevenueGrowth) },
        { label: 'Stable EPS Growth', value: yn(w.stableEpsGrowth) },
        { label: 'Price to FCF', value: num(w.priceToFcf) },
      ],
    },
  ]
}

export function AdvancedWorksheet({ worksheets }: { worksheets: WorksheetValues[] }) {
  if (!worksheets.length) return null
  const allSections = worksheets.map((worksheet) => buildRows(worksheet))
  const sections = allSections[0]
  const colSpan = 1 + worksheets.length

  return (
    <section className="worksheet-panel">
      <table className="worksheet-table">
        <thead>
          <tr>
            <th>Criteria</th>
            {worksheets.map((worksheet) => (
              <th key={worksheet.ticker}>{worksheet.ticker}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.flatMap((section, si) => [
            ...(section.section
              ? [
                  <tr key={`section-${si}`} className="worksheet-section">
                    <td colSpan={colSpan}>{section.section}</td>
                  </tr>,
                ]
              : []),
            ...section.rows.map((row, ri) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {worksheets.map((worksheet, ti) => {
                  const cell = allSections[ti][si]?.rows[ri] ?? { label: row.label, value: '—' }
                  return (
                    <td
                      key={worksheet.ticker}
                      className={['peer-cell', cell.highlight ? `highlight-${cell.highlight}` : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {cell.value}
                      {cell.extra ? <span className="worksheet-notes"> {cell.extra}</span> : null}
                    </td>
                  )
                })}
              </tr>
            )),
          ])}
        </tbody>
      </table>
    </section>
  )
}
