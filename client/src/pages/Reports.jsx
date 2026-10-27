import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/constants';

const Reports = () => {
  const [incidents, setIncidents] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRangePreset, setDateRangePreset] = useState('30days'); // 7days, 30days, 90days, ytd, all, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch all incidents and analyst roster from backend
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [incRes, userRes] = await Promise.all([
        api.get('/incidents?limit=500'),
        api.get('/users?role=Analyst').catch(() => ({ data: { data: [] } })),
      ]);

      if (incRes.data.success) {
        const raw = incRes.data.data || incRes.data.incidents || [];
        setIncidents(Array.isArray(raw) ? raw : []);
      }

      if (userRes.data?.success) {
        const rawUsers = userRes.data.data || userRes.data.users || [];
        setAnalysts(Array.isArray(rawUsers) ? rawUsers : []);
      }
    } catch (err) {
      console.error('Failed to load telemetry dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Compute effective date boundary
  const dateBoundary = useMemo(() => {
    const now = new Date();
    let start = null;
    let end = new Date();

    if (dateRangePreset === '7days') {
      start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateRangePreset === '30days') {
      start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (dateRangePreset === '90days') {
      start = new Date();
      start.setDate(now.getDate() - 90);
      start.setHours(0, 0, 0, 0);
    } else if (dateRangePreset === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    } else if (dateRangePreset === 'custom') {
      if (customStartDate) start = new Date(customStartDate);
      if (customEndDate) {
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
      // 'all'
      start = null;
    }

    return { start, end };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Filter incidents by date boundary & optional search
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const incDate = new Date(inc.createdAt || inc.reportedAt);
      if (dateBoundary.start && incDate < dateBoundary.start) return false;
      if (dateBoundary.end && incDate > dateBoundary.end) return false;

      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesId = (inc.incidentId || '').toLowerCase().includes(q);
        const matchesTitle = (inc.title || '').toLowerCase().includes(q);
        const matchesType = (inc.type || '').toLowerCase().includes(q);
        const matchesLocation = (inc.location || '').toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesType && !matchesLocation) return false;
      }

      return true;
    });
  }, [incidents, dateBoundary, searchFilter]);

  // Real database metrics aggregations
  const totalCount = filteredIncidents.length;

  const resolvedCount = filteredIncidents.filter((inc) =>
    ['Resolved', 'Closed'].includes(inc.status)
  ).length;

  const unresolvedCount = totalCount - resolvedCount;

  const criticalCount = filteredIncidents.filter((inc) => inc.severity === 'Critical').length;
  const highCount = filteredIncidents.filter((inc) => inc.severity === 'High').length;
  const mediumCount = filteredIncidents.filter((inc) => inc.severity === 'Medium').length;
  const lowCount = filteredIncidents.filter((inc) => inc.severity === 'Low').length;

  const unassignedCount = filteredIncidents.filter((inc) => !inc.assignedTo).length;

  const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : '0';

  // Group by Severity
  const severityBreakdown = [
    { label: 'Critical', count: criticalCount, color: '#ef4444' },
    { label: 'High', count: highCount, color: '#f97316' },
    { label: 'Medium', count: mediumCount, color: '#f59e0b' },
    { label: 'Low', count: lowCount, color: '#10b981' },
  ];

  // Group by Status
  const statusOrder = ['Reported', 'Under Review', 'Assigned', 'Investigating', 'Contained', 'Resolved', 'Closed'];
  const statusBreakdown = statusOrder.map((statusKey) => {
    const count = filteredIncidents.filter((inc) => inc.status === statusKey).length;
    return {
      label: statusKey,
      count,
      pct: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0',
    };
  });

  // Group by Category / Type
  const categoryCounts = filteredIncidents.reduce((acc, inc) => {
    const cat = inc.type || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({
      category: cat,
      count,
      pct: totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0',
    }));

  // Timeline Trend (Day buckets for recent, or Week/Month buckets)
  const timelineBuckets = useMemo(() => {
    if (filteredIncidents.length === 0) return [];

    const map = {};
    filteredIncidents.forEach((inc) => {
      const d = new Date(inc.createdAt || inc.reportedAt);
      const dateKey = d.toISOString().slice(0, 10);
      map[dateKey] = (map[dateKey] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14) // Display last 14 active days
      .map(([date, count]) => ({ date, count }));
  }, [filteredIncidents]);

  // Analyst Workload & Assignment Distribution
  const analystWorkload = useMemo(() => {
    const workloadMap = {};

    // Initialize all known analysts
    analysts.forEach((a) => {
      workloadMap[a._id] = {
        id: a._id,
        name: a.name,
        email: a.email,
        department: a.department || 'SOC Operations',
        total: 0,
        active: 0,
        resolved: 0,
      };
    });

    // Unassigned bucket
    const unassignedBucket = {
      id: 'unassigned',
      name: 'Unassigned Queue',
      email: 'soc-triage@cyberguardsoc.local',
      department: 'Triage Ingestion',
      total: 0,
      active: 0,
      resolved: 0,
    };

    filteredIncidents.forEach((inc) => {
      const assignedUser = inc.assignedTo;
      const isClosed = ['Resolved', 'Closed'].includes(inc.status);

      if (!assignedUser) {
        unassignedBucket.total++;
        if (isClosed) unassignedBucket.resolved++;
        else unassignedBucket.active++;
      } else {
        const uid = assignedUser._id || assignedUser;
        if (!workloadMap[uid]) {
          workloadMap[uid] = {
            id: uid,
            name: assignedUser.name || 'Analyst',
            email: assignedUser.email || '',
            department: assignedUser.department || 'Incident Response',
            total: 0,
            active: 0,
            resolved: 0,
          };
        }
        workloadMap[uid].total++;
        if (isClosed) workloadMap[uid].resolved++;
        else workloadMap[uid].active++;
      }
    });

    const list = Object.values(workloadMap).sort((a, b) => b.total - a.total);
    if (unassignedBucket.total > 0) {
      list.push(unassignedBucket);
    }
    return list;
  }, [filteredIncidents, analysts]);

  // Export Filtered Dataset to CSV (Safely, no secrets)
  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) {
      alert('No incident records to export for the selected filter.');
      return;
    }

    const headers = [
      'Incident ID',
      'Title',
      'Category',
      'Severity',
      'Status',
      'Affected System / Location',
      'Reported By Name',
      'Reported By Email',
      'Assigned Analyst Name',
      'Assigned Analyst Email',
      'Reported Timestamp',
      'Last Updated Timestamp',
    ];

    const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

    const rows = filteredIncidents.map((inc) => [
      escapeCsv(inc.incidentId),
      escapeCsv(inc.title),
      escapeCsv(inc.type),
      escapeCsv(inc.severity),
      escapeCsv(inc.status),
      escapeCsv(inc.location),
      escapeCsv(inc.reportedBy?.name || 'Unknown'),
      escapeCsv(inc.reportedBy?.email || 'N/A'),
      escapeCsv(inc.assignedTo?.name || 'Unassigned'),
      escapeCsv(inc.assignedTo?.email || 'N/A'),
      escapeCsv(inc.createdAt || inc.reportedAt || ''),
      escapeCsv(inc.updatedAt || inc.createdAt || ''),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const presetLabel = dateRangePreset.toUpperCase();
    link.setAttribute(
      'download',
      `CyberGuard_SOC_Incident_Report_${presetLabel}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
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
            <BarChart3 size={28} style={{ color: 'var(--accent-cyan)' }} />
            <span>Reports & Security Analytics</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Multi-dimensional SOC telemetry, triage distributions, resolution velocity, and analyst workload
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }} className="no-print">
          <button onClick={fetchReportData} className="btn btn-secondary btn-sm" title="Refresh Telemetry">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Print Executive Briefing">
            <Printer size={15} />
            <span>Print Report</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary btn-sm" title="Export Filtered CSV">
            <FileSpreadsheet size={15} />
            <span>Export Filtered CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range & Ingestion Filters Toolbar */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
              <Calendar size={14} style={{ color: 'var(--accent-cyan)' }} />
              PERIOD:
            </span>

            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: '90days', label: 'Last 90 Days' },
              { id: 'ytd', label: 'Year To Date' },
              { id: 'all', label: 'All Records' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDateRangePreset(preset.id)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: dateRangePreset === preset.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  backgroundColor: dateRangePreset === preset.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                  color: dateRangePreset === preset.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Quick Search in Report */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Filter by title, ID, category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem', height: '36px' }}
              />
            </div>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRangePreset === 'custom' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem', width: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem', width: 'auto' }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Real-time filtering applied on incident intake timestamp)
            </span>
          </div>
        )}
      </div>

      {/* KPI Telemetry Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <StatCard
          title="Period Incidents"
          value={totalCount}
          icon={Layers}
          color="#06b6d4"
          subtitle="Records in selected window"
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={ShieldCheck}
          color="#10b981"
          subtitle={`${resolvedCount} Closed / Remediated`}
        />
        <StatCard
          title="Active Unresolved"
          value={unresolvedCount}
          icon={Clock}
          color="#f59e0b"
          subtitle="Currently open or in flight"
        />
        <StatCard
          title="Critical Severity"
          value={criticalCount}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle="Immediate containment required"
        />
      </div>

      {/* Row: Severity Breakdown & Resolved vs Unresolved */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Severity Distribution */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Incidents by Severity Tier</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {severityBreakdown.map((sev) => {
              const pct = totalCount > 0 ? ((sev.count / totalCount) * 100).toFixed(1) : 0;
              return (
                <div key={sev.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600, color: sev.color }}>{sev.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {sev.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: sev.color,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resolved vs Unresolved Ratio Card */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span>Remediation Status Ratio</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Remediated / Resolved</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{resolvedCount}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Active / Pending</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{unresolvedCount}</div>
              </div>
            </div>

            {/* Split Progress Bar */}
            <div>
              <div style={{ height: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Resolved: ${resolvedCount}`}
                />
                <div
                  style={{
                    height: '100%',
                    width: `${totalCount > 0 ? (unresolvedCount / totalCount) * 100 : 0}%`,
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.4s ease',
                  }}
                  title={`Unresolved: ${unresolvedCount}`}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{resolutionRate}% Closed</span>
                <span>{totalCount > 0 ? (100 - parseFloat(resolutionRate)).toFixed(1) : 0}% In Flight</span>
              </div>
            </div>

            <div style={{ padding: '0.875rem', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <strong>Triage Backlog:</strong> Currently <strong>{unassignedCount}</strong> incident{unassignedCount === 1 ? '' : 's'} remain in the unassigned queue awaiting operational ownership.
            </div>
          </div>
        </div>
      </div>

      {/* Row: Status Breakdown & Category Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Status Lifecycle Funnel */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Incidents Grouped by Lifecycle Status</span>
          </h3>

          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Status Stage</th>
                  <th>Count</th>
                  <th>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {statusBreakdown.map((item) => (
                  <tr key={item.label}>
                    <td style={{ fontWeight: 600 }}>{item.label}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{item.count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${item.pct}%`,
                              backgroundColor:
                                item.label === 'Resolved' || item.label === 'Closed'
                                  ? '#10b981'
                                  : item.label === 'Investigating'
                                  ? '#06b6d4'
                                  : '#f59e0b',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '40px' }}>
                          {item.pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Threat Categories Breakdown */}
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: '#818cf8' }} />
            <span>Threat Taxonomy by Category</span>
          </h3>

          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Incident Category</th>
                  <th>Count</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.length > 0 ? (
                  sortedCategories.map((cat) => (
                    <tr key={cat.category}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{cat.category}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{cat.count}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
                          {cat.pct}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No categories recorded in selected timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Incident Intake Trend Over Time */}
      {timelineBuckets.length > 0 && (
        <div className="cyber-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Incident Intake Timeline (Daily Recorded Activity)</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '140px', padding: '1rem 0', overflowX: 'auto' }}>
            {(() => {
              const maxCount = Math.max(...timelineBuckets.map((b) => b.count), 1);
              return timelineBuckets.map((bucket) => {
                const heightPct = Math.max((bucket.count / maxCount) * 100, 10);
                return (
                  <div
                    key={bucket.date}
                    style={{
                      flex: 1,
                      minWidth: '45px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {bucket.count}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        backgroundColor: 'rgba(6, 182, 212, 0.4)',
                        borderTop: '2px solid var(--accent-cyan)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${bucket.date}: ${bucket.count} incidents`}
                    />
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {bucket.date.slice(5)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Analyst Workload & Ownership Matrix */}
      <div className="cyber-card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Analyst Workload & Operational Allocation</span>
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
          Real distribution of ticket assignments, active investigations, and completion metrics across security personnel
        </p>

        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Analyst / Queue</th>
                <th>Department</th>
                <th>Total Assigned</th>
                <th>Active / In Flight</th>
                <th>Remediated</th>
                <th>Workload Share</th>
              </tr>
            </thead>
            <tbody>
              {analystWorkload.length > 0 ? (
                analystWorkload.map((a) => {
                  const sharePct = totalCount > 0 ? ((a.total / totalCount) * 100).toFixed(1) : 0;
                  const isUnassigned = a.id === 'unassigned';
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: isUnassigned ? '#f59e0b' : '#ffffff' }}>
                          {a.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.email}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{a.department}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{a.total}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          {a.active} Active
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          {a.resolved} Closed
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${sharePct}%`,
                                height: '100%',
                                backgroundColor: isUnassigned ? '#f59e0b' : 'var(--accent-cyan)',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sharePct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    No analyst workload records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtered Incident Digest Roster */}
      <div className="cyber-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', color: '#ffffff' }}>
              Filtered Incident Roster ({filteredIncidents.length} Records)
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Current subset based on period: <strong>{dateRangePreset.toUpperCase()}</strong>
            </span>
          </div>
          <Link to="/incidents" className="btn btn-secondary btn-sm">
            <span>Open Incident Management Hub</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>System</th>
                <th>Analyst</th>
                <th>Reported Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.slice(0, 25).map((inc) => (
                <tr key={inc._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {inc.incidentId}
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.title}
                  </td>
                  <td>{inc.type}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          inc.severity === 'Critical'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : inc.severity === 'High'
                            ? 'rgba(249, 115, 22, 0.15)'
                            : inc.severity === 'Medium'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          inc.severity === 'Critical'
                            ? '#ef4444'
                            : inc.severity === 'High'
                            ? '#f97316'
                            : inc.severity === 'Medium'
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td>{inc.status}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{inc.location}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{inc.assignedTo?.name || <em style={{ color: 'var(--text-muted)' }}>Unassigned</em>}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {formatDate(inc.createdAt || inc.reportedAt)}
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No incident records match the selected date boundary or criteria.
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

export default Reports;
