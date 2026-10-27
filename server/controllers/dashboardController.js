const Incident = require('../models/Incident');
const User = require('../models/User');
const Evidence = require('../models/Evidence');
const ResponseAction = require('../models/ResponseAction');

// @desc    Get dashboard metrics, charts, and recent activity
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // If user is employee, stats should be filtered to employee or general overview?
    // Usually dashboard shows organization overview for analysts/admins, and employee gets relevant metrics.
    const userRole = (req.user.role || '').toLowerCase();
    const query = ['user', 'employee'].includes(userRole) ? { reportedBy: req.user._id } : {};

    // 1. Core Summary Metrics
    const totalIncidents = await Incident.countDocuments(query);
    const openIncidents = await Incident.countDocuments({
      ...query,
      status: { $nin: ['Resolved', 'Closed'] },
    });
    const criticalIncidents = await Incident.countDocuments({
      ...query,
      severity: 'Critical',
    });
    const highSeverityIncidents = await Incident.countDocuments({
      ...query,
      severity: 'High',
    });
    const underInvestigation = await Incident.countDocuments({
      ...query,
      status: 'Investigating',
    });
    const inProgressIncidents = await Incident.countDocuments({
      ...query,
      status: { $in: ['Assigned', 'Investigating', 'Contained'] },
    });
    const resolvedIncidents = await Incident.countDocuments({
      ...query,
      status: { $in: ['Resolved', 'Closed'] },
    });

    // 2. Incidents by Severity Breakdown
    const severityCountsRaw = await Incident.aggregate([
      { $match: query },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const bySeverity = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    severityCountsRaw.forEach((item) => {
      if (bySeverity[item._id] !== undefined) {
        bySeverity[item._id] = item.count;
      }
    });

    // 3. Incidents by Type Breakdown
    const typeCountsRaw = await Incident.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byType = {};
    typeCountsRaw.forEach((item) => {
      byType[item._id] = item.count;
    });

    // 4. Incidents by Status Breakdown
    const statusCountsRaw = await Incident.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = {
      Reported: 0,
      'Under Review': 0,
      Assigned: 0,
      Investigating: 0,
      Contained: 0,
      Resolved: 0,
      Closed: 0,
    };
    statusCountsRaw.forEach((item) => {
      if (byStatus[item._id] !== undefined) {
        byStatus[item._id] = item.count;
      }
    });

    // 5. 30-Day Timeline Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const timelineTrendRaw = await Incident.aggregate([
      {
        $match: query,
      },
      {
        $addFields: {
          effectiveDate: { $ifNull: ['$reportedAt', '$createdAt'] },
        },
      },
      {
        $match: {
          effectiveDate: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$effectiveDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const timelineTrendMap = {};
    timelineTrendRaw.forEach((item) => {
      timelineTrendMap[item._id] = item.count;
    });

    const timelineTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      timelineTrend.push({
        _id: dateStr,
        count: timelineTrendMap[dateStr] || 0,
      });
    }

    // 6. Recent Incidents (Top 6)
    const recentIncidents = await Incident.find(query)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(6);

    // 7. Extra Counts for Stats Cards
    const totalEvidenceCount = await Evidence.countDocuments();
    const totalActionsCount = await ResponseAction.countDocuments();
    const totalUsersCount = await User.countDocuments();

    // Standardized arrays for charts
    const severityBreakdown = ['Critical', 'High', 'Medium', 'Low'].map((sev) => ({
      _id: sev,
      count: bySeverity[sev] || 0,
    }));

    const typeBreakdown = typeCountsRaw.map((t) => ({
      _id: t._id,
      count: t.count,
    }));

    const statusBreakdown = ['Reported', 'Under Review', 'Assigned', 'Investigating', 'Contained', 'Resolved', 'Closed'].map(
      (st) => ({
        _id: st,
        count: byStatus[st] || 0,
      })
    );

    const overview = {
      total: totalIncidents,
      open: openIncidents,
      inProgress: inProgressIncidents,
      critical: criticalIncidents,
      high: highSeverityIncidents,
      underInvestigation,
      resolved: resolvedIncidents,
      totalUsers: totalUsersCount,
    };

    const dashboardPayload = {
      overview,
      severityBreakdown,
      typeBreakdown,
      statusBreakdown,
      timelineTrend,
      recentIncidents,
      totalIncidents,
      openIncidents,
      inProgressIncidents,
      criticalIncidents,
      highSeverityIncidents,
      underInvestigation,
      resolvedIncidents,
      totalEvidenceCount,
      totalActionsCount,
      totalUsersCount,
      bySeverity,
      byType,
      byStatus,
      overTime: timelineTrend,
    };

    res.json({
      success: true,
      data: dashboardPayload,
      stats: dashboardPayload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
