const { Router } = require('express');
const db = require('../db');
const yahoo = require('../services/yahoo');
const indicators = require('../services/indicators');

const router = Router();

// GET /api/summary
router.get('/', async (req, res) => {
  try {
    const stocks = db.prepare('SELECT * FROM watchlist ORDER BY sort_order').all();
    const symbols = stocks.map((s) => s.symbol);

    const [quotes, ...historicals] = await Promise.all([
      yahoo.getQuotes(symbols),
      ...symbols.map((s) => yahoo.getHistorical(s, '3m'))
    ]);

    const summary = stocks.map((stock, i) => {
      const quote = quotes[i] || {};
      const candles = historicals[i] || [];
      const signals = [];

      if (candles.length >= 20) {
        const computed = indicators.calculateAll(candles);
        const last = candles.length - 1;
        const price = quote.price || candles[last]?.close;

        // MA signals
        if (computed.ma20[last] != null) {
          if (price > computed.ma20[last]) signals.push('站上20MA');
          else signals.push('跌破20MA');
        }
        if (computed.ma60[last] != null) {
          if (price > computed.ma60[last]) signals.push('站上60MA');
          else signals.push('跌破60MA');
        }

        // RSI signals
        const rsiVal = computed.rsi[last];
        if (rsiVal != null) {
          if (rsiVal > 70) signals.push(`RSI超買(${rsiVal.toFixed(1)})`);
          else if (rsiVal < 30) signals.push(`RSI超賣(${rsiVal.toFixed(1)})`);
        }

        // MACD cross signals
        const macdNow = computed.macd.histogram[last];
        const macdPrev = computed.macd.histogram[last - 1];
        if (macdNow != null && macdPrev != null) {
          if (macdPrev <= 0 && macdNow > 0) signals.push('MACD黃金交叉');
          else if (macdPrev >= 0 && macdNow < 0) signals.push('MACD死亡交叉');
        }
      }

      return {
        symbol: stock.symbol,
        name: stock.name,
        category: stock.category,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        signals
      };
    });

    res.json(summary);
  } catch (err) {
    console.error('Failed to generate summary:', err.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

module.exports = router;
