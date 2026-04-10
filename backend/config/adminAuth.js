/**
 * config/adminAuth.js
 * Simple password based protection for admin routes
 */

'use strict';

exports.authAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success : false,
      message : 'Authorization header missing.'
    });
  }

  // Expected format: "Bearer yourpassword"
  const parts    = authHeader.split(' ');
  const password = parts[1];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({
      success : false,
      message : 'Invalid admin password.'
    });
  }

  return next();
};