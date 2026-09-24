const express = require('express');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

const router = express.Router();

const mockUserMiddleware = (req, _res, next) => {
	if (!req.user) {
		req.user = {
			_id: new mongoose.Types.ObjectId(),
			role: 'admin',
		};
	}

	return next();
};

const authorizeAdminOrGrievanceOfficer = (req, res, next) => {
	if (!['grievance_officer', 'admin'].includes(req.user.role)) {
		return res.status(403).json({
			success: false,
			error: 'Only administrators and grievance officers may access this resource.',
		});
	}

	return next();
};

router.use(mockUserMiddleware, authorizeAdminOrGrievanceOfficer);

router.get('/grievance-cases', async (_req, res) => {
	try {
		const complaints = await Complaint.find({ isSensitive: true })
			.populate('submittedBy', 'name email')
			.populate('category', 'name')
			.lean();

		const grievanceCases = complaints.map((complaint) => ({
			...complaint,
			student: complaint.submittedBy,
			submittedBy: undefined,
		}));

		return res.status(200).json({
			success: true,
			data: grievanceCases,
		});
	} catch (error) {
		console.error('[IssueHub] Failed to fetch grievance cases:', error);
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch sensitive grievance cases.',
		});
	}
});

router.patch('/complaints/:id/resolve', async (req, res) => {
	try {
		const { proofImageUrl, proofDescription } = req.body || {};

		if (!proofImageUrl || !proofDescription) {
			return res.status(400).json({
				success: false,
				error: 'Both proofImageUrl and proofDescription are required to resolve a complaint.',
			});
		}

		if (!mongoose.isValidObjectId(req.params.id)) {
			return res.status(400).json({
				success: false,
				error: 'A valid complaint ID is required.',
			});
		}

		const complaint = await Complaint.findById(req.params.id);

		if (!complaint) {
			return res.status(404).json({
				success: false,
				error: 'Complaint not found.',
			});
		}

		complaint.status = 'resolved';
		complaint.proofOfFix = {
			imageUrl: proofImageUrl,
			description: proofDescription,
			submittedBy: req.user._id,
			submittedAt: new Date(),
		};

		await complaint.save();

		return res.status(200).json({
			success: true,
			data: complaint,
		});
	} catch (error) {
		console.error('[IssueHub] Failed to resolve complaint:', error);
		return res.status(500).json({
			success: false,
			error: 'Failed to resolve complaint.',
		});
	}
});

module.exports = router;
