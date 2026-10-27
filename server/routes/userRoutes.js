const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  getAnalysts,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// User Management: Admin-exclusive roster viewing & creation
router.get('/', protect, authorize('admin'), getUsers);
router.post('/', protect, authorize('admin'), createUser);

// Operational personnel listing for incident assignment dropdown (must be before /:id)
router.get('/analysts', protect, authorize('admin', 'analyst'), getAnalysts);

// Admin-exclusive management
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.put('/:id/role', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
