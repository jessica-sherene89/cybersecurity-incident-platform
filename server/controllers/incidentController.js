const Incident = require('../models/Incident');
const Evidence = require('../models/Evidence');
const InvestigationNote = require('../models/InvestigationNote');
const ResponseAction = require('../models/ResponseAction');
const User = require('../models/User');
const { generateIncidentId } = require('../utils/generateId');
const { logActivity } = require('../utils/logger');

// @desc    Create a new cybersecurity incident
// @route   POST /api/incidents
// @access  Private (User, Analyst, Admin)
const createIncident = async (req, res, next) => {
  try {
    const { title, type, severity, description, location } = req.body;

    if (!title || !type || !severity || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, type, severity, affected location/system, and description.',
      });
    }

    const incidentId = await generateIncidentId();

    const incident = await Incident.create({
      incidentId,
      title,
      type,
      severity,
      description,
      location,
      reportedBy: req.user._id,
      status: 'Reported',
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: req.user._id,
          updatedAt: new Date(),
          comment: 'Initial incident report submitted.',
        },
      ],
    });

    // If an initial evidence file was attached via multipart upload
    if (req.file) {
      await Evidence.create({
        incidentId: incident._id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        description: 'Initial evidence attached during reporting.',
        uploadedBy: req.user._id,
      });
    }

    const populatedIncident = await Incident.findById(incident._id)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role');

    await logActivity({
      action: 'INCIDENT_CREATED',
      description: `Incident ${incident.incidentId} [${incident.severity}] reported: "${incident.title}".`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
      details: { type: incident.type, severity: incident.severity, location: incident.location },
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully.',
      incident: populatedIncident,
      data: populatedIncident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incidents (with search, filter, sort, pagination)
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res, next) => {
  try {
    const {
      search,
      severity,
      type,
      status,
      assignedTo,
      reportedBy,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role-based restrictions: User and Employee can only view their own reported incidents
    const userRole = (req.user.role || '').toLowerCase();
    if (['user', 'employee'].includes(userRole)) {
      query.reportedBy = req.user._id;
    } else if (reportedBy) {
      query.reportedBy = reportedBy;
    }

    // Search by incidentId or title
    if (search) {
      query.$or = [
        { incidentId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const total = await Incident.countDocuments(query);

    // Sorting
    const sort = {};
    if (sortBy === 'severity') {
      // In MongoDB, custom severity sort or field sort
      sort.severity = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: incidents.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      incidents,
      data: incidents,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incidents reported by current user
// @route   GET /api/incidents/my-incidents
// @access  Private
const getMyIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.find({ reportedBy: req.user._id })
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      incidents,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incidents assigned to current Security Analyst
// @route   GET /api/incidents/my-assignments
// @access  Private (Analyst, Admin)
const getMyAssignments = async (req, res, next) => {
  try {
    const incidents = await Incident.find({ assignedTo: req.user._id })
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: incidents.length,
      incidents,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single incident by ID
// @route   GET /api/incidents/:id
// @access  Private
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .populate('statusHistory.updatedBy', 'name email role');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Role check: User and Employee can only view their own incidents
    const reqRole = (req.user.role || '').toLowerCase();
    if (
      ['user', 'employee'].includes(reqRole) &&
      incident.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view incidents reported by you.',
      });
    }

    res.json({
      success: true,
      incident,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update incident (status, severity, details)
// @route   PUT /api/incidents/:id
// @access  Private (Analyst, Admin)
const updateIncident = async (req, res, next) => {
  try {
    const { status, severity, title, description, location, comment } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Check status transition
    if (status && status !== incident.status) {
      incident.statusHistory.push({
        status,
        updatedBy: req.user._id,
        updatedAt: new Date(),
        comment: comment || `Status updated from ${incident.status} to ${status}.`,
      });
      incident.status = status;
    }

    if (severity && severity !== incident.severity) {
      incident.severity = severity;
    }

    if (title) incident.title = title;
    if (description) incident.description = description;
    if (location) incident.location = location;
    incident.updatedAt = new Date();

    await incident.save();

    const updated = await Incident.findById(incident._id)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .populate('statusHistory.updatedBy', 'name email role');

    await logActivity({
      action: status ? 'INCIDENT_STATUS_CHANGED' : 'INCIDENT_UPDATED',
      description: status
        ? `Incident ${incident.incidentId} lifecycle status transitioned to [${incident.status}].`
        : `Incident ${incident.incidentId} details updated.`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
      details: { status: incident.status, severity: incident.severity },
    });

    res.json({
      success: true,
      message: 'Incident updated successfully.',
      incident: updated,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign incident to an analyst
// @route   PUT /api/incidents/:id/assign
// @access  Private/Admin
const assignIncident = async (req, res, next) => {
  try {
    const { analystId } = req.body;

    if (!analystId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an analyst ID to assign.',
      });
    }

    const analyst = await User.findById(analystId);
    if (!analyst || String(analyst.role).toLowerCase() !== 'analyst') {
      return res.status(400).json({
        success: false,
        message: 'Designated user is not a valid Security Analyst.',
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    incident.assignedTo = analyst._id;
    // Advance status to "Assigned" if currently "Reported" or "Under Review"
    if (['Reported', 'Under Review'].includes(incident.status)) {
      incident.status = 'Assigned';
    }

    incident.statusHistory.push({
      status: incident.status,
      updatedBy: req.user._id,
      updatedAt: new Date(),
      comment: `Incident assigned to Security Analyst ${analyst.name} (${analyst.email}).`,
    });

    incident.updatedAt = new Date();
    await incident.save();

    const populated = await Incident.findById(incident._id)
      .populate('reportedBy', 'name email department')
      .populate('assignedTo', 'name email role')
      .populate('statusHistory.updatedBy', 'name email role');

    await logActivity({
      action: 'INCIDENT_ASSIGNED',
      description: `Incident ${incident.incidentId} assigned to Security Analyst ${analyst.name}.`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
      targetUser: analyst._id,
      details: { analystName: analyst.name, newStatus: incident.status },
    });

    res.json({
      success: true,
      message: `Incident successfully assigned to ${analyst.name}.`,
      incident: populated,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private/Admin
const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Cascade delete related records
    await Evidence.deleteMany({ incidentId: incident._id });
    await InvestigationNote.deleteMany({ incidentId: incident._id });
    await ResponseAction.deleteMany({ incidentId: incident._id });
    await Incident.findByIdAndDelete(req.params.id);

    await logActivity({
      action: 'INCIDENT_DELETED',
      description: `Incident record ${incident.incidentId} ("${incident.title}") and all associated artifacts were purged by Administrator.`,
      performedBy: req.user,
      incidentTicketId: incident.incidentId,
      details: { title: incident.title, severity: incident.severity },
    });

    res.json({
      success: true,
      message: 'Incident and all associated evidence, notes, and actions deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getMyIncidents,
  getMyAssignments,
  getIncidentById,
  updateIncident,
  assignIncident,
  deleteIncident,
};
