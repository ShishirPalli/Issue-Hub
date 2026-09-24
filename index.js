require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./config/db');
const complaintRoutes = require('./routes/complaintRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use('/api/complaints', complaintRoutes);
app.use(errorHandler);

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