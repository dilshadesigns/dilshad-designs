/**
 * models/Contact.js
 * Schema for contact form submissions
 */

'use strict';

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name    : {
    type     : String,
    required : true,
    trim     : true
  },
  email   : {
    type     : String,
    required : true,
    trim     : true,
    lowercase: true
  },
  subject : {
    type     : String,
    required : true,
    trim     : true
  },
  message : {
    type     : String,
    required : true,
    trim     : true
  },
  status  : {
    type    : String,
    enum    : ['new', 'read', 'replied'],
    default : 'new'
  },
  source  : {
    type    : String,
    default : 'contact-form'
  }
}, {
  timestamps: true  // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Contact', contactSchema);