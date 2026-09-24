const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // Member 1 (Auth/Roles)
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'grievance_officer'],
      default: 'student',
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Member 4 (Security transforms)
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
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

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);