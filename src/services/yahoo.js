const YahooFinance = require('yahoo-finance2').default;
const cache = require('./cache');
const config = require('../config');

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function getQuote(symbol) {
  const cached = cache.get(`quote:${symbol}`, config.cacheTTL.quotes);
  if (cached) return cached;

  const result = await yahooFinance.quote(symbol);
  if (!result) throw new Error(`No data returned for ${symbol}`);
  const quote = {
    symbol: result.symbol,
    name: result.shortName || result.longName || symbol,
    price: result.regularMarketPrice,
    change: result.regularMarketChange,
    changePercent: result.regularMarketChangePercent,
    volume: result.regularMarketVolume,
    dayHigh: result.regularMarketDayHigh,
    dayLow: result.regularMarketDayLow,
    open: result.regularMarketOpen,
    previousClose: result.regularMarketPreviousClose,
    marketState: result.marketState,
    updatedAt: new Date().toISOString()
  };

  cache.set(`quote:${symbol}`, quote);
  return quote;
}

async function getQuotes(symbols) {
  return Promise.all(symbols.map((s) => getQuote(s)));
}

async function getHistorical(symbol, range = '3mo') {
  const cacheKey = `hist:${symbol}:${range}`;
  const cached = cache.get(cacheKey, config.cacheTTL.historical);
  if (cached) return cached;

  const rangeMap = {
    '1m': { months: 1 },
    '3m': { months: 3 },
    '6m': { months: 6 },
    '1y': { months: 12 },
    '2y': { months: 24 }
  };

  const period = rangeMap[range] || rangeMap['3m'];
  const now = new Date();
  const period1 = new Date(now);
  period1.setMonth(period1.getMonth() - period.months);

  const result = await yahooFinance.historical(symbol, {
    period1: period1.toISOString().split('T')[0],
    period2: now.toISOString().split('T')[0],
    interval: '1d'
  });

  const candles = result.map((r) => ({
    time: r.date.toISOString().split('T')[0],
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume
  }));

  cache.set(cacheKey, candles);
  return candles;
}

async function search(query) {
  // Yahoo Finance search API doesn't support CJK characters
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(query);
  if (hasCJK) {
    return searchLocal(query);
  }

  // If numeric, try as Taiwan stock code directly
  if (/^\d{4,6}$/.test(query.trim())) {
    const symbol = query.trim() + '.TW';
    try {
      const q = await yahooFinance.quote(symbol);
      if (q) {
        return [{
          symbol: q.symbol,
          name: q.shortName || q.longName || symbol,
          type: q.quoteType || 'Equity'
        }];
      }
    } catch (_) { /* fall through to search */ }
  }

  const result = await yahooFinance.search(query);
  return (result.quotes || [])
    .filter((q) => q.exchDisp === 'Taiwan' || q.exchange === 'TAI')
    .map((q) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      type: q.typeDisp
    }));
}

function searchLocal(query) {
  const db = require('../db');
  const stocks = db.prepare('SELECT symbol, name FROM watchlist WHERE name LIKE ?').all(`%${query}%`);
  return stocks.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    type: 'Equity'
  }));
}

module.exports = { getQuote, getQuotes, getHistorical, search };
