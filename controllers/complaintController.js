const Complaint = require('../models/Complaint');

// ─── Helpers ─────────────────────────────────────────────────────────
const isAdmin = (user) => ['admin', 'grievance_officer'].includes(user.role);

const findComplaintForUser = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId)
    .populate('submittedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('category', 'name')
    .populate('clarificationThreads.sender', 'name email role');

  if (!complaint) return null;

  // Students can only access their own complaints
  if (!isAdmin(user) && complaint.submittedBy._id.toString() !== user._id.toString()) {
    return null;
  }
  return complaint;
};

// ═════════════════════════════════════════════════════════════════════
//  CRUD
// ═════════════════════════════════════════════════════════════════════

/**
 * POST /complaints
 * Student submits a new complaint.
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      submittedBy: req.user._id,
    });

    const populated = await complaint.populate([
      { path: 'submittedBy', select: 'name email role' },
      { path: 'category', select: 'name' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /complaints
 * Students → own complaints. Admins → all complaints.
 * Supports ?status, ?category, ?page, ?limit query filters.
 */
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Scope by role
    if (!isAdmin(req.user)) {
      filter.submittedBy = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('submittedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('category', 'name'),
      Complaint.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /complaints/:id
 */
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /complaints/:id
 * Students may update title / description while complaint is still in 'submitted'.
 */
exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    // Students can only edit in 'submitted' state
    if (!isAdmin(req.user) && complaint.status !== 'submitted') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit a complaint while it is in "submitted" status.',
      });
    }

    const allowedFields = isAdmin(req.user)
      ? ['title', 'description', 'category', 'assignedTo']
      : ['title', 'description'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        complaint[field] = req.body[field];
      }
    });

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════════════
//  STATUS STATE-MACHINE
// ═════════════════════════════════════════════════════════════════════

/**
 * PATCH /complaints/:id/status
 * Admin-only. Enforces the transition map defined in the Complaint model.
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (!Complaint.canTransition(complaint.status, newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: "${complaint.status}" → "${newStatus}".`,
        allowedTransitions: Complaint.STATUS_TRANSITIONS[complaint.status],
      });
    }

    complaint.status = newStatus;
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Status changed to "${newStatus}".`,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════════════
//  WITHDRAWAL
// ═════════════════════════════════════════════════════════════════════

/**
 * PATCH /complaints/:id/withdraw
 * Student withdraws their own complaint.
 * Only allowed when status is 'submitted' or 'in_progress'.
 */
exports.withdrawComplaint = async (req, res, next) => {
  try {
    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    if (!Complaint.canTransition(complaint.status, 'withdrawn')) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw a complaint in "${complaint.status}" status.`,
      });
    }

    complaint.status = 'withdrawn';
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint withdrawn successfully.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════════════
//  RESOLUTION LOOP
// ═════════════════════════════════════════════════════════════════════

/**
 * PATCH /complaints/:id/resolve
 * Admin submits a resolution → moves status to 'resolved'.
 * Body: { feedback?: string }
 */
exports.submitResolution = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (!Complaint.canTransition(complaint.status, 'resolved')) {
      return res.status(400).json({
        success: false,
        message: `Cannot resolve a complaint in "${complaint.status}" status.`,
      });
    }

    complaint.status = 'resolved';
    complaint.resolutionConfirmation = {
      isConfirmed: false,
      feedback: req.body.feedback || null,
    };

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Resolution submitted. Awaiting student confirmation.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /complaints/:id/confirm-resolution
 * Student confirms (accepted=true → closed) or rejects (accepted=false → back to in_progress).
 * Body: { accepted: boolean, satisfactionRating?: 1-5, feedback?: string }
 */
exports.confirmResolution = async (req, res, next) => {
  try {
    const { accepted, satisfactionRating, feedback } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '"accepted" field (boolean) is required.',
      });
    }

    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Complaint is not in "resolved" status.',
      });
    }

    if (accepted) {
      // Student accepts → close the complaint
      complaint.status = 'closed';
      complaint.resolutionConfirmation.isConfirmed = true;
      complaint.resolutionConfirmation.confirmedAt = new Date();
      if (satisfactionRating) complaint.resolutionConfirmation.satisfactionRating = satisfactionRating;
      if (feedback) complaint.resolutionConfirmation.feedback = feedback;
    } else {
      // Student rejects → reopen for further work
      complaint.status = 'in_progress';
      complaint.resolutionConfirmation.isConfirmed = false;
      if (feedback) complaint.resolutionConfirmation.feedback = feedback;
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: accepted
        ? 'Resolution accepted. Complaint closed.'
        : 'Resolution rejected. Complaint re-opened for further investigation.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// ═════════════════════════════════════════════════════════════════════
//  CLARIFICATION THREAD
// ═════════════════════════════════════════════════════════════════════

/**
 * POST /complaints/:id/clarifications
 * Append a message to the clarification thread.
 * Both students (own complaint) and admins can post.
 * Body: { message: string, attachments?: string[] }
 */
exports.addClarification = async (req, res, next) => {
  try {
    const { message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Clarification message is required.',
      });
    }

    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    // Cannot add clarifications to terminal statuses
    if (['closed', 'withdrawn'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot add clarifications to a "${complaint.status}" complaint.`,
      });
    }

    complaint.clarificationThreads.push({
      sender: req.user._id,
      message: message.trim(),
      attachments: attachments || [],
    });

    await complaint.save();

    // Re-populate the latest thread entry's sender
    await complaint.populate('clarificationThreads.sender', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Clarification added.',
      data: complaint.clarificationThreads,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /complaints/:id/clarifications
 * Retrieve the full clarification thread for a complaint.
 */
exports.getClarifications = async (req, res, next) => {
  try {
    const complaint = await findComplaintForUser(req.params.id, req.user);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint.clarificationThreads,
    });
  } catch (error) {
    next(error);
  }
};
