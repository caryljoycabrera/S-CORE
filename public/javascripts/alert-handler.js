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
  // Show toast popup in #toastContainer
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.log('[Toast]', message);
    return;
  }
  // Remove any existing toast
  toastContainer.innerHTML = '';
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast-popup toast-' + type;
  toast.style.cssText = 'min-width:220px;max-width:400px;padding:1rem 1.5rem;margin-bottom:1rem;border-radius:0.5rem;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.12);display:flex;align-items:center;gap:0.75rem;';
  let bg, color, icon;
  switch(type) {
    case 'success': bg = '#d1fae5'; color = '#065f46'; icon = '✓'; break;
    case 'error': bg = '#fee2e2'; color = '#991b1b'; icon = '✗'; break;
    case 'warning': bg = '#fef3c7'; color = '#92400e'; icon = '⚠'; break;
    default: bg = '#e0e7ff'; color = '#3730a3'; icon = 'ℹ';
  }
  toast.style.background = bg;
  toast.style.color = color;
  toast.innerHTML = `<span style="font-size:1.5rem;">${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  toastContainer.style.display = 'block';
  // Auto-hide after 2.5s
  setTimeout(() => {
    toastContainer.style.display = 'none';
    toastContainer.innerHTML = '';
  }, 2500);
};

console.log('%c[S-CORE] Alert Handler Loaded', 'color: #10b981; font-weight: bold; font-size: 12px;');
