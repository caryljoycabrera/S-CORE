// ===== Chatbot Configuration Model =====
// Stores global chatbot settings and page visibility controls

const mongoose = require('mongoose');

const chatbotConfigSchema = new mongoose.Schema({
  singletonKey: {
    type: String,
    default: 'default',
    unique: true,
    trim: true
  },
  enabledPages: {
    homepage: { type: Boolean, default: true },
    user: { type: Boolean, default: true },
    unit: { type: Boolean, default: true },
    admin: { type: Boolean, default: false }
  },
  widget: {
    position: {
      type: String,
      enum: ['bottom-right'],
      default: 'bottom-right'
    },
    primaryColor: {
      type: String,
      default: '#10b981'
    },
    headerTitle: {
      type: String,
      default: 'S-CORE Assistant'
    },
    width: {
      type: Number,
      default: 360,
      min: 280,
      max: 480
    }
  },
  greetings: {
    public: {
      type: String,
      default: 'Good day. How may I assist you regarding S-CORE services?'
    },
    user: {
      type: String,
      default: 'Good day. How may I assist you with your S-CORE requests today?'
    },
    unit: {
      type: String,
      default: 'Good day. How may I assist your unit with assigned tasks today?'
    },
    admin: {
      type: String,
      default: 'Good day. How may I assist you with administrative tasks today?'
    }
  },
  fallbackMessage: {
    type: String,
    default: 'Thank you for your inquiry. I am unable to find an exact answer at this time. Please rephrase your question using key terms from your request.'
  },
  formalToneEnforced: {
    type: Boolean,
    default: true
  },
  useSocketRealtime: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  collection: 'chatbot_configs'
});

module.exports = mongoose.models.ChatbotConfig || mongoose.model('ChatbotConfig', chatbotConfigSchema);
