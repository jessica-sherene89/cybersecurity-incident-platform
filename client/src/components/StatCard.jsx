import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#06b6d4', subtitle, trend }) => {
  return (
    <div
      className="cyber-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top corner color accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#ffffff',
              lineHeight: 1.1,
              marginTop: '0.5rem',
            }}
          >
            {value}
          </div>
        </div>

        {Icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: `rgba(${color.startsWith('#') ? parseInt(color.slice(1,3), 16) : 6}, ${color.startsWith('#') ? parseInt(color.slice(3,5), 16) : 182}, ${color.startsWith('#') ? parseInt(color.slice(5,7), 16) : 212}, 0.15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              border: `1px solid rgba(${color.startsWith('#') ? parseInt(color.slice(1,3), 16) : 6}, ${color.startsWith('#') ? parseInt(color.slice(3,5), 16) : 182}, ${color.startsWith('#') ? parseInt(color.slice(5,7), 16) : 212}, 0.3)`,
              boxShadow: `0 0 15px rgba(${color.startsWith('#') ? parseInt(color.slice(1,3), 16) : 6}, ${color.startsWith('#') ? parseInt(color.slice(3,5), 16) : 182}, ${color.startsWith('#') ? parseInt(color.slice(5,7), 16) : 212}, 0.2)`,
            }}
          >
            <Icon size={24} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            paddingTop: '0.75rem',
          }}
        >
          <span>{subtitle}</span>
          {trend && (
            <span style={{ color: color, fontWeight: 600 }}>{trend}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
