const indicators = require('./indicators');

/**
 * 計算個股健康度分數 (0-100)
 * @param {Array} candles - 歷史K線資料
 * @param {Object} quote - 即時報價
 * @returns {{ score: number, level: string, details: Object }}
 */
function calculateHealth(candles, quote) {
  if (!candles || candles.length < 20) {
    return { score: null, level: '資料不足', details: null };
  }

  const computed = indicators.calculateAll(candles);
  const last = candles.length - 1;
  const price = quote.price || candles[last]?.close;

  const maScore = calcMAScore(computed, last, price);
  const rsiScore = calcRSIScore(computed, last);
  const macdScore = calcMACDScore(computed, last);
  const volumeScore = calcVolumeScore(candles, last);
  const momentumScore = calcMomentumScore(candles, last);

  const score = Math.round(
    maScore * 0.30 +
    rsiScore * 0.20 +
    macdScore * 0.20 +
    volumeScore * 0.15 +
    momentumScore * 0.15
  );

  const clamped = Math.max(0, Math.min(100, score));

  return {
    score: clamped,
    level: getLevel(clamped),
    details: {
      ma: Math.round(maScore),
      rsi: Math.round(rsiScore),
      macd: Math.round(macdScore),
      volume: Math.round(volumeScore),
      momentum: Math.round(momentumScore)
    }
  };
}

function calcMAScore(computed, last, price) {
  let score = 50;

  const ma5 = computed.ma5[last];
  const ma10 = computed.ma10[last];
  const ma20 = computed.ma20[last];
  const ma60 = computed.ma60[last];

  // 價格相對均線位置
  if (ma20 != null) {
    if (price > ma20) score += 10;
    else score -= 10;
  }
  if (ma60 != null) {
    if (price > ma60) score += 10;
    else score -= 10;
  }

  // 均線多頭排列: MA5 > MA10 > MA20 > MA60
  if (ma5 != null && ma10 != null && ma20 != null && ma60 != null) {
    if (ma5 > ma10 && ma10 > ma20 && ma20 > ma60) {
      score += 25; // 完美多頭排列
    } else if (ma5 > ma10 && ma10 > ma20) {
      score += 15; // 短中期多頭
    } else if (ma5 < ma10 && ma10 < ma20 && ma20 < ma60) {
      score -= 25; // 完美空頭排列
    } else if (ma5 < ma10 && ma10 < ma20) {
      score -= 15; // 短中期空頭
    }
  }

  return Math.max(0, Math.min(100, score));
}

function calcRSIScore(computed, last) {
  const rsi = computed.rsi[last];
  if (rsi == null) return 50;

  // RSI 50 = 中性(50分), 越高越強但超買時開始扣分
  if (rsi >= 80) return 40;       // 極度超買，風險高
  if (rsi >= 70) return 55;       // 超買區，仍偏強但有壓力
  if (rsi >= 50) return 50 + (rsi - 50) * 1.5; // 50-70 → 50-80分
  if (rsi >= 30) return 20 + (rsi - 30) * 1.5; // 30-50 → 20-50分
  if (rsi >= 20) return 30;       // 超賣區，可能反彈
  return 15;                       // 極度超賣
}

function calcMACDScore(computed, last) {
  let score = 50;

  const histogram = computed.macd.histogram[last];
  const histPrev = computed.macd.histogram[last - 1];
  const macdLine = computed.macd.macd[last];

  if (histogram == null) return 50;

  // 柱狀體方向
  if (histogram > 0) {
    score += 15;
    // 柱狀體放大（動能增強）
    if (histPrev != null && histogram > histPrev) score += 10;
  } else {
    score -= 15;
    // 柱狀體縮小（動能減弱，可能反轉）
    if (histPrev != null && histogram > histPrev) score += 5;
  }

  // 黃金交叉 / 死亡交叉
  if (histPrev != null) {
    if (histPrev <= 0 && histogram > 0) score += 15; // 黃金交叉
    else if (histPrev >= 0 && histogram < 0) score -= 15; // 死亡交叉
  }

  // MACD 線在零軸上方
  if (macdLine != null) {
    if (macdLine > 0) score += 5;
    else score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calcVolumeScore(candles, last) {
  if (last < 20) return 50;

  // 近5日平均量
  const recent5 = candles.slice(last - 4, last + 1);
  const vol5Avg = recent5.reduce((s, c) => s + c.volume, 0) / 5;

  // 20日平均量
  const recent20 = candles.slice(last - 19, last + 1);
  const vol20Avg = recent20.reduce((s, c) => s + c.volume, 0) / 20;

  if (vol20Avg === 0) return 50;

  const volRatio = vol5Avg / vol20Avg;

  // 判斷近5日價格方向
  const priceChange = (candles[last].close - candles[last - 4].close) / candles[last - 4].close;

  let score = 50;

  if (priceChange > 0 && volRatio > 1.2) {
    // 量增價漲 - 健康上漲
    score += 25 * Math.min(volRatio - 1, 1);
  } else if (priceChange > 0 && volRatio < 0.8) {
    // 量縮價漲 - 上漲力道不足
    score -= 5;
  } else if (priceChange < 0 && volRatio > 1.5) {
    // 量增價跌 - 恐慌賣壓
    score -= 25;
  } else if (priceChange < 0 && volRatio < 0.8) {
    // 量縮價跌 - 跌勢趨緩
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calcMomentumScore(candles, last) {
  if (last < 20) return 50;

  // 近5日漲跌幅
  const change5d = (candles[last].close - candles[last - 4].close) / candles[last - 4].close;

  // 近20日波動率 (簡化: 用每日報酬率標準差)
  const returns = [];
  for (let i = last - 19; i <= last; i++) {
    returns.push((candles[i].close - candles[i - 1].close) / candles[i - 1].close);
  }
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const volatility = Math.sqrt(variance);

  let score = 50;

  // 正動能加分
  if (change5d > 0.05) score += 25;
  else if (change5d > 0.02) score += 15;
  else if (change5d > 0) score += 5;
  else if (change5d > -0.02) score -= 5;
  else if (change5d > -0.05) score -= 15;
  else score -= 25;

  // 高波動率略為扣分（不確定性高）
  if (volatility > 0.03) score -= 10;
  else if (volatility > 0.02) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getLevel(score) {
  if (score >= 80) return '強勢';
  if (score >= 60) return '偏多';
  if (score >= 40) return '中性';
  if (score >= 20) return '偏空';
  return '弱勢';
}

module.exports = { calculateHealth };
