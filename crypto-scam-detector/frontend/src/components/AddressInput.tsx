import { useState } from 'react';
import './AddressInput.css';

interface Props {
  onAnalyze: (address: string, chain: string) => void;
  loading: boolean;
}

export default function AddressInput({ onAnalyze, loading }: Props) {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('eth');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) onAnalyze(address.trim(), chain);
  };

  return (
    <form className="address-input" onSubmit={handleSubmit}>
      <div className="input-row">
        <select value={chain} onChange={(e) => setChain(e.target.value)} disabled={loading}>
          <option value="eth">Ethereum</option>
          <option value="bsc">BSC</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
        </select>
        <input
          type="text"
          placeholder="0x... wallet or token contract address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
          spellCheck={false}
        />
        <button type="submit" disabled={loading || !address.trim()}>
          {loading ? 'Analyzing…' : 'Analyze Risk'}
        </button>
      </div>
      <p className="input-hint">
        Enter any Ethereum-compatible address. Results are risk indicators — not a definitive scam verdict.
      </p>
    </form>
  );
}
