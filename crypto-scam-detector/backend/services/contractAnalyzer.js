const SUSPICIOUS_PATTERNS = [
  { pattern: /\bfunction\s+mint\b/i, issue: 'Hidden or exposed mint function detected', weight: 15 },
  { pattern: /\bfunction\s+blacklist\b|\b_isBlacklisted\b|\bblacklisted\b/i, issue: 'Blacklist function detected — addresses can be blocked from trading', weight: 18 },
  { pattern: /\bfunction\s+pause\b|\bwhenNotPaused\b|\b_paused\b/i, issue: 'Pause trading function detected', weight: 14 },
  { pattern: /\bonlyOwner\b.*\b(withdraw|drain|rescue)\b|\bfunction\s+withdraw\b/i, issue: 'Owner-only withdrawal function detected', weight: 16 },
  { pattern: /\brenounceOwnership\b/i, issue: 'Ownership renounce function present — verify if actually renounced', weight: 5 },
  { pattern: /\bsetFee\b|\b_taxFee\b|\b_buyTax\b|\b_sellTax\b|\bsetTax\b/i, issue: 'Modifiable buy/sell tax detected', weight: 12 },
  { pattern: /\bhoneypot\b|\bcannot\s+sell\b|\b_transfer.*require.*false\b/i, issue: 'Potential honeypot transfer restriction', weight: 25 },
  { pattern: /\bremoveLiquidity\b|\bremoveLiquidityETH\b/i, issue: 'Liquidity removal function accessible', weight: 10 },
  { pattern: /\bselfdestruct\b|\bdelegatecall\b/i, issue: 'Dangerous low-level call pattern detected', weight: 12 },
];

function analyzeContractSource(sourceCode, contractName = '') {
  if (!sourceCode || sourceCode.length < 10) {
    return {
      analyzed: false,
      issues: [{ severity: 'info', message: 'Contract source code not verified on Etherscan — cannot analyze bytecode patterns' }],
      patterns: [],
    };
  }

  const issues = [];
  const patterns = [];
  let score = 0;

  for (const { pattern, issue, weight } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sourceCode)) {
      issues.push({ severity: 'warning', message: issue });
      patterns.push(issue);
      score += weight;
    }
  }

  const isRenounced = /renounceOwnership\s*\(\s*\)/i.test(sourceCode);
  const hasOwner = /\bowner\s*\(\s*\)/i.test(sourceCode) || /\bonlyOwner\b/i.test(sourceCode);

  if (hasOwner && !isRenounced) {
    issues.push({ severity: 'warning', message: 'Token ownership may not be renounced — owner retains privileges' });
    score += 10;
  }

  if (/\bmaxTxAmount\b|\b_maxWallet\b|\bsetMaxTx\b/i.test(sourceCode)) {
    issues.push({ severity: 'warning', message: 'Transfer amount restrictions detected' });
    score += 8;
  }

  return {
    analyzed: true,
    contractName,
    issues,
    patterns,
    contractRiskScore: Math.min(score, 40),
  };
}

module.exports = { analyzeContractSource };
