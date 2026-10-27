import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="cyber-card cyber-card-glow"
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          padding: '2.5rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
          }}
        >
          <ShieldX size={36} />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            color: '#ef4444',
            fontWeight: 700,
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}
        >
          SECURITY EXCEPTION 404: ACCESS DENIED
        </div>

        <h1 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '0.75rem' }}>
          Resource or Docket Not Found
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The requested operational resource, incident record, or endpoint does not exist or has been sequestered by SOC protocol.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            <Home size={16} />
            <span>Return to SOC Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
