import { useState, type FormEvent } from 'react'
import { TICKER_PLACEHOLDERS, padTickerInputs } from '../lib/tickers.ts'

export function TickerBar({
  tickers,
  loading,
  progress,
  onAnalyze,
}: {
  tickers: string[]
  loading: boolean
  progress?: string | null
  onAnalyze: (symbols: string[]) => void
}) {
  const [inputs, setInputs] = useState(() => padTickerInputs(tickers))

  function setInput(index: number, value: string) {
    setInputs((prev) => prev.map((item, i) => (i === index ? value.toUpperCase() : item)))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    onAnalyze(inputs)
  }

  const filled = inputs.some((value) => value.trim())

  return (
    <form className="ticker-bar" onSubmit={submit}>
      <p className="ticker-bar-legend">Stock tickers (up to 4)</p>
      <div className="ticker-bar-fields">
        {inputs.map((value, index) => {
          const id = `ticker-input-${index + 1}`
          return (
            <div className="ticker-field" key={id}>
              <label htmlFor={id}>{index === 0 ? 'Ticker 1' : `Peer ${index}`}</label>
              <input
                id={id}
                name={`ticker-${index + 1}`}
                value={value}
                onChange={(e) => setInput(index, e.target.value)}
                placeholder={TICKER_PLACEHOLDERS[index]}
                autoComplete="off"
                spellCheck={false}
                maxLength={12}
              />
            </div>
          )
        })}
      </div>
      <button type="submit" disabled={loading || !filled}>
        {loading ? 'Fetching…' : tickers.length ? 'Refresh' : 'Compare'}
      </button>
      {progress ? <p className="ticker-progress">{progress}</p> : null}
    </form>
  )
}
