// ===== Notification Routes =====
// This module handles all notification-related API endpoints
// Provides RESTful API for notification management and real-time updates

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * GET /notifications
 * Notifications page for viewing all notifications
 */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    console.log('🔔 Notifications route called for user:', {
      id: req.user._id,
      role: req.user.role,
      name: `${req.user.fName} ${req.user.lName}`,
      showOnboarding: req.query.showOnboarding
    });

    // Render different templates based on user role
    if (req.user.role === 'admin') {
      console.log('👑 Rendering admin notifications template');
      res.render('Admin/notifications', {
        user: req.user,
        title: 'Notifications - Admin',
        name: `${req.user.fName} ${req.user.lName}`
      });
    } else if (req.user.role === 'unit') {
      console.log('🏢 Rendering unit notifications template');
      res.render('Unit/notifications', {
        user: req.user,
        title: 'Notifications - Unit',
        name: `${req.user.fName} ${req.user.lName}`,
        showOnboarding: req.query.showOnboarding === 'true'
      });
    } else {
      console.log('👤 Rendering user notifications template');
      res.render('notifications', {
        user: req.user,
        title: 'Notifications'
      });
    }
  } catch (error) {
    console.error('Error loading notifications page:', error);
    res.status(500).render('error', {
      message: 'Failed to load notifications page',
      error: error.message
    });
  }
});

/**
 * GET /admin/notifications
 * Admin notifications page
 */
router.get('/admin/notifications', requireAdmin, async (req, res) => {
  try {
    res.render('Admin/notifications', { 
      user: req.user,
      title: 'Notifications - Admin',
      name: `${req.user.fName} ${req.user.lName}`
    });
  } catch (error) {
    console.error('Error loading admin notifications page:', error);
    res.status(500).render('error', { 
      message: 'Failed to load notifications page',
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications
 * Get notifications for the authenticated user with pagination
 */
router.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const result = await notificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true'
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
router.get('/api/notifications/unread-count', requireAuth, async (req, res) => {
  try {
    const result = await notificationService.getUserNotifications(
      req.user._id,
      1,
      1,
      false
    );
    
    res.json({
      success: true,
      unreadCount: result.unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unread count',
      error: error.message 
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await notificationService.markAsRead(id, req.user._id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read',
      error: error.message 
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.patch('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete('/api/notifications/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await notificationService.deleteNotification(id, req.user._id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification',
      error: error.message 
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for the authenticated user
 */
router.get('/api/notifications/stats', requireAuth, async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats(req.user._id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification statistics',
      error: error.message 
    });
  }
});

/**
 * POST /api/notifications/test (Admin only)
 * Test endpoint for creating test notifications
 */
router.post('/api/notifications/test', requireAdmin, async (req, res) => {
  try {
    const { type, recipientId, title, message, priority = 'medium' } = req.body;
    
    if (!type || !recipientId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, recipientId, title, message'
      });
    }
    
    const notification = await notificationService.createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: type,
      title: title,
      message: message,
      priority: priority
    });
    
    res.json({
      success: true,
      message: 'Test notification created',
      data: notification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create test notification',
      error: error.message 
    });
  }
});

/**
 * POST /api/notifications/system (Admin only)
 * Send system notification to users
 */
router.post('/api/notifications/system', requireAdmin, async (req, res) => {
  try {
    const { recipientIds, title, message, priority = 'medium' } = req.body;
    
    if (!recipientIds || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientIds, title, message'
      });
    }
    
    await notificationService.notifySystem(recipientIds, title, message, priority);
    
    res.json({
      success: true,
      message: `System notification sent to ${Array.isArray(recipientIds) ? recipientIds.length : 1} user(s)`
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send system notification',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/notifications/cleanup (Admin only)
 * Clean up old read notifications
 */
router.delete('/api/notifications/cleanup', requireAdmin, async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    const deletedCount = await notificationService.deleteOldNotifications(parseInt(daysOld));
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} old notifications`
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup notifications',
      error: error.message 
    });
  }
});

module.exports = router;
