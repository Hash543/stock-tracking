# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

台股 AI 下游產業追蹤系統 — 個人投資參考工具。追蹤鴻海、廣達、緯創等 AI 伺服器供應鏈股票的即時報價、技術指標與每日摘要。

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with nodemon (hot reload)
npm start            # Start production server
npm run seed         # Reset watchlist to default AI downstream stocks
```

Server runs at `http://localhost:3000` (configurable via `.env` PORT).

## Architecture

Node.js + Express backend serving a vanilla HTML/CSS/JS frontend (no framework, no bundler).

**Backend** (`src/`):
- `server.js` — Express entry point, mounts all routes, serves static files from `public/`
- `config.js` — Port, DB path, cache TTL, default watchlist stocks
- `db.js` — better-sqlite3 initialization, auto-creates tables and seeds defaults on first run
- `services/yahoo.js` — yahoo-finance2 v3 wrapper (quote, historical, search). Requires `new YahooFinance()` constructor (not `.default` directly)
- `services/indicators.js` — Technical indicator calculations via `technicalindicators` (SMA 5/10/20/60, RSI 14, MACD 12/26/9). Returns null-padded arrays aligned to candle indices
- `services/cache.js` — In-memory Map cache with TTL (quotes 30s, historical 5min)
- `routes/` — REST API: watchlist CRUD, quotes, historical+indicators, summary with signals, search

**Frontend** (`public/`):
- Single-page app with hash-based tab navigation (watchlist / chart / summary)
- `js/api.js` — Fetch wrapper
- `js/watchlist.js` — Quote table with 30s auto-refresh, stock search+add
- `js/chart.js` — TradingView lightweight-charts v4 (candlestick + MA overlays + RSI/MACD sub-charts)
- `js/summary.js` — Daily summary cards with signal detection (MA cross, RSI overbought/oversold, MACD cross)

**Data**: SQLite (`data/stocks.db`) stores only the watchlist. All market data is fetched on-demand from Yahoo Finance and cached in memory.

## API Endpoints

```
GET    /api/watchlist              # Watchlist CRUD
POST   /api/watchlist              # { symbol: "2317.TW", name: "鴻海" }
DELETE /api/watchlist/:symbol

GET    /api/quotes                 # All watchlist quotes
GET    /api/quotes/:symbol         # Single quote

GET    /api/historical/:symbol     # OHLCV + indicators (?range=1m|3m|6m|1y|2y)

GET    /api/summary                # Daily summary with signals
GET    /api/search?q=鴻海          # Yahoo Finance search (filtered to Taiwan)
```

## Key Conventions

- Taiwan stock symbols use `.TW` suffix (e.g., `2317.TW` for 鴻海)
- Color convention: red = up (漲), green = down (跌) — opposite of US markets
- Yahoo Finance provides ~20 minute delayed quotes for TWSE
- Express 5.x is used (installed version), which handles async route errors natively
