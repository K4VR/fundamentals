const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export function parsePercent(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/%/g, '').trim()
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'n/a') return null
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n / 100 : null
}

export function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,%$]/g, '').trim()
  if (!cleaned || cleaned === '-') return null
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Finviz "4604.76B" / "300.50M" -> display string preserving unit */
export function formatMarketValue(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim()
}

export function marketCapBillions(raw: string | undefined): number | null {
  if (!raw) return null
  const m = raw.trim().match(/^([\d.,]+)\s*([MB])$/i)
  if (!m) return parseNumber(raw)
  const num = Number.parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  return m[2].toUpperCase() === 'B' ? num : num / 1000
}

export function capLabelFromBillions(b: number | null): import('../src/types.js').CapLabel {
  if (b == null) return ''
  if (b < 0.3) return 'Micro Cap'
  if (b < 2) return 'Small Cap'
  if (b < 10) return 'Mid Cap'
  if (b < 200) return 'Large Cap'
  return 'Mega Cap'
}

export function marginYoY(past: number | null, recent: number | null): import('../src/types.js').MarginYoY {
  if (past == null || recent == null) return ''
  if (Math.min(past, recent) < 0) {
    return recent - past > 0 ? 'Improved' : 'Decreased'
  }
  if (past === 0) return ''
  return recent / past - 1
}

export function revGrowthSimilar(revQoq: number | null, epsQoq: number | null): import('../src/types.js').YesNo {
  if (revQoq == null || epsQoq == null) return ''
  if (revQoq <= 0 || epsQoq <= 0) return 'N/A'
  return epsQoq >= 0.8 * revQoq ? 'Y' : 'N'
}

export function formatPercent(value: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatRatio(value: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

export function formatMarginYoY(value: import('../src/types.js').MarginYoY): string {
  if (value === '') return '—'
  if (value === 'Improved' || value === 'Decreased') return value
  return formatPercent(value)
}

export async function fetchText(url: string): Promise<string> {
  const resp = await fetch(url, { headers: { 'User-Agent': UA } })
  if (resp.status === 429) throw new Error(`Fetch failed (429 Too Many Requests): ${url}`)
  if (!resp.ok) throw new Error(`Fetch failed (${resp.status}): ${url}`)
  return resp.text()
}
