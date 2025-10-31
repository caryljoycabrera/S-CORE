// ===== API Routes =====
// This module handles all API endpoints that don't fit in other route categories
// Includes conversation management, deadline tracking, and debug endpoints

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const Conversation = require('../models/Conversation');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { upload } = require('../config/upload');

/**
 * GET /api/deadlines
 * Admin API endpoint for all request deadlines grouped by date
 */
router.get('/api/deadlines', requireLogin, async (req, res) => {
  try {
    console.log('Admin fetching deadlines from database...');

    // Fetch all approval requests and service requests with deadlines
    const approvals = await RequestApproval.find({
      deadline: { $exists: true, $ne: null }
    }).select('deadline title').lean();

    const services = await ServiceRequest.find({
      deadline: { $exists: true, $ne: null }
    }).select('deadline title').lean();

    console.log(`Found ${approvals.length} approval deadlines and ${services.length} service deadlines`);

    // Group deadlines by date
    const deadlinesByDate = {};

    // Process approval deadlines
    approvals.forEach(approval => {
      if (approval.deadline) {
        try {
          // Use local date string to avoid timezone issues
          const date = new Date(approval.deadline);
          const dateStr = date.getFullYear() + '-' +
                         String(date.getMonth() + 1).padStart(2, '0') + '-' +
                         String(date.getDate()).padStart(2, '0');

          if (!deadlinesByDate[dateStr]) {
            deadlinesByDate[dateStr] = { approvals: 0, services: 0 };
          }
          deadlinesByDate[dateStr].approvals += 1;
          console.log(`Added approval deadline for ${dateStr}: ${approval.title}`);
        } catch (error) {
          console.error('Error processing approval deadline:', approval.deadline, error);
        }
      }
    });

    // Process service deadlines
    services.forEach(service => {
      if (service.deadline) {
        try {
          // Use local date string to avoid timezone issues
          const date = new Date(service.deadline);
          const dateStr = date.getFullYear() + '-' +
                         String(date.getMonth() + 1).padStart(2, '0') + '-' +
                         String(date.getDate()).padStart(2, '0');

          if (!deadlinesByDate[dateStr]) {
            deadlinesByDate[dateStr] = { approvals: 0, services: 0 };
          }
          deadlinesByDate[dateStr].services += 1;
          console.log(`Added service deadline for ${dateStr}: ${service.title}`);
        } catch (error) {
          console.error('Error processing service deadline:', service.deadline, error);
        }
      }
    });

    console.log('Final deadlines grouped by date:', deadlinesByDate);
    console.log('Total unique deadline dates:', Object.keys(deadlinesByDate).length);

    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    res.json(deadlinesByDate);
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines', details: error.message });
  }
});

/**
 * GET /api/deadlines/:date/details
 * Admin API endpoint for detailed deadline info for a specific date
 */
router.get('/api/deadlines/:date/details', requireLogin, async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`Fetching detailed deadlines for date: ${date}`);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD',
        date: date,
        approvals: [],
        services: [],
        totalCount: 0
      });
    }

    // Create date range for the entire day
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    console.log(`Searching between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // Fetch detailed requests
    const approvals = await RequestApproval.find({
      deadline: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('userId', 'fName lName userType affiliation studentOrganization')
    .select('_id title description organization deadline createdAt userId status')
    .lean();

    const services = await ServiceRequest.find({
      deadline: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('userId', 'fName lName userType affiliation studentOrganization')
    .select('_id title description organization deadline createdAt userId status')
    .lean();

    console.log(`Found ${approvals.length} approvals, ${services.length} services for ${date}`);

    // Process the data
    const processedApprovals = approvals.map(approval => ({
      ...approval,
      displayOrganization: approval.userId?.userType === 'nonstudent'
        ? (Array.isArray(approval.userId.affiliation) ? approval.userId.affiliation.join(', ') : approval.userId.affiliation)
        : approval.organization || 'N/A'
    }));

    const processedServices = services.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? (Array.isArray(service.userId.affiliation) ? service.userId.affiliation.join(', ') : service.userId.affiliation)
        : service.organization || 'N/A'
    }));

    const response = {
      date: date,
      approvals: processedApprovals,
      services: processedServices,
      totalCount: processedApprovals.length + processedServices.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching detailed deadlines:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed deadlines',
      date: req.params.date || 'unknown',
      approvals: [],
      services: [],
      totalCount: 0
    });
  }
});

/**
 * GET /api/conversation/:requestId
 * API endpoint to get conversation for a specific request
 */
router.get('/api/conversation/:requestId', requireLogin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = await User.findById(req.session.userId);

    // Check if it's a service request or approval request
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'fName lName role');
    const approvalRequest = await RequestApproval.findById(requestId)
      .populate('userId', 'fName lName role');

    if (!serviceRequest && !approvalRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check access permissions
    const targetRequest = serviceRequest || approvalRequest;

    // Handle missing user data
    if (!targetRequest.userId) {
      console.warn(`Request ${requestId} has no associated user`);
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied - orphaned request' });
      }
    } else if (user.role !== 'admin' && targetRequest.userId._id.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find conversation by the appropriate field
    let conversation;
    if (serviceRequest) {
      conversation = await Conversation.findOne({
        serviceRequestId: requestId,
        requestType: 'service'
      }).populate('messages.senderId', 'fName lName role');

      if (!conversation) {
        conversation = new Conversation({
          serviceRequestId: requestId,
          requestType: 'service',
          messages: []
        });
        await conversation.save();
        conversation = await Conversation.findById(conversation._id).populate('messages.senderId', 'fName lName role');
      }
    } else {
      conversation = await Conversation.findOne({
        approvalRequestId: requestId,
        requestType: 'approval'
      }).populate('messages.senderId', 'fName lName role');

      if (!conversation) {
        conversation = new Conversation({
          approvalRequestId: requestId,
          requestType: 'approval',
          messages: []
        });
        await conversation.save();
        conversation = await Conversation.findById(conversation._id).populate('messages.senderId', 'fName lName role');
      }
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to fetch conversation', details: err.message });
  }
});

/**
 * POST /api/conversation/:requestId/message
 * API endpoint to send a new message to a conversation
 */
router.post('/api/conversation/:requestId/message', requireLogin, upload.single('file'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.session.userId);
    const uploadedFile = req.file;

    // Allow empty content if there's a file attachment
    if ((!content || content.trim() === '') && !uploadedFile) {
      return res.status(400).json({ error: 'Message content or file attachment is required' });
    }

    // Check if it's a service request or approval request
    const serviceRequest = await ServiceRequest.findById(requestId);
    const approvalRequest = await RequestApproval.findById(requestId);

    if (!serviceRequest && !approvalRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check access permissions
    const targetRequest = serviceRequest || approvalRequest;
    if (user.role !== 'admin' && targetRequest.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find or create conversation
    let conversation;
    if (serviceRequest) {
      conversation = await Conversation.findOne({
        serviceRequestId: requestId,
        requestType: 'service'
      });

      if (!conversation) {
        conversation = new Conversation({
          serviceRequestId: requestId,
          requestType: 'service',
          messages: []
        });
        await conversation.save();
      }
    } else {
      conversation = await Conversation.findOne({
        approvalRequestId: requestId,
        requestType: 'approval'
      });

      if (!conversation) {
        conversation = new Conversation({
          approvalRequestId: requestId,
          requestType: 'approval',
          messages: []
        });
        await conversation.save();
      }
    }

    const newMessage = {
      senderId: req.session.userId,
      senderRole: user.role,
      content: content ? content.trim() : '',
      timestamp: new Date(),
      isRead: false
    };

    // Add file attachment information if file was uploaded
    if (uploadedFile) {
      newMessage.file_path = `/uploads/${uploadedFile.filename}`;
      newMessage.file_type = uploadedFile.mimetype;
      newMessage.original_filename = uploadedFile.originalname;
      newMessage.file_size = uploadedFile.size;
    }

    conversation.messages.push(newMessage);
    await conversation.save();

    // Populate the sender info for the response
    await conversation.populate('messages.senderId', 'fName lName role');

    res.json({
      success: true,
      message: conversation.messages[conversation.messages.length - 1]
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

/**
 * POST /api/conversation/:requestId/mark-read
 * API endpoint to mark conversation messages as read
 */
router.post('/api/conversation/:requestId/mark-read', requireLogin, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Check if it's a service request or approval request
    const serviceRequest = await ServiceRequest.findById(requestId);
    const approvalRequest = await RequestApproval.findById(requestId);

    let conversation;
    if (serviceRequest) {
      conversation = await Conversation.findOne({
        serviceRequestId: requestId,
        requestType: 'service'
      });
    } else if (approvalRequest) {
      conversation = await Conversation.findOne({
        approvalRequestId: requestId,
        requestType: 'approval'
      });
    }

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark messages as read (not sent by current user)
    let hasChanges = false;
    conversation.messages.forEach(message => {
      if (message.senderId.toString() !== req.session.userId && !message.isRead) {
        message.isRead = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await conversation.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * GET /admin/cleanup-conversations
 * Debug route to cleanup invalid conversations
 */
router.get('/admin/cleanup-conversations', requireAdmin, async (req, res) => {
  try {
    // Delete any conversations that don't have proper requestType
    const invalidConversations = await Conversation.find({
      $or: [
        { requestType: { $exists: false } },
        { requestType: null },
        { requestType: '' }
      ]
    });

    console.log(`Found ${invalidConversations.length} invalid conversations`);

    // Fix or delete invalid conversations
    let fixed = 0;
    let deleted = 0;

    for (const conv of invalidConversations) {
      if (conv.serviceRequestId) {
        conv.requestType = 'service';
        await conv.save();
        fixed++;
      } else if (conv.approvalRequestId) {
        conv.requestType = 'approval';
        await conv.save();
        fixed++;
      } else {
        await Conversation.findByIdAndDelete(conv._id);
        deleted++;
      }
    }

    res.json({
      message: `Cleanup complete. Fixed: ${fixed}, Deleted: ${deleted}`,
      totalProcessed: invalidConversations.length
    });
  } catch (err) {
    console.error('Error cleaning up conversations:', err);
    res.status(500).json({ error: 'Failed to cleanup conversations' });
  }
});

/**
 * GET /debug/service-requests
 * Debug route to show service request data
 */
router.get('/debug/service-requests', requireLogin, async (req, res) => {
  try {
    const services = await ServiceRequest.find({ userId: req.session.userId })
      .select('title organization specificRequestType')
      .lean();

    res.json({
      totalServices: services.length,
      sampleServices: services.slice(0, 5),
      allOrganizations: services.map(s => s.organization)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /debug/deadlines
 * Debug route to show deadline data in database
 */
router.get('/debug/deadlines', requireLogin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find({}, 'title deadline createdAt').lean();
    const services = await ServiceRequest.find({}, 'title deadline createdAt').lean();

    res.json({
      totalApprovals: approvals.length,
      approvalsWithDeadlines: approvals.filter(a => a.deadline).length,
      totalServices: services.length,
      servicesWithDeadlines: services.filter(s => s.deadline).length,
      sampleApprovals: approvals.slice(0, 3),
      sampleServices: services.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
