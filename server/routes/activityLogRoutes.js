const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getRecentActivity,
} = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Activity Logs are strictly Admin exclusive for audit integrity
router.get('/', protect, authorize('admin'), getActivityLogs);
router.get('/recent', protect, authorize('admin'), getRecentActivity);

module.exports = router;
