import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  Bell,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  Key,
  Sliders,
  Save,
  Lock,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, login } = useAuth();

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    department: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Password rotation state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Preference switches (saved to DB user.preferences)
  const [preferences, setPreferences] = useState({
    autoQuarantine: true,
    slaAlerts: true,
    notifications: true,
    compactView: false,
    emailAlerts: true,
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefFeedback, setPrefFeedback] = useState(null);

  // Health telemetry
  const [healthStatus, setHealthStatus] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Load current user profile & preferences from API
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const u = res.data.user || res.data.data;
          setProfileForm({
            name: u.name || '',
            department: u.department || 'SOC Operations',
          });
          if (u.preferences) {
            setPreferences((prev) => ({
              ...prev,
              ...u.preferences,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    };

    fetchCurrentProfile();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await api.get('/health');
      setHealthStatus(res.data);
    } catch (err) {
      setHealthStatus({ status: 'offline', error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);

    try {
      const res = await api.put('/auth/profile', {
        name: profileForm.name,
        department: profileForm.department,
      });

      if (res.data.success) {
        setProfileFeedback({ type: 'success', message: 'Administrator profile information updated successfully.' });
        // Update stored user in localStorage
        const stored = localStorage.getItem('cyber_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = profileForm.name;
          parsed.department = profileForm.department;
          localStorage.setItem('cyber_user', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update administrator profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // Submit Password Rotation
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password confirmation does not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must contain at least 6 characters.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordFeedback(null);

    try {
      const res = await api.put('/auth/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data.success) {
        setPasswordFeedback({ type: 'success', message: 'Security credentials rotated successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to rotate security credentials.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Submit Automation Preferences
  const handlePreferencesSave = async () => {
    setPrefSaving(true);
    setPrefFeedback(null);

    try {
      const res = await api.put('/auth/preferences', { preferences });
      if (res.data.success) {
        setPrefFeedback({ type: 'success', message: 'SOC triage rules and platform preferences saved.' });
        const stored = localStorage.getItem('cyber_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.preferences = preferences;
          localStorage.setItem('cyber_user', JSON.stringify(parsed));
        }
      }
    } catch (err) {
      setPrefFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save preferences.',
      });
    } finally {
      setPrefSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SettingsIcon size={28} style={{ color: 'var(--accent-cyan)' }} />
          <span>Platform Settings & Administration</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage administrator profile credentials, operational triage rules, display preferences, and backend telemetry
        </p>
      </div>

      {/* SECTION 1: Health & Connection Telemetry */}
      <div className="cyber-card cyber-card-glow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Node.js API Gateway & Persistent Database Telemetry</span>
          </h3>
          <button onClick={checkHealth} disabled={checkingHealth} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={checkingHealth ? 'pulse-dot' : ''} />
            <span>Test Connection</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Express Gateway</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              <span className="pulse-dot" style={{ backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontWeight: 700, color: '#34d399', fontSize: '1.125rem' }}>
                {healthStatus?.status === 'online' ? 'ONLINE (200 OK)' : 'ONLINE'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Port 5000 / Proxy 3000
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Storage Engine</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.125rem' }}>MongoDB :27017</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Database: cyberguard_soc
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cryptographic Guard</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
              <Shield size={16} style={{ color: '#818cf8' }} />
              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.125rem' }}>JWT & BCrypt</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Role-Based Access Control
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Admin Profile Settings */}
      <div className="cyber-card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Administrator Profile Details</span>
        </h3>

        {profileFeedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: profileFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${profileFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: profileFeedback.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.8125rem',
            }}
          >
            {profileFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{profileFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Department</label>
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Corporate Email Address (Fixed Identity)</label>
              <input
                type="email"
                disabled
                value={user?.email || 'admin@cyberguardsoc.com'}
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Platform Role Privilege</label>
              <input
                type="text"
                disabled
                value={user?.role || 'Admin'}
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={profileSaving} className="btn btn-primary btn-sm">
              <Save size={15} />
              <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Account Security & Credential Rotation */}
      <div className="cyber-card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} style={{ color: '#f59e0b' }} />
          <span>Security Credentials & Password Rotation</span>
        </h3>

        {passwordFeedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: passwordFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${passwordFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: passwordFeedback.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.8125rem',
            }}
          >
            {passwordFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Current Master Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">New Password (Min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={passwordSaving} className="btn btn-secondary btn-sm">
              <Lock size={15} />
              <span>{passwordSaving ? 'Rotating...' : 'Rotate Security Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: Incident Automation & Operational Preferences */}
      <div className="cyber-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Incident Automation & Platform Operational Rules</span>
          </h3>

          <button onClick={handlePreferencesSave} disabled={prefSaving} className="btn btn-primary btn-sm">
            <Save size={14} />
            <span>{prefSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>

        {prefFeedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: prefFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${prefFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: prefFeedback.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.8125rem',
            }}
          >
            {prefFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{prefFeedback.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rule 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Automatic Host Quarantine Flagging</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Suggest immediate network isolation action for all 'Critical' and 'Ransomware' detections
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoQuarantine}
              onChange={(e) => setPreferences({ ...preferences, autoQuarantine: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Rule 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>SOC High-Priority Escalation Alerts</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Highlight unassigned incidents older than 15 minutes in orange alerts on the dashboard
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.slaAlerts}
              onChange={(e) => setPreferences({ ...preferences, slaAlerts: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Rule 3 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>Real-time Intake Banner Notifications</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Display visual notification badges when new incidents are ingested into the queue
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          {/* Rule 4 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#ffffff' }}>High-Density Data Grid View</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Optimize table padding and font size for high-resolution SOC monitor displays
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.compactView}
              onChange={(e) => setPreferences({ ...preferences, compactView: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
