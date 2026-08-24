import type { AnalysisResult } from '../types.ts'

const STORAGE_KEY = 'fundamentals.apiUrl'

export class StaticHostError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StaticHostError'
  }
}

export function bakedApiUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
}

export function sanitizeApiUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    let path = url.pathname.replace(/\/$/, '')
    if (path === '/api') path = ''
    return `${url.origin}${path}`
  } catch {
    return ''
  }
}

export function getRuntimeApiUrl(): string {
  const baked = bakedApiUrl()
  if (baked) return baked
  if (typeof window === 'undefined') return ''
  const fromQuery = new URLSearchParams(window.location.search).get('api')
  if (fromQuery) {
    const cleaned = sanitizeApiUrl(fromQuery)
    if (cleaned) {
      window.localStorage.setItem(STORAGE_KEY, cleaned)
      return cleaned
    }
  }
  return sanitizeApiUrl(window.localStorage.getItem(STORAGE_KEY) ?? '')
}

export function setRuntimeApiUrl(raw: string): string {
  const cleaned = sanitizeApiUrl(raw)
  if (typeof window === 'undefined') return cleaned
  if (cleaned) window.localStorage.setItem(STORAGE_KEY, cleaned)
  else window.localStorage.removeItem(STORAGE_KEY)
  return cleaned
}

export function apiUrl(path: string): string {
  const base = getRuntimeApiUrl()
  return `${base}${path}`
}

export function isLikelyStaticHost(): boolean {
  if (bakedApiUrl() || getRuntimeApiUrl()) return false
  return window.location.hostname.includes('github.io')
}

function looksLikeHtml(text: string): boolean {
  const start = text.trimStart().slice(0, 32).toLowerCase()
  return start.startsWith('<!doctype') || start.startsWith('<html') || start.startsWith('<')
}

async function readApiJson(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text()
  if (looksLikeHtml(text)) {
    if (isLikelyStaticHost() || window.location.hostname.includes('github.io')) {
      throw new StaticHostError(staticHostMessage())
    }
    throw new Error(
      'That API URL returned a web page instead of JSON. Use your Render origin (https://….onrender.com) with no trailing slash.',
    )
  }
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    if (isLikelyStaticHost() || window.location.hostname.includes('github.io')) {
      throw new StaticHostError(staticHostMessage())
    }
    throw new Error('The API returned a non-JSON response.')
  }
}

export function staticHostMessage(): string {
  return 'Live ticker data is not available on GitHub Pages until this UI can reach the Fundamentals API. Deploy the repo on Render, then paste that URL below (or set FUNDAMENTALS_API_URL and rebuild Pages).'
}

export async function pingApi(base: string): Promise<void> {
  const resp = await fetch(`${base}/api/health`)
  const data = await readApiJson(resp)
  if (!resp.ok || data.ok !== true) {
    throw new Error('API health check failed. Confirm the Render service is running.')
  }
}

export async function analyzeTicker(ticker: string): Promise<AnalysisResult> {
  if (isLikelyStaticHost()) {
    throw new StaticHostError(staticHostMessage())
  }

  try {
    const resp = await fetch(apiUrl(`/api/analyze/${encodeURIComponent(ticker)}`))
    const data = await readApiJson(resp)
    if (!resp.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Analysis failed.')
    }
    return data as unknown as AnalysisResult
  } catch (err) {
    if (err instanceof StaticHostError) throw err
    if (err instanceof TypeError) {
      throw new Error(
        'Could not reach the Fundamentals API. On GitHub Pages, paste your Render URL below; locally run npm run dev so the UI proxies /api.',
      )
    }
    throw err
  }
}
