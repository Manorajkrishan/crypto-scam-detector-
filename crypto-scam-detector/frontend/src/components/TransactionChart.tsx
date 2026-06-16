import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AnalysisResult } from '../types';
import './TransactionChart.css';

interface Props {
  result: AnalysisResult;
}

export default function TransactionChart({ result }: Props) {
  const { profile } = result;

  const flowData = [
    { name: 'Incoming', value: profile.incomingCount, color: '#22c55e' },
    { name: 'Outgoing', value: profile.outgoingCount, color: '#ef4444' },
    { name: 'Token Txs', value: profile.tokenTransferCount, color: '#6366f1' },
  ];

  const riskBreakdown = [
    { name: 'Scam DB', value: result.scamDatabase.hit ? 35 : 0 },
    { name: 'Chainabuse', value: result.chainabuse.reported ? 30 : 0 },
    { name: 'ML Model', value: Math.round((result.mlAnalysis.fraud_probability || 0) * 25) },
    { name: 'Behaviour', value: Math.max(0, result.riskScore - (result.scamDatabase.hit ? 35 : 0) - (result.chainabuse.reported ? 30 : 0) - Math.round((result.mlAnalysis.fraud_probability || 0) * 25)) },
  ].filter((d) => d.value > 0);

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h4>Fund Flow</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={flowData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#8892a8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8892a8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a2236', border: '1px solid #2a3550', borderRadius: 8 }}
              labelStyle={{ color: '#e8ecf4' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {flowData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {riskBreakdown.length > 0 && (
        <div className="chart-card">
          <h4>Risk Score Breakdown</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskBreakdown} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#8892a8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8892a8', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip
                contentStyle={{ background: '#1a2236', border: '1px solid #2a3550', borderRadius: 8 }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
