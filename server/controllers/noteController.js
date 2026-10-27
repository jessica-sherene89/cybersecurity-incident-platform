const InvestigationNote = require('../models/InvestigationNote');
const Incident = require('../models/Incident');
const { logActivity } = require('../utils/logger');

// @desc    Add investigation note to an incident
// @route   POST /api/incidents/:id/notes
// @access  Private (Analyst, Admin)
const addNote = async (req, res, next) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide note text.',
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.',
      });
    }

    const newNote = await InvestigationNote.create({
      incidentId: incident._id,
      note: note.trim(),
      addedBy: req.user._id,
    });

    const populated = await InvestigationNote.findById(newNote._id).populate(
      'addedBy',
      'name email role department'
    );

    await logActivity({
      action: 'INVESTIGATION_NOTE_ADDED',
      description: `Investigation note added to incident ${incident.incidentId}: "${newNote.note.slice(0, 75)}${newNote.note.length > 75 ? '...' : ''}".`,
      performedBy: req.user,
      incidentId: incident._id,
      incidentTicketId: incident.incidentId,
    });

    res.status(201).json({
      success: true,
      message: 'Investigation note added successfully.',
      note: populated,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investigation notes for an incident
// @route   GET /api/incidents/:id/notes
// @access  Private
const getNotes = async (req, res, next) => {
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
        message: 'Access forbidden: You can only view notes for your own incidents.',
      });
    }

    const notes = await InvestigationNote.find({ incidentId: req.params.id })
      .populate('addedBy', 'name email role department')
      .sort({ createdAt: 1 }); // chronological order

    res.json({
      success: true,
      count: notes.length,
      notes,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addNote, getNotes };
