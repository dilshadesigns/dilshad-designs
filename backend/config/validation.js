/**
 * config/validation.js
 *
 * Express middleware for validating and sanitizing:
 *  1. Contact form input   → validateContact
 *  2. Chatbot lead email   → validateLead
 */

'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isString(val) {
  return typeof val === 'string';
}

function safeStr(val) {
  return isString(val) ? val.trim() : '';
}

// -----------------------------------------------------------------------
// validateContact — for the main contact form
// -----------------------------------------------------------------------
exports.validateContact = (req, res, next) => {
  const errors = [];

  const name    = safeStr(req.body.name);
  const email   = safeStr(req.body.email);
  const subject = safeStr(req.body.subject);
  const message = safeStr(req.body.message);

  if (!name) {
    errors.push({ field: 'name', message: 'Name is required.' });
  } else if (name.length < 2 || name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters.' });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  if (!subject) {
    errors.push({ field: 'subject', message: 'Project type is required.' });
  }

  if (!message) {
    errors.push({ field: 'message', message: 'Project details are required.' });
  } else if (message.length < 20) {
    errors.push({ field: 'message', message: 'Please describe your project in at least 20 characters.' });
  } else if (message.length > 5000) {
    errors.push({ field: 'message', message: 'Message is too long (max 5000 characters).' });
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success : false,
      message : 'Validation failed. Please check your input.',
      errors,
    });
  }

  req.body.name    = name;
  req.body.email   = email;
  req.body.subject = subject;
  req.body.message = message;

  return next();
};

// -----------------------------------------------------------------------
// validateLead — for the chatbot lead capture popup
// -----------------------------------------------------------------------
exports.validateLead = (req, res, next) => {
  const email = safeStr(req.body.email);

  if (!email) {
    return res.status(422).json({
      success : false,
      message : 'Email is required.'
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(422).json({
      success : false,
      message : 'Please provide a valid email address.'
    });
  }

  req.body.email = email;
  return next();
};