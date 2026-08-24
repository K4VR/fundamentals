import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAnalysis } from './computeWorksheet.js'
import { fetchRawStockData } from './fetchStockData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3001)
const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/analyze/:ticker', async (req, res) => {
  const ticker = String(req.params.ticker ?? '')
    .trim()
    .toUpperCase()
  if (!ticker || !/^[A-Z0-9.\-^=]{1,12}$/.test(ticker)) {
    res.status(400).json({ error: 'Enter a valid ticker symbol.' })
    return
  }

  try {
    const raw = await fetchRawStockData(ticker)
    res.json(buildAnalysis(raw))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze ticker.'
    res.status(502).json({ error: message })
  }
})

const distPath = path.resolve(__dirname, '../dist')
app.use(express.static(distPath))
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fundamentals API listening on 0.0.0.0:${PORT}`)
})
