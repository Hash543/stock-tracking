const { Router } = require('express');
const db = require('../db');
const yahoo = require('../services/yahoo');

const router = Router();

// GET /api/quotes — all watchlist stocks
router.get('/', async (req, res) => {
  try {
    const stocks = db.prepare('SELECT symbol FROM watchlist ORDER BY sort_order').all();
    const symbols = stocks.map((s) => s.symbol);
    const quotes = await yahoo.getQuotes(symbols);
    res.json(quotes);
  } catch (err) {
    console.error('Failed to fetch quotes:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /api/quotes/:symbol — single stock
router.get('/:symbol', async (req, res) => {
  try {
    const quote = await yahoo.getQuote(req.params.symbol);
    res.json(quote);
  } catch (err) {
    console.error(`Failed to fetch quote for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

module.exports = router;
