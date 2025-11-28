/**
 * ==========================================
 * ADMIN EDIT REQUEST MODAL FUNCTIONALITY
 * ==========================================
 * Shared JavaScript for edit/delete request modals
 * Used by: allrequestsadmin.ejs, approvals.ejs, services.ejs
 * 
 * Dependencies:
 * - modal-centered.css (for modal positioning)
 * - CSS classes: .edit-modal-content, .edit-info-section, etc.
 * 
 * Usage:
 * 1. Include this script after jQuery (if any) and before page-specific scripts
 * 2. Ensure HTML contains editRequestModal and deleteConfirmModal elements
 * 3. Call AdminEditModal.init() after DOM is ready or it will auto-init
 * ==========================================
 */

(function(window) {
  'use strict';

  // ==========================================
  // STATE VARIABLES
  // ==========================================
  let currentEditRequestId = null;
  let currentEditRequestType = null;
  let defaultRequestType = 'Service Request'; // Can be overridden per page

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const config = {
    editEndpoint: '/admin/request/edit',
    deleteEndpoint: '/admin/request/delete',
    reloadDelay: 1000,
    notificationDuration: 5000
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Format date for input[type="date"] (YYYY-MM-DD)
   * Uses local date to avoid timezone offset issues
   */
  function formatDateForInput(dateValue) {
    if (!dateValue) return '';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse deadline from input as local date (no UTC offset)
   */
  function parseDeadlineInput(inputValue) {
    if (!inputValue) return null;
    // Use local date (YYYY-MM-DD) as-is
    return new Date(inputValue);
  }

  /**
   * Get element text content safely
   */
  function getElementText(selector, fallback = 'N/A') {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    return element ? element.textContent.trim() : fallback;
  }

  /**
   * Set element text content safely
   */
  function setElementText(selector, text) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) element.textContent = text;
  }

  /**
   * Set element value safely
   */
  function setElementValue(selector, value) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) element.value = value || '';
  }

  /**
   * Show/hide element by ID or selector
   */
  function setElementVisibility(selector, visible) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element) element.style.display = visible ? 'block' : 'none';
  }

  // ==========================================
  // NOTIFICATION SYSTEM
  // ==========================================
  
  function showNotification(message, type = 'success') {
    // Check if page has its own showNotification function
    if (window.showNotification && window.showNotification !== showNotification) {
      return window.showNotification(message, type);
    }

    let container = document.getElementById('notificationContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 100001;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      min-width: 300px;
      padding: 16px 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease-out;
    `;

    const iconPath = type === 'success' 
      ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>'
      : type === 'error'
        ? '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>'
        : '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>';

    notification.innerHTML = `
      <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none">
        ${iconPath}
      </svg>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 0; font-size: 20px; line-height: 1;">✕</button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, config.notificationDuration);
  }

  // ==========================================
  // MODAL FUNCTIONS
  // ==========================================

  /**
   * Open Edit Mode - Populate and show the edit modal
   * Can be called from details modal or table row context
   */
  function openEditMode(options = {}) {
    const editModal = document.getElementById('editRequestModal');
    if (!editModal) {
      console.error('[AdminEditModal] Edit modal not found');
      return;
    }

    // Get request data from various sources
    let requestId, requestType, requestData;

    // Option 1: Data passed directly
    if (options.requestId) {
      requestId = options.requestId;
      requestType = options.requestType || defaultRequestType;
      requestData = options.data || {};
    }
    // Option 2: From details modal dataset
    else {
      const detailsModal = document.getElementById('detailsModal');
      if (detailsModal) {
        requestId = detailsModal.dataset.currentRequestId;
        requestType = detailsModal.dataset.currentRequestType || defaultRequestType;
      }
    }

    // Option 3: From selected row
    if (!requestId) {
      const selectedRow = document.querySelector('.request-row.selected, .request-row[data-selected="true"]');
      if (selectedRow) {
        requestId = selectedRow.dataset.id || selectedRow.dataset.requestId;
        requestType = selectedRow.dataset.type || defaultRequestType;
      }
    }

    if (!requestId) {
      console.error('[AdminEditModal] No request ID found');
      showNotification('Please select a request first', 'error');
      return;
    }

    currentEditRequestId = requestId;
    currentEditRequestType = requestType;

    // Populate read-only fields
    populateReadOnlyFields(requestData);
    
    // Populate editable fields
    populateEditableFields(requestData);

    // Show modal
    editModal.style.display = 'flex';
    editModal.classList.add('show');
  }

  /**
   * Populate read-only information section
   */
  function populateReadOnlyFields(data = {}) {
    // Try to get data from details modal elements first, then from passed data
    const requestorName = data.requestor || getElementText('#detailStudent', 'N/A');
    const dateSubmitted = data.dateSubmitted || getElementText('#detailDatetime', 'N/A');
    const requestTypeDisplay = data.requestType || getElementText('#detailType', currentEditRequestType);
    const specificType = data.specificType || getElementText('#detailSpecificRequest', '');
    const organizationName = data.organization || getElementText('#detailOrganization', 'N/A');

    setElementText('#editRequestor', requestorName);
    setElementText('#editOrganizationReadonly', organizationName);
    setElementText('#editRequestType', requestTypeDisplay);
    setElementText('#editDateSubmitted', dateSubmitted);

    // Show specific type if it exists and is not "Not specified"
    const specificTypeContainer = document.getElementById('editSpecificTypeContainer');
    if (specificType && specificType !== 'Not specified' && specificType.trim() !== '') {
      setElementText('#editSpecificType', specificType);
      if (specificTypeContainer) specificTypeContainer.style.display = 'block';
    } else {
      if (specificTypeContainer) specificTypeContainer.style.display = 'none';
    }
  }

  /**
   * Populate editable form fields
   */
  function populateEditableFields(data = {}) {
    // Title
    const titleValue = data.title || getElementText('#detailTitle', '');
    setElementValue('#editTitle', titleValue);

    // Description
    const descValue = data.description || getElementText('#detailDescription', '');
    setElementValue('#editDescription', descValue);

    // Deadline
    const deadlineElement = document.getElementById('detailDeadlineInfo');
    let deadlineValue = data.deadline;
    if (!deadlineValue && deadlineElement) {
      const deadlineText = deadlineElement.textContent.trim();
      if (deadlineText && deadlineText !== 'N/A' && deadlineText !== 'Not set') {
        deadlineValue = deadlineText;
      }
    }
    setElementValue('#editDeadline', formatDateForInput(deadlineValue));

    // Links
    const linksContainer = document.getElementById('editLinksContainer');
    let linksValue = '';
    
    // Try to get links from data or DOM
    if (data.links && Array.isArray(data.links)) {
      linksValue = data.links.join(', ');
    } else {
      const linksSection = document.querySelector('.unit-links-section');
      if (linksSection && linksSection.style.display !== 'none') {
        const linkElements = linksSection.querySelectorAll('.unit-link-item a');
        linksValue = Array.from(linkElements).map(a => a.href).join(', ');
      }
    }
    
    if (linksValue) {
      setElementValue('#editLinks', linksValue);
      if (linksContainer) linksContainer.style.display = 'block';
    } else {
      if (linksContainer) linksContainer.style.display = 'none';
    }
  }

  /**
   * Close Edit Modal
   */
  function closeEditModal() {
    const editModal = document.getElementById('editRequestModal');
    if (editModal) {
      editModal.style.display = 'none';
      editModal.classList.remove('show');
    }
    currentEditRequestId = null;
    currentEditRequestType = null;
  }

  /**
   * Handle Edit Form Submission
   */
  async function handleEditSubmit(event) {
    event.preventDefault();

    if (!currentEditRequestId || !currentEditRequestType) {
      console.error('[AdminEditModal] No request selected for editing');
      showNotification('No request selected', 'error');
      return;
    }

    // Get form values
    const linksValue = document.getElementById('editLinks')?.value.trim() || '';
    const linksArray = linksValue ? linksValue.split(',').map(link => link.trim()).filter(link => link) : [];

    const deadline = parseDeadlineInput(document.getElementById('editDeadline')?.value);

    const updates = {
      title: document.getElementById('editTitle')?.value.trim() || '',
      description: document.getElementById('editDescription')?.value.trim() || '',
      deadline: deadline,
      links: linksArray
    };

    // Validate required fields
    if (!updates.title) {
      showNotification('Title is required', 'error');
      return;
    }
    if (!updates.description) {
      showNotification('Description is required', 'error');
      return;
    }

    try {
      const response = await fetch(config.editEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId: currentEditRequestId,
          requestType: currentEditRequestType,
          updates
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Request updated successfully!', 'success');
        closeEditModal();

        // Close details modal if open
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) detailsModal.style.display = 'none';

        // Reload page to show updated data
        setTimeout(() => location.reload(), config.reloadDelay);
      } else {
        showNotification(data.message || 'Failed to update request', 'error');
      }
    } catch (error) {
      console.error('[AdminEditModal] Error updating request:', error);
      showNotification('An error occurred while updating the request', 'error');
    }
  }

  // ==========================================
  // DELETE MODAL FUNCTIONS
  // ==========================================

  /**
   * Open Delete Confirmation Modal
   */
  function openDeleteConfirm(options = {}) {
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (!deleteModal) {
      console.error('[AdminEditModal] Delete modal not found');
      return;
    }

    // Get request data from various sources
    let requestId, requestType;

    // Option 1: Data passed directly
    if (options.requestId) {
      requestId = options.requestId;
      requestType = options.requestType || defaultRequestType;
    }
    // Option 2: From details modal dataset
    else {
      const detailsModal = document.getElementById('detailsModal');
      if (detailsModal) {
        requestId = detailsModal.dataset.currentRequestId;
        requestType = detailsModal.dataset.currentRequestType || defaultRequestType;
      }
    }

    // Option 3: From selected row
    if (!requestId) {
      const selectedRow = document.querySelector('.request-row.selected, .request-row[data-selected="true"]');
      if (selectedRow) {
        requestId = selectedRow.dataset.id || selectedRow.dataset.requestId;
        requestType = selectedRow.dataset.type || defaultRequestType;
      }
    }

    if (!requestId) {
      console.error('[AdminEditModal] No request ID found for deletion');
      showNotification('Please select a request first', 'error');
      return;
    }

    currentEditRequestId = requestId;
    currentEditRequestType = requestType;

    deleteModal.style.display = 'flex';
    deleteModal.classList.add('show');
  }

  /**
   * Close Delete Confirmation Modal
   */
  function closeDeleteConfirm() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
      deleteModal.style.display = 'none';
      deleteModal.classList.remove('show');
    }
    currentEditRequestId = null;
    currentEditRequestType = null;
  }

  /**
   * Confirm Delete - Execute the deletion
   */
  async function confirmDelete() {
    if (!currentEditRequestId || !currentEditRequestType) {
      console.error('[AdminEditModal] No request selected for deletion');
      showNotification('No request selected', 'error');
      return;
    }

    // Store the request ID before clearing it
    const deletedRequestId = currentEditRequestId;

    try {
      const response = await fetch(config.deleteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId: currentEditRequestId,
          requestType: currentEditRequestType
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Request moved to trash successfully!', 'success');
        closeDeleteConfirm();

        // Close details modal if open
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) detailsModal.style.display = 'none';

        // Remove the row from the table immediately (no page reload needed)
        removeRowFromTable(deletedRequestId);
        
        // Update the results count if it exists
        updateResultsCount();
      } else {
        showNotification(data.message || 'Failed to delete request', 'error');
      }
    } catch (error) {
      console.error('[AdminEditModal] Error deleting request:', error);
      showNotification('An error occurred while deleting the request', 'error');
    }
  }

  /**
   * Remove a row from the requests table by request ID
   */
  function removeRowFromTable(requestId) {
    if (!requestId) return;

    // Try multiple selectors to find the row (different pages use different data attributes)
    const selectors = [
      `.request-row[data-id="${requestId}"]`,
      `.request-row[data-request-id="${requestId}"]`,
      `tr[data-id="${requestId}"]`,
      `tr[data-request-id="${requestId}"]`
    ];

    let rowToRemove = null;
    for (const selector of selectors) {
      rowToRemove = document.querySelector(selector);
      if (rowToRemove) break;
    }

    if (rowToRemove) {
      // Add fade-out animation
      rowToRemove.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
      rowToRemove.style.opacity = '0';
      rowToRemove.style.transform = 'translateX(-20px)';
      
      // Remove after animation
      setTimeout(() => {
        rowToRemove.remove();
        
        // Check if table is now empty and show empty state if needed
        const tableBody = document.getElementById('requestsTableBody');
        if (tableBody && tableBody.children.length === 0) {
          showEmptyTableState();
        }
      }, 300);
      
      console.log('[AdminEditModal] Row removed from table:', requestId);
    } else {
      console.warn('[AdminEditModal] Could not find row to remove:', requestId);
    }
  }

  /**
   * Update the results count display
   */
  function updateResultsCount() {
    const resultsCountEl = document.querySelector('.results-count span, .results-count');
    if (resultsCountEl) {
      const tableBody = document.getElementById('requestsTableBody');
      if (tableBody) {
        const visibleRows = tableBody.querySelectorAll('.request-row:not([style*="display: none"])').length;
        // Update count - handle different formats
        const countText = resultsCountEl.textContent;
        if (countText.includes('Showing')) {
          resultsCountEl.innerHTML = `Showing <strong>${visibleRows}</strong> request${visibleRows !== 1 ? 's' : ''}`;
        } else {
          resultsCountEl.textContent = `${visibleRows} request${visibleRows !== 1 ? 's' : ''}`;
        }
      }
    }
  }

  /**
   * Show empty table state when all rows are removed
   */
  function showEmptyTableState() {
    const tableSection = document.querySelector('.table-section');
    if (!tableSection) return;

    // Check if empty message already exists
    if (tableSection.querySelector('.no-requests-message')) return;

    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'no-requests-message';
    emptyMessage.innerHTML = `
      <svg width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p>No requests available</p>
    `;
    emptyMessage.style.cssText = 'text-align: center; padding: 3rem; color: #64748b;';
    tableSection.appendChild(emptyMessage);
  }

  // ==========================================
  // ROW SELECTION HANDLER
  // ==========================================

  function handleRowClick(event) {
    const row = event.target.closest('.request-row');
    if (!row) return;

    // Clear previous selections
    document.querySelectorAll('.request-row').forEach(r => {
      r.classList.remove('selected');
      r.dataset.selected = 'false';
    });

    // Mark current row as selected
    row.classList.add('selected');
    row.dataset.selected = 'true';

    // Store in details modal for edit/delete operations
    const modal = document.getElementById('detailsModal');
    if (modal) {
      modal.dataset.currentRequestId = row.dataset.id || row.dataset.requestId;
      modal.dataset.currentRequestType = row.dataset.type || defaultRequestType;
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  function init(options = {}) {
    // Set default request type if provided
    if (options.defaultRequestType) {
      defaultRequestType = options.defaultRequestType;
    }

    // Override config if provided
    if (options.editEndpoint) config.editEndpoint = options.editEndpoint;
    if (options.deleteEndpoint) config.deleteEndpoint = options.deleteEndpoint;

    // Attach form submit handler
    const editForm = document.getElementById('editRequestForm');
    if (editForm) {
      editForm.addEventListener('submit', handleEditSubmit);
    }

    // Attach row click handler for selection
    document.addEventListener('click', handleRowClick);

    console.log('[AdminEditModal] Initialized successfully');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    // DOM is already ready
    setTimeout(() => init(), 0);
  }

  // ==========================================
  // EXPORT PUBLIC API
  // ==========================================

  const AdminEditModal = {
    init,
    openEditMode,
    closeEditModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
    showNotification,
    setDefaultRequestType: (type) => { defaultRequestType = type; },
    getCurrentRequestId: () => currentEditRequestId,
    getCurrentRequestType: () => currentEditRequestType
  };

  // Expose to window for global access
  window.AdminEditModal = AdminEditModal;

  // Also expose individual functions to window for backward compatibility with onclick handlers
  window.openEditMode = openEditMode;
  window.closeEditModal = closeEditModal;
  window.openDeleteConfirm = openDeleteConfirm;
  window.closeDeleteConfirm = closeDeleteConfirm;
  window.confirmDelete = confirmDelete;

})(window);

// ==========================================
// CSS KEYFRAME ANIMATIONS (injected once)
// ==========================================
(function() {
  const styleId = 'admin-edit-modal-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
