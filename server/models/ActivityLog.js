const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'INCIDENT_CREATED',
        'INCIDENT_ASSIGNED',
        'INCIDENT_REASSIGNED',
        'INCIDENT_STATUS_CHANGED',
        'INCIDENT_UPDATED',
        'INCIDENT_DELETED',
        'EVIDENCE_UPLOADED',
        'EVIDENCE_DELETED',
        'ACTION_CREATED',
        'ACTION_STATUS_CHANGED',
        'ACTION_DELETED',
        'INVESTIGATION_NOTE_ADDED',
        'USER_CREATED',
        'USER_ROLE_CHANGED',
        'USER_STATUS_CHANGED',
        'USER_DELETED',
        'USER_LOGIN',
        'SETTINGS_UPDATED',
        'PROFILE_UPDATED',
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: '',
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    incidentTicketId: {
      type: String,
      default: '',
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ incidentId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
