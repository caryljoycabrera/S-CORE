/**
 * ===== Notification System JavaScript =====
 * Handles real-time notifications, UI interactions, and API communication
 * Works with Socket.IO for real-time updates and provides notification management
 */

class NotificationSystem {
  constructor() {
    this.socket = null;
    this.isOpen = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.lastFetchTime = null;
    this.isAuthenticated = false;
    this.currentUserId = null;
    this.userRole = null;
    
    this.init();
  }

  /**
   * Initialize the notification system
   */
  init() {
    // Check if user is authenticated
    this.checkAuthentication();
    
    if (this.isAuthenticated) {
      this.initializeUI();
      this.initializeSocket();
      this.loadNotifications();
      this.setupEventListeners();
      
      // Set up periodic refresh for offline notifications
      setInterval(() => this.refreshNotifications(), 30000); // Every 30 seconds
    }
  }

  /**
   * Check if user is authenticated and get user info
   */
  checkAuthentication() {
    // Check for user session (adjust based on your auth implementation)
    const userDataElement = document.querySelector('#user-data');
    if (userDataElement) {
      try {
        const userData = JSON.parse(userDataElement.textContent);
        this.currentUserId = userData.id;
        this.userRole = userData.role;
        this.isAuthenticated = true;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Alternative: check session storage or cookies
    if (!this.isAuthenticated) {
      const sessionUserId = sessionStorage.getItem('userId');
      const sessionUserRole = sessionStorage.getItem('userRole');
      if (sessionUserId) {
        this.currentUserId = sessionUserId;
        this.userRole = sessionUserRole || 'user';
        this.isAuthenticated = true;
      }
    }
  }

  /**
   * Initialize the notification UI components
   */
  initializeUI() {
    const container = document.querySelector('.notification-container');
    if (!container) {
      this.createNotificationContainer();
    }
  }

  /**
   * Create the notification container HTML
   */
  createNotificationContainer() {
    const header = document.querySelector('header') || document.querySelector('.header') || document.body;
    
    const notificationHTML = `
      <div class="notification-container">
        <button class="notification-bell" id="notification-bell" aria-label="Notifications">
          <svg class="notification-bell-icon" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notification-badge" id="notification-badge">0</span>
        </button>
        
        <div class="notification-dropdown" id="notification-dropdown">
          <div class="notification-header">
            <h3 class="notification-title">Notifications</h3>
            <div class="notification-actions">
              <button class="mark-all-read-btn" id="mark-all-read-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9,11 12,14 22,4"></polyline>
                  <path d="M21,12c0,4.97-4.03,9-9,9s-9-4.03-9-9s4.03-9,9-9c1.84,0,3.55,0.56,4.96,1.51"></path>
                </svg>
                Mark all read
              </button>
              <button class="close-dropdown-btn" id="close-dropdown-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="notification-list" id="notification-list">
            <div class="notification-loading">Loading notifications...</div>
          </div>
          
          <div class="notification-footer" id="notification-footer" style="display: none;">
            <a href="/notifications" class="view-all-btn">View all notifications</a>
          </div>
        </div>
      </div>
    `;
    
    header.insertAdjacentHTML('beforeend', notificationHTML);
  }

  /**
   * Initialize Socket.IO connection for real-time notifications
   */
  initializeSocket() {
    if (typeof io === 'undefined') {
      console.warn('Socket.IO not loaded, notifications will work in polling mode only');
      return;
    }

    try {
      this.socket = io();
      
      this.socket.on('connect', () => {
        console.log('Connected to notification service');
        
        // Authenticate the socket connection
        this.socket.emit('authenticate', {
          userId: this.currentUserId,
          userRole: this.userRole
        });
      });

      this.socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data.message);
      });

      this.socket.on('newNotification', (notification) => {
        this.handleNewNotification(notification);
      });

      this.socket.on('notificationRead', (data) => {
        this.handleNotificationRead(data.notificationId);
      });

      this.socket.on('allNotificationsRead', () => {
        this.handleAllNotificationsRead();
      });

      this.socket.on('notificationDeleted', (data) => {
        this.handleNotificationDeleted(data.notificationId);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from notification service');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  /**
   * Set up event listeners for notification interactions
   */
  setupEventListeners() {
    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');
    const closeBtn = document.getElementById('close-dropdown-btn');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');

    if (bell) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdown();
      });
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.markAllAsRead();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.notification-container')) {
        this.closeDropdown();
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
      }
    });
  }

  /**
   * Toggle notification dropdown
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open notification dropdown
   */
  openDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.add('show');
      this.isOpen = true;
      
      // Refresh notifications when opening
      this.loadNotifications();
    }
  }

  /**
   * Close notification dropdown
   */
  closeDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
      this.isOpen = false;
    }
  }

  /**
   * Load notifications from the server
   */
  async loadNotifications() {
    try {
      const response = await fetch('/api/notifications?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.notifications = result.data.notifications;
          this.unreadCount = result.data.unreadCount;
          this.updateUI();
          this.lastFetchTime = Date.now();
        }
      } else {
        console.error('Failed to load notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.showError('Failed to load notifications');
    }
  }

  /**
   * Refresh notifications (lighter version for periodic updates)
   */
  async refreshNotifications() {
    if (!this.isAuthenticated) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.unreadCount !== this.unreadCount) {
          // Only refresh full list if unread count changed
          this.loadNotifications();
        }
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }

  /**
   * Handle new notification from socket
   */
  handleNewNotification(notification) {
    // Add to the beginning of the list
    this.notifications.unshift(notification);
    this.unreadCount++;
    
    // Limit the list size
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    this.updateUI();
    this.showNotificationToast(notification);
  }

  /**
   * Handle notification marked as read
   */
  handleNotificationRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateUI();
    }
  }

  /**
   * Handle all notifications marked as read
   */
  handleAllNotificationsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    this.updateUI();
  }

  /**
   * Handle notification deleted
   */
  handleNotificationDeleted(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (!notification.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications.splice(index, 1);
      this.updateUI();
    }
  }

  /**
   * Update the UI with current notification data
   */
  updateUI() {
    this.updateBadge();
    this.updateNotificationList();
  }

  /**
   * Update the notification badge
   */
  updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
        badge.classList.remove('empty');
      } else {
        badge.textContent = '0';
        badge.classList.add('empty');
      }
    }
  }

  /**
   * Update the notification list in the dropdown
   */
  updateNotificationList() {
    const list = document.getElementById('notification-list');
    const footer = document.getElementById('notification-footer');
    
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = '<div class="notification-empty">No notifications yet</div>';
      if (footer) footer.style.display = 'none';
      return;
    }

    // Generate notification HTML
    const notificationsHTML = this.notifications.map(notification => 
      this.createNotificationHTML(notification)
    ).join('');

    list.innerHTML = notificationsHTML;

    // Show footer if there are more notifications
    if (footer && this.notifications.length >= 10) {
      footer.style.display = 'block';
    }

    // Add event listeners to notification items
    this.attachNotificationListeners();
  }

  /**
   * Create HTML for a single notification
   */
  createNotificationHTML(notification) {
    const isUnread = !notification.isRead;
    const timeAgo = this.formatTimeAgo(new Date(notification.createdAt));
    const icon = this.getNotificationIcon(notification.type);
    const priorityClass = `priority-${notification.priority}`;
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''} ${priorityClass}" 
           data-id="${notification.id}" 
           data-type="${notification.type}"
           data-url="${notification.actionUrl || ''}">
        <div class="notification-icon ${notification.type}">
          ${icon}
        </div>
        <div class="notification-content">
          <h4 class="notification-item-title">${this.escapeHtml(notification.title)}</h4>
          <p class="notification-item-message">${this.escapeHtml(notification.message)}</p>
          <div class="notification-meta">
            <span class="notification-time">${timeAgo}</span>
            ${notification.sender ? `<span class="notification-sender">from ${this.escapeHtml(notification.sender.name)}</span>` : ''}
          </div>
        </div>
        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
        <button class="notification-delete-btn" data-id="${notification.id}" title="Delete notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Get icon for notification type
   */
  getNotificationIcon(type) {
    const icons = {
      'service_created': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
      'service_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'service_rejected': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      'service_completed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'approval_created': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>',
      'approval_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22,4 12,14.01 9,11.01"></polyline></svg>',
      'approval_rejected': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      'approval_revision': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      'new_message': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      'system': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    };
    
    return icons[type] || icons['system'];
  }

  /**
   * Attach event listeners to notification items
   */
  attachNotificationListeners() {
    const items = document.querySelectorAll('.notification-item');
    items.forEach(item => {
      // Click to mark as read and navigate
      item.addEventListener('click', (e) => {
        if (e.target.closest('.notification-delete-btn')) return;
        
        const id = item.dataset.id;
        const url = item.dataset.url;
        const type = item.dataset.type;
        
        console.log('🔔 Notification clicked:', { id, url, type });
        
        // Mark as read if unread
        if (item.classList.contains('unread')) {
          this.markAsRead(id);
        }
        
        // Handle navigation based on URL type
        if (url && url !== 'undefined') {
          console.log('🔗 Handling notification navigation with URL:', url);
          this.closeDropdown();
          this.handleNotificationNavigation(url, type);
        } else {
          console.warn('⚠️ No valid URL found for notification:', { id, url, type });
        }
      });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.notification-delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteNotification(id);
      });
    });
  }

  /**
   * Handle notification navigation - opens modals or navigates to pages
   */
  handleNotificationNavigation(url, type) {
    console.log('🚀 Starting notification navigation:', { url, type });
    
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);
      
      console.log('📝 URL parameters:', Object.fromEntries(params.entries()));
      console.log('🗺️ Current path:', window.location.pathname, 'Target path:', urlObj.pathname);
      
      // Check if this is a modal-opening URL
      if (params.has('modal') && params.has('requestId')) {
        const requestId = params.get('requestId');
        const requestType = params.get('type');
        
        console.log('📋 Regular modal detected:', { requestId, requestType });
        
        // Check if we're on the correct page for this request type
        const currentPath = window.location.pathname;
        const targetPath = urlObj.pathname;
        
        if (currentPath === targetPath) {
          // We're on the right page, try to open modal
          console.log('✅ On correct page, opening modal...');
          this.openRequestModal(requestId, requestType);
        } else {
          // Navigate to the correct page with modal parameters
          console.log('🔄 Navigating to correct page:', url);
          window.location.href = url;
        }
      } else if (params.has('conversation') && params.has('requestId')) {
        // Handle conversation modal opening (for message notifications)
        const requestId = params.get('requestId');
        const requestType = params.get('type');
        
        console.log('💬 Conversation modal detected:', { requestId, requestType });
        
        // Check if we're on the correct page for this request type
        const currentPath = window.location.pathname;
        const targetPath = urlObj.pathname;
        
        if (currentPath === targetPath) {
          // We're on the right page, try to open conversation modal
          console.log('✅ On correct page, opening conversation modal...');
          this.openConversationModal(requestId, requestType);
        } else {
          // Navigate to the correct page with conversation parameters
          console.log('🔄 Navigating to correct page for conversation:', url);
          window.location.href = url;
        }
      } else {
        // Regular navigation
        console.log('🔗 Regular navigation to:', url);
        window.location.href = url;
      }
    } catch (error) {
      console.error('❌ Error handling notification navigation:', error);
      // Fallback to regular navigation
      window.location.href = url;
    }
  }

  /**
   * Open request detail modal based on request type
   */
  openRequestModal(requestId, requestType) {
    if (requestType === 'approval') {
      this.openApprovalModal(requestId);
    } else if (requestType === 'service') {
      this.openServiceModal(requestId);
    } else {
      console.warn('Unknown request type for modal:', requestType);
    }
  }

  /**
   * Open conversation modal for message notifications
   */
  openConversationModal(requestId, requestType) {
    console.log('💬 OpenConversationModal called with:', { requestId, requestType });
    
    try {
      // Check if global conversation modal function exists
      if (typeof window.openConversationModal === 'function') {
        console.log('✅ Global openConversationModal function found, calling it...');
        window.openConversationModal(requestId, requestType);
      } else {
        console.warn('⚠️ Global openConversationModal function not found, falling back to regular modal');
        console.log('🔍 Available global functions:', Object.keys(window).filter(key => key.includes('open') || key.includes('modal')));
        // Fallback to regular modal opening
        this.openRequestModal(requestId, requestType);
      }
    } catch (error) {
      console.error('❌ Error opening conversation modal:', error);
      // Fallback to regular modal
      this.openRequestModal(requestId, requestType);
    }
  }

  /**
   * Open approval request modal
   */
  async openApprovalModal(requestId) {
    try {
      // Check if we're on a page that has approval modal functionality
      if (typeof window.openRequestModal === 'function') {
        // Use existing modal function if available
        window.openRequestModal(requestId, 'approval');
      } else if (typeof window.showApprovalDetails === 'function') {
        // Alternative function name
        window.showApprovalDetails(requestId);
      } else {
        // Fallback: navigate to the approval page with the request highlighted
        window.location.href = `/request-approvals?highlight=${requestId}`;
      }
    } catch (error) {
      console.error('Error opening approval modal:', error);
      // Fallback navigation
      window.location.href = `/request-approvals?highlight=${requestId}`;
    }
  }

  /**
   * Open service request modal
   */
  async openServiceModal(requestId) {
    try {
      // Check if we're on a page that has service modal functionality
      if (typeof window.openRequestModal === 'function') {
        // Use existing modal function if available
        window.openRequestModal(requestId, 'service');
      } else if (typeof window.showServiceDetails === 'function') {
        // Alternative function name
        window.showServiceDetails(requestId);
      } else {
        // Fallback: navigate to the service page with the request highlighted
        window.location.href = `/service-requests?highlight=${requestId}`;
      }
    } catch (error) {
      console.error('Error opening service modal:', error);
      // Fallback navigation
      window.location.href = `/service-requests?highlight=${requestId}`;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Update will be handled by socket event or local state
        this.handleNotificationRead(notificationId);
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        this.handleAllNotificationsRead();
        this.showSuccessMessage('All notifications marked as read');
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        this.handleNotificationDeleted(notificationId);
      } else {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Show a toast notification for new notifications
   */
  showNotificationToast(notification) {
    // Check if browser supports notifications and user has granted permission
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // Adjust path as needed
        tag: notification.id
      });
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    // You can implement a toast/banner system here
    console.log('Success:', message);
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Error:', message);
  }

  /**
   * Format time ago string
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  /**
   * Destroy the notification system
   */
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Remove event listeners
    const container = document.querySelector('.notification-container');
    if (container) {
      container.remove();
    }
  }
}

// Initialize notification system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem = new NotificationSystem();
  
  // Request notification permission on first interaction
  document.addEventListener('click', () => {
    window.notificationSystem.requestNotificationPermission();
  }, { once: true });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}