// ===== Unit Team Member Routes =====
// This module handles all unit team member routes and functionality
// Includes unit dashboard, task management, and unit member APIs

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const BroadcastMessage = require('../models/BroadcastMessage');
const Notification = require('../models/Notification');
const { requireUnit } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const uploadConfig = require('../config/upload');
const { getUnits, getRequestStatuses, getOrganizations, getOffices } = require('../utils/settingsHelpers');
const { sanitizeText, sanitizeMongoId, sanitizeString, escapeHtml, validateEnum } = require('../utils/sanitize');

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

    // Get tasks assigned to this unit member's team (for processing - current assignments)
    // Approval requests assigned to their unit (check if unit name is in assignedUnits string)
    console.log('[/unit/dashboard] Querying RequestApproval tasks...');
    const totalApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });
    console.log('[/unit/dashboard] Total approval tasks:', totalApprovalTasks);

    const pendingApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^pending$/i }
    });
    console.log('[/unit/dashboard] Pending approval tasks:', pendingApprovalTasks);
    
    const queuedApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^queued$/i }
    });
    console.log('[/unit/dashboard] Queued approval tasks:', queuedApprovalTasks);
    
    const inProgressApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^in progress$/i }
    });
    console.log('[/unit/dashboard] In Progress approval tasks:', inProgressApprovalTasks);

    const revisionApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^(revision|for revision)$/i }
    });
    console.log('[/unit/dashboard] Revision approval tasks:', revisionApprovalTasks);

    // Service requests assigned to their unit (for processing - current assignments)
    console.log('[/unit/dashboard] Querying ServiceRequest tasks...');
    const totalServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });
    console.log('[/unit/dashboard] Total service tasks:', totalServiceTasks);

    const pendingServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^pending$/i }
    });
    console.log('[/unit/dashboard] Pending service tasks:', pendingServiceTasks);
    
    const queuedServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^queued$/i }
    });
    console.log('[/unit/dashboard] Queued service tasks:', queuedServiceTasks);
    
    const inProgressServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^in progress$/i }
    });
    console.log('[/unit/dashboard] In Progress service tasks:', inProgressServiceTasks);

    const revisionServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^(revision|for revision)$/i }
    });
    console.log('[/unit/dashboard] Revision service tasks:', revisionServiceTasks);

    // Get viewable tasks count (tasks they were ever auto-assigned to, even if admin removed assignment)
    const viewableServiceTasks = await ServiceRequest.countDocuments({
      originalAssignedUnits: user.unitTeam,
      status: { $nin: ['completed', 'cancelled', 'Archived'] }
    });
    console.log('[/unit/dashboard] Viewable service tasks (ever assigned):', viewableServiceTasks);

    // Calculate combined statistics
    const totalTasks = totalApprovalTasks + totalServiceTasks;
    const newTasks = pendingApprovalTasks + pendingServiceTasks;
    const queuedTasks = queuedApprovalTasks + queuedServiceTasks;
    const inProgressTasks = inProgressApprovalTasks + inProgressServiceTasks;
    const activeRevisions = revisionApprovalTasks + revisionServiceTasks;

    // Get approved tasks count
    const approvedApprovalTasks = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^approved$/i }
    });

    const approvedServiceTasks = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^approved$/i }
    });

    const approvedTasks = approvedApprovalTasks + approvedServiceTasks;

    // Get recent activity (recent tasks assigned to the unit)
    console.log('[/unit/dashboard] Fetching recent activity...');
    const recentApprovalActivity = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();
    console.log('[/unit/dashboard] Recent approval activity count:', recentApprovalActivity.length);

    const recentServiceActivity = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
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
      assignedUnits: user.unitTeam,
      deadline: { $lte: sevenDaysFromNow, $gte: new Date() },
      status: { $nin: ['completed', 'cancelled', 'Archived'] },
      isDeleted: { $ne: true }
    });

    const upcomingServiceDeadlines = await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      deadline: { $lte: sevenDaysFromNow, $gte: new Date() },
      status: { $nin: ['completed', 'cancelled', 'Archived'] },
      isDeleted: { $ne: true }
    });

    const upcomingDeadlines = upcomingApprovalDeadlines + upcomingServiceDeadlines;

    // Get urgent tasks (top 5 tasks with nearest deadlines)
    const urgentApprovalTasks = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true },
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    const urgentServiceTasks = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true },
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    // Add requestType markers for proper filtering in views
    const markedApprovalTasks = urgentApprovalTasks.map(task => ({ ...task, requestType: 'approval' }));
    const markedServiceTasks = urgentServiceTasks.map(task => ({ ...task, requestType: 'service', serviceType: task.specificRequestType || 'Service Request' }));

    const urgentTasks = [...markedApprovalTasks, ...markedServiceTasks]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    // Get recently completed tasks (for smart panel)
    const recentlyCompletedApprovals = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        status: 'completed',
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentlyCompletedServices = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        status: 'completed',
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentlyCompletedTasks = [...recentlyCompletedApprovals, ...recentlyCompletedServices]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    // Get announcements from admins (if BroadcastMessage model exists)
    // Show announcements where scheduledTime is not set OR scheduledTime <= now
    // Also filter by expiresAt to only show non-expired announcements
    console.log('[/unit/dashboard] Fetching announcements...');
    let announcements = [];
    try {
      const now = new Date();
      console.log('[/unit/dashboard] Current time (server):', now.toISOString());
      
      // Debug: Check all announcements first
      const allAnnouncements = await BroadcastMessage.find({}).lean();
      console.log('[/unit/dashboard] Total announcements in DB:', allAnnouncements.length);
      allAnnouncements.forEach(a => {
        console.log('[/unit/dashboard] Announcement:', a.title, '| scheduledTime:', a.scheduledTime, '| isVisibleToAll:', a.isVisibleToAll);
        if (a.scheduledTime) {
          const scheduledDate = new Date(a.scheduledTime);
          console.log('[/unit/dashboard]   - scheduledTime as Date:', scheduledDate.toISOString());
          console.log('[/unit/dashboard]   - scheduledTime <= now:', scheduledDate <= now);
        }
      });
      
      announcements = await BroadcastMessage
        .find({
          $and: [
            {
              $or: [
                { expiresAt: { $gte: now } },
                { expiresAt: { $exists: false } },
                { expiresAt: null }
              ]
            },
            {
              $or: [
                { isVisibleToAll: true },
                { 'recipients.userId': user._id }
              ]
            },
            {
              $or: [
                { scheduledTime: { $exists: false } },
                { scheduledTime: null },
                { scheduledTime: { $lte: now } }
              ]
            }
          ]
        })
        .populate('sentBy', 'fName lName role')
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(10)
        .lean();
      
      console.log('[/unit/dashboard] Filtered announcements count:', announcements.length);
      
      // Add isRead status for the current user
      announcements = announcements.map(announcement => {
        const recipientEntry = announcement.recipients?.find(
          r => r.userId && r.userId.toString() === user._id.toString()
        );
        return {
          ...announcement,
          isRead: recipientEntry ? recipientEntry.isRead : false,
          readAt: recipientEntry ? recipientEntry.readAt : null
        };
      });
      
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
        assignedUnits: user.unitTeam,
        status: { $nin: [/^completed$/i, /^rejected$/i, /^archived$/i] }
      })
      .populate('userId', 'studentOrg office')
      .lean();
    
    const allPendingServices = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: [/^completed$/i, /^rejected$/i, /^archived$/i] }
      })
      .populate('userId', 'studentOrg office')
      .lean();

    // Get completed tasks for completion rate
    const completedApprovals = await RequestApproval
      .countDocuments({
        assignedUnits: user.unitTeam,
        status: /^approved$/i
      });
    
    const completedServices = await ServiceRequest
      .countDocuments({
        assignedUnits: user.unitTeam,
        status: /^completed$/i
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
      const status = (task.status || 'Pending').toLowerCase().trim();
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Skip approved/completed/archived/rejected statuses from active count
      if (status === 'approved' || status === 'completed' || status === 'archived' || status === 'rejected') {
        return;
      }
      
      // Check if overdue first
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'pending') {
        statusBreakdown.pending++;
      } else if (status === 'queued') {
        statusBreakdown['in-review']++;
      } else if (status === 'in progress') {
        statusBreakdown['in-review']++;
      } else if (status === 'for revision') {
        statusBreakdown.revision++;
      } else {
        statusBreakdown.pending++; // Default to pending
      }
    });
    
    // Process service requests
    allPendingServices.forEach(task => {
      const status = (task.status || 'Pending').toLowerCase().trim();
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Skip approved/completed/archived/rejected statuses from active count
      if (status === 'approved' || status === 'completed' || status === 'archived' || status === 'rejected') {
        return;
      }
      
      // Check if overdue first
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'pending') {
        statusBreakdown.pending++;
      } else if (status === 'queued') {
        statusBreakdown['in-review']++;
      } else if (status === 'in progress') {
        statusBreakdown['in-review']++;
      } else if (status === 'for revision') {
        statusBreakdown.revision++;
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
        completedApprovals + completedServices,  // Merge approved and completed
        statusBreakdown.overdue
      ],
      totalActive: statusBreakdown.pending + statusBreakdown['in-review'] + statusBreakdown.revision + statusBreakdown.overdue,
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
    console.log('[/unit/dashboard] Status breakdown details:', {
      pending: statusBreakdown.pending,
      'in-review': statusBreakdown['in-review'],
      revision: statusBreakdown.revision,
      approved: statusBreakdown.approved,
      overdue: statusBreakdown.overdue
    });
    console.log('[/unit/dashboard] Sample task statuses:', allPendingApprovals.slice(0, 3).map(t => t.status).concat(allPendingServices.slice(0, 3).map(t => t.status)));
    
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
        assignedUnits: user.unitTeam,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayServices = await ServiceRequest.countDocuments({
        assignedUnits: user.unitTeam,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayCompleted = await RequestApproval.countDocuments({
        assignedUnits: user.unitTeam,
        status: 'Approved',
        updatedAt: { $gte: date, $lt: nextDate }
      }) + await ServiceRequest.countDocuments({
        assignedUnits: user.unitTeam,
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
      queuedRequests: queuedTasks,
      inProgressRequests: inProgressTasks,
      inReviewRequests: activeRevisions,
      recentActivity,
      upcomingDeadlines,
      urgentTasks,
      recentlyCompletedTasks,
      announcements,
      taskBreakdown,
      requesterCompliance,
      taskTimeline,
      name: `${user.fName} ${user.lName}`,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
    console.log('[/unit/dashboard] res.render() called successfully');
    console.log('=== UNIT DASHBOARD ROUTE HANDLER COMPLETE ===');
  } catch (err) {
    console.error('[/unit/dashboard] ERROR CAUGHT IN TRY-CATCH:');
    console.error('[/unit/dashboard] Error message:', err.message);
    console.error('[/unit/dashboard] Error name:', err.name);
    console.error('[/unit/dashboard] Stack trace:', err.stack);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load dashboard: ' + err.message
      });
    }
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
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email')
      .sort({ createdAt: -1 })
      .lean();

    // Get all service requests assigned to their unit
    const serviceRequests = await ServiceRequest
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/AllTasks', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests,
      serviceRequests,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
  } catch (err) {
    console.error('Error loading unit tasks:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load tasks.'
      });
    }
  }
});

/**
 * GET /unit/profile
 * Unit member profile page
 */
router.get('/unit/profile', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    res.render('Unit/unitprofile', { 
      user,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load profile.'
      });
    }
  }
});

/**
 * GET /unit/guide
 * Unit member guide page
 */
router.get('/unit/guide', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    res.render('Unit/unitguide', { 
      user,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
  } catch (err) {
    console.error('Error loading guide:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load guide.'
      });
    }
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
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email studentOrganization office department affiliation')
      .sort({ createdAt: -1 })
      .lean();

    // Get all service requests assigned to their unit
    const serviceRequests = await ServiceRequest
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email studentOrganization office department affiliation')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/AllTasks', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests,
      serviceRequests,
      units: getUnits(),
      requestStatuses: getRequestStatuses(),
      organizations: getOrganizations(),
      offices: getOffices()
    });
  } catch (err) {
    console.error('Error loading all tasks:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load tasks.'
      });
    }
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
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email studentOrganization office department affiliation')
      .sort({ createdAt: -1 })
      .lean();

    res.render('Unit/TaskApprovals', {
      user,
      unitTeam: user.unitTeam,
      approvalRequests,
      units: getUnits(),
      requestStatuses: getRequestStatuses(),
      organizations: getOrganizations(),
      offices: getOffices()
    });
  } catch (err) {
    console.error('Error loading task approvals:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load approval requests.'
      });
    }
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

    // Get service requests currently assigned to their unit (can process)
    const currentServiceRequests = await ServiceRequest
      .find({ 
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email studentOrganization office department affiliation')
      .sort({ createdAt: -1 })
      .lean();

    // Get service requests they were ever auto-assigned to (can view)
    const viewableServiceRequests = await ServiceRequest
      .find({ 
        originalAssignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName email studentOrganization office department affiliation')
      .sort({ createdAt: -1 })
      .lean();

    // Mark which tasks are currently assignable vs view-only
    const allServiceRequests = viewableServiceRequests.map(request => ({
      ...request,
      canProcess: currentServiceRequests.some(curr => curr._id.toString() === request._id.toString()),
      isViewOnly: !currentServiceRequests.some(curr => curr._id.toString() === request._id.toString())
    }));

    res.render('Unit/TaskServices', {
      user,
      unitTeam: user.unitTeam,
      serviceRequests: allServiceRequests,
      units: getUnits(),
      requestStatuses: getRequestStatuses(),
      organizations: getOrganizations(),
      offices: getOffices()
    });
  } catch (err) {
    console.error('Error loading task services:', err);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Failed to load service requests.'
      });
    }
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
        assignedUnits: user.unitTeam,
        deadline: { $exists: true },
        status: { $nin: ['Approved', 'Rejected', 'Archived'] }
      })
      .select('deadline')
      .lean();

    // Get all service requests with deadlines for this unit (excluding completed/archived)
    const serviceRequests = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        deadline: { $exists: true },
        status: { $nin: ['Completed', 'Rejected', 'Archived'] }
      })
      .select('deadline')
      .lean();

    // Group deadlines by date
    const deadlinesByDate = {};

    approvalRequests.forEach(request => {
      if (request.deadline) {
        // Format date in Asia/Manila timezone (UTC+8)
        const deadlineDate = new Date(request.deadline);
        const year = deadlineDate.getUTCFullYear();
        const month = String(deadlineDate.getUTCMonth() + 1).padStart(2, '0');
        let day = deadlineDate.getUTCDate();
        let hours = deadlineDate.getUTCHours() + 8; // Add 8 hours for UTC+8
        
        // Handle day rollover
        if (hours >= 24) {
          day += 1;
        }
        
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
        if (!deadlinesByDate[dateStr]) {
          deadlinesByDate[dateStr] = { approvals: 0, services: 0 };
        }
        deadlinesByDate[dateStr].approvals++;
      }
    });

    serviceRequests.forEach(request => {
      if (request.deadline) {
        // Format date in Asia/Manila timezone (UTC+8)
        const deadlineDate = new Date(request.deadline);
        const year = deadlineDate.getUTCFullYear();
        const month = String(deadlineDate.getUTCMonth() + 1).padStart(2, '0');
        let day = deadlineDate.getUTCDate();
        let hours = deadlineDate.getUTCHours() + 8; // Add 8 hours for UTC+8
        
        // Handle day rollover
        if (hours >= 24) {
          day += 1;
        }
        
        const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
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

    // Parse the date and adjust for Asia/Manila timezone (UTC+8)
    // Date comes as YYYY-MM-DD, represents a day in Asia/Manila timezone
    const [year, month, day] = req.params.date.split('-').map(Number);
    
    // Create date range in UTC that corresponds to the full day in UTC+8
    // Start: midnight in UTC+8 = 4pm previous day in UTC (midnight - 8 hours)
    // End: midnight next day in UTC+8 = 4pm current day in UTC
    const targetDate = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0)); // 4pm previous day UTC = midnight current day UTC+8
    const nextDate = new Date(Date.UTC(year, month - 1, day, 16, 0, 0)); // 4pm current day UTC = midnight next day UTC+8

    // Get approval requests with deadline on this date (excluding completed/archived)
    const approvalRequests = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
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
        assignedUnits: user.unitTeam,
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
 * Change unit member password with validation
 */
router.post('/unit/profile/change-password', requireUnit, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Validate new password matches
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    
    if (!/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must contain at least one letter and one number' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ success: false, message: 'Error changing password: ' + err.message });
  }
});

/**
 * POST /unit/profile/request-password-reset
 * Send password reset email from profile page
 */
router.post('/unit/profile/request-password-reset', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const emailService = require('../services/emailService');
    await emailService.sendPasswordReset(user.email, `${user.fName} ${user.lName}`, resetToken);

    res.status(200).json({ 
      success: true, 
      message: 'Password reset link sent to your email',
      resetToken: resetToken
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reset email' });
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

/**
 * POST /unit/task/approve/:id
 * Approve an approval request task
 */
router.post('/unit/task/approve/:id', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { remarks } = req.body;

    // Validate remarks
    if (!remarks || remarks.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Final remarks are required for approval' });
    }

    // Find the approval request
    const task = await RequestApproval.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Update task status to Approved
    task.status = 'Approved';
    task.awaitingResubmission = false; // Clear resubmission flag
    
    // Add approval to revision history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }
    
    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: `Request approved by ${user.fName} ${user.lName} (${user.unitTeam} Unit)\n\nFinal Report/Remarks:\n${remarks.trim()}`,
      revisionFiles: [],
      status: 'resolved'
    });
    
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Send notification to the requestor
    try {
      await notificationService.notifyApprovalApproved(task._id, task.userId._id, user._id);
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
    }

    // Notify admins that unit approved the request
    try {
      await notificationService.notifyAdminUnitApproved(task._id, user._id, task);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ success: true, message: 'Task approved successfully' });
  } catch (error) {
    console.error('Error approving task:', error);
    res.status(500).json({ success: false, message: 'Error approving task: ' + error.message });
  }
});

/**
 * POST /unit/task/revoke-approval/:id
 * Revoke approval for an already-approved request
 */
router.post('/unit/task/revoke-approval/:id', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { reason } = req.body;

    // Find the approval request
    const task = await RequestApproval.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Verify task is currently approved
    if (task.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Task is not currently approved' });
    }

    // Change status to "For Revision" instead of Pending
    const previousStatus = task.status;
    task.status = 'For Revision';
    
    // Add revocation to revision history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }
    
    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: reason || 'Approval revoked - revision required',
      revisionFiles: [],
      status: 'revoked'
    });
    
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Note: Revocation details are stored in revisionHistory only, not in conversation
    // This keeps the chat clean and focuses revision details in the revision history section

    // Send notification to the requestor
    try {
      const notificationMessage = reason 
        ? `Approval revoked by ${user.unitTeam || 'unit'} team. Revision required. Reason: ${reason}`
        : `Approval revoked by ${user.unitTeam || 'unit'} team. Please review and make necessary revisions.`;
      
      await notificationService.createNotification({
        recipient: task.userId._id,
        sender: user._id,
        title: '⚠️ Approval Revoked - Revision Required',
        message: notificationMessage,
        type: 'revision_required',
        relatedId: task._id,
        relatedModel: 'RequestApproval',
        priority: 'high',
        actionUrl: `/request-approvals?modal=true&requestId=${task._id}&type=approval`
      });
    } catch (notifError) {
      console.error('Error sending revocation notification:', notifError);
    }

    // Notify admins that unit revoked approval
    try {
      const admins = await User.find({ role: 'admin', status: 'approved' });
      const unitName = user.unitTeam || 'Unit';
      
      for (const admin of admins) {
        await notificationService.createNotification({
          recipient: admin._id,
          sender: user._id,
          title: 'Approval Revoked - Revision Required',
          message: `${unitName} team revoked approval for: "${task.title}". Status changed to For Revision.`,
          type: 'approval_revoked',
          relatedId: task._id,
          relatedModel: 'RequestApproval',
          priority: 'high',
          actionUrl: `/admin/approvals?highlight=${task._id}`
        });
      }
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Approval revoked successfully. Status changed to For Revision.',
      newStatus: 'For Revision'
    });
  } catch (error) {
    console.error('Error revoking approval:', error);
    res.status(500).json({ success: false, message: 'Error revoking approval: ' + error.message });
  }
});

/**
 * POST /unit/task/revise/:id
 * Request revision for an approval request task (with file upload support)
 */
router.post('/unit/task/revise/:id', requireUnit, uploadConfig.upload.array('revisionFiles', 10), async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { revisionNotes } = req.body;

    if (!revisionNotes || revisionNotes.trim() === '') {
      return res.status(400).json({ success: false, message: 'Revision notes are required' });
    }

    // Find the approval request
    const task = await RequestApproval.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Get uploaded file names
    const revisionFiles = req.files ? req.files.map(file => file.filename) : [];

    // Add revision to history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }

    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: revisionNotes,
      revisionFiles: revisionFiles,
      status: 'pending'
    });

    // Update task status to For Revision and set awaiting resubmission flag
    task.status = 'For Revision';
    task.awaitingResubmission = true;
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Note: Revision notes are stored in revisionHistory only, not in conversation
    // This keeps the chat clean and focuses revision details in the revision history section

    // Send notification to the requestor
    try {
      await notificationService.notifyApprovalRevision(task._id, task.userId._id, user._id, revisionNotes);
    } catch (notifError) {
      console.error('Error sending revision notification:', notifError);
    }

    // Notify admins that unit requested revision
    try {
      await notificationService.notifyAdminUnitRevision(task._id, user._id, task, revisionNotes);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Revision request sent successfully. A thread has been created for the requestor to respond.',
      filesUploaded: revisionFiles.length
    });
  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ success: false, message: 'Error requesting revision: ' + error.message });
  }
});

/**
 * POST /unit/task/upload/:id
 * Upload deliverable files for a service request
 */
router.post('/unit/task/upload/:id', requireUnit, uploadConfig.upload.array('deliverables', 20), async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;

    // Find the service request and populate userId for notification
    const task = await ServiceRequest.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits !== user.unitTeam) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Get uploaded file names
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const filenames = req.files.map(file => file.filename);

    // Add deliverables to the task
    if (!task.deliverables) {
      task.deliverables = [];
    }
    task.deliverables.push(...filenames);
    
    // Update status to "For Checking" instead of completed
    task.status = 'For Checking';
    
    // Add to revision history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }
    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: `Deliverables uploaded by ${user.fName} ${user.lName} (${user.unitTeam} Unit)${task.revisionCount > 0 ? ` - Revision ${task.revisionCount}` : ''}`,
      deliverableFiles: filenames,
      status: 'for_checking',
      revisionType: 'deliverable_submitted',
      revisionNumber: task.revisionCount // Track which revision cycle these deliverables belong to
    });
    
    await task.save();

    console.log('📢 Sending deliverable upload notification:', {
      taskId: task._id,
      userId: user._id,
      requestorId: task.userId?._id || task.userId,
      requestorIdType: typeof (task.userId?._id || task.userId)
    });

    // Notify requestor that deliverables are ready for review
    try {
      await notificationService.notifyRequestorDeliverableUploaded(task._id, user._id, task);
      console.log('✅ Requestor notification sent successfully');
    } catch (notifError) {
      console.error('❌ Error sending requestor notification:', notifError);
      console.error('Error stack:', notifError.stack);
    }

    // Notify admins that unit uploaded deliverables
    try {
      await notificationService.notifyAdminUnitDeliverable(task._id, user._id, task, filenames.length);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Deliverables uploaded successfully. Status changed to "For Checking".',
      filesUploaded: filenames.length 
    });
  } catch (error) {
    console.error('Error uploading deliverables:', error);
    res.status(500).json({ success: false, message: 'Error uploading deliverables: ' + error.message });
  }
});

/**
 * POST /unit/task/complete-approval/:id
 * Approve a request with final remarks (one-step approval process)
 * Final status is 'Approved' - there is no 'Completed' status for approval requests
 */
router.post('/unit/task/complete-approval/:id', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { remarks } = req.body;

    // Find the approval request
    const task = await RequestApproval.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Validate final remarks are provided
    if (!remarks || remarks.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide final remarks for approval' });
    }

    // Update task status to Approved with final remarks (no intermediate approval step)
    task.status = 'Approved';
    task.completedBy = user._id;
    task.completedAt = new Date();
    task.finalRemarks = remarks.trim();
    
    // Add completion to revision history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }
    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: `Request approved by ${user.fName} ${user.lName} (${user.unitTeam} Unit)\n\nFinal Report/Remarks:\n${remarks.trim()}`,
      status: 'approved'
    });
    
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Send notification to the requestor that their approval request has been approved
    try {
      await notificationService.notifyApprovalApproved(task._id, task.userId._id, user._id);
    } catch (notifError) {
      console.error('Error sending approval notification:', notifError);
    }

    // Notify admins that unit approved the request
    try {
      await notificationService.notifyAdminUnitApproved(task._id, user._id, task);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ success: true, message: 'Request approved successfully with final remarks' });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Error approving request: ' + error.message });
  }
});

/**
 * POST /unit/task/complete/:id
 * Mark a service request as completed with final remarks (after requestor approval)
 */
router.post('/unit/task/complete/:id', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { finalRemarks } = req.body;

    // Find the service request
    const task = await ServiceRequest.findById(taskId).populate('userId');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Check if status is Approved (requestor must approve first)
    if (task.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Task must be approved by requestor before completion' });
    }

    // Validate final remarks
    if (!finalRemarks || finalRemarks.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide final remarks' });
    }

    // Update task status to Completed
    task.status = 'Completed';
    task.completedBy = user._id;
    task.completedAt = new Date();
    task.finalRemarks = finalRemarks;
    
    // Note: revisionCount is managed when user requests revisions
    // When marking as completed, we don't reset it - it tracks total revisions across all cycles
    
    // Add completion to revision history
    if (!task.revisionHistory) {
      task.revisionHistory = [];
    }
    task.revisionHistory.push({
      requestedBy: user._id,
      requestedAt: new Date(),
      revisionNotes: finalRemarks,
      status: 'completed',
      revisionType: 'completed',
      revisionNumber: task.revisionCount // Track which revision cycle this completion belongs to
    });
    
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Send notification to the requestor
    try {
      await notificationService.notifyServiceCompleted(task._id, task.userId._id, user._id);
    } catch (notifError) {
      console.error('Error sending completion notification:', notifError);
    }

    // Notify admins that unit completed the request
    try {
      await notificationService.notifyAdminUnitCompleted(task._id, user._id, task);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }

    res.json({ success: true, message: 'Task marked as completed successfully' });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ success: false, message: 'Error completing task: ' + error.message });
  }
});

/**
 * POST /unit/task/acknowledge/:id
 * Acknowledge a queued task and change status to "In Progress"
 * This is the unit's way of accepting a task from their queue
 */
router.post('/unit/task/acknowledge/:id', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const taskId = req.params.id;
    const { taskType } = req.body; // 'service' or 'approval'

    let task;
    if (taskType === 'service') {
      task = await ServiceRequest.findById(taskId).populate('userId');
    } else if (taskType === 'approval') {
      task = await RequestApproval.findById(taskId).populate('userId');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid task type' });
    }
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify the unit member's team is assigned to this task
    if (!task.assignedUnits || task.assignedUnits.toLowerCase() !== user.unitTeam.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this task' });
    }

    // Verify task is in Queued status
    if (task.status !== 'Queued') {
      return res.status(400).json({ success: false, message: 'Only queued tasks can be acknowledged' });
    }

    // Update task status to In Progress
    task.status = 'In Progress';
    await task.save();

    // Broadcast active requests update to admins
    const socketService = require('../services/socketService');
    socketService.updateActiveRequestsCount();

    // Send notification to the requestor that their task is now being worked on
    try {
      if (taskType === 'service') {
        await notificationService.notifyServiceInProgress(task._id, task.userId._id, user._id);
      } else {
        await notificationService.notifyApprovalInProgress(task._id, task.userId._id, user._id);
      }
    } catch (notifError) {
      console.error('Error sending in-progress notification:', notifError);
    }

    res.json({ success: true, message: 'Task acknowledged and moved to In Progress' });
  } catch (error) {
    console.error('Error acknowledging task:', error);
    res.status(500).json({ success: false, message: 'Error acknowledging task: ' + error.message });
  }
});

/**
 * GET /unit/reports
 * Unit member reports page
 */
router.get('/unit/reports', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });
    res.render('Unit/unitReports', {
      user: user,
      unreadCount: unreadCount,
      unitTeam: user.unitTeam,
      units: getUnits(),
      requestStatuses: getRequestStatuses()
    });
  } catch (error) {
    console.error('Error rendering reports page:', error);
    if (!res.headersSent) {
      res.status(500).render('error', {
        message: 'Error loading reports page'
      });
    }
  }
});

/**
 * GET /unit/dashboard/urgent-tasks
 * Get urgent tasks HTML for real-time updates
 */
router.get('/unit/dashboard/urgent-tasks', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Get urgent tasks (top 5 tasks with nearest deadlines)
    const urgentApprovalTasks = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true },
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    const urgentServiceTasks = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: ['completed', 'cancelled', 'Archived'] },
        deadline: { $exists: true },
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ deadline: 1 })
      .limit(3)
      .lean();

    const urgentTasks = [...urgentApprovalTasks, ...urgentServiceTasks]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    // Render the urgent tasks panel HTML
    res.render('Unit/partials/urgent-tasks', {
      urgentTasks,
      layout: false
    });
  } catch (error) {
    console.error('Error fetching urgent tasks:', error);
    res.status(500).json({ error: 'Failed to fetch urgent tasks' });
  }
});

/**
 * GET /unit/dashboard/task-breakdown
 * Get task breakdown data for real-time updates
 */
router.get('/unit/dashboard/task-breakdown', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Calculate task breakdown for pie chart - STATUS-BASED
    const allPendingApprovals = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: [/^completed$/i, /^rejected$/i, /^archived$/i] }
      })
      .populate('userId', 'studentOrg office')
      .lean();
    
    const allPendingServices = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        status: { $nin: [/^completed$/i, /^rejected$/i, /^archived$/i] }
      })
      .populate('userId', 'studentOrg office')
      .lean();

    // Get completed tasks for completion rate
    const completedApprovals = await RequestApproval
      .countDocuments({
        assignedUnits: user.unitTeam,
        status: /^approved$/i
      });
    
    const completedServices = await ServiceRequest
      .countDocuments({
        assignedUnits: user.unitTeam,
        status: /^completed$/i
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
      const status = (task.status || 'Pending').toLowerCase().trim();
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Skip approved/completed/archived/rejected statuses from active count
      if (status === 'approved' || status === 'completed' || status === 'archived' || status === 'rejected') {
        return;
      }
      
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'pending') {
        statusBreakdown.pending++;
      } else if (status === 'queued') {
        statusBreakdown['in-review']++;
      } else if (status === 'in progress') {
        statusBreakdown['in-review']++;
      } else if (status === 'for revision') {
        statusBreakdown.revision++;
      } else {
        statusBreakdown.pending++;
      }
    });
    
    // Process service requests
    allPendingServices.forEach(task => {
      const status = (task.status || 'Pending').toLowerCase().trim();
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      
      // Skip approved/completed/archived/rejected statuses from active count
      if (status === 'approved' || status === 'completed' || status === 'archived' || status === 'rejected') {
        return;
      }
      
      if (isOverdue) {
        statusBreakdown.overdue++;
      } else if (status === 'pending') {
        statusBreakdown.pending++;
      } else if (status === 'queued') {
        statusBreakdown['in-review']++;
      } else if (status === 'in progress') {
        statusBreakdown['in-review']++;
      } else if (status === 'for revision') {
        statusBreakdown.revision++;
      } else {
        statusBreakdown.pending++;
      }
    });

    // Convert to Chart.js format
    const taskBreakdown = {
      labels: ['Pending', 'In Review', 'Needs Revision', 'Approved', 'Overdue'],
      data: [
        statusBreakdown.pending,
        statusBreakdown['in-review'],
        statusBreakdown.revision,
        completedApprovals + completedServices,  // Merge approved and completed
        statusBreakdown.overdue
      ],
      totalActive: statusBreakdown.pending + statusBreakdown['in-review'] + statusBreakdown.revision + statusBreakdown.overdue,
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

    res.json(taskBreakdown);
  } catch (error) {
    console.error('Error fetching task breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch task breakdown' });
  }
});

/**
 * GET /unit/dashboard/announcements
 * Get announcements HTML for real-time updates
 */
router.get('/unit/dashboard/announcements', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Get announcements from admins (if BroadcastMessage model exists)
    let announcements = [];
    try {
      const now = new Date();
      
      announcements = await BroadcastMessage
        .find({
          $and: [
            {
              $or: [
                { expiresAt: { $gte: now } },
                { expiresAt: { $exists: false } },
                { expiresAt: null }
              ]
            },
            {
              $or: [
                { isVisibleToAll: true },
                { 'recipients.userId': user._id }
              ]
            },
            {
              $or: [
                { scheduledTime: { $exists: false } },
                { scheduledTime: null },
                { scheduledTime: { $lte: now } }
              ]
            }
          ]
        })
        .populate('sentBy', 'fName lName role')
        .sort({ priority: -1, createdAt: -1 })
        .limit(10)
        .lean();
      
      // Add isRead status for the current user
      announcements = announcements.map(announcement => {
        const recipientEntry = announcement.recipients?.find(
          r => r.userId && r.userId.toString() === user._id.toString()
        );
        return {
          ...announcement,
          isRead: recipientEntry ? recipientEntry.isRead : false,
          readAt: recipientEntry ? recipientEntry.readAt : null
        };
      });
    } catch (error) {
      console.log('BroadcastMessage query error:', error.message);
    }

    // Render the announcements content HTML
    res.render('Unit/partials/announcements', {
      announcements,
      layout: false
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

/**
 * GET /unit/dashboard/workload-snapshot
 * Get workload snapshot data for real-time updates
 */
router.get('/unit/dashboard/workload-snapshot', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Get pending requests count
    const pendingRequests = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^pending$/i }
    }) + await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^pending$/i }
    });

    // Get in-review requests count
    const inReviewRequests = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^(in review|for revision)$/i }
    }) + await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^(in review|for revision)$/i }
    });

    // Get approved requests count (this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const approvedRequests = await RequestApproval.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^approved$/i },
      updatedAt: { $gte: oneWeekAgo }
    }) + await ServiceRequest.countDocuments({
      assignedUnits: user.unitTeam,
      status: { $regex: /^completed$/i },
      updatedAt: { $gte: oneWeekAgo }
    });

    res.json({
      pendingRequests,
      inReviewRequests,
      approvedRequests
    });
  } catch (error) {
    console.error('Error fetching workload snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch workload snapshot' });
  }
});

/**
 * GET /unit/dashboard/recent-activity
 * Get recent activity HTML for real-time updates
 */
router.get('/unit/dashboard/recent-activity', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Get recent activity (recent tasks assigned to the unit)
    const recentApprovalActivity = await RequestApproval
      .find({
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentServiceActivity = await ServiceRequest
      .find({
        assignedUnits: user.unitTeam,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'fName lName')
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

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

    // Render the recent activity table rows HTML
    res.render('Unit/partials/recent-activity', {
      recentActivity,
      layout: false
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

/**
 * GET /unit/dashboard/requester-compliance
 * Get requester compliance data for real-time updates
 */
router.get('/unit/dashboard/requester-compliance', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Calculate requester compliance (organizations with submission/response stats)
    const allTasks = [
      ...(await RequestApproval.find({
        assignedUnits: user.unitTeam
      }).populate('userId', 'studentOrg office').lean()),
      ...(await ServiceRequest.find({
        assignedUnits: user.unitTeam
      }).populate('userId', 'studentOrg office').lean())
    ];

    const orgCompliance = {};
    
    // Collect all tasks by organization
    for (const task of allTasks) {
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
      const now = new Date();
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
      .slice(0, 8);

    res.json(requesterCompliance);
  } catch (error) {
    console.error('Error fetching requester compliance:', error);
    res.status(500).json({ error: 'Failed to fetch requester compliance' });
  }
});

/**
 * GET /unit/dashboard/task-timeline
 * Get task timeline data for real-time updates
 */
router.get('/unit/dashboard/task-timeline', requireUnit, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || !user.unitTeam || user.unitTeam === 'N/A') {
      return res.status(403).json({ error: 'Not assigned to a unit team' });
    }

    // Calculate task timeline for last 7 days
    const taskTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayApprovals = await RequestApproval.countDocuments({
        assignedUnits: user.unitTeam,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayServices = await ServiceRequest.countDocuments({
        assignedUnits: user.unitTeam,
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const dayCompleted = await RequestApproval.countDocuments({
        assignedUnits: user.unitTeam,
        status: 'Approved',
        updatedAt: { $gte: date, $lt: nextDate }
      }) + await ServiceRequest.countDocuments({
        assignedUnits: user.unitTeam,
        status: 'Completed',
        updatedAt: { $gte: date, $lt: nextDate }
      });
      
      taskTimeline.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newTasks: dayApprovals + dayServices,
        completed: dayCompleted
      });
    }
    
    res.json(taskTimeline);
  } catch (error) {
    console.error('Error fetching task timeline:', error);
    res.status(500).json({ error: 'Failed to fetch task timeline' });
  }
});

module.exports = router;
