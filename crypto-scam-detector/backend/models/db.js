const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false })
  : null;

const SCAM_FILE = path.join(__dirname, '..', 'data', 'scam_addresses.json');

async function initDb() {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) NOT NULL,
        chain VARCHAR(10) DEFAULT 'eth',
        risk_score INTEGER NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        address_type VARCHAR(20),
        issues JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_scan_address ON scan_history (LOWER(address));
    `);
  }
  await loadScamAddressesIntoCache();
}

let scamCache = null;

async function loadScamAddressesIntoCache() {
  if (scamCache) return scamCache;

  const addresses = new Map();

  if (fs.existsSync(SCAM_FILE)) {
    const data = JSON.parse(fs.readFileSync(SCAM_FILE, 'utf8'));
    for (const [addr, meta] of Object.entries(data)) {
      addresses.set(addr.toLowerCase(), meta);
    }
  }

  scamCache = addresses;
  console.log(`Loaded ${addresses.size} scam addresses into cache`);
  return scamCache;
}

function getScamInfo(address) {
  if (!scamCache) return null;
  return scamCache.get(address.toLowerCase()) || null;
}

async function saveScan(record) {
  if (!pool) return null;
  const result = await pool.query(
    `INSERT INTO scan_history (address, chain, risk_score, risk_level, address_type, issues)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
    [record.address, record.chain, record.riskScore, record.riskLevel, record.addressType, JSON.stringify(record.issues)]
  );
  return result.rows[0];
}

module.exports = { pool, initDb, getScamInfo, loadScamAddressesIntoCache, saveScan };
