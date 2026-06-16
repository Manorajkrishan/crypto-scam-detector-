const express = require('express');
const { analyzeAddress } = require('../controllers/analyzeController');
const { generateReportPdf } = require('../services/pdfGenerator');

const router = express.Router();

router.post('/pdf', async (req, res) => {
  try {
    const { address, chain = 'eth' } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const analysis = await analyzeAddress(address, chain);
    const pdf = await generateReportPdf(analysis);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="risk-report-${address.slice(0, 10)}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'PDF generation failed' });
  }
});

module.exports = router;
