// ===== Messaging Routes =====
// Handles user-to-unit and user-to-user messaging functionality
// Supports conversation management, message sending, and real-time notifications

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { requireLogin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');
const { messageLimiter } = require('../middleware/rateLimiter');

/**
 * GET /messages
 * Get list of all conversations for current user
 */
router.get('/messages', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get conversations where user is a participant
    const conversations = await Conversation.find({
      'participants.userId': userId,
      isArchived: false
    })
      .populate('participants.userId', 'fName lName email profilePicture')
      .populate('messages.senderId', 'fName lName role profilePicture')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({
      'participants.userId': userId,
      isArchived: false
    });

    res.render('User/messages', {
      conversations: conversations,
      user: req.user,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      title: 'Messages'
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).render('error', { error: error.message });
  }
});

/**
 * GET /messages/:conversationId
 * Get specific conversation with all messages
 */
router.get('/messages/:conversationId', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.userId', 'fName lName email role profilePicture')
      .populate('messages.senderId', 'fName lName role profilePicture');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId._id.equals(userId));
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Mark conversation as read
    await conversation.markAsRead(userId);

    // For API responses, return JSON
    if (req.accepts('json')) {
      return res.json({
        success: true,
        conversation: conversation,
        user: req.user
      });
    }

    // For page views
    res.render('User/messages-detail', {
      conversation: conversation,
      user: req.user,
      title: `Conversation`
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /messages
 * Create new conversation or get existing
 */
router.post('/messages', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId, relatedRequestId, relatedRequestType, title } = req.body;

    // Validate inputs
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [userId, recipientId] },
      type: 'direct'
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = new Conversation({
        type: 'direct',
        title: title || `Conversation between ${req.user.fName} and ${recipient.fName}`,
        participants: [
          {
            userId: userId,
            role: req.user.role || 'user'
          },
          {
            userId: recipientId,
            role: recipient.role || 'user'
          }
        ],
        ...(relatedRequestId && {
          relatedRequest: {
            requestId: relatedRequestId,
            requestType: relatedRequestType || 'service'
          }
        })
      });

      await conversation.save();
      console.log(`[Messages] New conversation created: ${conversation._id}`);
    }

    res.json({
      success: true,
      conversation: conversation,
      message: 'Conversation ready'
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /messages/:conversationId/send
 * Send message in conversation
 * Rate limited to prevent message spam
 */
router.post('/messages/:conversationId/send', requireLogin, messageLimiter, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { content } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => p.userId.equals(userId));
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Create message
    const message = {
      senderId: userId,
      senderName: `${req.user.fName} ${req.user.lName}`,
      senderRole: req.user.role,
      content: content.trim(),
      messageType: 'text',
      timestamp: new Date()
    };

    // Add message to conversation
    conversation.messages.push(message);
    conversation.lastMessageAt = new Date();
    conversation.messageCount = conversation.messages.length;

    await conversation.save();

    // Get other participants
    const otherParticipants = conversation.getOtherParticipants(userId);

    // Send in-app notification to other participants
    for (const participant of otherParticipants) {
      try {
        await notificationService.createNotification({
          recipient: participant.userId,
          title: 'New Message',
          message: `${req.user.fName} ${req.user.lName}: ${content.substring(0, 50)}...`,
          type: 'message',
          priority: 'medium',
          actionUrl: `/messages/${conversationId}`
        });
      } catch (err) {
        console.error('Error sending notification:', err);
      }
    }

    // Emit real-time message to conversation participants
    socketService.emitToConversation(conversationId, 'newMessage', {
      conversationId: conversationId,
      message: message,
      senderName: req.user.fName + ' ' + req.user.lName
    });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /messages/:conversationId/messages/:messageId
 * Edit message
 */
router.put('/messages/:conversationId/messages/:messageId', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the sender
    if (!message.senderId.equals(userId)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    // Update message
    message.content = content.trim();
    message.editedAt = new Date();

    await conversation.save();

    // Emit update to real-time clients
    socketService.emitToConversation(conversationId, 'messageEdited', {
      conversationId: conversationId,
      messageId: messageId,
      content: content,
      editedAt: message.editedAt
    });

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /messages/:conversationId/messages/:messageId
 * Delete message
 */
router.delete('/messages/:conversationId/messages/:messageId', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is the sender or admin
    if (!message.senderId.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    // Soft delete
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    await conversation.save();

    // Emit deletion to real-time clients
    socketService.emitToConversation(conversationId, 'messageDeleted', {
      conversationId: conversationId,
      messageId: messageId
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /messages/:conversationId/read
 * Mark conversation as read
 */
router.post('/messages/:conversationId/read', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    await conversation.markAsRead(userId);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /messages/search
 * Search for users to start conversation with
 */
router.get('/messages/search', requireLogin, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const results = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { fName: { $regex: query, $options: 'i' } },
        { lName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id fName lName email role profilePicture')
      .limit(10);

    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /messages/:conversationId/archive
 * Archive conversation
 */
router.post('/messages/:conversationId/archive', requireLogin, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conversation.isArchived = true;
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /messages/archived
 * Get archived conversations
 */
router.get('/messages/archived', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const archivedConversations = await Conversation.find({
      'participants.userId': userId,
      isArchived: true
    })
      .populate('participants.userId', 'fName lName email')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      conversations: archivedConversations
    });
  } catch (error) {
    console.error('Error fetching archived conversations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
