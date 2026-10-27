import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  FolderArchive,
  ListTodo,
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { INCIDENT_TYPES, SEVERITIES, STATUSES, formatDate } from '../utils/constants';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [analysts, setAnalysts] = useState([]);

  // Filters state
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [sort, setSort] = useState('-createdAt');

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);

  // Quick Assignment modal state (Admin)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [incidentToAssign, setIncidentToAssign] = useState(null);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Quick Status update modal state (Admin & Analyst)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [incidentToUpdate, setIncidentToUpdate] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const { isAdmin, isAnalyst } = useAuth();
  const navigate = useNavigate();

  const fetchAnalysts = async () => {
    try {
      const res = await api.get('/users/analysts');
      if (res.data.success) {
        const list = res.data.analysts || res.data.data || [];
        setAnalysts(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load analysts for filter:', err);
    }
  };

  const fetchIncidents = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      params.append('sort', sort);
      if (search) params.append('search', search);
      if (severity) params.append('severity', severity);
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (assignedTo) params.append('assignedTo', assignedTo);

      const res = await api.get(`/incidents?${params.toString()}`);
      if (res.data.success) {
        const list = res.data.data || res.data.incidents || [];
        setIncidents(Array.isArray(list) ? list : []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page || 1,
            limit: res.data.pagination.limit || 10,
            total: res.data.total || res.data.count || 0,
            pages: res.data.pagination.pages || 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysts();
  }, []);

  useEffect(() => {
    fetchIncidents(1);
  }, [severity, type, status, assignedTo, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSeverity('');
    setType('');
    setStatus('');
    setAssignedTo('');
    setSort('-createdAt');
    fetchIncidents(1);
  };

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Assignment Modal handler
  const openAssignModal = (inc) => {
    setIncidentToAssign(inc);
    setSelectedAnalystId(inc.assignedTo?._id || '');
    setAssignModalOpen(true);
  };

  const submitAssignment = async () => {
    if (!incidentToAssign || !selectedAnalystId) return;
    setAssignLoading(true);
    try {
      const res = await api.put(`/incidents/${incidentToAssign._id}/assign`, {
        analystId: selectedAnalystId,
      });
      if (res.data.success) {
        setAssignModalOpen(false);
        showNotification('success', `Incident ${incidentToAssign.incidentId} assigned successfully.`);
        fetchIncidents(pagination.page);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to assign incident.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Status Modal handler
  const openStatusModal = (inc) => {
    setIncidentToUpdate(inc);
    setTargetStatus(inc.status);
    setStatusComment('');
    setStatusModalOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!incidentToUpdate || !targetStatus) return;
    setStatusLoading(true);
    try {
      const res = await api.put(`/incidents/${incidentToUpdate._id}`, {
        status: targetStatus,
        comment: statusComment || `Status updated to ${targetStatus} via Incident Inventory.`,
      });
      if (res.data.success) {
        setStatusModalOpen(false);
        showNotification('success', `Incident ${incidentToUpdate.incidentId} updated to [${targetStatus}].`);
        fetchIncidents(pagination.page);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!incidentToDelete) return;
    try {
      await api.delete(`/incidents/${incidentToDelete._id}`);
      setDeleteModalOpen(false);
      showNotification('success', `Incident ${incidentToDelete.incidentId} permanently removed.`);
      setIncidentToDelete(null);
      fetchIncidents(pagination.page);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to delete incident.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <Shield size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Cybersecurity Incident Inventory</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Central administrative console to triage, assign, investigate, and remediate organization-wide security threats
          </p>
        </div>

        <button
          onClick={() => navigate('/report-incident')}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            backgroundColor:
              feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Search box */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Query</label>
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
                placeholder="Search ticket ID, title, affected host..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Severity filter */}
          <div>
            <label className="form-label">Severity</label>
            <select
              className="form-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Categories</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="form-label">Lifecycle Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Analyst filter */}
          <div>
            <label className="form-label">Assigned Analyst</label>
            <select
              className="form-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">All Personnel</option>
              {analysts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting filter */}
          <div>
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="-createdAt">Newest Reported</option>
              <option value="createdAt">Oldest Reported</option>
              <option value="-updatedAt">Recently Updated</option>
              <option value="title">Title (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Action buttons */}
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

      {/* Incident List Table */}
      <div className="cyber-card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Incident Summary</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Assigned Analyst</th>
                <th>Reported Date</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div
                      className="pulse-dot"
                      style={{ width: '16px', height: '16px', backgroundColor: '#06b6d4', margin: '0 auto 0.5rem' }}
                    />
                    <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      SCANNING INCIDENT DATABASE...
                    </div>
                  </td>
                </tr>
              ) : incidents.length > 0 ? (
                incidents.map((inc) => (
                  <tr key={inc._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
                      {inc.incidentId}
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: '240px' }}>
                      <span
                        style={{ cursor: 'pointer', color: '#ffffff' }}
                        onClick={() => navigate(`/incidents/${inc._id}`)}
                      >
                        {inc.title}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        Host: {inc.location}
                      </div>
                    </td>
                    <td>{inc.type}</td>
                    <td>
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td>
                      <StatusBadge status={inc.status} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {inc.reportedBy?.name || 'Unknown'}
                    </td>
                    <td>
                      {inc.assignedTo ? (
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{inc.assignedTo.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {formatDate(inc.reportedAt || inc.createdAt)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {formatDate(inc.updatedAt || inc.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                        {/* View Incident Details */}
                        <button
                          onClick={() => navigate(`/incidents/${inc._id}`)}
                          className="btn btn-secondary btn-sm"
                          title="Open Full Incident Docket"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Admin: Quick Reassign */}
                        {isAdmin && (
                          <button
                            onClick={() => openAssignModal(inc)}
                            className="btn btn-secondary btn-sm"
                            title="Assign / Reassign Security Analyst"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            <UserCheck size={14} />
                          </button>
                        )}

                        {/* Admin / Analyst: Quick Status Change */}
                        {(isAdmin || isAnalyst) && (
                          <button
                            onClick={() => openStatusModal(inc)}
                            className="btn btn-secondary btn-sm"
                            title="Update Lifecycle Status"
                            style={{ color: '#f59e0b' }}
                          >
                            <Clock size={14} />
                          </button>
                        )}

                        {/* Admin: Purge / Delete */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIncidentToDelete(inc);
                              setDeleteModalOpen(true);
                            }}
                            className="btn btn-danger btn-sm"
                            title="Purge Incident"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No incident records match the specified filters.
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
            <strong style={{ color: '#ffffff' }}>{pagination.pages || 1}</strong> ({pagination.total || 0} total tickets)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchIncidents(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => fetchIncidents(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Incident to Security Analyst"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={submitAssignment}
              disabled={assignLoading || !selectedAnalystId}
            >
              {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Assigning incident ticket <strong style={{ color: '#ffffff' }}>{incidentToAssign?.incidentId}</strong> ({incidentToAssign?.title}).
        </p>

        <div className="form-group">
          <label className="form-label">Designated SOC Analyst</label>
          <select
            className="form-select"
            value={selectedAnalystId}
            onChange={(e) => setSelectedAnalystId(e.target.value)}
          >
            <option value="">Select Security Analyst...</option>
            {analysts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {a.department || 'SOC Operations'} ({a.email})
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Quick Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Advance Incident Lifecycle Status"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={submitStatusUpdate}
              disabled={statusLoading || !targetStatus}
            >
              {statusLoading ? 'Updating...' : 'Update Status'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Transitioning workflow stage for <strong style={{ color: '#ffffff' }}>{incidentToUpdate?.incidentId}</strong>.
        </p>

        <div className="form-group">
          <label className="form-label">Target Status Stage</label>
          <select
            className="form-select"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Audit Transition Comment</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Document rationale, containment actions, or triage notes for the audit trail..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Incident Expungement"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Permanently Expunge
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete incident{' '}
          <strong style={{ color: '#ef4444' }}>{incidentToDelete?.incidentId}</strong> — "{incidentToDelete?.title}"?
          This will cascade delete all attached forensic evidence, investigation notes, and playbook response actions.
        </p>
      </Modal>
    </div>
  );
};

export default Incidents;
