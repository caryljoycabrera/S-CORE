/**
 * S-CORE Alert Handler
 * Replaces native alert/confirm with console logs
 * Prevents unnecessary animations and pop-ups
 */

// Override native alert function
window.alert = function(message) {
  console.log('[ALERT]', message);
  return true;
};

// Override native confirm function - always returns true
window.confirm = function(message) {
  console.log('[CONFIRM]', message);
  return true;
};

// Override native prompt function
window.prompt = function(message, defaultValue) {
  console.log('[PROMPT]', message, defaultValue);
  return defaultValue || null;
};

// Success logging
window.logSuccess = function(message, data = null) {
  console.log('%c✓ SUCCESS', 'color: #10b981; font-weight: bold;', message);
  if (data) console.log('Data:', data);
};

// Error logging
window.logError = function(message, error = null) {
  console.error('%c✗ ERROR', 'color: #ef4444; font-weight: bold;', message);
  if (error) console.error('Details:', error);
};

// Warning logging
window.logWarning = function(message, data = null) {
  console.warn('%c⚠ WARNING', 'color: #f59e0b; font-weight: bold;', message);
  if (data) console.warn('Data:', data);
};

// Info logging
window.logInfo = function(message, data = null) {
  console.log('%cℹ INFO', 'color: #3b82f6; font-weight: bold;', message);
  if (data) console.log('Data:', data);
};

// Custom alert function for UI feedback
window.showAlert = function(message, type = 'info') {
  // For now, just log to console with appropriate styling
  const styles = {
    success: 'color: #10b981; font-weight: bold;',
    error: 'color: #ef4444; font-weight: bold;',
    warning: 'color: #f59e0b; font-weight: bold;',
    info: 'color: #3b82f6; font-weight: bold;'
  };
  
  const prefix = {
    success: '✓ SUCCESS',
    error: '✗ ERROR', 
    warning: '⚠ WARNING',
    info: 'ℹ INFO'
  };
  
  console.log(`%c${prefix[type] || 'ℹ INFO'}`, styles[type] || styles.info, message);
  
  // You could extend this to show actual UI alerts later
  // For example: create a toast notification system
};

console.log('%c[S-CORE] Alert Handler Loaded', 'color: #10b981; font-weight: bold; font-size: 12px;');
