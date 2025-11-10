// ===== Notification Service =====
// This module handles all notification-related business logic
// Creates, manages, and delivers notifications for various events in the system

const Notification = require('../models/Notification');
const User = require('../models/User');
const socketService = require('./socketService');

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} data - Notification data
   * @returns {Object} Created notification
   */
  async createNotification(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      
      // Populate sender info for real-time emission
      await notification.populate('sender', 'fName lName role');
      
      // Emit real-time notification if user is online
      const notificationData = {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.createdAt,
        sender: notification.sender ? {
          name: `${notification.sender.fName} ${notification.sender.lName}`,
          role: notification.sender.role
        } : null,
        actionUrl: notification.actionUrl,
        relatedId: notification.relatedId,
        relatedModel: notification.relatedModel
      };
      
      socketService.emitToUser(data.recipient, 'newNotification', notificationData);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Service Request Notifications
   */

  // Notify admins when a new service request is created
  async notifyServiceCreated(serviceId, userId, adminIds = null) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Get all admin users if not provided
      if (!adminIds) {
        const admins = await User.find({ role: 'admin' });
        adminIds = admins.map(admin => admin._id);
      }

      const notificationData = {
        title: 'New Service Request',
        message: `${user.fName} ${user.lName} has submitted a new service request for review`,
        type: 'service_created',
        relatedId: serviceId,
        relatedModel: 'ServiceRequest',
        sender: userId,
        priority: 'medium',
        actionUrl: `/admin/services?modal=true&requestId=${serviceId}&type=service`
      };

      // Create notifications for all admins
      const notifications = adminIds.map(adminId => 
        this.createNotification({ ...notificationData, recipient: adminId })
      );
      
      await Promise.all(notifications);
      console.log(`Service creation notifications sent to ${adminIds.length} admin(s)`);
    } catch (error) {
      console.error('Error notifying service creation:', error);
    }
  }

  // Notify user when their service request is approved
  async notifyServiceApproved(serviceId, userId, adminId, assignedUnits = null) {
    try {
      const message = assignedUnits 
        ? `Your service request has been approved and assigned to: ${assignedUnits}`
        : 'Your service request has been approved';

      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Service Request Approved',
        message: message,
        type: 'service_approved',
        relatedId: serviceId,
        relatedModel: 'ServiceRequest',
        priority: 'high',
        actionUrl: `/service-requests?modal=true&requestId=${serviceId}&type=service`
      });
    } catch (error) {
      console.error('Error notifying service approval:', error);
    }
  }

  // Notify user when their service request is rejected
  async notifyServiceRejected(serviceId, userId, adminId, reason = null) {
    try {
      const message = reason 
        ? `Your service request was rejected. Reason: ${reason}`
        : 'Your service request was rejected';

      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Service Request Rejected',
        message: message,
        type: 'service_rejected',
        relatedId: serviceId,
        relatedModel: 'ServiceRequest',
        priority: 'high',
        actionUrl: `/service-requests?modal=true&requestId=${serviceId}&type=service`
      });
    } catch (error) {
      console.error('Error notifying service rejection:', error);
    }
  }

  // Notify user when their service request is completed
  async notifyServiceCompleted(serviceId, userId, adminId) {
    try {
      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Service Request Completed',
        message: 'Your service request has been completed successfully',
        type: 'service_completed',
        relatedId: serviceId,
        relatedModel: 'ServiceRequest',
        priority: 'medium',
        actionUrl: `/service-requests?modal=true&requestId=${serviceId}&type=service`
      });
    } catch (error) {
      console.error('Error notifying service completion:', error);
    }
  }

  // Notify admins when a service request is updated
  async notifyServiceUpdated(serviceId, userId, adminIds = null) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      if (!adminIds) {
        const admins = await User.find({ role: 'admin' });
        adminIds = admins.map(admin => admin._id);
      }

      const notificationData = {
        title: 'Service Request Updated',
        message: `${user.fName} ${user.lName} has updated their service request`,
        type: 'service_updated',
        relatedId: serviceId,
        relatedModel: 'ServiceRequest',
        sender: userId,
        priority: 'low',
        actionUrl: `/admin/services/${serviceId}`
      };

      const notifications = adminIds.map(adminId => 
        this.createNotification({ ...notificationData, recipient: adminId })
      );
      
      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notifying service update:', error);
    }
  }

  /**
   * Approval Request Notifications
   */

  // Notify admins when a new approval request is created
  async notifyApprovalCreated(approvalId, userId, adminIds = null) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      if (!adminIds) {
        const admins = await User.find({ role: 'admin' });
        adminIds = admins.map(admin => admin._id);
      }

      const notificationData = {
        title: 'New Approval Request',
        message: `${user.fName} ${user.lName} has submitted a new approval request`,
        type: 'approval_created',
        relatedId: approvalId,
        relatedModel: 'RequestApproval',
        sender: userId,
        priority: 'medium',
        actionUrl: `/admin/approvals?modal=true&requestId=${approvalId}&type=approval`
      };

      const notifications = adminIds.map(adminId => 
        this.createNotification({ ...notificationData, recipient: adminId })
      );
      
      await Promise.all(notifications);
    } catch (error) {
      console.error('Error notifying approval creation:', error);
    }
  }

  // Notify user when their approval request is approved
  async notifyApprovalApproved(approvalId, userId, adminId) {
    try {
      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Approval Request Approved',
        message: 'Your approval request has been approved',
        type: 'approval_approved',
        relatedId: approvalId,
        relatedModel: 'RequestApproval',
        priority: 'high',
        actionUrl: `/request-approvals?modal=true&requestId=${approvalId}&type=approval`
      });
    } catch (error) {
      console.error('Error notifying approval approved:', error);
    }
  }

  // Notify user when their approval request is rejected
  async notifyApprovalRejected(approvalId, userId, adminId, reason = null) {
    try {
      const message = reason 
        ? `Your approval request was rejected. Reason: ${reason}`
        : 'Your approval request was rejected';

      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Approval Request Rejected',
        message: message,
        type: 'approval_rejected',
        relatedId: approvalId,
        relatedModel: 'RequestApproval',
        priority: 'high',
        actionUrl: `/request-approvals?modal=true&requestId=${approvalId}&type=approval`
      });
    } catch (error) {
      console.error('Error notifying approval rejection:', error);
    }
  }

  // Notify user when their approval request needs revision
  async notifyApprovalRevision(approvalId, userId, adminId, message = null) {
    try {
      const notificationMessage = message 
        ? `Your approval request needs revision: ${message}`
        : 'Your approval request needs revision. Please check and resubmit.';

      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Approval Request Needs Revision',
        message: notificationMessage,
        type: 'approval_revision',
        relatedId: approvalId,
        relatedModel: 'RequestApproval',
        priority: 'high',
        actionUrl: `/request-approvals?modal=true&requestId=${approvalId}&type=approval`
      });
    } catch (error) {
      console.error('Error notifying approval revision:', error);
    }
  }

  /**
   * User Registration Notifications
   */

  // Notify admins when a new user registers (pending approval)
  async notifyNewUserRegistration(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Get all admin users
      const admins = await User.find({ role: 'admin' });
      const adminIds = admins.map(admin => admin._id);

      const userType = user.userType === 'student' ? 'Student' : 'Staff/Faculty';
      const notificationData = {
        title: 'New User Registration',
        message: `${user.fName} ${user.lName} (${userType}) has registered and is awaiting approval`,
        type: 'user_registered',
        relatedId: userId,
        relatedModel: 'User',
        sender: userId,
        priority: 'high',
        actionUrl: `/admin/users?tab=pending&userId=${userId}`
      };

      // Create notifications for all admins
      const notifications = adminIds.map(adminId => 
        this.createNotification({ ...notificationData, recipient: adminId })
      );
      
      await Promise.all(notifications);
      console.log(`New user registration notifications sent to ${adminIds.length} admin(s)`);
    } catch (error) {
      console.error('Error notifying new user registration:', error);
    }
  }

  // Notify user when their account is approved
  async notifyUserApproved(userId, adminId) {
    try {
      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Account Approved',
        message: 'Your account has been approved! You can now access all system features.',
        type: 'user_approved',
        relatedId: userId,
        relatedModel: 'User',
        priority: 'high',
        actionUrl: '/user/dashboard'
      });
    } catch (error) {
      console.error('Error notifying user approval:', error);
    }
  }

  // Notify user when their account is denied
  async notifyUserDenied(userId, adminId) {
    try {
      await this.createNotification({
        recipient: userId,
        sender: adminId,
        title: 'Account Access Denied',
        message: 'Your account registration was not approved. Please contact the administrator for more information.',
        type: 'user_denied',
        relatedId: userId,
        relatedModel: 'User',
        priority: 'high',
        actionUrl: '/contact'
      });
    } catch (error) {
      console.error('Error notifying user denial:', error);
    }
  }

  /**
   * Chat/Message Notifications
   */

  // Notify user of new message
  async notifyNewMessage(conversationId, senderId, recipientId, messagePreview, requestId, requestType) {
    try {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);
      if (!sender || !recipient) return;

      const truncatedMessage = messagePreview.length > 50 
        ? messagePreview.substring(0, 50) + '...'
        : messagePreview;

      // Create action URL based on recipient role and request type
      let actionUrl;
      if (recipient.role === 'admin') {
        // Admin recipients - open conversation modal in admin pages
        if (requestType === 'service') {
          actionUrl = `/admin/services?conversation=true&requestId=${requestId}&type=service`;
        } else if (requestType === 'approval') {
          actionUrl = `/admin/approvals?conversation=true&requestId=${requestId}&type=approval`;
        }
      } else {
        // User recipients - open conversation modal in user pages
        if (requestType === 'service') {
          actionUrl = `/service-requests?conversation=true&requestId=${requestId}&type=service`;
        } else if (requestType === 'approval') {
          actionUrl = `/request-approvals?conversation=true&requestId=${requestId}&type=approval`;
        }
      }

      await this.createNotification({
        recipient: recipientId,
        sender: senderId,
        title: 'New Message',
        message: `${sender.fName}: ${truncatedMessage}`,
        type: 'new_message',
        relatedId: requestId,
        relatedModel: requestType === 'service' ? 'ServiceRequest' : 'RequestApproval',
        priority: 'medium',
        actionUrl: actionUrl
      });
    } catch (error) {
      console.error('Error notifying new message:', error);
    }
  }

  /**
   * System Notifications
   */

  // Send system notification
  async notifySystem(recipientIds, title, message, priority = 'medium') {
    try {
      if (!Array.isArray(recipientIds)) {
        recipientIds = [recipientIds];
      }

      const notifications = recipientIds.map(recipientId => 
        this.createNotification({
          recipient: recipientId,
          title: title,
          message: message,
          type: 'system',
          priority: priority
        })
      );
      
      await Promise.all(notifications);
    } catch (error) {
      console.error('Error sending system notification:', error);
    }
  }

  // Send deadline reminder
  async notifyDeadlineReminder(requestId, userId, requestType, deadline) {
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

      let message;
      if (daysLeft <= 0) {
        message = `Your ${requestType.toLowerCase()} deadline has passed`;
      } else if (daysLeft === 1) {
        message = `Your ${requestType.toLowerCase()} deadline is tomorrow`;
      } else {
        message = `Your ${requestType.toLowerCase()} deadline is in ${daysLeft} days`;
      }

      await this.createNotification({
        recipient: userId,
        title: 'Deadline Reminder',
        message: message,
        type: 'deadline_reminder',
        relatedId: requestId,
        relatedModel: requestType === 'Service Request' ? 'ServiceRequest' : 'RequestApproval',
        priority: daysLeft <= 1 ? 'urgent' : 'high'
      });
    } catch (error) {
      console.error('Error sending deadline reminder:', error);
    }
  }

  /**
   * Notification Management
   */

  // Get notifications for a user with pagination
  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const skip = (page - 1) * limit;
      
      const query = { recipient: userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('sender', 'fName lName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
      });

      const totalCount = await Notification.countDocuments({ recipient: userId });

      return { 
        notifications, 
        unreadCount, 
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      
      if (result) {
        // Emit update to user
        socketService.emitToUser(userId, 'notificationRead', { 
          notificationId: notificationId 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      // Emit update to user
      socketService.emitToUser(userId, 'allNotificationsRead', {});
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });
      
      if (result) {
        // Emit update to user
        socketService.emitToUser(userId, 'notificationDeleted', { 
          notificationId: notificationId 
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup job)
  async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { recipient: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();