// ===== Settings Helpers =====
// Centralized helper functions that use database settings

const settingsService = require('../services/settingsService');

/**
 * Get all organizations from settings
 * @returns {Array} Array of organization names
 */
function getOrganizations() {
  try {
    const orgs = settingsService.getSetting('organizations', []);
    // Return empty array if not loaded yet, to prevent errors
    return Array.isArray(orgs) ? orgs : [];
  } catch (error) {
    console.error('[Settings Helpers] Error getting organizations:', error);
    return [];
  }
}

/**
 * Get all offices from settings
 * @returns {Array} Array of office names
 */
function getOffices() {
  try {
    const offices = settingsService.getSetting('offices', []);
    // Return empty array if not loaded yet, to prevent errors
    return Array.isArray(offices) ? offices : [];
  } catch (error) {
    console.error('[Settings Helpers] Error getting offices:', error);
    return [];
  }
}

/**
 * Get all units from settings
 * @returns {Array} Array of unit names
 */
function getUnits() {
  return settingsService.getSetting('units', []);
}

/**
 * Get all request statuses from settings
 * @returns {Array} Array of status names
 */
function getRequestStatuses() {
  return settingsService.getSetting('requestStatuses', [
    'Pending', 'Queued', 'In Progress', 'For Revision', 
    'For Checking', 'Approved', 'Completed', 'Rejected', 'Archived'
  ]);
}

/**
 * Get all user roles from settings
 * @returns {Array} Array of role objects with name and permissions
 */
function getUserRoles() {
  return settingsService.getSetting('userRoles', [
    { name: 'User', permissions: ['user'] },
    { name: 'Unit Member', permissions: ['unit'] },
    { name: 'Administrator', permissions: ['admin'] }
  ]);
}

/**
 * Get announcement priorities from settings
 * @returns {Array} Array of priority names
 */
function getAnnouncementPriorities() {
  return settingsService.getSetting('announcementPriorities', ['Normal', 'Important', 'Urgent']);
}

/**
 * Get announcement types from settings
 * @returns {Array} Array of announcement type names
 */
function getAnnouncementTypes() {
  return settingsService.getSetting('announcementTypes', [
    'System Update', 'Maintenance', 'New Feature', 'Policy Change', 'General'
  ]);
}

/**
 * Get request type to unit mappings from settings
 * @returns {Array} Array of mapping objects with requestType and recommendedUnit
 */
function getRequestTypeMappings() {
  return settingsService.getSetting('requestTypeMappings', []);
}

/**
 * Get all unique request types from mappings
 * @returns {Array} Array of unique request type names
 */
function getRequestTypes() {
  const mappings = getRequestTypeMappings();
  const uniqueTypes = [...new Set(mappings.map(m => m.requestType))];
  return uniqueTypes.filter(type => type && type.trim() !== '');
}

/**
 * Get auto-assigned unit for a specific request type
 * @param {string} specificRequestType - The type of request
 * @returns {string} The assigned unit name or empty string if not found
 */
function getAutoAssignedUnit(specificRequestType) {
  const mappings = getRequestTypeMappings();
  const mapping = mappings.find(m => m.requestType === specificRequestType);
  return mapping ? mapping.recommendedUnit : '';
}

/**
 * Get maximum file size in MB from settings
 * @returns {number} Max file size in MB
 */
function getMaxFileSize() {
  return settingsService.getSetting('maxFileSize', 10);
}

/**
 * Get allowed file types from settings
 * @returns {Array} Array of allowed file extensions
 */
function getAllowedFileTypes() {
  return settingsService.getSetting('allowedFileTypes', [
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'pptx'
  ]);
}

/**
 * Get default deadline days from settings
 * @returns {number} Number of working days for default deadline
 */
function getDefaultDeadlineDays() {
  return settingsService.getSetting('defaultDeadlineDays', 7);
}

/**
 * Get max revisions allowed from settings
 * @returns {number} Maximum number of major revisions
 */
function getMaxRevisions() {
  return settingsService.getSetting('maxRevisions', 3);
}

/**
 * Get max minor revisions allowed from settings
 * @returns {number} Maximum number of minor revisions
 */
function getMaxMinorRevisions() {
  return settingsService.getSetting('maxMinorRevisions', 2);
}

/**
 * Check if email notifications are enabled
 * @returns {boolean} True if enabled
 */
function isEmailNotificationsEnabled() {
  return settingsService.getSetting('enableEmailNotifications', true);
}

/**
 * Get site configuration
 * @returns {object} Site configuration object
 */
function getSiteConfig() {
  return {
    title: settingsService.getSetting('siteTitle', 'S-CORE'),
    description: settingsService.getSetting('siteDescription', ''),
    timezone: settingsService.getSetting('timezone', 'Asia/Manila'),
    dateFormat: settingsService.getSetting('dateFormat', 'MM/DD/YYYY'),
    logo: settingsService.getSetting('logo', null),
    favicon: settingsService.getSetting('favicon', null)
  };
}

/**
 * Check if system is in maintenance mode
 * @returns {boolean} True if in maintenance mode
 */
function isMaintenanceMode() {
  return settingsService.getSetting('maintenanceMode', false);
}

/**
 * Get maintenance message
 * @returns {string} Maintenance message
 */
function getMaintenanceMessage() {
  return settingsService.getSetting('maintenanceMessage', 'System is currently under maintenance. Please check back later.');
}

module.exports = {
  getOrganizations,
  getOffices,
  getUnits,
  getRequestStatuses,
  getUserRoles,
  getAnnouncementPriorities,
  getAnnouncementTypes,
  getRequestTypeMappings,
  getRequestTypes,
  getAutoAssignedUnit,
  getMaxFileSize,
  getAllowedFileTypes,
  getDefaultDeadlineDays,
  getMaxRevisions,
  getMaxMinorRevisions,
  isEmailNotificationsEnabled,
  getSiteConfig,
  isMaintenanceMode,
  getMaintenanceMessage
};
