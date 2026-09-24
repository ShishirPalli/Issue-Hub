const mongoose = require('mongoose');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    // Member 4 (Security audit trail)
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'COMPLAINT_CREATED',
        'COMPLAINT_SAVED',
        'COMPLAINT_UPDATED',
        'STATUS_UPDATED',
        'CLARIFICATION_POSTED',
        'PROOF_OF_FIX_UPLOADED',
        'RESOLUTION_CONFIRMED',
        'MARKED_DUPLICATE',
        'MARKED_SENSITIVE',
        'SENSITIVE_VIEW_ACCESSED',
        'PRIORITY_RECALCULATED',
      ],
    },
    previousState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      reason: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const immutableUpdate = function immutableUpdate() {
  throw new Error('AuditLog documents are immutable and cannot be updated.');
};

auditLogSchema.pre('updateOne', immutableUpdate);
auditLogSchema.pre('findOneAndUpdate', immutableUpdate);

module.exports = mongoose.model('AuditLog', auditLogSchema);