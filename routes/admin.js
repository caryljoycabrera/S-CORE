// ===== Admin Routes =====
// This module handles all administrator-facing routes and functionality
// Includes admin dashboard, user management, request management, and admin APIs

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const Notification = require('../models/Notification');
const BroadcastMessage = require('../models/BroadcastMessage');
const SystemSettings = require('../models/SystemSettings');
const RequestType = require('../models/RequestType');
const Page = require('../models/Page');
const { requireAdmin, requireAdminAPI } = require('../middleware/auth');
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
    const approvals = await RequestApproval.find({ isDeleted: { $ne: true } }).populate('userId').lean();
    const serviceRequests = await ServiceRequest.find({ isDeleted: { $ne: true } }).populate('userId').lean();

    // Filter by status - only pending AND unassigned for pending assignment KPI
    const pendingApprovals = approvals.filter(a => a.status?.toLowerCase() === 'pending' && (!a.assignedUnits || a.assignedUnits === 'Not yet assigned'))
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
    const pendingServices = serviceRequests.filter(s => s.status?.toLowerCase() === 'pending' && (!s.assignedUnits || s.assignedUnits === 'Not yet assigned'))
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

    // Get pending requests for admin action list (sorted by oldest first)
    // Convert any pending status to approved
  const allPendingRequests = [...pendingApprovals, ...pendingServices]
      .map(req => ({ ...req, status: 'approved' }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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
      
      if (deadline) {
        if (deadline < now) {
          // Overdue tasks are critical priority
          priority = 'critical';
          priorityLabel = 'Overdue';
          priorityColor = '#dc2626';
        } else if (deadline <= oneDayFromNow) {
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
      // If same priority, sort by deadline (earliest first for upcoming, most overdue first for past due)
      if (a.deadline && b.deadline) {
        const aDeadline = new Date(a.deadline);
        const bDeadline = new Date(b.deadline);
        if (aDeadline < now && bDeadline < now) {
          // Both overdue - most overdue (earliest deadline) first
          return aDeadline - bDeadline;
        } else {
          // At least one not overdue - earliest deadline first
          return aDeadline - bDeadline;
        }
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

    const { getUnits, getRequestStatuses } = require('../utils/settingsHelpers');
    
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
      stats,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
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
    // Filter by last month for consistency with auto-applied monthly filter
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    
    const approvals = await RequestApproval.find({ createdAt: { $gte: lastMonth }, isDeleted: { $ne: true } }).populate('userId').lean();
    const serviceRequests = await ServiceRequest.find({ createdAt: { $gte: lastMonth }, isDeleted: { $ne: true } }).populate('userId').lean();

    const pendingApprovals = approvals.filter(a => a.status?.toLowerCase() === 'pending');
    const pendingServices = serviceRequests.filter(s => s.status?.toLowerCase() === 'pending');

    // Get ALL unassigned tasks with priority classification
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

    // Calculate dynamic KPIs
    const completedRequests = allRequests.filter(r => r.status?.toLowerCase() === 'completed');
    const inProgressRequests = allRequests.filter(r => r.status?.toLowerCase() === 'in progress' || r.status?.toLowerCase() === 'in_progress');
    const inRevisionRequests = allRequests.filter(r => r.status?.toLowerCase() === 'revision required' || r.status?.toLowerCase() === 'revision_required');

    // Calculate Average Turnaround Time (days from creation to completion)
    let avgTurnaroundTime = 2.5; // default
    if (completedRequests.length > 0) {
      const turnaroundTimes = completedRequests
        .filter(r => r.createdAt && r.updatedAt)
        .map(r => {
          const createdDate = new Date(r.createdAt);
          const completedDate = new Date(r.updatedAt);
          return (completedDate - createdDate) / (1000 * 60 * 60 * 24); // convert to days
        });
      if (turnaroundTimes.length > 0) {
        avgTurnaroundTime = (turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length).toFixed(1);
      }
    }

    // Calculate Completion Rate (percentage)
    let completionRate = 85; // default
    if (allRequests.length > 0) {
      completionRate = Math.round((completedRequests.length / allRequests.length) * 100);
    }

    // Calculate Average Response Time (hours from creation to first assignment/status change)
    let avgResponseTime = 4.2; // default
    let responseTimeUnit = 'hrs';
    const responseTimesInHours = allRequests
      .filter(r => r.createdAt && r.updatedAt)
      .map(r => {
        const createdDate = new Date(r.createdAt);
        const firstUpdateDate = new Date(r.updatedAt);
        return (firstUpdateDate - createdDate) / (1000 * 60 * 60); // convert to hours
      });
    if (responseTimesInHours.length > 0) {
      const avgHours = responseTimesInHours.reduce((a, b) => a + b, 0) / responseTimesInHours.length;
      if (avgHours >= 24) {
        avgResponseTime = (avgHours / 24).toFixed(1);
        responseTimeUnit = 'days';
      } else {
        avgResponseTime = avgHours.toFixed(1);
        responseTimeUnit = 'hrs';
      }
    }

    // Count overdue tasks
    const overdueTasks = allRequests.filter(r => {
      return r.deadline && new Date(r.deadline) < now && 
             (r.status?.toLowerCase() !== 'completed');
    }).length;

    // Count active requests (in progress + in revision)
    const activeRequests = inProgressRequests.length + inRevisionRequests.length;

    const stats = {
      totalApprovals: approvals.length,
      totalServices: serviceRequests.length,
      pendingApprovals: pendingApprovals.length,
      pendingServices: pendingServices.length,
      urgentUnassigned: urgentCount,
      totalUnassigned: unassignedTasks.length,
      // Dynamic KPIs
      avgTurnaroundTime: parseFloat(avgTurnaroundTime),
      completionRate: completionRate,
      avgResponseTime: parseFloat(avgResponseTime),
      responseTimeUnit: responseTimeUnit,
      overdueTasks: overdueTasks,
      activeRequests: activeRequests,
      completedRequests: completedRequests.length,
      inProgressRequests: inProgressRequests.length,
      inRevisionRequests: inRevisionRequests.length
    };

    const { getUnits, getRequestStatuses, getRequestTypes } = require('../utils/settingsHelpers');
    const units = getUnits();
    const requestStatuses = getRequestStatuses();
    const requestTypes = getRequestTypes();

    res.render('Admin/analytics', {
      user: req.user,
      stats,
      unassignedTasks,
      units,
      requestStatuses,
      requestTypes
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

    const { getUnits, getRequestStatuses } = require('../utils/settingsHelpers');
    res.render('Admin/approvals', { 
      approvals: approvals, 
      user: req.user,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
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
    let approvals = await RequestApproval.find({ isDeleted: { $ne: true } })
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
    let serviceRequests = await ServiceRequest.find({ isDeleted: { $ne: true } })
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

    const { getUnits, getRequestStatuses } = require('../utils/settingsHelpers');
    res.render('Admin/services', { 
      serviceRequests: serviceRequestsWithDisplay, 
      user: req.user,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
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
    let serviceRequests = await ServiceRequest.find({ isDeleted: { $ne: true } })
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
  const users = await User.find({ isDeleted: { $ne: true } }).lean();
  const settingsHelpers = require('../utils/settingsHelpers');

  const usersWithDisplay = users.map(user => ({
    ...user,
    displayOrganization: user.userType === 'nonstudent'
      ? (Array.isArray(user.affiliation) ? user.affiliation.join(', ') : user.affiliation)
      : (Array.isArray(user.studentOrganization) ? user.studentOrganization.join(', ') : user.studentOrganization)
  }));

  res.render('Admin/users', {
    users: usersWithDisplay,
    user: req.user,
    units: settingsHelpers.getUnits(),
    userRoles: settingsHelpers.getUserRoles(),
    organizations: settingsHelpers.getOrganizations(),
    offices: settingsHelpers.getOffices()
  });
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

    const { getUnits, getRequestStatuses } = require('../utils/settingsHelpers');
    
    res.render('Admin/allrequestsadmin', {
      allRequests,
      user: req.user,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
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
 * POST /api/admin/delete-user
 * Soft delete a user (move to trash)
 */
router.post('/api/admin/delete-user', requireAdminAPI, async (req, res) => {
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

    // Check if user is already deleted
    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is already deleted'
      });
    }

    // Soft delete the user
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id
      },
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User moved to trash successfully',
      user: deletedUser
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
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
  const { requestId, status, assignedUnits, deadline } = req.body;

  try {
    const update = {
      status: status || 'Pending',
      assignedUnits: assignedUnits || 'Not yet assigned'
    };

    // Add deadline if provided
    if (deadline) {
      update.deadline = new Date(deadline);
    }

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
    const { userId, role, unitTeam } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required.'
      });
    }

    if (!['user', 'admin', 'unit'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user", "admin", or "unit".'
      });
    }

    // If role is unit, unitTeam is required
    if (role === 'unit') {
      if (!unitTeam) {
        unitTeam = 'N/A'; // Allow empty, will set to first unit
      }
      if (unitTeam === 'N/A') {
        // Set to first available unit
        const availableUnits = settingsHelpers.getUnits();
        if (availableUnits.length > 0) {
          unitTeam = availableUnits[0];
        } else {
          return res.status(400).json({
            success: false,
            message: 'No units configured. Please configure units in the admin settings first.'
          });
        }
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prepare update object
    const updateData = { role: role };
    if (role === 'unit') {
      updateData.unitTeam = unitTeam;
    } else {
      updateData.unitTeam = 'N/A';
    }

    const result = await User.findByIdAndUpdate(
      userId,
      updateData,
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
        role: result.role,
        unitTeam: result.unitTeam
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
    
    // Date range filter - skip if all other filters are default
    const isDefaultFilters = (!units || units.includes('all')) && 
                            (!requestType || requestType === 'all') && 
                            (!status || status === 'all');
    
    if (dateRange && dateRange !== 'monthly' || (startDate && endDate) || !isDefaultFilters) {
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
    
    if (!requestType || requestType === 'all') {
      // Fetch all requests
      approvals = await RequestApproval.find(query).populate('userId').lean();
      approvals = approvals.map(req => ({ ...req, requestType: 'approval' }));
      services = await ServiceRequest.find(query).populate('userId').lean();
      services = services.map(req => ({ ...req, requestType: 'service' }));
    } else {
      // Filter by specific request type
      const approvalQuery = { ...query, specificRequestType: new RegExp(requestType, 'i') };
      const serviceQuery = { ...query, specificRequestType: new RegExp(requestType, 'i') };
      
      approvals = await RequestApproval.find(approvalQuery).populate('userId').lean();
      approvals = approvals.map(req => ({ ...req, requestType: 'approval' }));
      services = await ServiceRequest.find(serviceQuery).populate('userId').lean();
      services = services.map(req => ({ ...req, requestType: 'service' }));
    }
    
    // Calculate KPIs based on filtered data
    const totalRequests = approvals.length + services.length;
    const pendingRequests = [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'pending').length;
    const inRevision = [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'for revision').length;
    const completedRequests = [...approvals, ...services].filter(r => 
      r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'approved'
    );
    
    // Calculate average turnaround time
    let totalDays = 0;
    completedRequests.forEach(req => {
      if (req.updatedAt && req.createdAt) {
        const days = Math.ceil((new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60 * 24));
        totalDays += days;
      }
    });
    const avgTurnaround = completedRequests.length > 0 ? (totalDays / completedRequests.length).toFixed(1) : 0;
    
    // Calculate average response time (hours from creation to first update)
    let totalResponseHours = 0;
    const responseTimeRequests = [...approvals, ...services].filter(r => r.createdAt && r.updatedAt);
    responseTimeRequests.forEach(req => {
      const hours = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60);
      totalResponseHours += hours;
    });
    const avgResponseTimeHours = responseTimeRequests.length > 0 ? (totalResponseHours / responseTimeRequests.length) : 0;
    
    // Convert to appropriate unit (days if >= 24 hours)
    let avgResponseTime, responseTimeUnit;
    if (avgResponseTimeHours >= 24) {
      avgResponseTime = (avgResponseTimeHours / 24).toFixed(1);
      responseTimeUnit = 'days';
    } else {
      avgResponseTime = avgResponseTimeHours.toFixed(1);
      responseTimeUnit = 'hrs';
    }
    
    // Count overdue tasks
    const now = new Date();
    const overdueTasks = [...approvals, ...services].filter(r => {
      return r.deadline && new Date(r.deadline) < now && 
             (r.status?.toLowerCase() !== 'completed' && r.status?.toLowerCase() !== 'rejected');
    }).length;
    
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
    
    // Turnaround time by unit calculation
    const unitTurnaround = {};
    const unitRequestCount = {};
    [...approvals, ...services].forEach(req => {
      if (req.assignedUnits && req.updatedAt && req.createdAt && 
          (req.status?.toLowerCase() === 'completed' || req.status?.toLowerCase() === 'approved')) {
        const days = Math.ceil((new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60 * 24));
        if (!unitTurnaround[req.assignedUnits]) {
          unitTurnaround[req.assignedUnits] = 0;
          unitRequestCount[req.assignedUnits] = 0;
        }
        unitTurnaround[req.assignedUnits] += days;
        unitRequestCount[req.assignedUnits] += 1;
      }
    });
    
    // Calculate average turnaround by unit
    const turnaroundByUnit = {};
    Object.keys(unitTurnaround).forEach(unit => {
      turnaroundByUnit[unit] = unitRequestCount[unit] > 0 ? 
        Math.round(unitTurnaround[unit] / unitRequestCount[unit]) : 0;
    });
    
    // Total workload by unit calculation (all requests assigned to each unit)
    const totalWorkload = {};
    [...approvals, ...services].forEach(req => {
      if (req.assignedUnits) {
        totalWorkload[req.assignedUnits] = (totalWorkload[req.assignedUnits] || 0) + 1;
      }
    });
    
    // Response time by unit calculation (time from assignment to first update)
    const unitResponseTime = {};
    const unitResponseCount = {};
    [...approvals, ...services].forEach(req => {
      if (req.assignedUnits && req.updatedAt && req.createdAt) {
        // For response time, we want time from creation to first meaningful update
        // This approximates when the unit started working on it
        const hours = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60);
        if (!unitResponseTime[req.assignedUnits]) {
          unitResponseTime[req.assignedUnits] = 0;
          unitResponseCount[req.assignedUnits] = 0;
        }
        unitResponseTime[req.assignedUnits] += hours;
        unitResponseCount[req.assignedUnits] += 1;
      }
    });
    
    // Calculate average response time by unit
    const responseTimeByUnit = {};
    Object.keys(unitResponseTime).forEach(unit => {
      responseTimeByUnit[unit] = unitResponseCount[unit] > 0 ? 
        Math.round(unitResponseTime[unit] / unitResponseCount[unit]) : 0;
    });
    
    // Filtered results data
    const allFilteredRequests = [...approvals, ...services];
    
    // Status breakdown for filtered data
    const statusBreakdown = {};
    allFilteredRequests.forEach(req => {
      const status = req.status || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    
    // Type breakdown for filtered data
    const typeBreakdown = {
      'Approval': approvals.length,
      'Service': services.length
    };
    
    // Send response
    res.json({
      success: true,
      kpis: {
        totalRequests,
        avgTurnaround: parseFloat(avgTurnaround),
        pendingAssignment: pendingRequests,
        inRevision,
        completed: completedRequests.length,
        overdue: overdueTasks,
        activeRequests: [...approvals, ...services].filter(r => 
          r.status?.toLowerCase() === 'in progress' || r.status?.toLowerCase() === 'for revision'
        ).length,
        avgResponseTime: parseFloat(avgResponseTime),
        responseTimeUnit
      },
      charts: {
        topRequestors: topOrgs,
        unitWorkload: {
          labels: Object.keys(unitWorkload),
          data: Object.values(unitWorkload)
        },
        turnaroundByUnit: {
          labels: Object.keys(turnaroundByUnit),
          data: Object.values(turnaroundByUnit)
        },
        totalWorkload: {
          labels: Object.keys(totalWorkload),
          data: Object.values(totalWorkload)
        },
        responseTimeByUnit: {
          labels: Object.keys(responseTimeByUnit),
          data: Object.values(responseTimeByUnit)
        },
        statusBreakdown: {
          labels: ['Pending', 'In Progress', 'Awaiting', 'Revision', 'Completed'],
          data: [
            [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'pending').length,
            [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'in progress').length,
            [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'awaiting approval' || r.status?.toLowerCase() === 'approved').length,
            inRevision,
            [...approvals, ...services].filter(r => r.status?.toLowerCase() === 'completed').length
          ]
        }
      },
      filtered: {
        requests: allFilteredRequests.slice(0, 100), // Limit to 100 for performance
        statusBreakdown: {
          labels: Object.keys(statusBreakdown),
          data: Object.values(statusBreakdown)
        },
        typeBreakdown: {
          labels: Object.keys(typeBreakdown),
          data: Object.values(typeBreakdown)
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



// ==================== REPORTS ROUTES ====================

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
 * POST /admin/reports/export
 * Export report data as PDF or Excel
 */
router.post('/admin/reports/export', requireAdmin, async (req, res) => {
  console.log('Export route called');
  try {
    console.log('Export request received:', req.body);
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('User role:', req.user ? req.user.role : 'No role');
    const {
      startDate,
      endDate,
      units,
      requestType,
      statuses,
      format = 'pdf', // Default to PDF, can be 'pdf' or 'excel'
      orientation = 'portrait', // Default to portrait, can be 'portrait' or 'landscape'
      title,
      headerColor,
      paperSize
    } = req.body;

    const filters = {
      startDate,
      endDate,
      units: units && Array.isArray(units) ? units : (units ? [units] : []),
      requestType,
      statuses: statuses && Array.isArray(statuses) ? statuses : (statuses ? [statuses] : []),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const reportData = await reportService.generateReport(filters);
    const summary = await reportService.getReportSummary(filters);

    console.log('Report data generated:', reportData.length, 'records');
    console.log('Summary:', summary);

    let buffer, contentType, fileName, fileExtension;

    if (format === 'excel') {
      // Generate Excel
      buffer = await reportService.exportToExcel(reportData, summary, { headerColor, title });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      // Generate PDF (default)
      buffer = await reportService.generatePDF(reportData, summary, orientation, { title, headerColor, paperSize });
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    }

    // Save to ReportHistory in MongoDB
    const ReportHistory = require('../models/ReportHistory');

    fileName = `s-core-report-${Date.now()}.${fileExtension}`;

    console.log('Attempting to save report to history...');

    try {
      // Save to database
      const reportHistory = new ReportHistory({
        reportType: format === 'excel' ? 'report_excel' : 'report_pdf',
        generatedBy: req.user._id,
        fileName,
        fileData: buffer,
        fileSize: buffer.length,
        filters,
        options: { title, headerColor, paperSize, orientation },
        recordCount: reportData.length
      });

      console.log('Created ReportHistory instance, generatedBy:', req.user._id, 'fileSize:', buffer.length);
      await reportHistory.save();
      console.log('Report saved to history successfully with ID:', reportHistory._id);
    } catch (saveError) {
      console.error('Error saving report to history:', saveError);
      console.error('Save error details:', saveError.message, saveError.stack);
      // Don't fail the export if history save fails
    }

    console.log('Buffer generated, size:', buffer.length);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting report:', error);
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

/**
 * GET /admin/reports/history
 * Get report history for all admin users
 */
router.get('/admin/reports/history', requireAdmin, async (req, res) => {
  try {
    console.log('Fetching report history for admins');
    const ReportHistory = require('../models/ReportHistory');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query - show all reports for admins
    const query = {};
    if (req.query.type) {
      query.reportType = req.query.type;
    }
    // Temporarily show all reports including deleted for debugging
    // if (req.query.includeDeleted !== 'true') {
    //   query.isDeleted = false;
    // }

    console.log('History query:', query);

    const reports = await ReportHistory.find(query)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-fileData')
      .lean();

    const total = await ReportHistory.countDocuments(query);

    console.log('Found', reports.length, 'reports, total:', total);
    console.log('Sample report:', reports[0] ? { _id: reports[0]._id, fileName: reports[0].fileName, generatedAt: reports[0].generatedAt } : 'No reports');

    res.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/reports/download/:id
 * Download a report from history
 */
router.get('/admin/reports/download/:id', requireAdmin, async (req, res) => {
  try {
    const ReportHistory = require('../models/ReportHistory');
    const report = await ReportHistory.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const contentType = report.reportType === 'report_excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.send(report.fileData);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /admin/reports/history/:id
 * Soft delete a report from history
 */
router.delete('/admin/reports/history/:id', requireAdmin, async (req, res) => {
  try {
    const ReportHistory = require('../models/ReportHistory');
    const report = await ReportHistory.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await report.softDelete();

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /admin/reports/history/:id/hard
 * Permanently delete a report from history
 */
router.delete('/admin/reports/history/:id/hard', requireAdmin, async (req, res) => {
  try {
    const ReportHistory = require('../models/ReportHistory');
    const report = await ReportHistory.findOne({
      _id: req.params.id
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await ReportHistory.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Report permanently deleted successfully' });
  } catch (error) {
    console.error('Error permanently deleting report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /admin/analytics/export-pdf
 * Export analytics data as PDF
 */
router.post('/admin/analytics/export-pdf', requireAdmin, async (req, res) => {
  try {
    const { analyticsData } = req.body;

    console.log('📊 Received analytics data for PDF export:', JSON.stringify(analyticsData, null, 2));

    // Generate PDF using the report service
    const pdfBuffer = await reportService.generateAnalyticsPDF(analyticsData);

    // Save to ReportHistory in MongoDB
    const ReportHistory = require('../models/ReportHistory');

    const fileName = `analytics-report-${Date.now()}.pdf`;

    // Save to database with PDF data
    const reportHistory = new ReportHistory({
      reportType: 'analytics_pdf',
      generatedBy: req.user._id,
      fileName,
      pdfData: pdfBuffer,
      fileSize: pdfBuffer.length,
      filters: analyticsData.filters || {}
    });

    await reportHistory.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment;filename=${fileName}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting analytics PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/analytics/reports/history
 * Get reports history for current user
 */
router.get('/admin/analytics/reports/history', requireAdmin, async (req, res) => {
  try {
    const ReportHistory = require('../models/ReportHistory');

    const reports = await ReportHistory.find({
      generatedBy: req.user._id
    })
    .sort({ generatedAt: -1 })
    .limit(50); // Limit to last 50 reports

    res.json({
      success: true,
      reports: reports.map(report => ({
        _id: report._id,
        reportType: report.reportType,
        fileName: report.fileName,
        generatedAt: report.generatedAt,
        fileSize: report.fileSize,
        downloadCount: report.downloadCount,
        filters: report.filters
      }))
    });
  } catch (error) {
    console.error('Error fetching reports history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /admin/analytics/reports/download/:reportId
 * Download a specific report
 */
router.get('/admin/analytics/reports/download/:reportId', requireAdmin, async (req, res) => {
  try {
    const ReportHistory = require('../models/ReportHistory');
    const report = await ReportHistory.findOne({
      _id: req.params.reportId,
      generatedBy: req.user._id
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Increment download count
    report.downloadCount += 1;
    await report.save();

    // Send PDF data from MongoDB
    const fileName = report.fileName;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment;filename=${fileName}`);
    res.send(report.pdfData);
  } catch (error) {
    console.error('Error downloading report:', error);
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
    const { getUnits } = require('../utils/settingsHelpers');
    const settingsService = require('../services/settingsService');
    const user = await User.findById(req.session.userId);
    const result = await announcementService.getAnnouncements(1, 50);
    const stats = await announcementService.getStatistics();
    const units = getUnits();
    const settings = await settingsService.getSettings();
    const unreadCount = await Notification.countDocuments({
      recipient: req.session.userId,
      isRead: false
    });

    res.render('Admin/announcements', {
      user: user,
      announcements: result.announcements,
      stats: stats,
      units: units,
      announcementPriorities: (settings.announcementPriorities || ['low', 'medium', 'high']).map(p => p.toLowerCase()),
      announcementTypes: settings.announcementTypes || ['Event', 'News', 'Reminder', 'Update', 'Maintenance'],
      organizations: settings.organizations || [],
      offices: settings.offices || [],
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
      type,
      recipientType,
      organization,
      office,
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
      type: type || 'News',
      recipientType: recipientType || 'all',
      organization,
      office,
      recipients: recipients && Array.isArray(recipients) ? recipients : [],
      scheduledTime,
      sentBy: req.session.userId
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
 * POST /admin/announcement/upload
 * Upload files/images for announcements
 */
router.post('/admin/announcement/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'File upload failed' 
    });
  }
});

/**
 * PUT /admin/announcement/:id
 * Update announcement
 */
router.put('/admin/announcement/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority, type, recipientType, organization, office, recipients, scheduledTime } = req.body;

    const announcement = await announcementService.updateAnnouncement(req.params.id, {
      title,
      content,
      priority,
      type,
      recipientType,
      organization,
      office,
      recipients: recipients && Array.isArray(recipients) ? recipients : undefined,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null
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
 * Soft delete announcement
 */
router.delete('/admin/announcement/:id', requireAdmin, async (req, res) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id, req.session.userId);

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
 * GET /admin/announcements/deleted
 * Get deleted announcements for trash
 */
router.get('/admin/announcements/deleted', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await announcementService.getDeletedAnnouncements(page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching deleted announcements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /admin/announcement/:id/restore
 * Restore deleted announcement
 */
router.put('/admin/announcement/:id/restore', requireAdmin, async (req, res) => {
  try {
    const announcement = await announcementService.restoreAnnouncement(req.params.id);

    res.json({
      success: true,
      message: 'Announcement restored successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error restoring announcement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /admin/announcement/:id/permanent
 * Permanently delete announcement
 */
router.delete('/admin/announcement/:id/permanent', requireAdmin, async (req, res) => {
  try {
    await announcementService.permanentlyDeleteAnnouncement(req.params.id);

    res.json({
      success: true,
      message: 'Announcement permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting announcement:', error);
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

    const { getUnits, getRequestStatuses } = require('../utils/settingsHelpers');
    const units = getUnits();
    const requestStatuses = getRequestStatuses();
    
    // Get actual request types from database
    const serviceRequestTypes = await ServiceRequest.distinct('specificRequestType', { 
      specificRequestType: { $exists: true, $ne: null, $ne: '' } 
    });
    const approvalRequestTypes = await RequestApproval.distinct('specificRequestType', { 
      specificRequestType: { $exists: true, $ne: null, $ne: '' } 
    });
    const requestTypes = [...new Set([...serviceRequestTypes, ...approvalRequestTypes])].filter(type => type);

    res.render('Admin/analytics', {
      user: req.user,
      title: 'Analytics',
      analytics: analytics,
      requestTypeAnalytics: requestTypeAnalytics,
      unitAnalytics: unitAnalytics,
      userAnalytics: userAnalytics,
      units,
      requestStatuses,
      requestTypes
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

    // Get system settings
    let settings = await settingsService.getSettings();
    
    // Track if we need to save defaults
    let needsSave = false;
    const defaultUpdates = {};

    // Initialize default units if not set
    if (!settings.units || settings.units.length === 0) {
      defaultUpdates.units = ['Graphics', 'Multimedia', 'Public Relations', 'Social Media'];
      needsSave = true;
    }

    // Initialize default organizations if not set
    if (!settings.organizations || settings.organizations.length === 0) {
      defaultUpdates.organizations = [
        "University Student Government (USG)",
        "Internal Audit Service (IAS)",
        "University Student Election Commission (USEC)",
        "Office of the Solicitor General (OSG)",
        "College of Business Administration and Accountancy Student Government (CBAASG)",
        "Business Management Program Council (BMPC)",
        "Junior Philippine Institute of Accountants (JPIA)",
        "Marketing Management Program Council (MMPC)",
        "College of Education Student Government (COEdSG)",
        "College of Engineering, Architecture and Technology Student Government (CEATSG)",
        "Architecture Program Council (ArchPC)",
        "Civil Engineering Program Council (CEEPC)",
        "Computer Engineering Program Council (CpEPC)",
        "Electrical Engineering Program Council (EEEPC)",
        "Electronics Engineering Program Council (ECEPC)",
        "Industrial Engineering Program Council (IEEPC)",
        "Mechanical Engineering Program Council (MEEPC)",
        "Multimedia Arts Program Council (MMAPC)",
        "College of Tourism and Hospitality Management Student Government (CTHMSG)",
        "College of Criminal Justice Education Student Government (CCJESG)",
        "Criminology Program Council (CrimPC)",
        "Forensic Science Program Council (FScPC)",
        "College of Liberal Arts and Communication Student Government (CLACSG)",
        "Communication Program Council (CPC)",
        "International Development Program Council (IDPC)",
        "Political Science Program Council (PSPC)",
        "Psychology Program Council (PPC)",
        "College of Science Student Government (COSSG)",
        "Applied Mathematics Program Council (AMPC)",
        "Biology Program Council (BioPC)",
        "College of Information and Computer Studies Student Government (CICSSG)",
        "Computer Science Program Council (CSPC)",
        "Information Technology Program Council (ITPC)",
        "DLSU-D Chorale (CHORALE)",
        "Lasallian Symphony Orchestra (LSO)",
        "La Salle Filipiniana Dance Company (LSFDC)",
        "Lasallian Pointes N' Flexes Dance Company (LPNFDC)",
        "Lasallian Pop Band (LPB)",
        "Teatro Lasalliana (TEATRO)",
        "Visual and Performing Arts Production Unit (VPAPU)",
        "Heraldo Filipino",
        "Vicissitude",
        "Council of Student Organizations (CSO)",
        "Business Operations Management Society (BOMS)",
        "Junior Marketing Association (JMA)",
        "DLSU-D Psychological Society (DPS)",
        "DLSU-D Pre-Medical Society (DPMS)",
        "Hotel and Restaurant Management Society (HRMS)",
        "Turismo Lasalleño Society (TLS)",
        "Lasallian Educators Society (LES)",
        "American Society of Heating, Refrigerating, and Air-Conditioning Engineers (ASHRAE DLSU-D)",
        "DLSU-D Pre-Law Society (DPLS)",
        "Astraeus Literary and Arts Guild",
        "Accounting Enrichment Society (ACES)",
        "Circle of Student Assistants (COSA)",
        "DLSU-D Lifters",
        "DLSU-D Patriots of Animal Welfare and Support (PAWS)",
        "DLSU-D United Patriots Football Club",
        "Junior Financial Executives Institute of the Philippines (JFINEX)",
        "Marché Société (MS)",
        "PROJECT: Ikigai (PROJ:Ik) - former Viridescent A-1",
        "SINAG Society of Leaders (SISOL)",
        "Campus Peer Ministers (CPM) and Youth for Christ of (YFC) of Campus Ministry Office",
        "Lasallian Peer Facilitators (LPF) of Student Wellness Center",
        "Lasallian Student Ambassadors (LSA) of Linkages and Scholarship Office",
        "LS Verde of Campus Sustainability Office",
        "Students' Extension of Resources through Voluntary Effort (SERVE) of LCDC",
        "Green FM of Communications and Journalism Department",
        "International Students' Association (ISA) of International Students Office",
        "Lasallian Youth Accompaniment Group (LaYAG) of University Lasallian Family Office"
      ];
      needsSave = true;
    }

    // Initialize default offices if not set
    if (!settings.offices || settings.offices.length === 0) {
      defaultUpdates.offices = [
        "Office of the President",
        "Office of the Chief Administrative Officer",
        "Office of the Provost",
        "Office of the Chief Lasallian Mission Officer",
        "Office of the Principal",
        "Corporate and Executive Management Office",
        "Center for Heritage Conservation",
        "Museo De La Salle",
        "Risk, Compliance and Audit Office",
        "University Chaplain",
        "Office of the Vice President for Administrative Services",
        "Office of the Vice President for Finance",
        "Office of the Vice President for Global Engagement and External Relations",
        "Human Resource Management Office",
        "Strategic Communications Office",
        "Ancillary and Asset Management Office",
        "Legal Counsel",
        "Data Protection Office",
        "Campus Development Office",
        "Buildings and Facilities Maintenance Office",
        "Campus Sustainability Office",
        "General Services Office",
        "Green Architecture and Campus Planning Office",
        "Information and Communications Technology Center",
        "Accounting Office",
        "Treasury Office",
        "Advancement and Alumni Relations Office",
        "Lasallian Community Development Center",
        "Linkages and Scholarship Office",
        "Office of the Vice Provost for Academics",
        "Office of the Deputy Provost for Research",
        "Academic Planning and Quality Management",
        "College of Law",
        "College of Professional and Graduate Studies",
        "School of Innovative and Flexible Learning",
        "School of Governance, Public Service, and Corporate Leadership",
        "Aklatang Emilio Aguinaldo-Information Resource Center",
        "Center for Student Admissions",
        "University Registrar",
        "Cavite Studies Center",
        "University Research Office",
        "Herminia D. Torres Quality Assurance Office",
        "Center for Innovative Learning Program",
        "Center for Curriculum Development and Instruction",
        "Language Learning Center",
        "Center for Artificial Intelligence",
        "Center for Creative Program",
        "Academy of Continuing Education",
        "College of Business Administration and Accountancy",
        "Accountancy Department",
        "Allied Business Department",
        "Business Management Department",
        "Marketing Department",
        "College of Criminal Justice Education",
        "College of Education",
        "Physical Education Department",
        "Professional Education Department",
        "Religious Education Department",
        "College of Engineering, Architecture and Technology",
        "Architecture Department",
        "Engineering Department",
        "Graphics Design and Multimedia Department",
        "Center of Technology",
        "College of Information and Computer Studies",
        "Computer Studies Department",
        "Information Technology Department",
        "College of Liberal Arts and Communication",
        "Communication and Journalism Department",
        "Languages and Literature Department",
        "Social Sciences Department",
        "Philosophy and Psychology Department",
        "College of Tourism and Hospitality Management",
        "Hospitality Management Department",
        "Tourism Management Department",
        "College of Science",
        "Biological Sciences Department",
        "Mathematics & Statistics Department",
        "Physical Sciences Department",
        "Office of Student Services",
        "Student Development and Activities Office",
        "Student Welfare and Formation Office",
        "Student Wellness Center",
        "NSTP-CWTS",
        "Campus Ministry Office",
        "DLS Bahay Pag-asa Dasmariñas",
        "Night College",
        "Sports Development Office",
        "University Lasallian Family Office",
        "Basic Education",
        "Office of the Associate Principal for Academics and Research",
        "Office of the Associate Principal for Administrative Services and Student Affairs",
        "Dormitory",
        "Materials Reproduction Office / Food Services Office",
        "Retreat and Conference Center / Sports & Recreation Complex",
        "Warehouse Office",
        "Safety & Health Office",
        "Purchasing Office",
        "Transportation Office",
        "Facilities Maintenance Office",
        "Housekeeping & Grounds",
        "De La Salle Dasmariñas Alumni Association",
        "DLSU-D Development Cooperative",
        "Faculty Organization",
        "KABALIKAT ng DLSU-D Inc.",
        "Parents Organization La Salle Cavite",
        "Human Resource Management Office"
      ];
      needsSave = true;
    }

    // Initialize default request type mappings if not set
    if (!settings.requestTypeMappings || settings.requestTypeMappings.length === 0) {
      defaultUpdates.requestTypeMappings = [
        { requestType: 'Creation of New Graphics/Pubmat', recommendedUnit: 'Graphics' },
        { requestType: 'Creation of New Logo/Branding Element', recommendedUnit: 'Graphics' },
        { requestType: 'Event Photo & Video Coverage', recommendedUnit: 'Multimedia' },
        { requestType: 'Photo/Video Editing Service', recommendedUnit: 'Multimedia' },
        { requestType: 'Magazine Content Creation', recommendedUnit: 'Public Relations' },
        { requestType: 'Social Media Content Sharing/Posting', recommendedUnit: 'Social Media' },
        { requestType: 'Content Posting', recommendedUnit: 'Public Relations' },
        { requestType: 'Social Media Monitoring', recommendedUnit: 'Social Media' },
        { requestType: 'Caption Approval', recommendedUnit: 'Public Relations' },
        { requestType: 'Publication Design', recommendedUnit: 'Graphics' },
        { requestType: 'Proofreading', recommendedUnit: 'Public Relations' },
        { requestType: 'Graphics Design', recommendedUnit: 'Graphics' },
        { requestType: 'Media Coverage', recommendedUnit: 'Multimedia' }
      ];
      needsSave = true;
    }

    // Initialize default request statuses if not set
    if (!settings.requestStatuses || settings.requestStatuses.length === 0) {
      defaultUpdates.requestStatuses = ['Pending', 'Queued', 'In Progress', 'For Checking', 'Approved', 'For Revision', 'Completed', 'Rejected', 'Archived'];
      needsSave = true;
    }

    // User roles are now automatically initialized by server.js and settingsService
    // No need to check here as they are always populated on server startup

    // Initialize default announcement priorities if not set
    if (!settings.announcementPriorities || settings.announcementPriorities.length === 0) {
      defaultUpdates.announcementPriorities = ['low', 'medium', 'high'];
      needsSave = true;
    }

    // Initialize default announcement types if not set
    if (!settings.announcementTypes || settings.announcementTypes.length === 0) {
      defaultUpdates.announcementTypes = ['Event', 'News', 'Reminder', 'Update', 'Maintenance'];
      needsSave = true;
    }

    // Save defaults to database if needed
    if (needsSave) {
      await settingsService.updateSettings(defaultUpdates);
      settings = await settingsService.getSettings(); // Reload settings with defaults
      console.log('[ADMIN] Initialized default system settings in database');
    }

    // Get request types
    let requestTypes = [];
    try {
      requestTypes = await RequestType.find({}).sort({ name: 1 });
      if (!Array.isArray(requestTypes)) {
        requestTypes = [];
      }
    } catch (error) {
      console.error('Error fetching request types:', error);
      requestTypes = [];
    }
    
    res.render('Admin/configuration', {
      name: user.firstName,
      user: user,
      pageContent: pageContent.content || {},
      settings: settings,
      requestTypes: requestTypes,
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
      heroSecondaryButtonText, heroSecondaryButtonLink,
      // S-CORE Section
      sCoreSectionTitle,
      sCorePlatformDescription, sCoreWhatIsTitle, sCoreWhatIsDescription,
      sCoreWhyTitle, sCoreWhyDescription, sCoreDashboardImage,
      sCoreLoginButtonText, sCoreLoginButtonLink, sCoreLoginButtonStyle,
      sCoreSignupButtonText, sCoreSignupButtonLink, sCoreSignupButtonStyle
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
      heroSecondaryButtonLink: heroSecondaryButtonLink || pageContent.content?.heroSecondaryButtonLink,
      // S-CORE Section
      sCoreSectionTitle: sCoreSectionTitle || pageContent.content?.sCoreSectionTitle,
      sCorePlatformDescription: sCorePlatformDescription || pageContent.content?.sCorePlatformDescription,
      sCoreWhatIsTitle: sCoreWhatIsTitle || pageContent.content?.sCoreWhatIsTitle,
      sCoreWhatIsDescription: sCoreWhatIsDescription || pageContent.content?.sCoreWhatIsDescription,
      sCoreWhyTitle: sCoreWhyTitle || pageContent.content?.sCoreWhyTitle,
      sCoreWhyDescription: sCoreWhyDescription || pageContent.content?.sCoreWhyDescription,
      sCoreDashboardImage: sCoreDashboardImage || pageContent.content?.sCoreDashboardImage,
      sCoreLoginButtonText: sCoreLoginButtonText || pageContent.content?.sCoreLoginButtonText,
      sCoreLoginButtonLink: sCoreLoginButtonLink || pageContent.content?.sCoreLoginButtonLink,
      sCoreLoginButtonStyle: sCoreLoginButtonStyle || pageContent.content?.sCoreLoginButtonStyle,
      sCoreSignupButtonText: sCoreSignupButtonText || pageContent.content?.sCoreSignupButtonText,
      sCoreSignupButtonLink: sCoreSignupButtonLink || pageContent.content?.sCoreSignupButtonLink,
      sCoreSignupButtonStyle: sCoreSignupButtonStyle || pageContent.content?.sCoreSignupButtonStyle
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
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'Homepage content updated successfully' });
    } else {
      return res.redirect('/admin/configuration?success=Homepage content updated successfully');
    }
  } catch (error) {
    console.error('[ADMIN] Error saving configuration:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Failed to save homepage content' });
    } else {
      return res.redirect('/admin/configuration?error=Failed to save homepage content');
    }
  }
});

/**
 * POST /admin/system-configuration
 * Save system configuration settings
 */
router.post('/admin/system-configuration', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    // Process organizations from textarea
    const organizations = req.body.organizationsList ? 
      req.body.organizationsList.split('\n').map(org => org.trim()).filter(org => org) : 
      [];

    // Process units and their request types
    const units = [];
    const requestTypeMappings = [];
    
    if (req.body.unitName && Array.isArray(req.body.unitName)) {
      req.body.unitName.forEach((unitName, index) => {
        if (unitName && unitName.trim()) {
          units.push(unitName.trim());
          
          // Process request types for this unit
          const unitRequestTypesText = req.body.unitRequestTypes[index] || '';
          const requestTypesForUnit = unitRequestTypesText
            .split('\n')
            .map(rt => rt.trim())
            .filter(rt => rt);
          
          // Create mappings for each request type to this unit
          requestTypesForUnit.forEach(requestType => {
            requestTypeMappings.push({
              requestType: requestType,
              recommendedUnit: unitName.trim()
            });
          });
        }
      });
    }

    // Process offices/departments
    const offices = req.body.officesList ? 
      req.body.officesList.split('\n').map(office => office.trim()).filter(office => office) : 
      [];

    // Process request statuses
    const requestStatuses = req.body.requestStatuses ? 
      req.body.requestStatuses.split('\n').map(status => status.trim()).filter(status => status) : 
      ['Pending', 'Queued', 'In Progress', 'For Checking', 'Approved', 'For Revision', 'Completed', 'Rejected', 'Archived'];

    // Process user roles with simplified permissions
    const userRoles = [];
    if (req.body.roleName && Array.isArray(req.body.roleName)) {
      req.body.roleName.forEach((roleName, index) => {
        if (roleName && roleName.trim()) {
          // Get the access level from radio button (roleAccessLevel_0, roleAccessLevel_1, etc.)
          const accessLevel = req.body[`roleAccessLevel_${index}`] || 'user';
          
          console.log(`[ADMIN] Role ${index}: ${roleName}, Access Level: ${accessLevel}`);
          
          // Convert access level to permission array matching users.ejs system
          let permissions = [];
          switch(accessLevel) {
            case 'user':
              permissions = ['user']; // Submits Requests
              break;
            case 'unit':
              permissions = ['unit']; // Works on Tasks
              break;
            case 'admin':
              permissions = ['admin']; // Full System Access
              break;
            default:
              permissions = ['user'];
          }
          
          userRoles.push({
            name: roleName.trim(),
            permissions: permissions
          });
        }
      });
    }
    
    console.log('[ADMIN] Processed user roles:', JSON.stringify(userRoles, null, 2));

    // Process announcement priorities
    const announcementPriorities = req.body.announcementPriorities ? 
      req.body.announcementPriorities.split('\n').map(priority => priority.trim()).filter(priority => priority) : 
      ['low', 'medium', 'high'];

    // Process announcement types
    const announcementTypes = req.body.announcementTypes ? 
      req.body.announcementTypes.split('\n').map(type => type.trim()).filter(type => type) : 
      ['Event', 'News', 'Reminder', 'Update', 'Maintenance'];

    // Process allowed file types
    const allowedFileTypes = req.body.allowedFileTypes ? 
      req.body.allowedFileTypes.split('\n').map(type => type.trim()).filter(type => type) : 
      ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'pptx'];

    // Update system settings
    const updateData = {
      // Core configurations
      organizations: organizations,
      units: units,
      offices: offices,
      requestStatuses: requestStatuses,
      userRoles: userRoles,
      announcementPriorities: announcementPriorities,
      announcementTypes: announcementTypes,
      requestTypeMappings: requestTypeMappings,
      
      // General settings
      siteTitle: req.body.siteTitle,
      siteDescription: req.body.siteDescription,
      timezone: req.body.timezone,
      dateFormat: req.body.dateFormat,
      logo: req.body.logo || null,
      favicon: req.body.favicon || null,
      
      // Request management settings
      maxRevisions: parseInt(req.body.maxRevisions) || 3,
      maxMinorRevisions: parseInt(req.body.maxMinorRevisions) || 2,
      defaultDeadlineDays: parseInt(req.body.defaultDeadlineDays) || 7,
      autoApproveAfterRevisions: req.body.autoApproveAfterRevisions === 'on',
      requireUnitReview: req.body.requireUnitReview === 'on',
      
      // File storage settings
      maxFileSize: parseInt(req.body.maxFileSize) || 50,
      allowedFileTypes: allowedFileTypes,
      storageType: req.body.storageType || 'local',
      retainAllRevisionFiles: req.body.retainAllRevisionFiles === 'on',
      autoDeleteOldFilesAfterDays: req.body.autoDeleteOldFilesAfterDays ? parseInt(req.body.autoDeleteOldFilesAfterDays) : null,
      
      // Notification settings
      enableEmailNotifications: req.body.enableEmailNotifications === 'on',
      notificationFrequency: req.body.notificationFrequency || 'immediate',
      emailFrom: req.body.emailFrom,
      smtpHost: req.body.smtpHost,
      smtpPort: parseInt(req.body.smtpPort) || 587,
      
      // Maintenance & backup
      maintenanceMode: req.body.maintenanceMode === 'on',
      maintenanceMessage: req.body.maintenanceMessage,
      backupEnabled: req.body.backupEnabled === 'on',
      backupFrequency: req.body.backupFrequency || 'weekly',
      backupRetentionDays: parseInt(req.body.backupRetentionDays) || 90,
      
      // Audit & logging
      enableDetailedLogs: req.body.enableDetailedLogs === 'on',
      trackUserActions: req.body.trackUserActions === 'on',
      logRetentionDays: parseInt(req.body.logRetentionDays) || 90,
      
      // Metadata
      updatedBy: user._id,
      updatedAt: new Date()
    };

    console.log('[ADMIN] Saving userRoles to database:', JSON.stringify(updateData.userRoles, null, 2));
    
    await settingsService.updateSettings(updateData);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.json({ success: true, message: 'System configuration updated successfully' });
    } else {
      return res.redirect('/admin/configuration?success=System configuration updated successfully');
    }
  } catch (error) {
    console.error('[ADMIN] Error saving system configuration:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
      return res.status(500).json({ success: false, message: 'Failed to save system configuration' });
    } else {
      return res.redirect('/admin/configuration?error=Failed to save system configuration');
    }
  }
});

/**
 * GET /admin/analytics-data/top-requestors
 * Get top requestors for pie chart
 */
router.get('/admin/analytics-data/top-requestors', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find({ isDeleted: { $ne: true } }).populate('userId').lean();
    const serviceRequests = await ServiceRequest.find({ isDeleted: { $ne: true } }).populate('userId').lean();
    const allRequests = [...approvals, ...serviceRequests];

    // Group by organization
    const organizationMap = {};
    allRequests.forEach(req => {
      const org = req.organization || req.userId?.studentOrganization?.[0] || req.userId?.affiliation?.[0] || 'Unknown';
      organizationMap[org] = (organizationMap[org] || 0) + 1;
    });

    // Sort and get top 8
    const topRequestors = Object.entries(organizationMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    res.json({
      success: true,
      labels: topRequestors.map(r => r.name),
      data: topRequestors.map(r => r.count)
    });
  } catch (error) {
    console.error('Error loading top requestors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/analytics-data/request-volume
 * Get request volume over time with optional filters
 */
router.get('/admin/analytics-data/request-volume', requireAdmin, async (req, res) => {
  try {
    console.log('Request volume query:', req.query);
    
    const days = parseInt(req.query.days) || 30;
    const { dateRange, units, requestType, status, startDate, endDate } = req.query;
    
    // Build query based on filters
    let query = {};
    
    // Date range filter
    if (dateRange && dateRange !== 'monthly' || (startDate && endDate) || days !== 30) {
      let dateFilter = {};
      const now = new Date();
      
      if (startDate && endDate) {
        // Custom date range
        dateFilter.$gte = new Date(startDate);
        dateFilter.$lte = new Date(endDate);
      } else {
        // Standard date ranges
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
          default:
            // Default to days parameter
            dateFilter.$gte = new Date(now.setDate(now.getDate() - days));
        }
      }
      
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }
    
    // Unit filter
    if (units && units !== 'all') {
      const unitArray = units.split(',');
      query.assignedUnits = { $in: unitArray };
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = new RegExp(status, 'i');
    }
    
    // Fetch data based on request type
    let approvals = [];
    let services = [];
    
    // Add isDeleted filter to exclude soft-deleted items
    query.isDeleted = { $ne: true };
    
    console.log('Final query:', query);
    console.log('Request type filter:', requestType);
    
    if (!requestType || requestType === 'all') {
      // Fetch all requests
      console.log('Fetching all requests');
      approvals = await RequestApproval.find(query).populate('userId').lean();
      services = await ServiceRequest.find(query).populate('userId').lean();
    } else {
      // Filter by specific request type
      console.log('Filtering by request type:', requestType);
      const approvalQuery = { ...query, specificRequestType: new RegExp(requestType, 'i') };
      const serviceQuery = { ...query, specificRequestType: new RegExp(requestType, 'i') };
      
      console.log('Approval query:', approvalQuery);
      console.log('Service query:', serviceQuery);
      
      approvals = await RequestApproval.find(approvalQuery).populate('userId').lean();
      services = await ServiceRequest.find(serviceQuery).populate('userId').lean();
    }
    
    console.log('Found approvals:', approvals.length);
    console.log('Found services:', services.length);

    // Calculate date range for the chart
    let startDateFilter, endDateFilter;
    if (query.createdAt && query.createdAt.$gte) {
      startDateFilter = new Date(query.createdAt.$gte);
      endDateFilter = query.createdAt.$lte || new Date();
    } else {
      // Default to last N days
      endDateFilter = new Date();
      startDateFilter = new Date(endDateFilter);
      startDateFilter.setDate(startDateFilter.getDate() - days);
    }

    const dateMap = {};
    
    // Initialize date map for the filtered date range
    const totalDays = Math.ceil((endDateFilter - startDateFilter) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDateFilter);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      dateMap[key] = { approvals: 0, services: 0 };
    }

    // Count approvals by date
    approvals.forEach(a => {
      const date = new Date(a.createdAt).toISOString().split('T')[0];
      if (dateMap[date]) dateMap[date].approvals++;
    });

    // Count services by date
    services.forEach(s => {
      const date = new Date(s.createdAt).toISOString().split('T')[0];
      if (dateMap[date]) dateMap[date].services++;
    });

    const labels = Object.keys(dateMap).sort();
    const approvalData = labels.map(d => dateMap[d].approvals);
    const serviceData = labels.map(d => dateMap[d].services);

    console.log('Response data - labels:', labels);
    console.log('Response data - approvals:', approvalData);
    console.log('Response data - services:', serviceData);

    res.json({
      success: true,
      labels,
      approvals: approvalData,
      services: serviceData
    });
  } catch (error) {
    console.error('Error loading request volume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/analytics-data/active-workload
 * Get active workload by unit
 */
router.get('/admin/analytics-data/active-workload', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find({
      status: { $in: ['in progress', 'in_progress', 'In Progress'] }
    }).lean();
    const serviceRequests = await ServiceRequest.find({
      status: { $in: ['in progress', 'in_progress', 'In Progress'] }
    }).lean();

    const unitMap = {};
    const { getUnits } = require('../utils/settingsHelpers');
    const units = getUnits();

    // Initialize unit counts
    units.forEach(unit => {
      unitMap[unit] = 0;
    });

    // Count by assigned units
    [...approvals, ...serviceRequests].forEach(req => {
      if (req.assignedUnits && req.assignedUnits !== 'Not yet assigned') {
        if (Array.isArray(req.assignedUnits)) {
          req.assignedUnits.forEach(unit => {
            if (unitMap[unit] !== undefined) unitMap[unit]++;
          });
        } else if (typeof req.assignedUnits === 'string') {
          if (unitMap[req.assignedUnits] !== undefined) unitMap[req.assignedUnits]++;
        }
      }
    });

    res.json({
      success: true,
      labels: Object.keys(unitMap),
      data: Object.values(unitMap)
    });
  } catch (error) {
    console.error('Error loading active workload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/analytics-data/turnaround-by-unit
 * Get average turnaround time by unit
 */
router.get('/admin/analytics-data/turnaround-by-unit', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find({
      status: 'completed'
    }).lean();
    const serviceRequests = await ServiceRequest.find({
      status: 'completed'
    }).lean();

    const unitMap = {};
    const { getUnits } = require('../utils/settingsHelpers');
    const units = getUnits();

    // Initialize unit turnaround times
    units.forEach(unit => {
      unitMap[unit] = { total: 0, count: 0 };
    });

    // Calculate turnaround times
    [...approvals, ...serviceRequests].forEach(req => {
      if (req.assignedUnits && req.assignedUnits !== 'Not yet assigned' && req.createdAt && req.updatedAt) {
        const turnaroundDays = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60 * 24);
        
        if (Array.isArray(req.assignedUnits)) {
          req.assignedUnits.forEach(unit => {
            if (unitMap[unit]) {
              unitMap[unit].total += turnaroundDays;
              unitMap[unit].count++;
            }
          });
        } else if (typeof req.assignedUnits === 'string') {
          if (unitMap[req.assignedUnits]) {
            unitMap[req.assignedUnits].total += turnaroundDays;
            unitMap[req.assignedUnits].count++;
          }
        }
      }
    });

    // Calculate averages
    const averages = {};
    Object.entries(unitMap).forEach(([unit, data]) => {
      averages[unit] = data.count > 0 ? (data.total / data.count).toFixed(1) : 0;
    });

    res.json({
      success: true,
      labels: Object.keys(averages),
      data: Object.values(averages).map(v => parseFloat(v))
    });
  } catch (error) {
    console.error('Error loading turnaround by unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});





/**
 * GET /admin/analytics-data/total-workload
 * Get total workload by unit
 */
router.get('/admin/analytics-data/total-workload', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().lean();
    const serviceRequests = await ServiceRequest.find().lean();

    const unitMap = {};
    const { getUnits } = require('../utils/settingsHelpers');
    const units = getUnits();

    // Initialize unit counts
    units.forEach(unit => {
      unitMap[unit] = 0;
    });

    // Count requests by unit
    [...approvals, ...serviceRequests].forEach(req => {
      if (req.assignedUnits && req.assignedUnits !== 'Not yet assigned') {
        if (Array.isArray(req.assignedUnits)) {
          req.assignedUnits.forEach(unit => {
            if (unitMap[unit] !== undefined) {
              unitMap[unit]++;
            }
          });
        } else if (typeof req.assignedUnits === 'string') {
          if (unitMap[req.assignedUnits] !== undefined) {
            unitMap[req.assignedUnits]++;
          }
        }
      }
    });

    res.json({
      success: true,
      labels: Object.keys(unitMap),
      data: Object.values(unitMap)
    });
  } catch (error) {
    console.error('Error loading total workload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /admin/analytics-data/response-time-by-unit
 * Get average response time by unit
 */
router.get('/admin/analytics-data/response-time-by-unit', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().lean();
    const serviceRequests = await ServiceRequest.find().lean();

    const unitMap = {};
    const { getUnits } = require('../utils/settingsHelpers');
    const units = getUnits();

    // Initialize unit response times
    units.forEach(unit => {
      unitMap[unit] = { total: 0, count: 0 };
    });

    // Calculate response times (time from creation to first update)
    [...approvals, ...serviceRequests].forEach(req => {
      if (req.assignedUnits && req.assignedUnits !== 'Not yet assigned' && req.createdAt && req.updatedAt) {
        const responseHours = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60);
        
        if (Array.isArray(req.assignedUnits)) {
          req.assignedUnits.forEach(unit => {
            if (unitMap[unit]) {
              unitMap[unit].total += responseHours;
              unitMap[unit].count++;
            }
          });
        } else if (typeof req.assignedUnits === 'string') {
          if (unitMap[req.assignedUnits]) {
            unitMap[req.assignedUnits].total += responseHours;
            unitMap[req.assignedUnits].count++;
          }
        }
      }
    });

    // Calculate averages
    const averages = {};
    Object.entries(unitMap).forEach(([unit, data]) => {
      averages[unit] = data.count > 0 ? Math.round(data.total / data.count) : 0;
    });

    res.json({
      success: true,
      labels: Object.keys(averages),
      data: Object.values(averages)
    });
  } catch (error) {
    console.error('Error loading response time by unit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/dashboard-kpis
 * Fetch all dashboard KPI metrics
 */
router.get('/api/admin/dashboard-kpis', requireAdmin, async (req, res) => {
  try {
    console.log('[API] Dashboard KPIs requested by user:', req.user._id);
    const approvals = await RequestApproval.find().lean();
    const serviceRequests = await ServiceRequest.find().lean();
    const allRequests = [...approvals, ...serviceRequests];
    
    // Count pending assignments (pending requests that are not yet assigned to a unit)
    const pendingAssignment = allRequests.filter(r => 
      r.status?.toLowerCase() === 'pending' && 
      (!r.assignedUnits || r.assignedUnits === 'Not yet assigned')
    ).length;
    
    // Count awaiting approval (requests that are completed/approved by units and waiting for final admin approval)
    // For ServiceRequest: 'For Checking' or 'Approved' status
    // For RequestApproval: 'Approved' status (since they go directly to approved)
    const awaitingApproval = [
      ...serviceRequests.filter(r => r.status?.toLowerCase() === 'for checking' || r.status?.toLowerCase() === 'approved'),
      ...approvals.filter(r => r.status?.toLowerCase() === 'approved')
    ].length;
    
    // Count in revision (requests sent back for changes)
    const inRevision = allRequests.filter(r => r.status?.toLowerCase() === 'for revision' || r.status?.toLowerCase() === 'for-revision').length;
    
    // Count unassigned tasks with priority breakdown
    const now = new Date();
    const unassignedApprovals = approvals.filter(a => 
      (!a.assignedUnits || a.assignedUnits === 'Not yet assigned') && 
      a.status?.toLowerCase() !== 'completed' && a.status?.toLowerCase() !== 'cancelled' &&
      a.status?.toLowerCase() !== 'rejected' && a.status?.toLowerCase() !== 'archived'
    );
    const unassignedServices = serviceRequests.filter(s => 
      (!s.assignedUnits || s.assignedUnits === 'Not yet assigned') && 
      s.status?.toLowerCase() !== 'completed' && s.status?.toLowerCase() !== 'cancelled' &&
      s.status?.toLowerCase() !== 'rejected' && s.status?.toLowerCase() !== 'archived'
    );
    const allUnassigned = [...unassignedApprovals, ...unassignedServices];
    
    // Calculate urgent unassigned (deadline within 3 days OR overdue - all treated as urgent)
    const urgentUnassigned = allUnassigned.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3; // Includes overdue tasks (negative days)
    }).length;
    
    const totalUnassigned = allUnassigned.length;
    
    // Count completed this month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = allRequests.filter(r => {
      const updatedAt = new Date(r.updatedAt);
      return r.status?.toLowerCase() === 'completed' && updatedAt >= firstDayOfMonth;
    }).length;
    
    // Count upcoming deadlines (within 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const upcomingDeadlines = allRequests.filter(r => {
      const deadline = new Date(r.deadline);
      return deadline > now && deadline <= sevenDaysFromNow && r.status?.toLowerCase() !== 'completed';
    }).length;
    
    // Count overdue (deadline passed but not completed)
    const overdue = allRequests.filter(r => {
      const deadline = new Date(r.deadline);
      return deadline < now && r.status?.toLowerCase() !== 'completed';
    }).length;
    
    console.log('Real-time KPI data:', {
      pendingAssignment,
      awaitingApproval,
      inRevision,
      urgentUnassigned,
      totalUnassigned,
      completedThisMonth,
      upcomingDeadlines,
      overdue
    });
    
    res.json({
      success: true,
      pendingAssignment,
      awaitingApproval,
      inRevision,
      urgentUnassigned,
      totalUnassigned,
      completedThisMonth,
      upcomingDeadlines,
      overdue
    });
  } catch (error) {
    console.error('Error loading dashboard KPIs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/incoming-requests
 * Fetch incoming requests (awaiting assignment)
 */
router.get('/api/admin/incoming-requests', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().populate('userId', 'fName lName').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId', 'fName lName').lean();
    
    // Get incoming (pending, unassigned) requests
    const incomingApprovals = approvals.filter(a => 
      a.status?.toLowerCase() === 'pending' && (!a.assignedUnits || a.assignedUnits === 'Not yet assigned')
    ).map(a => ({
      _id: a._id,
      title: a.title,
      type: 'Approval Request',
      requesterName: a.userId ? `${a.userId.fName} ${a.userId.lName}` : 'Unknown',
      createdAt: a.createdAt
    }));
    
    const incomingServices = serviceRequests.filter(s => 
      s.status?.toLowerCase() === 'pending' && (!s.assignedUnits || s.assignedUnits === 'Not yet assigned')
    ).map(s => ({
      _id: s._id,
      title: s.title,
      type: 'Service Request',
      requesterName: s.userId ? `${s.userId.fName} ${s.userId.lName}` : 'Unknown',
      createdAt: s.createdAt
    }));
    
    const allIncoming = [...incomingApprovals, ...incomingServices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    res.json({
      success: true,
      data: allIncoming
    });
  } catch (error) {
    console.error('Error loading incoming requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/urgent-overdue-tasks
 * Fetch urgent and overdue tasks
 */
router.get('/api/admin/urgent-overdue-tasks', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().populate('userId', 'fName lName').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId', 'fName lName').lean();
    const allRequests = [...approvals, ...serviceRequests];
    
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const urgentAndOverdue = allRequests
      .filter(req => {
        if (req.status?.toLowerCase() === 'completed') return false;
        const deadline = new Date(req.deadline);
        const isOverdue = deadline < now;
        const isCritical = deadline <= oneDayFromNow;
        const isUrgent = deadline <= threeDaysFromNow;
        return isOverdue || isCritical || isUrgent;
      })
      .map(req => {
        const isService = serviceRequests.some(s => s._id.toString() === req._id.toString());
        const deadline = new Date(req.deadline);
        const isOverdue = deadline < now;
        
        let priority = 'normal';
        if (isOverdue) {
          priority = 'critical';
        } else if (deadline <= oneDayFromNow) {
          priority = 'critical';
        } else if (deadline <= threeDaysFromNow) {
          priority = 'urgent';
        }
        
        return {
          _id: req._id,
          title: req.title,
          type: isService ? 'Service Request' : 'Approval Request',
          status: req.status,
          deadline: req.deadline,
          priority
        };
      })
      .sort((a, b) => {
        // Sort by priority (critical first, then urgent)
        const priorityOrder = { critical: 0, urgent: 1, normal: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
    
    res.json({
      success: true,
      data: urgentAndOverdue
    });
  } catch (error) {
    console.error('Error loading urgent/overdue tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
