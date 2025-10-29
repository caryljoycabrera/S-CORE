// ===== User Routes =====
// This module handles all user-facing routes and functionality
// Includes dashboard, profile management, request submission, and user APIs

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RequestApproval = require('../models/RequestApproval');
const ServiceRequest = require('../models/ServiceRequest');
const { requireLogin } = require('../middleware/auth');
const { upload, UPLOADS_DIR } = require('../config/upload');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

/**
 * GET /
 * Homepage route - serves the public homepage with SCO information
 * If user is logged in, redirects to dashboard
 */
router.get('/', (req, res) => {
  if (req.session.userId) {
    // If user is logged in, redirect to their dashboard
    return res.redirect('/dashboard');
  }
  // If not logged in, show the public homepage
  res.render('homepage');
});

/**
 * GET /dashboard
 * User dashboard with statistics and recent activity
 */
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Get approval request statistics
    const totalApprovals = await RequestApproval.countDocuments({ userId: user._id });
    const approvedApprovals = await RequestApproval.countDocuments({
      userId: user._id,
      status: { $regex: /^approved$/i }
    });
    const pendingApprovals = await RequestApproval.countDocuments({
      userId: user._id,
      status: { $regex: /^pending$/i }
    });
    const revisionApprovals = await RequestApproval.countDocuments({
      userId: user._id,
      status: { $regex: /^revision$/i }
    });

    // Get service request statistics
    const totalServices = await ServiceRequest.countDocuments({ userId: user._id });
    const approvedServices = await ServiceRequest.countDocuments({
      userId: user._id,
      status: { $regex: /^approved$/i }
    });
    const pendingServices = await ServiceRequest.countDocuments({
      userId: user._id,
      status: { $regex: /^pending$/i }
    });
    const revisionServices = await ServiceRequest.countDocuments({
      userId: user._id,
      status: { $regex: /^revision$/i }
    });

    // Calculate combined statistics
    const totalRequests = totalApprovals + totalServices;
    const approvedRequests = approvedApprovals + approvedServices;
    const pendingRequests = pendingApprovals + pendingServices;
    const inReviewRequests = revisionApprovals + revisionServices;

    // Get recent activity from both request types
    const approvalActivity = await RequestApproval
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const serviceActivity = await ServiceRequest
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentActivity = [...approvalActivity, ...serviceActivity]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);

    res.render('User/userPage', {
      name: `${user.fName} ${user.lName}`,
      user,
      totalRequests,
      approvedRequests,
      pendingRequests,
      inReviewRequests,
      recentActivity
    });
  } catch (err) {
    console.error('User dashboard load error:', err);
    res.status(500).render('error', { message: 'Failed to load dashboard.' });
  }
});

/**
 * GET /request-approvals
 * User's approval requests page with status-based sorting
 */
router.get('/request-approvals', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    let approvals = await RequestApproval.find({ userId: user._id }).lean();

    // Status priority for sorting approvals
    const statusPriority = {
      "pending": 1,
      "for revision": 2,
      "approved": 3,
      "rejected": 4,
      "archived": 5
    };

    // Sort approvals according to status priority and date rules
    approvals.sort((a, b) => {
      const aStatus = a.status?.toLowerCase() || '';
      const bStatus = b.status?.toLowerCase() || '';

      // Group by status priority
      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Tie-break rules
      if (aStatus === "pending") {
        // Oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (aStatus === "for revision") {
        // Oldest first by deadline, if no deadline then by createdAt
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;
        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (["approved", "rejected", "archived"].includes(aStatus)) {
        // Newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    // Map requests with type and organization
    const allRequests = approvals.map(r => ({
      ...r,
      type: "Request Approval",
      organization: r.organization || 'N/A'
    }));

    res.render('User/Requestapproval', { approvals, user, allRequests });
  } catch (err) {
    console.error('Error loading approvals:', err);
    res.status(500).send('Error loading page');
  }
});

/**
 * GET /service-requests
 * User's service requests page with status-based sorting
 */
router.get('/service-requests', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    let serviceRequests = await ServiceRequest.find({ userId: user._id })
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file createdAt updatedAt')
      .lean();

    // Status priority for sorting services
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

    // Map requests with type and ensure organization
    const allRequests = serviceRequests.map(r => ({
      ...r,
      type: "Service Request",
      organization: r.organization || 'N/A',
      specificRequestType: r.specificRequestType || 'Not specified'
    }));

    res.render('User/ServiceRequest', { user, serviceRequests, allRequests });

  } catch (err) {
    console.error('Error loading service requests:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
});

/**
 * GET /all-requests
 * Combined view of all user's requests (approvals and services)
 */
router.get('/all-requests', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    const approvals = await RequestApproval.find({ userId: user._id }).lean();
    const services = await ServiceRequest.find({ userId: user._id }).lean();

    // Combine all requests
    const allRequests = [
      ...approvals.map(r => ({
        ...r,
        type: "Request Approval",
        organization: r.organization || 'N/A'
      })),
      ...services.map(r => ({
        ...r,
        type: "Service Request",
        organization: r.organization || 'N/A'
      }))
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

    res.render('User/allRequestsUser', { user, approvals, serviceRequests: services, allRequests });
  } catch (err) {
    console.error('Error loading all requests:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
});

/**
 * GET /api/user-deadlines
 * API endpoint for user's request deadlines grouped by date
 */
router.get('/api/user-deadlines', requireLogin, async (req, res) => {
  try {
    console.log('User fetching all requests from database...');

    // Fetch ALL current user's approval requests and service requests
    const approvals = await RequestApproval.find({
      userId: req.session.userId
    }).select('deadline title status createdAt').lean();

    const services = await ServiceRequest.find({
      userId: req.session.userId
    }).select('deadline title status createdAt').lean();

    console.log(`Found ${approvals.length} approval requests and ${services.length} service requests for user`);

    // Group requests by date (use deadline if available, otherwise use createdAt)
    const requestsByDate = {};

    // Process approval requests
    approvals.forEach(approval => {
      try {
        const dateToUse = approval.deadline ? new Date(approval.deadline) : new Date(approval.createdAt);
        const dateStr = dateToUse.getFullYear() + '-' +
                       String(dateToUse.getMonth() + 1).padStart(2, '0') + '-' +
                       String(dateToUse.getDate()).padStart(2, '0');

        if (!requestsByDate[dateStr]) {
          requestsByDate[dateStr] = { approvals: 0, services: 0 };
        }
        requestsByDate[dateStr].approvals += 1;
      } catch (error) {
        console.error('Error processing approval request:', approval, error);
      }
    });

    // Process service requests
    services.forEach(service => {
      try {
        const dateToUse = service.deadline ? new Date(service.deadline) : new Date(service.createdAt);
        const dateStr = dateToUse.getFullYear() + '-' +
                       String(dateToUse.getMonth() + 1).padStart(2, '0') + '-' +
                       String(dateToUse.getDate()).padStart(2, '0');

        if (!requestsByDate[dateStr]) {
          requestsByDate[dateStr] = { approvals: 0, services: 0 };
        }
        requestsByDate[dateStr].services += 1;
      } catch (error) {
        console.error('Error processing service request:', service, error);
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.json(requestsByDate);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
  }
});

/**
 * GET /api/user-deadlines/:date/details
 * API endpoint for detailed request info for a specific date
 */
router.get('/api/user-deadlines/:date/details', requireLogin, async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`Fetching detailed requests for user on date: ${date}`);

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

    // Fetch approval requests for current user
    const approvals = await RequestApproval.find({
      userId: req.session.userId,
      $or: [
        {
          deadline: {
            $gte: startDate,
            $lte: endDate
          }
        },
        {
          deadline: { $exists: false },
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        {
          deadline: null,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      ]
    })
    .populate('userId', 'fName lName userType affiliation studentOrganization')
    .select('_id title description organization deadline createdAt userId status')
    .lean();

    // Fetch service requests for current user
    const services = await ServiceRequest.find({
      userId: req.session.userId,
      $or: [
        {
          deadline: {
            $gte: startDate,
            $lte: endDate
          }
        },
        {
          deadline: { $exists: false },
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        {
          deadline: null,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      ]
    })
    .populate('userId', 'fName lName userType affiliation studentOrganization')
    .select('_id title description organization deadline createdAt userId status')
    .lean();

    console.log(`Found ${approvals.length} approvals, ${services.length} services for user on ${date}`);

    // Process the data
    const processedApprovals = approvals.map(approval => ({
      ...approval,
      displayOrganization: approval.userId?.userType === 'nonstudent'
        ? approval.userId.affiliation
        : approval.organization || 'N/A',
      dateType: approval.deadline ? 'deadline' : 'created'
    }));

    const processedServices = services.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? service.userId.affiliation
        : service.organization || 'N/A',
      dateType: service.deadline ? 'deadline' : 'created'
    }));

    const response = {
      date: date,
      approvals: processedApprovals,
      services: processedServices,
      totalCount: processedApprovals.length + processedServices.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user detailed requests:', error);
    res.status(500).json({
      error: 'Failed to fetch detailed requests',
      date: req.params.date || 'unknown',
      approvals: [],
      services: [],
      totalCount: 0
    });
  }
});

/**
 * GET /profile
 * User profile display page
 */
router.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    res.render('User/profile', { user });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).render('error', { message: 'Failed to load profile page.' });
  }
});

/**
 * POST /profile/update-popup
 * Updates user profile information
 */
router.post('/profile/update-popup', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  console.log('Profile update request body:', req.body);

  const { fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, studentId, affiliation } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');

    console.log('User type:', user.userType);

    const updateData = { fName, mName, lName, email, username, phoneNumber };

    if (user.userType === 'student') {
      console.log('Updating student data');
      if (typeof studentOrganization === 'string') {
        updateData.studentOrganization = studentOrganization.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(studentOrganization)) {
        updateData.studentOrganization = studentOrganization;
      } else {
        updateData.studentOrganization = [];
      }
      updateData.cys = cys;
      updateData.studentId = studentId;

      console.log('Student organization update:', updateData.studentOrganization);
    } else {
      console.log('Updating non-student data');
      console.log('Received affiliation:', affiliation);

      if (typeof affiliation === 'string') {
        updateData.affiliation = affiliation.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(affiliation)) {
        updateData.affiliation = affiliation;
      } else {
        updateData.affiliation = [];
      }

      console.log('Final affiliation update:', updateData.affiliation);
    }

    console.log('Final update data:', updateData);

    await User.findByIdAndUpdate(req.session.userId, updateData);

    console.log('Profile updated successfully');
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Update failed: ' + err.message);
  }
});

/**
 * POST /profile/change-password-popup
 * Updates user password
 */
router.post('/profile/change-password-popup', async (req, res) => {
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
 * POST /profile/upload-picture
 * Uploads and updates user profile picture
 */
router.post('/profile/upload-picture', upload.single('profilePicture'), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');

    user.profilePicture = req.file.filename;
    await user.save();

    res.status(200).send('Profile picture updated');
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).send('Upload failed');
  }
});

/**
 * POST /profile/delete-picture
 * Deletes user's profile picture
 */
router.post('/profile/delete-picture', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  try {
    const user = await User.findById(req.session.userId);
    if (!user || !user.profilePicture) {
      return res.status(400).send('No profile picture to delete.');
    }

    const imagePath = path.join(UPLOADS_DIR, user.profilePicture);

    // Delete file from uploads folder
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove reference from database
    user.profilePicture = undefined;
    await user.save();

    res.status(200).send('Profile picture deleted');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Error deleting profile picture.');
  }
});

/**
 * POST /submit-request-approval
 * Handles submission of approval requests with file uploads
 */
router.post('/submit-request-approval', upload.array('upload', 20), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { projectTitle, organization, description, specificRequestType } = req.body;

  console.log('Files received:', req.files);
  console.log('Organization received:', organization);
  console.log('Specific Request Type received:', specificRequestType);

  // Validate required fields
  if (!projectTitle || !description || !specificRequestType) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields'
    });
  }

  // Handle multiple files
  let filePaths = [];
  if (req.files && req.files.length > 0) {
    filePaths = req.files.map(file => file.filename);
    console.log('File paths:', filePaths);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please upload at least one file'
    });
  }

  try {
    const user = await User.findById(req.session.userId);

    let actualOrganization = 'N/A';

    if (organization && organization.trim()) {
      actualOrganization = organization.trim();
    } else {
      if (user.userType === 'nonstudent') {
        if (Array.isArray(user.affiliation)) {
          actualOrganization = user.affiliation[0] || 'N/A';
        } else {
          actualOrganization = user.affiliation || 'N/A';
        }
      } else {
        if (Array.isArray(user.studentOrganization)) {
          actualOrganization = user.studentOrganization[0] || 'N/A';
        } else {
          actualOrganization = user.studentOrganization || 'N/A';
        }
      }
    }

    console.log('Final organization (single):', actualOrganization);

    if (typeof actualOrganization !== 'string') {
      throw new Error('Organization must be a single string value');
    }

    // Calculate 3 working days from now
    const { addWorkingDays } = require('../utils/helpers');
    const deadline = addWorkingDays(new Date(), 3);

    const newRequest = new RequestApproval({
      title: projectTitle,
      organization: actualOrganization,
      description,
      specificRequestType: specificRequestType,
      deadline: deadline,
      userId: req.session.userId,
      files: filePaths,
      file: filePaths[0] || null
    });

    await newRequest.save();
    console.log('Request approval saved with organization:', actualOrganization);
    console.log('Request approval saved with specific type:', specificRequestType);
    console.log('Request approval saved with files:', filePaths);

    // Return JSON response instead of redirect
    res.json({
      success: true,
      message: 'Request submitted successfully',
      redirectUrl: '/request-approvals?submitted=true'
    });
  } catch (err) {
    console.error('Error saving request approval:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save approval request: ' + err.message
    });
  }
});

/**
 * POST /submit-service-request
 * Handles submission of service requests with file uploads
 */
router.post('/submit-service-request', upload.array('uploadServiceFile', 20), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  const { projectTitle, organization, description, deadline, specificRequestType } = req.body;

  console.log('Files received:', req.files);
  console.log('Organization received:', organization);
  console.log('Specific Request Type received:', specificRequestType);

  // Handle multiple files
  let filePaths = [];
  if (req.files && req.files.length > 0) {
    filePaths = req.files.map(file => file.filename);
    console.log('File paths:', filePaths);
  }

  try {
    const user = await User.findById(req.session.userId);

    let actualOrganization = 'N/A';

    if (organization && organization.trim()) {
      actualOrganization = organization.trim();
    } else {
      // Only use user's default if no organization was selected in the form
      if (user.userType === 'nonstudent') {
        if (Array.isArray(user.affiliation)) {
          actualOrganization = user.affiliation[0] || 'N/A';
        } else {
          actualOrganization = user.affiliation || 'N/A';
        }
      } else {
        if (Array.isArray(user.studentOrganization)) {
          actualOrganization = user.studentOrganization[0] || 'N/A';
        } else {
          actualOrganization = user.studentOrganization || 'N/A';
        }
      }
    }

    console.log('Final organization (single):', actualOrganization);

    // Validate that actualOrganization is a string
    if (typeof actualOrganization !== 'string') {
      throw new Error('Organization must be a single string value');
    }

    const newRequest = new ServiceRequest({
      title: projectTitle,
      organization: actualOrganization,
      description,
      deadline,
      specificRequestType: specificRequestType,
      userId: req.session.userId,
      files: filePaths,
      file: filePaths[0] || null
    });

    await newRequest.save();
    console.log('Service request saved with organization:', actualOrganization);
    console.log('Service request saved with specific type:', specificRequestType);
    console.log('Service request saved with files:', filePaths);
    res.redirect('/service-requests');
  } catch (err) {
    console.error('Error saving service request:', err);
    res.status(500).send('Failed to save service request: ' + err.message);
  }
});

module.exports = router;
