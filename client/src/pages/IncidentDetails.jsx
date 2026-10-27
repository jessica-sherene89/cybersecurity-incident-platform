import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  UserCheck,
  Clock,
  MapPin,
  FolderArchive,
  MessageSquare,
  ListTodo,
  History,
  Download,
  UploadCloud,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import WorkflowStepper from '../components/WorkflowStepper';
import Modal from '../components/Modal';
import { STATUSES, formatDate, formatFileSize } from '../utils/constants';

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAnalyst } = useAuth();

  const [incident, setIncident] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [notesList, setNotesList] = useState([]);
  const [actionsList, setActionsList] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newAction, setNewAction] = useState('');
  const [evidenceUploadFile, setEvidenceUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');

  const fetchIncidentFullData = async () => {
    setLoading(true);
    try {
      const [incRes, evRes, notesRes, actRes] = await Promise.all([
        api.get(`/incidents/${id}`),
        api.get(`/incidents/${id}/evidence`),
        api.get(`/incidents/${id}/notes`),
        api.get(`/incidents/${id}/actions`),
      ]);

      if (incRes.data.success) setIncident(incRes.data.data || incRes.data.incident);
      if (evRes.data.success) {
        const ev = evRes.data.data || evRes.data.evidence || [];
        setEvidenceList(Array.isArray(ev) ? ev : []);
      }
      if (notesRes.data.success) {
        const notes = notesRes.data.data || notesRes.data.notes || [];
        setNotesList(Array.isArray(notes) ? notes : []);
      }
      if (actRes.data.success) {
        const acts = actRes.data.data || actRes.data.actions || [];
        setActionsList(Array.isArray(acts) ? acts : []);
      }
    } catch (err) {
      console.error('Failed to load incident details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysts = async () => {
    if (isAdmin) {
      try {
        const res = await api.get('/users/analysts');
        if (res.data.success) {
          const analysts = res.data.data || res.data.users || res.data.analysts || [];
          setAnalysts(Array.isArray(analysts) ? analysts : []);
        }
      } catch (err) {
        console.error('Failed to load analysts:', err);
      }
    }
  };

  useEffect(() => {
    fetchIncidentFullData();
    fetchAnalysts();
  }, [id]);

  const handleStatusChangeRequest = (status) => {
    if (!isAnalyst) return;
    setNextStatus(status);
    setStatusComment('');
    setStatusModalOpen(true);
  };

  const submitStatusTransition = async () => {
    try {
      const res = await api.put(`/incidents/${id}`, {
        status: nextStatus,
        comment: statusComment,
      });
      if (res.data.success) {
        setStatusModalOpen(false);
        fetchIncidentFullData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status transition failed');
    }
  };

  const submitAnalystAssignment = async () => {
    if (!selectedAnalystId) return;
    try {
      const res = await api.put(`/incidents/${id}/assign`, {
        analystId: selectedAnalystId,
      });
      if (res.data.success) {
        setAssignModalOpen(false);
        fetchIncidentFullData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await api.post(`/incidents/${id}/notes`, { note: newNote });
      if (res.data.success) {
        setNewNote('');
        setNotesList([res.data.data, ...notesList]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    }
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!newAction.trim()) return;

    try {
      const res = await api.post(`/incidents/${id}/actions`, { action: newAction });
      if (res.data.success) {
        setNewAction('');
        setActionsList([res.data.data, ...actionsList]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add action');
    }
  };

  const handleToggleActionStatus = async (actionId, currentStatus) => {
    const nextSt =
      currentStatus === 'Pending'
        ? 'In Progress'
        : currentStatus === 'In Progress'
        ? 'Completed'
        : 'Pending';

    try {
      const res = await api.put(`/actions/${actionId}`, { status: nextSt });
      if (res.data.success) {
        setActionsList(
          actionsList.map((a) => (a._id === actionId ? res.data.data : a))
        );
      }
    } catch (err) {
      alert('Failed to update action');
    }
  };

  const handleEvidenceUpload = async (e) => {
    e.preventDefault();
    if (!evidenceUploadFile) return;

    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', evidenceUploadFile);

      const res = await api.post(`/incidents/${id}/evidence`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setEvidenceUploadFile(null);
        setEvidenceList([res.data.data, ...evidenceList]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading || !incident) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ width: '20px', height: '20px', backgroundColor: '#06b6d4', margin: '0 auto 1rem' }} />
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            LOADING INCIDENT COCKPIT...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Return button */}
      <button onClick={() => navigate('/incidents')} className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
        <ArrowLeft size={16} />
        <span>Return to Incident Inventory</span>
      </button>

      {/* Incident Header Cockpit */}
      <div className="cyber-card cyber-card-glow" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {incident.incidentId}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1' }}>
                {incident.type}
              </span>
            </div>
            <h1 style={{ fontSize: '1.625rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              {incident.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>Host: <strong style={{ color: '#ffffff' }}>{incident.location}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Clock size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span>Reported: {formatDate(incident.reportedAt)}</span>
              </div>
              <div>
                Reported by: <strong style={{ color: '#ffffff' }}>{incident.reportedBy?.name}</strong> ({incident.reportedBy?.department})
              </div>
            </div>
          </div>

          {/* Assigned Analyst & Assignment Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
            <div
              style={{
                background: 'rgba(9, 16, 31, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}
            >
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assigned Security Analyst
              </div>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
                {incident.assignedTo ? incident.assignedTo.name : 'Unassigned'}
              </div>
              {incident.assignedTo && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  {incident.assignedTo.email}
                </div>
              )}
            </div>

            {isAdmin && (
              <button onClick={() => setAssignModalOpen(true)} className="btn btn-outline btn-sm">
                <UserCheck size={14} />
                <span>{incident.assignedTo ? 'Reassign Analyst' : 'Assign Analyst'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Stepper */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Incident Lifecycle Stage
            </span>
            {isAnalyst && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                Click any stage or step to trigger workflow transition
              </span>
            )}
          </div>

          <WorkflowStepper
            currentStatus={incident.status}
            onStatusChange={handleStatusChangeRequest}
            canEdit={isAnalyst}
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
        {[
          { id: 'overview', label: 'Details & History', icon: History, count: incident.statusHistory?.length },
          { id: 'evidence', label: 'Forensic Evidence', icon: FolderArchive, count: evidenceList.length },
          { id: 'notes', label: 'Investigation Notes', icon: MessageSquare, count: notesList.length },
          { id: 'actions', label: 'Response Actions', icon: ListTodo, count: actionsList.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px 8px 0 0',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-subtle) var(--border-subtle) transparent var(--border-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Audit History */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div className="cyber-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#ffffff' }}>Description & Indicators</h3>
            <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.875rem' }}>
              {incident.description}
            </p>
          </div>

          <div className="cyber-card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#ffffff' }}>Lifecycle Audit Trail</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incident.statusHistory && incident.statusHistory.length > 0 ? (
                incident.statusHistory.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: '2px solid var(--accent-cyan)',
                      paddingLeft: '1rem',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <StatusBadge status={h.status} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(h.updatedAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Updated by: <strong style={{ color: '#ffffff' }}>{h.updatedBy?.name || 'SOC System'}</strong>
                    </div>
                    {h.comment && (
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        "{h.comment}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No history records yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Forensic Evidence */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upload New Evidence Form */}
          {isAnalyst && (
            <div className="cyber-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#ffffff' }}>Upload Forensic Artifact</h3>
              <form onSubmit={handleEvidenceUpload} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  required
                  onChange={(e) => setEvidenceUploadFile(e.target.files[0])}
                  className="form-input"
                  style={{ flex: 1, minWidth: '240px' }}
                />
                <button type="submit" disabled={uploadLoading || !evidenceUploadFile} className="btn btn-primary">
                  <UploadCloud size={16} />
                  <span>{uploadLoading ? 'Uploading...' : 'Attach to Docket'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Evidence List */}
          <div className="cyber-card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.length > 0 ? (
                    evidenceList.map((ev) => (
                      <tr key={ev._id}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span>{ev.fileName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            {ev.fileType || 'binary'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {formatFileSize(ev.fileSize)}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{ev.uploadedBy?.name || 'Unknown'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(ev.uploadedAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <a
                            href={ev.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            download
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No forensic artifacts uploaded for this incident yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Investigation Notes */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isAnalyst && (
            <div className="cyber-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#ffffff' }}>Add Investigation Finding / Note</h3>
              <form onSubmit={handleAddNote}>
                <textarea
                  required
                  placeholder="Record forensic analysis details, memory dump strings, reverse engineering notes, or threat intelligence attribution..."
                  className="form-textarea"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={14} />
                    <span>Post Investigation Note</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notesList.length > 0 ? (
              notesList.map((note) => (
                <div key={note._id} className="cyber-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {note.addedBy?.name ? note.addedBy.name.charAt(0) : 'A'}
                      </div>
                      <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.875rem' }}>
                        {note.addedBy?.name}
                      </span>
                      <span className="badge" style={{ fontSize: '0.625rem', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                        {note.addedBy?.role}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {note.note}
                  </p>
                </div>
              ))
            ) : (
              <div className="cyber-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                No investigation notes logged yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Response Actions */}
      {activeTab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isAnalyst && (
            <div className="cyber-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#ffffff' }}>Add Containment or Response Action</h3>
              <form onSubmit={handleAddAction} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block C2 IP 198.51.100.42 on perimeter Palo Alto firewall"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Add Action</span>
                </button>
              </form>
            </div>
          )}

          <div className="cyber-card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Status</th>
                    <th>Action Checklist Item</th>
                    <th>Recorded By</th>
                    <th>Logged At</th>
                    <th style={{ textAlign: 'right' }}>Toggle State</th>
                  </tr>
                </thead>
                <tbody>
                  {actionsList.length > 0 ? (
                    actionsList.map((action) => {
                      const isDone = action.status === 'Completed';
                      const isInProg = action.status === 'In Progress';
                      return (
                        <tr key={action._id}>
                          <td>
                            <CheckCircle2
                              size={18}
                              style={{
                                color: isDone ? '#10b981' : isInProg ? '#f59e0b' : '#64748b',
                              }}
                            />
                          </td>
                          <td style={{ fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-muted)' : '#ffffff' }}>
                            {action.action}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{action.performedBy?.name || 'SOC Analyst'}</td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{formatDate(action.createdAt)}</td>
                          <td style={{ textAlign: 'right' }}>
                            {isAnalyst ? (
                              <button
                                onClick={() => handleToggleActionStatus(action._id, action.status)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  borderColor: isDone ? '#059669' : isInProg ? '#d97706' : 'var(--border-subtle)',
                                }}
                              >
                                {action.status}
                              </button>
                            ) : (
                              <span className="badge">{action.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No response playbook actions assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analyst Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Security Analyst"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitAnalystAssignment} disabled={!selectedAnalystId}>
              Confirm Assignment
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Select Security Analyst</label>
          <select
            className="form-select"
            value={selectedAnalystId}
            onChange={(e) => setSelectedAnalystId(e.target.value)}
          >
            <option value="">-- Choose Analyst --</option>
            {analysts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.email}) - {a.department}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Status Transition Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Advance Status to ${nextStatus}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitStatusTransition}>
              Commit Status Change
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Transitioning incident from <strong style={{ color: '#ffffff' }}>{incident.status}</strong> to{' '}
          <strong style={{ color: 'var(--accent-cyan)' }}>{nextStatus}</strong>.
        </p>
        <div className="form-group">
          <label className="form-label">Audit History Comment / Rationale</label>
          <textarea
            placeholder="e.g., Containment firewall rule verified. Host quarantined."
            className="form-textarea"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default IncidentDetails;
