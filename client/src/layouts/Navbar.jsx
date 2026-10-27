import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Radio, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#dc2626' };
      case 'analyst':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#0891b2' };
      case 'user':
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
    }
  };

  const roleStyle = getRoleBadgeColor(user?.role);

  return (
    <header
      className="navbar"
      style={{
        height: '64px',
        backgroundColor: 'rgba(13, 21, 39, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left section: mobile hamburger & live status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: '#34d399',
          }}
        >
          <span
            className="pulse-dot"
            style={{
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span>SOC FEED: LIVE</span>
        </div>
      </div>

      {/* Right section: user profile & logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Role Badge */}
            <span
              className="badge"
              style={{
                backgroundColor: roleStyle.bg,
                color: roleStyle.text,
                borderColor: roleStyle.border,
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
              }}
            >
              {user.role}
            </span>

            {/* User display */}
            <div
              onClick={() => navigate('/profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e293b, #334155)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'none', flexDirection: 'column' }} className="user-text-info">
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          title="Sign Out"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <LogOut size={15} />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
