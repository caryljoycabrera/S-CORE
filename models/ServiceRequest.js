// ===== Service Request Model =====
// This module defines the ServiceRequest schema for the database
// Represents service requests submitted by users for administrative processing

const mongoose = require('mongoose');

/**
 * ServiceRequest Schema Definition
 * Defines the structure for service request documents in MongoDB
 */
const serviceRequestSchema = new mongoose.Schema({
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
    enum: ['Pending', 'Approved', 'For Revision', 'Completed', 'Rejected', 'Archived']
  },

  // Administrative assignment
  assignedUnits: {
    type: String,
    default: 'Not yet assigned'
  },

  // Track original auto-assignment for view permissions
  originalAssignedUnits: {
    type: String,
    default: ''
  },

  // File attachments (legacy single file field)
  file: {
    type: String // Keep for backward compatibility
  },

  // Multiple file attachments (new field supporting multiple files)
  files: [{
    type: String
  }],

  // Deliverables uploaded by unit team (completed work)
  deliverables: [{
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
 * ServiceRequest Model
 * Provides interface for interacting with ServiceRequest documents in MongoDB
 */
const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

module.exports = ServiceRequest;
