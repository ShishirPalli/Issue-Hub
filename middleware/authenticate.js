const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return next(new AppError('Not logged in. Please log in to access this resource', 401));

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User no longer exists', 401));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
