const Complaint = require('../models/Complaint');

const ADMIN_ROLES = ['admin', 'grievance_officer'];
const isAdmin = (user) => ADMIN_ROLES.includes(user.role);
const userId = (user) => user._id || user.id;

const populateComplaint = (query) => query
  .populate('submittedBy', 'name email role')
  .populate('assignedTo', 'name email role')
  .populate('category', 'name')
  .populate('clarificationThread.sender', 'name email role')
  .populate('resolution.submittedBy', 'name email role');

const findAccessibleComplaint = async (id, user) => {
  const filter = { _id: id };
  if (!isAdmin(user)) filter.submittedBy = userId(user);
  return populateComplaint(Complaint.findOne(filter));
};

exports.createComplaint = async (req, res, next) => {
  try {
    const { subject, description, category } = req.body;
    const complaint = await Complaint.create({ subject, description, category, submittedBy: userId(req.user) });
    return res.status(201).json({ success: true, data: await populateComplaint(Complaint.findById(complaint._id)) });
  } catch (error) { return next(error); }
};

exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (!isAdmin(req.user)) filter.submittedBy = userId(req.user);
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await populateComplaint(Complaint.find(filter).sort({ createdAt: -1 }));
    return res.json({ success: true, data: complaints });
  } catch (error) { return next(error); }
};

exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    return res.json({ success: true, data: complaint });
  } catch (error) { return next(error); }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (!isAdmin(req.user) && complaint.status !== 'Open') {
      return res.status(403).json({ success: false, message: 'Only open complaints can be edited.' });
    }
    const fields = isAdmin(req.user) ? ['subject', 'description', 'category', 'assignedTo'] : ['subject', 'description', 'category'];
    fields.forEach((field) => { if (req.body[field] !== undefined) complaint[field] = req.body[field]; });
    await complaint.save();
    return res.json({ success: true, data: complaint });
  } catch (error) { return next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status: nextStatus } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (!Complaint.canTransition(complaint.status, nextStatus)) {
      return res.status(400).json({ success: false, message: `Invalid transition from "${complaint.status}" to "${nextStatus}".`, allowedTransitions: Complaint.STATUS_TRANSITIONS[complaint.status] || [] });
    }
    complaint.status = nextStatus;
    await complaint.save();
    return res.json({ success: true, data: complaint });
  } catch (error) { return next(error); }
};

exports.withdrawComplaint = async (req, res, next) => {
  try {
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'Open' || complaint.isWithdrawn) return res.status(400).json({ success: false, message: 'Only open complaints can be withdrawn.' });
    complaint.isWithdrawn = true;
    complaint.withdrawnAt = new Date();
    await complaint.save();
    return res.json({ success: true, message: 'Complaint withdrawn.', data: complaint });
  } catch (error) { return next(error); }
};

exports.submitResolution = async (req, res, next) => {
  try {
    const { text } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Resolution text is required.' });
    if (!Complaint.canTransition(complaint.status, 'Resolved')) return res.status(400).json({ success: false, message: 'Complaint is not ready for resolution.' });
    complaint.status = 'Resolved';
    complaint.resolution = { text: text.trim(), submittedBy: userId(req.user), studentConfirmed: false };
    await complaint.save();
    return res.json({ success: true, data: complaint });
  } catch (error) { return next(error); }
};

exports.confirmResolution = async (req, res, next) => {
  try {
    const { confirmed, feedback } = req.body;
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'Resolved' || typeof confirmed !== 'boolean') return res.status(400).json({ success: false, message: 'A boolean "confirmed" value is required for a resolved complaint.' });
    complaint.resolution.studentConfirmed = confirmed;
    complaint.resolution.studentFeedback = feedback;
    complaint.resolution.confirmedAt = new Date();
    complaint.status = confirmed ? 'Closed' : 'In Progress';
    await complaint.save();
    return res.json({ success: true, data: complaint });
  } catch (error) { return next(error); }
};

exports.addClarification = async (req, res, next) => {
  try {
    const { message, attachments = [] } = req.body;
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });
    if (complaint.status === 'Closed' || complaint.isWithdrawn) return res.status(400).json({ success: false, message: 'This complaint is no longer active.' });
    complaint.clarificationThread.push({ sender: userId(req.user), message: message.trim(), attachments });
    await complaint.save();
    return res.status(201).json({ success: true, data: complaint.clarificationThread.at(-1) });
  } catch (error) { return next(error); }
};

exports.getClarifications = async (req, res, next) => {
  try {
    const complaint = await findAccessibleComplaint(req.params.id, req.user);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    return res.json({ success: true, data: complaint.clarificationThread });
  } catch (error) { return next(error); }
};
