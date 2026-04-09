const { Router } = require('express');
const db = require('../db');
const yahoo = require('../services/yahoo');

const router = Router();

// GET /api/quotes — all watchlist stocks
router.get('/', async (req, res) => {
  try {
    const stocks = db.prepare('SELECT symbol, name, category FROM watchlist ORDER BY sort_order').all();
    const symbols = stocks.map((s) => s.symbol);
    const stockMap = Object.fromEntries(stocks.map((s) => [s.symbol, s]));
    const quotes = await yahoo.getQuotes(symbols);
    res.json(quotes.map((q) => {
      const s = stockMap[q.symbol];
      return { ...q, name: s?.name || q.name, category: s?.category || '' };
    }));
  } catch (err) {
    console.error('Failed to fetch quotes:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /api/quotes/:symbol — single stock
router.get('/:symbol', async (req, res) => {
  try {
    const stock = db.prepare('SELECT name FROM watchlist WHERE symbol = ?').get(req.params.symbol);
    const quote = await yahoo.getQuote(req.params.symbol);
    if (stock) quote.name = stock.name;
    res.json(quote);
  } catch (err) {
    console.error(`Failed to fetch quote for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

module.exports = router;
