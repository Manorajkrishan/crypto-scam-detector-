import type { RiskIssue } from '../types';
import './IssueList.css';

interface Props {
  issues: RiskIssue[];
}

const severityIcon: Record<string, string> = {
  critical: '⛔',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function IssueList({ issues }: Props) {
  return (
    <div className="issue-list">
      <h3>Detected Issues</h3>
      <ul>
        {issues.map((issue, i) => (
          <li key={i} className={`issue-item severity-${issue.severity}`}>
            <span className="issue-icon">{severityIcon[issue.severity] || '•'}</span>
            <div>
              <p>{issue.message}</p>
              {issue.detail && <small>{issue.detail}</small>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
