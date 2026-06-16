const etherscan = require('../services/etherscan');
const chainabuse = require('../services/chainabuse');
const { analyzeContractSource } = require('../services/contractAnalyzer');
const { calculateRiskScore } = require('../services/riskScorer');
const { buildFeatureVector, runMlPrediction } = require('../services/mlService');
const { getScamInfo, saveScan } = require('../models/db');
const { getRecommendation } = require('../services/pdfGenerator');

async function analyzeAddress(address, chain = 'eth') {
  const normalized = address.trim().toLowerCase();

  if (!etherscan.isValidAddress(normalized)) {
    const err = new Error('Invalid Ethereum address format');
    err.status = 400;
    throw err;
  }

  const profile = await etherscan.getWalletProfile(normalized, chain);
  const scamInfo = getScamInfo(normalized);
  const chainabuseResult = await chainabuse.checkChainabuse(normalized, chain.toUpperCase());

  let contractAnalysis = null;
  if (profile.isContract) {
    const source = await etherscan.getContractSource(normalized, chain);
    contractAnalysis = analyzeContractSource(source?.SourceCode, source?.ContractName);
  }

  const features = buildFeatureVector(profile);
  const mlResult = await runMlPrediction(features);

  const { riskScore, riskLevel, issues, disclaimer } = calculateRiskScore({
    profile,
    scamInfo,
    chainabuse: chainabuseResult,
    contractAnalysis,
    mlResult,
  });

  const result = {
    address: normalized,
    chain,
    addressType: profile.isContract ? 'contract' : 'wallet',
    riskScore,
    riskLevel,
    issues,
    disclaimer,
    profile: {
      balanceEth: profile.balanceEth,
      transactionCount: profile.transactionCount,
      incomingCount: profile.incomingCount,
      outgoingCount: profile.outgoingCount,
      tokenTransferCount: profile.tokenTransferCount,
      maxTransferEth: profile.maxTransferEth,
      ageDays: profile.ageDays,
      isContract: profile.isContract,
      flowSummary: profile.flowSummary,
    },
    recentTransactions: profile.recentTxs,
    scamDatabase: scamInfo ? { hit: true, ...scamInfo } : { hit: false },
    chainabuse: chainabuseResult,
    contractAnalysis,
    mlAnalysis: mlResult,
    recommendation: getRecommendation(riskScore),
    scannedAt: new Date().toISOString(),
    dataSources: {
      etherscan: !profile.etherscanError,
      scamDatabase: true,
      chainabuse: chainabuseResult.checked,
      mlModel: !mlResult?.error,
    },
  };

  try {
    await saveScan({
      address: normalized,
      chain,
      riskScore,
      riskLevel,
      addressType: result.addressType,
      issues,
    });
  } catch {
    // non-fatal if DB unavailable
  }

  return result;
}

module.exports = { analyzeAddress };
