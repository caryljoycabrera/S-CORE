/**
 * ReportHistory Model
 * Stores generated report history and PDF data
 */

const mongoose = require('mongoose');

const reportHistorySchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['report_pdf', 'report_excel', 'analytics_pdf', 'custom_report']
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileData: {
    type: Buffer,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  recordCount: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportHistorySchema.index({ generatedBy: 1, generatedAt: -1 });
reportHistorySchema.index({ reportType: 1, generatedAt: -1 });
reportHistorySchema.index({ isDeleted: 1 });

// Virtual for checking if report is active
reportHistorySchema.virtual('isActive').get(function() {
  return !this.isDeleted;
});

// Method to soft delete
reportHistorySchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
reportHistorySchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Static method to find active reports
reportHistorySchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

module.exports = mongoose.model('ReportHistory', reportHistorySchema);