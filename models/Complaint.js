const mongoose = require('mongoose');

const { Schema } = mongoose;

const clarificationSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true },
);

const resolutionSchema = new Schema(
  {
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, trim: true },
    studentConfirmed: Boolean,
    studentFeedback: String,
    confirmedAt: Date,
  },
  { _id: false },
);

const complaintSchema = new Schema(
  {
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
      index: true,
    },
    isWithdrawn: { type: Boolean, default: false, index: true },
    withdrawnAt: Date,
    clarificationThread: { type: [clarificationSchema], default: [] },
    resolution: { type: resolutionSchema, default: null },
  },
  { timestamps: true },
);

const STATUS_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
};

complaintSchema.statics.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
complaintSchema.statics.canTransition = (currentStatus, nextStatus) => (
  STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) || false
);
complaintSchema.index({ subject: 'text', description: 'text' });

module.exports = mongoose.model('Complaint', complaintSchema);
