// ===== Socket Service =====
// This module handles real-time WebSocket connections using Socket.IO
// Manages user connections and enables real-time notification delivery

const socketIo = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.users = new Map(); // userId -> socketId mapping
    this.adminSockets = new Set(); // Track admin sockets
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: "*", // Configure this based on your frontend URL
        methods: ["GET", "POST"]
      }
    });

    // Handle socket connections
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle user authentication and registration
      socket.on('authenticate', (data) => {
        console.log('🔐 Socket authentication request received:', { 
          socketId: socket.id, 
          userId: data.userId, 
          userRole: data.userRole 
        });
        
        const { userId, userRole } = data;
        if (userId) {
          socket.userId = userId;
          socket.userRole = userRole;
          this.users.set(userId.toString(), socket.id);
          
          // Track admin sockets
          if (userRole === 'admin') {
            this.adminSockets.add(socket.id);
            console.log(`👑 ADMIN socket registered! Socket: ${socket.id}, User: ${userId}`);
            console.log(`👑 Total admin sockets connected: ${this.adminSockets.size}`);
          }
          
          console.log(`✅ User ${userId} (${userRole}) authenticated with socket ${socket.id}`);
          console.log(`📊 Total users connected: ${this.users.size}`);
          console.log(`📊 Total admins connected: ${this.adminSockets.size}`);
          
          // Send authentication confirmation
          socket.emit('authenticated', { 
            success: true, 
            message: 'Connected to notification service' 
          });
        } else {
          console.warn('⚠️ Authentication failed - no userId provided');
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          const wasAdmin = socket.userRole === 'admin';
          console.log(`🔌 User ${socket.userId} (${socket.userRole}) disconnected from socket ${socket.id}`);
          this.users.delete(socket.userId.toString());
          this.adminSockets.delete(socket.id);
          
          if (wasAdmin) {
            console.log(`👑 Admin disconnected. Remaining admins: ${this.adminSockets.size}`);
          }
          console.log(`📊 Total users connected: ${this.users.size}`);
        } else {
          console.log(`🔌 Unauthenticated socket ${socket.id} disconnected`);
        }
      });

      // Handle marking notifications as read
      socket.on('markNotificationRead', (notificationId) => {
        // This could trigger database update if needed
        console.log(`Notification ${notificationId} marked as read by user ${socket.userId}`);
      });

      // ===== Messaging Handlers =====

      // Join conversation room
      socket.on('joinConversation', (data) => {
        const { conversationId } = data;
        socket.join(`conversation-${conversationId}`);
        console.log(`[Socket] User ${socket.userId} joined conversation ${conversationId}`);
        
        // Broadcast user joined event
        socket.to(`conversation-${conversationId}`).emit('userJoinedConversation', {
          conversationId: conversationId,
          userId: socket.userId
        });

        // Emit user online presence
        socket.to(`conversation-${conversationId}`).emit('userOnline', {
          conversationId: conversationId,
          userId: socket.userId,
          timestamp: new Date(),
          lastSeen: null
        });

        // Broadcast updated presence to all users in room
        const presence = this.getConversationPresence(conversationId);
        this.io.to(`conversation-${conversationId}`).emit('presenceUpdate', {
          conversationId: conversationId,
          presence: presence,
          timestamp: new Date()
        });
      });

      // Leave conversation room
      socket.on('leaveConversation', (data) => {
        const { conversationId } = data;
        socket.leave(`conversation-${conversationId}`);
        console.log(`[Socket] User ${socket.userId} left conversation ${conversationId}`);
        
        // Broadcast user left event
        socket.to(`conversation-${conversationId}`).emit('userLeftConversation', {
          conversationId: conversationId,
          userId: socket.userId
        });

        // Emit user offline presence
        socket.to(`conversation-${conversationId}`).emit('userOffline', {
          conversationId: conversationId,
          userId: socket.userId,
          lastSeen: new Date(),
          timestamp: new Date()
        });

        // Broadcast updated presence to all users in room
        const presence = this.getConversationPresence(conversationId);
        this.io.to(`conversation-${conversationId}`).emit('presenceUpdate', {
          conversationId: conversationId,
          presence: presence,
          timestamp: new Date()
        });
      });

      // Handle typing indicator
      socket.on('typing', (data) => {
        const { conversationId, userName, isTyping } = data;
        console.log(`[Socket] ${userName} ${isTyping ? 'started' : 'stopped'} typing in ${conversationId}`);
        
        // Broadcast typing status to conversation participants (except sender)
        socket.to(`conversation-${conversationId}`).emit('userTyping', {
          conversationId: conversationId,
          userId: socket.userId,
          userName: userName,
          isTyping: isTyping,
          timestamp: new Date()
        });
      });
    });

    console.log('Socket.IO service initialized');
  }

  /**
   * Emit notification to a specific user
   * @param {String} userId - Target user ID
   * @param {String} event - Event name
   * @param {Object} data - Notification data
   */
  emitToUser(userId, event, data) {
    console.log('📡 emitToUser called:', { userId, event });
    console.log('🔍 Current connected users:', Array.from(this.users.keys()));
    console.log('🔍 Current admin sockets:', this.adminSockets.size);
    
    const socketId = this.users.get(userId.toString());
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      console.log(`✅ Notification sent to user ${userId}: ${event}`);
      return true;
    }
    console.log(`⚠️ User ${userId} not connected - notification queued in database only`);
    console.log(`   Socket ID found: ${socketId ? 'Yes' : 'No'}`);
    console.log(`   IO initialized: ${this.io ? 'Yes' : 'No'}`);
    return false;
  }

  /**
   * Emit notification to all admin users
   * @param {String} event - Event name
   * @param {Object} data - Notification data
   */
  emitToAdmins(event, data) {
    if (!this.io) return false;
    
    let sentCount = 0;
    this.adminSockets.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
      sentCount++;
    });
    
    console.log(`Notification sent to ${sentCount} admin(s): ${event}`);
    return sentCount > 0;
  }

  /**
   * Emit notification to all connected users
   * @param {String} event - Event name
   * @param {Object} data - Notification data
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`Broadcast notification sent: ${event}`);
      return true;
    }
    return false;
  }

  /**
   * Emit event to all participants in a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emitToConversation(conversationId, event, data) {
    if (this.io) {
      this.io.to(`conversation-${conversationId}`).emit(event, data);
      console.log(`[Socket] Emitted ${event} to conversation ${conversationId}`);
      return true;
    }
    return false;
  }

  /**
   * Join user to conversation room
   * @param {String} socketId - Socket ID
   * @param {String} conversationId - Conversation ID
   */
  joinConversation(socketId, conversationId) {
    if (this.io && this.io.sockets.sockets.has(socketId)) {
      const socket = this.io.sockets.sockets.get(socketId);
      socket.join(`conversation-${conversationId}`);
      console.log(`[Socket] User joined conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  /**
   * Leave user from conversation room
   * @param {String} socketId - Socket ID
   * @param {String} conversationId - Conversation ID
   */
  leaveConversation(socketId, conversationId) {
    if (this.io && this.io.sockets.sockets.has(socketId)) {
      const socket = this.io.sockets.sockets.get(socketId);
      socket.leave(`conversation-${conversationId}`);
      console.log(`[Socket] User left conversation: ${conversationId}`);
      return true;
    }
    return false;
  }

  /**
   * Emit typing indicator to conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} userName - User name
   * @param {Boolean} isTyping - Is typing
   */
  emitTypingIndicator(conversationId, userId, userName, isTyping) {
    if (this.io) {
      this.io.to(`conversation-${conversationId}`).emit('userTyping', {
        conversationId: conversationId,
        userId: userId,
        userName: userName,
        isTyping: isTyping,
        timestamp: new Date()
      });
      console.log(`[Socket] Typing indicator: ${userName} ${isTyping ? 'started' : 'stopped'} typing`);
      return true;
    }
    return false;
  }

  /**
   * Get online user count
   * @returns {Number} Number of connected users
   */
  getOnlineUserCount() {
    return this.users.size;
  }

  /**
   * Get online admin count
   * @returns {Number} Number of connected admins
   */
  getOnlineAdminCount() {
    return this.adminSockets.size;
  }

  /**
   * Check if user is online
   * @param {String} userId - User ID to check
   * @returns {Boolean} True if user is online
   */
  isUserOnline(userId) {
    return this.users.has(userId.toString());
  }

  /**
   * Broadcast user online status to conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID coming online
   * @param {String} userName - User display name
   */
  emitUserOnline(conversationId, userId, userName) {
    if (this.io && conversationId) {
      this.io.to(`conversation-${conversationId}`).emit('userOnline', {
        conversationId: conversationId,
        userId: userId,
        userName: userName,
        timestamp: new Date(),
        lastSeen: null
      });
      console.log(`[Presence] ${userName} is now online in conversation ${conversationId}`);
    }
  }

  /**
   * Broadcast user offline status to conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID going offline
   * @param {String} userName - User display name
   * @param {Date} lastSeen - Last activity timestamp
   */
  emitUserOffline(conversationId, userId, userName, lastSeen) {
    if (this.io && conversationId) {
      this.io.to(`conversation-${conversationId}`).emit('userOffline', {
        conversationId: conversationId,
        userId: userId,
        userName: userName,
        lastSeen: lastSeen || new Date(),
        timestamp: new Date()
      });
      console.log(`[Presence] ${userName} is now offline in conversation ${conversationId}`);
    }
  }

  /**
   * Get presence information for all users in conversation
   * @param {String} conversationId - Conversation ID
   * @returns {Object} User presence data
   */
  getConversationPresence(conversationId) {
    if (!this.io || !conversationId) return {};
    
    const room = this.io.sockets.adapter.rooms.get(`conversation-${conversationId}`);
    const presence = {};
    
    if (room) {
      room.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.userId) {
          presence[socket.userId.toString()] = {
            socketId: socketId,
            isOnline: true,
            lastActivity: new Date()
          };
        }
      });
    }
    
    return presence;
  }

  /**
   * Broadcast presence update to all users in conversation
   * @param {String} conversationId - Conversation ID
   */
  broadcastPresenceUpdate(conversationId) {
    const presence = this.getConversationPresence(conversationId);
    if (this.io && conversationId) {
      this.io.to(`conversation-${conversationId}`).emit('presenceUpdate', {
        conversationId: conversationId,
        presence: presence,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all online users
   * @returns {Array} Array of online user IDs
   */
  getOnlineUsers() {
    return Array.from(this.users.keys());
  }

  /**
   * Get user socket ID
   * @param {String} userId - User ID
   * @returns {String} Socket ID or null
   */
  getUserSocketId(userId) {
    return this.users.get(userId.toString()) || null;
  }
}

// Export singleton instance
module.exports = new SocketService();