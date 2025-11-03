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
        const { userId, userRole } = data;
        if (userId) {
          socket.userId = userId;
          socket.userRole = userRole;
          this.users.set(userId.toString(), socket.id);
          
          // Track admin sockets
          if (userRole === 'admin') {
            this.adminSockets.add(socket.id);
          }
          
          console.log(`User ${userId} (${userRole}) authenticated with socket ${socket.id}`);
          
          // Send authentication confirmation
          socket.emit('authenticated', { 
            success: true, 
            message: 'Connected to notification service' 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          console.log(`User ${socket.userId} disconnected`);
          this.users.delete(socket.userId.toString());
          this.adminSockets.delete(socket.id);
        }
      });

      // Handle marking notifications as read
      socket.on('markNotificationRead', (notificationId) => {
        // This could trigger database update if needed
        console.log(`Notification ${notificationId} marked as read by user ${socket.userId}`);
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
    const socketId = this.users.get(userId.toString());
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      console.log(`Notification sent to user ${userId}: ${event}`);
      return true;
    }
    console.log(`User ${userId} not connected - notification queued in database`);
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
}

// Export singleton instance
module.exports = new SocketService();