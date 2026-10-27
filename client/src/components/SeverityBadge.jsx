import React from 'react';
import { AlertTriangle, AlertOctagon, ShieldAlert, Info } from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/constants';

const SeverityBadge = ({ severity }) => {
  const style = SEVERITY_COLORS[severity] || SEVERITY_COLORS['Medium'];

  const renderIcon = () => {
    switch (severity) {
      case 'Critical':
        return <AlertOctagon size={13} strokeWidth={2.5} />;
      case 'High':
        return <ShieldAlert size={13} strokeWidth={2.5} />;
      case 'Medium':
        return <AlertTriangle size={13} strokeWidth={2.5} />;
      default:
        return <Info size={13} strokeWidth={2.5} />;
    }
  };

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {renderIcon()}
      {severity}
    </span>
  );
};

export default SeverityBadge;
