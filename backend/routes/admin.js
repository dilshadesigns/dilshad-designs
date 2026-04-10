/**
 * routes/admin.js
 * Protected admin dashboard API routes
 */

'use strict';

const express     = require('express');
const router      = express.Router();
const adminCtrl   = require('../controllers/adminController');
const { authAdmin } = require('../config/adminAuth');

// All admin routes require password authentication
router.use(authAdmin);

// GET /api/admin/stats      — dashboard summary numbers
router.get('/stats',    adminCtrl.getStats);

// GET /api/admin/contacts   — all contact form submissions
router.get('/contacts', adminCtrl.getContacts);

// GET /api/admin/leads      — all chatbot leads
router.get('/leads',    adminCtrl.getLeads);

// PATCH /api/admin/contacts/:id — update contact status
router.patch('/contacts/:id', adminCtrl.updateContactStatus);

// PATCH /api/admin/leads/:id    — update lead status
router.patch('/leads/:id',    adminCtrl.updateLeadStatus);

module.exports = router;