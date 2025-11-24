// ===== Settings Service =====
// Manages loading and caching system settings

const SystemSettings = require('../models/SystemSettings');

// In-memory cache for settings (loaded at startup)
let cachedSettings = null;

/**
 * Load system settings from database and cache them
 * Called at application startup
 */
const loadSettings = async () => {
  try {
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
      console.log('[Settings Service] Created default system settings');
    }
    
    cachedSettings = settings;
    console.log('[Settings Service] System settings loaded and cached');
    return settings;
  } catch (error) {
    console.error('[Settings Service] Error loading settings:', error);
    // Return empty object with safe defaults if error occurs
    cachedSettings = new SystemSettings();
    return cachedSettings;
  }
};

/**
 * Get cached settings
 * If not cached, loads from database
 */
const getSettings = async () => {
  if (cachedSettings) {
    return cachedSettings;
  }
  return await loadSettings();
};

/**
 * Update specific setting value
 */
const updateSetting = async (key, value) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }
    
    // Set nested values (supports dot notation like 'email.host')
    const keys = key.split('.');
    let obj = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = obj[keys[i]] || {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    
    settings.updatedAt = new Date();
    await settings.save();
    
    // Update cache
    cachedSettings = settings;
    console.log(`[Settings Service] Updated setting: ${key}`);
    return settings;
  } catch (error) {
    console.error('[Settings Service] Error updating setting:', error);
    throw error;
  }
};

/**
 * Update multiple settings at once
 */
const updateSettings = async (updates, userId = null) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }
    
    // Apply all updates
    Object.keys(updates).forEach(key => {
      settings[key] = updates[key];
    });
    
    settings.updatedBy = userId;
    settings.updatedAt = new Date();
    await settings.save();
    
    // Update cache
    cachedSettings = settings;
    console.log('[Settings Service] Updated multiple settings');
    return settings;
  } catch (error) {
    console.error('[Settings Service] Error updating settings:', error);
    throw error;
  }
};

/**
 * Get specific setting value
 */
const getSetting = (key, defaultValue = null) => {
  if (!cachedSettings) {
    return defaultValue;
  }
  
  const keys = key.split('.');
  let value = cachedSettings;
  
  for (let i = 0; i < keys.length; i++) {
    if (value && typeof value === 'object') {
      value = value[keys[i]];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
};

/**
 * Reset all settings to defaults
 */
const resetToDefaults = async (userId = null) => {
  try {
    await SystemSettings.deleteMany({});
    
    let settings = new SystemSettings();
    settings.updatedBy = userId;
    await settings.save();
    
    cachedSettings = settings;
    console.log('[Settings Service] Settings reset to defaults');
    return settings;
  } catch (error) {
    console.error('[Settings Service] Error resetting settings:', error);
    throw error;
  }
};

module.exports = {
  loadSettings,
  getSettings,
  updateSetting,
  updateSettings,
  getSetting,
  resetToDefaults
};
