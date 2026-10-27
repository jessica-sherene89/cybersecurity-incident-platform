import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UploadCloud, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import api from '../services/api';
import { INCIDENT_TYPES, SEVERITIES } from '../utils/constants';

const ReportIncident = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Suspicious Activity',
    severity: 'Medium',
    location: '',
    description: '',
  });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.location.trim() || !formData.description.trim()) {
      return setError('Please complete all required fields.');
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('severity', formData.severity);
      data.append('location', formData.location);
      data.append('description', formData.description);

      if (evidenceFile) {
        data.append('evidence', evidenceFile);
      }

      const res = await api.post('/incidents', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        const targetId = res.data.incident?._id || res.data.data?._id || res.data._id;
        navigate(`/incidents/${targetId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit incident report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.25rem' }}
      >
        <ArrowLeft size={16} />
        <span>Return to Previous View</span>
      </button>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} style={{ color: 'var(--accent-cyan)' }} />
          <span>Report Cybersecurity Incident</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          File a formal security anomaly, breach indicator, malware detection, or threat ticket for SOC triage
        </p>
      </div>

      <div className="cyber-card cyber-card-glow">
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
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Incident Title */}
          <div className="form-group">
            <label className="form-label">Incident Title *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Unauthorized SSH Brute Force Ingress Detected on Bastion Host"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* Category */}
            <div className="form-group">
              <label className="form-label">Incident Category *</label>
              <select
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleChange}
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div className="form-group">
              <label className="form-label">Assessed Severity *</label>
              <select
                name="severity"
                className="form-select"
                value={formData.severity}
                onChange={handleChange}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location / Affected System */}
          <div className="form-group">
            <label className="form-label">Affected Host / System Identifier / Subnet *</label>
            <input
              type="text"
              name="location"
              required
              placeholder="e.g. SRV-AUTH-01 (10.14.20.5), AWS-VPC-EAST-CLUSTER"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Observation & Indicators of Compromise (IoCs) *</label>
            <textarea
              name="description"
              required
              placeholder="Provide exact details: timestamps, observed anomalous behavior, affected services, hash values, suspicious IP addresses, impacted accounts..."
              className="form-textarea"
              style={{ minHeight: '140px' }}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Forensic Evidence Upload */}
          <div className="form-group">
            <label className="form-label">Attach Forensic Evidence Artifact (Optional)</label>
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '10px',
                padding: '1.75rem',
                textAlign: 'center',
                backgroundColor: 'rgba(9, 16, 31, 0.6)',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => document.getElementById('evidence-upload-input').click()}
            >
              <input
                id="evidence-upload-input"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <UploadCloud
                size={36}
                style={{ color: 'var(--accent-cyan)', margin: '0 auto 0.75rem' }}
              />
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                {evidenceFile ? evidenceFile.name : 'Select or drop forensic artifact'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Accepted formats: .log, .pcap, .txt, .pdf, .json, .csv, images (Max 25MB)
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <Send size={16} />
              <span>{loading ? 'Submitting to SOC...' : 'Dispatch Incident Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
