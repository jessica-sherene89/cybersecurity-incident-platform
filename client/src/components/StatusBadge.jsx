import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

const StatusBadge = ({ status }) => {
  const style = STATUS_COLORS[status] || STATUS_COLORS['Reported'];

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="pulse-dot"
        style={{
          backgroundColor: style.text,
          boxShadow: `0 0 8px ${style.text}`,
        }}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
