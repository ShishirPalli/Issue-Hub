const express = require('express');

const router = express.Router();

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

// Auth middleware provided by Member 1
const { authenticate, authorize } = require('../middleware/auth');

// ─── All routes require authentication ───────────────────────────────
router.use(authenticate);

// ─── CRUD ────────────────────────────────────────────────────────────
router.post('/', createComplaint);
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id', updateComplaint);

// ─── Status State-Machine (Admin / Grievance Officer only) ───────────
router.patch(
  '/:id/status',
  authorize('admin', 'grievance_officer'),
  updateStatus,
);

// ─── Withdrawal (Student) ────────────────────────────────────────────
router.patch('/:id/withdraw', withdrawComplaint);

// ─── Resolution Loop ─────────────────────────────────────────────────
router.patch(
  '/:id/resolve',
  authorize('admin', 'grievance_officer'),
  submitResolution,
);
router.patch('/:id/confirm-resolution', confirmResolution);

// ─── Clarification Thread ────────────────────────────────────────────
router.post('/:id/clarifications', addClarification);
router.get('/:id/clarifications', getClarifications);

module.exports = router;
