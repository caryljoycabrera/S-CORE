// ===== Maintenance Middleware =====
// Blocks non-admin users from protected routes when maintenance is active.
// Admins always pass through so they can still reach Configuration to disable it.

const { isMaintenanceActive } = require('../utils/settingsHelpers');
const settingsService = require('../services/settingsService');

/**
 * requireMaintenanceCheck Middleware
 * Checks if maintenance is active and targets the requesting user's role.
 * Renders maintenance.ejs if user should be blocked.
 */
async function requireMaintenanceCheck(req, res, next) {
  try {
    const status = isMaintenanceActive();
    if (!status.active) return next();

    // No session → can't determine user, let pass (login routes, etc.)
    if (!req.session || !req.session.userId) return next();

    const User = require('../models/User');
    const user = await User.findById(req.session.userId);
    if (!user) return next();

    // Admins always pass
    if (user.role === 'admin') return next();

    // Check target audience
    if (status.target === 'unit' && user.role !== 'unit') return next();
    if (status.target === 'requestor' && user.role !== 'user') return next();
    // 'both' blocks all non-admin users (already handled above by admin check)

    // Fetch branding details for the maintenance page
    const siteTitle = settingsService.getSetting('siteTitle', 'S-CORE');
    const contactEmail = settingsService.getSetting('maintenanceContactEmail', 'sco@dlsud.edu.ph');

    // User is targeted — render maintenance page
    return res.status(503).render('maintenance', {
      message: status.message,
      endTime: status.endTime ? status.endTime.toISOString() : null,
      remaining: status.remaining,
      siteTitle: siteTitle,
      contactEmail: contactEmail,
      layout: false
    });
  } catch (err) {
    console.error('Maintenance middleware error:', err);
    next();
  }
}

module.exports = { requireMaintenanceCheck };
