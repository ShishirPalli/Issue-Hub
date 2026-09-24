const mongoose = require('mongoose');
const AuditLog = require('./AuditLog');

const { Schema } = mongoose;

const clarificationThreadSchema = new Schema(
  {
    // Member 2 (Clarification workflow)
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: true,
  },
);

const resolutionConfirmationSchema = new Schema(
  {
    // Member 2 (Resolution workflow)
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmedAt: Date,
    feedback: String,
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { _id: false },
);

const priorityMetricsSchema = new Schema(
  {
    // Member 3 (Prioritization)
    urgency: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    impact: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    safety: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    duration: {
      type: Number,
      default: 24,
    },
    calculatedScore: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { _id: false },
);

const proofOfFixSchema = new Schema(
  {
    // Member 4 (Security and proof of fix)
    imageUrl: String,
    description: String,
    notes: String,
    mediaUrls: {
      type: [String],
      default: [],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const aiIntakeSchema = new Schema(
  {
    // Member 5 (AI intake)
    rawPrompt: String,
    extractedSummary: String,
    detectedCategoryName: String,
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'frustrated', 'critical', 'urgent'],
    },
    suggestedTags: {
      type: [String],
      default: [],
    },
    keyEntities: {
      type: [String],
      default: [],
    },
    embeddingVector: {
      type: [Number],
      default: [],
    },
  },
  { _id: false },
);

const complaintSchema = new Schema(
  {
    // Member 1 (Auth/Roles)
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Member 2 (Complaint and resolution workflow)
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'submitted', 'in_progress', 'resolved', 'closed', 'withdrawn',
        'Open', 'In Progress', 'Resolved', 'Closed',
      ],
      default: 'submitted',
      index: true,
    },
    clarificationThreads: {
      type: [clarificationThreadSchema],
      default: [],
    },
    clarificationThread: {
      type: [clarificationThreadSchema],
      default: [],
    },
    resolutionConfirmation: {
      type: resolutionConfirmationSchema,
      default: () => ({}),
    },
    resolution: {
      type: new Schema(
        {
          submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
          text: { type: String, trim: true },
          studentConfirmed: Boolean,
          studentFeedback: String,
          confirmedAt: Date,
        },
        { _id: false },
      ),
      default: null,
    },
    isWithdrawn: {
      type: Boolean,
      default: false,
      index: true,
    },
    withdrawnAt: Date,
    // Member 3 (Prioritization and deduplication)
    priorityMetrics: {
      type: priorityMetricsSchema,
      default: () => ({}),
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
      index: true,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicateOf: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
      index: true,
    },
    knownIssueId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
      index: true,
    },
    // Member 4 (Security and sensitive complaints)
    isSensitive: {
      type: Boolean,
      default: false,
      index: true,
    },
    proofOfFix: {
      type: proofOfFixSchema,
      default: null,
    },
    // Member 5 (AI intake)
    aiIntake: {
      type: aiIntakeSchema,
      default: null,
    },
  },
);

complaintSchema.set('toJSON', {
  virtuals: true,
  transform: (document, returnedObject, options) => {
    const user = options.user;
    const isPrivileged = user
      && ['grievance_officer', 'admin'].includes(user.role);
    const isStudent = user
      && user._id
      && document.submittedBy
      && user._id.toString() === document.submittedBy.toString();

    if (document.isSensitive && !isPrivileged && !isStudent) {
      returnedObject.description = '[REDACTED: SENSITIVE GRIEVANCE]';
      delete returnedObject.student;
      delete returnedObject.submittedBy;
    }

    delete returnedObject.__v;
    return returnedObject;
  },
});

complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ 'priorityMetrics.calculatedScore': -1, upvoteCount: -1 });
complaintSchema.index({ title: 'text', description: 'text' });

const STATUS_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  submitted: ['in_progress', 'withdrawn', 'In Progress'],
  in_progress: ['resolved', 'withdrawn', 'Resolved'],
  resolved: ['closed', 'in_progress', 'Closed', 'In Progress'],
  closed: [],
  withdrawn: [],
};

complaintSchema.statics.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
complaintSchema.statics.canTransition = (currentStatus, nextStatus) => (
  STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) || false
);

complaintSchema.pre('save', function syncUpvoteCount(next) {
  this.upvoteCount = this.upvotes.length;
  next();
});

// Member 4 (Security audit trail)
complaintSchema.post('save', async (document) => {
  await AuditLog.create({
    complaintId: document._id,
    performedBy: document.submittedBy,
    action: 'COMPLAINT_SAVED',
    newState: document.toObject(),
  });
});

complaintSchema.post('findOneAndUpdate', async (document) => {
  if (!document) {
    return;
  }

  await AuditLog.create({
    complaintId: document._id,
    performedBy: document.submittedBy,
    action: 'COMPLAINT_UPDATED',
    newState: document.toObject(),
  });
});

module.exports = mongoose.model('Complaint', complaintSchema);