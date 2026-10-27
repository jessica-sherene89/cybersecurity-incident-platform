const ActivityLog = require('../models/ActivityLog');

// @desc    Get all audit activity logs (Admin exclusive)
// @route   GET /api/activity-logs
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { action, search, user, incidentId, startDate, endDate } = req.query;
    const query = {};

    if (action) {
      query.action = action;
    }

    if (user) {
      query.performedBy = user;
    }

    if (incidentId) {
      query.$or = [
        { incidentId },
        { incidentTicketId: { $regex: incidentId, $options: 'i' } },
      ];
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { incidentTicketId: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const startIndex = (page - 1) * limit;

    const total = await ActivityLog.countDocuments(query);

    const logs = await ActivityLog.find(query)
      .populate('performedBy', 'name email role department')
      .populate('incidentId', 'incidentId title severity status')
      .populate('targetUser', 'name email role')
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: logs.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      logs,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top recent activity events (for Dashboard)
// @route   GET /api/activity-logs/recent
// @access  Private/Admin
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const logs = await ActivityLog.find()
      .populate('performedBy', 'name email role')
      .populate('incidentId', 'incidentId title severity')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: logs.length,
      logs,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getRecentActivity,
};
