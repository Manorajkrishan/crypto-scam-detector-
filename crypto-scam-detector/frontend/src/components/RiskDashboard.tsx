import type { AnalysisResult } from '../types';
import RiskGauge from './RiskGauge';
import IssueList from './IssueList';
import TransactionChart from './TransactionChart';
import { downloadPdfReport } from '../services/api';
import { useState } from 'react';
import './RiskDashboard.css';

interface Props {
  result: AnalysisResult;
}

export default function RiskDashboard({ result }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadPdfReport(result.address, result.chain);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="risk-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="address-type">{result.addressType}</span>
          <h2 className="mono">{result.address}</h2>
          <p className="scan-time">Scanned {new Date(result.scannedAt).toLocaleString()}</p>
        </div>
        <button className="pdf-btn" onClick={handlePdf} disabled={pdfLoading}>
          {pdfLoading ? 'Generating…' : 'Download PDF Report'}
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="card score-card">
          <RiskGauge score={result.riskScore} level={result.riskLevel} />
          <div className="risk-legend">
            <span className="legend-item low">0–30 Low</span>
            <span className="legend-item medium">31–70 Medium</span>
            <span className="legend-item high">71–100 High</span>
          </div>
        </div>

        <div className="card stats-card">
          <h3>On-Chain Summary</h3>
          <div className="stats-grid">
            <Stat label="Balance" value={`${result.profile.balanceEth.toFixed(4)} ETH`} />
            <Stat label="Transactions" value={String(result.profile.transactionCount)} />
            <Stat label="Incoming" value={String(result.profile.incomingCount)} />
            <Stat label="Outgoing" value={String(result.profile.outgoingCount)} />
            <Stat label="Token Transfers" value={String(result.profile.tokenTransferCount)} />
            <Stat label="Max Transfer" value={`${result.profile.maxTransferEth.toFixed(4)} ETH`} />
            {result.profile.ageDays != null && (
              <Stat label="Wallet Age" value={`~${Math.round(result.profile.ageDays)} days`} />
            )}
            {result.mlAnalysis.fraud_probability != null && (
              <Stat label="ML Fraud Prob." value={`${Math.round(result.mlAnalysis.fraud_probability * 100)}%`} />
            )}
          </div>
        </div>

        <div className="card issues-card">
          <IssueList issues={result.issues} />
        </div>

        <div className="card recommendation-card">
          <h3>Recommendation</h3>
          <p>{result.recommendation}</p>
          <p className="disclaimer">{result.disclaimer}</p>
        </div>

        <div className="card charts-card full-width">
          <TransactionChart result={result} />
        </div>

        {result.recentTransactions.length > 0 && (
          <div className="card txs-card full-width">
            <h3>Recent Transactions</h3>
            <div className="tx-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hash</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Value (ETH)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.recentTransactions.map((tx) => (
                    <tr key={tx.hash}>
                      <td className="mono">{tx.hash.slice(0, 12)}…</td>
                      <td className="mono">{tx.from.slice(0, 10)}…</td>
                      <td className="mono">{tx.to?.slice(0, 10)}…</td>
                      <td>{tx.valueEth.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
