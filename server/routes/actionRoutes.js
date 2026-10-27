const express = require('express');
const router = express.Router();
const {
  getAllActions,
  updateActionStatus,
  deleteAction,
} = require('../controllers/actionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('analyst', 'admin'), getAllActions);
router.put(
  '/:id',
  protect,
  authorize('analyst', 'admin'),
  updateActionStatus
);
router.delete(
  '/:id',
  protect,
  authorize('analyst', 'admin'),
  deleteAction
);

module.exports = router;
