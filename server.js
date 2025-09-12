const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');

const app = express();
const port = 8080;
const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

const PROJECT_ROOT = path.resolve(__dirname);
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// ======= Middleware Configuration =======

// Static file setup
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Session handling
app.use(session({
  secret: 's-core-secret',
  resave: false,
  saveUninitialized: false
}));

// EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ======= MongoDB Connection =======
mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ======= Create Uploads Directory =======
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`'uploads' directory created at: ${UPLOADS_DIR}`);
}

// ======= File Upload Configuration =======
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type.'), false);
  }
});

// ======= Schemas and Models =======
const userSchema = new mongoose.Schema({
  fName: String,
  mName: String,
  lName: String,
  email: String,
  username: String,
  password: String,
  phoneNumber: String,
  agreedToTerms: Boolean,
  userType: { type: String, enum: ['student', 'nonstudent'], required: true },
  studentId: String,
  studentOrganization: [{ type: String }],
  cys: String,
  affiliation: String,
  profilePicture: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const requestApprovalSchema = new mongoose.Schema({
  title: String,
  organization: String,
  description: String,
  datetime: { type: Date, default: Date.now },
  deadline: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  assignedUnits: { type: String, default: 'Not yet assigned' },
  file: String
}, { timestamps: true });
const RequestApproval = mongoose.model('RequestApproval', requestApprovalSchema);

const serviceRequestSchema = new mongoose.Schema({
  title: String,
  organization: String,
  description: String,
  datetime: { type: Date, default: Date.now },
  deadline: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  file: String
}, { timestamps: true });
const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

// New Conversation Schema
const conversationSchema = new mongoose.Schema({
  serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
}, { timestamps: true });
const Conversation = mongoose.model('Conversation', conversationSchema);

// Helper function to add working days (excludes weekends)
function addWorkingDays(date, days) {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

// ======= Helper Middleware =======
function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/');
  }

  User.findById(req.session.userId)
    .then(user => {
      if (!user || user.role !== 'admin') {
        return res.status(403).render('error', { message: 'Access denied. Admins only.' });
      }
      req.user = user;
      next();
    })
    .catch(err => {
      console.error('Admin auth error:', err);
      res.status(500).render('error', { message: 'Server error' });
    });
}

function requireLogin(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/');
  }
  next();
}

// ======= Routes =======

// Public Routes
app.get('/', (req, res) => res.render('homepage'));
app.get('/register', (req, res) => res.render('register', { error: null }));
app.get('/login', (req, res) => {
  res.render('index', { error: null });
});

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      email, username, password,
      phoneNumber, studentId,cys,
      affiliation, terms, userType
    } = req.body;

     const studentOrganization = Array.isArray(req.body.studentOrganization)
    ? req.body.studentOrganization
    : req.body.studentOrganization
    ? [req.body.studentOrganization]
    : [];
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('register', { error: 'Email is already registered.', formData: req.body });
    }

    // Example: Add other validation errors here
    if (!firstName || !lastName || !username || !password || !phoneNumber || !userType) {
      return res.status(400).render('register', { error: 'Please fill in all required fields.', formData: req.body });
    }
    
    if (userType === 'student' && (!studentId || !studentOrganization?.length || !cys)){
      return res.status(400).render('register', { error: 'Please fill in all student fields.', formData: req.body });
    }
    if (userType === 'student' && !/^\d{9}$/.test(studentId)) {
      return res.status(400).render('register', { error: 'Student ID must be exactly 9 digits.', formData: req.body });
    }
    // Add more validation as needed...

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      fName: firstName,
      mName: middleName,
      lName: lastName,
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      agreedToTerms: terms === 'on',
      userType
    };

    if (userType === 'student') {
      userData.studentId = studentId;
      userData.studentOrganization = studentOrganization;
      userData.cys = cys;
    } else if (userType === 'nonstudent') {
      userData.affiliation = affiliation;
    }

    const newUser = new User(userData);
    await newUser.save();
    res.redirect('/login'); 

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('register', { error: 'Internal server error', formData: req.body });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('index', { error: 'Invalid credentials.' });
    }

    req.session.userId = user._id;

    return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('error', { message: 'Login failed.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/');
  });
});

// User Routes
app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    // Request Approvals
    const totalApprovals = await RequestApproval.countDocuments({ userId: user._id });
    const approvedApprovals = await RequestApproval.countDocuments({ userId: user._id, status: { $regex: /^approved$/i } });
    const pendingApprovals = await RequestApproval.countDocuments({ userId: user._id, status: { $regex: /^pending$/i } });
    const revisionApprovals = await RequestApproval.countDocuments({ userId: user._id, status: { $regex: /^revision$/i } });

    // Service Requests
    const totalServices = await ServiceRequest.countDocuments({ userId: user._id });
    const approvedServices = await ServiceRequest.countDocuments({ userId: user._id, status: { $regex: /^approved$/i } });
    const pendingServices = await ServiceRequest.countDocuments({ userId: user._id, status: { $regex: /^pending$/i } });
    const revisionServices = await ServiceRequest.countDocuments({ userId: user._id, status: { $regex: /^revision$/i } });

    // Merge stats
    const totalRequests = totalApprovals + totalServices;
    const approvedRequests = approvedApprovals + approvedServices;
    const pendingRequests = pendingApprovals + pendingServices;
    const inReviewRequests = revisionApprovals + revisionServices;

    // Merge activity
    const approvalActivity = await RequestApproval.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(3).lean();
    const serviceActivity = await ServiceRequest.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(3).lean();
    const recentActivity = [...approvalActivity, ...serviceActivity]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3);

    res.render('userpage', {
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

app.get('/request-approvals', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    let approvals = await RequestApproval.find({ userId: user._id }).lean();

    // Status priority for approvals
    const statusPriority = {
      "pending": 1,
      "for revision": 2,
      "approved": 3,
      "rejected": 4,
      "archived": 5
    };

    // Sort according to rules
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

    const allRequests = approvals.map(r => ({ 
      ...r, 
      type: "Request Approval" 
    }));

    const submitted = req.query.submitted === 'true';
    res.render('Requestapproval', { approvals, user, allRequests });
  } catch (err) {
    console.error('Error loading approvals:', err);
    res.status(500).send('Error loading page');
  }
});

app.get('/service-requests', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    let serviceRequests = await ServiceRequest.find({ userId: user._id }).lean();

    // Status priority for services
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

      // Sort by status group priority
      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Tie-breakers for each group
      if (aStatus === "pending") {
        // Oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (aStatus === "approved" || aStatus === "for revision") {
        // Deadline first by deadline, if no deadline then oldest first by createdAt
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;

        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;

        // No deadlines → oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (["completed", "rejected", "archived"].includes(aStatus)) {
        // Newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    const allRequests = serviceRequests.map(r => ({
      ...r,
      type: "Service Request"
    }));

    res.render('ServiceRequest', { user, serviceRequests, allRequests });

  } catch (err) {
    console.error('Error loading service requests:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
});

app.get('/all-requests', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');

  try {
    const user = await User.findById(req.session.userId);
    const approvals = await RequestApproval.find({ userId: user._id }).lean();
    const services = await ServiceRequest.find({ userId: user._id }).lean();

    const allRequests = [
      ...approvals.map(r => ({ ...r, type: "Request Approval" })),
      ...services.map(r => ({ ...r, type: "Service Request" }))
    ];

    // Combined priority: pending first, then by type-specific priority
    const getStatusPriority = (request) => {
      const status = request.status.toLowerCase();
      const type = request.type;
      
      // Global pending priority
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

    allRequests.sort((a, b) => {
      const aPriority = getStatusPriority(a);
      const bPriority = getStatusPriority(b);
      
      if (aPriority !== bPriority) return aPriority - bPriority;

      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      // Apply type-specific tie-breaking rules
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

    res.render('allRequestsUser', { user, approvals, serviceRequests: services, allRequests });
  } catch (err) {
    console.error('Error loading all requests:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
});

app.get('/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    res.render('profile', { user });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).render('error', { message: 'Failed to load profile page.' });
  }
});

app.get('/admin/profile', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    res.render('profileadmin', { user });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).render('error', { message: 'Failed to load profile page.' });
  }
});

// Admin Route
app.get('/admin', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    const approvals = await RequestApproval.find().populate('userId').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId').lean();

    const pendingApprovals = approvals.filter(a => a.status?.toLowerCase() === 'pending');
    const pendingServices = serviceRequests.filter(s => s.status?.toLowerCase() === 'pending');

    const stats = {
      totalUsers: users.length,
      totalApprovals: approvals.length,
      totalServices: serviceRequests.length,
      pendingApprovals: pendingApprovals.length,
      pendingServices: pendingServices.length
    };

    res.render('adminpage', {
      user: req.user,
      name: `${req.user.fName}`,
      users,
      approvals,
      serviceRequests,
      stats
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', { message: 'Failed to load admin page.' });
  }
});

app.get('/admin/approvals', requireAdmin, async (req, res) => {
  try {
    let approvals = await RequestApproval.find()
      .populate('userId')
      .lean();

    // Add displayOrganization logic
    approvals = approvals.map(approval => ({
      ...approval,
      displayOrganization:
        approval.userId?.userType === 'nonstudent'
          ? approval.userId.affiliation
          : approval.organization
    }));

    // Status priority for approvals (matching frontend)
    const statusPriority = {
      "pending": 1,
      "for revision": 2,
      "approved": 3,
      "rejected": 4,
      "archived": 5
    };

    // Sort according to your specified rules
    approvals.sort((a, b) => {
      const aStatus = a.status?.toLowerCase() || '';
      const bStatus = b.status?.toLowerCase() || '';

      // Group by status priority first
      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Apply tie-break rules within each status group
      if (aStatus === "pending") {
        // Pending: oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      if (aStatus === "for revision") {
        // For revision: oldest first by deadline, if no deadline then by createdAt
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;
        
        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;
        
        // No deadlines → oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      
      if (["approved", "rejected", "archived"].includes(aStatus)) {
        // Approved, Rejected, Archived: newest first by createdAt
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    res.render('approvals', { approvals, user: req.user });
  } catch (err) {
    console.error('Error loading admin approvals:', err);
    res.status(500).send('Error loading approvals page');
  }
});

app.get('/admin/services', requireAdmin, async (req, res) => {
  try {
    let serviceRequests = await ServiceRequest.find().populate('userId').lean();

    // Status priority mapping for services
    const statusPriority = {
      "pending": 1,
      "approved": 2,
      "for revision": 3,
      "completed": 4,
      "rejected": 5,
      "archived": 6
    };

    // Sorting logic for services
    serviceRequests.sort((a, b) => {
      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      // Status group priority
      const aPriority = statusPriority[aStatus] ?? 999;
      const bPriority = statusPriority[bStatus] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Tie-breakers for each status group
      if (aStatus === "pending") {
        // Pending: oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (aStatus === "approved" || aStatus === "for revision") {
        // Approved/For Revision: deadline first by deadline, if no deadline then oldest first by createdAt
        const aDeadline = a.deadline ? new Date(a.deadline) : null;
        const bDeadline = b.deadline ? new Date(b.deadline) : null;

        if (aDeadline && bDeadline) return aDeadline - bDeadline;
        if (aDeadline && !bDeadline) return -1;
        if (!aDeadline && bDeadline) return 1;

        // No deadlines → oldest first by createdAt
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (["completed", "rejected", "archived"].includes(aStatus)) {
        // Completed, Rejected, Archived: newest first by createdAt
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return 0;
    });

    // Add displayOrganization logic
    const serviceRequestsWithDisplay = serviceRequests.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? service.userId.affiliation
        : service.organization
    }));

    res.render('services', { serviceRequests: serviceRequestsWithDisplay, user: req.user });
  } catch (err) {
    console.error('Error loading admin services:', err);
    res.status(500).send('Error loading services page');
  }
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find().lean();
  
  const usersWithDisplay = users.map(user => ({
    ...user,
    displayOrganization: user.userType === 'nonstudent' ? user.affiliation : user.studentOrganization
  }));
  
  res.render('users', { users: usersWithDisplay, user: req.user });
});

app.post('/admin/approval/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits } = req.body;

  try {
    const update = {
      status: status || 'Pending',
      assignedUnits: assignedUnits || 'Not yet assigned'
    };

    await RequestApproval.findByIdAndUpdate(requestId, update);

    res.redirect('/admin/approvals');
  } catch (err) {
    console.error('Error updating approval status:', err);
    res.status(500).render('error', { message: 'Failed to update approval request.' });
  }
});

app.post('/admin/service/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits } = req.body;

  try {
    const updateData = { status: status || 'Pending' };
    
    // Only include assignedUnits if it's provided
    if (assignedUnits !== undefined && assignedUnits !== '') {
      updateData.assignedUnits = assignedUnits;
    }

    await ServiceRequest.findByIdAndUpdate(requestId, updateData);
    res.redirect('/admin/services');
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).render('error', { message: 'Failed to update service request.' });
  }
});

// New route to update service request deadline
app.post('/admin/service/update-deadline', requireAdmin, async (req, res) => {
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

app.post('/admin/user/update', requireAdmin, async (req, res) => {
  const {
    userId, fName, lName, email,
    phoneNumber, cys, studentOrganization, role
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).render('error', { message: 'User not found.' });
    }

    const updateData = {
      fName, lName, email, phoneNumber, role
    };

    if (user.userType === 'student') {
      updateData.cys = cys;
      updateData.studentOrganization = studentOrganization;
    } else {
      updateData.affiliation = studentOrganization;
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).render('error', { message: 'Failed to update user.' });
  }
});

app.get('/admin/all-requests', requireAdmin, async (req, res) => {
  try {
    const approvals = await RequestApproval.find().populate('userId').lean();
    const serviceRequests = await ServiceRequest.find().populate('userId').lean();

    // Combine with displayOrganization logic
    const allRequests = [
      ...approvals.map(r => ({
        ...r,
        type: "Request Approval",
        displayOrganization: r.userId?.userType === 'nonstudent' ? r.userId.affiliation : r.organization
      })),
      ...serviceRequests.map(r => ({
        ...r,
        type: "Service Request",
        displayOrganization: r.userId?.userType === 'nonstudent' ? r.userId.affiliation : r.organization
      }))
    ];

    // Combined priority: pending first, then by type-specific priority
    const getStatusPriority = (request) => {
      const status = request.status.toLowerCase();
      const type = request.type;
      
      // Global pending priority
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

    // Sort logic
    allRequests.sort((a, b) => {
      const aPriority = getStatusPriority(a);
      const bPriority = getStatusPriority(b);
      
      if (aPriority !== bPriority) return aPriority - bPriority;

      const aStatus = a.status.toLowerCase();
      const bStatus = b.status.toLowerCase();

      // Apply type-specific tie-breaking rules
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

    res.render('allrequestsadmin', {
      allRequests,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading all requests:', err);
    res.status(500).render('error', { message: 'Failed to load all requests page.' });
  }
});

// Conversation Routes
app.get('/api/conversation/:serviceRequestId', requireLogin, async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const user = await User.findById(req.session.userId);
    
    // Check if user has access to this conversation
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    // Only allow admin or the user who created the request
    if (user.role !== 'admin' && serviceRequest.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let conversation = await Conversation.findOne({ serviceRequestId }).populate('messages.senderId', 'fName lName role');
    
    if (!conversation) {
      conversation = new Conversation({
        serviceRequestId,
        messages: []
      });
      await conversation.save();
    }
    
    res.json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.post('/api/conversation/:serviceRequestId/message', requireLogin, async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.session.userId);
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Check if user has access
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }
    
    if (user.role !== 'admin' && serviceRequest.userId.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let conversation = await Conversation.findOne({ serviceRequestId });
    
    if (!conversation) {
      conversation = new Conversation({
        serviceRequestId,
        messages: []
      });
    }
    
    const newMessage = {
      senderId: req.session.userId,
      senderRole: user.role,
      content: content.trim(),
      timestamp: new Date(),
      isRead: false
    };
    
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
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/conversation/:serviceRequestId/mark-read', requireLogin, async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const user = await User.findById(req.session.userId);
    
    const conversation = await Conversation.findOne({ serviceRequestId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Mark messages as read (not sent by current user)
    conversation.messages.forEach(message => {
      if (message.senderId.toString() !== req.session.userId) {
        message.isRead = true;
      }
    });
    
    await conversation.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/*****Profile Actions*****/
// user update profile details
app.post('/profile/update-popup', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, studentId, affiliation } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    const updateData = { fName, mName, lName, email, username, phoneNumber };
    
    if (user.userType === 'student') {
        updateData.studentOrganization = studentOrganization;
        updateData.cys = cys;
      } else {
        updateData.affiliation = affiliation;  // <-- use affiliation, not studentOrganization here
      }

    
    await User.findByIdAndUpdate(req.session.userId, updateData);
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Popup profile update error:', err);
    res.status(500).send('Update failed');
  }
});

//change password
app.post('/profile/change-password-popup', async (req, res) => {
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
//update profile picture
app.post('/profile/upload-picture', upload.single('profilePicture'), async (req, res) => {
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

//delete profile picture
app.post('/profile/delete-picture', async (req, res) => {
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

//admin profile actions

app.post('/admin/profile/update-popup', requireAdmin, async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  
  const { userId, fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, affiliation } = req.body;

  // For security: optionally verify admin or self
  if (!userId) return res.status(400).send('Missing user ID');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const updateData = { fName, mName, lName, email, username, phoneNumber };

    if (user.userType === 'student') {
      // studentOrganization from front end may be array or comma string
      if (typeof studentOrganization === 'string') {
        updateData.studentOrganization = studentOrganization.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(studentOrganization)) {
        updateData.studentOrganization = studentOrganization;
      } else {
        updateData.studentOrganization = [];
      }
      updateData.cys = cys;
    } else {
      updateData.affiliation = affiliation;
    }

    await User.findByIdAndUpdate(userId, updateData);
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Popup profile update error:', err);
    res.status(500).send('Update failed');
  }
});


app.post('/admin/profile/change-password-popup', async (req, res) => {
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

// ===== Admin profile picture upload =====
app.post('/profileadmin/upload-picture', requireAdmin, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    // Remove old picture file (if any) and update DB in one go
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.status(404).send('User not found.');

    if (user.profilePicture) {
      const oldPath = path.join(UPLOADS_DIR, user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Could not delete old file', e); }
      }
    }

    // Update only profilePicture field and skip running validators on other fields
    await User.findByIdAndUpdate(req.session.userId,
      { $set: { profilePicture: req.file.filename } },
      { runValidators: false }
    );

    res.status(200).send('Profile picture updated.');
  } catch (err) {
    console.error('Error uploading picture:', err);
    res.status(500).send('Error uploading picture');
  }
});

// ===== Admin profile picture delete =====
app.post('/profileadmin/delete-picture', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.status(404).send('User not found.');

    if (user.profilePicture) {
      const oldPath = path.join(UPLOADS_DIR, user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn('Could not delete file', e); }
      }

      // Remove reference (skip validation)
      await User.findByIdAndUpdate(req.session.userId, { $unset: { profilePicture: "" } }, { runValidators: false });
    }

    res.status(200).send('Profile picture deleted.');
  } catch (err) {
    console.error('Error deleting picture:', err);
    res.status(500).send('Error deleting picture');
  }
});

// File Upload Handlers
app.post('/submit-request-approval', upload.single('upload'), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { projectTitle, organization, description } = req.body;
  const filePath = req.file?.filename || null;
  try {
    const user = await User.findById(req.session.userId);
    const actualOrganization = user.userType === 'nonstudent' ? user.affiliation : organization;
    
    // Calculate deadline (3 working days from now)
    const deadline = addWorkingDays(new Date(), 3);
    
    const newRequest = new RequestApproval({
      title: projectTitle,
      organization: actualOrganization,
      description,
      deadline: deadline,
      userId: req.session.userId,
      file: filePath
    });
    await newRequest.save();
    res.redirect('/request-approvals');
  } catch (err) {
    console.error('Error saving request approval:', err);
    res.status(500).send('Failed to save approval request');
  }
});

app.post('/submit-service-request', upload.single('uploadServiceFile'), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { projectTitle, organization, description, deadline } = req.body;
  const filePath = req.file?.filename || null;
  try {
    const user = await User.findById(req.session.userId);
    const actualOrganization = user.userType === 'nonstudent' ? user.affiliation : organization;
    
    const newRequest = new ServiceRequest({
      title: projectTitle,
      organization: actualOrganization,
      description,
      deadline,
      userId: req.session.userId,
      file: filePath
    });
    await newRequest.save();
    res.redirect('/service-requests');
  } catch (err) {
    console.error('Error saving service request:', err);
    res.status(500).send('Failed to save service request');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

