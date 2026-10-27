const mongoose = require('mongoose');

const responseActionSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
    },
    action: {
      type: String,
      required: [true, 'Response action description is required'],
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Completed',
    },
    details: {
      type: String,
      default: '',
      trim: true,
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

responseActionSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('ResponseAction', responseActionSchema);
