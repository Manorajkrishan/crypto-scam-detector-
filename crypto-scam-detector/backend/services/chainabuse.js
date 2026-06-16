const axios = require('axios');

const BASE = 'https://api.chainabuse.com/v0/reports';

async function checkChainabuse(address, chain = 'ETH') {
  const apiKey = process.env.CHAINABUSE_API_KEY;
  if (!apiKey) {
    return {
      checked: false,
      reported: false,
      message: 'Chainabuse API key not configured — using local scam database only',
      reports: [],
    };
  }

  try {
    const { data } = await axios.get(BASE, {
      params: { address, chain: chain.toUpperCase(), page: 1 },
      auth: { username: apiKey, password: '' },
      timeout: 12000,
    });

    const reports = data?.reports || data?.data || [];
    return {
      checked: true,
      reported: reports.length > 0,
      reportCount: reports.length,
      reports: reports.slice(0, 5).map((r) => ({
        id: r.id,
        category: r.category || r.scamCategory,
        description: r.description?.slice(0, 200),
        confidence: r.confidenceScore,
        createdAt: r.createdAt,
      })),
    };
  } catch (err) {
    return {
      checked: false,
      reported: false,
      error: err.message,
      reports: [],
    };
  }
}

module.exports = { checkChainabuse };
