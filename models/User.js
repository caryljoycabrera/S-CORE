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
    required: true
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
      return this.userType === 'student';
    }
  },
  studentOrganization: [{
    type: String
  }],
  cys: {
    type: String,
    required: function() {
      return this.userType === 'student';
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

  // User role for permissions (user or admin)
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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
