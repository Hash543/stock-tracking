const Database = require('better-sqlite3');
const path = require('path');
const config = require('../src/config');

const dbPath = path.resolve(config.dbPath);
const db = new Database(dbPath);

db.exec('DELETE FROM watchlist');

const insert = db.prepare(
  'INSERT INTO watchlist (symbol, name, category, sort_order) VALUES (?, ?, ?, ?)'
);

const seedMany = db.transaction((stocks) => {
  stocks.forEach((s, i) => insert.run(s.symbol, s.name, s.category, i));
});

seedMany(config.defaultStocks);
console.log(`Reset watchlist with ${config.defaultStocks.length} default stocks`);
db.close();
