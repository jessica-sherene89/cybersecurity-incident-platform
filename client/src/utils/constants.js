export const INCIDENT_TYPES = [
  'Phishing',
  'Malware',
  'Ransomware',
  'Unauthorized Access',
  'Data Breach',
  'DDoS',
  'Insider Threat',
  'Password Attack',
  'Suspicious Activity',
  'Other',
];

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export const STATUSES = [
  'Reported',
  'Under Review',
  'Assigned',
  'Investigating',
  'Contained',
  'Resolved',
  'Closed',
];

export const STATUS_COLORS = {
  Reported: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#64748b' },
  'Under Review': { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#0284c7' },
  Assigned: { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', border: '#6366f1' },
  Investigating: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: '#d97706' },
  Contained: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: '#ea580c' },
  Resolved: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#059669' },
  Closed: { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b', border: '#475569' },
};

export const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239, 68, 68, 0.18)', text: '#ef4444', border: '#dc2626' },
  High: { bg: 'rgba(249, 115, 22, 0.18)', text: '#f97316', border: '#ea580c' },
  Medium: { bg: 'rgba(245, 158, 11, 0.18)', text: '#f59e0b', border: '#d97706' },
  Low: { bg: 'rgba(6, 182, 212, 0.18)', text: '#06b6d4', border: '#0891b2' },
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
