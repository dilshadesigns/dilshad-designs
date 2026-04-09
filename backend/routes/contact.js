/**
 * routes/contact.js
 * Mounts the contact form and lead capture routes
 */

'use strict';

const express     = require('express');
const router      = express.Router();
const contactCtrl = require('../controllers/contactController');
const { validateContact, validateLead } = require('../config/validation');

// POST /api/contact       — full contact form submission
router.post('/', validateContact, contactCtrl.sendContactEmail);

// POST /api/contact/lead  — chatbot lead capture email
router.post('/lead', validateLead, contactCtrl.sendLeadEmail);

module.exports = router;