/**
 * controllers/adminController.js
 * Handles admin dashboard data requests
 */

'use strict';

const Contact = require('../models/Contact');
const Lead    = require('../models/Lead');

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
      data    : {
        totalContacts,
        newContacts,
        totalLeads,
        newLeads
      }
    });

  } catch (err) {
    console.error('[adminController] getStats failed:', err.message);
    return next({ status: 500, message: 'Failed to fetch stats.' });
  }
};

// -----------------------------------------------------------------------
// GET /api/admin/contacts
// Returns all contact form submissions newest first
// -----------------------------------------------------------------------
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact
      .find()
      .sort({ createdAt: -1 })
      .lean();

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
    const leads = await Lead
      .find()
      .sort({ createdAt: -1 })
      .lean();

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

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success : false,
        message : 'Contact not found.'
      });
    }

    return res.status(200).json({
      success : true,
      data    : contact
    });

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

    const lead = await Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({
        success : false,
        message : 'Lead not found.'
      });
    }

    return res.status(200).json({
      success : true,
      data    : lead
    });

  } catch (err) {
    console.error('[adminController] updateLeadStatus failed:', err.message);
    return next({ status: 500, message: 'Failed to update lead.' });
  }
};