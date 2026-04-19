// ===== Microsoft OAuth Routes =====
// Handles Microsoft OAuth authentication using Passport.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');
const { isAllowedDomain, isInternalDomain } = require('../config/clerk');
const notificationService = require('../services/notificationService');

// Configure Passport Microsoft Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    callbackURL: process.env.APP_URL + '/clerk/callback',
    scope: ['user.read'],
    // Use 'organizations' for work/school accounts or specific tenant ID
    tenant: process.env.AZURE_TENANT_ID || 'organizations'
  },
  function(accessToken, refreshToken, profile, done) {
    // This callback is called after successful authentication
    return done(null, profile);
  }
));

/**
 * GET /clerk/sign-in
 * Initiates Microsoft OAuth using Passport
 */
router.get('/clerk/sign-in', 
  passport.authenticate('microsoft', {
    prompt: 'select_account'
  })
);

/**
 * GET /clerk/sign-up
 * Initiates Microsoft OAuth for sign-up using Passport
 */
router.get('/clerk/sign-up', 
  passport.authenticate('microsoft', {
    prompt: 'select_account'
  })
);

/**
 * GET /clerk/callback
 * Handles the callback from Microsoft OAuth
 */
router.get('/clerk/callback',
  passport.authenticate('microsoft', { 
    failureRedirect: '/register?error=auth_failed',
    session: false
  }),
  async (req, res) => {
    try {
      console.log('[MICROSOFT] OAuth callback received');
      console.log('[MICROSOFT] User profile:', req.user);

      const profile = req.user;
      
      // Extract email from Microsoft profile
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (!email) {
        console.log('[MICROSOFT] No email found in profile');
        return res.redirect('/register?error=no_email');
      }

      console.log('[MICROSOFT] Email:', email);

      // Classify email domain (no longer blocking non-DLSU domains)
      const emailClassification = isInternalDomain(email) ? 'internal' : 'external';
      console.log('[MICROSOFT] Email domain classification:', emailClassification);

      // Extract profile information
      const microsoftProfile = {
        microsoftId: profile.id,
        email: email.toLowerCase(),
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        displayName: profile.displayName || ''
      };

      console.log('[MICROSOFT] Processed profile:', microsoftProfile);

      // Check if user already exists in our database
      const existingUser = await User.findOne({ 
        $or: [
          { email: microsoftProfile.email },
          { microsoftId: microsoftProfile.microsoftId }
        ]
      });

      if (existingUser) {
        console.log('[MICROSOFT] Existing user found:', existingUser.email);
        
        // Update Microsoft ID if needed
        if (!existingUser.microsoftId) {
          existingUser.microsoftId = microsoftProfile.microsoftId;
          existingUser.authProvider = 'microsoft';
          existingUser.emailVerified = true; // Microsoft OAuth verifies email
          await existingUser.save();
        }

        // Check account status first (before email verification)
        if (existingUser.status !== 'approved') {
          return res.redirect('/login?error=' + encodeURIComponent('Your account has not been approved by an administrator yet. Please wait for an email notification confirming your account approval before logging in.'));
        }

        // Check if user can log in
        if (!existingUser.emailVerified) {
          return res.redirect('/login?error=' + encodeURIComponent('Please verify your email address before logging in.'));
        }

        if (existingUser.isDeleted) {
          return res.redirect('/login?error=' + encodeURIComponent('This account has been deactivated. Please contact support.'));
        }

        // Log the user in
        req.session.userId = existingUser._id;
        req.session.role = existingUser.role;
        req.session.save((err) => {
          if (err) {
            console.error('[MICROSOFT] Session save error:', err);
            return res.redirect('/?error=session_error');
          }

          console.log('[MICROSOFT] User logged in successfully:', existingUser.email);

          // Redirect based on user role
          if (existingUser.role === 'admin') {
            return res.redirect('/admin');
          } else if (existingUser.role === 'unit') {
            return res.redirect('/unit/dashboard');
          } else {
            return res.redirect('/dashboard');
          }
        });

      } else {
        console.log('[MICROSOFT] New user - redirecting to registration');
        
        // New user - store profile in session and redirect to registration
        req.session.microsoftProfile = microsoftProfile;
        req.session.microsoftNewUser = true; // Flag to show welcome message
        req.session.microsoftEmailDomain = isInternalDomain(email) ? 'internal' : 'external';
        req.session.save((err) => {
          if (err) {
            console.error('[MICROSOFT] Session save error:', err);
            return res.redirect('/register?error=session_error');
          }
          
          return res.redirect('/register?source=microsoft&new_user=true');
        });
      }

    } catch (error) {
      console.error('[MICROSOFT] Callback error:', error);
      res.redirect('/register?error=server_error');
    }
  }
);

module.exports = router;
