// ===== Admin Routes =====
// This module handles all administrator-facing routes and functionality
// Includes admin dashboard, user management, request management, and admin APIs

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const Notification = require('../models/Notification');
const BroadcastMessage = require('../models/BroadcastMessage');
const SystemSettings = require('../models/SystemSettings');
const RequestType = require('../models/RequestType');
const Page = require('../models/Page');
const { requireAdmin } = require('../middleware/auth');
const { upload, UPLOADS_DIR } = require('../config/upload');
const notificationService = require('../services/notificationService');
const settingsService = require('../services/settingsService');
const reportService = require('../services/reportService');
const announcementService = require('../services/announcementService');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Debug: indicate admin routes module loaded
console.log('[routes/admin] admin routes module loaded');

/**
 * GET /admin
 * Admin dashboard with statistics and overview
 */
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    const approvals = await RequestApproval.find().populate('userId').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId').lean();

    // Filter by status
    const pendingApprovals = approvals.filter(a => a.status?.toLowerCase() === 'pending')
      .map(a => {
        // Determine display organization
        let displayOrganization = a.organization || 'N/A';
        if (a.userId) {
          if (a.userId.userType === 'nonstudent') {
            displayOrganization = Array.isArray(a.userId.affiliation)
              ? a.userId.affiliation.join(', ')
              : (a.userId.affiliation || a.organization || 'N/A');
          } else {
            displayOrganization = Array.isArray(a.userId.studentOrganization)
              ? a.userId.studentOrganization.join(', ')
              : (a.userId.studentOrganization || a.organization || 'N/A');
          }
        }
        return { ...a, requestType: 'approval', displayOrganization };
      });
    const pendingServices = serviceRequests.filter(s => s.status?.toLowerCase() === 'pending')
      .map(s => {
        // Determine display organization
        let displayOrganization = s.organization || 'N/A';
        if (s.userId) {
          if (s.userId.userType === 'nonstudent') {
            displayOrganization = Array.isArray(s.userId.affiliation)
              ? s.userId.affiliation.join(', ')
              : (s.userId.affiliation || s.organization || 'N/A');
          } else {
            displayOrganization = Array.isArray(s.userId.studentOrganization)
              ? s.userId.studentOrganization.join(', ')
              : (s.userId.studentOrganization || s.organization || 'N/A');
          }
        }
        return { ...s, requestType: 'service', displayOrganization };
      });
    const awaitingApprovalReqs = [...approvals, ...serviceRequests].filter(r => 
      r.status?.toLowerCase() === 'awaiting approval' || r.status?.toLowerCase() === 'awaiting-approval'
    );
    const inRevisionReqs = [...approvals, ...serviceRequests].filter(r => 
      r.status?.toLowerCase() === 'for revision' || r.status?.toLowerCase() === 'for-revision' || r.status?.toLowerCase() === 'in revision'
    );
    const completedReqs = [...approvals, ...serviceRequests].filter(r => 
      r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'done'
    );

    // Calculate total pending (not completed)
    const totalRequests = approvals.length + serviceRequests.length;
    const totalPending = totalRequests - completedReqs.length;

    // Get pending requests for admin action list (sorted by most recent)
    // Convert any pending status to approved
  const allPendingRequests = [...pendingApprovals, ...pendingServices]
      .map(req => ({ ...req, status: 'approved' }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate requests by unit (from user's organization)
    const allRequests = [...approvals, ...serviceRequests];
    const requestsByUnit = {};
    allRequests.forEach(req => {
      if (req.userId && req.userId.organization) {
        const unit = req.userId.organization;
        requestsByUnit[unit] = (requestsByUnit[unit] || 0) + 1;
      }
    });

    // Get ALL unassigned tasks with priority classification
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const unassignedTasks = allRequests.filter(req => {
      const isUnassigned = !req.assignedUnits || req.assignedUnits === 'Not yet assigned';
      const isPending = req.status?.toLowerCase() === 'pending';
      return isUnassigned && isPending;
    }).map(req => {
      const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
      const deadline = req.deadline ? new Date(req.deadline) : null;
      
      // Determine priority level
      let priority = 'low';
      let priorityLabel = 'No Deadline';
      let priorityColor = '#6b7280';
      
      if (deadline && deadline >= now) {
        if (deadline <= oneDayFromNow) {
          priority = 'critical';
          priorityLabel = 'Critical';
          priorityColor = '#dc2626';
        } else if (deadline <= threeDaysFromNow) {
          priority = 'urgent';
          priorityLabel = 'Urgent';
          priorityColor = '#f59e0b';
        } else if (deadline <= sevenDaysFromNow) {
          priority = 'moderate';
          priorityLabel = 'Moderate';
          priorityColor = '#f97316';
        } else {
          priority = 'low';
          priorityLabel = 'Low';
          priorityColor = '#10b981';
        }
      }
      
      // Determine display organization
      let displayOrganization = req.organization || 'N/A';
      if (req.userId) {
        if (req.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(req.userId.affiliation)
            ? req.userId.affiliation.join(', ')
            : (req.userId.affiliation || req.organization || 'N/A');
        } else {
          displayOrganization = Array.isArray(req.userId.studentOrganization)
            ? req.userId.studentOrganization.join(', ')
            : (req.userId.studentOrganization || req.organization || 'N/A');
        }
      }
      
      return {
        ...req,
        requestType: isService ? 'service' : 'approval',
        priority,
        priorityLabel,
        priorityColor,
        displayOrganization
      };
    }).sort((a, b) => {
      // Sort by priority first, then by deadline
      const priorityOrder = { critical: 0, urgent: 1, moderate: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // If same priority, sort by deadline (earliest first)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
    
    const urgentCount = unassignedTasks.filter(t => t.priority === 'critical' || t.priority === 'urgent').length;

    // Get very recent requests (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const recentRequests = allRequests
      .filter(req => {
        const createdDate = req.createdAt ? new Date(req.createdAt) : null;
        return createdDate && createdDate >= sevenDaysAgo;
      })
      .map(req => {
        const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
        let displayOrganization = req.organization || 'N/A';
        if (req.userId) {
          if (req.userId.userType === 'nonstudent') {
            displayOrganization = Array.isArray(req.userId.affiliation)
              ? req.userId.affiliation.join(', ')
              : (req.userId.affiliation || req.organization || 'N/A');
          } else {
            displayOrganization = Array.isArray(req.userId.studentOrganization)
              ? req.userId.studentOrganization.join(', ')
              : (req.userId.studentOrganization || req.organization || 'N/A');
          }
        }
        return {
          ...req,
          requestType: isService ? 'service' : 'approval',
          displayOrganization
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Get urgent and overdue tasks
    const urgentAndOverdueTasks = allRequests
      .filter(req => {
        const deadline = req.deadline ? new Date(req.deadline) : null;
        const isUrgent = deadline && deadline <= threeDaysFromNow;
        const isOverdue = deadline && deadline < now;
        const notCompleted = req.status?.toLowerCase() !== 'completed' && req.status?.toLowerCase() !== 'done';
        return (isUrgent || isOverdue) && notCompleted;
      })
      .map(req => {
        const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
        const deadline = req.deadline ? new Date(req.deadline) : null;
        const isOverdue = deadline && deadline < now;
        const daysLeft = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;
        
        let priority = 'low';
        let priorityColor = '#10b981';
        if (isOverdue) {
          priority = 'overdue';
          priorityColor = '#dc2626';
        } else if (deadline && deadline <= oneDayFromNow) {
          priority = 'critical';
          priorityColor = '#dc2626';
        } else if (deadline && deadline <= threeDaysFromNow) {
          priority = 'urgent';
          priorityColor = '#f59e0b';
        }

        return {
          ...req,
          requestType: isService ? 'service' : 'approval',
          priority,
          priorityColor,
          daysLeft,
          isOverdue
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        return 0;
      })
      .slice(0, 5);

    // Get top requests by revision count
    const requestsWithRevisions = allRequests
      .filter(req => req.revisionHistory && Array.isArray(req.revisionHistory) && req.revisionHistory.length > 0)
      .map(req => {
        const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
        const revisionCount = req.revisionHistory.length;
        
        return {
          ...req,
          requestType: isService ? 'service' : 'approval',
          revisionCount
        };
      })
      .sort((a, b) => b.revisionCount - a.revisionCount)
      .slice(0, 5);

    const stats = {
      totalUsers: users.length,
      totalApprovals: approvals.length,
      totalServices: serviceRequests.length,
      pendingApprovals: pendingApprovals.length,
      pendingServices: pendingServices.length,
      awaitingApproval: awaitingApprovalReqs.length,
      inRevision: inRevisionReqs.length,
      totalPending: totalPending,
      requestsByUnit: requestsByUnit,
      urgentUnassigned: urgentCount,
      totalUnassigned: unassignedTasks.length
    };

    res.render('Admin/adminpage', {
      user: req.user,
      name: `${req.user.fName}`,
      users,
      approvals,
      serviceRequests,
      pendingRequests: allPendingRequests,
      unassignedTasks: unassignedTasks,
      recentRequests: recentRequests,
      urgentTasks: urgentAndOverdueTasks,
      revisionRequests: requestsWithRevisions,
      stats
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load admin page.' });
  }
});

/**
 * GET /admin/analytics
 * Analytics & Performance Insights page with detailed charts and metrics
 */
router.get('/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().populate('userId').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId').lean();

    const pendingApprovals = approvals.filter(a => a.status?.toLowerCase() === 'pending');
    const pendingServices = serviceRequests.filter(s => s.status?.toLowerCase() === 'pending');

    // Get ALL unassigned tasks with priority classification
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const allRequests = [...approvals, ...serviceRequests];
    
    const unassignedTasks = allRequests.filter(req => {
      const isUnassigned = !req.assignedUnits || req.assignedUnits === 'Not yet assigned';
      const isPending = req.status?.toLowerCase() === 'pending';
      return isUnassigned && isPending;
    }).map(req => {
      const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
      const deadline = req.deadline ? new Date(req.deadline) : null;
      
      let priority = 'low';
      let priorityLabel = 'No Deadline';
      let priorityColor = '#6b7280';
      
      if (deadline && deadline >= now) {
        if (deadline <= oneDayFromNow) {
          priority = 'critical';
          priorityLabel = 'Critical';
          priorityColor = '#dc2626';
        } else if (deadline <= threeDaysFromNow) {
          priority = 'urgent';
          priorityLabel = 'Urgent';
          priorityColor = '#f59e0b';
        } else if (deadline <= sevenDaysFromNow) {
          priority = 'moderate';
          priorityLabel = 'Moderate';
          priorityColor = '#f97316';
        } else {
          priority = 'low';
          priorityLabel = 'Low';
          priorityColor = '#10b981';
        }
      }
      
      // Determine display organization
      let displayOrganization = req.organization || 'N/A';
      if (req.userId) {
        if (req.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(req.userId.affiliation)
            ? req.userId.affiliation.join(', ')
            : (req.userId.affiliation || req.organization || 'N/A');
        } else {
          displayOrganization = Array.isArray(req.userId.studentOrganization)
            ? req.userId.studentOrganization.join(', ')
            : (req.userId.studentOrganization || req.organization || 'N/A');
        }
      }
      
      return {
        ...req,
        requestType: isService ? 'service' : 'approval',
        priority,
        priorityLabel,
        priorityColor,
        displayOrganization
      };
    }).sort((a, b) => {
      const priorityOrder = { critical: 0, urgent: 1, moderate: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
    
    const urgentCount = unassignedTasks.filter(t => t.priority === 'critical' || t.priority === 'urgent').length;

    const stats = {
      totalApprovals: approvals.length,
      totalServices: serviceRequests.length,
      pendingApprovals: pendingApprovals.length,
      pendingServices: pendingServices.length,
      urgentUnassigned: urgentCount,
      totalUnassigned: unassignedTasks.length
    };

    res.render('Admin/analytics', {
      user: req.user,
      stats,
      unassignedTasks
    });
  } catch (err) {
    console.error('Error loading analytics page:', err);
    res.status(500).render('error', { message: 'Failed to load analytics page.' });
  }
});

/**
 * GET /admin/profile
 * Admin profile display page
 */
router.get('/admin/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    res.render('Admin/profileadmin', { user });
  } catch (err) {
    console.error('Error loading admin profile:', err);
    res.status(500).render('error', { message: 'Failed to load profile page.' });
  }
});

/**
 * GET /admin/announcement
 * Render admin announcement page
 */
router.get('/admin/announcement', requireAdmin, async (req, res) => {
  try {
    console.log('[routes/admin] GET /admin/announcement accessed by:', req.session?.userId || 'no-session');
    // Load users and organizations for selection
    const users = await User.find().select('fName lName email organization affiliation studentOrganization').lean();

    // Build a list of organizations from various possible fields
    const orgs = new Set();
    users.forEach(u => {
      if (u.organization) orgs.add(u.organization);
      if (u.affiliation) {
        if (Array.isArray(u.affiliation)) u.affiliation.forEach(a => a && orgs.add(a));
        else orgs.add(u.affiliation);
      }
      if (u.studentOrganization) {
        if (Array.isArray(u.studentOrganization)) u.studentOrganization.forEach(a => a && orgs.add(a));
        else orgs.add(u.studentOrganization);
      }
    });

    res.render('Admin/Announcementpage', {
      user: req.user,
      users,
      organizations: Array.from(orgs).filter(Boolean).sort()
    });
  } catch (err) {
    console.error('Error loading announcement page:', err);
    res.status(500).render('error', { message: 'Failed to load announcement page.' });
  }
});

/**
 * POST /admin/announcement/send
 * Create a broadcast message and send notifications
 */
router.post('/admin/announcement/send', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority, recipientType, specificUsers, organization } = req.body;
    if (!title || !content) {
      return res.status(400).send('Title and content are required');
    }

    let recipients = [];

    if (recipientType === 'all') {
      const allUsers = await User.find().select('_id').lean();
      recipients = allUsers.map(u => u._id);
    } else if (recipientType === 'specific') {
      // specificUsers may be comma-separated ids
      let ids = specificUsers || '';
      if (Array.isArray(ids)) ids = ids.join(',');
      recipients = ids.split(',').map(s => s.trim()).filter(Boolean);
    } else if (recipientType === 'organization') {
      const org = organization;
      if (org) {
        // match in organization, affiliation, or studentOrganization
        const matched = await User.find({
          $or: [
            { organization: org },
            { affiliation: org },
            { studentOrganization: org }
          ]
        }).select('_id').lean();
        recipients = matched.map(u => u._id);
      }
    }

    // Ensure unique recipients
    recipients = Array.from(new Set(recipients.map(r => r.toString())));

    // Save BroadcastMessage document
    const broadcast = new BroadcastMessage({
      title,
      content,
      priority: priority || 'medium',
      sentBy: req.user._id,
      isVisibleToAll: recipientType === 'all',
      recipients: recipients.map(id => ({ userId: id }))
    });

    await broadcast.save();

    // Create notifications
    if (recipients.length > 0) {
      await notificationService.notifySystem(recipients, title, content, priority || 'medium');
    }

    res.redirect('/admin?announcement=sent');
  } catch (err) {
    console.error('Error sending announcement:', err);
    res.status(500).render('error', { message: 'Failed to send announcement.' });
  }
});

/**
 * GET /admin/approvals
 * Admin view of all approval requests with display organization logic
 */
router.get('/admin/approvals', requireAdmin, async (req, res) => {
  try {
    let approvals = await RequestApproval.find({ isDeleted: { $ne: true } })
      .populate('userId')
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file allowAdditionalFileUpload createdAt updatedAt')
      .lean();

    // Add display organization logic
    approvals = approvals.map(approval => {
      let displayOrganization = approval.organization;

      if (approval.userId) {
        if (approval.userId.userType === 'student') {
          displayOrganization = Array.isArray(approval.userId.studentOrganization)
            ? approval.userId.studentOrganization.join(', ')
            : approval.userId.studentOrganization;
        } else if (approval.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(approval.userId.affiliation)
            ? approval.userId.affiliation.join(', ')
            : approval.userId.affiliation;
        }
      }

      return {
        ...approval,
        displayOrganization: displayOrganization || approval.organization,
        specificRequestType: approval.specificRequestType || 'Not specified'
      };
    });

    res.render('Admin/approvals', { approvals: approvals, user: req.user });
  } catch (err) {
    console.error('Error fetching admin approvals:', err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

/**
 * GET /admin/approvals/:id
 * Direct access to specific approval request with modal open
 */
router.get('/admin/approvals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let approvals = await RequestApproval.find()
      .populate('userId')
      .lean();

    // Add display organization logic
    approvals = approvals.map(approval => ({
      ...approval,
      displayOrganization:
        approval.userId?.userType === 'nonstudent'
          ? approval.userId.affiliation
          : approval.organization
    }));

    // Status priority for sorting
    const statusPriority = {
      "pending": 1,
      "for revision": 2,
      "approved": 3,
      "rejected": 4,
      "archived": 5
    };

    // Sort according to status rules
    approvals.sort((a, b) => {
      const aStatus = a.status?.toLowerCase() || '';
      const bStatus = b.status?.toLowerCase() || '';

      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      if (aStatus === "pending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (aStatus === "for revision") {
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;

        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;

        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (["approved", "rejected", "archived"].includes(aStatus)) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    res.render('Admin/approvals', { approvals, user: req.user, openModalId: id });
  } catch (err) {
    console.error('Error loading admin approvals:', err);
    res.status(500).send('Error loading approvals page');
  }
});

/**
 * GET /admin/services
 * Admin view of all service requests
 */
router.get('/admin/services', requireAdmin, async (req, res) => {
  try {
    let serviceRequests = await ServiceRequest.find()
      .populate('userId')
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file allowAdditionalFileUpload createdAt updatedAt')
      .lean();

    // Status priority for sorting
    const statusPriority = {
      "pending": 1,
      "approved": 2,
      "for revision": 3,
      "completed": 4,
      "rejected": 5,
      "archived": 6
    };

    // Sort service requests according to rules
    serviceRequests.sort((a, b) => {
      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      if (aStatus === "pending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (aStatus === "approved" || aStatus === "for revision") {
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;

        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;

        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (["completed", "rejected", "archived"].includes(aStatus)) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    // Add display organization and datetime logic
    const serviceRequestsWithDisplay = serviceRequests.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? (Array.isArray(service.userId.affiliation) ? service.userId.affiliation.join(', ') : service.userId.affiliation)
        : service.organization,
      datetime: service.datetime || service.createdAt,
      specificRequestType: service.specificRequestType || 'Not specified'
    }));

    res.render('Admin/services', { serviceRequests: serviceRequestsWithDisplay, user: req.user });
  } catch (err) {
    console.error('Error loading admin services:', err);
    res.status(500).send('Error loading services page');
  }
});

/**
 * GET /admin/services/:id
 * Direct access to specific service request with modal open
 */
router.get('/admin/services/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let serviceRequests = await ServiceRequest.find()
      .populate('userId')
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file allowAdditionalFileUpload createdAt updatedAt')
      .lean();

    // Status priority for sorting
    const statusPriority = {
      "pending": 1,
      "approved": 2,
      "for revision": 3,
      "completed": 4,
      "rejected": 5,
      "archived": 6
    };

    serviceRequests.sort((a, b) => {
      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      if (aStatus === "pending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (aStatus === "approved" || aStatus === "for revision") {
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;

        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;

        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (["completed", "rejected", "archived"].includes(aStatus)) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    // Add display organization logic
    const serviceRequestsWithDisplay = serviceRequests.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? (Array.isArray(service.userId.affiliation) ? service.userId.affiliation.join(', ') : service.userId.affiliation)
        : service.organization,
      datetime: service.datetime || service.createdAt,
      specificRequestType: service.specificRequestType || 'Not specified'
    }));

    res.render('Admin/services', { serviceRequests: serviceRequestsWithDisplay, user: req.user, openModalId: id });
  } catch (err) {
    console.error('Error loading admin services:', err);
    res.status(500).send('Error loading services page');
  }
});

/**
 * GET /admin/users
 * Admin view of all users for management
 */
router.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find().lean();

  const usersWithDisplay = users.map(user => ({
    ...user,
    displayOrganization: user.userType === 'nonstudent'
  ? (Array.isArray(user.affiliation) ? user.affiliation.join(', ') : user.affiliation)
  : (Array.isArray(user.studentOrganization) ? user.studentOrganization.join(', ') : user.studentOrganization)
  }));

  res.render('Admin/users', { users: usersWithDisplay, user: req.user });
});

/**
 * GET /admin/all-requests
 * Combined admin view of all requests from all users
 */
router.get('/admin/all-requests', requireAdmin, async (req, res) => {
  try {
    // Fetch with proper population and error handling (exclude deleted items)
    const approvals = await RequestApproval.find({ isDeleted: { $ne: true } })
      .populate({
        path: 'userId',
        select: 'fName lName userType affiliation studentOrganization',
        options: { strictPopulate: false } // Don't fail if user is missing
      })
      .lean();

    const serviceRequests = await ServiceRequest.find({ isDeleted: { $ne: true } })
      .populate({
        path: 'userId',
        select: 'fName lName userType affiliation studentOrganization',
        options: { strictPopulate: false }
      })
      .lean();

    // Process requests and ensure user data is always available
    const allRequests = [
      ...approvals.map(r => {
        // Ensure user data exists
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        } else {
          userName = 'Unknown User';
        }

        return {
          ...r,
          type: "Request Approval",
          displayOrganization,
          userName,
          datetime: r.datetime || r.createdAt
        };
      }),
      ...serviceRequests.map(r => {
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        } else {
          userName = 'Unknown User';
        }

        return {
          ...r,
          type: "Service Request",
          displayOrganization,
          userName,
          datetime: r.datetime || r.createdAt
        };
      })
    ];

    // Combined sorting priority
    const getStatusPriority = (request) => {
      const status = request.status.toLowerCase();
      const type = request.type;

      if (status === "pending") return 1;

      if (type === "Request Approval") {
        const approvalPriority = {
          "for revision": 2,
          "approved": 3,
          "rejected": 4,
          "archived": 5
        };
        return approvalPriority[status] ?? 999;
      } else {
        const servicePriority = {
          "approved": 2,
          "for revision": 3,
          "completed": 4,
          "rejected": 5,
          "archived": 6
        };
        return servicePriority[status] ?? 999;
      }
    };

    // Sort combined requests
    allRequests.sort((a, b) => {
      const aPriority = getStatusPriority(a);
      const bPriority = getStatusPriority(b);

      if (aPriority !== bPriority) return aPriority - bPriority;

      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      if (aStatus === "pending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (a.type === "Request Approval") {
        if (aStatus === "for revision") {
          const aDeadline = a.deadline ? new Date(a.deadline) : null;
          const bDeadline = b.deadline ? new Date(b.deadline) : null;
          if (aDeadline && bDeadline) return aDeadline - bDeadline;
          if (aDeadline && !bDeadline) return -1;
          if (!aDeadline && bDeadline) return 1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (["approved", "rejected", "archived"].includes(aStatus)) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
      } else {
        if (aStatus === "approved" || aStatus === "for revision") {
          const aDeadline = a.deadline ? new Date(a.deadline) : null;
          const bDeadline = b.deadline ? new Date(b.deadline) : null;
          if (aDeadline && bDeadline) return aDeadline - bDeadline;
          if (aDeadline && !bDeadline) return -1;
          if (!aDeadline && bDeadline) return 1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (["completed", "rejected", "archived"].includes(aStatus)) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
      }

      return 0;
    });

    res.render('Admin/allrequestsadmin', {
      allRequests,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading all admin requests:', err);
    res.status(500).render('error', { message: 'Failed to load all requests page.' });
  }
});

/**
 * GET /admin/archive
 * View archived (deleted) requests
 */
router.get('/admin/archive', requireAdmin, async (req, res) => {
  try {
    // Fetch only deleted/archived requests
    const approvals = await RequestApproval.find({ isDeleted: true })
      .populate({
        path: 'userId',
        select: 'fName lName userType affiliation studentOrganization',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'deletedBy',
        select: 'fName lName'
      })
      .lean();

    const serviceRequests = await ServiceRequest.find({ isDeleted: true })
      .populate({
        path: 'userId',
        select: 'fName lName userType affiliation studentOrganization',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'deletedBy',
        select: 'fName lName'
      })
      .lean();

    // Process archived requests
    const archivedRequests = [
      ...approvals.map(r => {
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';
        let deletedByName = 'Unknown';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        }

        if (r.deletedBy && r.deletedBy.fName) {
          deletedByName = `${r.deletedBy.fName} ${r.deletedBy.lName || ''}`.trim();
        }

        return {
          ...r,
          type: "Request Approval",
          displayOrganization,
          userName,
          deletedByName,
          datetime: r.datetime || r.createdAt
        };
      }),
      ...serviceRequests.map(r => {
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';
        let deletedByName = 'Unknown';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        }

        if (r.deletedBy && r.deletedBy.fName) {
          deletedByName = `${r.deletedBy.fName} ${r.deletedBy.lName || ''}`.trim();
        }

        return {
          ...r,
          type: "Service Request",
          displayOrganization,
          userName,
          deletedByName,
          datetime: r.datetime || r.createdAt
        };
      })
    ];

    // Sort by deleted date (most recent first)
    archivedRequests.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.render('Admin/archive', {
      archivedRequests,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading archived requests:', err);
    res.status(500).render('error', { message: 'Failed to load archived requests page.' });
  }
});

/**
 * GET /api/admin/deleted-requests
 * API endpoint to get deleted/archived requests as JSON
 * Query params: type (optional) - 'all', 'Request Approval', 'Service Request'
 */
router.get('/api/admin/deleted-requests', requireAdmin, async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let deletedRequests = [];

    // Fetch approvals if type is 'all' or 'Request Approval'
    if (type === 'all' || type === 'Request Approval') {
      const approvals = await RequestApproval.find({ isDeleted: true })
        .populate({
          path: 'userId',
          select: 'fName lName userType affiliation studentOrganization',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'deletedBy',
          select: 'fName lName'
        })
        .lean();

      deletedRequests.push(...approvals.map(r => {
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';
        let deletedByName = 'Unknown';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        }

        if (r.deletedBy && r.deletedBy.fName) {
          deletedByName = `${r.deletedBy.fName} ${r.deletedBy.lName || ''}`.trim();
        }

        return {
          _id: r._id,
          type: "Request Approval",
          title: r.title,
          displayOrganization,
          userName,
          deletedByName,
          deletedAt: r.deletedAt,
          datetime: r.datetime || r.createdAt
        };
      }));
    }

    // Fetch service requests if type is 'all' or 'Service Request'
    if (type === 'all' || type === 'Service Request') {
      const serviceRequests = await ServiceRequest.find({ isDeleted: true })
        .populate({
          path: 'userId',
          select: 'fName lName userType affiliation studentOrganization',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'deletedBy',
          select: 'fName lName'
        })
        .lean();

      deletedRequests.push(...serviceRequests.map(r => {
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';
        let deletedByName = 'Unknown';

        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent'
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        }

        if (r.deletedBy && r.deletedBy.fName) {
          deletedByName = `${r.deletedBy.fName} ${r.deletedBy.lName || ''}`.trim();
        }

        return {
          _id: r._id,
          type: "Service Request",
          title: r.title,
          displayOrganization,
          userName,
          deletedByName,
          deletedAt: r.deletedAt,
          datetime: r.datetime || r.createdAt
        };
      }));
    }

    // Sort by deleted date (most recent first)
    deletedRequests.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json({
      success: true,
      deletedRequests
    });
  } catch (err) {
    console.error('Error fetching deleted requests:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted requests.'
    });
  }
});

/**
 * GET /api/admin/deleted-users
 * API endpoint to get deleted users as JSON
 */
router.get('/api/admin/deleted-users', requireAdmin, async (req, res) => {
  try {
    const deletedUsers = await User.find({ isDeleted: true })
      .populate({
        path: 'deletedBy',
        select: 'fName lName'
      })
      .select('-password')
      .lean();

    const formattedUsers = deletedUsers.map(user => {
      let deletedByName = 'Unknown';
      
      if (user.deletedBy && user.deletedBy.fName) {
        deletedByName = `${user.deletedBy.fName} ${user.deletedBy.lName || ''}`.trim();
      }

      return {
        _id: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        role: user.role,
        deletedByName,
        deletedAt: user.deletedAt
      };
    });

    // Sort by deleted date (most recent first)
    formattedUsers.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json({
      success: true,
      deletedUsers: formattedUsers
    });
  } catch (err) {
    console.error('Error fetching deleted users:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted users.'
    });
  }
});

/**
 * POST /api/admin/restore-user/:userId
 * Restore a deleted user
 */
router.post('/api/admin/restore-user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isDeleted: false, 
        deletedBy: null, 
        deletedAt: null 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User restored successfully',
      user
    });
  } catch (err) {
    console.error('Error restoring user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user'
    });
  }
});

/**
 * DELETE /api/admin/delete-user-permanently/:userId
 * Permanently delete a user (hard delete)
 */
router.delete('/api/admin/delete-user-permanently/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (err) {
    console.error('Error permanently deleting user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete user'
    });
  }
});

/**
 * POST /admin/all-requests/update-status
 * Universal update endpoint for both approval and service requests from all-requests page
 */
router.post('/admin/all-requests/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits, deadline, requestType } = req.body;

  try {
    if (!requestId || !requestType) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and request type are required'
      });
    }

    let updateData = {
      status: status || 'Pending'
    };

    // Handle assignedUnits - convert empty string to "Not yet assigned"
    if (assignedUnits !== undefined) {
      updateData.assignedUnits = assignedUnits || 'Not yet assigned';
    }

    // Handle deadline for service requests
    if (requestType === 'Service Request' && deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future'
        });
      }
      updateData.deadline = deadlineDate;
    }

    let result;
    let updateTimestamp = new Date();

    if (requestType === 'Request Approval') {
      // Set allowAdditionalFileUpload to true when status is set to "For revision"
      if (status?.toLowerCase() === 'for revision') {
        updateData.allowAdditionalFileUpload = true;
      }
      result = await RequestApproval.findByIdAndUpdate(requestId, updateData, { new: true });
    } else if (requestType === 'Service Request') {
      if (assignedUnits !== undefined && status) {
        updateData.status = status;
      }
      result = await ServiceRequest.findByIdAndUpdate(requestId, updateData, { new: true });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type'
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Send appropriate notifications based on status and request type
    try {
      const statusLower = status?.toLowerCase();
      
      if (requestType === 'Request Approval') {
        // Populate userId if it's not already populated
        const approval = await RequestApproval.findById(requestId).populate('userId');
        
        if (approval && approval.userId) {
          if (statusLower === 'approved') {
            await notificationService.notifyApprovalApproved(requestId, approval.userId._id, req.user._id);
          } else if (statusLower === 'rejected') {
            await notificationService.notifyApprovalRejected(requestId, approval.userId._id, req.user._id);
          } else if (statusLower === 'for revision') {
            await notificationService.notifyApprovalRevision(requestId, approval.userId._id, req.user._id);
          }
        }
      } else if (requestType === 'Service Request') {
        // Populate userId if it's not already populated
        const service = await ServiceRequest.findById(requestId).populate('userId');
        
        if (service && service.userId) {
          if (statusLower === 'approved') {
            await notificationService.notifyServiceApproved(requestId, service.userId._id, req.user._id, assignedUnits);
          } else if (statusLower === 'rejected') {
            await notificationService.notifyServiceRejected(requestId, service.userId._id, req.user._id);
          } else if (statusLower === 'completed') {
            await notificationService.notifyServiceCompleted(requestId, service.userId._id, req.user._id);
          }
        }
      }
    } catch (notifError) {
      console.error('Error sending status update notifications:', notifError);
      // Don't fail the request update if notification fails
    }

    res.json({
      success: true,
      message: `${requestType} updated successfully`,
      updatedRequest: {
        id: result._id,
        status: result.status,
        assignedUnits: result.assignedUnits,
        deadline: requestType === 'Service Request' && result.deadline
          ? result.deadline.toLocaleDateString()
          : null,
        updatedAt: updateTimestamp
      }
    });

  } catch (err) {
    console.error('Error updating all-requests status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update request: ' + err.message
    });
  }
});

/**
 * POST /admin/approval/update-status
 * Updates approval request status and assigned units
 */
router.post('/admin/approval/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits } = req.body;

  try {
    const update = {
      status: status || 'Pending',
      assignedUnits: assignedUnits || 'Not yet assigned'
    };

    // Set allowAdditionalFileUpload to true when status is set to "For revision"
    if (status?.toLowerCase() === 'for revision') {
      update.allowAdditionalFileUpload = true;
    }

    const result = await RequestApproval.findByIdAndUpdate(requestId, update, { new: true }).populate('userId');

    // Send notification to user
    try {
      if (result && result.userId) {
        const statusLower = status?.toLowerCase();
        
        if (statusLower === 'approved') {
          await notificationService.notifyApprovalApproved(requestId, result.userId._id, req.user._id);
        } else if (statusLower === 'rejected') {
          await notificationService.notifyApprovalRejected(requestId, result.userId._id, req.user._id);
        } else if (statusLower === 'for revision') {
          await notificationService.notifyApprovalRevision(requestId, result.userId._id, req.user._id);
        }
      }
    } catch (notifError) {
      console.error('Error sending approval update notifications:', notifError);
    }

    res.json({ success: true, message: 'Approval request updated successfully' });
  } catch (err) {
    console.error('Error updating approval status:', err);
    res.status(500).json({ success: false, message: 'Failed to update approval request.' });
  }
});

/**
 * POST /api/admin/approval/mark-viewed
 * Marks approval request as viewed by admin
 */
router.post('/api/admin/approval/mark-viewed', requireAdmin, async (req, res) => {
  const { requestId } = req.body;

  try {
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const now = new Date();
    const updatedRequest = await RequestApproval.findByIdAndUpdate(
      requestId,
      {
        viewed: true,
        viewedAt: now,
        viewedBy: req.user._id
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    res.json({
      success: true,
      message: 'Request marked as viewed',
      viewedAt: now,
      viewedBy: req.user.fName + ' ' + req.user.lName
    });
  } catch (err) {
    console.error('Error marking approval as viewed:', err);
    res.status(500).json({ success: false, message: 'Failed to mark request as viewed.' });
  }
});

/**
 * POST /api/admin/service/mark-viewed
 * Marks service request as viewed by admin
 */
router.post('/api/admin/service/mark-viewed', requireAdmin, async (req, res) => {
  const { requestId } = req.body;

  try {
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const now = new Date();
    const updatedRequest = await ServiceRequest.findByIdAndUpdate(
      requestId,
      {
        viewed: true,
        viewedAt: now,
        viewedBy: req.user._id
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    res.json({
      success: true,
      message: 'Request marked as viewed',
      viewedAt: now,
      viewedBy: req.user.fName + ' ' + req.user.lName
    });
  } catch (err) {
    console.error('Error marking service as viewed:', err);
    res.status(500).json({ success: false, message: 'Failed to mark request as viewed.' });
  }
});

/**
 * POST /admin/service/update-status
 * Updates service request status and assigned units
 */
router.post('/admin/service/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits } = req.body;

  try {
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const update = {};
    if (status) update.status = status;
    if (assignedUnits !== undefined) update.assignedUnits = assignedUnits || 'Not yet assigned';

    const result = await ServiceRequest.findByIdAndUpdate(requestId, update, { new: true }).populate('userId');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Send notification to user
    try {
      if (result && result.userId) {
        const statusLower = status?.toLowerCase();
        
        if (statusLower === 'approved') {
          await notificationService.notifyServiceApproved(requestId, result.userId._id, req.user._id, assignedUnits);
        } else if (statusLower === 'rejected') {
          await notificationService.notifyServiceRejected(requestId, result.userId._id, req.user._id);
        } else if (statusLower === 'completed') {
          await notificationService.notifyServiceCompleted(requestId, result.userId._id, req.user._id);
        }
      }
    } catch (notifError) {
      console.error('Error sending service update notifications:', notifError);
    }

    res.json({ success: true, message: 'Service request updated successfully' });
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).json({ success: false, message: 'Failed to update service request: ' + err.message });
  }
});

/**
 * POST /admin/service/update-deadline
 * Updates service request deadline
 */
router.post('/admin/service/update-deadline', requireAdmin, async (req, res) => {
  const { requestId, deadline } = req.body;

  try {
    if (!deadline) {
      return res.status(400).json({ success: false, message: 'Deadline is required' });
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Deadline must be in the future' });
    }

    await ServiceRequest.findByIdAndUpdate(requestId, { deadline: deadlineDate });
    res.json({ success: true, message: 'Deadline updated successfully' });
  } catch (err) {
    console.error('Error updating deadline:', err);
    res.status(500).json({ success: false, message: 'Failed to update deadline' });
  }
});

/**
 * POST /admin/user/update
 * Updates user role (admin/non-admin)
 */
router.post('/admin/user/update', requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required.'
      });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "user" or "admin".'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const result = await User.findByIdAndUpdate(
      userId,
      { role: role },
      { new: true, runValidators: false }
    );

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user role.'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: result._id,
        name: `${result.fName} ${result.lName}`,
        role: result.role
      }
    });

  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({
      success: false,
      message: 'Server error: Failed to update user role.'
    });
  }
});

/**
 * POST /admin/user/update-status
 * Updates user account status (approve/deny/reset)
 */
router.post('/admin/user/update-status', requireAdmin, async (req, res) => {
  const { userId, action } = req.body;

  try {
    if (!userId || !action) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and action are required' 
      });
    }

    // Map action to status
    let newStatus;
    if (action === 'approve') newStatus = 'approved';
    else if (action === 'deny') newStatus = 'denied';
    else if (action === 'reset') newStatus = 'pending';
    else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action' 
      });
    }

    // Update user status
    const user = await User.findByIdAndUpdate(
      userId, 
      { status: newStatus }, 
      { new: true }
    ).populate('role');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Send appropriate notification
    try {
      if (action === 'approve') {
        if (user.role === 'unit') {
          await notificationService.notifyUnitApproved(userId, req.user._id);
        } else {
          await notificationService.notifyUserApproved(userId, req.user._id);
        }
      } else if (action === 'deny') {
        await notificationService.notifyUserDenied(userId, req.user._id);
      }
      // Reset action doesn't send notification
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      success: true, 
      message: `User status updated to ${newStatus}`,
      newStatus 
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while updating user status' 
    });
  }
});

/**
 * GET /admin/debug/orphaned-requests
 * Debug route to check for orphaned requests
 */
router.get('/admin/debug/orphaned-requests', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Checking for orphaned requests...');

    const approvals = await RequestApproval.find().lean();
    const services = await ServiceRequest.find().lean();

    const orphanedApprovals = [];
    const orphanedServices = [];

    for (const approval of approvals) {
      if (!approval.userId) {
        orphanedApprovals.push(approval);
        continue;
      }

      const user = await User.findById(approval.userId);
      if (!user) {
        orphanedApprovals.push(approval);
      }
    }

    for (const service of services) {
      if (!service.userId) {
        orphanedServices.push(service);
        continue;
      }

      const user = await User.findById(service.userId);
      if (!user) {
        orphanedServices.push(service);
      }
    }

    console.log(`Found ${orphanedApprovals.length} orphaned approvals`);
    console.log(`Found ${orphanedServices.length} orphaned services`);

    res.json({
      orphanedApprovals: orphanedApprovals.map(r => ({
        id: r._id,
        title: r.title,
        userId: r.userId,
        createdAt: r.createdAt
      })),
      orphanedServices: orphanedServices.map(r => ({
        id: r._id,
        title: r.title,
        userId: r.userId,
        createdAt: r.createdAt
      })),
      totalApprovals: approvals.length,
      totalServices: services.length
    });
  } catch (err) {
    console.error('Error checking orphaned requests:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /admin/fix/orphaned-requests
 * Fixes orphaned requests by assigning them to admin user
 */
router.post('/admin/fix/orphaned-requests', requireAdmin, async (req, res) => {
  try {
    const defaultAdminId = req.user._id;

    const orphanedApprovals = await RequestApproval.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    const orphanedServices = await ServiceRequest.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    let fixedApprovals = 0;
    let fixedServices = 0;

    for (const approval of orphanedApprovals) {
      await RequestApproval.findByIdAndUpdate(approval._id, {
        userId: defaultAdminId
      });
      fixedApprovals++;
    }

    for (const service of orphanedServices) {
      await ServiceRequest.findByIdAndUpdate(service._id, {
        userId: defaultAdminId
      });
      fixedServices++;
    }

    console.log(`Fixed ${fixedApprovals} approval requests`);
    console.log(`Fixed ${fixedServices} service requests`);

    res.json({
      success: true,
      fixedApprovals,
      fixedServices,
      message: `Successfully fixed ${fixedApprovals + fixedServices} orphaned requests`
    });
  } catch (err) {
    console.error('Error fixing orphaned requests:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /admin/profile/update-popup
 * Updates admin profile information
 */
router.post('/admin/profile/update-popup', requireAdmin, async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  const { userId, fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, affiliation } = req.body;

  if (!userId) return res.status(400).send('Missing user ID');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const updateData = { fName, mName, lName, email, username, phoneNumber };

    if (user.userType === 'student') {
      if (typeof studentOrganization === 'string') {
        updateData.studentOrganization = studentOrganization.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(studentOrganization)) {
        updateData.studentOrganization = studentOrganization;
      } else {
        updateData.studentOrganization = [];
      }
      updateData.cys = cys;
    } else {
      if (typeof affiliation === 'string') {
        updateData.affiliation = affiliation.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(affiliation)) {
        updateData.affiliation = affiliation;
      } else {
        updateData.affiliation = [];
      }
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Admin profile update error:', err);
    res.status(500).send('Update failed: ' + err.message);
  }
});

/**
 * POST /admin/profile/change-password-popup
 * Updates admin password
 */
router.post('/admin/profile/change-password-popup', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  try {
    const user = await User.findById(req.session.userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).send('Incorrect old password');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).send('Password updated');
  } catch (err) {
    console.error('Popup password update error:', err);
    res.status(500).send('Password change failed');
  }
});

/**
 * POST /profileadmin/upload-picture
 * Uploads admin profile picture
 */
router.post('/profileadmin/upload-picture', requireAdmin, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.status(404).send('User not found.');

    if (user.profilePicture) {
      const oldPath = path.join(UPLOADS_DIR, user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Could not delete old file', e); }
      }
    }

    await User.findByIdAndUpdate(req.session.userId,
      { $set: { profilePicture: req.file.filename } },
      { runValidators: false }
    );

    res.status(200).send('Profile picture updated.');
  } catch (err) {
    console.error('Error uploading admin picture:', err);
    res.status(500).send('Error uploading picture');
  }
});

/**
 * POST /profileadmin/delete-picture
 * Deletes admin profile picture
 */
router.post('/profileadmin/delete-picture', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.status(404).send('User not found.');

    if (user.profilePicture) {
      const oldPath = path.join(UPLOADS_DIR, user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Could not delete file', e); }
      }

      await User.findByIdAndUpdate(req.session.userId, { $unset: { profilePicture: "" } }, { runValidators: false });
    }

    res.status(200).send('Profile picture deleted.');
  } catch (err) {
    console.error('Error deleting admin picture:', err);
    res.status(500).send('Error deleting picture');
  }
});

/**
 * POST /admin/toggle-additional-file-upload
 * Toggles the allowAdditionalFileUpload field for a request
 */
router.post('/admin/toggle-additional-file-upload', requireAdmin, async (req, res) => {
  const { requestId, requestType, allowAdditionalFileUpload } = req.body;

  try {
    if (!requestId || !requestType || allowAdditionalFileUpload === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Request ID, request type, and allowAdditionalFileUpload value are required'
      });
    }

    let Model;

    if (requestType === 'Request Approval') {
      Model = RequestApproval;
    } else if (requestType === 'Service Request') {
      Model = ServiceRequest;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type'
      });
    }

    // Get current request (for validation)
    const currentRequest = await Model.findById(requestId);
    if (!currentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Set to the provided value (true or false based on checkbox state)
    const result = await Model.findByIdAndUpdate(
      requestId,
      { allowAdditionalFileUpload: allowAdditionalFileUpload === 'true' || allowAdditionalFileUpload === true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const actionText = result.allowAdditionalFileUpload ? 'granted' : 'revoked';
    res.json({
      success: true,
      message: `Additional file upload permission ${actionText} successfully`,
      allowAdditionalFileUpload: result.allowAdditionalFileUpload
    });

  } catch (err) {
    console.error('Error toggling additional file upload:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle additional file upload permission'
    });
  }
});

/**
 * POST /api/admin/analytics
 * Get analytics data based on filters
 */
router.post('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const { dateRange, units, requestType, status, startDate, endDate } = req.body;
    
    // Build query based on filters
    let query = {};
    
    // Date range filter
    if (dateRange || (startDate && endDate)) {
      let dateFilter = {};
      const now = new Date();
      
      switch (dateRange) {
        case 'daily':
          dateFilter.$gte = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          dateFilter.$gte = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarterly':
          dateFilter.$gte = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'annually':
          dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter.$gte = new Date(startDate);
            dateFilter.$lte = new Date(endDate);
          }
          break;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }
    
    // Unit filter
    if (units && units.length > 0 && !units.includes('all')) {
      query.assignedUnits = { $in: units };
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = new RegExp(status, 'i');
    }
    
    // Fetch data based on request type
    let approvals = [];
    let services = [];
    
    if (!requestType || requestType === 'all' || requestType === 'approval') {
      approvals = await RequestApproval.find(query).populate('userId').lean();
    }
    
    if (!requestType || requestType === 'all' || requestType === 'service') {
      services = await ServiceRequest.find(query).populate('userId').lean();
    }
    
    // Calculate KPIs
    const totalRequests = approvals.length + services.length;
    const pendingRequests = [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'pending').length;
    const inRevision = [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'for revision').length;
    
    // Calculate average turnaround time (placeholder calculation)
    const completedRequests = [...approvals, ...services].filter(r => 
      r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'approved'
    );
    
    let totalDays = 0;
    completedRequests.forEach(req => {
      if (req.updatedAt && req.createdAt) {
        const days = Math.ceil((new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60 * 24));
        totalDays += days;
      }
    });
    
    const avgTurnaround = completedRequests.length > 0 ? (totalDays / completedRequests.length).toFixed(1) : 0;
    
    // Top requestors calculation
    const orgCounts = {};
    [...approvals, ...services].forEach(req => {
      const org = req.organization || 'Unknown';
      orgCounts[org] = (orgCounts[org] || 0) + 1;
    });
    
    const topOrgs = Object.entries(orgCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((acc, [org, count]) => {
        acc[org] = count;
        return acc;
      }, {});
    
    // Unit workload calculation
    const unitWorkload = {};
    [...approvals, ...services].forEach(req => {
      if (req.assignedUnits && req.status?.toLowerCase() !== 'completed' && req.status?.toLowerCase() !== 'rejected') {
        unitWorkload[req.assignedUnits] = (unitWorkload[req.assignedUnits] || 0) + 1;
      }
    });
    
    // Send response
    res.json({
      success: true,
      kpis: {
        totalRequests,
        avgTurnaround,
        pendingAssignment: pendingRequests,
        inRevision
      },
      charts: {
        topRequestors: topOrgs,
        unitWorkload,
        statusBreakdown: {
          pending: [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'pending').length,
          inProgress: [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'in progress').length,
          awaiting: [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'awaiting approval' || r.status?.toLowerCase() === 'approved').length,
          revision: inRevision,
          completed: [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'completed').length
        }
      }
    });
    
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

/**
 * GET /api/admin/revision-hotspot
 * Get top requests by revision count
 */
router.get('/api/admin/revision-hotspot', requireAdmin, async (req, res) => {
  try {
    // Fetch all requests with populated user data
    const approvals = await RequestApproval.find()
      .populate('userId', 'fName lName')
      .lean();
    
    const services = await ServiceRequest.find()
      .populate('userId', 'fName lName')
      .lean();
    
    // Combine and calculate total revisions (placeholder - you may need to add revision tracking)
    const allRequests = [
      ...approvals.map(r => ({
        ...r,
        type: 'Approval Request',
        // Placeholder revision counts - replace with actual revision tracking
        majorRevisions: Math.floor(Math.random() * 4),
        minorRevisions: Math.floor(Math.random() * 3),
        userName: r.userId ? `${r.userId.fName} ${r.userId.lName}` : 'Unknown'
      })),
      ...services.map(r => ({
        ...r,
        type: 'Service Request',
        majorRevisions: Math.floor(Math.random() * 4),
        minorRevisions: Math.floor(Math.random() * 3),
        userName: r.userId ? `${r.userId.fName} ${r.userId.lName}` : 'Unknown'
      }))
    ];
    
    // Sort by total revisions
    allRequests.forEach(r => {
      r.totalRevisions = r.majorRevisions + r.minorRevisions;
    });
    
    const topRevisions = allRequests
      .sort((a, b) => b.totalRevisions - a.totalRevisions)
      .slice(0, 10);
    
    res.json({
      success: true,
      data: topRevisions
    });
    
  } catch (err) {
    console.error('Error fetching revision hotspot data:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revision data'
    });
  }
});

// ==================== REPORTS ROUTES ====================

/**
 * GET /admin/reports
 * Render the Report Generation Page
 * Accessible by admin users only
 */
router.get('/admin/reports', requireAdmin, async (req, res) => {
  try {
    // Get unread notification count for the user
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    // Get available filters for report page
    const availableFilters = await reportService.getAvailableFilters();

    res.render('admin/reports', {
      user: req.user,
      unreadCount: unreadCount,
      availableFilters: availableFilters
    });
  } catch (error) {
    console.error('Error rendering reports page:', error);
    res.status(500).render('error', {
      message: 'Error loading reports page'
    });
  }
});

/**
 * GET /api/admin/report-data
 * Fetch filtered report data for preview
 */
router.get('/api/admin/report-data', requireAdmin, async (req, res) => {
  try {
    const query = buildReportQuery(req.query);
    
    // Fetch both service requests and approval requests
    const serviceRequests = await ServiceRequest.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    const approvalRequests = await RequestApproval.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine and tag request types
    const allRequests = [
      ...serviceRequests.map(r => ({ ...r, requestType: 'Service' })),
      ...approvalRequests.map(r => ({ ...r, requestType: 'Approval' }))
    ];
    
    // Sort by date
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ 
      success: true,
      requests: allRequests 
    });
    
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching data' 
    });
  }
});

/**
 * GET /admin/export/excel
 * Generate and download Excel report
 */
router.get('/admin/export/excel', requireAdmin, async (req, res) => {
  try {
    const query = buildReportQuery(req.query);
    
    // Fetch both service requests and approval requests
    const serviceRequests = await ServiceRequest.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    const approvalRequests = await RequestApproval.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine requests
    const allRequests = [
      ...serviceRequests.map(r => ({ ...r, requestType: 'Service' })),
      ...approvalRequests.map(r => ({ ...r, requestType: 'Approval' }))
    ];
    
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('S-CORE Report');
    
    // Define columns
    worksheet.columns = [
      { header: 'Requesting Department', key: 'dept', width: 30 },
      { header: 'Title of Project/Event', key: 'title', width: 35 },
      { header: 'Short Description', key: 'desc', width: 45 },
      { header: 'In-Charge (Unit)', key: 'unit', width: 20 },
      { header: 'Date Received', key: 'received', width: 18 },
      { header: 'Date Completed', key: 'completed', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E9' }
    };

    // Add data rows
    allRequests.forEach(req => {
      let displayOrganization = 'N/A';
      if (req.userId) {
        if (req.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(req.userId.affiliation)
            ? req.userId.affiliation.join(', ')
            : (req.userId.affiliation || req.organization || 'N/A');
        } else {
          displayOrganization = Array.isArray(req.userId.studentOrganization)
            ? req.userId.studentOrganization.join(', ')
            : (req.userId.studentOrganization || req.organization || 'N/A');
        }
      } else if (req.organization) {
        displayOrganization = req.organization;
      }

      let completionDate = '';
      if (req.status === 'Completed' || req.status === 'Approved') {
        completionDate = req.updatedAt ? new Date(req.updatedAt) : '';
      }

      worksheet.addRow({
        dept: displayOrganization,
        title: req.title || '',
        desc: req.description || '',
        unit: req.assignedUnits || 'Not yet assigned',
        received: req.createdAt ? new Date(req.createdAt) : '',
        completed: completionDate,
        status: req.status || '',
        remarks: req.specificRequestType || ''
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=S-CORE-Report-${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel file');
  }
});

/**
 * GET /admin/export/pdf
 * Generate and download PDF report
 */
router.get('/admin/export/pdf', requireAdmin, async (req, res) => {
  try {
    const query = buildReportQuery(req.query);
    
    // Fetch both service requests and approval requests
    const serviceRequests = await ServiceRequest.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    const approvalRequests = await RequestApproval.find(query)
      .populate('userId', 'fName lName email userType studentOrganization affiliation')
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine requests
    const allRequests = [
      ...serviceRequests.map(r => ({ ...r, requestType: 'Service' })),
      ...approvalRequests.map(r => ({ ...r, requestType: 'Approval' }))
    ];
    
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4', 
      layout: 'landscape' 
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=S-CORE-Report-${Date.now()}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(18).text('S-CORE Report', { align: 'center' });
    doc.fontSize(10).text(`Generated by: ${req.user.fName} ${req.user.lName}`, { align: 'center' });
    doc.fontSize(9).text(`Date: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add filter information
    const filterInfo = buildFilterInfoText(req.query);
    if (filterInfo) {
      doc.fontSize(9).text(`Filters: ${filterInfo}`, { align: 'left' });
      doc.moveDown();
    }

    // Table setup
    const tableTop = doc.y;
    const rowHeight = 20;
    const colWidths = {
      dept: 80,
      title: 100,
      desc: 150,
      unit: 70,
      received: 70,
      completed: 70,
      status: 60,
      remarks: 80
    };
    
    let xPos = 30;
    const cols = [
      { key: 'dept', label: 'Department', x: xPos },
      { key: 'title', label: 'Title', x: (xPos += colWidths.dept) },
      { key: 'desc', label: 'Description', x: (xPos += colWidths.title) },
      { key: 'unit', label: 'Unit', x: (xPos += colWidths.desc) },
      { key: 'received', label: 'Received', x: (xPos += colWidths.unit) },
      { key: 'completed', label: 'Completed', x: (xPos += colWidths.received) },
      { key: 'status', label: 'Status', x: (xPos += colWidths.completed) },
      { key: 'remarks', label: 'Remarks', x: (xPos += colWidths.status) }
    ];

    // Draw header
    doc.fontSize(8).fillColor('black');
    cols.forEach(col => {
      doc.text(col.label, col.x, tableTop, { width: colWidths[col.key], align: 'left' });
    });
    
    doc.moveDown(0.5);
    let y = doc.y;

    // Draw rows
    allRequests.forEach((req, index) => {
      // Check if we need a new page
      if (y > 500) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        y = 30;
      }

      let displayOrganization = 'N/A';
      if (req.userId) {
        if (req.userId.userType === 'nonstudent') {
          displayOrganization = Array.isArray(req.userId.affiliation)
            ? req.userId.affiliation.join(', ')
            : (req.userId.affiliation || req.organization || 'N/A');
        } else {
          displayOrganization = Array.isArray(req.userId.studentOrganization)
            ? req.userId.studentOrganization.join(', ')
            : (req.userId.studentOrganization || req.organization || 'N/A');
        }
      } else if (req.organization) {
        displayOrganization = req.organization;
      }

      let completionDate = '';
      if (req.status === 'Completed' || req.status === 'Approved') {
        completionDate = formatDateForPDF(req.updatedAt);
      }

      const rowData = [
        { text: truncateForPDF(displayOrganization, 25), x: cols[0].x, width: colWidths.dept },
        { text: truncateForPDF(req.title || '', 30), x: cols[1].x, width: colWidths.title },
        { text: truncateForPDF(req.description || '', 45), x: cols[2].x, width: colWidths.desc },
        { text: req.assignedUnits || 'N/A', x: cols[3].x, width: colWidths.unit },
        { text: formatDateForPDF(req.createdAt), x: cols[4].x, width: colWidths.received },
        { text: completionDate, x: cols[5].x, width: colWidths.completed },
        { text: req.status || '', x: cols[6].x, width: colWidths.status },
        { text: truncateForPDF(req.specificRequestType || '', 25), x: cols[7].x, width: colWidths.remarks }
      ];

      rowData.forEach(cell => {
        doc.text(cell.text, cell.x, y, { width: cell.width, height: rowHeight, align: 'left' });
      });

      y += rowHeight;
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).send('Error generating PDF file');
    }
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Builds MongoDB query from filter parameters
 * @param {Object} queryParams - URL query parameters
 * @returns {Object} MongoDB query object
 */
function buildReportQuery(queryParams) {
  const { datePreset, month, year, quarter, startDate, endDate, unit, requestType, status } = queryParams;
  
  let query = {};
  
  // 1. Date Filtering
  if (datePreset === 'monthly' && month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
    query.createdAt = { $gte: start, $lte: end };
  } else if (datePreset === 'quarterly' && quarter && year) {
    let startMonth;
    if (quarter == 1) startMonth = 0; // Jan
    else if (quarter == 2) startMonth = 3; // Apr
    else if (quarter == 3) startMonth = 6; // Jul
    else if (quarter == 4) startMonth = 9; // Oct
    
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  } else if (datePreset === 'custom' && startDate && endDate) {
    query.createdAt = { 
      $gte: new Date(startDate), 
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    };
  }
  // if 'all', no date filter is added.

  // 2. Unit Filtering
  if (unit && unit !== 'all') {
    if (Array.isArray(unit)) {
      query.assignedUnits = { $in: unit };
    } else {
      query.assignedUnits = unit;
    }
  }
  
  // 3. Status Filtering
  if (status && status !== 'all') {
    query.status = status;
  }

  // Note: requestType filtering is handled after fetching both collections
  
  return query;
}

/**
 * Formats date for PDF display
 * @param {Date|string} dateString - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForPDF(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch (error) {
    return '';
  }
}

/**
 * Truncates text for PDF display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateForPDF(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Builds filter information text for PDF header
 * @param {Object} queryParams - URL query parameters
 * @returns {string} Filter description text
 */
function buildFilterInfoText(queryParams) {
  const { datePreset, month, year, quarter, startDate, endDate, unit, requestType, status } = queryParams;
  let parts = [];
  
  if (datePreset === 'monthly' && month && year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    parts.push(`${monthNames[month - 1]} ${year}`);
  } else if (datePreset === 'quarterly' && quarter && year) {
    parts.push(`Q${quarter} ${year}`);
  } else if (datePreset === 'custom' && startDate && endDate) {
    parts.push(`${startDate} to ${endDate}`);
  }
  
  if (unit && unit !== 'all') {
    parts.push(`Unit: ${Array.isArray(unit) ? unit.join(', ') : unit}`);
  }
  
  if (requestType && requestType !== 'all') {
    parts.push(`Type: ${requestType}`);
  }
  
  if (status && status !== 'all') {
    parts.push(`Status: ${status}`);
  }
  
  return parts.join(' | ');
}

/**
 * PUT /admin/request/edit
 * Edit request details (title, description, organization, deadline, etc.)
 */
router.put('/admin/request/edit', requireAdmin, async (req, res) => {
  try {
    const { requestId, requestType, updates } = req.body;

    if (!requestId || !requestType) {
      return res.status(400).json({ success: false, message: 'Request ID and type are required' });
    }

    const Model = requestType === 'Request Approval' ? RequestApproval : ServiceRequest;
    
    // Find and update the request
    const request = await Model.findByIdAndUpdate(
      requestId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ 
      success: true, 
      message: 'Request updated successfully',
      request
    });
  } catch (error) {
    console.error('Error editing request:', error);
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

/**
 * POST /admin/request/delete
 * Soft delete request (move to archive/trash)
 */
router.post('/admin/request/delete', requireAdmin, async (req, res) => {
  try {
    const { requestId, requestType } = req.body;

    if (!requestId || !requestType) {
      return res.status(400).json({ success: false, message: 'Request ID and type are required' });
    }

    const Model = requestType === 'Request Approval' ? RequestApproval : ServiceRequest;
    
    // Soft delete by setting isDeleted flag
    const request = await Model.findByIdAndUpdate(
      requestId,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Create notification for the user who submitted the request
    try {
      await notificationService.createNotification({
        userId: request.userId,
        message: `Your ${requestType.toLowerCase()} "${request.title}" has been archived by an administrator`,
        link: '/user/my-requests',
        type: 'system'
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Request moved to archive successfully'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
});

/**
 * POST /admin/request/restore
 * Restore archived request
 */
router.post('/admin/request/restore', requireAdmin, async (req, res) => {
  try {
    const { requestId, requestType } = req.body;

    if (!requestId || !requestType) {
      return res.status(400).json({ success: false, message: 'Request ID and type are required' });
    }

    const Model = requestType === 'Request Approval' ? RequestApproval : ServiceRequest;
    
    // Restore by unsetting isDeleted flag
    const request = await Model.findByIdAndUpdate(
      requestId,
      { 
        isDeleted: false,
        $unset: { deletedAt: 1, deletedBy: 1 }
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Create notification for the user who submitted the request
    try {
      await notificationService.createNotification({
        userId: request.userId,
        message: `Your ${requestType.toLowerCase()} "${request.title}" has been restored from archive`,
        link: '/user/my-requests',
        type: 'system'
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Request restored successfully'
    });
  } catch (error) {
    console.error('Error restoring request:', error);
    res.status(500).json({ success: false, message: 'Failed to restore request' });
  }
});

/**
 * DELETE /admin/request/permanent-delete
 * Permanently delete a request (cannot be undone)
 */
router.delete('/admin/request/permanent-delete', requireAdmin, async (req, res) => {
  try {
    const { requestId, requestType } = req.body;

    if (!requestId || !requestType) {
      return res.status(400).json({ success: false, message: 'Request ID and type are required' });
    }

    const Model = requestType === 'Request Approval' ? RequestApproval : ServiceRequest;
    
    // Permanently delete
    const request = await Model.findByIdAndDelete(requestId);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ 
      success: true, 
      message: 'Request permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting request:', error);
    res.status(500).json({ success: false, message: 'Failed to permanently delete request' });
  }
});

// ========================================
// REQUEST TYPE MANAGEMENT ROUTES
// ========================================

/**
 * GET /admin/request-types
 * Display request types management page
 */
router.get('/admin/request-types', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const requestTypes = await RequestType.find().populate('submittedBy').lean();
    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      isRead: false
    });

    // Calculate statistics
    const stats = {
      total: requestTypes.length,
      pending: requestTypes.filter(rt => rt.status === 'pending').length,
      approved: requestTypes.filter(rt => rt.status === 'approved').length,
      rejected: requestTypes.filter(rt => rt.status === 'rejected').length
    };

    res.render('Admin/request-types', {
      user: user,
      requestTypes: requestTypes,
      stats: stats,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error loading request types page:', error);
    res.status(500).render('error', { message: 'Failed to load request types' });
  }
});

/**
 * GET /admin/request-types/data
 * Get all request types as JSON
 */
router.get('/admin/request-types/data', requireAdmin, async (req, res) => {
  try {
    const requestTypes = await RequestType.find()
      .populate('submittedBy', 'fName lName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requestTypes });
  } catch (error) {
    console.error('Error fetching request types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request types' });
  }
});

/**
 * POST /admin/request-types
 * Create new request type
 */
router.post('/admin/request-types', requireAdmin, async (req, res) => {
  try {
    const { name, category, description, requiredFields, assignedUnit } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    const newRequestType = new RequestType({
      name,
      category,
      description,
      requiredFields: requiredFields ? requiredFields.split(',').map(f => f.trim()) : [],
      assignedUnit,
      status: 'approved', // Auto-approve admin-created types
      submittedBy: req.session.userId
    });

    await newRequestType.save();
    res.json({ success: true, message: 'Request type created successfully', data: newRequestType });
  } catch (error) {
    console.error('Error creating request type:', error);
    res.status(500).json({ success: false, message: 'Failed to create request type' });
  }
});

/**
 * PUT /admin/request-types/:id
 * Update request type
 */
router.put('/admin/request-types/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, description, requiredFields, assignedUnit, status } = req.body;
    const { id } = req.params;

    const requestType = await RequestType.findByIdAndUpdate(
      id,
      {
        name,
        category,
        description,
        requiredFields: requiredFields ? requiredFields.split(',').map(f => f.trim()) : [],
        assignedUnit,
        status,
        reviewedBy: req.session.userId,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!requestType) {
      return res.status(404).json({ success: false, message: 'Request type not found' });
    }

    res.json({ success: true, message: 'Request type updated successfully', data: requestType });
  } catch (error) {
    console.error('Error updating request type:', error);
    res.status(500).json({ success: false, message: 'Failed to update request type' });
  }
});

/**
 * DELETE /admin/request-types/:id
 * Delete request type
 */
router.delete('/admin/request-types/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const requestType = await RequestType.findByIdAndDelete(id);

    if (!requestType) {
      return res.status(404).json({ success: false, message: 'Request type not found' });
    }

    res.json({ success: true, message: 'Request type deleted successfully' });
  } catch (error) {
    console.error('Error deleting request type:', error);
    res.status(500).json({ success: false, message: 'Failed to delete request type' });
  }
});

/**
 * POST /admin/request-types/:id/approve
 * Approve a pending request type
 */
router.post('/admin/request-types/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedUnit } = req.body;

    if (!assignedUnit) {
      return res.status(400).json({ success: false, message: 'Assigned unit is required' });
    }

    const requestType = await RequestType.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        assignedUnit,
        reviewedBy: req.session.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('submittedBy', 'fName lName email');

    if (!requestType) {
      return res.status(404).json({ success: false, message: 'Request type not found' });
    }

    // Create notification for the user
    try {
      await notificationService.createNotification({
        userId: requestType.submittedBy._id,
        message: `Your request type "${requestType.name}" has been approved and is now available to all users!`,
        link: '/user/my-requests',
        type: 'system'
      });
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
    }

    res.json({ success: true, message: 'Request type approved successfully', requestType });
  } catch (error) {
    console.error('Error approving request type:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request type' });
  }
});

/**
 * POST /admin/request-types/:id/reject
 * Reject a pending request type
 */
router.post('/admin/request-types/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const requestType = await RequestType.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        reviewNotes,
        reviewedBy: req.session.userId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('submittedBy', 'fName lName email');

    if (!requestType) {
      return res.status(404).json({ success: false, message: 'Request type not found' });
    }

    // Create notification for the user
    try {
      await notificationService.createNotification({
        userId: requestType.submittedBy._id,
        message: `Your request type "${requestType.name}" has been rejected. Check the details for feedback.`,
        link: '/user/my-requests',
        type: 'system'
      });
    } catch (notifError) {
      console.error('Error sending rejection notification:', notifError);
    }

    res.json({ success: true, message: 'Request type rejected successfully', requestType });
  } catch (error) {
    console.error('Error rejecting request type:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request type' });
  }
});

/**
 * POST /admin/request-types/:id/edit
 * Edit an existing request type
 */
router.post('/admin/request-types/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, assignedUnit } = req.body;

    if (!name || !assignedUnit) {
      return res.status(400).json({ success: false, message: 'Name and assigned unit are required' });
    }

    const requestType = await RequestType.findByIdAndUpdate(
      id,
      {
        name,
        assignedUnit
      },
      { new: true }
    ).populate('submittedBy', 'fName lName email');

    if (!requestType) {
      return res.status(404).json({ success: false, message: 'Request type not found' });
    }

    res.json({ success: true, message: 'Request type updated successfully', requestType });
  } catch (error) {
    console.error('Error editing request type:', error);
    res.status(500).json({ success: false, message: 'Failed to edit request type' });
  }
});

// ========================================
// SYSTEM SETTINGS ROUTES
// ========================================

/**
 * GET /admin/settings

 * Display system settings page
 */
router.get('/admin/settings', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const settings = await settingsService.getSettings();
    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      isRead: false
    });

    res.render('Admin/settings', {
      user: user,
      settings: settings,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error loading settings page:', error);
    res.status(500).render('error', { message: 'Failed to load settings' });
  }
});

/**
 * GET /admin/settings/data
 * Get settings data as JSON (for AJAX)
 */
router.get('/admin/settings/data', requireAdmin, async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, settings: settings });
  } catch (error) {
    console.error('Error fetching settings data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

/**
 * PUT /admin/settings/general
 * Update general settings
 */
router.put('/admin/settings/general', requireAdmin, async (req, res) => {
  try {
    const { siteTitle, siteDescription, timezone, dateFormat, language } = req.body;
    
    const updates = {
      siteTitle,
      siteDescription,
      timezone,
      dateFormat,
      language
    };

    const settings = await settingsService.updateSettings(updates, req.session.userId);
    res.json({ success: true, message: 'General settings updated', settings });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

/**
 * PUT /admin/settings/request-management
 * Update request management settings
 */
router.put('/admin/settings/request-management', requireAdmin, async (req, res) => {
  try {
    const {
      maxRevisions,
      maxMinorRevisions,
      defaultDeadlineDays,
      autoApproveAfterRevisions,
      requireUnitReview
    } = req.body;

    const updates = {
      maxRevisions: parseInt(maxRevisions),
      maxMinorRevisions: parseInt(maxMinorRevisions),
      defaultDeadlineDays: parseInt(defaultDeadlineDays),
      autoApproveAfterRevisions: autoApproveAfterRevisions === 'true' || autoApproveAfterRevisions === true,
      requireUnitReview: requireUnitReview === 'true' || requireUnitReview === true
    };

    const settings = await settingsService.updateSettings(updates, req.session.userId);
    res.json({ success: true, message: 'Request management settings updated', settings });
  } catch (error) {
    console.error('Error updating request management settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

/**
 * PUT /admin/settings/notifications
 * Update notification settings
 */
router.put('/admin/settings/notifications', requireAdmin, async (req, res) => {
  try {
    const {
      enableEmailNotifications,
      smtpHost,
      smtpPort,
      emailFrom,
      notificationFrequency
    } = req.body;

    const updates = {
      enableEmailNotifications: enableEmailNotifications === 'true' || enableEmailNotifications === true,
      smtpHost,
      smtpPort: parseInt(smtpPort),
      emailFrom,
      notificationFrequency
    };

    const settings = await settingsService.updateSettings(updates, req.session.userId);
    res.json({ success: true, message: 'Notification settings updated', settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

/**
 * PUT /admin/settings/storage
 * Update file storage settings
 */
router.put('/admin/settings/storage', requireAdmin, async (req, res) => {
  try {
    const {
      maxFileSize,
      allowedFileTypes,
      storageType,
      retainAllRevisionFiles,
      autoDeleteOldFilesAfterDays
    } = req.body;

    const updates = {
      maxFileSize: parseInt(maxFileSize),
      allowedFileTypes: Array.isArray(allowedFileTypes) ? allowedFileTypes : allowedFileTypes.split(','),
      storageType,
      retainAllRevisionFiles: retainAllRevisionFiles === 'true' || retainAllRevisionFiles === true,
      autoDeleteOldFilesAfterDays: autoDeleteOldFilesAfterDays ? parseInt(autoDeleteOldFilesAfterDays) : null
    };

    const settings = await settingsService.updateSettings(updates, req.session.userId);
    res.json({ success: true, message: 'Storage settings updated', settings });
  } catch (error) {
    console.error('Error updating storage settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

/**
 * PUT /admin/settings/features
 * Update feature flags
 */
router.put('/admin/settings/features', requireAdmin, async (req, res) => {
  try {
    const {
      enableAnnouncements,
      enableUserSearch,
      enableDarkMode,
      enableAnalytics,
      enableMobileApp
    } = req.body;

    const updates = {
      enableAnnouncements: enableAnnouncements === 'true' || enableAnnouncements === true,
      enableUserSearch: enableUserSearch === 'true' || enableUserSearch === true,
      enableDarkMode: enableDarkMode === 'true' || enableDarkMode === true,
      enableAnalytics: enableAnalytics === 'true' || enableAnalytics === true,
      enableMobileApp: enableMobileApp === 'true' || enableMobileApp === true
    };

    const settings = await settingsService.updateSettings(updates, req.session.userId);
    res.json({ success: true, message: 'Feature flags updated', settings });
  } catch (error) {
    console.error('Error updating feature flags:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

/**
 * POST /admin/settings/reset
 * Reset all settings to defaults
 */
router.post('/admin/settings/reset', requireAdmin, async (req, res) => {
  try {
    const settings = await settingsService.resetToDefaults(req.session.userId);
    res.json({ success: true, message: 'Settings reset to defaults', settings });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ success: false, message: 'Failed to reset settings' });
  }
});

// ========================================
// REPORT GENERATION ROUTES
// ========================================

/**
 * GET /admin/reports
 * Display reports page
 */
router.get('/admin/reports', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      isRead: false
    });
    const availableFilters = await reportService.getAvailableFilters();

    res.render('Admin/reports', {
      user: user,
      unreadCount: unreadCount,
      availableFilters: availableFilters
    });
  } catch (error) {
    console.error('Error loading reports page:', error);
    res.status(500).render('error', { message: 'Failed to load reports' });
  }
});

/**
 * POST /admin/reports/generate
 * Generate report with filters and return JSON data
 */
router.post('/admin/reports/generate', requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      units,
      requestType,
      statuses,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.body;

    const filters = {
      startDate,
      endDate,
      units: units && Array.isArray(units) ? units : (units ? [units] : []),
      requestType,
      statuses: statuses && Array.isArray(statuses) ? statuses : (statuses ? [statuses] : []),
      sortBy,
      sortOrder
    };

    const reportData = await reportService.generateReport(filters);
    const summary = await reportService.getReportSummary(filters);

    res.json({
      success: true,
      data: reportData,
      summary: summary,
      recordCount: reportData.length
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/reports/summary
 * Get report summary statistics
 */
router.get('/admin/reports/summary', requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      units,
      requestType,
      statuses
    } = req.query;

    const filters = {
      startDate,
      endDate,
      units: units && Array.isArray(units) ? units : (units ? [units] : []),
      requestType,
      statuses: statuses && Array.isArray(statuses) ? statuses : (statuses ? [statuses] : [])
    };

    const summary = await reportService.getReportSummary(filters);

    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/reports/export-csv
 * Export report data as CSV
 */
router.post('/admin/reports/export-csv', requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      units,
      requestType,
      statuses
    } = req.body;

    const filters = {
      startDate,
      endDate,
      units: units && Array.isArray(units) ? units : (units ? [units] : []),
      requestType,
      statuses: statuses && Array.isArray(statuses) ? statuses : (statuses ? [statuses] : [])
    };

    const reportData = await reportService.generateReport(filters);
    const csv = reportService.exportToCSV(reportData);

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename=report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/reports/export-pdf
 * Export report data as PDF (returns HTML for client-side PDF generation)
 */
router.post('/admin/reports/export-pdf', requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      units,
      requestType,
      statuses
    } = req.body;

    const filters = {
      startDate,
      endDate,
      units: units && Array.isArray(units) ? units : (units ? [units] : []),
      requestType,
      statuses: statuses && Array.isArray(statuses) ? statuses : (statuses ? [statuses] : [])
    };

    const reportData = await reportService.generateReport(filters);
    const summary = await reportService.getReportSummary(filters);
    const html = reportService.exportToPDF(reportData, summary);

    res.setHeader('Content-Type', 'text/html;charset=utf-8;');
    res.send(html);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/reports/filters
 * Get available filter options
 */
router.get('/admin/reports/filters', requireAdmin, async (req, res) => {
  try {
    const filters = await reportService.getAvailableFilters();
    res.json({
      success: true,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================
// ANNOUNCEMENT MANAGEMENT ROUTES
// ========================================

/**
 * GET /admin/announcement
 * Display announcements management page
 */
router.get('/admin/announcement', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const result = await announcementService.getAnnouncements(1, 50);
    const stats = await announcementService.getStatistics();
    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      isRead: false
    });

    res.render('Admin/announcements', {
      user: user,
      announcements: result.announcements,
      stats: stats,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error loading announcements page:', error);
    res.status(500).render('error', { message: 'Failed to load announcements' });
  }
});

/**
 * GET /admin/announcement/:id
 * Get single announcement
 */
router.get('/admin/announcement/:id', requireAdmin, async (req, res) => {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id);
    res.json({
      success: true,
      announcement: announcement
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/announcement
 * Create new announcement
 */
router.post('/admin/announcement', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      priority,
      recipientType,
      organization,
      recipients,
      scheduledTime
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcement = await announcementService.createAnnouncement({
      title,
      content,
      priority: priority || 'medium',
      recipientType: recipientType || 'all',
      organization,
      recipients: recipients && Array.isArray(recipients) ? recipients : [],
      scheduledTime,
      createdBy: req.session.userId
    });

    res.json({
      success: true,
      message: scheduledTime ? 'Announcement scheduled successfully' : 'Announcement created and sent successfully',
      announcement: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /admin/announcement/:id
 * Update announcement
 */
router.put('/admin/announcement/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority } = req.body;

    const announcement = await announcementService.updateAnnouncement(req.params.id, {
      title,
      content,
      priority
    });

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /admin/announcement/:id
 * Delete announcement
 */
router.delete('/admin/announcement/:id', requireAdmin, async (req, res) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/announcements/data
 * Get announcements as JSON with pagination
 */
router.get('/admin/announcements/data', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await announcementService.getAnnouncements(page, limit);

    res.json({
      success: true,
      data: result.announcements,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching announcements data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/announcements/stats
 * Get announcement statistics
 */
router.get('/admin/announcements/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await announcementService.getStatistics();

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching announcement stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/announcement/:id/resend
 * Resend announcement to users
 */
router.post('/admin/announcement/:id/resend', requireAdmin, async (req, res) => {
  try {
    const announcement = await announcementService.getAnnouncement(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcementService.sendAnnouncement(announcement._id, announcement.recipients);

    res.json({
      success: true,
      message: 'Announcement resent to all recipients'
    });
  } catch (error) {
    console.error('Error resending announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ===== Analytics Routes =====
 */

/**
 * GET /admin/analytics
 * Display analytics dashboard
 */
router.get('/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const analytics = await reportService.getAnalytics();
    const requestTypeAnalytics = await reportService.getRequestTypeAnalytics();
    const unitAnalytics = await reportService.getUnitAnalytics();
    const userAnalytics = await reportService.getUserAnalytics();

    res.render('Admin/analytics', {
      user: req.user,
      title: 'Analytics',
      analytics: analytics,
      requestTypeAnalytics: requestTypeAnalytics,
      unitAnalytics: unitAnalytics,
      userAnalytics: userAnalytics
    });
  } catch (error) {
    console.error('Error loading analytics page:', error);
    res.status(500).render('error', { error: error.message });
  }
});

/**
 * GET /admin/analytics/data
 * Get analytics data in JSON format
 */
router.get('/admin/analytics/data', requireAdmin, async (req, res) => {
  try {
    const analytics = await reportService.getAnalytics();
    const requestTypeAnalytics = await reportService.getRequestTypeAnalytics();
    const unitAnalytics = await reportService.getUnitAnalytics();
    const userAnalytics = await reportService.getUserAnalytics();

    res.json({
      success: true,
      data: {
        summary: analytics.summary,
        byStatus: analytics.byStatus,
        byUnit: analytics.byUnit,
        trend: analytics.trend,
        requestTypes: requestTypeAnalytics,
        units: unitAnalytics,
        users: userAnalytics
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/analytics/request-types
 * Get detailed request type performance data
 */
router.get('/admin/analytics/request-types', requireAdmin, async (req, res) => {
  try {
    const requestTypeAnalytics = await reportService.getRequestTypeAnalytics();

    res.json({
      success: true,
      data: requestTypeAnalytics
    });
  } catch (error) {
    console.error('Error fetching request type analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/analytics/units
 * Get detailed unit performance metrics
 */
router.get('/admin/analytics/units', requireAdmin, async (req, res) => {
  try {
    const unitAnalytics = await reportService.getUnitAnalytics();

    res.json({
      success: true,
      data: unitAnalytics
    });
  } catch (error) {
    console.error('Error fetching unit analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/analytics/users
 * Get detailed user activity analytics
 */
router.get('/admin/analytics/users', requireAdmin, async (req, res) => {
  try {
    const userAnalytics = await reportService.getUserAnalytics();

    res.json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/configuration
 * Admin page configuration - edit homepage content
 */
router.get('/admin/configuration', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    // Try to get homepage content from database
    let pageContent = await Page.findOne({ slug: 'home' });
    
    // If no content exists in database, try to load from JSON file
    if (!pageContent) {
      try {
        const dataPath = path.join(__dirname, '..', 'data', 'homepage.json');
        if (fs.existsSync(dataPath)) {
          const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          pageContent = { content: jsonData };
        }
      } catch (jsonError) {
        console.log('[ADMIN] No JSON fallback found, using defaults');
      }
    }
    
    // If still no content, create default content
    if (!pageContent) {
      pageContent = new Page({
        slug: 'home',
        title: 'Homepage',
        content: {}
      });
      await pageContent.save();
    }
    
    res.render('Admin/configuration', {
      name: user.firstName,
      user: user,
      pageContent: pageContent.content || {},
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('[ADMIN] Error loading configuration page:', error);
    res.status(500).send('Error loading configuration page');
  }
});

/**
 * POST /admin/configuration
 * Save homepage content updates
 */
router.post('/admin/configuration', requireAdmin, async (req, res) => {
  try {
    const {
      heroTitle, heroTitleHighlight, heroSubtitle,
      pledgeSectionTitle,
      aboutSectionTitle, aboutSectionSubtitle,
      aboutMission, aboutVision,
      servicesSectionTitle, servicesSectionSubtitle,
      teamSectionTitle, teamSectionSubtitle,
      contactSectionTitle, contactIntroText,
      socialSectionTitle,
      footerTagline, footerText,
      heroPrimaryButtonText, heroPrimaryButtonLink,
      heroSecondaryButtonText, heroSecondaryButtonLink
    } = req.body;
    
    // Handle array fields
    const pledgeItems = [];
    if (req.body.pledgeName && Array.isArray(req.body.pledgeName)) {
      req.body.pledgeName.forEach((name, index) => {
        if (name && req.body.pledgeDescription && req.body.pledgeDescription[index]) {
          pledgeItems.push({
            name: name,
            description: req.body.pledgeDescription[index]
          });
        }
      });
    }
    
    const services = [];
    if (req.body.serviceTitle && Array.isArray(req.body.serviceTitle)) {
      req.body.serviceTitle.forEach((title, index) => {
        if (title && req.body.serviceDescription && req.body.serviceDescription[index]) {
          services.push({
            title: title,
            description: req.body.serviceDescription[index]
          });
        }
      });
    }
    
    const teamMembers = [];
    if (req.body.teamName && Array.isArray(req.body.teamName)) {
      req.body.teamName.forEach((name, index) => {
        if (name && req.body.teamRole && req.body.teamRole[index] && req.body.teamEmail && req.body.teamEmail[index]) {
          teamMembers.push({
            name: name,
            role: req.body.teamRole[index],
            email: req.body.teamEmail[index]
          });
        }
      });
    }
    
    const contactCards = [];
    if (req.body.contactIcon && Array.isArray(req.body.contactIcon)) {
      req.body.contactIcon.forEach((icon, index) => {
        if (icon && req.body.contactTitle && req.body.contactTitle[index] && req.body.contactDescription && req.body.contactDescription[index]) {
          contactCards.push({
            icon: icon,
            title: req.body.contactTitle[index],
            description: req.body.contactDescription[index],
            contactInfo: req.body.contactInfo ? req.body.contactInfo[index] : '',
            contactType: req.body.contactType ? req.body.contactType[index] : 'email'
          });
        }
      });
    }
    
    const socialMedia = [];
    if (req.body.socialIcon && Array.isArray(req.body.socialIcon)) {
      req.body.socialIcon.forEach((icon, index) => {
        if (icon && req.body.socialTitle && req.body.socialTitle[index] && req.body.socialUrl && req.body.socialUrl[index]) {
          socialMedia.push({
            icon: icon,
            title: req.body.socialTitle[index],
            url: req.body.socialUrl[index]
          });
        }
      });
    }
    
    const footerLinks = [];
    if (req.body.footerLinkText && Array.isArray(req.body.footerLinkText)) {
      req.body.footerLinkText.forEach((text, index) => {
        if (text && req.body.footerLinkUrl && req.body.footerLinkUrl[index]) {
          footerLinks.push({
            text: text,
            url: req.body.footerLinkUrl[index]
          });
        }
      });
    }
    
    const aboutFeatures = [];
    if (req.body.featureIcon && Array.isArray(req.body.featureIcon)) {
      req.body.featureIcon.forEach((icon, index) => {
        if (icon && req.body.featureTitle && req.body.featureTitle[index] && req.body.featureDescription && req.body.featureDescription[index]) {
          aboutFeatures.push({
            icon: icon,
            title: req.body.featureTitle[index],
            description: req.body.featureDescription[index]
          });
        }
      });
    }
    
    // Find or create the homepage document
    let pageContent = await Page.findOne({ slug: 'home' });
    
    if (!pageContent) {
      pageContent = new Page({
        slug: 'home',
        title: 'Homepage'
      });
    }
    
    // Update all content fields
    pageContent.content = {
      heroTitle: heroTitle || pageContent.content?.heroTitle,
      heroTitleHighlight: heroTitleHighlight || pageContent.content?.heroTitleHighlight,
      heroSubtitle: heroSubtitle || pageContent.content?.heroSubtitle,
      pledgeSectionTitle: pledgeSectionTitle || pageContent.content?.pledgeSectionTitle,
      pledgeItems: pledgeItems.length > 0 ? pledgeItems : pageContent.content?.pledgeItems || [],
      aboutSectionTitle: aboutSectionTitle || pageContent.content?.aboutSectionTitle,
      aboutSectionSubtitle: aboutSectionSubtitle || pageContent.content?.aboutSectionSubtitle,
      aboutMission: aboutMission || pageContent.content?.aboutMission,
      aboutVision: aboutVision || pageContent.content?.aboutVision,
      aboutFeatures: aboutFeatures.length > 0 ? aboutFeatures : pageContent.content?.aboutFeatures || [],
      servicesSectionTitle: servicesSectionTitle || pageContent.content?.servicesSectionTitle,
      servicesSectionSubtitle: servicesSectionSubtitle || pageContent.content?.servicesSectionSubtitle,
      services: services.length > 0 ? services : pageContent.content?.services || [],
      teamSectionTitle: teamSectionTitle || pageContent.content?.teamSectionTitle,
      teamSectionSubtitle: teamSectionSubtitle || pageContent.content?.teamSectionSubtitle,
      teamMembers: teamMembers.length > 0 ? teamMembers : pageContent.content?.teamMembers || [],
      contactSectionTitle: contactSectionTitle || pageContent.content?.contactSectionTitle,
      contactIntroText: contactIntroText || pageContent.content?.contactIntroText,
      contactCards: contactCards.length > 0 ? contactCards : pageContent.content?.contactCards || [],
      socialSectionTitle: socialSectionTitle || pageContent.content?.socialSectionTitle,
      socialMedia: socialMedia.length > 0 ? socialMedia : pageContent.content?.socialMedia || [],
      footerTagline: footerTagline || pageContent.content?.footerTagline,
      footerText: footerText || pageContent.content?.footerText,
      footerLinks: footerLinks.length > 0 ? footerLinks : pageContent.content?.footerLinks || [],
      heroPrimaryButtonText: heroPrimaryButtonText || pageContent.content?.heroPrimaryButtonText,
      heroPrimaryButtonLink: heroPrimaryButtonLink || pageContent.content?.heroPrimaryButtonLink,
      heroSecondaryButtonText: heroSecondaryButtonText || pageContent.content?.heroSecondaryButtonText,
      heroSecondaryButtonLink: heroSecondaryButtonLink || pageContent.content?.heroSecondaryButtonLink
    };
    
    pageContent.updatedBy = req.session.userId;
    await pageContent.save();
    
    // Also save to JSON file as backup
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const dataPath = path.join(dataDir, 'homepage.json');
      fs.writeFileSync(dataPath, JSON.stringify(pageContent.content, null, 2));
    } catch (jsonError) {
      console.error('[ADMIN] Failed to save JSON backup:', jsonError);
    }
    
    res.redirect('/admin/configuration?success=Homepage content updated successfully');
  } catch (error) {
    console.error('[ADMIN] Error saving configuration:', error);
    res.redirect('/admin/configuration?error=Failed to save homepage content');
  }
});

module.exports = router;
