import { useState } from 'react';
import AddressInput from '../components/AddressInput';
import RiskDashboard from '../components/RiskDashboard';
import { analyzeAddress } from '../services/api';
import type { AnalysisResult } from '../types';
import './Home.css';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (address: string, chain: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeAddress(address, chain);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-badge">Risk Analysis Platform</div>
        <h1>Crypto Scam Detection</h1>
        <p className="hero-sub">
          Analyze wallets, tokens, and smart contracts for suspicious behaviour.
          This tool provides <strong>risk indicators</strong> — not definitive scam verdicts.
        </p>
      </header>

      <AddressInput onAnalyze={handleAnalyze} loading={loading} />

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Fetching blockchain data &amp; running risk analysis…</p>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {result && !loading && <RiskDashboard result={result} />}

      {!result && !loading && (
        <section className="features">
          <Feature icon="🔍" title="Wallet Risk Checker" desc="Transaction patterns, fund flow, scam database cross-reference" />
          <Feature icon="🪙" title="Token Scam Checker" desc="Contract analysis for honeypot patterns, taxes, owner privileges" />
          <Feature icon="📄" title="PDF Report" desc="Downloadable risk report with score, issues, and recommendation" />
          <Feature icon="🤖" title="ML-Enhanced Scoring" desc="Random Forest model trained on 9,841 Ethereum wallets (AUC 0.987)" />
        </section>
      )}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
