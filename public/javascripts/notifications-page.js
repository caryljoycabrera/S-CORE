/**
 * ===== Notifications Page JavaScript =====
 * Unified notification page functionality for Admin, Unit, and User roles
 * Handles loading, filtering, pagination, and actions for notification pages
 */

class NotificationsPageManager {
  constructor(options = {}) {
    // Configuration - support both naming conventions for flexibility
    this.containerId = options.containerId || 'notifications-list';
    this.paginationContainerId = options.paginationContainerId || options.paginationId || 'pagination-container';
    this.pageInfoId = options.pageInfoId || 'page-info';
    this.prevBtnId = options.prevBtnId || 'prev-btn';
    this.nextBtnId = options.nextBtnId || 'next-btn';
    this.countId = options.countId || 'notification-count';
    this.markAllReadBtnId = options.markAllReadBtnId || 'mark-all-read-btn';
    this.refreshBtnId = options.refreshBtnId || 'refresh-btn';
    this.filterBtnClass = options.filterBtnClass || 'filter-btn';
    
    // Role-specific configuration - try to get from user-data element
    this.userRole = options.userRole || this.getUserRoleFromPage() || 'user';
    this.hideSenderForTypes = options.hideSenderForTypes || ['user_approved'];
    this.additionalIcons = options.additionalIcons || {};
    
    // State
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentFilter = 'all';
    this.notifications = [];
    this.isLoading = false;

    // Initialize
    this.init();
  }

  /**
   * Get user role from page's user-data element
   */
  getUserRoleFromPage() {
    const userDataElement = document.getElementById('user-data');
    if (userDataElement) {
      try {
        const userData = JSON.parse(userDataElement.textContent);
        return userData.role;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  }

  /**
   * Initialize the notifications page manager
   */
  init() {
    // Handle both cases: if DOM is already loaded or still loading
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeComponents();
      });
    } else {
      // DOM already loaded, initialize immediately
      this.initializeComponents();
    }
  }

  /**
   * Initialize all components after DOM is ready
   */
  initializeComponents() {
    this.loadNotifications();
    this.setupFilters();
    this.setupActions();
  }

  /**
   * Setup filter button event listeners
   */
  setupFilters() {
    const filterButtons = document.querySelectorAll(`.${this.filterBtnClass}`);
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.currentPage = 1;
        this.loadNotifications();
      });
    });
  }

  /**
   * Setup action button event listeners
   */
  setupActions() {
    const markAllReadBtn = document.getElementById(this.markAllReadBtnId);
    const refreshBtn = document.getElementById(this.refreshBtnId);
    const prevBtn = document.getElementById(this.prevBtnId);
    const nextBtn = document.getElementById(this.nextBtnId);

    console.log('📋 Setting up notification page actions:', {
      markAllReadBtn: !!markAllReadBtn,
      refreshBtn: !!refreshBtn,
      prevBtn: !!prevBtn,
      nextBtn: !!nextBtn
    });

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        console.log('✅ Mark All Read button clicked');
        this.markAllAsRead();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadNotifications());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousPage());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextPage());
    }
  }

  /**
   * Load notifications from the server
   */
  async loadNotifications() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const list = document.getElementById(this.containerId);
      if (list) {
        list.innerHTML = '<div class="notifications-loading-state">Loading notifications...</div>';
      }

      let url = `/api/notifications?page=${this.currentPage}&limit=20`;
      if (this.currentFilter === 'unread') {
        url += '&unreadOnly=true';
      }

      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load notifications');

      const result = await response.json();
      this.notifications = result.data.notifications;
      this.totalPages = result.data.totalPages;
      const totalCount = result.data.total;

      // Filter by type if needed
      let filteredNotifications = this.notifications;
      if (this.currentFilter !== 'all' && this.currentFilter !== 'unread') {
        filteredNotifications = this.notifications.filter(n => {
          if (this.currentFilter === 'service') return n.type.includes('service');
          if (this.currentFilter === 'approval') return n.type.includes('approval');
          if (this.currentFilter === 'message') return n.type === 'new_message';
          if (this.currentFilter === 'system') return n.type === 'system';
          return true;
        });
      }

      this.renderNotifications(filteredNotifications);
      this.updatePagination(totalCount);

    } catch (error) {
      console.error('Error loading notifications:', error);
      const list = document.getElementById(this.containerId);
      if (list) {
        list.innerHTML = `
          <div class="notifications-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>Error</h3>
            <p>Failed to load notifications. Please try again.</p>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render notifications to the page
   */
  renderNotifications(notifications) {
    const list = document.getElementById(this.containerId);
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notifications-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <h3>No notifications</h3>
          <p>You don't have any notifications yet.</p>
        </div>
      `;
      return;
    }

    const notificationsHTML = notifications.map(notification => {
      const isUnread = !notification.isRead;
      const timeAgo = this.formatTimeAgo(new Date(notification.createdAt));
      const icon = this.getNotificationIcon(notification.type);
      const notifId = notification._id || notification.id;
      const actionUrl = notification.actionUrl || '';
      const isDeletable = notification.isDeletable !== false;

      // Get sender name from notification
      let senderName = '';
      if (notification.sender) {
        if (typeof notification.sender === 'object') {
          if (notification.sender.fName || notification.sender.lName) {
            senderName = `${notification.sender.fName || ''} ${notification.sender.lName || ''}`.trim();
          } else if (notification.sender.name) {
            senderName = notification.sender.name;
          }
        } else if (typeof notification.sender === 'string') {
          senderName = notification.sender;
        }
      }

      // Determine if sender should be shown - only show if we have a valid sender name
      const showSender = senderName && !this.hideSenderForTypes.includes(notification.type);

      return `
        <div class="notification-page-item ${isUnread ? 'unread' : ''}" data-id="${notifId}">
          <div class="notification-page-icon ${notification.type}">
            ${icon}
          </div>
          <div class="notification-page-content" 
               data-id="${notifId}" 
               data-type="${notification.type}" 
               data-url="${this.escapeHtml(actionUrl)}"
               style="cursor: ${actionUrl ? 'pointer' : 'default'};">
            <h4 class="notification-page-item-title">${this.escapeHtml(notification.title)}</h4>
            <p class="notification-page-message">${this.escapeHtml(notification.message)}</p>
            <div class="notification-page-meta">
              <span class="notification-page-time">${timeAgo}</span>
              ${showSender ? `<span class="notification-page-sender">from ${this.escapeHtml(senderName)}</span>` : ''}
            </div>
          </div>
          <div class="notification-page-item-actions">
            ${isUnread ? `
              <button class="notification-page-action-btn mark-read" data-id="${notifId}" title="Mark as read">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Read
              </button>
            ` : ''}
            ${isDeletable ? `
              <button class="notification-page-action-btn delete" data-id="${notifId}" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
                Delete
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    list.innerHTML = notificationsHTML;
    this.attachNotificationListeners();
  }

  /**
   * Attach event listeners to notification items
   */
  attachNotificationListeners() {
    // Click on notification content to navigate
    document.querySelectorAll('.notification-page-content').forEach(content => {
      content.addEventListener('click', () => {
        const notifId = content.dataset.id;
        const type = content.dataset.type;
        let url = content.dataset.url;

        if (!url) {
          console.log('No action URL for this notification');
          return;
        }

        // Mark as read first
        this.markAsRead(notifId);

        // Rewrite URL based on user role
        url = this.rewriteUrlForRole(url);

        // Use the notification system's navigation handler if available
        if (window.notificationSystem && typeof window.notificationSystem.handleNotificationNavigation === 'function') {
          window.notificationSystem.handleNotificationNavigation(url, type);
        } else {
          // Fallback: direct navigation
          window.location.href = url;
        }
      });
    });

    // Mark as read buttons
    document.querySelectorAll('.notification-page-action-btn.mark-read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const notifId = btn.dataset.id;
        this.markAsRead(notifId);
      });
    });

    // Delete buttons
    document.querySelectorAll('.notification-page-action-btn.delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const notifId = btn.dataset.id;
        if (confirm('Are you sure you want to delete this notification?')) {
          await this.deleteNotification(notifId);
        }
      });
    });
  }

  /**
   * Rewrite notification URL based on user role
   * Ensures notifications redirect to the correct role-specific pages
   */
  rewriteUrlForRole(url) {
    if (!url || !this.userRole) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;

      // Define URL mappings for each role
      const urlMappings = {
        // Unit role mappings - redirect from user/admin pages to unit equivalents
        unit: {
          '/request-approvals': '/unit/task-approvals',
          '/service-requests': '/unit/task-services',
          '/admin/approvals': '/unit/task-approvals',
          '/admin/services': '/unit/task-services'
        },
        // Admin role mappings - redirect from user pages to admin equivalents
        admin: {
          '/request-approvals': '/admin/approvals',
          '/service-requests': '/admin/services'
        },
        // User role mappings - redirect from admin/unit pages to user equivalents
        user: {
          '/admin/approvals': '/request-approvals',
          '/admin/services': '/service-requests',
          '/unit/task-approvals': '/request-approvals',
          '/unit/task-services': '/service-requests'
        }
      };

      const roleMappings = urlMappings[this.userRole];
      if (roleMappings && roleMappings[path]) {
        const newPath = roleMappings[path];
        console.log(`🔀 Rewriting URL path for ${this.userRole} role: ${path} → ${newPath}`);
        urlObj.pathname = newPath;
        return urlObj.toString();
      }

      return url;
    } catch (error) {
      console.error('Error rewriting URL for role:', error);
      return url;
    }
  }

  /**
   * Update pagination UI
   */
  updatePagination(totalCount) {
    const container = document.getElementById(this.paginationContainerId);
    const pageInfo = document.getElementById(this.pageInfoId);
    const prevBtn = document.getElementById(this.prevBtnId);
    const nextBtn = document.getElementById(this.nextBtnId);
    const countEl = document.getElementById(this.countId);

    if (container) {
      container.style.display = this.totalPages > 1 || totalCount > 0 ? 'flex' : 'none';
    }

    if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    if (countEl) countEl.textContent = `${totalCount} notification${totalCount !== 1 ? 's' : ''}`;
  }

  /**
   * Navigate to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNotifications();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNotifications();
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        const item = document.querySelector(`.notification-page-item[data-id="${notificationId}"]`);
        if (item) {
          item.classList.remove('unread');
          const button = item.querySelector('.notification-page-action-btn.mark-read');
          if (button) button.remove();
        }
        // Update bell badge
        this.refreshNotificationSystem();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    console.log('📖 Marking all notifications as read...');
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log('✅ All notifications marked as read:', result);
        
        // Update UI immediately - remove unread class from all items
        document.querySelectorAll('.notification-page-item.unread').forEach(item => {
          item.classList.remove('unread');
          // Also remove the mark-read button since it's no longer needed
          const markReadBtn = item.querySelector('.notification-page-action-btn.mark-read');
          if (markReadBtn) markReadBtn.remove();
        });
        
        // Also update the old notification-item class for compatibility
        document.querySelectorAll('.notification-item.unread').forEach(item => {
          item.classList.remove('unread');
          const indicator = item.querySelector('.unread-indicator');
          if (indicator) indicator.remove();
        });
        
        // Reload notifications to get fresh data
        this.loadNotifications();
        this.refreshNotificationSystem();
      } else {
        console.error('❌ Failed to mark all as read:', response.status);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        this.loadNotifications();
        this.refreshNotificationSystem();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        console.error('Failed to delete notification:', errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Refresh the global notification system (bell icon)
   */
  refreshNotificationSystem() {
    if (window.notificationSystem && typeof window.notificationSystem.refreshNotifications === 'function') {
      window.notificationSystem.refreshNotifications();
    }
  }

  /**
   * Get SVG icon for notification type
   */
  getNotificationIcon(type) {
    const baseIcons = {
      'service_created': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
      'service_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'service_rejected': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      'service_completed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'approval_created': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>',
      'approval_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'approval_rejected': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      'approval_revision': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      'new_message': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      'user_registered': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
      'user_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17,11 19,13 23,9"></polyline></svg>',
      'unit_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17,11 19,13 23,9"></polyline></svg>',
      'user_denied': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>',
      'system': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    };
    // Merge base icons with any additional icons from config
    const icons = { ...baseIcons, ...this.additionalIcons };
    return icons[type] || icons['system'];
  }

  /**
   * Format a date as relative time
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Refresh notifications list
   */
  refresh() {
    this.loadNotifications();
  }
}

// Make it available globally
window.NotificationsPageManager = NotificationsPageManager;
// Alias for simpler instantiation
window.NotificationsPage = NotificationsPageManager;
