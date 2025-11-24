// ===== Messaging Socket Handler =====
// Real-time messaging with Socket.IO for live updates, typing indicators, and read receipts

class MessagingSocketHandler {
  constructor() {
    this.socket = null;
    this.currentConversationId = null;
    this.typingTimeout = null;
    this.isTyping = false;
  }

  /**
   * Initialize socket connection
   */
  initialize() {
    // Connect to Socket.IO server
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Messaging] Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[Messaging] Socket disconnected');
    });

    // Listen for new messages
    this.socket.on('newMessage', (data) => {
      console.log('[Messaging] New message received:', data);
      this.handleNewMessage(data);
    });

    // Listen for message edits
    this.socket.on('messageEdited', (data) => {
      console.log('[Messaging] Message edited:', data);
      this.handleMessageEdited(data);
    });

    // Listen for message deletions
    this.socket.on('messageDeleted', (data) => {
      console.log('[Messaging] Message deleted:', data);
      this.handleMessageDeleted(data);
    });

    // Listen for typing indicators
    this.socket.on('userTyping', (data) => {
      console.log('[Messaging] Typing indicator:', data);
      this.handleTypingIndicator(data);
    });

    // Listen for read receipts
    this.socket.on('messageRead', (data) => {
      console.log('[Messaging] Message read:', data);
      this.handleMessageRead(data);
    });

    // Listen for online status
    this.socket.on('userStatusChanged', (data) => {
      console.log('[Messaging] User status changed:', data);
      this.handleUserStatusChanged(data);
    });

    // Listen for user online events
    this.socket.on('userOnline', (data) => {
      console.log('[Messaging] User online:', data);
      this.handleUserOnline(data);
    });

    // Listen for user offline events
    this.socket.on('userOffline', (data) => {
      console.log('[Messaging] User offline:', data);
      this.handleUserOffline(data);
    });

    // Listen for presence updates
    this.socket.on('presenceUpdate', (data) => {
      console.log('[Messaging] Presence update:', data);
      this.handlePresenceUpdate(data);
    });
  }

  /**
   * Join a conversation room
   * @param {String} conversationId - Conversation ID to join
   */
  joinConversation(conversationId) {
    if (!this.socket) return;

    this.currentConversationId = conversationId;
    this.socket.emit('joinConversation', { conversationId });
    console.log(`[Messaging] Joined conversation: ${conversationId}`);
  }

  /**
   * Leave a conversation room
   * @param {String} conversationId - Conversation ID to leave
   */
  leaveConversation(conversationId) {
    if (!this.socket) return;

    this.currentConversationId = null;
    this.socket.emit('leaveConversation', { conversationId });
    console.log(`[Messaging] Left conversation: ${conversationId}`);
  }

  /**
   * Emit typing indicator
   * @param {String} userName - Name of user typing
   */
  emitTypingIndicator(userName) {
    if (!this.socket || !this.currentConversationId) return;

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (!this.isTyping) {
      this.socket.emit('typing', {
        conversationId: this.currentConversationId,
        userName: userName,
        isTyping: true
      });
      this.isTyping = true;
    }

    // Auto-stop typing after 3 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('typing', {
        conversationId: this.currentConversationId,
        userName: userName,
        isTyping: false
      });
      this.isTyping = false;
    }, 3000);
  }

  /**
   * Stop typing indicator
   * @param {String} userName - Name of user
   */
  stopTyping(userName) {
    if (!this.socket || !this.currentConversationId) return;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.socket.emit('typing', {
      conversationId: this.currentConversationId,
      userName: userName,
      isTyping: false
    });
    this.isTyping = false;
  }

  /**
   * Handle new message from server
   * @param {Object} data - Message data
   */
  handleNewMessage(data) {
    if (data.conversationId !== this.currentConversationId) return;

    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const messageHtml = this.createMessageHTML(data.message, data.senderName);
    messagesContainer.innerHTML += messageHtml;

    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Mark as read
    this.markConversationAsRead(data.conversationId);
  }

  /**
   * Handle edited message
   * @param {Object} data - Edit data
   */
  handleMessageEdited(data) {
    if (data.conversationId !== this.currentConversationId) return;

    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (!messageElement) return;

    const contentElement = messageElement.querySelector('.message-content');
    if (contentElement) {
      contentElement.textContent = data.content;
      messageElement.classList.add('edited');
      
      // Show edited indicator
      const editedLabel = messageElement.querySelector('.edited-label');
      if (editedLabel) {
        editedLabel.style.display = 'inline';
      }
    }
  }

  /**
   * Handle deleted message
   * @param {Object} data - Delete data
   */
  handleMessageDeleted(data) {
    if (data.conversationId !== this.currentConversationId) return;

    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (!messageElement) return;

    const contentElement = messageElement.querySelector('.message-content');
    if (contentElement) {
      contentElement.textContent = '[Message deleted]';
      contentElement.style.fontStyle = 'italic';
      contentElement.style.opacity = '0.6';
      messageElement.classList.add('deleted');
    }
  }

  /**
   * Handle typing indicator
   * @param {Object} data - Typing data
   */
  handleTypingIndicator(data) {
    if (data.conversationId !== this.currentConversationId) return;

    const typingIndicator = document.getElementById('typingIndicator');
    if (!typingIndicator) return;

    if (data.isTyping) {
      typingIndicator.style.display = 'block';
      typingIndicator.textContent = `${data.userName} is typing...`;
    } else {
      typingIndicator.style.display = 'none';
    }
  }

  /**
   * Handle message read receipt
   * @param {Object} data - Read receipt data
   */
  handleMessageRead(data) {
    if (data.conversationId !== this.currentConversationId) return;

    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (!messageElement) return;

    const readReceipt = messageElement.querySelector('.read-receipt');
    if (readReceipt) {
      readReceipt.style.display = 'inline';
      readReceipt.textContent = '✓✓'; // Double check mark for read
    }
  }

  /**
   * Handle user online status change
   * @param {Object} data - Status data
   */
  handleUserStatusChanged(data) {
    const userElement = document.querySelector(`[data-user-id="${data.userId}"]`);
    if (!userElement) return;

    const statusIndicator = userElement.querySelector('.status-indicator');
    if (!statusIndicator) return;

    if (data.isOnline) {
      statusIndicator.classList.add('online');
      statusIndicator.classList.remove('offline');
      statusIndicator.title = 'Online';
    } else {
      statusIndicator.classList.remove('online');
      statusIndicator.classList.add('offline');
      statusIndicator.title = 'Offline';
    }
  }

  /**
   * Create HTML for a message
   * @param {Object} message - Message object
   * @param {String} senderName - Sender name
   * @returns {String} HTML string
   */
  createMessageHTML(message, senderName) {
    const isOwn = message.senderId === document.querySelector('[data-user-id]')?.dataset.userId;
    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    return `
      <div class="message-item" data-message-id="${message._id}" 
           style="display: flex; ${isOwn ? 'justify-content: flex-end' : 'justify-content: flex-start'}; margin-bottom: 12px;">
        <div style="max-width: 60%; padding: 10px 14px; border-radius: 8px; 
                    ${isOwn ? 'background: #007bff; color: white;' : 'background: #e0e0e0; color: #333;'}">
          ${!isOwn ? `<small style="display: block; margin-bottom: 4px; font-weight: 600;">${senderName}</small>` : ''}
          <div class="message-content">${escapeHtml(message.content)}</div>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
            <small style="opacity: 0.7; font-size: 11px;">${timestamp}</small>
            ${isOwn ? `<span class="read-receipt" style="display: none; font-size: 10px;">✓</span>` : ''}
            ${message.editedAt ? `<small class="edited-label" style="opacity: 0.7; font-size: 10px;">(edited)</small>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Mark conversation as read
   * @param {String} conversationId - Conversation ID
   */
  markConversationAsRead(conversationId) {
    fetch(`/messages/${conversationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('[Messaging] Error marking as read:', err));
  }

  /**
   * Handle user online event
   * @param {Object} data - Event data with userId, userName, lastSeen
   */
  handleUserOnline(data) {
    const { userId, userName } = data;
    const userElement = document.querySelector(`[data-user-id="${userId}"]`);
    
    if (userElement) {
      // Update online status indicator
      let statusDot = userElement.querySelector('.status-indicator');
      if (!statusDot) {
        statusDot = document.createElement('span');
        statusDot.className = 'status-indicator online';
        statusDot.title = `${userName} is online`;
        userElement.appendChild(statusDot);
      } else {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
      }
      
      // Update last seen text
      const lastSeenEl = userElement.querySelector('.last-seen');
      if (lastSeenEl) {
        lastSeenEl.textContent = 'Online now';
        lastSeenEl.classList.add('online');
      }
    }
  }

  /**
   * Handle user offline event
   * @param {Object} data - Event data with userId, userName, lastSeen
   */
  handleUserOffline(data) {
    const { userId, userName, lastSeen } = data;
    const userElement = document.querySelector(`[data-user-id="${userId}"]`);
    
    if (userElement) {
      // Update online status indicator
      let statusDot = userElement.querySelector('.status-indicator');
      if (!statusDot) {
        statusDot = document.createElement('span');
        statusDot.className = 'status-indicator offline';
        statusDot.title = `${userName} is offline`;
        userElement.appendChild(statusDot);
      } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
      }
      
      // Update last seen text
      const lastSeenEl = userElement.querySelector('.last-seen');
      if (lastSeenEl && lastSeen) {
        const time = new Date(lastSeen);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastSeenEl.textContent = `Last seen at ${timeStr}`;
        lastSeenEl.classList.remove('online');
      }
    }
  }

  /**
   * Handle presence update for all users in conversation
   * @param {Object} data - Event data with presence map
   */
  handlePresenceUpdate(data) {
    const { presence } = data;
    
    // Update each user's presence
    Object.entries(presence).forEach(([userId, presenceData]) => {
      const userElement = document.querySelector(`[data-user-id="${userId}"]`);
      if (userElement) {
        const statusDot = userElement.querySelector('.status-indicator');
        if (presenceData.isOnline) {
          if (statusDot) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
          }
          const lastSeenEl = userElement.querySelector('.last-seen');
          if (lastSeenEl) {
            lastSeenEl.textContent = 'Online now';
            lastSeenEl.classList.add('online');
          }
        }
      }
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {String} text - Text to escape
 * @returns {String} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on page load
let messagingSocket = null;

document.addEventListener('DOMContentLoaded', () => {
  messagingSocket = new MessagingSocketHandler();
  messagingSocket.initialize();

  // Add typing event listener to message input
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      const userName = document.querySelector('[data-user-name]')?.dataset.userName || 'User';
      messagingSocket.emitTypingIndicator(userName);
    });

    messageInput.addEventListener('blur', () => {
      const userName = document.querySelector('[data-user-name]')?.dataset.userName || 'User';
      messagingSocket.stopTyping(userName);
    });
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (messagingSocket) {
    messagingSocket.disconnect();
  }
});
