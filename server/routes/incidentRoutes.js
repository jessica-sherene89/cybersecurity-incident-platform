const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getMyIncidents,
  getMyAssignments,
  getIncidentById,
  updateIncident,
  assignIncident,
  deleteIncident,
} = require('../controllers/incidentController');
const {
  uploadEvidence,
  getIncidentEvidence,
} = require('../controllers/evidenceController');
const { addNote, getNotes } = require('../controllers/noteController');
const {
  addAction,
  getActionsByIncident,
} = require('../controllers/actionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Specific paths before /:id
router.get('/my-incidents', protect, getMyIncidents);
router.get(
  '/my-assignments',
  protect,
  authorize('analyst', 'admin'),
  getMyAssignments
);

// Root incident routes
router
  .route('/')
  .post(protect, upload.single('evidence'), createIncident)
  .get(protect, getIncidents);

// Parameterized incident routes
router
  .route('/:id')
  .get(protect, getIncidentById)
  .put(
    protect,
    authorize('analyst', 'admin'),
    updateIncident
  )
  .delete(protect, authorize('admin'), deleteIncident);

// Assignment route
router.put('/:id/assign', protect, authorize('admin'), assignIncident);

// Sub-resource: Evidence attached to incident
router
  .route('/:id/evidence')
  .post(protect, upload.single('file'), uploadEvidence)
  .get(protect, getIncidentEvidence);

// Sub-resource: Investigation notes
router
  .route('/:id/notes')
  .post(
    protect,
    authorize('analyst', 'admin'),
    addNote
  )
  .get(protect, getNotes);

// Sub-resource: Response actions
router
  .route('/:id/actions')
  .post(
    protect,
    authorize('analyst', 'admin'),
    addAction
  )
  .get(protect, getActionsByIncident);

module.exports = router;
