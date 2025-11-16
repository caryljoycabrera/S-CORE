// ==========================================
// STATUS HANDLER - Centralized status display logic
// ==========================================

/**
 * Get status display information including class, icon, and text
 * @param {string} status - The status string from the database
 * @returns {object} Status display information
 */
function getStatusDisplay(status) {
  const statusLower = (status || '').toLowerCase().trim();
  
  const statusMap = {
    'pending': {
      class: 'status-badge-warning',
      icon: '⏳',
      text: 'Pending',
      color: '#fbbf24'
    },
    'queued': {
      class: 'status-badge-info',
      icon: '📋',
      text: 'Queued',
      color: '#0ea5e9'
    },
    'in progress': {
      class: 'status-badge-primary',
      icon: '⚙️',
      text: 'In Progress',
      color: '#3b82f6'
    },
    'approved': {
      class: 'status-badge-success',
      icon: '✅',
      text: 'Approved',
      color: '#10b981'
    },
    'completed': {
      class: 'status-badge-success',
      icon: '✅',
      text: 'Completed',
      color: '#10b981'
    },
    'rejected': {
      class: 'status-badge-danger',
      icon: '❌',
      text: 'Rejected',
      color: '#ef4444'
    },
    'for revision': {
      class: 'status-badge-warning',
      icon: '🔄',
      text: 'For Revision',
      color: '#f59e0b'
    },
    'archived': {
      class: 'status-badge-secondary',
      icon: '📦',
      text: 'Archived',
      color: '#94a3b8'
    }
  };
  
  return statusMap[statusLower] || {
    class: 'status-badge-secondary',
    icon: '❓',
    text: status,
    color: '#94a3b8'
  };
}

/**
 * Get status priority for sorting
 * @param {string} status - The status string
 * @param {string} context - 'user', 'unit', or 'admin'
 * @returns {number} Priority number (lower = higher priority)
 */
function getStatusPriority(status, context = 'admin') {
  const statusLower = (status || '').toLowerCase().trim();
  
  if (context === 'unit') {
    const unitPriority = {
      'queued': 1,           // Highest - needs to be started
      'for revision': 2,     // Second - needs attention
      'in progress': 3,      // Third - actively working
      'pending': 4,
      'approved': 5,
      'completed': 6,
      'rejected': 7,
      'archived': 8
    };
    return unitPriority[statusLower] || 999;
  }
  
  if (context === 'user') {
    const userPriority = {
      'pending': 1,
      'queued': 1.5,        // Between pending and in progress
      'in progress': 2,      // High priority - being worked on
      'for revision': 3,
      'approved': 4,
      'completed': 4,
      'rejected': 5,
      'archived': 6
    };
    return userPriority[statusLower] || 999;
  }
  
  // Admin priority
  const adminPriority = {
    'pending': 1,           // Needs admin action
    'queued': 2,           // Auto-assigned, in unit queue
    'in progress': 3,      // Being worked on
    'for revision': 4,     // Waiting for fixes
    'approved': 5,
    'completed': 5,
    'rejected': 6,
    'archived': 7
  };
  return adminPriority[statusLower] || 999;
}

/**
 * Create a status badge element
 * @param {string} status - The status string
 * @param {boolean} includeIcon - Whether to include the icon
 * @returns {string} HTML string for the badge
 */
function createStatusBadge(status, includeIcon = true) {
  const info = getStatusDisplay(status);
  const icon = includeIcon ? `${info.icon} ` : '';
  return `<span class="status-badge ${info.class}">${icon}${info.text}</span>`;
}

/**
 * Update filter dropdown to include new statuses
 */
function updateStatusFilterDropdown() {
  const statusFilters = document.querySelectorAll('select[id*="status"], select[id*="Status"]');
  
  statusFilters.forEach(select => {
    // Check if Queued and In Progress options exist
    const hasQueued = Array.from(select.options).some(opt => opt.value.toLowerCase() === 'queued');
    const hasInProgress = Array.from(select.options).some(opt => opt.value.toLowerCase() === 'in progress');
    
    // Add if missing
    if (!hasQueued) {
      const option = document.createElement('option');
      option.value = 'Queued';
      option.textContent = '📥 Queued';
      // Insert after Pending
      const pendingOption = Array.from(select.options).find(opt => opt.value.toLowerCase() === 'pending');
      if (pendingOption) {
        pendingOption.after(option);
      } else {
        select.appendChild(option);
      }
    }
    
    if (!hasInProgress) {
      const option = document.createElement('option');
      option.value = 'In Progress';
      option.textContent = '⚙️ In Progress';
      // Insert after Queued
      const queuedOption = Array.from(select.options).find(opt => opt.value.toLowerCase() === 'queued');
      if (queuedOption) {
        queuedOption.after(option);
      } else {
        select.appendChild(option);
      }
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateStatusFilterDropdown);
} else {
  updateStatusFilterDropdown();
}

// Export for use in other scripts (browser global)
if (typeof window !== 'undefined') {
  window.getStatusDisplay = getStatusDisplay;
  window.getStatusPriority = getStatusPriority;
  window.createStatusBadge = createStatusBadge;
  window.updateStatusFilterDropdown = updateStatusFilterDropdown;
}

// Export for Node.js modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStatusDisplay,
    getStatusPriority,
    createStatusBadge,
    updateStatusFilterDropdown
  };
}
