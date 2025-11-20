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
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

/**
 * Request Type to Unit Mapping
 * Automatically assigns requests to appropriate units based on specificRequestType
 */
const requestTypeToUnitMapping = {
  // Graphics & Design Services (Service Requests)
  "Creation of New Graphics/Pubmat": "Graphics",
  "Creation of New Logo/Branding Element": "Graphics",

  // Multimedia Services (Service Requests)
  "Event Photo & Video Coverage": "Multimedia",
  "Photo/Video Editing Service": "Multimedia",

  // Content & Communications (Service Requests)
  "Magazine Content Creation": "Public Relations",
  "Social Media Content Sharing/Posting": "Social Media",

  // Content & Communications Services (Approval Requests)
  "Content Posting": "Public Relations",
  "Social Media Monitoring": "Social Media",
  "Caption Approval": "Public Relations",
  "Publication Design": "Graphics",
  "Proofreading": "Public Relations",

  // Multimedia Services (Approval Requests)
  "Graphics Design": "Graphics",
  "Media Coverage": "Multimedia"
};

/**
 * Get auto-assigned unit for a specific request type
 * @param {string} specificRequestType - The type of request
 * @returns {string} The assigned unit name or empty string if not found
 */
function getAutoAssignedUnit(specificRequestType) {
  return requestTypeToUnitMapping[specificRequestType] || '';
}

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
 * GET /user-guide
 * User guide and help documentation page
 */
router.get('/user-guide', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    res.render('User/guide', { user });
  } catch (err) {
    console.error('Error loading user guide:', err);
    res.status(500).render('error', { message: 'Failed to load guide page.' });
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

  const { projectTitle, organization, description, specificRequestType, links } = req.body;

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
      // User selected an organization from dropdown - use only that one
      actualOrganization = organization.trim();
      console.log('User selected organization from dropdown:', actualOrganization);
    } else {
      // No organization selected - use first available from user's profile
      if (user.userType === 'nonstudent') {
        if (Array.isArray(user.affiliation) && user.affiliation.length > 0) {
          actualOrganization = user.affiliation[0];
          console.log('Using first affiliation from user profile:', actualOrganization);
        } else if (user.affiliation) {
          actualOrganization = user.affiliation;
          console.log('Using single affiliation from user profile:', actualOrganization);
        }
      } else {
        if (Array.isArray(user.studentOrganization) && user.studentOrganization.length > 0) {
          actualOrganization = user.studentOrganization[0];
          console.log('Using first student organization from user profile:', actualOrganization);
        } else if (user.studentOrganization) {
          actualOrganization = user.studentOrganization;
          console.log('Using single student organization from user profile:', actualOrganization);
        }
      }
    }

    // Ensure we have a valid organization
    if (!actualOrganization || actualOrganization === 'N/A') {
      throw new Error('No valid organization found. Please select an organization or update your profile.');
    }

    console.log('Final organization (single):', actualOrganization);

    // Validate that actualOrganization is a string
    if (typeof actualOrganization !== 'string') {
      throw new Error('Organization must be a single string value');
    }

    // Calculate 3 working days from now
    const { addWorkingDays } = require('../utils/helpers');
    const deadline = addWorkingDays(new Date(), 3);

    // Auto-assign unit based on request type
    const autoAssignedUnit = getAutoAssignedUnit(specificRequestType);
    const assignedUnits = autoAssignedUnit || 'Not yet assigned';
    
    // Smart Triage: Set status based on whether it's auto-assigned
    // If auto-assigned (specified type), set to 'Queued' for unit inbox
    // If not auto-assigned (custom type), set to 'Pending' for admin inbox
    const initialStatus = autoAssignedUnit ? 'Queued' : 'Pending';

    const newRequest = new RequestApproval({
      title: projectTitle,
      organization: actualOrganization,
      description,
      specificRequestType: specificRequestType,
      deadline: deadline,
      userId: req.session.userId,
      files: filePaths,
      file: filePaths[0] || null,
      links: links ? (Array.isArray(links) ? links : [links]) : [],
      status: initialStatus,
      assignedUnits: assignedUnits,
      originalAssignedUnits: autoAssignedUnit // Store original auto-assignment
    });

    await newRequest.save();
    console.log('Request approval saved with organization:', actualOrganization);
    console.log('Request approval saved with specific type:', specificRequestType);
    console.log('Request approval saved with files:', filePaths);

    // Send notifications to admins
    try {
      const admins = await User.find({ role: 'admin' });
      const adminIds = admins.map(admin => admin._id);
      await notificationService.notifyApprovalCreated(newRequest._id, req.session.userId, adminIds);
    } catch (notifError) {
      console.error('Error sending approval creation notifications:', notifError);
    }

    // Notify assigned unit members if auto-assigned
    if (autoAssignedUnit && autoAssignedUnit !== '') {
      try {
        console.log(`🚀 USER ROUTE (APPROVAL): Attempting to notify unit members`);
        console.log(`🚀 USER ROUTE (APPROVAL): autoAssignedUnit =`, autoAssignedUnit);
        console.log(`🚀 USER ROUTE (APPROVAL): Request ID =`, newRequest._id);
        await notificationService.notifyUnitTaskAssigned(newRequest._id, 'approval', autoAssignedUnit, null);
        console.log('✅ USER ROUTE (APPROVAL): Unit notification sent for auto-assigned approval request to:', autoAssignedUnit);
      } catch (unitNotifError) {
        console.error('❌ USER ROUTE (APPROVAL): Error sending unit notification:', unitNotifError);
        console.error('❌ USER ROUTE (APPROVAL): Error stack:', unitNotifError.stack);
      }
    } else {
      console.log('⚠️ USER ROUTE (APPROVAL): No unit auto-assigned or empty unit:', autoAssignedUnit);
    }

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
 * POST /add-files/:requestId
 * Adds additional files to existing approval requests (for revision requests)
 */
router.post('/add-files/:requestId', upload.array('additionalFiles', 20), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { requestId } = req.params;
  console.log('Adding files to request ID:', requestId);

  try {
    // Find the request and ensure it belongs to the user
    const request = await RequestApproval.findOne({
      _id: requestId,
      userId: req.session.userId
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or you do not have permission to modify it'
      });
    }

    // Ensure the request is in "for revision" status
    if (request.status?.toLowerCase() !== 'for revision') {
      return res.status(400).json({
        success: false,
        message: 'Files can only be added to requests that are marked for revision'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one additional file'
      });
    }

    const newFilePaths = req.files.map(file => file.filename);
    console.log('Additional file paths:', newFilePaths);

    // Append new files to existing files array
    const updatedFiles = [...(request.files || []), ...newFilePaths];
    request.files = updatedFiles;

    // Also update the primary 'file' field to the first file if it's null
    if (!request.file && newFilePaths.length > 0) {
      request.file = newFilePaths[0];
    }

    // Update the request's updatedAt timestamp and mark additional file upload as allowed
    request.updatedAt = new Date();
    request.allowAdditionalFileUpload = false; // No more additional files allowed after upload

    await request.save();

    // Send notification to admins about the file update
    try {
      const admins = await User.find({ role: 'admin' });
      const adminIds = admins.map(admin => admin._id);
      await notificationService.notifyApprovalUpdated(requestId, req.session.userId, adminIds);
    } catch (notifError) {
      console.error('Error sending approval update notifications:', notifError);
    }

    console.log('Successfully added files to request:', requestId);
    console.log('Updated files array:', updatedFiles);

    res.json({
      success: true,
      message: `Successfully added ${newFilePaths.length} additional file(s) to your request`,
      newFiles: newFilePaths,
      totalFiles: updatedFiles.length
    });

  } catch (error) {
    console.error('Error adding files to request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add files: ' + error.message
    });
  }
});

/**
 * POST /submit-service-request
 * Handles submission of service requests with file uploads
 */
router.post('/submit-service-request', upload.array('uploadServiceFile', 20), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');

  const { projectTitle, organization, description, deadline, specificRequestType, isCustomType, links } = req.body;

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

    // Auto-assign unit based on request type
    const autoAssignedUnit = getAutoAssignedUnit(specificRequestType);
    const assignedUnits = autoAssignedUnit || 'Not yet assigned';
    
    // Smart Triage: Set status based on whether it's auto-assigned
    // If auto-assigned (specified type), set to 'Queued' for unit inbox
    // If not auto-assigned (custom type), set to 'Pending' for admin inbox
    const initialStatus = autoAssignedUnit ? 'Queued' : 'Pending';

    const newRequest = new ServiceRequest({
      title: projectTitle,
      organization: actualOrganization,
      description,
      deadline,
      specificRequestType: specificRequestType,
      userId: req.session.userId,
      files: filePaths,
      file: filePaths[0] || null,
      links: links ? (Array.isArray(links) ? links : [links]) : [],
      status: initialStatus,
      assignedUnits: assignedUnits,
      originalAssignedUnits: autoAssignedUnit // Store original auto-assignment
    });

    await newRequest.save();
    console.log('Service request saved with organization:', actualOrganization);
    console.log('Service request saved with specific type:', specificRequestType);
    console.log('Service request auto-assigned to unit:', assignedUnits);
    console.log('Service request saved with files:', filePaths);

    // Handle custom request type submission for admin review
    if (isCustomType === 'true') {
      try {
        const RequestType = require('../models/RequestType');

        // Check if this custom type already exists (pending or approved)
        const existingType = await RequestType.findOne({
          name: specificRequestType,
          category: 'service'
        });

        if (!existingType) {
          // Create new custom request type for admin review
          const customType = new RequestType({
            name: specificRequestType,
            category: 'service',
            assignedUnit: autoAssignedUnit || 'Not yet assigned', // Suggest unit based on mapping
            submittedBy: req.session.userId,
            status: 'pending'
          });

          await customType.save();
          console.log('Custom request type submitted for admin review:', specificRequestType);

          // Notify admins about new custom type
          try {
            const admins = await User.find({ role: 'admin' });
            const adminIds = admins.map(admin => admin._id);
            // You could add a specific notification for custom types here
          } catch (notifError) {
            console.error('Error sending custom type notifications:', notifError);
          }
        } else {
          console.log('Custom request type already exists:', specificRequestType);
        }
      } catch (customTypeError) {
        console.error('Error handling custom request type:', customTypeError);
        // Don't fail the request submission for this
      }
    }

    // Send notifications to admins
    try {
      const admins = await User.find({ role: 'admin' });
      const adminIds = admins.map(admin => admin._id);
      await notificationService.notifyServiceCreated(newRequest._id, req.session.userId, adminIds);
    } catch (notifError) {
      console.error('Error sending service creation notifications:', notifError);
    }

    // Notify assigned unit members if auto-assigned
    if (autoAssignedUnit && autoAssignedUnit !== '') {
      try {
        console.log(`🚀 USER ROUTE: Attempting to notify unit members`);
        console.log(`🚀 USER ROUTE: autoAssignedUnit =`, autoAssignedUnit);
        console.log(`🚀 USER ROUTE: Request ID =`, newRequest._id);
        await notificationService.notifyUnitTaskAssigned(newRequest._id, 'service', autoAssignedUnit, null);
        console.log('✅ USER ROUTE: Unit notification sent for auto-assigned service request to:', autoAssignedUnit);
      } catch (unitNotifError) {
        console.error('❌ USER ROUTE: Error sending unit notification:', unitNotifError);
        console.error('❌ USER ROUTE: Error stack:', unitNotifError.stack);
      }
    } else {
      console.log('⚠️ USER ROUTE: No unit auto-assigned or empty unit:', autoAssignedUnit);
    }

    res.redirect('/service-requests');
  } catch (err) {
    console.error('Error saving service request:', err);
    res.status(500).send('Failed to save service request: ' + err.message);
  }
});

/**
 * POST /resubmit-approval-request/:id
 * Resubmit an approval request after addressing revision feedback
 */
router.post('/resubmit-approval-request/:id', upload.array('additionalFiles', 20), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const requestId = req.params.id;
  const { resubmissionNotes } = req.body;

  try {
    const request = await RequestApproval.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Verify user owns this request
    if (request.userId.toString() !== req.session.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to resubmit this request' });
    }

    // Verify request is awaiting resubmission
    if (!request.awaitingResubmission) {
      return res.status(400).json({ success: false, message: 'This request is not awaiting resubmission' });
    }

    // Handle additional files
    let additionalFilePaths = [];
    if (req.files && req.files.length > 0) {
      additionalFilePaths = req.files.map(file => file.filename);
      // Add new files to existing files array
      request.files = [...(request.files || []), ...additionalFilePaths];
    }

    // Update the most recent revision history entry with response
    if (request.revisionHistory && request.revisionHistory.length > 0) {
      const latestRevision = request.revisionHistory[request.revisionHistory.length - 1];
      latestRevision.respondedBy = req.session.userId;
      latestRevision.respondedAt = new Date();
      latestRevision.responseNotes = resubmissionNotes || 'Resubmitted with updates';
      latestRevision.responseFiles = additionalFilePaths;
      latestRevision.status = 'responded';
    }

    // CREATE NEW REVISION HISTORY ENTRY for the resubmission (visible to user)
    // Use the existing schema structure - this represents a "responded" revision
    const newResubmission = {
      respondedBy: req.session.userId,
      respondedAt: new Date(),
      responseNotes: resubmissionNotes || 'Resubmitted with updates',
      responseFiles: additionalFilePaths,
      status: 'responded'  // Valid enum values: 'pending', 'responded', 'resolved'
    };
    
    console.log('🔥 CREATING RESUBMISSION ENTRY:', newResubmission);
    request.revisionHistory.push(newResubmission);
    console.log('✅ Total revision history entries:', request.revisionHistory.length);

    // Change status back to Pending for unit to review again
    request.status = 'Pending';
    request.awaitingResubmission = false;
    await request.save();
    console.log('✅ Request saved with new resubmission entry');

    // Add message to conversation
    const Conversation = require('../models/Conversation');
    let conversation = await Conversation.findOne({ approvalRequestId: requestId });
    
    if (!conversation) {
      conversation = new Conversation({
        approvalRequestId: requestId,
        requestType: 'approval',
        messages: []
      });
    }

    // Add resubmission message with attachments
    const attachments = additionalFilePaths.map(filename => ({
      filename: filename,
      originalname: filename,
      mimetype: 'application/octet-stream',
      size: 0,
      path: `/uploads/${filename}`
    }));

    conversation.messages.push({
      senderId: req.session.userId,
      senderRole: 'user',
      content: `✅ **Revision Response**\n\nI have addressed the revision feedback and resubmitted the request.\n\n${resubmissionNotes || 'No additional notes provided.'}`,
      attachments: attachments,
      timestamp: new Date()
    });

    await conversation.save();

    // Notify unit members and admins
    try {
      await notificationService.notifyRequestorResubmission(request._id, req.session.userId, request.assignedUnits);
    } catch (notifError) {
      console.error('Error sending resubmission notifications:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Request resubmitted successfully. The unit team has been notified.',
      filesUploaded: additionalFilePaths.length
    });
  } catch (error) {
    console.error('Error resubmitting approval request:', error);
    res.status(500).json({ success: false, message: 'Error resubmitting request: ' + error.message });
  }
});

/**
 * POST /user/service/request-revision/:id
 * User-initiated revision request for completed service requests
 * Allows users to request changes with specific feedback and file uploads (2 revision limit)
 */
router.post('/user/service/request-revision/:id', upload.array('revisionFiles', 10), requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionNotes } = req.body;
    const userId = req.session.userId;

    // Find the service request
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Verify user owns this request
    if (request.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to request revision for this request' });
    }

    // Verify request is in Completed or For Checking status
    if (request.status !== 'Completed' && request.status !== 'For Checking') {
      return res.status(400).json({ success: false, message: 'Only completed or for-checking requests can be sent for revision' });
    }

    // Check revision limit (2 revisions maximum)
    if (request.revisionCount >= 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'This task has reached its 2-revision limit. For further changes, please submit a new Service Request and reference this one.' 
      });
    }

    // Validate revision notes
    if (!revisionNotes || revisionNotes.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide revision notes explaining what needs to be changed' });
    }

    // Get uploaded file names
    const revisionFiles = req.files ? req.files.map(file => file.filename) : [];

    // Ensure revisionHistory is initialized as an array
    if (!Array.isArray(request.revisionHistory)) {
      request.revisionHistory = [];
    }

    // Increment revision count
    request.revisionCount += 1;
    request.status = 'For Revision';
    
    // Create the revision entry with proper types
    const mongoose = require('mongoose');
    const revisionEntry = {
      requestedBy: new mongoose.Types.ObjectId(userId),
      requestedAt: new Date(),
      revisionNotes: String(revisionNotes),
      revisionFiles: revisionFiles,
      status: 'for_revision',
      revisionType: 'revision_requested',
      revisionNumber: request.revisionCount // Track which revision cycle this belongs to
    };
    
    // Add to revision history
    request.revisionHistory.push(revisionEntry);
    
    // Save the request
    await request.save();

    // Add message to conversation
    const Conversation = require('../models/Conversation');
    let conversation = await Conversation.findOne({ serviceRequestId: id });
    
    if (!conversation) {
      conversation = new Conversation({
        serviceRequestId: id,
        requestType: 'service',
        messages: []
      });
    }

    conversation.messages.push({
      senderId: userId,
      senderRole: 'user',
      content: `🔄 **Revision Request #${request.revisionCount}**\n\n${revisionNotes}\n\n_Revisions remaining: ${2 - request.revisionCount}_`,
      timestamp: new Date()
    });

    await conversation.save();

    // Notify unit team about the revision request
    try {
      await notificationService.notifyUnitRevisionRequested(request._id, userId, request.assignedUnits, request.revisionCount);
    } catch (notifError) {
      console.error('Error sending revision request notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: `Revision request submitted successfully. (Revision ${request.revisionCount} of 2)`,
      revisionCount: request.revisionCount,
      revisionsRemaining: 2 - request.revisionCount
    });
  } catch (error) {
    console.error('Error requesting service revision:', error);
    res.status(500).json({ success: false, message: 'Error requesting revision: ' + error.message });
  }
});

/**
 * POST /user/service/mark-complete/:id
 * User marks a service request as complete (accepts deliverables)
 */
router.post('/user/service/mark-complete/:id', requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // Find the service request
    const request = await ServiceRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Verify user owns this request
    if (request.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to complete this request' });
    }

    // Verify request is in For Checking status
    if (request.status !== 'For Checking') {
      return res.status(400).json({ success: false, message: 'Only requests with status "For Checking" can be marked as complete' });
    }

    // Update status to Completed
    request.status = 'Completed';
    await request.save();

    // Notify unit team that request was marked complete
    try {
      await notificationService.notifyServiceCompleted(request._id, userId, request.assignedUnits);
    } catch (notifError) {
      console.error('Error sending completion notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Service request marked as complete successfully!'
    });
  } catch (error) {
    console.error('Error marking service as complete:', error);
    res.status(500).json({ success: false, message: 'Error marking service as complete: ' + error.message });
  }
});

/**
 * POST /user/approval/request-revision/:id
 * User-initiated revision request for completed approval requests
 * Allows users to request changes with specific feedback (2 revision limit)
 */
router.post('/user/approval/request-revision/:id', requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionNotes } = req.body;
    const userId = req.session.userId;

    // Find the approval request
    const request = await RequestApproval.findById(id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Approval request not found' });
    }

    // Verify user owns this request
    if (request.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to request revision for this request' });
    }

    // Verify request is in Approved status (for approval requests, "Approved" is the completed state)
    if (request.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Only approved requests can be sent for revision' });
    }

    // Check revision limit (2 revisions maximum)
    if (request.revisionCount >= 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'This task has reached its 2-revision limit. For further changes, please submit a new Request for Approval and reference this one.' 
      });
    }

    // Validate revision notes
    if (!revisionNotes || revisionNotes.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide revision notes explaining what needs to be changed' });
    }

    // Increment revision count
    request.revisionCount += 1;
    request.status = 'For Revision';
    await request.save();

    // Add message to conversation
    const Conversation = require('../models/Conversation');
    let conversation = await Conversation.findOne({ approvalRequestId: id });
    
    if (!conversation) {
      conversation = new Conversation({
        approvalRequestId: id,
        requestType: 'approval',
        messages: []
      });
    }

    conversation.messages.push({
      senderId: userId,
      senderRole: 'user',
      content: `🔄 **Revision Request #${request.revisionCount}**\n\n${revisionNotes}\n\n_Revisions remaining: ${2 - request.revisionCount}_`,
      timestamp: new Date()
    });

    await conversation.save();

    // Notify unit team about the revision request
    try {
      await notificationService.notifyUnitRevisionRequested(request._id, userId, request.assignedUnits, request.revisionCount);
    } catch (notifError) {
      console.error('Error sending revision request notification:', notifError);
    }

    res.json({ 
      success: true, 
      message: `Revision request submitted successfully. (Revision ${request.revisionCount} of 2)`,
      revisionCount: request.revisionCount,
      revisionsRemaining: 2 - request.revisionCount
    });
  } catch (error) {
    console.error('Error requesting approval revision:', error);
    res.status(500).json({ success: false, message: 'Error requesting revision: ' + error.message });
  }
});

module.exports = router;
