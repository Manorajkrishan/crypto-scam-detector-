const axios = require('axios');

const BASE_URL = 'https://api.etherscan.io/v2/api';
const CHAIN_IDS = { eth: 1, bsc: 56, polygon: 137, arbitrum: 42161 };

function getApiKey() {
  return process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
}

async function etherscanRequest(params, chain = 'eth') {
  const chainid = CHAIN_IDS[chain] || 1;
  const { data } = await axios.get(BASE_URL, {
    params: { chainid, apikey: getApiKey(), ...params },
    timeout: 15000,
  });

  if (data.status === '0' && data.message !== 'No transactions found') {
    const msg = typeof data.result === 'string' ? data.result : data.message;
    const softActions = ['txlist', 'tokentx', 'balance', 'getsourcecode'];
    if (softActions.includes(params.action)) {
      return params.action === 'balance' ? '0' : params.action === 'getsourcecode' ? [{ SourceCode: '' }] : [];
    }
    throw new Error(msg || 'Etherscan API error');
  }
  return data.result;
}

function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function getAccountBalance(address, chain = 'eth') {
  const result = await etherscanRequest({ module: 'account', action: 'balance', address, tag: 'latest' }, chain);
  return Number(result) / 1e18;
}

async function getNormalTransactions(address, chain = 'eth') {
  try {
    return await etherscanRequest(
      { module: 'account', action: 'txlist', address, startblock: 0, endblock: 99999999, sort: 'desc' },
      chain
    ) || [];
  } catch {
    return [];
  }
}

async function getTokenTransfers(address, chain = 'eth') {
  try {
    return await etherscanRequest(
      { module: 'account', action: 'tokentx', address, startblock: 0, endblock: 99999999, sort: 'desc' },
      chain
    ) || [];
  } catch {
    return [];
  }
}

async function getContractSource(address, chain = 'eth') {
  try {
    const result = await etherscanRequest({ module: 'contract', action: 'getsourcecode', address }, chain);
    return Array.isArray(result) ? result[0] : result;
  } catch {
    return null;
  }
}

async function isContract(address, chain = 'eth') {
  const source = await getContractSource(address, chain);
  return !!(source && source.SourceCode && source.SourceCode.length > 2);
}

async function getWalletProfile(address, chain = 'eth') {
  let balance = 0;
  let txList = [];
  let tokenList = [];
  let contract = false;
  let etherscanError = null;

  try {
    [balance, txList, tokenList, contract] = await Promise.all([
      getAccountBalance(address, chain).catch(() => 0),
      getNormalTransactions(address, chain),
      getTokenTransfers(address, chain),
      isContract(address, chain).catch(() => false),
    ]);
  } catch (err) {
    etherscanError = err.message;
    txList = [];
    tokenList = [];
  }

  txList = Array.isArray(txList) ? txList : [];
  tokenList = Array.isArray(tokenList) ? tokenList : [];

  const incoming = txList.filter((t) => t.to?.toLowerCase() === address.toLowerCase());
  const outgoing = txList.filter((t) => t.from?.toLowerCase() === address.toLowerCase());

  const values = txList.map((t) => Number(t.value) / 1e18).filter((v) => v > 0);
  const maxTransfer = values.length ? Math.max(...values) : 0;

  const timestamps = txList.map((t) => Number(t.timeStamp)).filter(Boolean);
  const firstTs = timestamps.length ? Math.min(...timestamps) : null;
  const lastTs = timestamps.length ? Math.max(...timestamps) : null;
  const ageDays = firstTs ? (Date.now() / 1000 - firstTs) / 86400 : null;

  return {
    address,
    chain,
    isContract: contract,
    balanceEth: balance,
    transactionCount: txList.length,
    incomingCount: incoming.length,
    outgoingCount: outgoing.length,
    tokenTransferCount: tokenList.length,
    maxTransferEth: maxTransfer,
    ageDays,
    firstActivity: firstTs,
    lastActivity: lastTs,
    etherscanError,
    recentTxs: txList.slice(0, 10).map((t) => ({
      hash: t.hash,
      from: t.from,
      to: t.to,
      valueEth: Number(t.value) / 1e18,
      timestamp: Number(t.timeStamp),
      isError: t.isError === '1',
    })),
    flowSummary: {
      incoming: incoming.length,
      outgoing: outgoing.length,
      netFlow: incoming.length - outgoing.length,
    },
  };
}

module.exports = {
  isValidAddress,
  getWalletProfile,
  getContractSource,
  isContract,
  getNormalTransactions,
  getTokenTransfers,
};
