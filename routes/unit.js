// ===== Unit Team Member Routes =====
// This module handles all unit team member routes and functionality
// Includes unit dashboard, task management, and unit member APIs

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const BroadcastMessage = require('../models/BroadcastMessage');
const { requireUnit } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

/**
 * GET /unit/dashboard
 * Unit member dashboard with task statistics and workload overview
 */
router.get('/unit/dashboard', requireUnit, async (req, res) => {
  try {
    console.log('=== UNIT DASHBOARD ROUTE HANDLER START ===');
    console.log('[/unit/dashboard] Session userId:', req.session.userId);
    console.log('[/unit/dashboard] Fetching user from database...');
    
    const user = await User.findById(req.session.userId);
    
    console.log('[/unit/dashboard] User retrieved:', {
      found: !!user,
      id: user?._id,
      email: user?.email,
      unitTeam: user?.unitTeam,
      role: user?.role,
      status: user?.status
    });

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      console.log('[/unit/dashboard] ERROR: User not assigned to unit team');
      return res.status(403).render('error', {
        message: 'You are not assigned to a unit team. Please contact an administrator.'
      });
    }
    
    console.log('[/unit/dashboard] Starting database queries for unit:', user.unitTeam);

    // Get tasks assigned to this unit member's team
    // Approval requests assigned to their unit (check if unit name is in assignedUnits string)
    console.log('[/unit/dashboard] Querying RequestApproval tasks...');
    const totalApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });
    console.log('[/unit/dashboard] Total approval tasks:', totalApprovalTasks);

    const pendingApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^pending$/i }
    });
    console.log('[/unit/dashboard] Pending approval tasks:', pendingApprovalTasks);

    const revisionApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^(revision|for revision)$/i }
    });
    console.log('[/unit/dashboard] Revision approval tasks:', revisionApprovalTasks);

    // Service requests assigned to their unit
    console.log('[/unit/dashboard] Querying ServiceRequest tasks...');
    const totalServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });
    console.log('[/unit/dashboard] Total service tasks:', totalServiceTasks);

    const pendingServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^pending$/i }
    });
    console.log('[/unit/dashboard] Pending service tasks:', pendingServiceTasks);

    const revisionServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^(revision|for revision)$/i }
    });
    console.log('[/unit/dashboard] Revision service tasks:', revisionServiceTasks);

    // Calculate combined statistics
    const totalTasks = totalApprovalTasks + totalServiceTasks;
    const newTasks = pendingApprovalTasks + pendingServiceTasks;
    const activeRevisions = revisionApprovalTasks + revisionServiceTasks;

    // Get approved tasks count
    const approvedApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^approved$/i }
    });

    const approvedServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      status: { $regex: /^approved$/i }
    });

    const approvedTasks = approvedApprovalTasks + approvedServiceTasks;

    // Get recent activity (recent tasks assigned to the unit)
    console.log('[/unit/dashboard] Fetching recent activity...');
    const recentApprovalActivity = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();
    console.log('[/unit/dashboard] Recent approval activity count:', recentApprovalActivity.length);

    const recentServiceActivity = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();
    console.log('[/unit/dashboard] Recent service activity count:', recentServiceActivity.length);

    // Combine and sort recent activity
    const recentActivity = [...recentApprovalActivity, ...recentServiceActivity]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6)
      .map(item => ({
        title: item.title || item.serviceType || 'Untitled',
        description: item.description || item.details || 'No description',
        status: item.status || 'Pending',
        updatedAt: item.updatedAt || item.createdAt,
        type: item.serviceType ? 'service' : 'approval'
      }));

    // Get upcoming deadlines (tasks due within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingApprovalDeadlines = await RequestApproval.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      deadline: { $lte: sevenDaysFromNow, $gte: new Date() },
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });

    const upcomingServiceDeadlines = await ServiceRequest.countDocuments({
      assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
      deadline: { $lte: sevenDaysFromNow, $gte: new Date() },
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });

    const upcomingDeadlines = upcomingApprovalDeadlines + upcomingServiceDeadlines;

    // Get urgent tasks (top 5 tasks with nearest deadlines)
    const urgentApprovalTasks = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    const urgentServiceTasks = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    const urgentTasks = [...urgentApprovalTasks, ...urgentServiceTasks]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    // Get recently completed tasks (for smart panel)
    const recentlyCompletedApprovals = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'completed'
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentlyCompletedServices = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'completed'
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentlyCompletedTasks = [...recentlyCompletedApprovals, ...recentlyCompletedServices]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    // Get announcements from admins (if BroadcastMessage model exists)
    console.log('[/unit/dashboard] Fetching announcements...');
    let announcements = [];
    try {
      announcements = await BroadcastMessage
        .find({
          expiresAt: { $gte: new Date() }
        })
        .populate('senderId', 'fName lName role')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      console.log('[/unit/dashboard] Announcements found:', announcements.length);
    } catch (error) {
      console.log('[/unit/dashboard] BroadcastMessage query error:', error.message);
      // Continue without announcements if model doesn't work as expected
    }

    console.log('[/unit/dashboard] Preparing to render view...');
    console.log('[/unit/dashboard] Rendering for:', user.fName, user.lName, 'Team:', user.unitTeam);
    console.log('[/unit/dashboard] Dashboard data:', {
      totalTasks,
      approvedTasks,
      newTasks,
      activeRevisions,
      recentActivityCount: recentActivity.length,
      upcomingDeadlines,
      urgentTasksCount: urgentTasks.length,
      announcementsCount: announcements.length
    });

    // Calculate task breakdown for pie chart - STATUS-BASED
    const allPendingApprovals = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: { $nin: ['Completed', 'Rejected', 'Archived'] }
      })
      .populate('userId', 'studentOrg office')
      .lean();
    
    const allPendingServices = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: { $nin: ['Completed', 'Rejected', 'Archived'] }
      })
      .populate('userId', 'studentOrg office')
      .lean();

    // Get completed tasks for completion rate
    const completedApprovals = await RequestApproval
      .countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'Approved' // Approval requests are "completed" when Approved
      });
    
    const completedServices = await ServiceRequest
      .countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'Completed'
      });

    // Create breakdown by status
    const statusBreakdown = {
      pending: 0,
      'in-review': 0,
      revision: 0,
      approved: 0,
      overdue: 0
    };
    
    const now = new Date();
    
    // Process approval requests
    allPendingApprovals.forEach(task => {
      const status = task.status || 'Pending';
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Check if overdue first
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'Pending') {
        statusBreakdown.pending++;
      } else if (status === 'For Revision') {
        statusBreakdown.revision++;
      } else if (status === 'Approved') {
        statusBreakdown.approved++;
      } else {
        statusBreakdown.pending++; // Default to pending
      }
    });
    
    // Process service requests
    allPendingServices.forEach(task => {
      const status = task.status || 'Pending';
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Check if overdue first
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'Pending') {
        statusBreakdown.pending++;
      } else if (status === 'For Revision') {
        statusBreakdown.revision++;
      } else if (status === 'Approved') {
        statusBreakdown.approved++;
      } else {
        statusBreakdown.pending++; // Default to pending
      }
    });

    // Convert to Chart.js format
    const taskBreakdown = {
      labels: ['Pending', 'In Review', 'Needs Revision', 'Approved', 'Overdue'],
      data: [
        statusBreakdown.pending,
        statusBreakdown['in-review'],
        statusBreakdown.revision,
        statusBreakdown.approved,
        statusBreakdown.overdue
      ],
      totalActive: allPendingApprovals.length + allPendingServices.length,
      totalCompleted: completedApprovals + completedServices
    };
    
    // Calculate completion rate
    const totalAllTasks = taskBreakdown.totalActive + taskBreakdown.totalCompleted;
    taskBreakdown.completionRate = totalAllTasks > 0 
      ? Math.round((taskBreakdown.totalCompleted / totalAllTasks) * 100)
      : 0;

    // If no tasks, show placeholder
    if (taskBreakdown.totalActive === 0) {
      taskBreakdown.labels = ['No Active Tasks'];
      taskBreakdown.data = [1];
    }

    console.log('[/unit/dashboard] Task breakdown:', taskBreakdown);
    console.log('[/unit/dashboard] All pending approvals count:', allPendingApprovals.length);
    console.log('[/unit/dashboard] All pending services count:', allPendingServices.length);
    console.log('[/unit/dashboard] Completed approvals count:', completedApprovals);
    console.log('[/unit/dashboard] Completed services count:', completedServices);
    
    // Calculate requester compliance (organizations with submission/response stats)
    const allTasks = [...allPendingApprovals, ...allPendingServices];
    const orgCompliance = {};
    
    // Collect all tasks by organization
    for (const task of allTasks) {
      // Use organization field first, fallback to user's studentOrg/office, then 'Unspecified'
      let org = task.organization || 'Unspecified';
      if ((!task.organization || task.organization === 'N/A') && task.userId) {
        org = task.userId.studentOrg || task.userId.office || 'Unspecified';
      }
      
      if (!orgCompliance[org]) {
        orgCompliance[org] = {
          total: 0,
          onTime: 0,
          overdue: 0,
          pending: 0
        };
      }
      
      orgCompliance[org].total++;
      
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      const status = task.status?.toLowerCase() || 'pending';
      
      if (isOverdue && status !== 'completed' && status !== 'approved') {
        orgCompliance[org].overdue++;
      } else if (status === 'pending') {
        orgCompliance[org].pending++;
      } else {
        orgCompliance[org].onTime++;
      }
    }
    
    // Convert to array and calculate compliance rate
    const requesterCompliance = Object.entries(orgCompliance)
      .map(([org, stats]) => ({
        organization: org,
        total: stats.total,
        onTime: stats.onTime,
        overdue: stats.overdue,
        pending: stats.pending,
        complianceRate: stats.total > 0 ? Math.round(((stats.total - stats.overdue) / stats.total) * 100) : 100
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 organizations for better chart display
    
    console.log('[/unit/dashboard] Requester compliance:', requesterCompliance);
    console.log('[/unit/dashboard] Calling res.render()...');
    
    // Calculate task timeline for last 7 days
    const taskTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayApprovals = await RequestApproval.countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayServices = await ServiceRequest.countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayCompleted = await RequestApproval.countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'Approved',
        updatedAt: { $gte: date, $lt: nextDate }
      }) + await ServiceRequest.countDocuments({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        status: 'Completed',
        updatedAt: { $gte: date, $lt: nextDate }
      });
      
      taskTimeline.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newTasks: dayApprovals + dayServices,
        completed: dayCompleted
      });
    }
    
    res.render('Unit/unitdashboard', {
      user,
      unitTeam: user.unitTeam,
      totalRequests: totalTasks,
      approvedRequests: approvedTasks,
      pendingRequests: newTasks,
      inReviewRequests: activeRevisions,
      recentActivity,
      upcomingDeadlines,
      urgentTasks,
      recentlyCompletedTasks,
      announcements,
      taskBreakdown,
      requesterCompliance,
      taskTimeline,
      name: `${user.fName} ${user.lName}`
    });
    console.log('[/unit/dashboard] res.render() called successfully');
    console.log('=== UNIT DASHBOARD ROUTE HANDLER COMPLETE ===');
  } catch (err) {
    console.error('[/unit/dashboard] ERROR CAUGHT IN TRY-CATCH:');
    console.error('[/unit/dashboard] Error message:', err.message);
    console.error('[/unit/dashboard] Error name:', err.name);
    console.error('[/unit/dashboard] Stack trace:', err.stack);
    res.status(500).render('error', {
      message: 'Failed to load dashboard: ' + err.message
    });
  }
});

/**
 * GET /unit/tasks
 * View all tasks assigned to the unit member's team
 */
router.get('/unit/tasks', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).render('error', {
        message: 'You are not assigned to a unit team. Please contact an administrator.'
      });
    }

    // Get all approval requests assigned to their unit
    const approvalRequests = await RequestApproval
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email')
      .sort({ createdAt: -1 })
      .lean();

    // Get all service requests assigned to their unit
    const serviceRequests = await ServiceRequest
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/unittasks', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests,
      serviceRequests
    });
  } catch (err) {
    console.error('Error loading unit tasks:', err);
    res.status(500).render('error', {
      message: 'Failed to load tasks.'
    });
  }
});

/**
 * GET /unit/profile
 * Unit member profile page
 */
router.get('/unit/profile', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('Unit/unitprofile', { user });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).render('error', {
      message: 'Failed to load profile.'
    });
  }
});

/**
 * GET /unit/all-tasks
 * View all tasks assigned to the unit member's team (combined view)
 */
router.get('/unit/all-tasks', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).render('error', {
        message: 'You are not assigned to a unit team. Please contact an administrator.'
      });
    }

    // Get all approval requests assigned to their unit
    const approvalRequests = await RequestApproval
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email studentOrg office')
      .sort({ createdAt: -1 })
      .lean();

    // Get all service requests assigned to their unit
    const serviceRequests = await ServiceRequest
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email studentOrg office')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/AllTasks', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests,
      serviceRequests
    });
  } catch (err) {
    console.error('Error loading all tasks:', err);
    res.status(500).render('error', {
      message: 'Failed to load tasks.'
    });
  }
});

/**
 * GET /unit/task-approvals
 * View approval requests assigned to the unit member's team
 */
router.get('/unit/task-approvals', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).render('error', {
        message: 'You are not assigned to a unit team. Please contact an administrator.'
      });
    }

    // Get all approval requests assigned to their unit
    const approvalRequests = await RequestApproval
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email studentOrg office')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/TaskApprovals', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests
    });
  } catch (err) {
    console.error('Error loading task approvals:', err);
    res.status(500).render('error', {
      message: 'Failed to load approval requests.'
    });
  }
});

/**
 * GET /unit/task-services
 * View service requests assigned to the unit member's team
 */
router.get('/unit/task-services', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).render('error', {
        message: 'You are not assigned to a unit team. Please contact an administrator.'
      });
    }

    // Get all service requests assigned to their unit
    const serviceRequests = await ServiceRequest
      .find({ assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') } })
      .populate('userId', 'fName lName email studentOrg office')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/TaskServices', {
      user,
      unitTeam: user.unitTeam,
      serviceRequests
    });
  } catch (err) {
    console.error('Error loading task services:', err);
    res.status(500).render('error', {
      message: 'Failed to load service requests.'
    });
  }
});

/**
 * GET /api/unit-deadlines
 * Get deadline data for unit calendar
 */
router.get('/api/unit-deadlines', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Get all approval requests with deadlines for this unit (excluding completed/archived)
    const approvalRequests = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        deadline: { $exists: true },
        status: { $nin: ['Approved', 'Rejected', 'Archived'] }
      })
      .select('deadline')
      .lean();

    // Get all service requests with deadlines for this unit (excluding completed/archived)
    const serviceRequests = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        deadline: { $exists: true },
        status: { $nin: ['Completed', 'Rejected', 'Archived'] }
      })
      .select('deadline')
      .lean();

    // Group deadlines by date
    const deadlinesByDate = {};

    approvalRequests.forEach(request => {
      if (request.deadline) {
        const dateStr = new Date(request.deadline).toISOString().split('T')[0];
        if (!deadlinesByDate[dateStr]) {
          deadlinesByDate[dateStr] = { approvals: 0, services: 0 };
        }
        deadlinesByDate[dateStr].approvals++;
      }
    });

    serviceRequests.forEach(request => {
      if (request.deadline) {
        const dateStr = new Date(request.deadline).toISOString().split('T')[0];
        if (!deadlinesByDate[dateStr]) {
          deadlinesByDate[dateStr] = { approvals: 0, services: 0 };
        }
        deadlinesByDate[dateStr].services++;
      }
    });

    res.json(deadlinesByDate);
  } catch (err) {
    console.error('Error fetching unit deadlines:', err);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

/**
 * GET /api/unit-deadlines/:date/details
 * Get detailed task info for a specific date for unit team
 */
router.get('/api/unit-deadlines/:date/details', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    const targetDate = new Date(req.params.date + 'T00:00:00');
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get approval requests with deadline on this date (excluding completed/archived)
    const approvalRequests = await RequestApproval
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        deadline: {
          $gte: targetDate,
          $lt: nextDate
        },
        status: { $nin: ['Approved', 'Rejected', 'Archived'] }
      })
      .populate('userId', 'fName lName email')
      .select('title description deadline status priority userId createdAt')
      .lean();

    // Get service requests with deadline on this date (excluding completed/archived)
    const serviceRequests = await ServiceRequest
      .find({
        assignedUnits: { $regex: new RegExp(user.unitTeam, 'i') },
        deadline: {
          $gte: targetDate,
          $lt: nextDate
        },
        status: { $nin: ['Completed', 'Rejected', 'Archived'] }
      })
      .populate('userId', 'fName lName email')
      .select('title details deadline status priority userId createdAt')
      .lean();

    // Format the response
    const response = {
      date: req.params.date,
      approvalRequests: approvalRequests.map(req => ({
        id: req._id,
        title: req.title,
        description: req.description,
        deadline: req.deadline,
        status: req.status,
        priority: req.priority,
        requester: req.userId ? `${req.userId.fName} ${req.userId.lName}` : 'Unknown',
        requesterEmail: req.userId ? req.userId.email : '',
        createdAt: req.createdAt,
        type: 'approval'
      })),
      serviceRequests: serviceRequests.map(req => ({
        id: req._id,
        title: req.title,
        description: req.details,
        deadline: req.deadline,
        status: req.status,
        priority: req.priority,
        requester: req.userId ? `${req.userId.fName} ${req.userId.lName}` : 'Unknown',
        requesterEmail: req.userId ? req.userId.email : '',
        createdAt: req.createdAt,
        type: 'service'
      })),
      totalCount: approvalRequests.length + serviceRequests.length
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching unit deadline details:', err);
    res.status(500).json({ error: 'Failed to fetch deadline details' });
  }
});

/**
 * GET /api/unit-announcements
 * Get announcements for unit team
 */
router.get('/api/unit-announcements', requireUnit, async (req, res) => {
  try {
    // Get active announcements from admins
    const announcements = await BroadcastMessage
      .find({
        expiresAt: { $gte: new Date() }
      })
      .populate('senderId', 'fName lName role')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(announcements);
  } catch (err) {
    console.error('Error fetching unit announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

/**
 * POST /unit/profile/update
 * Update unit member profile information
 */
router.post('/unit/profile/update', requireUnit, async (req, res) => {
  try {
    const userId = req.session.userId;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.role;
    delete updates.userType;
    delete updates.status;

    // Handle affiliation string (comma-separated)
    if (updates.affiliation && typeof updates.affiliation === 'string') {
      updates.affiliation = updates.affiliation.split(',').map(a => a.trim()).filter(a => a);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send('Profile updated successfully');
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Error updating profile: ' + err.message);
  }
});

/**
 * POST /unit/profile/change-password
 * Change unit member password
 */
router.post('/unit/profile/change-password', requireUnit, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).send('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).send('Password must be at least 8 characters long');
    }
    if (!newPassword.match(/[0-9]/)) {
      return res.status(400).send('Password must contain at least one number');
    }
    if (!newPassword.match(/[^a-zA-Z0-9]/)) {
      return res.status(400).send('Password must contain at least one special character');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).send('Password updated successfully');
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).send('Error changing password: ' + err.message);
  }
});

/**
 * POST /unit/profile/upload-picture
 * Upload profile picture for unit member
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile picture upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'upload-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'));
    }
  }
});

router.post('/unit/profile/upload-picture', requireUnit, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).send('User not found');
    }

    // Delete old profile picture if exists
    if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
      const oldPicturePath = path.join('uploads', user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user with new picture filename
    user.profilePicture = req.file.filename;
    await user.save();

    res.status(200).send('Profile picture uploaded successfully');
  } catch (err) {
    console.error('Error uploading picture:', err);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send('Error uploading picture: ' + err.message);
  }
});

/**
 * POST /unit/profile/delete-picture
 * Delete profile picture for unit member
 */
router.post('/unit/profile/delete-picture', requireUnit, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Delete picture file if exists
    if (user.profilePicture && user.profilePicture !== 'default-profile.png') {
      const picturePath = path.join('uploads', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    // Reset to default
    user.profilePicture = 'default-profile.png';
    await user.save();

    res.status(200).send('Profile picture deleted successfully');
  } catch (err) {
    console.error('Error deleting picture:', err);
    res.status(500).send('Error deleting picture: ' + err.message);
  }
});

module.exports = router;
