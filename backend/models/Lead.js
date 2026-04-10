/**
 * models/Lead.js
 * Schema for chatbot lead capture submissions
 */

'use strict';

const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  email  : {
    type      : String,
    required  : true,
    trim      : true,
    lowercase : true,
    unique    : true  // prevent duplicate emails
  },
  status : {
    type    : String,
    enum    : ['new', 'contacted', 'converted'],
    default : 'new'
  },
  source : {
    type    : String,
    default : 'chatbot'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);