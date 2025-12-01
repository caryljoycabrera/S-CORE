/* ===========================================
   ARCHIVE PAGE JAVASCRIPT
   File: public/javascripts/ejs/archive.js
   Connected to: views/Admin/archive.ejs
   Purpose: Client-side functionality for the admin archive page
   Features: Filtering, restore, permanent delete
   =========================================== */

console.log('🗄️ Archive page script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('📋 Archive DOM Content Loaded');

  let currentRequestId = null;
  let currentRequestType = null;

  // Initialize filter functionality
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedType = typeFilter ? typeFilter.value : 'all';

    const rows = document.querySelectorAll('.request-row');
    let visibleCount = 0;

    rows.forEach(row => {
      const title = row.dataset.title?.toLowerCase() || '';
      const organization = row.dataset.organization?.toLowerCase() || '';
      const requester = row.dataset.requester?.toLowerCase() || '';
      const type = row.dataset.requestType || '';

      const matchesSearch = title.includes(searchTerm) || 
                           organization.includes(searchTerm) || 
                           requester.includes(searchTerm);

      const matchesType = selectedType === 'all' || type === selectedType;

      if (matchesSearch && matchesType) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Show empty state if no results
    const emptyState = document.querySelector('.empty-state');
    const tbody = document.getElementById('requestsTableBody');
    
    if (visibleCount === 0 && !emptyState) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-state filter-empty';
      emptyRow.innerHTML = `
        <td colspan="7">
          <div class="empty-archive-message">
            <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No matching requests</p>
            <p style="color: #6b7280;">Try adjusting your filters</p>
          </div>
        </td>
      `;
      tbody.appendChild(emptyRow);
    } else if (visibleCount > 0) {
      const filterEmpty = tbody.querySelector('.filter-empty');
      if (filterEmpty) {
        filterEmpty.remove();
      }
    }
  }

  // Restore request
  window.restoreRequest = function(requestId, requestType) {
    currentRequestId = requestId;
    currentRequestType = requestType;
    document.getElementById('restoreConfirmModal').style.display = 'flex';
  };

  window.closeRestoreModal = function() {
    document.getElementById('restoreConfirmModal').style.display = 'none';
    currentRequestId = null;
    currentRequestType = null;
  };

  window.confirmRestore = async function() {
    if (!currentRequestId || !currentRequestType) return;

    try {
      const response = await fetch('/admin/request/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: currentRequestId,
          requestType: currentRequestType
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(data.message, 'success');
        closeRestoreModal();
        
        // Remove row from table
        const row = document.querySelector(`[data-request-id="${currentRequestId}"]`);
        if (row) {
          row.remove();
        }

        // Check if table is now empty
        const remainingRows = document.querySelectorAll('.request-row');
        if (remainingRows.length === 0) {
          location.reload();
        }
      } else {
        showNotification(data.message || 'Failed to restore request', 'error');
      }
    } catch (error) {
      console.error('Error restoring request:', error);
      showNotification('An error occurred while restoring the request', 'error');
    }
  };

  // Permanent delete request
  window.permanentDeleteRequest = function(requestId, requestType) {
    currentRequestId = requestId;
    currentRequestType = requestType;
    document.getElementById('permanentDeleteModal').style.display = 'flex';
  };

  window.closePermanentDeleteModal = function() {
    document.getElementById('permanentDeleteModal').style.display = 'none';
    currentRequestId = null;
    currentRequestType = null;
  };

  window.confirmPermanentDelete = async function() {
    if (!currentRequestId || !currentRequestType) return;

    try {
      const response = await fetch('/admin/request/permanent-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: currentRequestId,
          requestType: currentRequestType
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(data.message, 'success');
        closePermanentDeleteModal();
        
        // Remove row from table
        const row = document.querySelector(`[data-request-id="${currentRequestId}"]`);
        if (row) {
          row.remove();
        }

        // Check if table is now empty
        const remainingRows = document.querySelectorAll('.request-row');
        if (remainingRows.length === 0) {
          location.reload();
        }
      } else {
        showNotification(data.message || 'Failed to permanently delete request', 'error');
      }
    } catch (error) {
      console.error('Error permanently deleting request:', error);
      showNotification('An error occurred while deleting the request', 'error');
    }
  };

  // Reset filters
  window.resetFilters = function() {
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';
    applyFilters();
  };

  // Show notification
  function showNotification(message, type = 'success') {
    // Check if notification container exists
    let container = document.getElementById('notificationContainer');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      min-width: 300px;
      padding: 16px 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none">
        ${type === 'success' 
          ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>'
          : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>'
        }
      </svg>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 0; font-size: 20px; line-height: 1;">✕</button>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
});

// Add CSS animation
const style = document.createElement('style');
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

console.log('✅ Archive page script fully initialized');
