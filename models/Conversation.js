// ===== Conversation Model =====
// This module defines the Conversation schema for the database
// Manages conversations between users and admins about specific requests

const mongoose = require('mongoose');

/**
 * Conversation Schema Definition
 * Defines the structure for conversation documents in MongoDB
 * Each conversation is linked to either a service request or approval request
 */
const conversationSchema = new mongoose.Schema({
  // Reference to the specific request this conversation is about
  serviceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  approvalRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestApproval'
  },

  // Conversation type (must match the request ID provided)
  requestType: {
    type: String,
    enum: ['service', 'approval'],
    required: true
  },

  // Array of messages exchanged in this conversation
  messages: [{
    // Reference to user who sent the message
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Sender's role (determines permissions and UI display)
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    // Message content
    content: {
      type: String,
      required: false // Allow empty content if there's a file attachment
    },
    // File attachment information
    file_path: {
      type: String,
      required: false
    },
    file_type: {
      type: String,
      required: false
    },
    original_filename: {
      type: String,
      required: false
    },
    file_size: {
      type: Number,
      required: false
    },
    // Timestamp of when message was sent
    timestamp: {
      type: Date,
      default: Date.now
    },
    // Whether the recipient has read this message
    isRead: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Pre-save validation middleware
 * Ensures conversation has exactly one request ID and that requestType matches
 */
conversationSchema.pre('validate', function() {
  const hasServiceRequest = !!this.serviceRequestId;
  const hasApprovalRequest = !!this.approvalRequestId;

  // Must have exactly one request ID
  if (!hasServiceRequest && !hasApprovalRequest) {
    this.invalidate('requestType', 'Either serviceRequestId or approvalRequestId must be provided');
  }

  if (hasServiceRequest && hasApprovalRequest) {
    this.invalidate('requestType', 'Cannot have both serviceRequestId and approvalRequestId');
  }

  // Validate requestType matches the request ID provided
  if (hasServiceRequest && this.requestType !== 'service') {
    this.invalidate('requestType', 'requestType must be "service" when serviceRequestId is provided');
  }

  if (hasApprovalRequest && this.requestType !== 'approval') {
    this.invalidate('requestType', 'requestType must be "approval" when approvalRequestId is provided');
  }
});

/**
 * Conversation Model
 * Provides interface for interacting with Conversation documents in MongoDB
 * Manages messaging between users and administrators
 */
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
