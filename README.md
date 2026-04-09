# 台股 AI 下游產業追蹤系統

個人投資參考工具，追蹤鴻海、廣達、緯創等 AI 伺服器供應鏈及其他台股的即時報價、技術指標與每日摘要。

## 功能

- **自選股清單** — 即時報價表，30 秒自動更新，支援搜尋新增 / 刪除
- **K 線圖表** — TradingView lightweight-charts 繪製 K 線，疊加 MA (5/10/20/60) 均線、RSI、MACD 副圖
- **每日摘要** — 訊號偵測：均線交叉、RSI 超買超賣、MACD 交叉

## 預設追蹤標的

| 類別 | 股票 |
|------|------|
| AI 伺服器 | 鴻海 (2317)、廣達 (2382)、緯創 (3231)、英業達 (2356)、和碩 (4938)、緯穎 (6669) |
| 散熱 / 網通 | 奇鋐 (3017)、智邦 (2345) |
| 能源 | 中石化 (1314)、台塑化 (6505)、台化 (1326) |
| 航運 | 長榮 (2603)、萬海 (2615)、陽明 (2609) |

## 技術架構

- **後端**: Node.js + Express 5 — REST API、SQLite 自選股儲存、Yahoo Finance 即時資料
- **前端**: 原生 HTML / CSS / JS — 無框架、無打包工具
- **資料**: 自選股存於 SQLite (`data/stocks.db`)，行情透過 Yahoo Finance API 即時取得並快取於記憶體中

## 快速開始

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器 (hot reload)
npm run dev

# 或啟動正式伺服器
npm start
```

瀏覽器開啟 `http://localhost:3000` 即可使用。

### 環境變數

建立 `.env` 檔案（可選）：

```env
PORT=3000
```

### 其他指令

```bash
npm run seed    # 重設自選股為預設 AI 下游產業清單
```

## API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/watchlist` | 取得自選股清單 |
| POST | `/api/watchlist` | 新增自選股 `{ symbol, name }` |
| DELETE | `/api/watchlist/:symbol` | 刪除自選股 |
| GET | `/api/quotes` | 全部自選股報價 |
| GET | `/api/quotes/:symbol` | 單一股票報價 |
| GET | `/api/historical/:symbol` | K 線 + 技術指標 (`?range=1m\|3m\|6m\|1y\|2y`) |
| GET | `/api/summary` | 每日摘要與訊號 |
| GET | `/api/search?q=關鍵字` | 搜尋台股 |

## 注意事項

- 台股代號使用 `.TW` 後綴（例如 `2317.TW`）
- Yahoo Finance 報價延遲約 20 分鐘
- 顏色慣例：紅色 = 漲、綠色 = 跌（台股慣例）
- 本工具僅供個人投資參考，不構成任何投資建議

## 授權

MIT
