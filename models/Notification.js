// ===== Notification Model =====
// This module defines the Notification schema for the database
// Handles all types of notifications including service requests, approvals, chats, and system notifications

const mongoose = require('mongoose');

/**
 * Notification Schema Definition
 * Defines the structure for notification documents in MongoDB
 */
const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sender of the notification (optional for system notifications)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  // Type of notification to categorize and handle differently
  type: {
    type: String,
    enum: [
      'service_created',     // New service request submitted
      'service_approved',    // Service request approved
      'service_rejected',    // Service request rejected
      'service_updated',     // Service request updated
      'service_completed',   // Service request completed
      'approval_created',    // New approval request submitted
      'approval_approved',   // Approval request approved
      'approval_rejected',   // Approval request rejected
      'approval_updated',    // Approval request updated
      'approval_revision',   // Approval request needs revision
      'user_registered',     // New user registration (admin notification)
      'user_approved',       // User account approved
      'user_denied',         // User account denied
      'new_message',         // New chat message
      'system',              // System notification
      'deadline_reminder',   // Deadline reminder
      'status_change',       // General status change
      'unit_task_assigned',  // Task assigned to unit team
      'unit_task_updated'    // Task updated for unit team
    ],
    required: true
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },

  // Related document information (optional)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  relatedModel: {
    type: String,
    enum: ['ServiceRequest', 'RequestApproval', 'Conversation', 'User'],
    required: false
  },

  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },

  // Priority level for notification display
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Action URL (optional - for clickable notifications)
  actionUrl: {
    type: String,
    trim: true
  },

  // Prevent deletion (for important system notifications like welcome messages)
  isDeletable: {
    type: Boolean,
    default: true
  },

  // Track if user has interacted with the notification
  isInteracted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });

/**
 * Notification Model
 * Provides interface for interacting with Notification documents in MongoDB
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;