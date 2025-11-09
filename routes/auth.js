// ===== Authentication Routes =====
// This module handles user authentication related routes
// Includes login, registration, and logout functionality

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

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

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('register', {

        message: 'Email is already registered.', formData: req.body });
    }

    // Validate required fields
    if (!firstName || !lastName || !username || !password || !phoneNumber || !userType) {
      return res.status(400).render('register', {

        message: 'Please fill in all required fields.', formData: req.body });
    }

    // Student-specific validation
    if (userType === 'student' && (!studentId || !studentOrganization?.length || !cys)){
      return res.status(400).render('register', {

        message: 'Please fill in all student fields.', formData: req.body });
    }

    // Non-student specific validation
    if (userType === 'nonstudent' && (!affiliation?.length)){
      return res.status(400).render('register', {

        message: 'Please select at least one office/department.', formData: req.body });
    }

    // Student ID format validation
    if (userType === 'student' && !/^\d{9}$/.test(studentId)) {
      return res.status(400).render('register', {

        message: 'Student ID must be exactly 9 digits.', formData: req.body });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = {
      fName: firstName,
      mName: middleName,
      lName: lastName,
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      agreedToTerms: terms === 'on',
      userType,
      approved: false  // Ensure new accounts start as not approved
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
      console.log('User successfully created with username:', userData.username);
      
      // Verify the user was actually saved
      const savedUser = await User.findOne({ username: userData.username });
      console.log('Verification - Found user in database:', savedUser ? 'Yes' : 'No');
      
      // Redirect to login with pending approval message
      res.redirect('/login?status=pending');
    } catch (saveError) {
      console.error('Error saving user:', saveError);
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

    // Check if account is approved
    if (!user.approved && user.role !== 'admin') {
      return res.status(401).render('index', { message: 'Your account is pending approval. Please wait for admin approval.' });
    }

    // Create session
    req.session.userId = user._id;

    // Redirect based on user role
    return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');

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
