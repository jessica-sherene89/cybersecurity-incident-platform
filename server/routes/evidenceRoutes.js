const express = require('express');
const router = express.Router();
const {
  getAllEvidence,
  deleteEvidence,
} = require('../controllers/evidenceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('analyst', 'admin'), getAllEvidence);
router.delete(
  '/:id',
  protect,
  authorize('analyst', 'admin'),
  deleteEvidence
);

module.exports = router;
