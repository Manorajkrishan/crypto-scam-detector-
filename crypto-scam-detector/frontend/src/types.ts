export interface RiskIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
}

export interface AnalysisResult {
  address: string;
  chain: string;
  addressType: 'wallet' | 'contract';
  riskScore: number;
  riskLevel: string;
  issues: RiskIssue[];
  disclaimer: string;
  recommendation: string;
  scannedAt: string;
  profile: {
    balanceEth: number;
    transactionCount: number;
    incomingCount: number;
    outgoingCount: number;
    tokenTransferCount: number;
    maxTransferEth: number;
    ageDays: number | null;
    isContract: boolean;
    flowSummary: { incoming: number; outgoing: number; netFlow: number };
  };
  recentTransactions: Array<{
    hash: string;
    from: string;
    to: string;
    valueEth: number;
    timestamp: number;
    isError: boolean;
  }>;
  scamDatabase: { hit: boolean; source?: string; type?: string };
  chainabuse: { checked: boolean; reported: boolean; reportCount?: number };
  mlAnalysis: { fraud_probability?: number; model_auc?: number };
  contractAnalysis?: { analyzed: boolean; patterns?: string[] };
}
