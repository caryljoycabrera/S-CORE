/**
 * ReportHistory Model
 * Stores generated report history and PDF data
 */

const mongoose = require('mongoose');

const reportHistorySchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['report_pdf', 'analytics_pdf', 'custom_report']
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
  pdfData: {
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
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
reportHistorySchema.index({ generatedBy: 1, generatedAt: -1 });
reportHistorySchema.index({ reportType: 1 });

module.exports = mongoose.model('ReportHistory', reportHistorySchema);