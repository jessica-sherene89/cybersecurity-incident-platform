const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/logger');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Public registration strictly assigns 'User' role.
    const assignedRole = 'User';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      department: department ? department.trim() : 'General',
    });

    const token = generateToken(user._id, user.role);

    await logActivity({
      action: 'USER_CREATED',
      description: `Public registration completed for ${user.name} (${user.email}).`,
      performedBy: user,
      targetUser: user._id,
      details: { role: user.role, department: user.department },
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Credentials',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your system administrator.',
      });
    }

    const token = generateToken(user._id, user.role);

    await logActivity({
      action: 'USER_LOGIN',
      description: `User ${user.name} (${user.email}, ${user.role}) authenticated successfully.`,
      performedBy: user,
      details: { role: user.role },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current operator profile & credentials
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, department, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (name) user.name = name.trim();
    if (department !== undefined) user.department = department.trim();

    // If attempting password rotation
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password provided.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    await logActivity({
      action: 'PROFILE_UPDATED',
      description: `Operator ${user.name} updated account profile${newPassword ? ' and rotated password credentials' : ''}.`,
      performedBy: user,
      targetUser: user._id,
      details: { passwordUpdated: !!newPassword },
    });

    const safeUser = await User.findById(user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update operator / admin platform preferences
// @route   PUT /api/auth/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences payload provided.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    user.preferences = {
      ...(user.preferences || {}),
      ...preferences,
    };

    await user.save();

    await logActivity({
      action: 'SETTINGS_UPDATED',
      description: `Platform settings and notification preferences updated by ${user.name}.`,
      performedBy: user,
      details: preferences,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: user.preferences,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePreferences,
};
