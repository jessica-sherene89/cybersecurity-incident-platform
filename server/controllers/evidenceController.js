const fs = require('fs');
const path = require('path');
const Evidence = require('../models/Evidence');
const Incident = require('../models/Incident');
const { logActivity } = require('../utils/logger');

// @desc    Upload forensic evidence for an incident
// @route   POST /api/incidents/:id/evidence
// @access  Private (Analyst, Admin, or reporting User)
const uploadEvidence = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    // Role check: User can only upload to their own incident
    const uRole = (req.user.role || '').toLowerCase();
    if (
      ['user', 'employee'].includes(uRole) &&
      incident.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to upload evidence to your own incidents.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a file to upload.',
      });
    }

    const { description } = req.body;

    const evidence = await Evidence.create({
      incidentId: incident._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      description: description || '',
      uploadedBy: req.user._id,
    });

    const populated = await Evidence.findById(evidence._id).populate(
      'uploadedBy',
      'name email role'
    );

    await logActivity({
      action: 'EVIDENCE_UPLOADED',
      description: `Forensic evidence artifact "${evidence.originalName}" uploaded for incident ${incident.incidentId}.`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
      details: { fileName: evidence.fileName, originalName: evidence.originalName, fileSize: evidence.fileSize, fileType: evidence.fileType },
    });

    res.status(201).json({
      success: true,
      message: 'Forensic evidence uploaded successfully.',
      evidence: populated,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all evidence for an incident
// @route   GET /api/incidents/:id/evidence
// @access  Private
const getIncidentEvidence = async (req, res, next) => {
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
        message: 'Access forbidden: You can only view evidence for your own incidents.',
      });
    }

    const evidence = await Evidence.find({ incidentId: req.params.id })
      .populate('uploadedBy', 'name email role')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: evidence.length,
      evidence,
      data: evidence,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all evidence across platform (Evidence Gallery)
// @route   GET /api/evidence
// @access  Private (Analyst, Admin)
const getAllEvidence = async (req, res, next) => {
  try {
    const evidence = await Evidence.find()
      .populate('incidentId', 'incidentId title severity status')
      .populate('uploadedBy', 'name email role')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: evidence.length,
      evidence,
      data: evidence,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete evidence
// @route   DELETE /api/evidence/:id
// @access  Private (Analyst, Admin)
const deleteEvidence = async (req, res, next) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence record not found.',
      });
    }

    // Try deleting the physical file from disk
    const diskPath = path.join(__dirname, '../uploads', evidence.fileName);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.warn('Could not delete physical file:', err.message);
      }
    }

    await Evidence.findByIdAndDelete(req.params.id);

    await logActivity({
      action: 'EVIDENCE_DELETED',
      description: `Forensic evidence artifact "${evidence.originalName || evidence.fileName}" was purged from vault.`,
      performedBy: req.user,
      incidentId: evidence.incidentId,
      details: { fileName: evidence.fileName },
    });

    res.json({
      success: true,
      message: 'Evidence deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadEvidence,
  getIncidentEvidence,
  getAllEvidence,
  deleteEvidence,
};
