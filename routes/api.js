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
const notificationService = require('../services/notificationService');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/users/verify
 * Endpoint to verify a new user
 */
router.post('/api/users/verify', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.isVerified = true;
    await user.save();

    res.json({ 
      success: true, 
      message: 'User verified successfully' 
    });

  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while verifying user' 
    });
  }
});

/**
 * POST /api/users/deny
 * Endpoint to deny and delete a new user
 */
router.post('/api/users/deny', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({ 
      success: true, 
      message: 'User denied and removed successfully' 
    });

  } catch (error) {
    console.error('Error denying user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while denying user' 
    });
  }
});

/**
 * GET /api/deadlines
 * Admin API endpoint for all request deadlines grouped by date
 */
router.get('/api/deadlines', apiLimiter, requireLogin, async (req, res) => {
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
router.get('/api/conversation/:requestId', apiLimiter, requireLogin, async (req, res) => {
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
      if (user.role !== 'admin' && user.role !== 'unit') {
        return res.status(403).json({ error: 'Access denied - orphaned request' });
      }
    } else if (user.role !== 'admin' && user.role !== 'unit' && targetRequest.userId._id.toString() !== req.session.userId) {
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
        conversation = await Conversation.findById(conversation._id)
          .populate('messages.senderId', 'fName lName role')
          .populate('messages.readBy.userId', 'fName lName role');
      }
    } else {
      conversation = await Conversation.findOne({
        approvalRequestId: requestId,
        requestType: 'approval'
      })
      .populate('messages.senderId', 'fName lName role')
      .populate('messages.readBy.userId', 'fName lName role');

      if (!conversation) {
        conversation = new Conversation({
          approvalRequestId: requestId,
          requestType: 'approval',
          messages: []
        });
        await conversation.save();
        conversation = await Conversation.findById(conversation._id)
          .populate('messages.senderId', 'fName lName role')
          .populate('messages.readBy.userId', 'fName lName role');
      }
    }

    // Format response with message data including sender names and read receipts
    const formattedMessages = conversation.messages.map(msg => ({
      _id: msg._id,
      senderName: msg.senderId ? `${msg.senderId.fName} ${msg.senderId.lName}` : 'Unknown',
      senderRole: msg.senderRole,
      content: msg.content,
      attachments: msg.attachments || [],
      timestamp: msg.timestamp,
      isRead: msg.isRead,
      readBy: (msg.readBy || []).map(reader => ({
        userId: reader.userId._id,
        userName: reader.userId ? `${reader.userId.fName} ${reader.userId.lName}` : 'Unknown',
        userRole: reader.userId.role,
        readAt: reader.readAt
      }))
    }));

    res.json({
      conversation: formattedMessages
    });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to fetch conversation', details: err.message });
  }
});

/**
 * POST /api/conversation/:requestId/message
 * API endpoint to send a new message to a conversation
 */
router.post('/api/conversation/:requestId/message', apiLimiter, requireLogin, upload.array('chatFiles', 10), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.session.userId);
    const uploadedFiles = req.files || [];

    // Allow empty content if there's a file attachment
    if ((!content || content.trim() === '') && uploadedFiles.length === 0) {
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
    if (user.role !== 'admin' && user.role !== 'unit' && targetRequest.userId.toString() !== req.session.userId) {
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

    // Add file attachments information if files were uploaded
    if (uploadedFiles.length > 0) {
      newMessage.attachments = uploadedFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`
      }));
    }

    conversation.messages.push(newMessage);
    await conversation.save();

    // Populate the sender info and read receipts for the response
    await conversation.populate('messages.senderId', 'fName lName role');
    await conversation.populate('messages.readBy.userId', 'fName lName role');
    
    // Send notification to the other parties (not the sender) - excluding admins
    try {
      const targetRequest = serviceRequest || approvalRequest;
      const notificationPromises = [];
      
      // Notify unit members if message is not from unit
      if (user.role !== 'unit') {
        const unitMembers = await User.find({ role: 'unit' });
        for (const unitMember of unitMembers) {
          notificationPromises.push(
            notificationService.notifyNewMessage(
              conversation._id,
              user._id,
              unitMember._id,
              content || 'Sent a file',
              requestId,
              serviceRequest ? 'service' : 'approval'
            ).catch(err => console.error('Unit notification error:', err))
          );
        }
      }
      
      // Notify the request creator if message is not from them
      if (targetRequest.userId && targetRequest.userId.toString() !== user._id.toString()) {
        notificationPromises.push(
          notificationService.notifyNewMessage(
            conversation._id,
            user._id,
            targetRequest.userId,
            content || 'Sent a file',
            requestId,
            serviceRequest ? 'service' : 'approval'
          ).catch(err => console.error('User notification error:', err))
        );
      }
      
      // Execute all notifications in parallel
      await Promise.allSettled(notificationPromises);
    } catch (notifError) {
      console.error('Error sending message notifications:', notifError);
    }

    res.json({
      success: true,
      message: {
        _id: conversation.messages[conversation.messages.length - 1]._id,
        senderName: conversation.messages[conversation.messages.length - 1].senderId ? 
          `${conversation.messages[conversation.messages.length - 1].senderId.fName} ${conversation.messages[conversation.messages.length - 1].senderId.lName}` : 'Unknown',
        senderRole: conversation.messages[conversation.messages.length - 1].senderRole,
        content: conversation.messages[conversation.messages.length - 1].content,
        attachments: conversation.messages[conversation.messages.length - 1].attachments || [],
        timestamp: conversation.messages[conversation.messages.length - 1].timestamp,
        isRead: conversation.messages[conversation.messages.length - 1].isRead,
        readBy: (conversation.messages[conversation.messages.length - 1].readBy || []).map(reader => ({
          userId: reader.userId._id,
          userName: reader.userId ? `${reader.userId.fName} ${reader.userId.lName}` : 'Unknown',
          userRole: reader.userId.role,
          readAt: reader.readAt
        }))
      }
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

/**
 * GET /api/revision-history/:requestId
 * API endpoint to get revision history for a request approval
 */
router.get('/api/revision-history/:requestId', requireLogin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not authenticated', revisions: [] });
    }

    // Find the approval request (revision history only for approval requests)
    const approvalRequest = await RequestApproval.findById(requestId)
      .populate('userId', 'fName lName');

    if (!approvalRequest) {
      // Not an approval request - return empty revisions instead of 404
      return res.json({ success: true, revisions: [], message: 'Not an approval request or request not found' });
    }

    // Check access permissions
    if (user.role !== 'admin' && user.role !== 'unit' && approvalRequest.userId._id.toString() !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Access denied', revisions: [] });
    }

    // Build revision history from revisionHistory field in the request
    const revisions = [];

    // Add initial submission
    revisions.push({
      type: 'initial',
      timestamp: approvalRequest.createdAt,
      by: approvalRequest.userId ? `${approvalRequest.userId.fName} ${approvalRequest.userId.lName}` : 'Unknown',
      description: approvalRequest.description || '',
      files: approvalRequest.files || []
    });

    // Add all revisions from revisionHistory array
    if (approvalRequest.revisionHistory && approvalRequest.revisionHistory.length > 0) {
      for (const revision of approvalRequest.revisionHistory) {
        // Check if this is a unit action (requestedBy) or user resubmission (respondedBy only)
        const isUnitAction = revision.requestedBy && !revision.respondedBy;
        const isUserResubmission = revision.respondedBy && !revision.requestedBy;
        
        if (isUnitAction) {
          // This is a unit requesting revision
          let requestedByUser = await User.findById(revision.requestedBy).select('fName lName unitTeam');
          
          console.log('🔍 [API] Unit action revision:', {
            revisionNotes: revision.revisionNotes,
            notes: revision.notes,
            description: revision.description,
            hasRevisionNotes: !!revision.revisionNotes,
            revisionNotesType: typeof revision.revisionNotes,
            requestedByUser
          });
          
          revisions.push({
            requestedBy: requestedByUser ? {
              _id: requestedByUser._id,
              fName: requestedByUser.fName,
              lName: requestedByUser.lName,
              unitTeam: requestedByUser.unitTeam
            } : revision.requestedBy,
            requestedAt: revision.requestedAt,
            revisionNotes: revision.revisionNotes || revision.notes || revision.description || '',
            revisionFiles: revision.revisionFiles || revision.files || [],
            status: revision.status,
            type: revision.revisionNotes && revision.revisionNotes.includes('approved') ? 'approved' : 'revision'
          });
        } else if (isUserResubmission) {
          // This is a user resubmitting after revision
          let respondedByUser = await User.findById(revision.respondedBy).select('fName lName');
          
          console.log('🔍 [API] User resubmission:', {
            responseNotes: revision.responseNotes,
            notes: revision.notes,
            description: revision.description,
            hasResponseNotes: !!revision.responseNotes,
            responseNotesType: typeof revision.responseNotes,
            respondedByUser
          });
          
          revisions.push({
            respondedBy: respondedByUser ? {
              _id: respondedByUser._id,
              fName: respondedByUser.fName,
              lName: respondedByUser.lName
            } : revision.respondedBy,
            respondedAt: revision.respondedAt,
            responseNotes: revision.responseNotes || revision.notes || revision.description || '',
            responseFiles: revision.responseFiles || revision.files || [],
            type: 'resubmitted',
            status: revision.status
          });
        }
      }
    }

    // Sort by timestamp
    revisions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      revisions: revisions
    });
  } catch (err) {
    console.error('Error fetching revision history:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch revision history', details: err.message, revisions: [] });
  }
});

/**
 * GET /api/service-revision-history/:requestId
 * API endpoint to get revision history for a service request
 */
router.get('/api/service-revision-history/:requestId', requireLogin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not authenticated', revisions: [] });
    }

    // Find the service request
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('userId', 'fName lName');

    if (!serviceRequest) {
      return res.json({ success: true, revisions: [], message: 'Service request not found' });
    }

    // SERVER-SIDE DEBUGGING
    console.log('[API] Service Revision History Request for:', requestId);
    console.log('[API] Service Request Status:', serviceRequest.status);
    console.log('[API] Has deliverables:', !!(serviceRequest.deliverables && serviceRequest.deliverables.length));
    console.log('[API] Deliverables count:', serviceRequest.deliverables ? serviceRequest.deliverables.length : 0);
    console.log('[API] Has revisionHistory array:', !!serviceRequest.revisionHistory);
    console.log('[API] RevisionHistory length:', serviceRequest.revisionHistory ? serviceRequest.revisionHistory.length : 0);
    if (serviceRequest.revisionHistory && serviceRequest.revisionHistory.length > 0) {
      serviceRequest.revisionHistory.forEach((rev, idx) => {
        console.log(`[API] RevisionHistory[${idx}]:`, {
          type: rev.revisionType || rev.type,
          hasRequestedBy: !!rev.requestedBy,
          hasRespondedBy: !!rev.respondedBy,
          status: rev.status,
          deliverableFiles: rev.deliverableFiles ? rev.deliverableFiles.length : 0
        });
      });
    }

    // Check access permissions
    if (user.role !== 'admin' && user.role !== 'unit' && serviceRequest.userId._id.toString() !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'Access denied', revisions: [] });
    }

    // Build revision history
    const revisions = [];

    // Add initial submission
    revisions.push({
      type: 'initial',
      timestamp: serviceRequest.createdAt,
      by: serviceRequest.userId ? `${serviceRequest.userId.fName} ${serviceRequest.userId.lName}` : 'Unknown',
      description: serviceRequest.description || '',
      files: serviceRequest.files || []
    });

    // LEGACY SUPPORT: If deliverables exist but no revisionHistory, create a synthetic entry
    if (serviceRequest.deliverables && serviceRequest.deliverables.length > 0 && 
        (!serviceRequest.revisionHistory || serviceRequest.revisionHistory.length === 0)) {
      console.log('[API] Legacy deliverables detected - creating synthetic revision entry');
      revisions.push({
        type: 'deliverable_submitted',
        requestedAt: serviceRequest.updatedAt || serviceRequest.createdAt,
        revisionNotes: 'Deliverables uploaded (legacy)',
        deliverableFiles: serviceRequest.deliverables,
        status: serviceRequest.status.toLowerCase().replace(/\s+/g, '_'),
        requestedBy: {
          fName: 'Unit',
          lName: 'Team',
          unitTeam: serviceRequest.assignedUnits || 'Unknown'
        }
      });
    }

    // Add all revisions from revisionHistory array
    if (serviceRequest.revisionHistory && serviceRequest.revisionHistory.length > 0) {
      for (const revision of serviceRequest.revisionHistory) {
        // Unit actions have requestedBy field (deliverable uploads, completions)
        // User actions have respondedBy field (revision requests)
        const isUnitAction = revision.requestedBy !== undefined && revision.requestedBy !== null;
        const isUserAction = revision.respondedBy !== undefined && revision.respondedBy !== null;
        
        if (isUnitAction) {
          // Unit action (deliverable upload, completion, etc.)
          let requestedByUser = null;
          try {
            requestedByUser = await User.findById(revision.requestedBy).select('fName lName unitTeam');
          } catch (err) {
            console.log('Error populating user for revision:', err);
          }
          
          revisions.push({
            requestedBy: requestedByUser ? {
              _id: requestedByUser._id,
              fName: requestedByUser.fName,
              lName: requestedByUser.lName,
              unitTeam: requestedByUser.unitTeam
            } : null,
            requestedAt: revision.requestedAt,
            revisionNotes: revision.revisionNotes || '',
            deliverableFiles: revision.deliverableFiles || [],
            status: revision.status,
            type: revision.revisionType || revision.type || 'deliverable_submitted',
            revisionNumber: revision.revisionNumber || 0
          });
        } else if (isUserAction) {
          // User action (revision request, resubmission)
          let respondedByUser = null;
          try {
            respondedByUser = await User.findById(revision.respondedBy).select('fName lName');
          } catch (err) {
            console.log('Error populating user for revision:', err);
          }
          
          revisions.push({
            respondedBy: respondedByUser ? {
              _id: respondedByUser._id,
              fName: respondedByUser.fName,
              lName: respondedByUser.lName
            } : null,
            respondedAt: revision.respondedAt,
            responseNotes: revision.responseNotes || revision.revisionNotes || '',
            responseFiles: revision.responseFiles || revision.revisionFiles || [],
            type: revision.revisionType || revision.type || 'revision_requested',
            status: revision.status,
            revisionNumber: revision.revisionNumber || 0
          });
        }
      }
    }

    res.json({
      success: true,
      revisions: revisions
    });
  } catch (err) {
    console.error('Error fetching service revision history:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch revision history', details: err.message, revisions: [] });
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

    // Mark messages as read and add read receipts
    let hasChanges = false;
    const currentUserId = req.session.userId;
    const currentTime = new Date();
    
    conversation.messages.forEach(message => {
      // Only mark as read if not sent by current user
      if (message.senderId.toString() !== currentUserId) {
        // Check if user already marked as read
        const alreadyRead = message.readBy && message.readBy.some(
          reader => reader.userId.toString() === currentUserId
        );
        
        if (!alreadyRead) {
          if (!message.readBy) {
            message.readBy = [];
          }
          message.readBy.push({
            userId: currentUserId,
            readAt: currentTime
          });
          message.isRead = true;
          hasChanges = true;
        }
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


// Get request volume over time
router.get('/admin/request-volume', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate date labels
    const labels = [];
    const approvalCounts = [];
    const serviceCounts = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Count approvals for this date
      const approvalCount = await ApprovalRequest.countDocuments({
        createdAt: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() + 1))
        }
      });
      approvalCounts.push(approvalCount);

      // Count services for this date
      const serviceCount = await ServiceRequest.countDocuments({
        createdAt: {
          $gte: new Date(dateStr),
          $lt: new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() + 1))
        }
      });
      serviceCounts.push(serviceCount);
    }

    res.json({
      success: true,
      labels,
      approvals: approvalCounts,
      services: serviceCounts
    });
  } catch (error) {
    console.error('Error fetching request volume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;