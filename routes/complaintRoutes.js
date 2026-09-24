const express = require('express');
const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  updateStatus,
  withdrawComplaint,
  submitResolution,
  confirmResolution,
  addClarification,
  getClarifications,
} = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.route('/').post(createComplaint).get(getAllComplaints);
router.route('/:id').get(getComplaintById).patch(updateComplaint);
router.patch('/:id/status', authorize('admin', 'grievance_officer'), updateStatus);
router.patch('/:id/withdraw', withdrawComplaint);
router.patch('/:id/resolve', authorize('admin', 'grievance_officer'), submitResolution);
router.patch('/:id/confirm-resolution', confirmResolution);
router.route('/:id/clarifications').post(addClarification).get(getClarifications);

module.exports = router;
