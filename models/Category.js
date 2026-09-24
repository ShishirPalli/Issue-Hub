const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 60,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    // Member 4 (Security)
    isSensitive: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Member 5 (AI)
    aiKeywords: {
      type: [String],
      default: [],
    },
    defaultAssignedOfficer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    slaHours: {
      type: Number,
      default: 48,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('Category', categorySchema);