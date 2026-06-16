const { spawn } = require('child_process');
const path = require('path');

const PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'ml-model', 'predict.py');

function buildFeatureVector(profile) {
  const txCount = profile.transactionCount || 0;
  const inCount = profile.incomingCount || 0;
  const outCount = profile.outgoingCount || 0;
  const ageMins = profile.ageDays ? profile.ageDays * 24 * 60 : 0;

  return {
    'Avg min between sent tnx': outCount > 1 ? ageMins / outCount : 0,
    'Avg min between received tnx': inCount > 1 ? ageMins / inCount : 0,
    'Time Diff between first and last (Mins)': ageMins,
    'Sent tnx': outCount,
    'Received Tnx': inCount,
    'Number of Created Contracts': profile.isContract ? 1 : 0,
    'Unique Received From Addresses': Math.min(inCount, 50),
    'Unique Sent To Addresses': Math.min(outCount, 50),
    'min value received': 0,
    'max value received ': profile.maxTransferEth || 0,
    'avg val received': profile.balanceEth || 0,
    'min val sent': 0,
    'max val sent': profile.maxTransferEth || 0,
    'avg val sent': txCount ? (profile.maxTransferEth || 0) / 2 : 0,
    'total transactions (including tnx to create contract': txCount,
    'total Ether sent': profile.maxTransferEth * outCount * 0.1 || 0,
    'total ether received': profile.balanceEth || 0,
    'total ether balance': profile.balanceEth || 0,
    ' Total ERC20 tnxs': profile.tokenTransferCount || 0,
    ' ERC20 total Ether received': 0,
    ' ERC20 total ether sent': 0,
    ' ERC20 uniq sent addr': Math.min(outCount, 20),
    ' ERC20 uniq rec addr': Math.min(inCount, 20),
  };
}

function runMlPrediction(features) {
  return new Promise((resolve) => {
    const python = process.env.PYTHON_PATH || 'python';
    const proc = spawn(python, [PREDICT_SCRIPT, JSON.stringify(features)], {
      cwd: path.join(__dirname, '..', '..', 'ml-model'),
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve({ fraud_probability: 0, error: stderr || 'ML prediction failed' });
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        resolve({ fraud_probability: 0, error: 'Invalid ML output' });
      }
    });
  });
}

module.exports = { buildFeatureVector, runMlPrediction };
