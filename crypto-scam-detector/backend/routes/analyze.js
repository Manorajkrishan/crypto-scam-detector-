const express = require('express');
const { analyzeAddress } = require('../controllers/analyzeController');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { address, chain = 'eth' } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    const result = await analyzeAddress(address, chain);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Analysis failed' });
  }
});

router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chain = req.query.chain || 'eth';
    const result = await analyzeAddress(address, chain);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Analysis failed' });
  }
});

module.exports = router;
