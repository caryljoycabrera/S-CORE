// ===== Authentication Routes =====
// This module handles user authentication related routes
// Includes login, registration, and logout functionality

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const notificationService = require('../services/notificationService');

/**
 * GET /register
 * Renders the registration form
 */
router.get('/register', (req, res) => res.render('register', { error: null }));

/**
 * GET /login
 * Renders the login form
 */
router.get('/login', (req, res) => {
  res.render('index', { error: null });
});

/**
 * POST /register
 * Processes user registration
 * Validates input, creates user account, and redirects to login
 */
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const {
      firstName, middleName, lastName,
      email, username, password,
      phoneNumber, studentId, cys,
      terms, userType
    } = req.body;

    // Handle student organizations and affiliations as arrays
    const studentOrganization = Array.isArray(req.body.studentOrganization)
      ? req.body.studentOrganization
      : req.body.studentOrganization
      ? [req.body.studentOrganization]
      : [];

    const affiliation = Array.isArray(req.body.affiliation)
      ? req.body.affiliation
      : req.body.affiliation
      ? [req.body.affiliation]
      : [];

    // ===== ENHANCED VALIDATION =====
    
    // Validate required fields first
    if (!firstName || !lastName || !username || !password || !phoneNumber || !userType) {
      return res.status(400).render('register', {
        error: 'All required fields must be filled. Please check and try again.',
        formData: req.body
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).render('register', {
        error: 'Please provide a valid email address.',
        formData: req.body
      });
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Username validation (minimum length)
    if (username.length < 4) {
      return res.status(400).render('register', {
        error: 'Username must be at least 4 characters long.',
        formData: req.body
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).render('register', {
        error: 'Password must be at least 8 characters long.',
        formData: req.body
      });
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).render('register', {
        error: 'Password must contain at least one letter and one number.',
        formData: req.body
      });
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).render('register', {
        error: 'This email is already registered. Please use a different email or try logging in.',
        formData: req.body
      });
    }

    // Check for duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).render('register', {
        error: 'This username is already taken. Please choose a different username.',
        formData: req.body
      });
    }

    // Student-specific validation
    if (userType === 'student') {
      if (!studentId || !studentOrganization?.length || !cys) {
        return res.status(400).render('register', {
          error: 'All student fields (Student ID, Organization, Course/Year/Section) are required.',
          formData: req.body
        });
      }

      // Student ID format validation
      if (!/^\d{9}$/.test(studentId)) {
        return res.status(400).render('register', {
          error: 'Student ID must be exactly 9 digits.',
          formData: req.body
        });
      }

      // Check for duplicate Student ID
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).render('register', {
          error: 'This Student ID is already registered. Please contact support if this is an error.',
          formData: req.body
        });
      }
    }

    // Non-student specific validation
    if (userType === 'nonstudent' && (!affiliation?.length)) {
      return res.status(400).render('register', {
        error: 'Please select at least one office/department.',
        formData: req.body
      });
    }

    // Terms agreement validation
    if (!terms || terms !== 'on') {
      return res.status(400).render('register', {
        error: 'You must agree to the Terms and Conditions to register.',
        formData: req.body
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
      userType
    };

    // Add student-specific fields
    if (userType === 'student') {
      userData.studentId = studentId;
      userData.studentOrganization = studentOrganization;
      userData.cys = cys;
    } else if (userType === 'nonstudent') {
      userData.affiliation = affiliation;
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
      
      // Notify admins about new user registration
      if (savedUser) {
        console.log('📧 ===== TRIGGERING ADMIN NOTIFICATION =====');
        console.log('👤 New user registered:', {
          id: savedUser._id,
          username: savedUser.username,
          name: `${savedUser.fName} ${savedUser.lName}`,
          email: savedUser.email,
          userType: savedUser.userType,
          status: savedUser.status
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
        console.error('⚠️ User not found after save - cannot send notification');
      }
      
      // Redirect to login on successful registration
      console.log('🔄 Redirecting user to login page...');
      res.redirect('/login');
    } catch (saveError) {
      console.error('❌ Error saving user:', saveError);
      throw saveError;
    }

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('register', {

      message: 'Internal server error', formData: req.body });
  }
});

/**
 * POST /login
 * Processes user authentication
 * Validates credentials and establishes session
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Login attempt for username:', username);
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).render('index', { message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);

    // Validate username and password
    if (!passwordMatch) {
      return res.status(401).render('index', { message: 'Invalid credentials.' });
    }

    // !! ACCOUNT STATUS VERIFICATION !!
    // Check the user's status BEFORE creating a session
    if (user.status !== 'approved') {
      if (user.status === 'pending') {
        console.log('Login blocked - User account pending approval:', username);
        return res.status(403).render('index', { 
          error: 'Your account is pending approval. Please wait for an admin to verify your registration.' 
        });
      }
      if (user.status === 'denied') {
        console.log('Login blocked - User account denied:', username);
        return res.status(403).render('index', { 
          error: 'Your account registration was not approved. Please contact an administrator for more information.' 
        });
      }
      // Failsafe for any other status
      console.log('Login blocked - User account not active:', username, 'Status:', user.status);
      return res.status(403).render('index', { 
        error: 'Your account is not active. Please contact an administrator for assistance.' 
      });
    }

    // Create session
    req.session.userId = user._id;
    req.session.role = user.role;

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

module.exports = router;
