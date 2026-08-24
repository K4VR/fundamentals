import { useCallback, useState } from 'react'
import type { AnalysisResult } from './types.ts'
import { AdvancedWorksheet } from './components/AdvancedWorksheet.tsx'
import { ScoredWorksheet } from './components/ScoredWorksheet.tsx'
import { TickerBar } from './components/TickerBar.tsx'
import {
  analyzeTicker,
  bakedApiUrl,
  getRuntimeApiUrl,
  pingApi,
  setRuntimeApiUrl,
  StaticHostError,
} from './lib/api.ts'
import { parseTickerInputs } from './lib/tickers.ts'

type Tab = 'advanced' | 'scored'

export default function App() {
  const [tab, setTab] = useState<Tab>('advanced')
  const [tickers, setTickers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [apiInput, setApiInput] = useState(() => getRuntimeApiUrl())
  const [apiStatus, setApiStatus] = useState<string | null>(null)
  const [showApiForm, setShowApiForm] = useState(
    () => typeof window !== 'undefined' && window.location.hostname.includes('github.io') && !bakedApiUrl(),
  )

  const analyze = useCallback(async (symbols: string[]) => {
    let list: string[]
    try {
      list = parseTickerInputs(symbols)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enter a valid ticker symbol.')
      return
    }
    if (!list.length) return

    setTickers(list)
    setLoading(true)
    setError(null)
    setResults([])
    const next: AnalysisResult[] = []
    const failures: string[] = []

    try {
      for (let i = 0; i < list.length; i++) {
        const symbol = list[i]
        setProgress(`Fetching ${symbol}… ${i + 1} of ${list.length}`)
        try {
          const data = await analyzeTicker(symbol)
          next.push(data)
          setResults([...next])
        } catch (err) {
          if (err instanceof StaticHostError) {
            setShowApiForm(true)
            setError(err.message)
            setResults([])
            return
          }
          const message = err instanceof Error ? err.message : 'Analysis failed.'
          if (message.includes('web page instead of JSON') || message.includes('non-JSON')) {
            setShowApiForm(true)
          }
          failures.push(`${symbol}: ${message}`)
        }
      }

      if (failures.length) {
        setError(
          next.length
            ? `Loaded ${next.map((r) => r.worksheet.ticker).join(', ')}. Could not load ${failures.join(' · ')}`
            : failures.join(' · '),
        )
      }
    } finally {
      setProgress(null)
      setLoading(false)
    }
  }, [])

  async function saveApiUrl() {
    const cleaned = setRuntimeApiUrl(apiInput)
    setApiInput(cleaned)
    if (!cleaned) {
      setApiStatus('Paste the https origin of your Render service.')
      return
    }
    setApiStatus('Checking API…')
    try {
      await pingApi(cleaned)
      setApiStatus(`Saved. Live fetches will use ${cleaned}`)
      setError(null)
      if (tickers.length) void analyze(tickers)
    } catch (err) {
      setApiStatus(err instanceof Error ? err.message : 'Could not reach that API URL.')
    }
  }

  return (
    <div className="fundamentals">
      <header className="fundamentals-top">
        <div className="fundamentals-top-inner">
          <div className="fundamentals-brand">
            <strong>Fundamentals</strong>
            <span>Advanced Peer-to-Peer</span>
          </div>
          <nav className="fundamentals-tabs" aria-label="Worksheet views">
            <button type="button" className={tab === 'advanced' ? 'active' : ''} onClick={() => setTab('advanced')}>
              Advanced P2P
            </button>
            <button type="button" className={tab === 'scored' ? 'active' : ''} onClick={() => setTab('scored')}>
              Scored P2P
            </button>
          </nav>
        </div>
      </header>

      <main className="fundamentals-main">
        <TickerBar tickers={tickers} loading={loading} progress={progress} onAnalyze={analyze} />

        {error ? <p className="fundamentals-error">{error}</p> : null}

        {!results.length && !loading ? (
          <section className="fundamentals-empty">
            <h1>Fundamental stock evaluation</h1>
            <p>
              Enter up to four tickers to compare competitors side by side on the Advanced Peer-to-Peer worksheet.
              Data is pulled from Yahoo Finance and Finviz, matching the spreadsheet workflow.
            </p>
            <p className="fundamentals-note">
              <strong>No npm required on your computer.</strong> Use the full hosted app (UI + data) after a
              one-time cloud deploy, or open this page from a host that includes the API.
            </p>
            <ul className="fundamentals-help-list">
              <li>
                <strong>Recommended:</strong> Deploy once on{' '}
                <a href="https://render.com/docs/infrastructure-as-code" target="_blank" rel="noreferrer">
                  Render
                </a>{' '}
                using this repo&apos;s <code>render.yaml</code> (Render installs Node and builds in the cloud).
              </li>
              <li>
                <strong>GitHub Pages</strong> hosts this UI at{' '}
                <a href="https://k4vr.github.io/fundamentals/">https://k4vr.github.io/fundamentals/</a>. Pages
                cannot scrape Yahoo/Finviz by itself — point it at your Render URL below, or set repo variable{' '}
                <code>FUNDAMENTALS_API_URL</code> and rebuild.
              </li>
            </ul>
            {showApiForm ? (
              <form
                className="api-source"
                onSubmit={(e) => {
                  e.preventDefault()
                  void saveApiUrl()
                }}
              >
                <label htmlFor="api-url-input">API base URL (Render)</label>
                <div className="api-source-row">
                  <input
                    id="api-url-input"
                    type="url"
                    value={apiInput}
                    onChange={(e) => setApiInput(e.target.value)}
                    placeholder="https://fundamentals-xxxx.onrender.com"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button type="submit">Save API URL</button>
                </div>
                {apiStatus ? <p className="api-source-status">{apiStatus}</p> : null}
              </form>
            ) : null}
          </section>
        ) : null}

        {results.length ? (
          <>
            <div className="fundamentals-meta peers">
              {results.map((result) => (
                <div key={result.worksheet.ticker} className="peer-card">
                  <h2>{result.worksheet.ticker}</h2>
                  {result.worksheet.companyName ? <p>{result.worksheet.companyName}</p> : null}
                  <div className="fundamentals-meta-links">
                    <a href={result.worksheet.sources.yahooAnalysis} target="_blank" rel="noreferrer">
                      Yahoo
                    </a>
                    <a href={result.worksheet.sources.finvizStatistics} target="_blank" rel="noreferrer">
                      Finviz
                    </a>
                    <a href={result.worksheet.sources.marketWatch} target="_blank" rel="noreferrer">
                      MarketWatch
                    </a>
                  </div>
                </div>
              ))}
              <p className="fundamentals-fetched">
                Fetched {new Date(results[results.length - 1].worksheet.fetchedAt).toLocaleString()}
              </p>
            </div>

            {tab === 'advanced' ? (
              <AdvancedWorksheet worksheets={results.map((result) => result.worksheet)} />
            ) : (
              <ScoredWorksheet analyses={results} />
            )}
          </>
        ) : null}
      </main>

      <footer className="fundamentals-footer">
        <p>
          Content presented here is for educational and informational purposes only and is not investment advice.
          Investing involves risk, including risk of loss.
        </p>
        <p className="fundamentals-footer-copy">© 2026 Payne&apos;s Education worksheet layout · Last updated 08/18/2026</p>
      </footer>
    </div>
  )
}
