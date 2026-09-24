require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

app.use('/api/auth', authRoutes);

// Other members: mount your routes here, e.g.
// app.use('/api/complaints', complaintRoutes);

// 404 handler — must come after all real routes
// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Centralized error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(5000, () => console.log("Server listening on port 5000"));