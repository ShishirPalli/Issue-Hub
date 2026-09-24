
require('dotenv').config();

const express = require('express');
const connectDatabase = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api', analyticsRoutes);

const start = async () => {
  try {
    await connectDatabase();
    console.log('IssueHub schema foundation initialized successfully.');
    app.listen(port, () => {
      console.log(`[IssueHub] API server listening on port ${port}.`);
    });
  } catch (error) {
    process.exitCode = 1;
  }
};

start();