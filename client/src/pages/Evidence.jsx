import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderArchive,
  Download,
  FileText,
  ExternalLink,
  Search,
  Filter,
  RotateCcw,
  UploadCloud,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileCode,
  HardDrive,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatFileSize } from '../utils/constants';

const Evidence = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState(null);

  // Upload Form State
  const [uploadIncidentId, setUploadIncidentId] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Feedback Toast
  const [feedback, setFeedback] = useState(null);

  const { isAdmin, isAnalyst } = useAuth();

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evidence');
      if (res.data.success) {
        const list = res.data.data || res.data.evidence || [];
        setEvidenceList(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to load global evidence repository:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentsForUpload = async () => {
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
    fetchEvidence();
    fetchIncidentsForUpload();
  }, []);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleResetFilters = () => {
    setSearch('');
    setIncidentFilter('');
    setTypeFilter('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadIncidentId) {
      return alert('Please select an associated incident docket.');
    }
    if (!uploadFile) {
      return alert('Please select a file to upload.');
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadDescription) {
        formData.append('description', uploadDescription);
      }

      const res = await api.post(`/incidents/${uploadIncidentId}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadModalOpen(false);
        setUploadIncidentId('');
        setUploadDescription('');
        setUploadFile(null);
        showNotification('success', 'Forensic artifact securely deposited into Vault.');
        fetchEvidence();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Evidence upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!evidenceToDelete) return;
    try {
      const res = await api.delete(`/evidence/${evidenceToDelete._id}`);
      if (res.data.success) {
        setDeleteModalOpen(false);
        setEvidenceToDelete(null);
        showNotification('success', 'Artifact expunged from digital vault.');
        fetchEvidence();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to delete evidence.');
    }
  };

  // Filter evidence list in memory
  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch =
      !search ||
      ev.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (ev.originalName && ev.originalName.toLowerCase().includes(search.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(search.toLowerCase())) ||
      (ev.incidentId?.incidentId && ev.incidentId.incidentId.toLowerCase().includes(search.toLowerCase()));

    const matchesIncident = !incidentFilter || ev.incidentId?._id === incidentFilter;

    const matchesType = !typeFilter || (ev.fileType && ev.fileType.toLowerCase().includes(typeFilter.toLowerCase()));

    return matchesSearch && matchesIncident && matchesType;
  });

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
            <FolderArchive size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Digital Forensic Evidence Vault</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Centralized chain-of-custody repository storing packet captures, system auth logs, memory dumps, and indicators of compromise
          </p>
        </div>

        {(isAdmin || isAnalyst) && (
          <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
            <UploadCloud size={16} />
            <span>Deposit Forensic Artifact</span>
          </button>
        )}
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
            <label className="form-label">Search Artifacts</label>
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
                placeholder="Search file name, description, ticket ID..."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter by Incident</label>
            <select
              className="form-select"
              value={incidentFilter}
              onChange={(e) => setIncidentFilter(e.target.value)}
            >
              <option value="">All Incident Dockets</option>
              {incidents.map((inc) => (
                <option key={inc._id} value={inc._id}>
                  {inc.incidentId} — {inc.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Artifact Format</label>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Formats</option>
              <option value="text">Text / Logs (.log, .txt)</option>
              <option value="json">JSON Metadata</option>
              <option value="image">Screenshots / Images</option>
              <option value="pdf">PDF Analysis</option>
              <option value="octet-stream">Binary / PCAP Dump</option>
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
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Artifact File Name</th>
                <th>File Format</th>
                <th>Size</th>
                <th>Associated Incident</th>
                <th>Collected By</th>
                <th>Upload Date</th>
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
                      INDEXING DIGITAL FORENSIC VAULT...
                    </div>
                  </td>
                </tr>
              ) : filteredEvidence && filteredEvidence.length > 0 ? (
                filteredEvidence.map((ev) => (
                  <tr key={ev._id}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                        <span
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedEvidence(ev);
                            setDetailsModalOpen(true);
                          }}
                        >
                          {ev.originalName || ev.fileName}
                        </span>
                      </div>
                      {ev.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {ev.description.slice(0, 60)}{ev.description.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ev.fileType ? ev.fileType.split('/')[1] || ev.fileType : 'artifact'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {formatFileSize(ev.fileSize)}
                    </td>
                    <td>
                      {ev.incidentId ? (
                        <Link
                          to={`/incidents/${ev.incidentId._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8125rem',
                            color: 'var(--accent-cyan)',
                          }}
                        >
                          <span>{ev.incidentId.incidentId}</span>
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unlinked</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {ev.uploadedBy?.name || 'SOC Operator'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {formatDate(ev.uploadedAt || ev.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                        {/* View Artifact Details */}
                        <button
                          onClick={() => {
                            setSelectedEvidence(ev);
                            setDetailsModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Inspect Evidence Metadata"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Download Artifact */}
                        <a
                          href={ev.filePath}
                          download={ev.originalName || ev.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Download Evidence File"
                          style={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Download size={14} />
                        </a>

                        {/* Admin Delete Artifact */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setEvidenceToDelete(ev);
                              setDeleteModalOpen(true);
                            }}
                            className="btn btn-danger btn-sm"
                            title="Purge Evidence Artifact"
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No forensic evidence records found in vault.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Artifact Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Forensic Evidence Inspection"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {selectedEvidence && (
              <a
                href={selectedEvidence.filePath}
                download={selectedEvidence.originalName || selectedEvidence.fileName}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={16} />
                <span>Download Forensic File</span>
              </a>
            )}
            <button className="btn btn-secondary" onClick={() => setDetailsModalOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        {selectedEvidence && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                padding: '1rem',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Artifact Original Name</div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.125rem', marginTop: '0.25rem' }}>
                {selectedEvidence.originalName || selectedEvidence.fileName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                Stored File: {selectedEvidence.fileName}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Size</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {formatFileSize(selectedEvidence.fileSize)} ({selectedEvidence.fileSize} bytes)
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MIME File Type</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedEvidence.fileType}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Associated Incident Docket</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {selectedEvidence.incidentId?.incidentId}
                  </span>
                  <span style={{ color: '#ffffff', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {selectedEvidence.incidentId?.title}
                  </span>
                </div>
                {selectedEvidence.incidentId && (
                  <Link
                    to={`/incidents/${selectedEvidence.incidentId._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    <span>View Docket</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deposited By</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                  {selectedEvidence.uploadedBy?.name || 'SOC Operator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedEvidence.uploadedBy?.email}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.875rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deposit Date</div>
                <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.25rem' }}>
                  {formatDate(selectedEvidence.uploadedAt || selectedEvidence.createdAt)}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
                Forensic Analysis Notes / Description
              </div>
              <div
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  color: selectedEvidence.description ? '#e2e8f0' : 'var(--text-muted)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  fontStyle: selectedEvidence.description ? 'normal' : 'italic',
                }}
              >
                {selectedEvidence.description || 'No additional forensic description recorded for this artifact.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Deposit Forensic Artifact Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Deposit Forensic Artifact into Vault"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUploadSubmit}
              disabled={uploadLoading || !uploadIncidentId || !uploadFile}
            >
              {uploadLoading ? 'Depositing...' : 'Upload Artifact'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Associated Incident Docket *</label>
            <select
              className="form-select"
              required
              value={uploadIncidentId}
              onChange={(e) => setUploadIncidentId(e.target.value)}
            >
              <option value="">Select Target Incident...</option>
              {incidents.map((inc) => (
                <option key={inc._id} value={inc._id}>
                  {inc.incidentId} — {inc.title.slice(0, 40)} [{inc.severity}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Artifact File *</label>
            <input
              type="file"
              className="form-input"
              required
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Accepts log files (.log, .txt), JSON indicators, packet traces, memory captures, or PDF summaries (Max: 10MB)
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Forensic Description / Investigation Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detail indicators of compromise, source endpoint, extraction timestamp, or cryptographic hash..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Purge Forensic Artifact"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Confirm Purge
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete artifact{' '}
          <strong style={{ color: '#ef4444' }}>{evidenceToDelete?.originalName || evidenceToDelete?.fileName}</strong>?
          This will expunge the forensic file from the server storage and audit records.
        </p>
      </Modal>
    </div>
  );
};

export default Evidence;
