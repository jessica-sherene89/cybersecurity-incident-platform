import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Eye, AlertOctagon } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDate } from '../utils/constants';

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await api.get('/incidents/my-assignments');
        if (res.data.success) {
          const list = res.data.data || res.data.incidents || [];
          setAssignments(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const criticalCount = (assignments || []).filter((a) => a.severity === 'Critical' || a.severity === 'High').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserCheck size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Analyst Investigation Workbench</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Active cybersecurity incidents assigned to your queue for forensic analysis and containment
          </p>
        </div>

        {criticalCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            <AlertOctagon size={16} />
            <span>{criticalCount} High/Critical Priority Queued</span>
          </div>
        )}
      </div>

      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Incident Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Current Status</th>
                <th>Target Host</th>
                <th>Reported At</th>
                <th>Reported By</th>
                <th style={{ textAlign: 'right' }}>Investigate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="pulse-dot" style={{ width: '16px', height: '16px', backgroundColor: '#06b6d4', margin: '0 auto 0.5rem' }} />
                    <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      LOADING ANALYST ASSIGNMENT QUEUE...
                    </div>
                  </td>
                </tr>
              ) : Array.isArray(assignments) && assignments.length > 0 ? (
                assignments.map((inc) => (
                  <tr key={inc._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {inc.incidentId}
                    </td>
                    <td style={{ fontWeight: 600 }}>{inc.title}</td>
                    <td>{inc.type}</td>
                    <td>
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td>
                      <StatusBadge status={inc.status} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {inc.location}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {formatDate(inc.reportedAt)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {inc.reportedBy?.name || 'Unknown'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/incidents/${inc._id}`)}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye size={14} />
                        <span>Open Docket</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No pending incident assignments in your queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAssignments;
