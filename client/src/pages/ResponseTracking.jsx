import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  PlusCircle,
  RotateCcw,
  Eye,
  Trash2,
  Shield,
  Activity,
  PlayCircle,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/constants';

const ResponseTracking = () => {
  const [actions, setActions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [personFilter, setPersonFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState(null);

  // New Action Form
  const [newIncidentId, setNewIncidentId] = useState('');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionStatus, setNewActionStatus] = useState('Completed');
  const [newActionDetails, setNewActionDetails] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  const { isAdmin, isAnalyst } = useAuth();

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/actions');
      if (res.data.success) {
        const list = res.data.data || res.data.actions || [];
        setActions(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load response actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents?limit=100');
      if (res.data.success) {
        const list = res.data.data || res.data.incidents || [];
        setIncidents(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load incident options:', err);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchIncidents();
  }, []);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleToggleStatus = async (actionId, currentStatus) => {
    if (!isAnalyst && !isAdmin) return;
    const nextSt =
      currentStatus === 'Pending'
        ? 'In Progress'
        : currentStatus === 'In Progress'
        ? 'Completed'
        : 'Pending';

    try {
      const res = await api.put(`/actions/${actionId}`, { status: nextSt });
      if (res.data.success) {
        setActions(actions.map((a) => (a._id === actionId ? res.data.data || res.data.action : a)));
        showNotification('success', `Action status updated to [${nextSt}].`);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to update action status');
    }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!newIncidentId || !newActionTitle.trim()) {
      return alert('Please select an incident and enter an action title.');
    }

    setSubmittingAction(true);
    try {
      const res = await api.post(`/incidents/${newIncidentId}/actions`, {
        action: newActionTitle.trim(),
        status: newActionStatus,
        details: newActionDetails.trim(),
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        setNewIncidentId('');
        setNewActionTitle('');
        setNewActionDetails('');
        setNewActionStatus('Completed');
        showNotification('success', 'Response action recorded successfully.');
        fetchActions();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to record response action');
    } finally {
      setSubmittingAction(false);
    }
  };

  const confirmDeleteAction = async () => {
    if (!actionToDelete) return;
    try {
      const res = await api.delete(`/actions/${actionToDelete._id}`);
      if (res.data.success) {
        setDeleteModalOpen(false);
        setActionToDelete(null);
        showNotification('success', 'Response action removed.');
        fetchActions();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to remove action');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setIncidentFilter('');
    setPersonFilter('');
  };

  // Distinct responsible persons
  const distinctPersons = Array.from(
    new Set(actions.map((a) => a.performedBy?.name).filter(Boolean))
  );

  // Filter actions
  const filteredActions = actions.filter((a) => {
    const matchesSearch =
      !search ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      (a.details && a.details.toLowerCase().includes(search.toLowerCase())) ||
      (a.incidentId?.incidentId && a.incidentId.incidentId.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesIncident = !incidentFilter || a.incidentId?._id === incidentFilter;
    const matchesPerson = !personFilter || a.performedBy?.name === personFilter;

    return matchesSearch && matchesStatus && matchesIncident && matchesPerson;
  });

  const completedCount = actions.filter((a) => a.status === 'Completed').length;
  const inProgressCount = actions.filter((a) => a.status === 'In Progress').length;
  const pendingCount = actions.filter((a) => a.status === 'Pending').length;

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
            <ListTodo size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Playbook Response & Containment Actions</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Coordination board of host isolations, credential revocations, perimeter firewall blocks, and forensic triage tasks
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Metrics */}
          <span className="badge" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderColor: '#059669' }}>
            {completedCount} Completed
          </span>
          <span className="badge" style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', borderColor: '#d97706' }}>
            {inProgressCount} In Progress
          </span>
          <span className="badge" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', borderColor: '#64748b' }}>
            {pendingCount} Pending
          </span>

          {(isAdmin || isAnalyst) && (
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>
              <PlusCircle size={16} />
              <span>Record Response Action</span>
            </button>
          )}
        </div>
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

      {/* Filter and Search Bar */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Actions</label>
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
                placeholder="Search action summary, details, ticket ID..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Status Stage</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="form-label">Associated Incident</label>
            <select
              className="form-select"
              value={incidentFilter}
              onChange={(e) => setIncidentFilter(e.target.value)}
            >
              <option value="">All Incidents</option>
              {incidents.map((inc) => (
                <option key={inc._id} value={inc._id}>
                  {inc.incidentId} — {inc.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Responsible Person</label>
            <select
              className="form-select"
              value={personFilter}
              onChange={(e) => setPersonFilter(e.target.value)}
            >
              <option value="">All Operators</option>
              {distinctPersons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Action Table */}
      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Action ID</th>
                <th>Mitigation & Containment Action</th>
                <th>Associated Incident</th>
                <th>Responsible Operator</th>
                <th>Status</th>
                <th>Logged Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                      SYNCHRONIZING PLAYBOOK RESPONSE DOCKET...
                    </div>
                  </td>
                </tr>
              ) : filteredActions && filteredActions.length > 0 ? (
                filteredActions.map((act) => {
                  const statusColors = {
                    Completed: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#059669' },
                    'In Progress': { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: '#d97706' },
                    Pending: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#64748b' },
                  };
                  const st = statusColors[act.status] || statusColors.Pending;

                  return (
                    <tr key={act._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {act._id.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#ffffff', maxWidth: '300px' }}>
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedAction(act);
                            setDetailsModalOpen(true);
                          }}
                        >
                          {act.action}
                        </span>
                        {act.details && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {act.details.slice(0, 70)}{act.details.length > 70 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        {act.incidentId ? (
                          <Link
                            to={`/incidents/${act.incidentId._id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8125rem',
                              color: 'var(--accent-cyan)',
                            }}
                          >
                            <span>{act.incidentId.incidentId}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unlinked</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {act.performedBy?.name || 'SOC Operator'}
                      </td>
                      <td>
                        {(isAdmin || isAnalyst) ? (
                          <button
                            onClick={() => handleToggleStatus(act._id, act.status)}
                            className="badge"
                            style={{
                              backgroundColor: st.bg,
                              color: st.text,
                              borderColor: st.border,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="Click to advance status (Pending -> In Progress -> Completed)"
                          >
                            {act.status === 'Completed' ? (
                              <CheckCircle2 size={12} />
                            ) : act.status === 'In Progress' ? (
                              <Activity size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            <span>{act.status}</span>
                          </button>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: st.bg,
                              color: st.text,
                              borderColor: st.border,
                            }}
                          >
                            {act.status}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDate(act.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => {
                              setSelectedAction(act);
                              setDetailsModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="View Action Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setActionToDelete(act);
                                setDeleteModalOpen(true);
                              }}
                              className="btn btn-danger btn-sm"
                              title="Cancel / Remove Action"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No response actions found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record New Action Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Record Incident Response / Mitigation Action"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateAction}
              disabled={submittingAction || !newIncidentId || !newActionTitle.trim()}
            >
              {submittingAction ? 'Recording...' : 'Record Action'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Associated Incident Docket *</label>
            <select
              className="form-select"
              required
              value={newIncidentId}
              onChange={(e) => setNewIncidentId(e.target.value)}
            >
              <option value="">Select Target Incident...</option>
              {incidents.map((inc) => (
                <option key={inc._id} value={inc._id}>
                  {inc.incidentId} — {inc.title.slice(0, 42)}... [{inc.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Action Summary / Directive *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g., Firewall rule: Blocked C2 outbound connection to 198.51.100.42"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Action Status</label>
            <select
              className="form-select"
              value={newActionStatus}
              onChange={(e) => setNewActionStatus(e.target.value)}
            >
              <option value="Completed">Completed (Already Executed)</option>
              <option value="In Progress">In Progress (Active Work)</option>
              <option value="Pending">Pending (Scheduled Task)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Action Execution Notes & Technical Details</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Specify command lines, configuration tickets, affected network interfaces, or forensic verification..."
              value={newActionDetails}
              onChange={(e) => setNewActionDetails(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Inspect Action Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Response Action Specification"
        footer={
          <button className="btn btn-primary" onClick={() => setDetailsModalOpen(false)}>
            Close
          </button>
        }
      >
        {selectedAction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '1rem',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mitigation Directive</div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.0625rem', marginTop: '0.25rem' }}>
                {selectedAction.action}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status Stage</div>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    {selectedAction.status}
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Responsible Operator</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                  {selectedAction.performedBy?.name || 'SOC Operator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedAction.performedBy?.email}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Associated Incident Docket</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {selectedAction.incidentId?.incidentId}
                  </span>
                  <span style={{ color: '#ffffff', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {selectedAction.incidentId?.title}
                  </span>
                </div>
                {selectedAction.incidentId && (
                  <Link
                    to={`/incidents/${selectedAction.incidentId._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    <span>View Docket</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                Technical Execution Details
              </div>
              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  color: selectedAction.details ? '#e2e8f0' : 'var(--text-muted)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  fontStyle: selectedAction.details ? 'normal' : 'italic',
                }}
              >
                {selectedAction.details || 'No technical execution notes recorded for this action.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Cancel Response Action"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteAction}>
              Confirm Cancel
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Are you sure you want to remove response action{' '}
          <strong style={{ color: '#ef4444' }}>"{actionToDelete?.action}"</strong>?
          This action will be deleted from the incident playbook records.
        </p>
      </Modal>
    </div>
  );
};

export default ResponseTracking;
