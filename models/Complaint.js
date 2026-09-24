const mongoose = require('mongoose');

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
      enum: ['submitted', 'in_progress', 'resolved', 'closed', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    clarificationThreads: {
      type: [clarificationThreadSchema],
      default: [],
    },
    resolutionConfirmation: {
      type: resolutionConfirmationSchema,
      default: () => ({}),
    },
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
  {
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject, options) => {
        if (returnedObject.isSensitive && !options.includeSensitiveComplainant) {
          returnedObject.submittedBy = {
            name: 'Anonymous Student',
            isRedacted: true,
          };
        }
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ 'priorityMetrics.calculatedScore': -1, upvoteCount: -1 });
complaintSchema.index({ title: 'text', description: 'text' });

complaintSchema.pre('save', function syncUpvoteCount(next) {
  this.upvoteCount = this.upvotes.length;
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);