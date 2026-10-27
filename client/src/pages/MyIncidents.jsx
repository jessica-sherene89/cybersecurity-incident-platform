import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, Eye } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { formatDate } from '../utils/constants';

const MyIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyIncidents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/incidents/my-incidents');
        if (res.data.success) {
          const list = res.data.data || res.data.incidents || [];
          setIncidents(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load my incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIncidents();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <FileText size={26} style={{ color: 'var(--accent-cyan)' }} />
            <span>My Submitted Incidents</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track the investigation progress and resolution status of incidents reported by you
          </p>
        </div>

        <button
          onClick={() => navigate('/report-incident')}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>Report New Incident</span>
        </button>
      </div>

      <div className="cyber-card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Current Status</th>
                <th>Affected Host</th>
                <th>Reported At</th>
                <th>Assigned Analyst</th>
                <th style={{ textAlign: 'right' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="pulse-dot" style={{ width: '16px', height: '16px', backgroundColor: '#06b6d4', margin: '0 auto 0.5rem' }} />
                    <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      RETRIEVING PERSONAL INCIDENT REPORTS...
                    </div>
                  </td>
                </tr>
              ) : Array.isArray(incidents) && incidents.length > 0 ? (
                incidents.map((inc) => (
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
                    <td>
                      {inc.assignedTo ? (
                        <span style={{ color: '#e2e8f0' }}>{inc.assignedTo.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Pending assignment
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/incidents/${inc._id}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    You have not submitted any incident reports yet.
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

export default MyIncidents;
