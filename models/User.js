// ===== User Model =====
// This module defines the User schema for the database
// Users can be students or non-students with different fields and permissions

const mongoose = require('mongoose');

/**
 * User Schema Definition
 * Defines the structure for user documents in MongoDB
 */
const userSchema = new mongoose.Schema({
  // Basic user information
  fName: {
    type: String,
    required: true,
    trim: true
  },
  mName: {
    type: String,
    trim: true,
    default: ''
  },
  lName: {
    type: String,
    required: true,
    trim: true
  },

  // Authentication fields
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    }
  },

  // OAuth fields
  clerkId: {
    type: String,
    unique: true,
    sparse: true
  },
  microsoftId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'microsoft'],
    default: 'local'
  },

  // Email verification fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpiry: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpiry: {
    type: Date
  },

  // Contact information
  phoneNumber: {
    type: String,
    required: true
  },

  // Legal agreement
  agreedToTerms: {
    type: Boolean,
    required: true,
    default: false
  },

  // NEW FIELD: User status for admin verification
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'invited'],
    default: 'pending'
  },

  // Invitation data for admin-created users (stores pre-filled registration data as JSON)
  invitationData: {
    type: String,
    default: null
  },

  // User type enum: determines student vs non-student user
  userType: {
    type: String,
    enum: ['student', 'nonstudent'],
    required: true
  },

  // Student-specific fields (only populated if userType === 'student')
  studentId: {
    type: String,
    required: function() {
      // Don't require for invited users (will be filled during registration)
      return this.userType === 'student' && this.status !== 'invited';
    }
  },
  studentOrganization: [{
    type: String
  }],
  cys: {
    type: String,
    required: function() {
      // Don't require for invited users (will be filled during registration)
      return this.userType === 'student' && this.status !== 'invited';
    }
  },

  // Non-student specific field (array of office/department affiliations)
  affiliation: [{
    type: String
  }],

  // Profile picture (filename stored in database, actual file in uploads/)
  profilePicture: {
    type: String
  },

  // User role for permissions (user, unit, or admin)
  role: {
    type: String,
    enum: ['user', 'unit', 'admin'],
    default: 'user'
  },

  // Unit team assignment (only applicable if role is 'unit')
  unitTeam: {
    type: String,
    enum: ['N/A', 'Graphics', 'Multimedia', 'Public Relations', 'Social Media'],
    default: 'N/A'
  },

  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * User Model
 * Provides interface for interacting with User documents in MongoDB
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
