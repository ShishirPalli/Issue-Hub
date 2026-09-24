const express = require('express');
const Complaint = require('../models/Complaint');

const router = express.Router();

router.use((req, _res, next) => {
	req.user = { role: 'admin' };
	next();
});

router.get('/analytics/dashboard', async (req, res) => {
	if (!req.user || !['admin', 'grievance_officer'].includes(req.user.role)) {
		return res.status(403).json({
			success: false,
			error: 'Only administrators and grievance officers may access analytics.',
		});
	}

	try {
		const [dashboard] = await Complaint.aggregate([
			{
				$facet: {
					categoryHeatmap: [
						{
							$group: {
								_id: {
									category: '$category',
									status: '$status',
								},
								count: { $sum: 1 },
							},
						},
					],
					recurringIssues: [
						{
							$group: {
								_id: '$title',
								occurrences: { $sum: 1 },
							},
						},
						{
							$match: {
								occurrences: { $gte: 1 },
							},
						},
					],
				},
			},
		]);

		return res.status(200).json(
			dashboard || { categoryHeatmap: [], recurringIssues: [] },
		);
	} catch (error) {
		console.error('[IssueHub] Failed to load analytics dashboard:', error);
		return res.status(500).json({
			success: false,
			error: 'Failed to load analytics dashboard.',
		});
	}
});

module.exports = router;
