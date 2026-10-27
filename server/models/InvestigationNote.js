const mongoose = require('mongoose');

const investigationNoteSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
    },
    note: {
      type: String,
      required: [true, 'Investigation note text is required'],
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

investigationNoteSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('InvestigationNote', investigationNoteSchema);
