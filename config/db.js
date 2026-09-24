const mongoose = require('mongoose');

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    const error = new Error('MONGODB_URI or MONGO_URI is not configured.');
    console.error('[IssueHub] Database configuration error:', error.message);
    throw error;
  }

  try {
    console.log('[IssueHub] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[IssueHub] MongoDB connected successfully.');
  } catch (error) {
    console.error('[IssueHub] MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDatabase;
