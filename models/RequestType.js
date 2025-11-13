// ===== Request Type Model =====
// This module defines the RequestType schema for managing custom request types
// Allows users to submit custom request types that admins can approve/reject

const mongoose = require('mongoose');

/**
 * RequestType Schema Definition
 * Defines the structure for request type documents in MongoDB
 */
const requestTypeSchema = new mongoose.Schema({
  // Request type details
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  // Type category (service or approval)
  category: {
    type: String,
    required: true,
    enum: ['service', 'approval'],
    default: 'service'
  },

  // Assigned unit for this request type
  assignedUnit: {
    type: String,
    required: true,
    trim: true
  },

  // Status of the request type
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Who submitted this custom type
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Admin who approved/rejected
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Review notes/comments
  reviewNotes: {
    type: String,
    trim: true
  },

  // When it was reviewed
  reviewedAt: {
    type: Date
  },

  // Usage count (how many requests use this type)
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * RequestType Model
 * Provides interface for interacting with RequestType documents in MongoDB
 */
const RequestType = mongoose.model('RequestType', requestTypeSchema);

module.exports = RequestType;
