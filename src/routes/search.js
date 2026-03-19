const { Router } = require('express');
const yahoo = require('../services/yahoo');

const router = Router();

// GET /api/search?q=鴻海
router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const results = await yahoo.search(query);
    res.json(results);
  } catch (err) {
    console.error('Search failed:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
