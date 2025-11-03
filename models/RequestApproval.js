// ===== Request Approval Model =====
// This module defines the RequestApproval schema for the database
// Represents approval requests submitted by users for administrative review

const mongoose = require('mongoose');

/**
 * RequestApproval Schema Definition
 * Defines the structure for approval request documents in MongoDB
 */
const requestApprovalSchema = new mongoose.Schema({
  // Request details
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },

  // Specific type of request (helps categorize and manage requests)
  specificRequestType: {
    type: String,
    trim: true
  },

  // Timing information
  datetime: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },

  // User who submitted the request
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Request status tracking
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'For Revision', 'Approved', 'Rejected', 'Archived']
  },

  // Administrative assignment
  assignedUnits: {
    type: String,
    default: 'Not yet assigned'
  },

  // File attachments (legacy single file field)
  file: {
    type: String // Keep for backward compatibility
  },

  // Multiple file attachments (new field supporting multiple files)
  files: [{
    type: String
  }],

  // Track if additional file upload is allowed for revision requests
  allowAdditionalFileUpload: {
    type: Boolean,
    default: true
  },

  // Admin viewing tracking
  viewed: {
    type: Boolean,
    default: false
  },
  viewedAt: {
    type: Date
  },
  viewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * RequestApproval Model
 * Provides interface for interacting with RequestApproval documents in MongoDB
 */
const RequestApproval = mongoose.model('RequestApproval', requestApprovalSchema);

module.exports = RequestApproval;
