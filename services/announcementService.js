/**
 * Announcement Service
 * Handles announcement creation, scheduling, and delivery
 */

const BroadcastMessage = require('../models/BroadcastMessage');
const User = require('../models/User');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class AnnouncementService {
  /**
   * Create new announcement
   * @param {Object} announcementData - Announcement details
   * @returns {Promise<Object>} - Created announcement
   */
  async createAnnouncement(announcementData) {
    try {
      const {
        title,
        content,
        priority = 'medium',
        recipientType = 'all',
        organization = null,
        recipients = [],
        scheduledTime = null,
        createdBy = null
      } = announcementData;

      // Determine actual recipients
      let recipientIds = [];
      let recipientCount = 0;

      if (recipientType === 'all') {
        const allUsers = await User.find().select('_id');
        recipientIds = allUsers.map(u => u._id);
        recipientCount = allUsers.length;
      } else if (recipientType === 'organization' && organization) {
        const orgUsers = await User.find({ 
          $or: [
            { organization: organization },
            { affiliation: organization },
            { studentOrganization: organization }
          ]
        }).select('_id');
        recipientIds = orgUsers.map(u => u._id);
        recipientCount = orgUsers.length;
      } else if (recipientType === 'specific' && recipients.length > 0) {
        recipientIds = recipients;
        recipientCount = recipients.length;
      }

      const announcement = new BroadcastMessage({
        title,
        content,
        priority,
        recipientType,
        organization,
        recipients: recipientIds,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        createdBy,
        status: scheduledTime ? 'scheduled' : 'active',
        recipientCount,
        viewCount: 0
      });

      await announcement.save();

      // If not scheduled, send immediately
      if (!scheduledTime) {
        await this.sendAnnouncement(announcement._id, recipientIds);
      }

      return announcement;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw new Error('Failed to create announcement');
    }
  }

  /**
   * Send announcement to recipients
   * @param {String} announcementId - Announcement ID
   * @param {Array<String>} recipientIds - Array of recipient user IDs
   */
  async sendAnnouncement(announcementId, recipientIds) {
    try {
      const announcement = await BroadcastMessage.findById(announcementId);
      
      if (!announcement) {
        throw new Error('Announcement not found');
      }

      // Get recipient details for email sending
      const recipients = await User.find({ _id: { $in: recipientIds } }).select('_id email fName lName settings');

      // Send in-app notifications
      const notificationPromises = recipientIds.map(recipientId =>
        notificationService.createNotification({
          userId: recipientId,
          message: `📢 ${announcement.title}`,
          link: '/announcements',
          type: 'announcement',
          priority: announcement.priority
        }).catch(err => {
          console.error(`Failed to send announcement to user ${recipientId}:`, err);
          return null;
        })
      );

      await Promise.allSettled(notificationPromises);

      // Send emails if enabled
      if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        const emailPromises = recipients
          .filter(user => user.email && user.settings?.emailNotifications)
          .map(user =>
            emailService.sendAnnouncementEmail(user.email, announcement)
              .catch(err => {
                console.error(`Failed to send announcement email to ${user.email}:`, err);
                return null;
              })
          );

        if (emailPromises.length > 0) {
          await Promise.allSettled(emailPromises);
          console.log(`[AnnouncementService] Sent announcement emails to ${emailPromises.length} recipients`);
        }
      }

      // Update announcement status if it was scheduled
      if (announcement.status === 'scheduled') {
        announcement.status = 'active';
        announcement.sentAt = new Date();
        await announcement.save();
      }

      return true;
    } catch (error) {
      console.error('Error sending announcement:', error);
      throw new Error('Failed to send announcement');
    }
  }

  /**
   * Update announcement
   * @param {String} announcementId - Announcement ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} - Updated announcement
   */
  async updateAnnouncement(announcementId, updates) {
    try {
      const announcement = await BroadcastMessage.findByIdAndUpdate(
        announcementId,
        {
          ...updates,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      return announcement;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw new Error('Failed to update announcement');
    }
  }

  /**
   * Delete announcement
   * @param {String} announcementId - Announcement ID
   * @returns {Promise<Object>} - Deleted announcement
   */
  async deleteAnnouncement(announcementId) {
    try {
      const announcement = await BroadcastMessage.findByIdAndDelete(announcementId);

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      return announcement;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement');
    }
  }

  /**
   * Get all announcements (with pagination)
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise<Object>} - Announcements and pagination info
   */
  async getAnnouncements(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const announcements = await BroadcastMessage.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fName lName email')
        .lean();

      const total = await BroadcastMessage.countDocuments();

      return {
        announcements,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  /**
   * Get single announcement
   * @param {String} announcementId - Announcement ID
   * @returns {Promise<Object>} - Announcement
   */
  async getAnnouncement(announcementId) {
    try {
      const announcement = await BroadcastMessage.findById(announcementId)
        .populate('createdBy', 'fName lName email');

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      return announcement;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw new Error('Failed to fetch announcement');
    }
  }

  /**
   * Track announcement view
   * @param {String} announcementId - Announcement ID
   * @param {String} userId - User ID
   */
  async recordView(announcementId, userId) {
    try {
      await BroadcastMessage.findByIdAndUpdate(
        announcementId,
        {
          $addToSet: { viewedBy: userId },
          $inc: { viewCount: 1 }
        }
      );
    } catch (error) {
      console.error('Error recording announcement view:', error);
    }
  }

  /**
   * Check and send scheduled announcements
   * Called by a scheduled job
   */
  async processScheduledAnnouncements() {
    try {
      const now = new Date();
      const scheduledAnnouncements = await BroadcastMessage.find({
        status: 'scheduled',
        scheduledTime: { $lte: now }
      });

      for (const announcement of scheduledAnnouncements) {
        await this.sendAnnouncement(announcement._id, announcement.recipients);
      }

      console.log(`[AnnouncementService] Processed ${scheduledAnnouncements.length} scheduled announcements`);
      return scheduledAnnouncements.length;
    } catch (error) {
      console.error('[AnnouncementService] Error processing scheduled announcements:', error);
    }
  }

  /**
   * Get active announcements for user
   * @param {String} userId - User ID
   * @param {Number} limit - Max results
   * @returns {Promise<Array>} - Active announcements for user
   */
  async getUserAnnouncements(userId, limit = 10) {
    try {
      const announcements = await BroadcastMessage.find({
        recipients: userId,
        status: { $in: ['active', 'scheduled'] }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return announcements;
    } catch (error) {
      console.error('Error fetching user announcements:', error);
      return [];
    }
  }

  /**
   * Get announcement statistics
   * @returns {Promise<Object>} - Stats
   */
  async getStatistics() {
    try {
      const total = await BroadcastMessage.countDocuments();
      const active = await BroadcastMessage.countDocuments({ status: 'active' });
      const scheduled = await BroadcastMessage.countDocuments({ status: 'scheduled' });
      const expired = await BroadcastMessage.countDocuments({ status: 'expired' });

      // Get average engagement
      const announcements = await BroadcastMessage.find().select('recipientCount viewCount');
      let avgEngagement = 0;
      if (announcements.length > 0) {
        const totalEngagement = announcements.reduce((sum, a) => {
          return sum + (a.recipientCount > 0 ? (a.viewCount / a.recipientCount) * 100 : 0);
        }, 0);
        avgEngagement = Math.round(totalEngagement / announcements.length);
      }

      return {
        total,
        active,
        scheduled,
        expired,
        avgEngagement: avgEngagement + '%'
      };
    } catch (error) {
      console.error('Error fetching announcement statistics:', error);
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        expired: 0,
        avgEngagement: '0%'
      };
    }
  }
}

module.exports = new AnnouncementService();
