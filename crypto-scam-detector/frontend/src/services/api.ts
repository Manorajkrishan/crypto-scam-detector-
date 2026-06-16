import type { AnalysisResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function analyzeAddress(address: string, chain = 'eth'): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chain }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function downloadPdfReport(address: string, chain = 'eth'): Promise<void> {
  const res = await fetch(`${API_BASE}/report/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, chain }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'PDF generation failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `risk-report-${address.slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
