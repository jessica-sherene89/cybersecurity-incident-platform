const User = require('../models/User');
const { logActivity } = require('../utils/logger');

// @desc    Get all users (with optional role, status, or search filter)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user / operator (Admin exclusive)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const validRoles = ['Admin', 'Analyst', 'User'];
    const matchedRole = validRoles.find(
      (r) => r.toLowerCase() === String(role || 'User').trim().toLowerCase()
    ) || 'User';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: matchedRole,
      department: department ? department.trim() : 'General',
      status: 'active',
    });

    await logActivity({
      action: 'USER_CREATED',
      description: `New operator account created for ${newUser.name} with role [${newUser.role}] in [${newUser.department}].`,
      performedBy: req.user,
      targetUser: newUser._id,
      details: { email: newUser.email, role: newUser.role, department: newUser.department },
    });

    const safeUser = await User.findById(newUser._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Operator account created successfully.',
      user: safeUser,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active analysts (for assignment dropdown)
// @route   GET /api/users/analysts
// @access  Private (Analyst, Admin)
const getAnalysts = async (req, res, next) => {
  try {
    const analysts = await User.find({
      role: {
        $in: ['analyst', 'Analyst'],
      },
      status: 'active',
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: analysts.length,
      analysts,
      users: analysts,
      data: analysts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (role, status, department, name)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, role, status, department } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const previousRole = user.role;
    const previousStatus = user.status;

    // Prevent changing status of own admin account
    if (req.user._id.toString() === user._id.toString() && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    // Safety: Prevent deactivating or demoting the last active administrator
    if (
      user.role === 'Admin' &&
      user.status === 'active' &&
      (status === 'inactive' || (role && String(role).toLowerCase() !== 'admin'))
    ) {
      const activeAdminCount = await User.countDocuments({
        role: 'Admin',
        status: 'active',
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied. Cannot deactivate or demote the last remaining active Administrator.',
        });
      }
    }

    if (name) user.name = name.trim();

    if (role) {
      const validRoles = ['Admin', 'Analyst', 'User'];
      const matchedRole = validRoles.find(
        (r) => r.toLowerCase() === String(role).trim().toLowerCase()
      );
      if (!matchedRole) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified. Allowed roles: ${validRoles.join(', ')}`,
        });
      }

      // Prevent admin from demoting themselves
      if (req.user._id.toString() === user._id.toString() && matchedRole !== 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot change or demote your own administrative role.',
        });
      }

      user.role = matchedRole;
    }

    if (status && ['active', 'inactive'].includes(status)) {
      user.status = status;
    }
    if (department !== undefined) {
      user.department = department.trim();
    }

    await user.save();

    // Log role or status change if occurred
    if (role && previousRole !== user.role) {
      await logActivity({
        action: 'USER_ROLE_CHANGED',
        description: `User ${user.name} role changed from [${previousRole}] to [${user.role}].`,
        performedBy: req.user,
        targetUser: user._id,
        details: { oldRole: previousRole, newRole: user.role },
      });
    }

    if (status && previousStatus !== user.status) {
      await logActivity({
        action: 'USER_STATUS_CHANGED',
        description: `User ${user.name} account status updated to [${user.status.toUpperCase()}].`,
        performedBy: req.user,
        targetUser: user._id,
        details: { oldStatus: previousStatus, newStatus: user.status },
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully.',
      user,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    // Safety: Prevent deleting the last active administrator
    if (user.role === 'Admin') {
      const activeAdminCount = await User.countDocuments({
        role: 'Admin',
        status: 'active',
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied. Cannot delete the last remaining active Administrator.',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      action: 'USER_DELETED',
      description: `User account ${user.name} (${user.email}, Role: ${user.role}) was deleted from the system.`,
      performedBy: req.user,
      targetUser: user._id,
      details: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getAnalysts,
  getUserById,
  updateUser,
  deleteUser,
};
