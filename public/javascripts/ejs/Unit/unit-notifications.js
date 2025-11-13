/**
 * ===== Unit Notification System JavaScript =====
 * Dedicated notification system for unit users to avoid conflicts with user notifications
 * Handles real-time notifications, UI interactions, and onboarding modal for units
 */

class UnitNotificationSystem {
  constructor() {
    this.socket = null;
    this.isOpen = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.lastFetchTime = null;
    this.isAuthenticated = false;
    this.currentUserId = null;
    this.userRole = 'unit';

    this.init();
  }

  /**
   * Initialize the unit notification system
   */
  init() {
    // Check if user is authenticated
    this.checkAuthentication();

    if (this.isAuthenticated) {
      this.initializeUI();
      this.initializeSocket();
      this.loadNotifications();
      this.setupEventListeners();

      // Ensure bell starts in correct state (no white background initially)
      this.ensureCorrectBellState();

      // Set up periodic refresh for offline notifications
      setInterval(() => this.refreshNotifications(), 30000); // Every 30 seconds

      // Check for onboarding notification and show modal immediately
      this.checkForOnboardingNotification();
    }
  }

  /**
   * Check for onboarding notification and show modal immediately
   */
  checkForOnboardingNotification() {
    // Check user data for onboarding flag (passed from server)
    const userDataElement = document.querySelector('#user-data');
    if (userDataElement) {
      try {
        const userData = JSON.parse(userDataElement.textContent);
        if (userData.showOnboarding === true) {
          console.log('🎓 Unit onboarding flag detected, showing modal immediately');
          // Show onboarding modal immediately
          setTimeout(() => {
            this.showOnboardingModal();
          }, 500); // Small delay to ensure page is loaded
          return;
        }
      } catch (e) {
        console.error('Error parsing user data for onboarding:', e);
      }
    }

    // Fallback: Check URL parameters for onboarding trigger
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showOnboarding') === 'true') {
      console.log('🎓 Unit URL onboarding parameter detected, showing modal immediately');
      // Remove the parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Show onboarding modal immediately
      setTimeout(() => {
        this.showOnboardingModal();
      }, 500); // Small delay to ensure page is loaded
    }
  }

  /**
   * Ensure the bell starts in the correct visual state
   */
  ensureCorrectBellState() {
    const bell = document.getElementById('notification-bell');
    const bellIcon = bell ? bell.querySelector('.notification-bell-icon') : null;

    if (bell && bellIcon) {
      // Force default state on page load - no white background
      bell.classList.remove('has-notifications');
      bell.style.backgroundColor = 'transparent';
      bell.style.boxShadow = 'none';
      bellIcon.style.fill = '#374151';
      bellIcon.style.stroke = '#374151';
      console.log('🔔 Unit bell initialized in default state');
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
        this.userRole = userData.role || 'unit';
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
        this.userRole = sessionUserRole || 'unit';
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
        console.log('Unit connected to notification service');

        // Authenticate the socket connection
        this.socket.emit('authenticate', {
          userId: this.currentUserId,
          userRole: this.userRole
        });
      });

      this.socket.on('authenticated', (data) => {
        console.log('Unit socket authenticated:', data.message);
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
        console.log('Unit disconnected from notification service');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Unit socket connection error:', error);
      });
    } catch (error) {
      console.error('Error initializing unit socket:', error);
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
        console.error('Failed to load unit notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading unit notifications:', error);
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
      console.error('Error refreshing unit notifications:', error);
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
    // Handle both _id (from MongoDB) and id fields
    const notification = this.notifications.find(n => {
      const nId = (n._id || n.id).toString();
      return nId === notificationId.toString();
    });

    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      console.log('📉 Unit unread count decreased to:', this.unreadCount);
      this.updateUI();
    } else if (!notification) {
      console.warn('⚠️ Unit notification not found:', notificationId);
    } else {
      console.log('ℹ️ Unit notification was already read:', notificationId);
    }
  }

  /**
   * Handle all notifications marked as read
   */
  handleAllNotificationsRead() {
    console.log('📖 Unit marking all notifications as read');
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    console.log('✅ Unit all notifications marked as read, count now:', this.unreadCount);
    this.updateUI();
  }

  /**
   * Handle notification deleted
   */
  handleNotificationDeleted(notificationId) {
    // Handle both _id (from MongoDB) and id fields
    const index = this.notifications.findIndex(n => {
      const nId = (n._id || n.id).toString();
      return nId === notificationId.toString();
    });

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
    const bell = document.getElementById('notification-bell');
    const bellIcon = bell ? bell.querySelector('.notification-bell-icon') : null;

    console.log('🔄 Unit updating badge with unread count:', this.unreadCount);

    if (badge && bell && bellIcon) {
      if (this.unreadCount > 0) {
        // Show badge with count
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
        badge.classList.remove('empty');
        badge.style.display = 'flex';

        // Add white background circle to bell when there are notifications
        bell.classList.add('has-notifications');
        // Remove inline styles to let CSS take over
        bell.style.removeProperty('background-color');
        bell.style.removeProperty('box-shadow');

        // Let CSS handle icon style (no fill)
        bellIcon.style.removeProperty('fill');
        bellIcon.style.removeProperty('stroke');

        console.log('✅ Unit added white background to bell (has-notifications class)');
      } else {
        // Hide badge
        badge.textContent = '0';
        badge.classList.add('empty');
        badge.style.display = 'none';

        // FORCE remove white background from bell - back to transparent filled icon
        bell.classList.remove('has-notifications');
        bell.style.backgroundColor = 'transparent';
        bell.style.boxShadow = 'none';

        // Force the icon to be filled
        bellIcon.style.fill = '#374151';
        bellIcon.style.stroke = '#374151';

        console.log('✅ Unit FORCED removal of white background from bell (back to filled dark icon)');
      }
    } else {
      if (!badge) console.warn('⚠️ Unit badge element not found');
      if (!bell) console.warn('⚠️ Unit bell element not found');
      if (!bellIcon) console.warn('⚠️ Unit bell icon element not found');
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
      // Always show footer with "View all notifications" button even when empty
      if (footer) footer.style.display = 'flex';
      return;
    }

    // Generate notification HTML
    const notificationsHTML = this.notifications.map(notification =>
      this.createNotificationHTML(notification)
    ).join('');

    list.innerHTML = notificationsHTML;

    // Always show footer
    if (footer) {
      footer.style.display = 'flex';
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
    // Handle both _id (from MongoDB) and id fields
    const notifId = notification._id || notification.id;
    const isDeletable = notification.isDeletable !== false; // Default to true if not specified

    // For onboarding/welcome notifications, show only time without sender
    const showSender = notification.sender && notification.type !== 'unit_approved';

    return `
      <div class="notification-item ${isUnread ? 'unread' : ''} ${priorityClass}"
           data-id="${notifId}"
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
            ${showSender ? `<span class="notification-sender">from ${this.escapeHtml(notification.sender.name)}</span>` : ''}
          </div>
        </div>
        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
        ${isDeletable ? `<button class="notification-delete-btn" data-id="${notifId}" title="Delete notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>` : ''}}
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
      'approval_revision': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      'new_message': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      'system': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
      'unit_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17,11 19,13 23,9"></polyline></svg>'
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
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.notification-delete-btn')) return;

        const id = item.dataset.id;
        const url = item.dataset.url;
        const type = item.dataset.type;

        console.log('🔔 Unit notification clicked:', { id, url, type });

        // Mark as read if unread - ALWAYS mark as read when clicking
        if (item.classList.contains('unread')) {
          console.log('📖 Unit marking notification as read:', id);
          await this.markAsRead(id);
          // Update UI immediately for better UX
          item.classList.remove('unread');
          const unreadIndicator = item.querySelector('.unread-indicator');
          if (unreadIndicator) {
            unreadIndicator.remove();
          }
        }

        // Handle navigation based on URL type
        if (url && url !== 'undefined' && url !== '') {
          console.log('🔗 Unit handling notification navigation with URL:', url);
          this.closeDropdown();
          this.handleNotificationNavigation(url, type);
        } else {
          console.warn('⚠️ Unit no valid URL found for notification:', { id, url, type });
          // Still close dropdown even without URL
          this.closeDropdown();
        }
      });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.notification-delete-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;

        // Find the notification to check if it's deletable
        const notification = this.notifications.find(n => (n._id || n.id) === id);

        if (notification && notification.isDeletable === false) {
          console.error('This unit notification cannot be deleted (system notification)');
          return;
        }

        this.deleteNotification(id);
      });
    });
  }

  /**
   * Handle notification navigation - opens modals or navigates to pages
   */
  handleNotificationNavigation(url, type) {
    console.log('🚀 Unit starting notification navigation:', { url, type });

    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);

      console.log('📝 Unit URL parameters:', Object.fromEntries(params.entries()));
      console.log('🗺️ Unit current path:', window.location.pathname, 'Target path:', urlObj.pathname);

      // Check if this is an onboarding/welcome notification - OPEN MODAL IMMEDIATELY
      if (url.includes('/onboarding') || urlObj.pathname === '/onboarding' || type === 'unit_approved') {
        console.log('🎓 Unit onboarding notification clicked - opening modal immediately');
        this.closeDropdown();
        this.showOnboardingModal();
        return;
      }

      // Handle unit-specific navigation
      if (urlObj.pathname.includes('/unit/')) {
        console.log('🏢 Unit navigation to unit page:', url);
        window.location.href = url;
        return;
      }

      // Check if this is a modal-opening URL
      if (params.has('modal') && params.has('requestId')) {
        const requestId = params.get('requestId');
        const requestType = params.get('type');

        console.log('📋 Unit modal detected:', { requestId, requestType });

        // Check if we're on the correct page for this request type
        const currentPath = window.location.pathname;
        const targetPath = urlObj.pathname;

        if (currentPath === targetPath) {
          // We're on the right page, try to open modal
          console.log('✅ Unit on correct page, opening modal...');
          this.openRequestModal(requestId, requestType);
        } else {
          // Navigate to the correct page with modal parameters
          console.log('🔄 Unit navigating to correct page:', url);
          window.location.href = url;
        }
      } else {
        // Regular navigation
        console.log('🔗 Unit regular navigation to:', url);
        window.location.href = url;
      }
    } catch (error) {
      console.error('❌ Unit error handling notification navigation:', error);
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
      console.warn('Unknown request type for unit modal:', requestType);
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
      } else {
        // Fallback: navigate to the approval page with the request highlighted
        window.location.href = `/unit/task-approvals?highlight=${requestId}`;
      }
    } catch (error) {
      console.error('Error opening unit approval modal:', error);
      // Fallback navigation
      window.location.href = `/unit/task-approvals?highlight=${requestId}`;
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
      } else {
        // Fallback: navigate to the service page with the request highlighted
        window.location.href = `/unit/task-services?highlight=${requestId}`;
      }
    } catch (error) {
      console.error('Error opening unit service modal:', error);
      // Fallback navigation
      window.location.href = `/unit/task-services?highlight=${requestId}`;
    }
  }

  /**
   * Show unit onboarding modal with system guide
   */
  showOnboardingModal() {
    console.log('🎓 Unit showing onboarding modal');

    // Create modal HTML for units
    const modalHTML = `
      <div id="onboarding-modal" class="onboarding-modal-overlay">
        <div class="onboarding-modal-content">
          <button class="onboarding-close-btn" id="onboarding-close-btn">&times;</button>

          <div class="onboarding-header">
            <div class="onboarding-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            <h1>Welcome to S-CORE Unit Team!</h1>
            <p>Your unit account has been approved. Let's get you started!</p>
          </div>

          <div class="onboarding-body">
            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <div class="step-content">
                <h3>Unit Dashboard Overview</h3>
                <p>Your dashboard provides a comprehensive view of your unit's tasks, deadlines, analytics, and team performance metrics.</p>
              </div>
            </div>

            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
              </div>
              <div class="step-content">
                <h3>Process Tasks</h3>
                <p>Review approval requests and complete service requests assigned to your unit. Use the task management tools to stay organized.</p>
              </div>
            </div>

            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div class="step-content">
                <h3>Manage Deadlines</h3>
                <p>Monitor task deadlines using the calendar and urgent tasks panel. Communicate with requestors to meet timelines.</p>
              </div>
            </div>

            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div class="step-content">
                <h3>Stay Connected</h3>
                <p>Use the conversation feature for all task-related communication. You'll receive notifications for new assignments and updates.</p>
              </div>
            </div>
          </div>

          <div class="onboarding-footer">
            <a href="/unit/guide" class="btn-secondary">View Full Guide</a>
            <button class="btn-primary" id="onboarding-got-it">Got it, Let's Start!</button>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add event listeners
    const modal = document.getElementById('onboarding-modal');
    const closeBtn = document.getElementById('onboarding-close-btn');
    const gotItBtn = document.getElementById('onboarding-got-it');

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    gotItBtn.addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      console.log('📨 Unit sending mark as read request for notification:', notificationId);

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Unit successfully marked notification as read:', notificationId);
        // Update will be handled by socket event or local state
        this.handleNotificationRead(notificationId);
        return true;
      } else {
        console.error('❌ Unit failed to mark notification as read:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Unit error marking notification as read:', error);
      return false;
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
        console.error('Failed to mark all unit notifications as read');
      }
    } catch (error) {
      console.error('Error marking all unit notifications as read:', error);
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
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        console.error('Failed to delete unit notification:', errorData.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error deleting unit notification:', error.message || error);
      return false;
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
    console.log('Unit success:', message);
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Unit error:', message);
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
   * Mark notification as read by related request ID
   */
  async markNotificationReadByRequestId(requestId, requestType) {
    console.log('🔍 Unit looking for notification to mark as read:', { requestId, requestType });

    // Find notifications related to this request
    const relatedNotifications = this.notifications.filter(n => {
      // Handle both _id (from MongoDB) and id fields
      const notifRelatedId = n.relatedId ? n.relatedId.toString() : null;
      const isRelated = notifRelatedId === requestId.toString();
      const isUnread = !n.isRead;

      console.log('Unit checking notification:', {
        notifId: n._id || n.id,
        relatedId: n.relatedId,
        isRelated, isUnread,
        type: n.type
      });
      return isRelated && isUnread;
    });

    console.log(`Unit found ${relatedNotifications.length} unread related notifications`);

    // Mark all related unread notifications as read
    for (const notification of relatedNotifications) {
      // Use _id if available (from MongoDB), otherwise use id
      const notificationId = notification._id || notification.id;
      console.log('📖 Unit marking notification as read:', notificationId);
      await this.markAsRead(notificationId);
    }

    if (relatedNotifications.length > 0) {
      console.log('✅ Unit successfully marked notifications as read');
    }
  }

  /**
   * Destroy the unit notification system
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

    const modal = document.getElementById('notification-modal-overlay');
    if (modal) {
      modal.remove();
    }

    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Initialize unit notification system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.unitNotificationSystem = new UnitNotificationSystem();

  // Request notification permission on first interaction
  document.addEventListener('click', () => {
    window.unitNotificationSystem.requestNotificationPermission();
  }, { once: true });

  // Global function to mark notifications as read when opening a request
  window.markNotificationReadForRequest = async function(requestId, requestType) {
    console.log('🌐 Unit global function called to mark notification as read:', { requestId, requestType });
    if (window.unitNotificationSystem) {
      await window.unitNotificationSystem.markNotificationReadByRequestId(requestId, requestType);
    } else {
      console.warn('⚠️ Unit notification system not initialized');
    }
  };
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnitNotificationSystem;
}
