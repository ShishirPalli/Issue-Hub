const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['student', 'admin', 'grievance_officer'],
      default: 'student',
      index: true,
    },
    department: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        delete returnedObject.password;
        delete returnedObject.refreshToken;
        delete returnedObject.__v;
        return returnedObject;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_document, returnedObject) => {
        delete returnedObject.password;
        delete returnedObject.refreshToken;
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
