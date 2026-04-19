// ===== Clerk Configuration =====
// This module configures Clerk authentication for Microsoft OAuth integration
// Handles domain restrictions and user profile extraction

const { clerkClient, clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');

// clerkClient is automatically initialized with environment variables
const clerk = clerkClient;

/**
 * Extract user profile data from Clerk user object
 * @param {Object} clerkUser - Clerk user object
 * @returns {Object} Extracted profile data
 */
function extractClerkProfile(clerkUser) {
  const profile = {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    authProvider: 'microsoft'
  };

  // Check if Microsoft account was used
  const microsoftAccount = clerkUser.externalAccounts?.find(
    account => account.provider === 'microsoft'
  );
  
  if (microsoftAccount) {
    profile.microsoftId = microsoftAccount.providerUserId;
  }

  return profile;
}

/**
 * Validate email domain against allowed domain
 * All email domains are now accepted for registration.
 * Non-DLSU (@dlsud.edu.ph) users will need admin approval before accessing the system.
 * @param {string} email - Email address to validate
 * @returns {boolean} Always returns true (all domains accepted)
 */
function isAllowedDomain(email) {
  // All email domains now accepted. Non-DLSU users will need admin approval.
  if (!email) return false;
  return true;
}

/**
 * Check if email belongs to the internal (DLSU) domain
 * @param {string} email - Email address to check
 * @returns {boolean} True if @dlsud.edu.ph
 */
function isInternalDomain(email) {
  const internalDomain = process.env.ALLOWED_DOMAIN || 'dlsud.edu.ph';
  if (!email) return false;
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return emailDomain === internalDomain.toLowerCase();
}

/**
 * Check if user signed up with Microsoft OAuth
 * @param {Object} clerkUser - Clerk user object
 * @returns {boolean} True if Microsoft OAuth was used
 */
function isMicrosoftAuth(clerkUser) {
  if (!clerkUser.externalAccounts) return false;
  
  return clerkUser.externalAccounts.some(
    account => account.provider === 'microsoft'
  );
}

module.exports = {
  clerk,
  clerkClient,
  clerkMiddleware,
  requireAuth,
  getAuth,
  extractClerkProfile,
  isAllowedDomain,
  isInternalDomain,
  isMicrosoftAuth
};
