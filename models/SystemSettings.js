// ===== SystemSettings Model =====
// Manages system-wide configuration settings

const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  siteTitle: {
    type: String,
    default: 'S-CORE - Student Communications Office Request & Engagement System'
  },
  siteDescription: {
    type: String,
    default: 'A comprehensive request management portal for DLSU-D Student Communications Office'
  },
  timezone: {
    type: String,
    default: 'Asia/Manila'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  language: {
    type: String,
    default: 'en'
  },
  logo: {
    type: String,
    default: null
  },
  favicon: {
    type: String,
    default: null
  },

  // Request Management Settings
  maxRevisions: {
    type: Number,
    default: 3
  },
  maxMinorRevisions: {
    type: Number,
    default: 2
  },
  defaultDeadlineDays: {
    type: Number,
    default: 7
  },
  autoApproveAfterRevisions: {
    type: Boolean,
    default: false
  },
  requireUnitReview: {
    type: Boolean,
    default: true
  },

  // Units & Organizations Settings
  units: [{
    type: String
  }],
  organizations: [{
    type: String
  }],

  // Offices/Departments Settings
  offices: [{
    type: String
  }],

  // Request Management Settings
  requestStatuses: [{
    type: String,
    default: ['Pending', 'Queued', 'In Progress', 'For Checking', 'Approved', 'For Revision', 'Completed', 'Rejected', 'Archived']
  }],
  userRoles: [{
    name: String,
    permissions: [{
      type: String
    }]
  }],
  announcementPriorities: [{
    type: String,
    default: ['low', 'medium', 'high']
  }],
  announcementTypes: [{
    type: String,
    default: ['Event', 'News', 'Reminder', 'Update', 'Maintenance']
  }],

  // Request Type to Unit Mappings
  requestTypeMappings: [{
    requestType: String,
    recommendedUnit: String
  }],

  // Notification Settings
  enableEmailNotifications: {
    type: Boolean,
    default: true
  },
  smtpHost: {
    type: String,
    default: process.env.SMTP_HOST || 'smtp.gmail.com'
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  emailFrom: {
    type: String,
    default: 'noreply@dlsud.edu.ph'
  },
  notificationFrequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly'],
    default: 'immediate'
  },

  // File Storage Settings
  maxFileSize: {
    type: Number,
    default: 50 // in MB
  },
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'xlsx', 'xls', 'txt', 'pptx']
  },
  storageType: {
    type: String,
    enum: ['local', 'aws', 'gcs'],
    default: 'local'
  },
  retainAllRevisionFiles: {
    type: Boolean,
    default: true
  },
  autoDeleteOldFilesAfterDays: {
    type: Number,
    default: null // null means never auto-delete
  },

  // Backup & Maintenance
  backupEnabled: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  backupRetentionDays: {
    type: Number,
    default: 90
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'System is under maintenance. Please try again later.'
  },

  // Audit & Logging
  enableDetailedLogs: {
    type: Boolean,
    default: true
  },
  logRetentionDays: {
    type: Number,
    default: 90
  },
  trackUserActions: {
    type: Boolean,
    default: true
  },

  // Metadata
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, collection: 'system_settings' });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
