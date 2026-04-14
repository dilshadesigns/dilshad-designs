/**
 * routes/admin.js
 * Protected admin dashboard API routes + login endpoint
 */

'use strict';

const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');
const adminCtrl    = require('../controllers/adminController');
const { verifyAdminToken } = require('../config/adminAuth');

// ── Brute-force protection on login ──────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs        : 15 * 60 * 1000,  // 15 minutes
  max             : 5,                // 5 attempts per window
  skipSuccessfulRequests: true,       // only count failures
  message         : {
    success : false,
    message : 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders : true,
  legacyHeaders   : false,
});

// ── Public route — login ─────────────────────────────────────────────────
// POST /api/admin/login
router.post('/login', loginLimiter, adminCtrl.login);

// ── Protected routes — require valid JWT ─────────────────────────────────
router.use(verifyAdminToken);

// GET  /api/admin/stats        — dashboard summary numbers
router.get('/stats',    adminCtrl.getStats);

// GET  /api/admin/contacts     — all contact form submissions
router.get('/contacts', adminCtrl.getContacts);

// GET  /api/admin/leads        — all chatbot leads
router.get('/leads',    adminCtrl.getLeads);

// PATCH /api/admin/contacts/:id — update contact status
router.patch('/contacts/:id', adminCtrl.updateContactStatus);

// PATCH /api/admin/leads/:id    — update lead status
router.patch('/leads/:id',    adminCtrl.updateLeadStatus);

// DELETE /api/admin/contacts/:id
router.delete('/contacts/:id', adminCtrl.deleteContact);

// DELETE /api/admin/leads/:id
router.delete('/leads/:id',    adminCtrl.deleteLead);

module.exports = router;