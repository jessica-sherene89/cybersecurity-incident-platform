const ActivityLog = require('../models/ActivityLog');

/**
 * Log an audit activity event to the database
 * @param {Object} params
 * @param {string} params.action - Enum event type
 * @param {string} params.description - Human-readable description
 * @param {Object|string} params.performedBy - User object or user ID
 * @param {string} [params.userRole] - Role of the actor
 * @param {string} [params.userName] - Name of the actor
 * @param {string} [params.incidentId] - MongoDB _id of related incident
 * @param {string} [params.incidentTicketId] - Ticket ID (e.g. INC-2026-0001)
 * @param {string} [params.targetUser] - Affected user ID (for user admin events)
 * @param {Object} [params.details] - Additional contextual details
 */
const logActivity = async ({
  action,
  description,
  performedBy,
  userRole,
  userName,
  incidentId = null,
  incidentTicketId = '',
  targetUser = null,
  details = {},
}) => {
  try {
    if (!performedBy) return;

    const actorId = performedBy._id || performedBy;
    const actorRole = userRole || performedBy.role || 'User';
    const actorName = userName || performedBy.name || 'Operator';

    await ActivityLog.create({
      action,
      description,
      performedBy: actorId,
      userRole: actorRole,
      userName: actorName,
      incidentId,
      incidentTicketId,
      targetUser,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    // Non-blocking error logging
    console.error('[ActivityLog Error]:', err.message);
  }
};

module.exports = { logActivity };
