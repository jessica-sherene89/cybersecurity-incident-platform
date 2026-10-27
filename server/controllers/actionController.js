const ResponseAction = require('../models/ResponseAction');
const Incident = require('../models/Incident');
const { logActivity } = require('../utils/logger');

// @desc    Record a response action for an incident
// @route   POST /api/incidents/:id/actions
// @access  Private (Analyst, Admin)
const addAction = async (req, res, next) => {
  try {
    const { action, status, details } = req.body;

    if (!action || !action.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the response action description.',
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const responseAction = await ResponseAction.create({
      incidentId: incident._id,
      action: action.trim(),
      performedBy: req.user._id,
      status: status || 'Completed',
      details: details ? details.trim() : '',
    });

    const populated = await ResponseAction.findById(responseAction._id)
      .populate('incidentId', 'incidentId title severity status')
      .populate('performedBy', 'name email role');

    await logActivity({
      action: 'ACTION_CREATED',
      description: `Response action "${responseAction.action}" recorded on incident ${incident.incidentId} [Status: ${responseAction.status}].`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
      details: { action: responseAction.action, status: responseAction.status },
    });

    res.status(201).json({
      success: true,
      message: 'Response action recorded successfully.',
      action: populated,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all response actions for an incident
// @route   GET /api/incidents/:id/actions
// @access  Private
const getActionsByIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const uRole = (req.user.role || '').toLowerCase();
    if (
      ['user', 'employee'].includes(uRole) &&
      incident.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view response actions for your own incidents.',
      });
    }

    const actions = await ResponseAction.find({ incidentId: req.params.id })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: actions.length,
      actions,
      data: actions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all response actions platform-wide (Response Tracking page)
// @route   GET /api/actions
// @access  Private (Analyst, Admin)
const getAllActions = async (req, res, next) => {
  try {
    const actions = await ResponseAction.find()
      .populate('incidentId', 'incidentId title severity status location')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: actions.length,
      actions,
      data: actions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update response action status
// @route   PUT /api/actions/:id
// @access  Private (Analyst, Admin)
const updateActionStatus = async (req, res, next) => {
  try {
    const { status, action: actionText, details } = req.body;

    const action = await ResponseAction.findById(req.params.id).populate(
      'incidentId',
      'incidentId title'
    );

    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Response action not found.',
      });
    }

    const previousStatus = action.status;

    if (status) {
      if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action status.',
        });
      }
      action.status = status;
    }

    if (actionText) action.action = actionText.trim();
    if (details !== undefined) action.details = details.trim();

    await action.save();

    const populated = await ResponseAction.findById(action._id)
      .populate('incidentId', 'incidentId title severity status')
      .populate('performedBy', 'name email role');

    if (status && previousStatus !== action.status) {
      await logActivity({
        action: 'ACTION_STATUS_CHANGED',
        description: `Response action "${action.action}" updated to [${action.status}].`,
        performedBy: req.user,
        incidentId: action.incidentId?._id || action.incidentId,
        incidentTicketId: action.incidentId?.incidentId || '',
        details: { oldStatus: previousStatus, newStatus: action.status },
      });
    }

    res.json({
      success: true,
      message: 'Response action updated successfully.',
      action: populated,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / Cancel a response action
// @route   DELETE /api/actions/:id
// @access  Private (Analyst, Admin)
const deleteAction = async (req, res, next) => {
  try {
    const action = await ResponseAction.findById(req.params.id).populate(
      'incidentId',
      'incidentId title'
    );

    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Response action not found.',
      });
    }

    await ResponseAction.findByIdAndDelete(req.params.id);

    await logActivity({
      action: 'ACTION_DELETED',
      description: `Response action "${action.action}" was cancelled and removed.`,
      performedBy: req.user,
      incidentId: action.incidentId?._id,
      incidentTicketId: action.incidentId?.incidentId || '',
    });

    res.json({
      success: true,
      message: 'Response action deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addAction,
  getActionsByIncident,
  getAllActions,
  updateActionStatus,
  deleteAction,
};
