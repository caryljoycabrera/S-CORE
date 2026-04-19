// ===== Chatbot Flow Model =====
// Stores role-based question and answer entries for rule-based chatbot logic

const mongoose = require('mongoose');

const ALLOWED_CATEGORIES = ['general', 'technical', 'request_process', 'account', 'workflow'];

function normalizeCategory(category) {
  if (typeof category !== 'string') return 'general';

  const normalized = category.trim().toLowerCase().replace(/\s+/g, '_');
  if (ALLOWED_CATEGORIES.includes(normalized)) {
    return normalized;
  }

  // Backward compatibility for common labels in admin UI.
  if (normalized === 'request' || normalized === 'requests') return 'request_process';
  if (normalized === 'process') return 'request_process';
  return 'general';
}

function normalizeQuestion(question) {
  if (typeof question !== 'string') return '';
  return question.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildFlowId(role) {
  return `${role || 'public'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const chatbotFlowSchema = new mongoose.Schema({
  flowId: {
    type: String,
    unique: true,
    trim: true,
    required: true
  },
  role: {
    type: String,
    enum: ['public', 'user', 'unit', 'admin'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ALLOWED_CATEGORIES,
    default: 'general',
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  questionNormalized: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  nextFlowId: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  collection: 'chatbot_flows'
});

chatbotFlowSchema.pre('validate', function normalizeFlow(next) {
  if (!this.flowId) {
    this.flowId = buildFlowId(this.role);
  }

  this.category = normalizeCategory(this.category);
  this.questionNormalized = normalizeQuestion(this.question);

  if (!Array.isArray(this.keywords)) {
    this.keywords = [];
  }

  this.keywords = this.keywords
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
    .filter(Boolean);

  next();
});

chatbotFlowSchema.index({ role: 1, questionNormalized: 1 }, { unique: true });
chatbotFlowSchema.index({ role: 1, isActive: 1, sortOrder: 1 });

module.exports = mongoose.models.ChatbotFlow || mongoose.model('ChatbotFlow', chatbotFlowSchema);
