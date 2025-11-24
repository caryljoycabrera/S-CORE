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
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }],
  organizations: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
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

  // Feature Flags
  enableAnnouncements: {
    type: Boolean,
    default: true
  },
  enableUserSearch: {
    type: Boolean,
    default: true
  },
  enableDarkMode: {
    type: Boolean,
    default: true
  },
  enableAnalytics: {
    type: Boolean,
    default: true
  },
  enableMobileApp: {
    type: Boolean,
    default: false
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
