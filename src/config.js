require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  dbPath: './data/stocks.db',
  cacheTTL: {
    quotes: 30 * 1000,       // 30 seconds
    historical: 5 * 60 * 1000 // 5 minutes
  },
  defaultStocks: [
    { symbol: '2317.TW', name: '鴻海', category: 'AI伺服器組裝' },
    { symbol: '2382.TW', name: '廣達', category: 'AI伺服器/筆電ODM' },
    { symbol: '3231.TW', name: '緯創', category: 'AI伺服器ODM' },
    { symbol: '2356.TW', name: '英業達', category: 'AI伺服器ODM' },
    { symbol: '4938.TW', name: '和碩', category: 'AI伺服器組裝' },
    { symbol: '6669.TW', name: '緯穎', category: '雲端伺服器/AI基礎設施' },
    { symbol: '3017.TW', name: '奇鋐', category: '散熱解決方案' },
    { symbol: '2345.TW', name: '智邦', category: '網通設備' }
  ]
};
