const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Initialize database (creates tables + seeds on first run)
require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/historical', require('./routes/historical'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/health', require('./routes/health'));
app.use('/api/search', require('./routes/search'));

app.listen(config.port, () => {
  console.log(`Stock tracker running at http://localhost:${config.port}`);
});
