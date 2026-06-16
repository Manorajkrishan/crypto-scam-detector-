import './RiskGauge.css';

interface Props {
  score: number;
  level: string;
}

function getColor(score: number) {
  if (score <= 30) return 'var(--low)';
  if (score <= 70) return 'var(--medium)';
  return 'var(--high)';
}

export default function RiskGauge({ score, level }: Props) {
  const color = getColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="risk-gauge">
      <svg viewBox="0 0 120 120" className="gauge-svg">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="gauge-progress"
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-score" style={{ color }}>{score}</span>
        <span className="gauge-max">/100</span>
      </div>
      <p className="gauge-level" style={{ color }}>{level}</p>
    </div>
  );
}
