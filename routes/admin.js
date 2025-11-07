// ===== Admin Routes =====
// This module handles all administrator-facing routes and functionality
// Includes admin dashboard, user management, request management, and admin APIs

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const { requireAdmin } = require('../middleware/auth');
const { upload, UPLOADS_DIR } = require('../config/upload');
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

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
    const allPendingRequests = [...pendingApprovals, ...pendingServices]
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
 * GET /admin/approvals
 * Admin view of all approval requests with display organization logic
 */
router.get('/admin/approvals', requireAdmin, async (req, res) => {
  try {
    let approvals = await RequestApproval.find()
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
    // Fetch with proper population and error handling
    const approvals = await RequestApproval.find()
      .populate({
        path: 'userId',
        select: 'fName lName userType affiliation studentOrganization',
        options: { strictPopulate: false } // Don't fail if user is missing
      })
      .lean();

    const serviceRequests = await ServiceRequest.find()
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
 * GET /admin/reports
 * Reports generation page (placeholder for future implementation)
 */
router.get('/admin/reports', requireAdmin, async (req, res) => {
  res.render('Admin/reports', { 
    user: req.user,
    message: 'Reports generation feature coming soon!'
  });
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

module.exports = router;
