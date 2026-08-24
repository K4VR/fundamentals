import { useState, type FormEvent } from 'react'
import {
  MAX_TICKERS,
  TICKER_FIELD_NAMES,
  TICKER_PLACEHOLDERS,
  defaultTickerInputs,
  readTickerForm,
} from '../lib/tickers.ts'

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
  const [inputs, setInputs] = useState(() => defaultTickerInputs(tickers))

  function setInput(index: number, value: string) {
    setInputs((prev) => prev.map((item, i) => (i === index ? value.toUpperCase() : item)))
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onAnalyze(readTickerForm(e.currentTarget))
  }

  return (
    <form className="ticker-bar" onSubmit={submit}>
      <p className="ticker-bar-legend">Compare up to {MAX_TICKERS} competitors</p>
      <div className="ticker-bar-fields">
        {inputs.map((value, index) => {
          const id = `ticker-input-${index + 1}`
          return (
            <div className="ticker-field" key={id}>
              <label htmlFor={id}>Ticker {index + 1}</label>
              <input
                id={id}
                name={TICKER_FIELD_NAMES[index]}
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
      <button type="submit" disabled={loading} aria-busy={loading}>
        {loading ? 'Fetching…' : tickers.length ? 'Refresh' : 'Compare'}
      </button>
      {progress ? (
        <p className="ticker-progress" aria-live="polite">
          {progress}
        </p>
      ) : null}
    </form>
  )
}
