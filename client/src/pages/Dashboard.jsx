import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertOctagon,
  Activity,
  CheckCircle2,
  FolderArchive,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  Users as UsersIcon,
  Edit,
  Clock,
  FileText,
  Eye,
  ShieldCheck,
  Mail,
  Laptop,
  KeyRound,
  Shield,
  History,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Pie, Line } from 'react-chartjs-2';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/constants';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const Dashboard = () => {
  const { user, isAdmin, isUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Admin User Management state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('User');
  const [roleUpdateMsg, setRoleUpdateMsg] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        const raw = res.data.data || res.data.stats || {};
        const ov = raw.overview || {};
        setStats({
          overview: {
            total: ov.total ?? raw.totalIncidents ?? 0,
            open: ov.open ?? raw.openIncidents ?? 0,
            inProgress: ov.inProgress ?? raw.inProgressIncidents ?? 0,
            critical: ov.critical ?? raw.criticalIncidents ?? 0,
            underInvestigation: ov.underInvestigation ?? 0,
            resolved: ov.resolved ?? raw.resolvedIncidents ?? 0,
            totalUsers: ov.totalUsers ?? raw.totalUsersCount ?? 0,
          },
          byStatus: raw.byStatus || {},
          severityBreakdown: Array.isArray(raw.severityBreakdown) ? raw.severityBreakdown : [],
          typeBreakdown: Array.isArray(raw.typeBreakdown) ? raw.typeBreakdown : [],
          statusBreakdown: Array.isArray(raw.statusBreakdown) ? raw.statusBreakdown : [],
          timelineTrend: Array.isArray(raw.timelineTrend) ? raw.timelineTrend : [],
          recentIncidents: Array.isArray(raw.recentIncidents) ? raw.recentIncidents : [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        const list = res.data.data || res.data.users || [];
        setUsersList(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load user roster on dashboard:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const fetchRecentActivities = async () => {
    if (!isAdmin) return;
    setActivitiesLoading(true);
    try {
      const res = await api.get('/activity-logs/recent?limit=6');
      if (res.data.success) {
        const logs = res.data.logs || res.data.data || [];
        setRecentActivities(Array.isArray(logs) ? logs : []);
      }
    } catch (err) {
      console.error('Failed to load recent activity feed:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (isAdmin) {
      fetchUsers();
      fetchRecentActivities();
    }
  }, [isAdmin]);

  const openRoleModal = (u) => {
    setTargetUser(u);
    setSelectedRole(u.role);
    setRoleModalOpen(true);
  };

  const submitRoleChange = async () => {
    if (!targetUser) return;
    try {
      const res = await api.put(`/users/${targetUser._id}/role`, {
        role: selectedRole,
      });
      if (res.data.success) {
        setRoleModalOpen(false);
        setRoleUpdateMsg(`Successfully updated role for ${targetUser.name} to ${selectedRole}.`);
        setTimeout(() => setRoleUpdateMsg(''), 4000);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const getRoleStyle = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' };
      case 'analyst':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' };
      case 'user':
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' };
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="pulse-dot"
            style={{ width: '20px', height: '20px', backgroundColor: '#06b6d4', margin: '0 auto 1rem' }}
          />
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            AGGREGATING SOC TELEMETRY & METRICS...
          </div>
        </div>
      </div>
    );
  }

  // Specialized User Experience (Dedicated to reporting & tracking user's own reports)
  if (isUser) {
    const userTotalReports = stats.overview?.total ?? 0;
    const openReportsCount = stats.overview?.open ?? 0;
    const underReviewCount =
      stats.byStatus?.['Under Review'] ??
      stats.statusBreakdown?.find((s) => s._id === 'Under Review')?.count ??
      0;
    const resolvedReportsCount = stats.overview?.resolved ?? 0;

    // Status distribution for User's actual incidents
    const statusOrder = ['Reported', 'Under Review', 'Assigned', 'Investigating', 'Contained', 'Resolved', 'Closed'];
    const statusColorsMap = {
      Reported: '#94a3b8',
      'Under Review': '#38bdf8',
      Assigned: '#818cf8',
      Investigating: '#fbbf24',
      Contained: '#fb923c',
      Resolved: '#10b981',
      Closed: '#64748b',
    };

    const userStatusCounts = stats.statusBreakdown || [];
    const activeStatuses = userStatusCounts.filter((s) => s.count > 0);

    const userStatusChartData = {
      labels: (activeStatuses.length > 0 ? activeStatuses : userStatusCounts).map((s) => s._id),
      datasets: [
        {
          data: (activeStatuses.length > 0 ? activeStatuses : userStatusCounts).map((s) => s.count),
          backgroundColor: (activeStatuses.length > 0 ? activeStatuses : userStatusCounts).map(
            (s) => statusColorsMap[s._id] || '#06b6d4'
          ),
          borderColor: '#0d1527',
          borderWidth: 2,
        },
      ],
    };

    const userDoughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11 },
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = context.raw || 0;
              const total = userTotalReports || 1;
              const pct = Math.round((val / total) * 100);
              return ` ${context.label}: ${val} (${pct}%)`;
            },
          },
        },
      },
      cutout: '68%',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 1. Personalized Welcome Header & Prominent Report Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.5rem',
              }}
            >
              <Shield size={14} />
              <span>Incident Reporter Portal</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.375rem' }}>
              Welcome back, {user?.name || 'User'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Report security concerns, track your submitted incidents, and review real-time response updates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={fetchDashboardData} className="btn btn-secondary" title="Sync data">
              <RefreshCw size={16} />
              <span>Sync</span>
            </button>
            <button
              onClick={() => navigate('/report-incident')}
              className="btn btn-primary"
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <PlusCircle size={18} />
              <span>Report an Incident</span>
            </button>
          </div>
        </div>

        {/* 2. Four Summary Cards Based ONLY on User's Real Incidents */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <StatCard
            title="My Reported Incidents"
            value={userTotalReports}
            icon={FileText}
            color="#3b82f6"
            subtitle="Total submissions by you"
          />
          <StatCard
            title="Open Reports"
            value={openReportsCount}
            icon={Clock}
            color="#f59e0b"
            subtitle="Pending or active triage"
          />
          <StatCard
            title="Under Review"
            value={underReviewCount}
            icon={Activity}
            color="#06b6d4"
            subtitle="Awaiting initial SOC triage"
          />
          <StatCard
            title="Resolved Reports"
            value={resolvedReportsCount}
            icon={CheckCircle2}
            color="#10b981"
            subtitle="Successfully remediated"
          />
        </div>

        {/* 5. Helpful Empty State IF user has 0 reported incidents */}
        {userTotalReports === 0 ? (
          <div
            className="cyber-card"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, rgba(13, 21, 39, 0.8) 0%, rgba(10, 16, 30, 0.95) 100%)',
              border: '1px dashed rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.25)',
              }}
            >
              <ShieldCheck size={36} style={{ color: 'var(--accent-cyan)' }} />
            </div>

            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
              No Incidents Reported Yet
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
                maxWidth: '560px',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              You have not submitted any cybersecurity incident reports. Your workstation and accounts currently have no active incidents logged. If you notice any suspicious activity or security risks, submit a report to the SOC team.
            </p>

            <button
              onClick={() => navigate('/report-incident')}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <PlusCircle size={18} />
              <span>Report Your First Incident</span>
            </button>

            {/* Quick reporting guidance */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '2rem',
                borderTop: '1px solid var(--border-subtle)',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
                  <Mail size={16} />
                  <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>Phishing & Suspicious Email</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>
                  Unsolicited emails with unexpected attachments, spoofed senders, or credential requests.
                </p>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
                  <Laptop size={16} />
                  <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>Malware & System Behavior</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>
                  Severe slowdowns, unexplained popups, ransomware warnings, or altered system settings.
                </p>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#f87171' }}>
                  <KeyRound size={16} />
                  <strong style={{ fontSize: '0.875rem', color: '#ffffff' }}>Compromised Credentials</strong>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>
                  Unrecognized login notifications, multi-factor prompt spam, or leaked passwords.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 4. Simple "My Incident Status" Visualization (User's real incident records ONLY) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.5rem',
              }}
            >
              <div className="cyber-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', color: '#ffffff', margin: 0 }}>
                      My Incident Status
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
                      Breakdown across your {userTotalReports} reported incident{userTotalReports === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div style={{ height: '230px', position: 'relative' }}>
                  <Doughnut data={userStatusChartData} options={userDoughnutOptions} />
                </div>

                {/* Status Badges Row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  {statusOrder.map((st) => {
                    const count = stats.statusBreakdown?.find((s) => s._id === st)?.count || 0;
                    if (count === 0) return null;
                    const color = statusColorsMap[st] || '#94a3b8';
                    return (
                      <div
                        key={st}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${color}33`,
                          fontSize: '0.75rem',
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                        <span style={{ color: '#cbd5e1' }}>{st}:</span>
                        <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Companion Card: Incident Response Workflow Tracker Guide */}
              <div className="cyber-card">
                <h3 style={{ fontSize: '1.0625rem', color: '#ffffff', marginBottom: '0.25rem' }}>
                  Incident Lifecycle & Response Guide
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
                  How the Security Operations Center processes your reports
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#38bdf8',
                        color: '#0d1527',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '0.875rem' }}>Reported & Under Review</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                        Your incident is logged into the SOC queue and prioritized by severity. Initial triage is conducted to verify indicators of compromise.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(251, 191, 36, 0.06)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#fbbf24',
                        color: '#0d1527',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '0.875rem' }}>Assigned & Investigating</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                        A SOC Analyst is assigned to investigate affected systems, isolate compromised nodes, and perform forensic response actions.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        color: '#0d1527',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '0.875rem' }}>Contained & Resolved</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                        The threat is fully eliminated, systems restored, and an investigation summary report is finalized by the security team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recent Reports Table */}
            <div className="cyber-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.125rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Recent Reports</span>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    Your most recently submitted security incident reports
                  </p>
                </div>
                <button
                  onClick={() => navigate('/my-incidents')}
                  className="btn btn-outline btn-sm"
                >
                  <span>View All My Reports</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="table-container">
                <table className="cyber-table">
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Title</th>
                      <th>Date Reported</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentIncidents && stats.recentIncidents.length > 0 ? (
                      stats.recentIncidents.map((inc) => (
                        <tr key={inc._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {inc.incidentId}
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            <span
                              style={{ cursor: 'pointer', color: '#ffffff' }}
                              onClick={() => navigate(`/incidents/${inc._id}`)}
                            >
                              {inc.title}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                            {formatDate(inc.reportedAt || inc.createdAt)}
                          </td>
                          <td>
                            <SeverityBadge severity={inc.severity} />
                          </td>
                          <td>
                            <StatusBadge status={inc.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/incidents/${inc._id}`)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                            >
                              <Eye size={14} />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No recent incident reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Chart 1: Severity Doughnut
  const severityLabels = stats.severityBreakdown.map((s) => s._id);
  const severityCounts = stats.severityBreakdown.map((s) => s.count);
  const severityColorsMap = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#06b6d4',
  };
  const severityChartData = {
    labels: severityLabels,
    datasets: [
      {
        data: severityCounts,
        backgroundColor: severityLabels.map((l) => severityColorsMap[l] || '#3b82f6'),
        borderColor: '#0d1527',
        borderWidth: 2,
      },
    ],
  };

  // Chart 2: Type Bar Chart
  const typeChartData = {
    labels: stats.typeBreakdown.map((t) => t._id),
    datasets: [
      {
        label: 'Detected Incidents',
        data: stats.typeBreakdown.map((t) => t.count),
        backgroundColor: 'rgba(6, 182, 212, 0.65)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart 3: Status Distribution
  const statusChartData = {
    labels: stats.statusBreakdown.map((s) => s._id),
    datasets: [
      {
        data: stats.statusBreakdown.map((s) => s.count),
        backgroundColor: [
          '#94a3b8',
          '#38bdf8',
          '#818cf8',
          '#fbbf24',
          '#fb923c',
          '#34d399',
          '#64748b',
        ],
        borderColor: '#0d1527',
        borderWidth: 2,
      },
    ],
  };

  // Chart 4: 30-Day Trend
  const timelineChartData = {
    labels: stats.timelineTrend.map((t) => t._id.slice(5)), // MM-DD
    datasets: [
      {
        label: 'Daily Incident Intake',
        data: stats.timelineTrend.map((t) => t.count),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#06b6d4',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Security Operations Command</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time Threat Monitoring, Severity Analytics, and Incident Resolution Tracker
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => navigate('/report-incident')}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      {isAdmin ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <StatCard
            title="Total Incidents"
            value={stats.overview.total}
            icon={ShieldAlert}
            color="#3b82f6"
            subtitle="All logged platform tickets"
          />
          <StatCard
            title="Open Incidents"
            value={stats.overview.open}
            icon={Clock}
            color="#06b6d4"
            subtitle="Active awaiting resolution"
          />
          <StatCard
            title="In Progress Incidents"
            value={stats.overview.inProgress}
            icon={Activity}
            color="#f59e0b"
            subtitle="Assigned & Investigating"
          />
          <StatCard
            title="Resolved Incidents"
            value={stats.overview.resolved}
            icon={CheckCircle2}
            color="#10b981"
            subtitle="Successfully remediated"
          />
          <StatCard
            title="Critical Severity Incidents"
            value={stats.overview.critical}
            icon={AlertOctagon}
            color="#ef4444"
            subtitle="Immediate containment alert"
          />
          <StatCard
            title="Total Registered Users"
            value={stats.overview.totalUsers}
            icon={UsersIcon}
            color="#8b5cf6"
            subtitle="Active identity accounts"
          />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <StatCard
            title="Total Incidents"
            value={stats.overview.total}
            icon={ShieldAlert}
            color="#3b82f6"
            subtitle="All logged telemetry"
          />
          <StatCard
            title="Critical Alerts"
            value={stats.overview.critical}
            icon={AlertOctagon}
            color="#ef4444"
            subtitle="Immediate containment required"
          />
          <StatCard
            title="Active Investigations"
            value={stats.overview.inProgress}
            icon={Activity}
            color="#f59e0b"
            subtitle="Assigned & Investigating"
          />
          <StatCard
            title="Resolved & Closed"
            value={stats.overview.resolved}
            icon={CheckCircle2}
            color="#10b981"
            subtitle="Remediated threats"
          />
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Severity Doughnut */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
            Incident Severity Breakdown
          </h3>
          <div style={{ height: '240px' }}>
            <Doughnut data={severityChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* Threat Categories Bar */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
            Top Threat Vectors & Attack Types
          </h3>
          <div style={{ height: '240px' }}>
            <Bar data={typeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Pipeline Pie */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
            Workflow Status Distribution
          </h3>
          <div style={{ height: '240px' }}>
            <Pie data={statusChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* 30-Day Timeline Curve */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ffffff' }}>
            30-Day Incident Volume Trajectory
          </h3>
          <div style={{ height: '240px' }}>
            <Line data={timelineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="cyber-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>Recent Incident Alerts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Latest triage activity logged across the network
            </p>
          </div>
          <button
            onClick={() => navigate('/incidents')}
            className="btn btn-outline btn-sm"
          >
            <span>View Full Inventory</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Assigned Analyst</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentIncidents && stats.recentIncidents.length > 0 ? (
                stats.recentIncidents.map((inc) => (
                  <tr key={inc._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {inc.incidentId}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <span
                        style={{ cursor: 'pointer', color: '#ffffff' }}
                        onClick={() => navigate(`/incidents/${inc._id}`)}
                      >
                        {inc.title}
                      </span>
                    </td>
                    <td>{inc.type}</td>
                    <td>
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td>
                      <StatusBadge status={inc.status} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {formatDate(inc.reportedAt)}
                    </td>
                    <td>
                      {inc.assignedTo ? (
                        <span style={{ color: '#e2e8f0' }}>{inc.assignedTo.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/incidents/${inc._id}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No incident records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Exclusive: Recent Platform Audit Activity Feed */}
      {isAdmin && (
        <div className="cyber-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.125rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <History size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span>Recent Platform Activity</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Live chronological audit trail of incident assignments, status changes, and operator actions
              </p>
            </div>

            <button
              onClick={() => navigate('/activity-logs')}
              className="btn btn-outline btn-sm"
            >
              <span>View Full Audit Docket</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operator</th>
                  <th>Role</th>
                  <th>Event Action</th>
                  <th>Event Description</th>
                  <th style={{ textAlign: 'right' }}>Related Ticket</th>
                </tr>
              </thead>
              <tbody>
                {activitiesLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      <div
                        className="pulse-dot"
                        style={{
                          width: '14px',
                          height: '14px',
                          backgroundColor: '#06b6d4',
                          margin: '0 auto 0.5rem',
                        }}
                      />
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8125rem' }}>
                        RETRIEVING RECENT AUDIT LOGS...
                      </span>
                    </td>
                  </tr>
                ) : recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((act) => {
                    const ticketId = act.incidentTicketId || act.incidentId?.incidentId;
                    const incId = act.incidentId?._id || (typeof act.incidentId === 'string' ? act.incidentId : null);
                    const actorName = act.userName || act.performedBy?.name || 'Operator';
                    const actorRole = act.userRole || act.performedBy?.role || 'User';

                    return (
                      <tr key={act._id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                          {formatDate(act.timestamp || act.createdAt)}
                        </td>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>
                          {actorName}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.6875rem',
                              backgroundColor:
                                actorRole === 'Admin'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : actorRole === 'Analyst'
                                  ? 'rgba(6, 182, 212, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                              color:
                                actorRole === 'Admin'
                                  ? '#ef4444'
                                  : actorRole === 'Analyst'
                                  ? '#06b6d4'
                                  : '#60a5fa',
                            }}
                          >
                            {actorRole}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(6, 182, 212, 0.1)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.6875rem',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {(act.action || 'EVENT').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ color: '#e2e8f0', fontSize: '0.875rem', maxWidth: '360px' }}>
                          {act.description}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {ticketId ? (
                            <span
                              style={{
                                cursor: 'pointer',
                                color: 'var(--accent-cyan)',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                              }}
                              onClick={() => navigate(`/incidents/${incId || ticketId}`)}
                            >
                              {ticketId}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No recent platform activity logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Exclusive: User Management & Role Assignment Section */}
      {isAdmin && (
        <div className="cyber-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1.125rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <UsersIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span>User Management</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                View registered personnel and assign operational SOC roles
              </p>
            </div>

            <button
              onClick={() => navigate('/users')}
              className="btn btn-outline btn-sm"
            >
              <span>Full Identity Directory</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {roleUpdateMsg && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#6ee7b7',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{roleUpdateMsg}</span>
            </div>
          )}

          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Corporate Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      <div
                        className="pulse-dot"
                        style={{
                          width: '14px',
                          height: '14px',
                          backgroundColor: '#06b6d4',
                          margin: '0 auto 0.5rem',
                        }}
                      />
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8125rem' }}>
                        RETRIEVING USER DIRECTORY...
                      </span>
                    </td>
                  </tr>
                ) : usersList && usersList.length > 0 ? (
                  usersList.map((u) => {
                    const rStyle = getRoleStyle(u.role);
                    const isSelf = user?._id === u._id || user?.email === u.email;

                    return (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>{u.department || 'General'}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: rStyle.bg,
                              color: rStyle.text,
                              textTransform: 'uppercase',
                              fontSize: '0.6875rem',
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => openRoleModal(u)}
                            disabled={isSelf}
                            className="btn btn-secondary btn-sm"
                            title={isSelf ? 'Cannot modify own role' : 'Change User Role'}
                            style={{ opacity: isSelf ? 0.6 : 1 }}
                          >
                            <Edit size={14} />
                            <span>Change Role</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No registered users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Modification Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change User Role"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submitRoleChange}>
              Confirm Role Change
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Assign a new role for <strong style={{ color: '#ffffff' }}>{targetUser?.name}</strong> ({targetUser?.email}).
        </p>

        <div className="form-group">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="Admin">Admin</option>
            <option value="Analyst">Analyst</option>
            <option value="User">User</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
