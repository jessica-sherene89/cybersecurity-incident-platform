import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Clock,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { formatDate } from '../utils/constants';

const ACTION_TYPES = [
  { value: '', label: 'All Event Types' },
  { value: 'INCIDENT_CREATED', label: 'Incident Created' },
  { value: 'INCIDENT_ASSIGNED', label: 'Incident Assigned' },
  { value: 'INCIDENT_STATUS_CHANGED', label: 'Status Changed' },
  { value: 'INCIDENT_UPDATED', label: 'Incident Updated' },
  { value: 'INCIDENT_DELETED', label: 'Incident Expunged' },
  { value: 'EVIDENCE_UPLOADED', label: 'Evidence Uploaded' },
  { value: 'EVIDENCE_DELETED', label: 'Evidence Deleted' },
  { value: 'ACTION_CREATED', label: 'Response Action Recorded' },
  { value: 'ACTION_STATUS_CHANGED', label: 'Action Status Updated' },
  { value: 'ACTION_DELETED', label: 'Response Action Cancelled' },
  { value: 'INVESTIGATION_NOTE_ADDED', label: 'Investigation Note Added' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_ROLE_CHANGED', label: 'User Role Changed' },
  { value: 'USER_STATUS_CHANGED', label: 'Account Status Changed' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'USER_LOGIN', label: 'User Login / Auth' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'PROFILE_UPDATED', label: 'Profile Updated' },
];

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/activity-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.logs || res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    fetchLogs(1);
  };

  const getActionBadge = (action) => {
    if (!action) return null;
    let bg = 'rgba(59, 130, 246, 0.15)';
    let text = '#60a5fa';
    let border = 'rgba(59, 130, 246, 0.3)';

    if (action.includes('CREATED') || action.includes('UPLOADED')) {
      bg = 'rgba(16, 185, 129, 0.15)';
      text = '#34d399';
      border = 'rgba(16, 185, 129, 0.3)';
    } else if (action.includes('DELETED')) {
      bg = 'rgba(239, 68, 68, 0.15)';
      text = '#ef4444';
      border = 'rgba(239, 68, 68, 0.3)';
    } else if (action.includes('STATUS') || action.includes('ASSIGNED')) {
      bg = 'rgba(245, 158, 11, 0.15)';
      text = '#f59e0b';
      border = 'rgba(245, 158, 11, 0.3)';
    } else if (action.includes('ROLE') || action.includes('SECURITY')) {
      bg = 'rgba(168, 85, 247, 0.15)';
      text = '#c084fc';
      border = 'rgba(168, 85, 247, 0.3)';
    } else if (action.includes('LOGIN')) {
      bg = 'rgba(6, 182, 212, 0.15)';
      text = '#06b6d4';
      border = 'rgba(6, 182, 212, 0.3)';
    }

    const cleanLabel = action.replace(/_/g, ' ');

    return (
      <span
        className="badge"
        style={{
          backgroundColor: bg,
          color: text,
          borderColor: border,
          fontSize: '0.6875rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {cleanLabel}
      </span>
    );
  };

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
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
            <History size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Immutable Platform Activity & Audit Logs</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Permanent, tamper-evident chronological event log tracking incident lifecycle, user provisioning, and operational response actions
          </p>
        </div>

        <button onClick={() => fetchLogs(pagination.page)} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Keyword Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Activity Logs</label>
            <div style={{ position: 'relative' }}>
              <Search
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
                type="text"
                placeholder="Search event description, operator, ticket ID..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="form-label">Event Category</label>
            <select
              className="form-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {ACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              title="Reset Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Activity Logs Table */}
      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Role</th>
                <th>Event Action</th>
                <th>Event Description</th>
                <th>Related Ticket</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div
                      className="pulse-dot"
                      style={{ width: '16px', height: '16px', backgroundColor: '#06b6d4', margin: '0 auto 0.5rem' }}
                    />
                    <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      RETRIEVING SECURITY AUDIT TRAIL...
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const actorName = log.userName || log.performedBy?.name || 'System Operator';
                  const actorRole = log.userRole || log.performedBy?.role || 'User';
                  const ticketId = log.incidentTicketId || log.incidentId?.incidentId;
                  const incidentMongoId = log.incidentId?._id || (typeof log.incidentId === 'string' ? log.incidentId : null);

                  return (
                    <tr key={log._id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDate(log.timestamp || log.createdAt)}
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
                      <td>{getActionBadge(log.action)}</td>
                      <td style={{ maxWidth: '380px', color: '#e2e8f0', fontSize: '0.875rem' }}>
                        {log.description}
                      </td>
                      <td>
                        {ticketId ? (
                          <Link
                            to={`/incidents/${incidentMongoId || ticketId}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8125rem',
                              color: 'var(--accent-cyan)',
                            }}
                          >
                            <span>{ticketId}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openLogDetails(log)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No audit activity records found matching query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            Showing page <strong style={{ color: '#ffffff' }}>{pagination.page}</strong> of{' '}
            <strong style={{ color: '#ffffff' }}>{pagination.pages || 1}</strong> ({pagination.total || 0} total events logged)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Security Audit Event Inspection"
        footer={
          <button className="btn btn-primary" onClick={() => setDetailModalOpen(false)}>
            Close Inspection
          </button>
        }
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '1rem',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {getActionBadge(selectedLog.action)}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  ID: {selectedLog._id}
                </span>
              </div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9375rem' }}>
                {selectedLog.description}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acting Operator</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                  {selectedLog.userName || selectedLog.performedBy?.name || 'System Operator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  Role: {selectedLog.userRole || selectedLog.performedBy?.role || 'User'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event Timestamp</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                  {formatDate(selectedLog.timestamp || selectedLog.createdAt)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(selectedLog.timestamp || selectedLog.createdAt).toISOString()}
                </div>
              </div>
            </div>

            {(selectedLog.incidentTicketId || selectedLog.incidentId) && (
              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Associated Incident</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {selectedLog.incidentTicketId || selectedLog.incidentId?.incidentId || 'Incident Reference'}
                  </span>
                  <Link
                    to={`/incidents/${selectedLog.incidentId?._id || selectedLog.incidentId}`}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <span>View Incident Docket</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Event Telemetry Context
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ActivityLogs;
