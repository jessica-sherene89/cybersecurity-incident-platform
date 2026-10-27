import React, { useState, useEffect, useMemo } from 'react';
import {
  Users as UsersIcon,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  UserPlus,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Lock,
  Building,
  Mail,
  Calendar,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for Create User
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'SOC Operations',
    role: 'Analyst',
  });

  // Form states for Edit User
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    role: 'User',
    status: 'active',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        const list = res.data.data || res.data.users || [];
        setUsers(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setFeedback({ type: 'error', message: 'Failed to retrieve operator roster from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered roster
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL') {
        if ((u.role || '').toLowerCase() !== roleFilter.toLowerCase()) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL') {
        if ((u.status || 'active').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesDept = (u.department || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Metric counts
  const totalUsersCount = users.length;
  const adminCount = users.filter((u) => (u.role || '').toLowerCase() === 'admin').length;
  const analystCount = users.filter((u) => (u.role || '').toLowerCase() === 'analyst').length;
  const userCount = users.filter((u) => (u.role || '').toLowerCase() === 'user').length;
  const activeCount = users.filter((u) => (u.status || 'active').toLowerCase() === 'active').length;

  // Handlers for View Modal
  const openViewModal = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Handlers for Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      department: user.department || '',
      role: user.role || 'User',
      status: user.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.put(`/users/${selectedUser._id}`, editFormData);
      if (res.data.success) {
        setFeedback({ type: 'success', message: `Account permissions updated for ${selectedUser.name}.` });
        setEditModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update user account privileges.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      setFeedback({ type: 'error', message: 'Name, email, and password are required.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.post('/users', createFormData);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `New security operator account created for ${createFormData.name} (${createFormData.role}).`,
        });
        setCreateModalOpen(false);
        setCreateFormData({
          name: '',
          email: '',
          password: '',
          department: 'SOC Operations',
          role: 'Analyst',
        });
        fetchUsers();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to provision new account.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Delete User
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.delete(`/users/${selectedUser._id}`);
      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: `Account for ${selectedUser.name} (${selectedUser.email}) permanently revoked.`,
        });
        setDeleteModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete user account.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'admin':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'analyst':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' };
      case 'user':
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const isSelf = (userId) => {
    return currentUser?._id && currentUser._id.toString() === userId?.toString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UsersIcon size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>User & Access Management (RBAC)</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Provision operators, audit role assignments, control active operational states, and enforce least privilege
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchUsers} className="btn btn-secondary btn-sm" title="Refresh Roster">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn btn-primary btn-sm"
            title="Create New User Account"
          >
            <UserPlus size={15} />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Roster Statistics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <StatCard
          title="Total Accounts"
          value={totalUsersCount}
          icon={UsersIcon}
          color="#06b6d4"
          subtitle="Enrolled identities"
        />
        <StatCard
          title="Administrators"
          value={adminCount}
          icon={Shield}
          color="#ef4444"
          subtitle="Full platform control"
        />
        <StatCard
          title="SOC Analysts"
          value={analystCount}
          icon={UserCheck}
          color="#06b6d4"
          subtitle="Incident response tier"
        />
        <StatCard
          title="Standard Users"
          value={userCount}
          icon={UsersIcon}
          color="#3b82f6"
          subtitle="Incident reporting tier"
        />
        <StatCard
          title="Active State"
          value={activeCount}
          icon={CheckCircle2}
          color="#10b981"
          subtitle={`${totalUsersCount - activeCount} suspended`}
        />
      </div>

      {/* Search and Role Filter Toolbar */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by name, corporate email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.8125rem', width: 'auto' }}
            >
              <option value="ALL">All Roles ({totalUsersCount})</option>
              <option value="Admin">Admin ({adminCount})</option>
              <option value="Analyst">Analyst ({analystCount})</option>
              <option value="User">User ({userCount})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.8125rem', width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active ({activeCount})</option>
              <option value="inactive">Inactive ({totalUsersCount - activeCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Operator / Identity</th>
                <th>Corporate Email</th>
                <th>Department</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Registration Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem' }}>
                    <div className="pulse-dot" style={{ width: '18px', height: '18px', backgroundColor: '#06b6d4', margin: '0 auto 0.75rem' }} />
                    <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      SYNCHRONIZING OPERATOR ROSTER...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const rStyle = getRoleBadgeStyle(u.role);
                  const isCurrent = isSelf(u._id);

                  return (
                    <tr key={u._id} style={{ backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.03)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: rStyle.bg,
                              border: `1px solid ${rStyle.border}`,
                              color: rStyle.text,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                                    color: 'var(--accent-cyan)',
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ID: {u._id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>{u.department || 'General'}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: rStyle.bg,
                            color: rStyle.text,
                            border: `1px solid ${rStyle.border}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.status === 'inactive' ? (
                          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <XCircle size={12} /> Inactive
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => openViewModal(u)}
                            className="btn btn-secondary btn-sm"
                            title="View Full Profile Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn btn-secondary btn-sm"
                            title="Edit Role & Permissions"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={isCurrent}
                            className="btn btn-danger btn-sm"
                            title={isCurrent ? 'Cannot delete your own active administrator account' : 'Revoke Account'}
                            style={{ opacity: isCurrent ? 0.4 : 1, cursor: isCurrent ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No security operator accounts match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create New User / Operator */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Operator Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateUser} disabled={actionLoading}>
              {actionLoading ? 'Provisioning...' : 'Provision Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Alex Mercer"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Email Address *</label>
            <input
              type="email"
              required
              placeholder="operator@cyberguardsoc.local"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password (Min 6 characters) *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Role Privilege *</label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                className="form-select"
              >
                <option value="Admin">Admin (Full System Oversight)</option>
                <option value="Analyst">Analyst (Triage & Incident Actions)</option>
                <option value="User">User (Incident Reporter)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department / Unit</label>
              <input
                type="text"
                placeholder="SOC Operations"
                value={createFormData.department}
                onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: View User Details */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Security Operator Profile"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(selectedUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>{selectedUser.name}</h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{selectedUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ASSIGNED ROLE</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getRoleBadgeStyle(selectedUser.role).bg,
                      color: getRoleBadgeStyle(selectedUser.role).text,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OPERATIONAL STATUS</div>
                <div style={{ marginTop: '0.25rem' }}>
                  {selectedUser.status === 'inactive' ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      Inactive / Suspended
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEPARTMENT</div>
                <div style={{ color: '#ffffff', fontWeight: 500, marginTop: '0.25rem' }}>
                  {selectedUser.department || 'General'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ENROLLED TIMESTAMP</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {formatDate(selectedUser.createdAt)}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Password hashes and authentication tokens are encrypted and never exposed in the interface.</span>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Edit User & Permissions */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Identity & Privileges"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdateUser} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Permissions'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isSelf(selectedUser._id) && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>You are editing your own administrator account. Self-demotion and deactivation are locked.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Unit</label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role Classification</label>
              <select
                value={editFormData.role}
                disabled={isSelf(selectedUser._id)}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                className="form-select"
              >
                <option value="Admin">Admin (Full System Oversight)</option>
                <option value="Analyst">Analyst (Triage & Incident Actions)</option>
                <option value="User">User (Incident Reporter)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Operational Status</label>
              <select
                value={editFormData.status}
                disabled={isSelf(selectedUser._id)}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="form-select"
              >
                <option value="active">Active (Full Access Granted)</option>
                <option value="inactive">Inactive / Suspended (Access Revoked)</option>
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: Delete User Confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Revoke and Purge Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteUser} disabled={actionLoading}>
              {actionLoading ? 'Purging...' : 'Confirm Purge Account'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Are you sure you want to permanently delete the account for{' '}
              <strong style={{ color: '#ffffff' }}>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>
            <div
              style={{
                padding: '0.875rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={18} />
              <span>This action is logged to the SOC activity audit log. Incident records will remain preserved.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
