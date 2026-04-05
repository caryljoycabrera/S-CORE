/* ==========================================
   ADMIN TRASH MODAL FUNCTIONALITY
   ==========================================
   Shared JS for trash/archive modals across admin pages
   Used by: allrequestsadmin.ejs, approvals.ejs, services.ejs, users.ejs
   ========================================== */

/**
 * Admin Trash Modal Module
 * Handles displaying, restoring, and permanently deleting archived items
 */
(function() {
  'use strict';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let currentRestoreId = null;
  let currentRestoreType = null;
  let currentRestoreName = null;
  let currentPermanentDeleteId = null;
  let currentPermanentDeleteType = null;
  let currentPermanentDeleteName = null;
  
  // Configuration (can be overridden by page)
  let config = {
    entityType: 'requests', // 'requests' or 'users'
    fetchEndpoint: '/api/admin/deleted-requests',
    restoreEndpoint: '/admin/request/restore',
    permanentDeleteEndpoint: '/admin/request/permanent-delete',
    typeFilter: 'all', // 'all', 'Request Approval', 'Service Request'
    onRestoreSuccess: null,
    onPermanentDeleteSuccess: null,
    reloadOnRestore: true
  };

  // ==========================================
  // SVG ICONS
  // ==========================================
  const icons = {
    trash: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>`,
    restore: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>`,
    deletePermanent: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#0891b2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`,
    emptyBox: `<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
      <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
    </svg>`,
    warning: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    close: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  /**
   * Format date for display
   */
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  /**
   * Escape text for use in JavaScript strings
   */
  function escapeJsString(text) {
    return (text || '').replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/"/g, '\\"');
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'success') {
    // Check if global showNotification exists
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Create notification container if not exists
    let container = document.getElementById('trashNotificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'trashNotificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10100;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
      min-width: 300px;
      padding: 16px 20px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
      color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease-out;
      font-weight: 500;
    `;

    const iconSvg = type === 'success' 
      ? `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
      : `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

    notification.innerHTML = `
      ${iconSvg}
      <span style="flex: 1;">${escapeHtml(message)}</span>
      <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 16px; line-height: 1;">✕</button>
    `;

    container.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // ==========================================
  // ROW RENDERING
  // ==========================================

  /**
   * Render a request row (for approvals/services/all requests)
   */
  function renderRequestRow(request) {
    const typeClass = request.type === 'Request Approval' ? 'type-approval' : 'type-service';
    return `
      <tr class="trash-request-row" 
          data-request-id="${escapeHtml(request._id)}" 
          data-request-type="${escapeHtml(request.type)}">
        <td>
          <span class="type-badge ${typeClass}">
            ${escapeHtml(request.type)}
          </span>
        </td>
        <td><div class="table-cell-wrapper">${escapeHtml(request.title)}</div></td>
        <td><div class="table-cell-wrapper">${escapeHtml(request.displayOrganization || request.organization)}</div></td>
        <td>${escapeHtml(request.userName || 'Unknown')}</td>
        <td>${escapeHtml(request.deletedByName || 'N/A')}</td>
        <td>${formatDate(request.deletedAt)}</td>
        <td>
          <button class="action-btn restore-btn" 
                  data-action="restore"
                  data-item-id="${escapeHtml(request._id)}"
                  data-item-type="${escapeHtml(request.type)}"
                  data-item-name="${escapeHtml(request.title)}"
                  title="Restore">
            ${icons.restore}
            Restore
          </button>
          <button class="action-btn delete-btn-permanent" 
                  data-action="permanent-delete"
                  data-item-id="${escapeHtml(request._id)}"
                  data-item-type="${escapeHtml(request.type)}"
                  data-item-name="${escapeHtml(request.title)}"
                  title="Permanently Delete">
            ${icons.deletePermanent}
            Delete Forever
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Render a user row (for users trash modal)
   */
  function renderUserRow(user) {
    const roleClass = user.role === 'admin' ? 'role-admin' : (user.role === 'unit' ? 'role-unit' : 'role-user');
    const fullName = `${user.fName || ''} ${user.lName || ''}`.trim();
    return `
      <tr class="trash-request-row" 
          data-user-id="${escapeHtml(user._id)}">
        <td>${escapeHtml(String(user._id).slice(-6))}</td>
        <td>${escapeHtml(fullName)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>
          <span class="role-badge ${roleClass}">
            ${escapeHtml((user.role || 'user').toUpperCase())}
          </span>
        </td>
        <td>${escapeHtml(user.deletedByName || 'N/A')}</td>
        <td>${formatDate(user.deletedAt)}</td>
        <td>
          <button class="action-btn restore-btn" 
                  data-action="restore"
                  data-item-id="${escapeHtml(user._id)}"
                  data-item-type="user"
                  data-item-name="${escapeHtml(fullName)}"
                  title="Restore">
            ${icons.restore}
            Restore
          </button>
          <button class="action-btn delete-btn-permanent" 
                  data-action="permanent-delete"
                  data-item-id="${escapeHtml(user._id)}"
                  data-item-type="user"
                  data-item-name="${escapeHtml(fullName)}"
                  title="Permanently Delete">
            ${icons.deletePermanent}
            Delete Forever
          </button>
        </td>
      </tr>
    `;
  }

  /**
   * Render loading state
   */
  function renderLoading(colspan = 7) {
    return `
      <tr>
        <td colspan="${colspan}" style="padding: 0;">
          <div class="trash-loading">
            <div class="trash-loading-spinner"></div>
            <p>Loading deleted ${config.entityType}...</p>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Render error state
   */
  function renderError(message, colspan = 7) {
    return `
      <tr>
        <td colspan="${colspan}" style="text-align: center; padding: 2rem; color: #dc2626;">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-bottom: 8px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p style="margin: 0;">${escapeHtml(message)}</p>
        </td>
      </tr>
    `;
  }

  // ==========================================
  // MODAL FUNCTIONS
  // ==========================================

  /**
   * Initialize the trash modal with custom configuration
   */
  function init(customConfig = {}) {
    config = { ...config, ...customConfig };
    console.log('🗑️ AdminTrashModal initialized with config:', config);
  }

  /**
   * Open the trash modal
   */
  async function openTrashModal(customOptions = {}) {
    const options = { ...config, ...customOptions };
    console.log('🗑️ Opening trash modal with options:', options);

    const modal = document.getElementById('trashModal');
    const tableBody = document.getElementById('trashTableBody');
    const emptyState = document.getElementById('trashEmptyState');

    if (!modal || !tableBody) {
      console.error('❌ Trash modal elements not found!');
      return;
    }

    // Show loading
    const colspan = options.entityType === 'users' ? 7 : 7;
    tableBody.innerHTML = renderLoading(colspan);
    if (emptyState) emptyState.style.display = 'none';

    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    try {
      let endpoint = options.fetchEndpoint;
      if (options.entityType === 'requests' && options.typeFilter !== 'all') {
        endpoint += `?type=${encodeURIComponent(options.typeFilter)}`;
      } else if (options.entityType === 'requests') {
        endpoint += '?type=all';
      }

      const response = await fetch(endpoint, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const items = options.entityType === 'users' ? data.deletedUsers : data.deletedRequests;
        
        if (items && items.length > 0) {
          tableBody.innerHTML = items.map(item => 
            options.entityType === 'users' ? renderUserRow(item) : renderRequestRow(item)
          ).join('');
          if (emptyState) emptyState.style.display = 'none';
        } else {
          tableBody.innerHTML = '';
          if (emptyState) emptyState.style.display = 'block';
        }
      } else {
        tableBody.innerHTML = renderError(`Failed to load deleted ${options.entityType}`);
      }
    } catch (error) {
      console.error('Error loading deleted items:', error);
      tableBody.innerHTML = renderError(`Error: ${error.message}`);
    }
    
    // Setup event delegation for trash modal action buttons
    setupTrashModalEventDelegation();
  }

  /**
   * Setup event delegation for trash modal buttons
   * This handles clicks on dynamically generated restore and delete buttons
   */
  function setupTrashModalEventDelegation() {
    const tableBody = document.getElementById('trashTableBody');
    if (!tableBody) return;

    // Remove existing listener if any (to prevent duplicates)
    const existingListener = tableBody._trashModalListener;
    if (existingListener) {
      tableBody.removeEventListener('click', existingListener);
    }

    // Create new listener
    const listener = function(e) {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const itemId = button.dataset.itemId;
      const itemType = button.dataset.itemType;
      const itemName = button.dataset.itemName || '';

      console.log('🗑️ Trash action button clicked:', { action, itemId, itemType, itemName });

      if (action === 'restore') {
        openRestoreConfirm(itemId, itemType, itemName);
      } else if (action === 'permanent-delete') {
        openPermanentDeleteConfirm(itemId, itemType, itemName);
      }
    };

    // Attach listener
    tableBody.addEventListener('click', listener);
    tableBody._trashModalListener = listener;
    
    console.log('✅ Event delegation setup for trash modal buttons');
  }

  /**
   * Close the trash modal
   */
  function closeTrashModal() {
    const modal = document.getElementById('trashModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  /**
   * Open restore confirmation modal
   */
  function openRestoreConfirm(id, type, name = '') {
    currentRestoreId = id;
    currentRestoreType = type;
    currentRestoreName = name;

    const modal = document.getElementById('restoreConfirmModal');
    const message = document.getElementById('restoreConfirmMessage');
    
    if (modal) {
      if (message) {
        const entityName = type === 'user' ? 'user' : 'request';
        const displayName = name ? `<strong>${escapeHtml(name)}</strong>` : `this ${entityName}`;
        message.innerHTML = `Are you sure you want to restore ${displayName}? It will be moved back to the active list.`;
      }
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  /**
   * Close restore confirmation modal
   */
  function closeRestoreModal() {
    const modal = document.getElementById('restoreConfirmModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    currentRestoreId = null;
    currentRestoreType = null;
    currentRestoreName = null;
  }

  /**
   * Confirm restore action
   */
  async function confirmRestore() {
    if (!currentRestoreId) return;

    const isUser = currentRestoreType === 'user';
    const endpoint = isUser 
      ? `/api/admin/restore-user/${currentRestoreId}`
      : config.restoreEndpoint;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: isUser ? JSON.stringify({}) : JSON.stringify({
          requestId: currentRestoreId,
          requestType: currentRestoreType
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`${isUser ? 'User' : 'Request'} restored successfully!`, 'success');
        
        // Remove the row from the table with animation
        removeRowFromTrashTable(currentRestoreId, isUser ? 'user' : 'request');
        
        closeRestoreModal();

        // Callback or reload
        if (typeof config.onRestoreSuccess === 'function') {
          config.onRestoreSuccess(currentRestoreId, currentRestoreType);
        } else if (config.reloadOnRestore) {
          setTimeout(() => location.reload(), 1000);
        }
      } else {
        showNotification(data.message || `Failed to restore ${isUser ? 'user' : 'request'}`, 'error');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      showNotification(`An error occurred while restoring the ${isUser ? 'user' : 'request'}`, 'error');
    }
  }

  /**
   * Open permanent delete confirmation modal
   */
  function openPermanentDeleteConfirm(id, type, name = '') {
    currentPermanentDeleteId = id;
    currentPermanentDeleteType = type;
    currentPermanentDeleteName = name;

    // Support multiple modal IDs used across different pages
    const modal = document.getElementById('permanentDeleteModal') 
      || document.getElementById('permanentDeleteConfirmModal')
      || document.getElementById('trashPermanentDeleteModal');
    const message = document.getElementById('permanentDeleteMessage');
    
    if (modal) {
      if (message) {
        const entityName = type === 'user' ? 'user' : 'request';
        const displayName = name ? `<strong>${escapeHtml(name)}</strong>` : `this ${entityName}`;
        message.innerHTML = `Are you sure you want to permanently delete ${displayName}? This action cannot be undone.`;
      }
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  /**
   * Close permanent delete confirmation modal
   */
  function closePermanentDeleteModal() {
    const modal = document.getElementById('permanentDeleteModal') 
      || document.getElementById('permanentDeleteConfirmModal')
      || document.getElementById('trashPermanentDeleteModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    currentPermanentDeleteId = null;
    currentPermanentDeleteType = null;
    currentPermanentDeleteName = null;
  }

  // Alias for closePermanentDeleteModal (used by users.ejs)
  function closePermanentDeleteConfirm() {
    closePermanentDeleteModal();
  }

  /**
   * Confirm permanent delete action
   */
  async function confirmPermanentDelete() {
    if (!currentPermanentDeleteId) return;

    const isUser = currentPermanentDeleteType === 'user';
    const endpoint = isUser 
      ? `/api/admin/delete-user-permanently/${currentPermanentDeleteId}`
      : config.permanentDeleteEndpoint;

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: isUser ? JSON.stringify({}) : JSON.stringify({
          requestId: currentPermanentDeleteId,
          requestType: currentPermanentDeleteType
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`${isUser ? 'User' : 'Request'} permanently deleted!`, 'success');
        
        // Remove the row from the table with animation
        removeRowFromTrashTable(currentPermanentDeleteId, isUser ? 'user' : 'request');
        
        closePermanentDeleteModal();

        // Callback
        if (typeof config.onPermanentDeleteSuccess === 'function') {
          config.onPermanentDeleteSuccess(currentPermanentDeleteId, currentPermanentDeleteType);
        }
      } else {
        showNotification(data.message || `Failed to delete ${isUser ? 'user' : 'request'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification(`An error occurred while deleting the ${isUser ? 'user' : 'request'}`, 'error');
    }
  }

  /**
   * Remove a row from the trash table with animation
   */
  function removeRowFromTrashTable(id, type) {
    const tableBody = document.getElementById('trashTableBody');
    const emptyState = document.getElementById('trashEmptyState');
    
    if (!tableBody) return;

    let row;
    if (type === 'user') {
      row = tableBody.querySelector(`tr[data-user-id="${id}"]`);
    } else {
      row = tableBody.querySelector(`tr[data-request-id="${id}"]`);
    }

    if (row) {
      row.classList.add('fade-out');
      setTimeout(() => {
        row.remove();
        
        // Check if table is now empty
        const remainingRows = tableBody.querySelectorAll('tr.trash-request-row');
        if (remainingRows.length === 0 && emptyState) {
          emptyState.style.display = 'block';
        }
      }, 400);
    }
  }

  // ==========================================
  // EXPOSE PUBLIC API
  // ==========================================
  window.AdminTrashModal = {
    init,
    openTrashModal,
    closeTrashModal,
    openRestoreConfirm,
    closeRestoreModal,
    confirmRestore,
    openPermanentDeleteConfirm,
    closePermanentDeleteModal,
    closePermanentDeleteConfirm, // Alias
    confirmPermanentDelete
  };

  // Also expose individual functions globally for onclick handlers
  window.openTrashModal = openTrashModal;
  window.closeTrashModal = closeTrashModal;
  window.openRestoreConfirm = openRestoreConfirm;
  window.closeRestoreModal = closeRestoreModal;
  window.closeRestoreConfirm = closeRestoreModal; // Alias for users.ejs
  window.confirmRestore = confirmRestore;
  window.openPermanentDeleteConfirm = openPermanentDeleteConfirm;
  window.closePermanentDeleteModal = closePermanentDeleteModal;
  window.closePermanentDeleteConfirm = closePermanentDeleteConfirm; // Alias for users.ejs
  window.confirmPermanentDelete = confirmPermanentDelete;

})();
