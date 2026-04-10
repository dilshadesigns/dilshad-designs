/**
 * config/adminAuth.js
 * Simple password based protection for admin routes
 */

'use strict';

exports.authAdmin = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // No header sent
  if (!authHeader) {
    return res.status(401).json({
      success : false,
      message : 'Authorization header missing.'
    });
  }

  // Handle both "Bearer password" and just "password"
  let password;
  if (authHeader.startsWith('Bearer ')) {
    password = authHeader.slice(7).trim();
  } else {
    password = authHeader.trim();
  }

  // No password after stripping Bearer
  if (!password) {
    return res.status(401).json({
      success : false,
      message : 'Password is empty.'
    });
  }

  // ADMIN_PASSWORD not set in .env
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[adminAuth] ADMIN_PASSWORD is not set in .env');
    return res.status(500).json({
      success : false,
      message : 'Server configuration error.'
    });
  }

  // Compare passwords
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({
      success : false,
      message : 'Incorrect password. Please try again.'
    });
  }

  return next();
};