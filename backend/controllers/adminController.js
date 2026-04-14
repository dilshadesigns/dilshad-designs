/**
 * controllers/adminController.js
 * Handles admin login + dashboard data requests
 */

'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Contact = require('../models/Contact');
const Lead    = require('../models/Lead');

// -----------------------------------------------------------------------
// POST /api/admin/login
// Validates password with bcrypt and returns a signed JWT
// -----------------------------------------------------------------------
exports.login = async (req, res, next) => {
  try {
    const { password } = req.body;

    // ── 1. Input validation ─────────────────────────────────────────────
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(422).json({
        success : false,
        message : 'Password is required.'
      });
    }

    // ── 2. Check env vars ───────────────────────────────────────────────
    if (!process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
      console.error('[adminController] ADMIN_PASSWORD_HASH or JWT_SECRET missing in .env');
      return res.status(500).json({
        success : false,
        message : 'Server configuration error.'
      });
    }

    // ── 3. Verify password against bcrypt hash ──────────────────────────
    const isValid = await bcrypt.compare(password.trim(), process.env.ADMIN_PASSWORD_HASH);

    if (!isValid) {
      // Generic message — never reveal which part is wrong
      return res.status(401).json({
        success : false,
        message : 'Invalid credentials.'
      });
    }

    // ── 4. Issue JWT ────────────────────────────────────────────────────
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success : true,
      token,
      expiresIn: 3600   // seconds — useful for the frontend countdown timer
    });

  } catch (err) {
    console.error('[adminController] login failed:', err.message);
    return next({ status: 500, message: 'Login failed. Please try again.' });
  }
};

// -----------------------------------------------------------------------
// GET /api/admin/stats
// Returns summary numbers for the dashboard
// -----------------------------------------------------------------------
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalContacts,
      newContacts,
      totalLeads,
      newLeads
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' })
    ]);

    return res.status(200).json({
      success : true,
      data    : { totalContacts, newContacts, totalLeads, newLeads }
    });

  } catch (err) {
    console.error('[adminController] getStats failed:', err.message);
    return next({ status: 500, message: 'Failed to fetch stats.' });
  }
};

// -----------------------------------------------------------------------
// DELETE /api/admin/contacts/:id
// -----------------------------------------------------------------------
exports.deleteContact = async (req, res, next) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next({ status: 500, message: 'Failed to delete.' });
  }
};

// -----------------------------------------------------------------------
// DELETE /api/admin/leads/:id
// -----------------------------------------------------------------------
exports.deleteLead = async (req, res, next) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next({ status: 500, message: 'Failed to delete.' });
  }
};

// -----------------------------------------------------------------------
// GET /api/admin/contacts
// Returns all contact form submissions newest first
// -----------------------------------------------------------------------
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success : true,
      count   : contacts.length,
      data    : contacts
    });
  } catch (err) {
    console.error('[adminController] getContacts failed:', err.message);
    return next({ status: 500, message: 'Failed to fetch contacts.' });
  }
};

// -----------------------------------------------------------------------
// GET /api/admin/leads
// Returns all chatbot leads newest first
// -----------------------------------------------------------------------
exports.getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success : true,
      count   : leads.length,
      data    : leads
    });
  } catch (err) {
    console.error('[adminController] getLeads failed:', err.message);
    return next({ status: 500, message: 'Failed to fetch leads.' });
  }
};

// -----------------------------------------------------------------------
// PATCH /api/admin/contacts/:id
// Update the status of a contact (new → read → replied)
// -----------------------------------------------------------------------
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ['new', 'read', 'replied'];
    if (!allowed.includes(status)) {
      return res.status(422).json({
        success : false,
        message : `Status must be one of: ${allowed.join(', ')}`
      });
    }

    const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    return res.status(200).json({ success: true, data: contact });

  } catch (err) {
    console.error('[adminController] updateContactStatus failed:', err.message);
    return next({ status: 500, message: 'Failed to update contact.' });
  }
};

// -----------------------------------------------------------------------
// PATCH /api/admin/leads/:id
// Update the status of a lead (new → contacted → converted)
// -----------------------------------------------------------------------
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ['new', 'contacted', 'converted'];
    if (!allowed.includes(status)) {
      return res.status(422).json({
        success : false,
        message : `Status must be one of: ${allowed.join(', ')}`
      });
    }

    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    return res.status(200).json({ success: true, data: lead });

  } catch (err) {
    console.error('[adminController] updateLeadStatus failed:', err.message);
    return next({ status: 500, message: 'Failed to update lead.' });
  }
};