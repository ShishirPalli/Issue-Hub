const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';
  let message = error.message || 'Internal server error.';

  if (error.name === 'ValidationError') {
    message = Object.values(error.errors).map((validationError) => validationError.message).join(', ');
  }

  if (error.code === 11000) {
    message = `Duplicate value for field: ${Object.keys(error.keyValue).join(', ')}`;
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'fail', message: 'Invalid token, please log in again.' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'fail', message: 'Token expired, please log in again.' });
  }

  return res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorHandler;
