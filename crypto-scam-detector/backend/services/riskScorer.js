function getRiskLevel(score) {
  if (score <= 30) return 'Low Risk';
  if (score <= 70) return 'Medium Risk';
  return 'High Risk';
}

function calculateRiskScore({ profile, scamInfo, chainabuse, contractAnalysis, mlResult }) {
  const issues = [];
  let score = 0;

  // Scam database hit (highest weight)
  if (scamInfo) {
    score += 50;
    issues.push({
      severity: 'critical',
      message: `Address reported in scam database (${scamInfo.source})`,
      detail: scamInfo.description || scamInfo.type,
    });
  }

  // Chainabuse reports
  if (chainabuse?.reported) {
    score += 30;
    issues.push({
      severity: 'critical',
      message: `Address reported on Chainabuse (${chainabuse.reportCount} report(s))`,
    });
    for (const r of chainabuse.reports || []) {
      if (r.category) {
        issues.push({ severity: 'critical', message: `Chainabuse category: ${r.category}` });
      }
    }
  }

  // ML model contribution (up to 25 points)
  if (mlResult?.fraud_probability) {
    const mlPoints = Math.round(mlResult.fraud_probability * 25);
    score += mlPoints;
    if (mlResult.fraud_probability > 0.6) {
      issues.push({
        severity: 'warning',
        message: `ML model flags wallet behaviour as suspicious (${Math.round(mlResult.fraud_probability * 100)}% fraud probability)`,
      });
    }
  }

  // Wallet behaviour heuristics
  if (profile) {
    if (profile.ageDays !== null && profile.ageDays < 7 && profile.transactionCount > 5) {
      score += 12;
      issues.push({ severity: 'warning', message: 'Newly created wallet with high activity detected' });
    }

    if (profile.maxTransferEth > 10) {
      score += 8;
      issues.push({
        severity: 'warning',
        message: `High-value transfer detected (${profile.maxTransferEth.toFixed(4)} ETH max)`,
      });
    }

    if (profile.outgoingCount > profile.incomingCount * 3 && profile.outgoingCount > 20) {
      score += 10;
      issues.push({ severity: 'warning', message: 'Sudden large outgoing fund flow pattern detected' });
    }

    if (profile.transactionCount === 0) {
      score += 5;
      issues.push({ severity: 'info', message: 'No on-chain transaction history found for this address' });
    }

    if (profile.tokenTransferCount > 100 && profile.transactionCount < 10) {
      score += 8;
      issues.push({ severity: 'warning', message: 'Unusual ERC-20 activity relative to ETH transactions' });
    }
  }

  // Contract analysis
  if (contractAnalysis?.analyzed) {
    score += contractAnalysis.contractRiskScore || 0;
    for (const issue of contractAnalysis.issues || []) {
      if (issue.severity === 'warning') {
        issues.push({ severity: 'warning', message: issue.message });
      }
    }
  } else if (profile?.isContract) {
    score += 8;
    issues.push({ severity: 'info', message: 'Unverified contract — source code not available for analysis' });
  }

  // Etherscan unavailable
  if (profile?.etherscanError) {
    issues.push({
      severity: 'info',
      message: 'On-chain data unavailable — configure ETHERSCAN_API_KEY for full analysis',
    });
  }

  score = Math.min(100, Math.max(0, score));

  if (issues.length === 0) {
    issues.push({ severity: 'info', message: 'No major red flags detected — still perform your own due diligence' });
  }

  return {
    riskScore: score,
    riskLevel: getRiskLevel(score),
    issues: dedupeIssues(issues),
    disclaimer:
      'This is a risk analysis, not a definitive scam verdict. Always verify independently before transacting.',
  };
}

function dedupeIssues(issues) {
  const seen = new Set();
  return issues.filter((i) => {
    const key = i.message;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { calculateRiskScore, getRiskLevel };
