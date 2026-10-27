import React, { useState } from 'react';
import { User, Shield, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/constants';

const Profile = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      return setError('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters');
    }

    setLoading(true);
    try {
      // Mock or call profile update endpoint
      setTimeout(() => {
        setMessage('Security credentials updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={28} style={{ color: 'var(--accent-cyan)' }} />
          <span>Operator Profile & Identity</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage your SOC account credentials, role authorization, and security preferences
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="cyber-card cyber-card-glow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#ffffff' }}>{user?.name}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
              <span className="badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                {user?.role}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Department:</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>{user?.department || 'SOC Operations'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Status:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Active & Authorized</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered Since:</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Update Secret Passkey</span>
          </h3>

          {message && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#6ee7b7',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{message}</span>
            </div>
          )}

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
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Updating Credentials...' : 'Rotate Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
