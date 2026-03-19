const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');

const dbPath = path.resolve(config.dbPath);
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    symbol     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    category   TEXT DEFAULT 'AI下游',
    sort_order INTEGER DEFAULT 0,
    added_at   TEXT DEFAULT (datetime('now'))
  )
`);

// Seed default stocks if watchlist is empty
const count = db.prepare('SELECT COUNT(*) as cnt FROM watchlist').get();
if (count.cnt === 0) {
  const insert = db.prepare(
    'INSERT INTO watchlist (symbol, name, category, sort_order) VALUES (?, ?, ?, ?)'
  );
  const seedMany = db.transaction((stocks) => {
    stocks.forEach((s, i) => insert.run(s.symbol, s.name, s.category, i));
  });
  seedMany(config.defaultStocks);
  console.log(`Seeded ${config.defaultStocks.length} default stocks`);
}

module.exports = db;
