require('dotenv').config();

const connectDatabase = require('./config/db');

const start = async () => {
  try {
    await connectDatabase();
    console.log('IssueHub schema foundation initialized successfully.');
  } catch (error) {
    process.exitCode = 1;
  }
};

start();