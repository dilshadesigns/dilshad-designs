/**
 * config/adminAuth.js
 * JWT-based authentication middleware for admin routes
 */

'use strict';

const jwt = require('jsonwebtoken');

/**
 * verifyAdminToken
 * Extracts and verifies the JWT from the Authorization header.
 * Rejects with appropriate HTTP codes for missing / invalid / expired tokens.
 */
exports.verifyAdminToken = (req, res, next) => {
  const authHeader =
    req.headers['authorization'] || req.headers['Authorization'];

  // ── 1. Header missing ────────────────────────────────────────────────
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success : false,
      message : 'Unauthorized access. No token provided.'
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success : false,
      message : 'Unauthorized access. Token is empty.'
    });
  }

  // ── 2. Verify JWT_SECRET is configured ───────────────────────────────
  if (!process.env.JWT_SECRET) {
    console.error('[adminAuth] JWT_SECRET is not set in .env');
    return res.status(500).json({
      success : false,
      message : 'Server configuration error.'
    });
  }

  // ── 3. Verify token ───────────────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only allow tokens with role: 'admin'
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success : false,
        message : 'Unauthorized access. Insufficient privileges.'
      });
    }

    req.admin = decoded; // attach payload for downstream use
    return next();

  } catch (err) {
    // Expired token → tell frontend to re-login
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success  : false,
        message  : 'Session expired. Please log in again.',
        expired  : true
      });
    }

    // Any other JWT error (tampered, malformed, wrong secret)
    return res.status(401).json({
      success : false,
      message : 'Unauthorized access. Invalid token.'
    });
  }
};