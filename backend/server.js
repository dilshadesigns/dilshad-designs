/**
 * server.js — Dilshad Designs Backend
 * Node.js + Express server
 *
 * Responsibilities:
 *  - Serve the frontend static files (in production)
 *  - Handle contact form submissions via /api/contact
 *  - Apply security middleware (helmet, cors, rate limiting)
 *  - Sanitize & validate all incoming data
 */

'use strict';

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const contactRouter = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===================================================================
// SECURITY MIDDLEWARE
// ===================================================================

// Helmet sets sensible HTTP security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP here; configure per your CDN needs
}));

// CORS — restrict origins in production via .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'https://dilshadesigns.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: Origin not allowed — ' + origin));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ===================================================================
// GENERAL MIDDLEWARE
// ===================================================================

// Parse JSON bodies (max 10kb to prevent abuse)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ===================================================================
// RATE LIMITING
// ===================================================================

// Global rate limit — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 100,
  message  : { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders  : false,
});
app.use(globalLimiter);

// Strict limit on the contact API — 5 submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs : 60 * 60 * 1000, // 1 hour
  max      : 5,
  message  : { success: false, message: 'Too many contact submissions. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders  : false,
});
app.use('/api/contact', contactLimiter);

// ===================================================================
// ROUTES
// ===================================================================

// API routes
app.use('/api/contact', contactRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
// Serve frontend static files (both development and production)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback — serve index.html for any unmatched route
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===================================================================
// GLOBAL ERROR HANDLER
// ===================================================================
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success : false,
    message : process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message,
  });
});

// ===================================================================
// START SERVER
// ===================================================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Dilshad Designs — Backend Server   ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app; // Export for testing