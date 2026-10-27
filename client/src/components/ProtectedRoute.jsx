import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--accent-cyan)',
          gap: '1rem',
        }}
      >
        <div
          className="pulse-dot"
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 20px #06b6d4',
          }}
        />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          VERIFYING SOC ACCESS CREDENTIALS...
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const userRole = (user?.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
