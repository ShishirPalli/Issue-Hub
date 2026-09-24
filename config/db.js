const mongoose = require('mongoose');

 feature/auth-member1
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const error = new Error('MONGODB_URI is not configured.');
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
 main
