# Fundamentals

Advanced Peer-to-Peer fundamental stock analysis. Enter up to four tickers to compare competitors as columns — the same criteria as the Payne's Education Advanced P2P spreadsheet.

## No npm on your computer

You do **not** need Node.js or npm installed locally. The app is built and run in the cloud.

### Recommended: Render (full app — UI + live data)

1. Sign in at [render.com](https://render.com).
2. **New → Blueprint** and connect **this** GitHub repo (`fundamentals`).
3. Render reads `render.yaml`, builds in the cloud, and gives you a URL like `https://fundamentals-xxxx.onrender.com`.
4. Bookmark that URL — enter up to four tickers and compare. Nothing is stored.

Render’s free tier may sleep after inactivity; the first request after sleep can take ~30 seconds.

### GitHub Pages (UI only, unless API URL is configured)

**https://k4vr.github.io/fundamentals/**

GitHub Actions builds the UI automatically. GitHub Pages cannot run the Node scraper, so a ticker lookup would otherwise get an HTML 404 and fail with `Unexpected token '<'`.

Live fetches need the Render backend from above, then either:

- Paste the Render origin into **API base URL** on the Pages site (saved in this browser), or open `https://k4vr.github.io/fundamentals/?api=https://YOUR-SERVICE.onrender.com`
- Or in this repo **Settings → Secrets and variables → Actions → Variables**, set `FUNDAMENTALS_API_URL` to your Render URL (no trailing slash) and re-run the Pages deploy workflow.

## What it does

- **Advanced P2P** — full criteria worksheet (price, margins, growth, valuation, dividends, etc.)
- **Scored P2P** — segment scores and grand total (out of 20)
- **Up to four tickers** — each symbol is a column so you can compare competitors; nothing is stored

## Data sources

| Source | Used for |
|--------|----------|
| [Yahoo Finance Analysis](https://finance.yahoo.com) | Earnings history (surprises), EPS trend / revisions, annual financials |
| [Finviz Statistics](https://finviz.com) | Price, market cap, margins, valuation ratios, quarterly growth |
| Macro | S&P 500 yield (via SPY), 10-year Treasury (^TNX) |

## Optional: developers with Node installed

```bash
npm install
npm run dev    # UI at :5173, API at :3001
npm run build && npm start   # single port :3001
```

## Disclaimer

Content is for educational and informational purposes only and is not investment advice. Investing involves risk, including risk of loss.
