// ===== Authentication Routes =====
// This module handles user authentication related routes
// Includes login, registration, and logout functionality

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const BroadcastMessage = require('../models/BroadcastMessage');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { getOrganizations, getOffices } = require('../utils/settingsHelpers');
const { escapeRegex, sanitizeEmail, sanitizeName, sanitizePhone, sanitizeText, sanitizeString } = require('../utils/sanitize');
const { isAllowedDomain, isInternalDomain } = require('../config/clerk');

/**
 * GET /register
 * Renders the registration form with organizations and offices from database
 */
router.get('/register', async (req, res) => {
  try {
    const organizations = await require('../utils/settingsHelpers').getOrganizations();
    const offices = await require('../utils/settingsHelpers').getOffices();
    
    // Check if user came from Microsoft OAuth
    const microsoftProfile = req.session.microsoftProfile || null;
    const microsoftNewUser = req.session.microsoftNewUser || false;
    
    // Clear the new user flag after showing it once
    if (microsoftNewUser) {
      delete req.session.microsoftNewUser;
    }
    
    res.render('register', {
      error: null,
      organizations,
      offices,
      microsoftProfile,
      microsoftNewUser,
      invitationData: null
    });
  } catch (error) {
    console.error('[Register] Error loading registration page:', error);
    if (!res.headersSent) {
      res.render('register', {
        error: null,
        organizations: [],
        offices: [],
        microsoftProfile: null,
        microsoftNewUser: false,
        invitationData: null
      });
    }
  }
});

/**
 * GET /register-invitation/:token
 * Renders registration form with pre-filled data from invitation
 */
router.get('/register-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const organizations = await require('../utils/settingsHelpers').getOrganizations();
    const offices = await require('../utils/settingsHelpers').getOffices();
    
    // Find user by invitation token
    const User = require('../models/User');
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
      status: 'invited'
    });
    
    if (!user) {
      return res.render('register', {
        error: 'Invalid or expired invitation link. Please contact an administrator.',
        organizations,
        offices,
        microsoftProfile: null,
        microsoftNewUser: false,
        invitationData: null
      });
    }
    
    // Parse pre-filled data
    let preFilledData = {};
    try {
      preFilledData = user.invitationData ? JSON.parse(user.invitationData) : {};
    } catch (parseError) {
      console.error('Error parsing invitation data:', parseError);
    }
    
    res.render('register', {
      error: null,
      organizations,
      offices,
      microsoftProfile: null,
      microsoftNewUser: false,
      invitationData: {
        email: user.email,
        firstName: preFilledData.firstName || '',
        lastName: preFilledData.lastName || '',
        middleName: preFilledData.middleName || '',
        phoneNumber: preFilledData.phoneNumber || '',
        userType: preFilledData.userType || '',
        studentId: preFilledData.studentId || '',
        studentOrganization: preFilledData.studentOrganization || [],
        cys: preFilledData.cys || '',
        affiliation: preFilledData.affiliation || [],
        autoApprove: true,
        invitationToken: token
      }
    });
    
  } catch (error) {
    console.error('Error loading invitation:', error);
    res.render('register', {
      error: 'Error loading invitation. Please try again.',
      organizations: [],
      offices: [],
      microsoftProfile: null,
      microsoftNewUser: false,
      invitationData: null
    });
  }
});


/**
 * GET /about-s-core
 * Renders the S-CORE info page with login and sign up buttons
 */
const Page = require('../models/Page');
router.get('/about-s-core', async (req, res) => {
  try {
    // Fetch homepage content (S-CORE section fields)
    let pageContent = await Page.findOne({ slug: 'home' });
    if (!pageContent) {
      pageContent = { content: {} };
    }
    res.render('about-s-core', {
      pageContent: pageContent.content
    });
  } catch (error) {
    console.error('[About S-CORE] Error loading page:', error);
    res.render('about-s-core', { pageContent: {} });
  }
});

/**
 * GET /login
 * Renders the login form
 */
router.get('/login', (req, res) => {
  // Get registration success data from session
  const registrationSuccess = req.session.registrationSuccess;
  const passwordResetSuccess = req.session.passwordResetSuccess;
  
  // Clear them from session after retrieving
  if (registrationSuccess) {
    delete req.session.registrationSuccess;
  }
  if (passwordResetSuccess) {
    delete req.session.passwordResetSuccess;
  }
  
  // Get error from query parameters (for redirects from Microsoft OAuth, etc.)
  const errorFromQuery = req.query.error || null;
  
  // Create success message for password reset
  let successMessage = null;
  if (passwordResetSuccess) {
    successMessage = 'Your password has been reset successfully. You can now sign in with your new password.';
  }
  
  res.render('index', { 
    error: errorFromQuery,
    registrationSuccess: registrationSuccess || null,
    passwordResetSuccess: successMessage
  });
});

/**
 * POST /register
 * Processes user registration
 * Validates input, creates user account, and redirects to login
 * Rate limited to prevent abuse
 */
router.post('/register', apiLimiter, async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    // ===== INPUT SANITIZATION =====
    // Sanitize all text inputs to prevent injection attacks
    const firstName = sanitizeName(req.body.firstName);
    const middleName = sanitizeName(req.body.middleName || '');
    const lastName = sanitizeName(req.body.lastName);
    const email = sanitizeEmail(req.body.email);
    const username = sanitizeString(req.body.username);
    const password = req.body.password; // Don't sanitize password - hash it instead
    const phoneNumber = sanitizePhone(req.body.phoneNumber);
    const studentId = sanitizeString(req.body.studentId || '');
    const cys = sanitizeString(req.body.cys || '').toUpperCase();
    const terms = req.body.terms;
    const userType = sanitizeString(req.body.userType);

    // Handle student organizations and affiliations as arrays with sanitization
    const studentOrganization = Array.isArray(req.body.studentOrganization)
      ? req.body.studentOrganization.map(org => sanitizeText(org)).filter(Boolean)
      : req.body.studentOrganization
      ? [sanitizeText(req.body.studentOrganization)]
      : [];

    const affiliation = Array.isArray(req.body.affiliation)
      ? req.body.affiliation.map(aff => sanitizeText(aff)).filter(Boolean)
      : req.body.affiliation
      ? [sanitizeText(req.body.affiliation)]
      : [];

    // ===== ENHANCED VALIDATION =====
    // Helper to send error as JSON for AJAX, or render for normal POST
    function sendError(message) {
      const acceptHeader = req.headers.accept || '';
      const isAjax = req.xhr || acceptHeader.includes('json') || acceptHeader.includes('application/json');
      
      if (isAjax) {
        return res.status(400).json({ error: message });
      } else {
        const organizations = require('../utils/settingsHelpers').getOrganizations();
        const offices = require('../utils/settingsHelpers').getOffices();
        Promise.all([organizations, offices]).then(([orgs, offs]) => {
          res.status(400).render('register', {
            error: message,
            organizations: orgs,
            offices: offs,
            formData: req.body
          });
        });
      }
    }

    // Validate required fields first
    if (!firstName || !lastName || !username || !password || !phoneNumber || !userType) {
      return sendError('All required fields must be filled. Please check and try again.');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return sendError('Please provide a valid email address.');
    }

    // Domain validation - all domains now accepted
    if (!isAllowedDomain(email)) {
      return sendError('Please provide a valid email address.');
    }

    // Determine email domain classification
    const isInternal = isInternalDomain(email);

    // Normalize email and username for consistency
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim().toLowerCase();

    // Username validation (minimum length)
    if (username.length < 4) {
      return sendError('Username must be at least 4 characters long.');
    }

    // Password strength validation
    if (password.length < 8) {
      return sendError('Password must be at least 8 characters long.');
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return sendError('Password must contain at least one letter and one number.');
    }

    // Check for duplicate email (case-insensitive)
    // Use escapeRegex to prevent regex injection attacks
    const escapedEmail = escapeRegex(normalizedEmail);
    const existingEmail = await User.findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } });
    if (existingEmail) {
      // Allow registration if user is in 'invited' status (admin-created invitation)
      if (existingEmail.status === 'invited') {
        // This is an invitation - redirect to the invitation registration flow
        return sendError('This email has a pending invitation. Please use the invitation link sent to your email.');
      }
      
      // Check if trying to register with different auth provider
      const microsoftProfile = req.session.microsoftProfile;
      if (microsoftProfile && existingEmail.authProvider === 'local') {
        return sendError('An account with this email already exists. Please use Microsoft sign-in.');
      } else if (!microsoftProfile && existingEmail.authProvider === 'microsoft') {
        return sendError('An account with this email already exists. Please use Microsoft sign-in.');
      }
      return sendError('This email is already registered. Please use a different email or try logging in.');
    }

    // Check for duplicate username (case-insensitive)
    // Use escapeRegex to prevent regex injection attacks
    const escapedUsername = escapeRegex(normalizedUsername);
    const existingUsername = await User.findOne({ username: { $regex: `^${escapedUsername}$`, $options: 'i' } });
    if (existingUsername) {
      return sendError('This username is already taken. Please choose a different username.');
    }

    // Student-specific validation
    if (userType === 'student') {
      if (!studentId || !cys) {
        return sendError('Student ID and Course/Year/Section are required.');
      }
      // Organization required only for internal DLSU students
      if (isInternal && !studentOrganization?.length) {
        return sendError('Please select at least one student organization.');
      }

      // Student ID format validation — strict for DLSU, flexible for external
      if (isInternal) {
        if (!/^\d{9}$/.test(studentId)) {
          return sendError('Student ID must be exactly 9 digits.');
        }
      } else {
        // External students: alphanumeric, 3-20 chars
        if (!/^[a-zA-Z0-9\-]{3,20}$/.test(studentId)) {
          return sendError('Student ID must be 3-20 alphanumeric characters.');
        }
      }

      // Check for duplicate Student ID
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return sendError('This Student ID is already registered. Please contact support if this is an error.');
      }
    }

    // Non-student specific validation (affiliation required only for internal)
    if (userType === 'nonstudent' && isInternal && (!affiliation?.length)) {
      return sendError('Please select at least one office/department.');
    }

    // Terms agreement validation
    if (!terms || terms !== 'on') {
      return sendError('You must agree to the Terms and Conditions to register.');
    }

    // Check if user is coming from Microsoft OAuth
    const microsoftProfile = req.session.microsoftProfile;
    
    // Hash password (or generate random one for Microsoft users)
    let hashedPassword;
    if (microsoftProfile) {
      // Generate random password for Microsoft OAuth users
      const randomPassword = crypto.randomBytes(32).toString('hex');
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    } else {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiryHours = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || 24);
    const verificationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Prepare user data
    const userData = {
      fName: firstName,
      mName: middleName,
      lName: lastName,
      email: normalizedEmail,
      username,
      password: hashedPassword,
      phoneNumber,
      agreedToTerms: terms === 'on',
      userType,
      emailDomain: isInternal ? 'internal' : 'external',
      emailVerified: microsoftProfile ? true : false, // Microsoft OAuth users have verified email
      verificationToken,
      verificationTokenExpiry,
      authProvider: microsoftProfile ? 'microsoft' : 'local'
    };

    // Add Microsoft-specific fields if OAuth was used
    if (microsoftProfile) {
      userData.microsoftId = microsoftProfile.microsoftId;
      userData.clerkId = microsoftProfile.clerkId;
    }

    // Add student-specific fields
    if (userType === 'student') {
      userData.studentId = studentId;
      userData.studentOrganization = studentOrganization;
      userData.cys = cys;
    } else if (userType === 'nonstudent') {
      userData.affiliation = affiliation;
    }

    // Add external registration context (for non-DLSU email users)
    if (!isInternal) {
      const extPurpose = sanitizeString(req.body.extPurpose || '');
      const extSupervisorName = sanitizeName(req.body.extSupervisorName || '');
      const extSupervisorEmail = sanitizeEmail(req.body.extSupervisorEmail || '');
      const extNotes = sanitizeText(req.body.extNotes || '').substring(0, 500);

      userData.registrationContext = {
        organization: sanitizeText(req.body.extOrganization || '') || null,
        purpose: extPurpose || null,           // enum field — empty string breaks validation
        supervisorName: extSupervisorName || null,
        supervisorEmail: extSupervisorEmail || null,
        additionalNotes: extNotes || null,
        submittedAt: new Date()
      };
    }

    // Create and save user
    console.log('Attempting to create user with data:', {
      ...userData,
      password: '[HIDDEN]' // Don't log the actual password
    });
    
    const newUser = new User(userData);
    
    try {
      await newUser.save();
      console.log('✅ User successfully created with username:', userData.username);
      
      // Verify the user was actually saved
      const savedUser = await User.findOne({ username: userData.username });
      console.log('🔍 Verification - Found user in database:', savedUser ? 'Yes' : 'No');
      
      // Send appropriate email based on user type
      if (savedUser) {
        try {
          if (isInternal) {
            // Internal users: send email verification
            console.log('📧 Sending email verification...');
            const emailResult = await emailService.sendEmailVerification(
              savedUser.email,
              `${savedUser.fName} ${savedUser.lName}`,
              savedUser.verificationToken
            );
            
            if (emailResult.devMode) {
              console.log('📧 [DEV MODE] Verification link:', emailResult.verificationLink);
            }
            
            console.log('✅ Verification email sent successfully');
          } else {
            // External users: send registration pending confirmation (no verify email)
            console.log('📧 Sending registration pending email...');
            await emailService.sendRegistrationPending(
              savedUser.email,
              `${savedUser.fName} ${savedUser.lName}`
            );
            console.log('✅ Registration pending email sent');
          }
        } catch (emailError) {
          console.error('❌ Error sending email:', emailError);
          // Don't fail registration if email fails
        }
        
        // Notify admins about new user registration (immediately)
        console.log('📧 ===== TRIGGERING ADMIN NOTIFICATION =====');
        console.log('👤 New user registered:', {
          id: savedUser._id,
          username: savedUser.username,
          name: `${savedUser.fName} ${savedUser.lName}`,
          email: savedUser.email,
          userType: savedUser.userType,
          status: savedUser.status,
          emailVerified: savedUser.emailVerified
        });
        
        try {
          await notificationService.notifyNewUserRegistration(savedUser._id);
          console.log('✅ Admin notification process completed successfully');
        } catch (notifError) {
          console.error('❌ Error sending admin notification:', notifError);
          console.error('Notification error stack:', notifError.stack);
          // Don't throw - allow registration to complete even if notification fails
        }
        
        console.log('📧 ===== ADMIN NOTIFICATION COMPLETE =====');
      } else {
        console.error('⚠️ User not found after save - cannot send notifications');
      }

      // Add new user to all existing "all users" announcements
      try {
        console.log('📢 Adding new user to existing "all users" announcements...');
        const allUsersAnnouncements = await BroadcastMessage.find({ isVisibleToAll: true });
        console.log(`📢 Found ${allUsersAnnouncements.length} "all users" announcements`);

        for (const announcement of allUsersAnnouncements) {
          // Check if user is already in recipients
          const existingRecipient = announcement.recipients.find(
            r => r.userId.toString() === savedUser._id.toString()
          );

          if (!existingRecipient) {
            announcement.recipients.push({
              userId: savedUser._id,
              isRead: false
            });
            await announcement.save();
            console.log(`📢 Added user to announcement: ${announcement.title}`);
          }
        }

        console.log('✅ Successfully added new user to all existing "all users" announcements');
      } catch (announcementError) {
        console.error('❌ Error adding user to announcements:', announcementError);
        // Don't fail registration if this fails
      }
      
      // Clear Microsoft profile from session after successful registration
      if (req.session.microsoftProfile) {
        delete req.session.microsoftProfile;
      }
      
      // Store registration success info in session for login page
      req.session.registrationSuccess = {
        username: userData.username,
        email: userData.email,
        message: isInternal
          ? 'Registration successful! Please verify your email, then wait for admin approval before logging in.'
          : 'Registration received! Your account is pending admin approval. You will receive an email notification when your account has been reviewed.'
      };
      
      // Redirect to login page
      console.log('🔄 Redirecting user to login page...');
      
      const acceptHeader = req.headers.accept || '';
      const isAjax = req.xhr || acceptHeader.includes('json') || acceptHeader.includes('application/json');
      
      if (isAjax) {
        return res.status(200).json({ 
          success: true, 
          redirect: '/login',
          message: 'Registration successful! Redirecting to login...'
        });
      } else {
        return res.redirect('/login');
      }
    } catch (saveError) {
      console.error('❌ Error saving user:', saveError);
      throw saveError;
    }

  } catch (err) {
    console.error('Registration error:', err);
    
    const acceptHeader = req.headers.accept || '';
    const isAjax = req.xhr || acceptHeader.includes('json') || acceptHeader.includes('application/json');
    
    if (isAjax) {
      return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
    
    const organizations = await require('../utils/settingsHelpers').getOrganizations();
    const offices = await require('../utils/settingsHelpers').getOffices();
    res.status(500).render('register', {
      error: 'Internal server error',
      organizations,
      offices,
      formData: req.body
    });
  }
});

/**
 * POST /register-invitation
 * Processes registration from invitation with auto-approval
 */
router.post('/register-invitation', apiLimiter, async (req, res) => {
  try {
    const { invitationToken, ...registrationData } = req.body;
    
    console.log('Invitation registration attempt for token:', invitationToken?.slice(0, 10) + '...');
    
    // Validate invitation token
    const User = require('../models/User');
    const invitedUser = await User.findOne({
      verificationToken: invitationToken,
      verificationTokenExpiry: { $gt: Date.now() },
      status: 'invited'
    });
    
    if (!invitedUser) {
      const acceptHeader = req.headers.accept || '';
      const isAjax = req.xhr || acceptHeader.includes('json');
      
      if (isAjax) {
        return res.status(400).json({ 
          error: 'Invalid or expired invitation link'
        });
      }
      
      const organizations = await require('../utils/settingsHelpers').getOrganizations();
      const offices = await require('../utils/settingsHelpers').getOffices();
      return res.render('register', {
        error: 'Invalid or expired invitation link',
        organizations,
        offices,
        microsoftProfile: null,
        microsoftNewUser: false,
        invitationData: null
      });
    }
    
    // Sanitize inputs (same as regular registration)
    const firstName = sanitizeName(registrationData.firstName);
    const middleName = sanitizeName(registrationData.middleName || '');
    const lastName = sanitizeName(registrationData.lastName);
    const email = sanitizeEmail(registrationData.email);
    const username = sanitizeString(registrationData.username);
    const password = registrationData.password;
    const phoneNumber = sanitizePhone(registrationData.phoneNumber);
    const studentId = sanitizeString(registrationData.studentId || '');
    const cys = sanitizeString(registrationData.cys || '').toUpperCase();
    const terms = registrationData.terms;
    const userType = sanitizeString(registrationData.userType);

    const studentOrganization = Array.isArray(registrationData.studentOrganization)
      ? registrationData.studentOrganization.map(org => sanitizeText(org)).filter(Boolean)
      : registrationData.studentOrganization
      ? [sanitizeText(registrationData.studentOrganization)]
      : [];

    const affiliation = Array.isArray(registrationData.affiliation)
      ? registrationData.affiliation.map(aff => sanitizeText(aff)).filter(Boolean)
      : registrationData.affiliation
      ? [sanitizeText(registrationData.affiliation)]
      : [];
    
    // Validation
    const sendError = (message) => {
      const acceptHeader = req.headers.accept || '';
      const isAjax = req.xhr || acceptHeader.includes('json');
      
      if (isAjax) {
        return res.status(400).json({ error: message });
      }
      
      const organizations = require('../utils/settingsHelpers').getOrganizations();
      const offices = require('../utils/settingsHelpers').getOffices();
      return res.render('register', {
        error: message,
        organizations,
        offices,
        formData: registrationData,
        microsoftProfile: null,
        microsoftNewUser: false,
        invitationData: {
          invitationToken,
          email: invitedUser.email,
          autoApprove: true
        }
      });
    };
    
    // Validate required fields
    if (!firstName || !lastName || !username || !password || !phoneNumber || !userType || !terms) {
      return sendError('All required fields must be filled.');
    }
    
    // Validate password strength
    if (password.length < 8) {
      return sendError('Password must be at least 8 characters long.');
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return sendError('Password must contain at least one letter and one number.');
    }
    
    // Validate phone number
    if (!/^(\d{4}|\d{11})$/.test(phoneNumber)) {
      return sendError('Phone number must be 4 digits (landline) or 11 digits (mobile).');
    }
    
    // Validate terms agreement
    if (terms !== 'on' && terms !== true) {
      return sendError('You must agree to the terms and conditions.');
    }
    
    // Student-specific validation
    if (userType === 'student') {
      const isInternalStudent = email.endsWith('@dlsud.edu.ph');
      if (isInternalStudent && (!studentId || !/^\d{9}$/.test(studentId))) {
        return sendError('Student ID must be exactly 9 digits.');
      } else if (!isInternalStudent && (!studentId || !/^[a-zA-Z0-9\-]{3,20}$/.test(studentId))) {
        return sendError('Student ID must be 3-20 alphanumeric characters.');
      }
      if (!cys || !/^[A-Z]{3}\d{2}$/.test(cys)) {
        return sendError('CYS must be in the format: 3 letters + 2 numbers (e.g., BSN21).');
      }
    }
    
    // Non-student validation
    if (userType === 'nonstudent') {
      if (!affiliation || affiliation.length === 0) {
        return sendError('Office/Department affiliation is required for staff/faculty.');
      }
    }
    
    // Check for duplicate username (excluding the invited user)
    const existingUsername = await User.findOne({ 
      username: username,
      _id: { $ne: invitedUser._id }
    });
    
    if (existingUsername) {
      return sendError('Username is already taken. Please choose another.');
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the invited user record
    invitedUser.fName = firstName;
    invitedUser.lName = lastName;
    invitedUser.mName = middleName;
    invitedUser.username = username;
    invitedUser.password = hashedPassword;
    invitedUser.phoneNumber = phoneNumber;
    invitedUser.userType = userType;
    invitedUser.status = 'approved'; // Auto-approve
    invitedUser.emailVerified = true; // Auto-verify
    invitedUser.verificationToken = undefined;
    invitedUser.verificationTokenExpiry = undefined;
    invitedUser.invitationData = undefined;
    invitedUser.agreedToTerms = true;
    
    if (userType === 'student') {
      invitedUser.studentId = studentId;
      invitedUser.studentOrganization = studentOrganization;
      invitedUser.cys = cys;
    } else {
      invitedUser.affiliation = affiliation;
    }
    
    await invitedUser.save();
    
    console.log('✅ Invitation registration completed for:', username);
    
    // Send welcome/approval email
    try {
      await emailService.sendAccountApproved(
        invitedUser.email,
        `${invitedUser.fName} ${invitedUser.lName}`
      );
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }
    
    // Add to announcements
    try {
      const BroadcastMessage = require('../models/BroadcastMessage');
      const allUsersAnnouncements = await BroadcastMessage.find({ isVisibleToAll: true });
      
      for (const announcement of allUsersAnnouncements) {
        const existingRecipient = announcement.recipients.find(
          r => r.userId.toString() === invitedUser._id.toString()
        );
        
        if (!existingRecipient) {
          announcement.recipients.push({
            userId: invitedUser._id,
            isRead: false
          });
          await announcement.save();
        }
      }
    } catch (announcementError) {
      console.error('Error adding user to announcements:', announcementError);
    }
    
    // Store success in session
    req.session.registrationSuccess = {
      username: invitedUser.username,
      email: invitedUser.email,
      message: 'Registration successful! Your account has been pre-approved. You can now sign in.'
    };
    
    // Redirect to login
    const acceptHeader = req.headers.accept || '';
    const isAjax = req.xhr || acceptHeader.includes('json');
    
    if (isAjax) {
      return res.status(200).json({ 
        success: true, 
        redirect: '/login',
        message: 'Registration successful! Redirecting to login...'
      });
    } else {
      return res.redirect('/login');
    }
    
  } catch (error) {
    console.error('Invitation registration error:', error);
    
    const acceptHeader = req.headers.accept || '';
    const isAjax = req.xhr || acceptHeader.includes('json');
    
    if (isAjax) {
      return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
    
    const organizations = await require('../utils/settingsHelpers').getOrganizations();
    const offices = await require('../utils/settingsHelpers').getOffices();
    res.status(500).render('register', {
      error: 'Internal server error',
      organizations,
      offices,
      formData: req.body,
      microsoftProfile: null,
      microsoftNewUser: false,
      invitationData: null
    });
  }
});

/**
 * POST /login
 * Processes user authentication
 * Validates credentials and establishes session
 * Rate limited to prevent brute force attacks
 */
router.post('/login', authLimiter, async (req, res) => {
  // Sanitize username input to prevent NoSQL injection
  const usernameOrEmail = sanitizeString(req.body.username);
  const password = req.body.password; // Don't sanitize password
  const rememberMe = req.body.remember === 'on'; // Check if remember me is checked

  try {
    // Validate inputs exist
    if (!usernameOrEmail || !password) {
      return res.status(400).render('index', { 
        error: 'Username/Email and password are required.',
        registrationSuccess: null
      });
    }

    console.log('Login attempt for username/email:', usernameOrEmail);
    
    // Find user by username OR email (exact match)
    const user = await User.findOne({ 
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail.toLowerCase() }
      ]
    });
    
    if (!user) {
      console.log('User not found:', usernameOrEmail);
      return res.status(401).render('index', { 
        message: 'Invalid credentials.',
        registrationSuccess: null
      });
    }

    // Check if user account is deleted
    if (user.isDeleted) {
      console.log('Login blocked - User account deleted:', usernameOrEmail);
      return res.status(403).render('index', { 
        error: 'Your account has been deactivated. Please contact an administrator for assistance.',
        registrationSuccess: null
      });
    }

    // Check if this is a Microsoft OAuth user
    if (user.authProvider === 'microsoft') {
      // Redirect to Microsoft OAuth authentication flow
      console.log('Microsoft OAuth user detected - redirecting to Microsoft sign-in');
      return res.redirect('/clerk/sign-in');
    }

    // For local users, validate password
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);

    // Validate password for local users
    if (!passwordMatch) {
      return res.status(401).render('index', { 
        message: 'Invalid credentials.',
        registrationSuccess: null
      });
    }

    // !! EMAIL VERIFICATION CHECK !!
    // Check if user has verified their email
    if (!user.emailVerified) {
      console.log('Login blocked - Email not verified:', usernameOrEmail);
      return res.status(403).render('index', { 
        error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        registrationSuccess: null
      });
    }

    // !! ACCOUNT STATUS VERIFICATION !!
    // Check the user's status BEFORE creating a session
    if (user.status !== 'approved') {
      if (user.status === 'pending') {
        console.log('Login blocked - User account pending approval:', username);
        return res.status(403).render('index', { 
          error: 'Your account has not been approved by an administrator yet. Please wait for an email notification confirming your account approval before logging in.',
          registrationSuccess: null
        });
      }
      if (user.status === 'denied') {
        console.log('Login blocked - User account denied:', username);
        return res.status(403).render('index', { 
          error: 'Your account registration was not approved. Please contact an administrator for more information.',
          registrationSuccess: null
        });
      }
      // Failsafe for any other status
      console.log('Login blocked - User account not active:', username, 'Status:', user.status);
      return res.status(403).render('index', { 
        error: 'Your account is not active. Please contact an administrator for assistance.',
        registrationSuccess: null
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.role = user.role;

    // Set session expiry based on remember me
    if (rememberMe) {
      // Remember me: session lasts 30 days
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      console.log('Remember me enabled - session will last 30 days');
    } else {
      // Don't remember: session lasts 24 hours (default)
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      console.log('Remember me disabled - session will last 24 hours');
    }

    // Redirect based on user role
    if (user.role === 'admin') {
      console.log('Redirecting admin user to /admin');
      return res.redirect('/admin');
    } else if (user.role === 'unit') {
      console.log('Redirecting unit member to /unit/dashboard');
      return res.redirect('/unit/dashboard');
    } else {
      console.log('Redirecting regular user to /dashboard');
      return res.redirect('/dashboard');
    }

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('error', { message: 'Login failed.' });
  }
});

/**
 * GET /logout
 * Destroys user session and redirects to homepage
 */
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/');
  });
});

/**
 * GET /forgot-password
 * Renders forgot password form
 */
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { 
    error: null,
    success: null,
    microsoftUser: false,
    identifier: null,
    method: null,
    resetToken: null,
    showResetLink: false
  });
});

/**
 * POST /forgot-password
 * Sends password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier, method, confirmReset } = req.body;

    // Find user by email or username based on method
    let user;
    if (method === 'email') {
      const normalizedEmail = identifier.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
    } else if (method === 'username') {
      const normalizedUsername = identifier.trim();
      user = await User.findOne({ username: normalizedUsername });
    } else {
      return res.render('forgot-password', {
        error: 'Invalid request method',
        success: null,
        microsoftUser: false,
        identifier: null,
        method: null,
        resetToken: null,
        showResetLink: false
      });
    }

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.render('forgot-password', {
        success: method === 'email' 
          ? 'If an account exists with this email, you will receive a password reset link shortly.'
          : 'If an account exists with this username, you will receive a password reset link shortly.',
        error: null,
        microsoftUser: false,
        identifier: null,
        method: null,
        resetToken: null,
        showResetLink: false
      });
    }

    // Check if user is Microsoft OAuth user
    if (user.authProvider === 'microsoft' && confirmReset !== 'true') {
      return res.render('forgot-password', {
        error: null,
        success: null,
        microsoftUser: true,
        identifier: identifier,
        method: method,
        resetToken: null,
        showResetLink: false
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    await emailService.sendPasswordReset(user.email, `${user.fName} ${user.lName}`, resetToken);

    return res.render('forgot-password', {
      success: 'Password reset link sent to your email. Please check your inbox.',
      error: null,
      microsoftUser: false,
      identifier: null,
      method: null,
      resetToken: resetToken,
      showResetLink: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.render('forgot-password', {
      error: 'An error occurred. Please try again later.',
      success: null,
      microsoftUser: false,
      identifier: null,
      method: null,
      resetToken: null,
      showResetLink: false
    });
  }
});

/**
 * GET /reset-password/:token
 * Renders reset password form
 */
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('reset-password', {
        error: 'Invalid or expired reset link.',
        token: null
      });
    }

    res.render('reset-password', {
      error: null,
      token: token
    });

  } catch (error) {
    console.error('Reset password get error:', error);
    res.render('reset-password', {
      error: 'An error occurred.',
      token: null
    });
  }
});

/**
 * POST /reset-password
 * Updates user password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('reset-password', {
        error: 'Passwords do not match.',
        token: token
      });
    }

    if (password.length < 8) {
      return res.render('reset-password', {
        error: 'Password must be at least 8 characters long.',
        token: token
      });
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.render('reset-password', {
        error: 'Password must contain at least one letter and one number.',
        token: token
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('reset-password', {
        error: 'Invalid or expired reset link.',
        token: null
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    // Redirect to login with success message
    req.session.passwordResetSuccess = true;
    res.redirect('/login');

  } catch (error) {
    console.error('Reset password post error:', error);
    res.render('reset-password', {
      error: 'An error occurred. Please try again.',
      token: req.body.token
    });
  }
});

/**
 * GET /auth/verify-email/:token
 * Verifies user email address using token
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('Email verification attempt with token:', token);
    
    // Find user with this verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log('Invalid or expired verification token');
      return res.render('email-verified', {
        success: false,
        message: 'Invalid or expired verification link. Please request a new verification email.',
        showResendButton: true
      });
    }
    
    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    
    console.log('✅ Email verified successfully for user:', user.email);
    
    res.render('email-verified', {
      success: true,
      message: 'Your email has been verified successfully! You can now wait for admin approval to access your account.',
      userName: `${user.fName} ${user.lName}`,
      showResendButton: false
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.render('email-verified', {
      success: false,
      message: 'An error occurred during verification. Please try again.',
      showResendButton: true
    });
  }
});

/**
 * POST /auth/resend-verification
 * Resends verification email to user
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }
    
    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiryHours = parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || 24);
    const verificationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await user.save();
    
    // Send new verification email
    await emailService.sendEmailVerification(
      user.email,
      `${user.fName} ${user.lName}`,
      user.verificationToken
    );
    
    res.json({ success: true, message: 'Verification email sent successfully.' });
    
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

module.exports = router;
