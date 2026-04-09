require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  dbPath: './data/stocks.db',
  cacheTTL: {
    quotes: 30 * 1000,       // 30 seconds
    historical: 5 * 60 * 1000 // 5 minutes
  },
  defaultStocks: [
    { symbol: '2330.TW', name: '台積電', category: '晶圓代工' },
    { symbol: '2317.TW', name: '鴻海', category: 'AI伺服器組裝' },
    { symbol: '2382.TW', name: '廣達', category: 'AI伺服器/筆電ODM' },
    { symbol: '3231.TW', name: '緯創', category: 'AI伺服器ODM' },
    { symbol: '2356.TW', name: '英業達', category: 'AI伺服器ODM' },
    { symbol: '4938.TW', name: '和碩', category: 'AI伺服器組裝' },
    { symbol: '6669.TW', name: '緯穎', category: '雲端伺服器/AI基礎設施' },
    { symbol: '3017.TW', name: '奇鋐', category: '散熱解決方案' },
    { symbol: '2345.TW', name: '智邦', category: '網通設備' },
    { symbol: '2383.TW', name: '台光電', category: 'CCL/銅箔基板' },
    { symbol: '2308.TW', name: '台達電', category: '電源/散熱解決方案' },
    // 能源
    { symbol: '1314.TW', name: '中石化', category: '能源' },
    { symbol: '6505.TW', name: '台塑化', category: '能源' },
    { symbol: '1326.TW', name: '台化', category: '能源' },
    // 航運
    { symbol: '2603.TW', name: '長榮', category: '航運' },
    { symbol: '2615.TW', name: '萬海', category: '航運' },
    { symbol: '2609.TW', name: '陽明', category: '航運' },
    // BBU
    { symbol: '6781.TW', name: 'AES-KY', category: 'BBU' },
    { symbol: '3323.TWO', name: '加百裕', category: 'BBU' },
    { symbol: '4931.TWO', name: '新盛力', category: 'BBU' },
    { symbol: '3211.TWO', name: '順達科', category: 'BBU' },
    // 固態電池
    { symbol: '1101.TW', name: '台泥', category: '固態電池' },
    { symbol: '8215.TW', name: '明基材', category: '固態電池' },
    { symbol: '8038.TWO', name: '長園科', category: '固態電池' },
    { symbol: '6509.TWO', name: '聚和', category: '固態電池' }
  ]
};
