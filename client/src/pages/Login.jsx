import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = searchParams.get('redirect');
  const targetDestination = location.state?.from?.pathname || redirectQuery || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthenticated, navigate, targetDestination]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(targetDestination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword = 'Password123!') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(6, 182, 212, 0.12), transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
            }}
          >
            <Shield size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            CyberGuard <span style={{ color: 'var(--accent-cyan)' }}>SOC</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Incident Reporting & Response Management
          </p>
        </div>

        {/* Login Card */}
        <div className="cyber-card cyber-card-glow">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            Secure Operator Sign In
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              {loading ? 'Authenticating...' : 'Authorize Access'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
                textAlign: 'center',
              }}
            >
              One-Click Demo Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('admin@cyberguardsoc.com', 'Admin@12345')}
              >
                <UserCheck size={14} style={{ color: '#ef4444' }} />
                Admin
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('analyst@example.com')}
              >
                <UserCheck size={14} style={{ color: '#06b6d4' }} />
                Analyst
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDemoFill('employee@example.com')}
              >
                <UserCheck size={14} style={{ color: '#10b981' }} />
                User
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            Need an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Register Organization User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
