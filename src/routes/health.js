const { Router } = require('express');
const db = require('../db');
const yahoo = require('../services/yahoo');
const { calculateHealth } = require('../services/health');

const router = Router();

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const stocks = db.prepare('SELECT * FROM watchlist ORDER BY sort_order').all();
    const symbols = stocks.map((s) => s.symbol);

    const [quotes, ...historicals] = await Promise.all([
      yahoo.getQuotes(symbols),
      ...symbols.map((s) => yahoo.getHistorical(s, '6m'))
    ]);

    const results = stocks.map((stock, i) => {
      const quote = quotes[i] || {};
      const candles = historicals[i] || [];
      const health = calculateHealth(candles, quote);

      return {
        symbol: stock.symbol,
        name: stock.name,
        score: health.score,
        level: health.level,
        details: health.details
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Failed to calculate health:', err.message);
    res.status(500).json({ error: 'Failed to calculate health scores' });
  }
});

module.exports = router;
