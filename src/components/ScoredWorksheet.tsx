import { formatPercent, formatRatio, formatValue } from '../lib/format.ts'
import type { AnalysisResult, ScoredRow } from '../types.ts'

function formatScoredValue(row: ScoredRow): string {
  if (typeof row.value === 'number') {
    return row.label.toLowerCase().includes('growth') || row.label.includes('Yield') || row.label.includes('RO')
      ? formatPercent(row.value)
      : formatRatio(row.value)
  }
  return formatValue(row.value)
}

export function ScoredWorksheet({ analyses }: { analyses: AnalysisResult[] }) {
  if (!analyses.length) return null
  const template = analyses[0].scored
  const colSpan = 1 + analyses.length

  return (
    <section className="worksheet-panel">
      <div className="scored-summary">
        {analyses.map((analysis) => (
          <div key={analysis.worksheet.ticker}>
            <span className="scored-label">{analysis.worksheet.ticker}</span>
            <strong>{analysis.grandTotal ?? '—'}</strong>
            <span className="scored-muted">/ {analysis.totalPossible}</span>
            <span className="scored-rating">
              {analysis.performanceRating != null ? formatPercent(analysis.performanceRating, 0) : '—'}
            </span>
          </div>
        ))}
      </div>

      <table className="worksheet-table scored-table">
        <thead>
          <tr>
            <th>Criteria</th>
            {analyses.map((analysis) => (
              <th key={analysis.worksheet.ticker}>{analysis.worksheet.ticker}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {template.map((row) => {
            if (row.isSectionHeader) {
              return (
                <tr key={row.id} className="worksheet-section">
                  <td colSpan={colSpan}>{row.label}</td>
                </tr>
              )
            }

            return (
              <tr
                key={row.id}
                className={[row.isSegmentScore ? 'segment-score' : '', row.isGrandTotal ? 'grand-total' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <td>{row.label}</td>
                {analyses.map((analysis) => {
                  const cell = analysis.scored.find((item) => item.id === row.id) ?? row
                  const value = formatScoredValue(cell)
                  return (
                    <td
                      key={analysis.worksheet.ticker}
                      className={['peer-cell', cell.highlight ? `highlight-${cell.highlight}` : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {row.isSegmentScore || row.isGrandTotal ? (
                        cell.score ?? '—'
                      ) : (
                        <>
                          {value}
                          {cell.scoreDetail ? <span className="score-detail"> {cell.scoreDetail}</span> : null}
                          {cell.score != null ? <span className="cell-score"> {cell.score}</span> : null}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
