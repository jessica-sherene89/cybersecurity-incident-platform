const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      required: [true, 'Incident type is required'],
      enum: [
        'Phishing',
        'Malware',
        'Ransomware',
        'Unauthorized Access',
        'Data Breach',
        'DDoS',
        'Insider Threat',
        'Password Attack',
        'Suspicious Activity',
        'Other',
      ],
      default: 'Suspicious Activity',
    },
    severity: {
      type: String,
      required: [true, 'Severity level is required'],
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location or affected system is required'],
      trim: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'Reported',
        'Under Review',
        'Assigned',
        'Investigating',
        'Contained',
        'Resolved',
        'Closed',
      ],
      default: 'Reported',
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        comment: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add index on common search and filter fields
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ type: 1 });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
