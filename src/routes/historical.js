const { Router } = require('express');
const yahoo = require('../services/yahoo');
const indicators = require('../services/indicators');

const router = Router();

// GET /api/historical/:symbol?range=3m
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = req.query.range || '3m';

    const candles = await yahoo.getHistorical(symbol, range);

    if (candles.length === 0) {
      return res.json({ symbol, candles: [], indicators: {} });
    }

    const computed = indicators.calculateAll(candles);

    res.json({
      symbol,
      candles,
      indicators: computed
    });
  } catch (err) {
    console.error(`Failed to fetch historical for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router;
