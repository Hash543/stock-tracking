const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET /api/watchlist
router.get('/', (req, res) => {
  const stocks = db.prepare('SELECT * FROM watchlist ORDER BY sort_order').all();
  res.json(stocks);
});

// POST /api/watchlist
router.post('/', (req, res) => {
  const { symbol, name, category } = req.body;
  if (!symbol || !name) {
    return res.status(400).json({ error: 'symbol and name are required' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM watchlist').get();
  const nextOrder = (maxOrder.max || 0) + 1;

  try {
    db.prepare(
      'INSERT INTO watchlist (symbol, name, category, sort_order) VALUES (?, ?, ?, ?)'
    ).run(symbol, name, category || 'AI下游', nextOrder);
    res.status(201).json({ symbol, name, category: category || 'AI下游' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Stock already in watchlist' });
    }
    throw err;
  }
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', (req, res) => {
  const result = db.prepare('DELETE FROM watchlist WHERE symbol = ?').run(req.params.symbol);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Stock not found' });
  }
  res.json({ deleted: req.params.symbol });
});

module.exports = router;
