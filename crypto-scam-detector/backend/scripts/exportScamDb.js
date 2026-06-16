/** Export rug pull addresses from CSV to JSON scam database. */
const fs = require('fs');
const path = require('path');

const rugCsv = path.join(__dirname, '..', '..', 'ml-model', 'dataset', 'rug_pull', 'rugpull_dataset.csv');
const outFile = path.join(__dirname, '..', 'data', 'scam_addresses.json');

if (!fs.existsSync(rugCsv)) {
  console.error('Rug pull CSV not found. Clone dataset first — see README.');
  process.exit(1);
}

const content = fs.readFileSync(rugCsv, 'utf8');
const lines = content.split('\n').slice(1);
const addresses = {};

for (const line of lines) {
  if (!line.trim()) continue;
  const match = line.match(/,(ETH|BSC),"(0x[a-fA-F0-9]{40})"/) || line.match(/,(ETH|BSC),(0x[a-fA-F0-9]{40}),/);
  if (match) {
    addresses[match[2].toLowerCase()] = {
      source: 'rug_pull_dataset',
      chain: match[1].toLowerCase(),
      type: 'rug_pull',
      description: 'Documented rug pull incident (2020-2023)',
    };
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(addresses, null, 0));
console.log(`Exported ${Object.keys(addresses).length} addresses to ${outFile}`);
