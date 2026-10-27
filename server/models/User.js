const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['Admin', 'Analyst', 'User'],
        message: '{VALUE} is not a valid role. Allowed roles: Admin, Analyst, User',
      },
      default: 'User',
      set: (val) => {
        if (!val) return 'User';
        const normalized = String(val).trim().toLowerCase();
        if (normalized === 'admin') return 'Admin';
        if (
          normalized === 'analyst' ||
          normalized === 'threat hunter' ||
          normalized === 'incident responder'
        ) {
          return 'Analyst';
        }
        return 'User';
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    preferences: {
      emailAlerts: { type: Boolean, default: true },
      criticalIncidentSms: { type: Boolean, default: false },
      dailyDigest: { type: Boolean, default: true },
      autoQuarantineRules: { type: Boolean, default: true },
      theme: { type: String, default: 'dark-navy' },
      sessionTimeoutMinutes: { type: Number, default: 60 },
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
