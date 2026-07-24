// ===== Request Approval Model =====
// This module defines the RequestApproval schema for the database
// Represents approval requests submitted by users for administrative review

const mongoose = require('mongoose');

/**
 * RequestApproval Schema Definition
 * Defines the structure for approval request documents in MongoDB
 */
const requestApprovalSchema = new mongoose.Schema({
  // Request details
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },

  // Specific type of request (helps categorize and manage requests)
  specificRequestType: {
    type: String,
    trim: true
  },

  // Timing information
  datetime: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },

  // User who submitted the request
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Request status tracking
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Queued', 'In Progress', 'For Revision', 'For Checking', 'Approved', 'Rejected', 'Completed', 'Archived']
  },

  // Administrative assignment
  assignedUnits: {
    type: String,
    default: 'Not yet assigned'
  },

  // Track original auto-assignment for unit permissions
  originalAssignedUnits: {
    type: String,
    default: ''
  },

  // File attachments (legacy single file field)
  file: {
    type: String // Keep for backward compatibility
  },

  // Multiple file attachments (new field supporting multiple files)
  files: [{
    type: String
  }],

  // Relevant links
  links: [{
    type: String
  }],

  // Completion tracking
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  finalRemarks: {
    type: String,
    trim: true
  },

  // Revision tracking (2 revision limit)
  revisionCount: {
    type: Number,
    default: 0
  },

  // Track if additional file upload is allowed for revision requests
  allowAdditionalFileUpload: {
    type: Boolean,
    default: true
  },

  // Admin viewing tracking
  viewed: {
    type: Boolean,
    default: false
  },
  viewedAt: {
    type: Date
  },
  viewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Revision thread system
  revisionHistory: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    revisionNotes: {
      type: String
    },
    revisionFiles: [{
      type: String
    }],
    revisionLinks: [{
      type: String
    }],
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    },
    responseNotes: {
      type: String
    },
    responseFiles: [{
      type: String
    }],
    responseLinks: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['pending', 'responded', 'resolved', 'completed', 'approved', 'revoked'],  // 'approved' for complete-approval status, 'revoked' for revoke-approval status
      default: 'pending'
    }
  }],

  // Track if request is awaiting requestor resubmission
  awaitingResubmission: {
    type: Boolean,
    default: false
  },

  // Requestor asked to meet with SCO for collaboration/conceptualization.
  // Checking the box does not confirm a meeting — SCO reaches out and, if
  // one is arranged, sets meetingScheduledAt/meetingNotes.
  meetingRequested: {
    type: Boolean,
    default: false
  },
  meetingScheduledAt: {
    type: Date,
    default: null
  },
  meetingNotes: {
    type: String,
    trim: true,
    default: null
  },

  // Soft delete tracking (Archive/Trash functionality)
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  previousStatus: {
    type: String
  },

  // Restoration requests when archived/deleted
  restorationRequests: [{
    requestedAt: {
      type: Date,
      default: Date.now
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],

  // Created by admin on behalf of user
  createdByAdmin: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Archive reason (why it was archived) and archive source (manual vs auto-archive)
  archiveReason: {
    type: String,
    trim: true
  },
  archivedBy: {
    type: String,
    enum: ['system', 'admin'],
    default: 'admin'
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// ===== Conversation cascade cleanup =====
// When a request is PERMANENTLY deleted (findByIdAndDelete, deleteOne, or
// deleteMany), also delete its team conversation so the chat messages don't
// linger as orphans. Soft deletes/archiving (isDeleted = true) never pass
// through these hooks, so archived requests keep their chat history until
// they are actually purged.
requestApprovalSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    const Conversation = require('./Conversation');
    await Conversation.deleteMany({ approvalRequestId: doc._id });
  } catch (err) {
    console.error('[RequestApproval] Failed to cascade-delete conversation:', err);
  }
});

requestApprovalSchema.pre(['deleteOne', 'deleteMany'], async function () {
  try {
    const docs = await this.model.find(this.getFilter()).select('_id').lean();
    if (docs.length === 0) return;
    const Conversation = require('./Conversation');
    await Conversation.deleteMany({ approvalRequestId: { $in: docs.map(d => d._id) } });
  } catch (err) {
    console.error('[RequestApproval] Failed to cascade-delete conversations:', err);
  }
});

/**
 * RequestApproval Model
 * Provides interface for interacting with RequestApproval documents in MongoDB
 */
const RequestApproval = mongoose.model('RequestApproval', requestApprovalSchema);

module.exports = RequestApproval;
