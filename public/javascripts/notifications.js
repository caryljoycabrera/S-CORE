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
      
      // Ensure bell starts in correct state (no white background initially)
      this.ensureCorrectBellState();
      
      // Set up periodic refresh for offline notifications
      setInterval(() => this.refreshNotifications(), 30000); // Every 30 seconds
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
      console.log('🔔 Initialized bell in default state (filled dark icon, no white background)');
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
    // Handle both _id (from MongoDB) and id fields
    const notification = this.notifications.find(n => {
      const nId = (n._id || n.id).toString();
      return nId === notificationId.toString();
    });
    
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      console.log('📉 Decreased unread count to:', this.unreadCount);
      this.updateUI();
    } else if (!notification) {
      console.warn('⚠️ Notification not found:', notificationId);
    } else {
      console.log('ℹ️ Notification was already read:', notificationId);
    }
  }

  /**
   * Handle all notifications marked as read
   */
  handleAllNotificationsRead() {
    console.log('📖 Marking all notifications as read');
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    console.log('✅ All notifications marked as read, count now:', this.unreadCount);
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
    
    console.log('🔄 Updating badge with unread count:', this.unreadCount);
    
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
        
        console.log('✅ Added white background to bell (has-notifications class)');
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
        
        console.log('✅ FORCED removal of white background from bell (back to filled dark icon)');
        console.log('   - Class removed:', !bell.classList.contains('has-notifications'));
        console.log('   - Background:', bell.style.backgroundColor);
        console.log('   - Icon fill:', bellIcon.style.fill);
      }
    } else {
      if (!badge) console.warn('⚠️ Badge element not found');
      if (!bell) console.warn('⚠️ Bell element not found');
      if (!bellIcon) console.warn('⚠️ Bell icon element not found');
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
    const showSender = notification.sender && notification.type !== 'user_approved';
    
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
          <p class="notification-item-message">${this.processNotificationMessage(notification.message, notification.type)}</p>
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
        </button>` : ''}
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
      'user_registered': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
      'user_approved': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17,11 19,13 23,9"></polyline></svg>',
      'user_denied': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>',
      'new_message': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      'announcement': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
      'system': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    };
    
    return icons[type] || icons['system'];
  }

  /**
   * Process notification message - detect attachments and format appropriately
   */
  processNotificationMessage(message, type) {
    // For announcements, detect attachment types
    if (type === 'announcement') {
      const hasImages = /<img\s/i.test(message);
      const hasFileLinks = /<a\s[^>]*href="\/uploads\/[^>]*>📎/i.test(message);
      
      if (hasImages && hasFileLinks) {
        return '📎 File Attachment & 🖼️ Image Attachment';
      } else if (hasImages) {
        return '🖼️ Image Attachment';
      } else if (hasFileLinks) {
        return '📎 File Attachment';
      } else {
        // Strip HTML tags for regular text content
        return message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      }
    }
    
    // For other notification types, escape HTML normally
    return this.escapeHtml(message);
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
        
        console.log('🔔 Notification clicked:', { id, url, type });
        
        // Mark as read if unread - ALWAYS mark as read when clicking
        if (item.classList.contains('unread')) {
          console.log('📖 Marking notification as read:', id);
          await this.markAsRead(id);
          // Update UI immediately for better UX
          item.classList.remove('unread');
          const unreadIndicator = item.querySelector('.unread-indicator');
          if (unreadIndicator) {
            unreadIndicator.remove();
          }
        }
        
        // Handle announcement notifications specially - open announcement modal
        if (type === 'announcement') {
          console.log('📢 Announcement notification clicked - opening modal');
          this.closeDropdown();
          // Get the announcement ID from the notification's relatedId
          const announcement = this.notifications.find(n => (n._id || n.id) === id);
          if (announcement && announcement.relatedId) {
            console.log('📂 Opening announcement modal with ID:', announcement.relatedId);
            this.openAnnouncementModalFromNotification(announcement.relatedId);
          } else {
            console.warn('⚠️ Could not find announcement ID for notification:', id);
          }
          return;
        }
        
        // Handle navigation based on URL type for other notifications
        if (url && url !== 'undefined' && url !== '') {
          console.log('🔗 Handling notification navigation with URL:', url);
          this.closeDropdown();
          this.handleNotificationNavigation(url, type);
        } else {
          console.warn('⚠️ No valid URL found for notification:', { id, url, type });
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
          console.error('This notification cannot be deleted (system notification)');
          return;
        }
        
        this.deleteNotification(id);
      });
    });
  }

  /**
   * Open announcement modal from notification click
   */
  openAnnouncementModalFromNotification(announcementId) {
    console.log('🎯 openAnnouncementModalFromNotification called with ID:', announcementId);
    
    // Call the openAnnouncementDetail function from the page if it exists
    if (typeof openAnnouncementDetail === 'function') {
      console.log('✅ Calling openAnnouncementDetail function');
      openAnnouncementDetail(announcementId);
    } else {
      console.warn('⚠️ openAnnouncementDetail function not found on page');
      // Fallback: try to call it on window for unit users
      if (window.openAnnouncementDetail && typeof window.openAnnounce === 'function') {
        console.log('✅ Using window.openAnnouncementDetail');
        window.openAnnouncementDetail(announcementId);
      }
    }
  }

  /**
   * Rewrite notification URL based on user role
   * Ensures notifications redirect to the correct role-specific pages
   */
  rewriteUrlForRole(url) {
    if (!url || !this.userRole) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      const params = urlObj.searchParams;
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
   * Handle notification navigation - opens modals or navigates to pages
   */
  handleNotificationNavigation(url, type) {
    console.log('🚀 Starting notification navigation:', { url, type, userRole: this.userRole });
    
    // Rewrite URL based on user role to ensure navigation to correct role-specific page
    url = this.rewriteUrlForRole(url);
    console.log('🔄 URL after role rewrite:', url);
    
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);
      
      console.log('📝 URL parameters:', Object.fromEntries(params.entries()));
      console.log('🗺️ Current path:', window.location.pathname, 'Target path:', urlObj.pathname);
      
      // Check if this is an onboarding/welcome notification
      if (url.includes('/onboarding') || urlObj.pathname === '/onboarding' || type === 'unit_approved' || type === 'user_approved' ||
          (this.userRole === 'unit' && (url.includes('/guide') || urlObj.pathname.includes('/guide')))) {
        console.log('🎓 Onboarding/guide notification clicked:', { type, url, userRole: this.userRole });
        this.closeDropdown();

        // Handle unit onboarding/guide notifications specially
        if (type === 'unit_approved' || (this.userRole === 'unit' && (url.includes('/guide') || urlObj.pathname.includes('/guide')))) {
          console.log('🏢 Unit onboarding/guide notification detected');
          if (window.unitNotificationSystem && typeof window.unitNotificationSystem.showOnboardingModal === 'function') {
            console.log('✅ Using unit notification system for onboarding modal');
            window.unitNotificationSystem.showOnboardingModal();
          } else {
            console.log('⚠️ Unit notification system not available, using shared modal');
            this.showOnboardingModal();
          }
          return; // Always prevent navigation for unit onboarding/guide
        }

        // Handle user onboarding notifications
        if (type === 'user_approved') {
          console.log('👤 User onboarding notification detected');
          this.showOnboardingModal();
          return;
        }

        // Handle generic onboarding URLs
        if (url.includes('/onboarding') || urlObj.pathname === '/onboarding') {
          console.log('🔗 Generic onboarding URL detected');
          // Check if this is a unit user
          if (this.userRole === 'unit' && window.unitNotificationSystem) {
            console.log('🏢 Unit user with onboarding URL - using unit modal');
            window.unitNotificationSystem.showOnboardingModal();
          } else {
            console.log('👤 User onboarding URL - using shared modal');
            this.showOnboardingModal();
          }
          return;
        }
      }
      
      // Check if this is a user registration notification (system type with User relatedModel)
      if (type === 'system' && params.has('userId') && urlObj.pathname.includes('/admin/users')) {
        const userId = params.get('userId');
        const tab = params.get('tab') || 'pending';
        const scrollTo = params.get('scrollTo') || null;
        
        console.log('👤 User registration notification detected:', { userId, tab, scrollTo });
        
        const currentPath = window.location.pathname;
        const targetPath = urlObj.pathname;
        
        if (currentPath === targetPath) {
          // We're on the users page, open the modal
          console.log('✅ On users page, opening user modal...');
          this.openUserModal(userId, tab, scrollTo);
        } else {
          // Navigate to users page with userId parameter
          console.log('🔄 Navigating to users page:', url);
          window.location.href = url;
        }
        return;
      }
      
      // Check if this is a user registration notification (legacy check for user_registered type)
      if (type === 'user_registered' && params.has('userId')) {
        const userId = params.get('userId');
        const tab = params.get('tab') || 'pending';
        const scrollTo = params.get('scrollTo') || null;
        
        console.log('👤 User registration notification detected:', { userId, tab, scrollTo });
        
        const currentPath = window.location.pathname;
        const targetPath = urlObj.pathname;
        
        if (currentPath === targetPath) {
          // We're on the users page, open the modal
          console.log('✅ On users page, opening user modal...');
          this.openUserModal(userId, tab, scrollTo);
        } else {
          // Navigate to users page with userId parameter
          console.log('🔄 Navigating to users page:', url);
          window.location.href = url;
        }
        return;
      }
      
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
   * Open user detail modal (for admin user management page)
   */
  openUserModal(userId, tab = 'pending', scrollTo = null) {
    console.log('👤 OpenUserModal called with:', { userId, tab, scrollTo });
    
    try {
      // First, switch to the correct tab if needed
      const tabElement = document.querySelector(`.status-tab[data-status="${tab}"]`);
      if (tabElement) {
        console.log('🔄 Switching to tab:', tab);
        tabElement.click();
        
        // Wait a bit for tab content to load
        setTimeout(() => {
          // Find the user row with the matching ID - use .grid-row instead of tr.user-row
          const userRow = document.querySelector(`.grid-row[data-id="${userId}"]`);
          if (userRow) {
            console.log('✅ Found user row, opening modal');
            // Check if global openUserModal function exists
            if (typeof window.openUserModal === 'function') {
              window.openUserModal(userRow, scrollTo);
            } else {
              // Fallback: trigger click on the row
              userRow.click();
              
              // Handle scroll after modal opens
              if (scrollTo === 'actions') {
                setTimeout(() => {
                  this.scrollToUserActions();
                }, 500);
              }
            }
            
            // Scroll the row into view
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight the row briefly
            userRow.style.backgroundColor = '#fef3c7';
            setTimeout(() => {
              userRow.style.backgroundColor = '';
            }, 2000);
          } else {
            console.warn('⚠️ User row not found with ID:', userId);
          }
        }, 300);
      } else {
        console.warn('⚠️ Tab element not found:', tab);
      }
    } catch (error) {
      console.error('❌ Error opening user modal:', error);
    }
  }

  /**
   * Scroll to the user status actions section in the modal
   */
  scrollToUserActions() {
    console.log('📜 Scrolling to user status actions section');
    
    const modalBody = document.querySelector('.user-details-modal-body');
    const actionsSection = document.querySelector('.user-admin-form-section');
    
    if (modalBody && actionsSection) {
      // Scroll to the actions section
      actionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Highlight the section briefly
      actionsSection.style.backgroundColor = '#fef3c7';
      actionsSection.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        actionsSection.style.backgroundColor = '';
      }, 2000);
      
      console.log('✅ Scrolled to user actions section');
    } else {
      console.warn('⚠️ Could not find modal body or actions section');
    }
  }

  /**
   * Show onboarding modal with system guide
   */
  showOnboardingModal() {
    console.log('🎓 Showing onboarding modal');

    // Get user role from the user data script
    const userDataElement = document.querySelector('#user-data');
    let userRole = 'user'; // default
    if (userDataElement) {
      try {
        const userData = JSON.parse(userDataElement.textContent);
        userRole = userData.role || 'user';
      } catch (e) {
        console.error('Error parsing user data for onboarding:', e);
      }
    }

    const isUnitUser = userRole === 'unit';

    // Create modal HTML based on user role
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
            <h1>${isUnitUser ? 'Welcome to S-CORE Unit Team!' : 'Welcome to S-CORE!'}</h1>
            <p>${isUnitUser ? 'Your unit account has been approved. Let\'s get you started!' : 'Your account has been approved. Let\'s get you started!'}</p>
          </div>

          <div class="onboarding-body">
            ${isUnitUser ? `
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
            ` : `
            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>
              <div class="step-content">
                <h3>Dashboard Overview</h3>
                <p>Your dashboard provides a quick overview of your service requests, approval requests, and important notifications.</p>
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
                <h3>Submit Requests</h3>
                <p>You can submit service requests and approval requests through the navigation menu. Fill out the forms carefully and attach any required files.</p>
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
                <h3>Stay Updated</h3>
                <p>You'll receive notifications when your requests are reviewed, approved, or require revisions. Check the bell icon regularly.</p>
              </div>
            </div>

            <div class="onboarding-step">
              <div class="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div class="step-content">
                <h3>Need Help?</h3>
                <p>Access the complete user guide anytime from the sidebar menu. It contains detailed instructions on all system features.</p>
              </div>
            </div>
            `}
          </div>

          <div class="onboarding-footer">
            <a href="${isUnitUser ? '/unit/guide' : '/user-guide'}" class="btn-secondary">View Full Guide</a>
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
      console.log('📨 Sending mark as read request for notification:', notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Successfully marked notification as read:', notificationId);
        // Update will be handled by socket event or local state
        this.handleNotificationRead(notificationId);
        return true;
      } else {
        console.error('❌ Failed to mark notification as read:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
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
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        console.error('Failed to delete notification:', errorData.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error deleting notification:', error.message || error);
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
   * Mark notification as read by related request ID
   */
  async markNotificationReadByRequestId(requestId, requestType) {
    console.log('🔍 Looking for notification to mark as read:', { requestId, requestType });
    
    // Find notifications related to this request
    const relatedNotifications = this.notifications.filter(n => {
      // Handle both _id (from MongoDB) and id fields
      const notifRelatedId = n.relatedId ? n.relatedId.toString() : null;
      const isRelated = notifRelatedId === requestId.toString();
      const isUnread = !n.isRead;
      
      console.log('Checking notification:', { 
        notifId: n._id || n.id, 
        relatedId: n.relatedId, 
        isRelated, 
        isUnread,
        type: n.type 
      });
      return isRelated && isUnread;
    });
    
    console.log(`Found ${relatedNotifications.length} unread related notifications`);
    
    // Mark all related unread notifications as read
    for (const notification of relatedNotifications) {
      // Use _id if available (from MongoDB), otherwise use id
      const notificationId = notification._id || notification.id;
      console.log('📖 Marking notification as read:', notificationId);
      await this.markAsRead(notificationId);
    }
    
    if (relatedNotifications.length > 0) {
      console.log('✅ Successfully marked notifications as read');
    }
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

    const modal = document.getElementById('notification-modal-overlay');
    if (modal) {
      modal.remove();
    }
    
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Initialize notification system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem = new NotificationSystem();
  
  // Request notification permission on first interaction
  document.addEventListener('click', () => {
    window.notificationSystem.requestNotificationPermission();
  }, { once: true });
  
  // Global function to mark notifications as read when opening a request
  window.markNotificationReadForRequest = async function(requestId, requestType) {
    console.log('🌐 Global function called to mark notification as read:', { requestId, requestType });
    if (window.notificationSystem) {
      await window.notificationSystem.markNotificationReadByRequestId(requestId, requestType);
    } else {
      console.warn('⚠️ Notification system not initialized');
    }
  };
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationSystem;
}
