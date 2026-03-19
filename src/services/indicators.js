const { SMA, RSI, MACD } = require('technicalindicators');

function calculateAll(candles) {
  const closes = candles.map((c) => c.close);

  const ma5 = SMA.calculate({ period: 5, values: closes });
  const ma10 = SMA.calculate({ period: 10, values: closes });
  const ma20 = SMA.calculate({ period: 20, values: closes });
  const ma60 = SMA.calculate({ period: 60, values: closes });

  const rsi = RSI.calculate({ period: 14, values: closes });

  const macdResult = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });

  // Pad arrays with nulls so they align with candle indices
  const pad = (arr, period) => {
    const padding = new Array(candles.length - arr.length).fill(null);
    return [...padding, ...arr];
  };

  return {
    ma5: pad(ma5, 5),
    ma10: pad(ma10, 10),
    ma20: pad(ma20, 20),
    ma60: pad(ma60, 60),
    rsi: pad(rsi, 14),
    macd: {
      macd: pad(macdResult.map((m) => m.MACD ?? null), 0),
      signal: pad(macdResult.map((m) => m.signal ?? null), 0),
      histogram: pad(macdResult.map((m) => m.histogram ?? null), 0)
    }
  };
}

module.exports = { calculateAll };
