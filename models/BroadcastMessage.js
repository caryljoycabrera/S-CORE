// ===== Broadcast Message Model =====
// This module defines the BroadcastMessage schema for the database
// Manages system-wide announcements and messages sent by administrators

const mongoose = require('mongoose');

/**
 * BroadcastMessage Schema Definition
 * Defines the structure for broadcast message documents in MongoDB
 * Used for system announcements sent by admins to multiple users
 */
const broadcastMessageSchema = new mongoose.Schema({
  // Message content
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },

  // Message priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Announcement type
  type: {
    type: String,
    default: 'News'
  },

  // Announcement status
  status: {
    type: String,
    enum: ['active', 'scheduled', 'archived'],
    default: 'active'
  },

  // Recipients and their read status
  recipients: [{
    // Reference to each recipient user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Whether this specific user has read the message
    isRead: {
      type: Boolean,
      default: false
    },
    // When the user read the message
    readAt: {
      type: Date
    }
  }],

  // Message metadata
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },

  // Visibility settings
  isVisibleToAll: {
    type: Boolean,
    default: true
  },

  // Scheduled send time
  scheduledTime: {
    type: Date
  },

  // Optional expiration date
  expiresAt: {
    type: Date
  },

  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * BroadcastMessage Model
 * Provides interface for interacting with BroadcastMessage documents in MongoDB
 * Manages system-wide notifications and announcements
 */
const BroadcastMessage = mongoose.model('BroadcastMessage', broadcastMessageSchema);

module.exports = BroadcastMessage;
