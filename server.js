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
app.use(express.json({ limit: '10mb' })); // Add this line
app.use(bodyParser.json()); // Add this line too for redundancy

// Session handling
app.use(session({
  secret: 's-core-secret',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  if (req.path === '/api/deadlines') {
    console.log('Deadlines API called by:', req.session.userId);
  }
  next();
});
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
  limits: { 
    fileSize: 10 * 1024 * 1024, // Increased to 10MB per file
    files: 20 // Allow up to 20 files
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
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
  affiliation: [{ type: String }], // <- CHANGED TO ARRAY
  profilePicture: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const requestApprovalSchema = new mongoose.Schema({
  title: String,
  organization: String,
  description: String,
  specificRequestType: String, // ADD THIS LINE
  datetime: { type: Date, default: Date.now },
  deadline: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  assignedUnits: { type: String, default: 'Not yet assigned' },
  file: String, // Keep for backward compatibility
  files: [String] // New field for multiple files
}, { timestamps: true });


const RequestApproval = mongoose.model('RequestApproval', requestApprovalSchema);

const serviceRequestSchema = new mongoose.Schema({
  title: String,
  organization: String,
  description: String,
  specificRequestType: String,
  datetime: { type: Date, default: Date.now },
  deadline: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Pending' },
  assignedUnits: { type: String, default: 'Not yet assigned' },
  file: String, // Keep for backward compatibility
  files: [String] // New field for multiple files
}, { timestamps: true });


const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

// New Conversation Schema
// Updated Conversation Schema with FIXED validation
const conversationSchema = new mongoose.Schema({
  serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
  approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestApproval' },
  requestType: { type: String, enum: ['service', 'approval'], required: true },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// FIXED validation - the issue was here
conversationSchema.pre('validate', function() {
  const hasServiceRequest = !!this.serviceRequestId;
  const hasApprovalRequest = !!this.approvalRequestId;
  
  if (!hasServiceRequest && !hasApprovalRequest) {
    this.invalidate('requestType', 'Either serviceRequestId or approvalRequestId must be provided');
  }
  
  if (hasServiceRequest && hasApprovalRequest) {
    this.invalidate('requestType', 'Cannot have both serviceRequestId and approvalRequestId');
  }
  
  // FIXED: Validate requestType matches the request ID provided
  if (hasServiceRequest && this.requestType !== 'service') {
    this.invalidate('requestType', 'requestType must be "service" when serviceRequestId is provided');
  }
  
  if (hasApprovalRequest && this.requestType !== 'approval') {
    this.invalidate('requestType', 'requestType must be "approval" when approvalRequestId is provided');
  }
});

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
      phoneNumber, studentId, cys,
      terms, userType
    } = req.body;

    // Handle both student organizations and office affiliations as arrays
    const studentOrganization = Array.isArray(req.body.studentOrganization)
      ? req.body.studentOrganization
      : req.body.studentOrganization
      ? [req.body.studentOrganization]
      : [];

    const affiliation = Array.isArray(req.body.affiliation)
      ? req.body.affiliation
      : req.body.affiliation
      ? [req.body.affiliation]
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
    if (userType === 'nonstudent' && (!affiliation?.length)){
      return res.status(400).render('register', { error: 'Please select at least one office/department.', formData: req.body });
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
// User-specific deadlines API - shows ALL user requests (with and without deadlines)
app.get('/api/user-deadlines', requireLogin, async (req, res) => {
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
        // Use deadline if available, otherwise use createdAt
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
        // Use deadline if available, otherwise use createdAt
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
// User request details for specific date  
// User request details for specific date
app.get('/api/user-deadlines/:date/details', requireLogin, async (req, res) => {
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
    
    // Fetch approval requests for current user (deadline OR createdAt matches the date)
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
    
    // Fetch service requests for current user (deadline OR createdAt matches the date)
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

    // Map requests to use the specific organization
    const allRequests = approvals.map(r => ({ 
      ...r, 
      type: "Request Approval",
      // Use the specific organization stored in the request
      organization: r.organization || 'N/A'
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
    let serviceRequests = await ServiceRequest.find({ userId: user._id })
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file createdAt updatedAt')
      .lean();

    console.log('📋 Sample service request with organization:', serviceRequests[0]); // Debug log

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

    // FIXED: Ensure organization is preserved from database
    const allRequests = serviceRequests.map(r => ({
      ...r,
      type: "Service Request",
      // CRITICAL: Use the exact organization stored in the request document
      organization: r.organization || 'N/A',
      // Ensure specificRequestType is included
      specificRequestType: r.specificRequestType || 'Not specified'
    }));

    console.log('📋 Mapped request with organization:', allRequests[0]); // Debug log

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
      ...approvals.map(r => ({ 
        ...r, 
        type: "Request Approval",
        // Use the specific organization stored in the request
        organization: r.organization || 'N/A'
      })),
      ...services.map(r => ({ 
        ...r, 
        type: "Service Request",
        // Use the specific organization stored in the request
        organization: r.organization || 'N/A'
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

// Replace the existing /api/deadlines route with this improved version
app.get('/api/deadlines', requireLogin, async (req, res) => {
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
// Add this route AFTER your other routes (around line 800)
app.get('/debug/service-requests', requireLogin, async (req, res) => {
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
// Debug route to check deadlines in database
app.get('/debug/deadlines', requireLogin, async (req, res) => {
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
// display deadline in calendar
app.get('/api/deadlines/:date/details', requireLogin, async (req, res) => {
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
        ? approval.userId.affiliation 
        : approval.organization || 'N/A'
    }));
    
    const processedServices = services.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent' 
        ? service.userId.affiliation 
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
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file createdAt updatedAt')
      .lean();
    
    // Add console log to debug
    console.log('📋 Sample approval with specificRequestType:', approvals[0]);
    
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
        // EXPLICITLY include specificRequestType
        specificRequestType: approval.specificRequestType || 'Not specified'
      };
    });

    console.log('📋 Mapped approval with specificRequestType:', approvals[0]);

    res.render('approvals', { approvals: approvals, user: req.user });
  } catch (err) {
    console.error('Error fetching approvals:', err);
    res.status(500).render('error', { message: 'Server error' });
  }
});

app.get('/admin/services', requireAdmin, async (req, res) => {
  try {
    let serviceRequests = await ServiceRequest.find()
      .populate('userId')
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file createdAt updatedAt') // ADDED specificRequestType
      .lean();

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

    // Add displayOrganization logic and ensure datetime exists
    const serviceRequestsWithDisplay = serviceRequests.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? service.userId.affiliation
        : service.organization,
      datetime: service.datetime || service.createdAt,
      specificRequestType: service.specificRequestType || 'Not specified' // ADD THIS LINE
    }));

    console.log('📋 Sample service with specificRequestType:', serviceRequestsWithDisplay[0]); // ADD DEBUG LOG

    res.render('services', { serviceRequests: serviceRequestsWithDisplay, user: req.user });
  } catch (err) {
    console.error('Error loading admin services:', err);
    res.status(500).send('Error loading services page');
  }
});
// Add these routes after your existing admin routes

// Route to handle direct access to specific approval request with modal
app.get('/admin/approvals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
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

    res.render('approvals', { approvals, user: req.user, openModalId: id });
  } catch (err) {
    console.error('Error loading admin approvals:', err);
    res.status(500).send('Error loading approvals page');
  }
});

// Route to handle direct access to specific service request with modal
app.get('/admin/services/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let serviceRequests = await ServiceRequest.find()
      .populate('userId')
      .select('title organization description specificRequestType datetime deadline userId status assignedUnits files file createdAt updatedAt') // ADDED specificRequestType
      .lean();

    // Status priority mapping for services
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

    // Add displayOrganization logic and ensure datetime exists
    const serviceRequestsWithDisplay = serviceRequests.map(service => ({
      ...service,
      displayOrganization: service.userId?.userType === 'nonstudent'
        ? service.userId.affiliation
        : service.organization,
      datetime: service.datetime || service.createdAt,
      specificRequestType: service.specificRequestType || 'Not specified' // ADD THIS LINE
    }));

    res.render('services', { serviceRequests: serviceRequestsWithDisplay, user: req.user, openModalId: id });
  } catch (err) {
    console.error('Error loading admin services:', err);
    res.status(500).send('Error loading services page');
  }
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find().lean();
  
  const usersWithDisplay = users.map(user => ({
    ...user,
    displayOrganization: user.userType === 'nonstudent' 
  ? (Array.isArray(user.affiliation) ? user.affiliation.join(', ') : user.affiliation)
  : (Array.isArray(user.studentOrganization) ? user.studentOrganization.join(', ') : user.studentOrganization)
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

    // Return JSON response instead of redirect
    res.json({ success: true, message: 'Approval request updated successfully' });
  } catch (err) {
    console.error('Error updating approval status:', err);
    res.status(500).json({ success: false, message: 'Failed to update approval request.' });
  }
});


app.post('/admin/service/update-status', requireAdmin, async (req, res) => {
  const { requestId, status, assignedUnits } = req.body;

  try {
    console.log('Updating service request:', { requestId, status, assignedUnits });
    
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'Request ID is required' });
    }

    const update = {};
    if (status) update.status = status;
    if (assignedUnits !== undefined) update.assignedUnits = assignedUnits || 'Not yet assigned';

    const result = await ServiceRequest.findByIdAndUpdate(requestId, update, { new: true });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log('Service request updated successfully:', result);
    res.json({ success: true, message: 'Service request updated successfully' });
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).json({ success: false, message: 'Failed to update service request: ' + err.message });
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
  try {
    console.log('Raw request body:', req.body); // Debug log
    console.log('Request headers:', req.headers); // Debug log
    
    // Handle case where req.body might be undefined
    if (!req.body) {
      console.log('Request body is undefined');
      return res.status(400).json({ 
        success: false, 
        message: 'No data received. Please try again.' 
      });
    }

    const { userId, role } = req.body;

    // Validate required fields
    if (!userId || !role) {
      console.log('Missing required fields:', { userId, role });
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and role are required.' 
      });
    }

    // Validate role value
    if (!['user', 'admin'].includes(role)) {
      console.log('Invalid role value:', role);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be either "user" or "admin".' 
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    console.log(`Updating user ${user.fName} ${user.lName} (${userId}) role from "${user.role}" to "${role}"`);

    // Update only the role field
    const result = await User.findByIdAndUpdate(
      userId, 
      { role: role },
      { new: true, runValidators: false }
    );

    if (!result) {
      console.log('Failed to update user role');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update user role.' 
      });
    }

    console.log('User role updated successfully:', {
      userId: result._id,
      name: `${result.fName} ${result.lName}`,
      newRole: result.role
    });

    // Return success response
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

app.get('/admin/all-requests', requireAdmin, async (req, res) => {
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
        options: { strictPopulate: false } // Don't fail if user is missing
      })
      .lean();

    console.log('Fetched approvals:', approvals.length);
    console.log('Fetched services:', serviceRequests.length);

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
          console.warn(`Approval request ${r._id} has missing or invalid user data`);
        }

        return {
          ...r,
          type: "Request Approval",
          displayOrganization,
          userName, // Add explicit userName field
          // Ensure datetime exists
          datetime: r.datetime || r.createdAt
        };
      }),
      ...serviceRequests.map(r => {
        // Ensure user data exists
        let userName = 'System User';
        let displayOrganization = r.organization || 'N/A';
        
        if (r.userId && r.userId.fName) {
          userName = `${r.userId.fName} ${r.userId.lName || ''}`.trim();
          displayOrganization = r.userId.userType === 'nonstudent' 
            ? (Array.isArray(r.userId.affiliation) ? r.userId.affiliation.join(', ') : r.userId.affiliation || r.organization)
            : r.organization || 'N/A';
        } else {
          console.warn(`Service request ${r._id} has missing or invalid user data`);
        }

        return {
          ...r,
          type: "Service Request",
          displayOrganization,
          userName, // Add explicit userName field
          // Ensure datetime exists
          datetime: r.datetime || r.createdAt
        };
      })
    ];

    // Sort logic (your existing sorting logic)
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

    console.log('Final processed requests:', allRequests.length);
    
    res.render('allrequestsadmin', {
      allRequests,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading all requests:', err);
    res.status(500).render('error', { message: 'Failed to load all requests page.' });
  }
});
// Add this route for debugging and cleanup
app.get('/admin/debug/orphaned-requests', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Checking for orphaned requests...');
    
    // Find all requests
    const approvals = await RequestApproval.find().lean();
    const services = await ServiceRequest.find().lean();
    
    // Check which ones have invalid userIds
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

// Route to fix orphaned requests by assigning them to a default admin user
app.post('/admin/fix/orphaned-requests', requireAdmin, async (req, res) => {
  try {
    const defaultAdminId = req.user._id; // Use current admin as fallback
    
    // Fix orphaned approvals
    const orphanedApprovals = await RequestApproval.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    
    // Fix orphaned services
    const orphanedServices = await ServiceRequest.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    
    // Update orphaned requests
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
app.get('/api/conversation/:requestId', requireLogin, async (req, res) => {
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
app.post('/api/conversation/:requestId/message', requireLogin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const user = await User.findById(req.session.userId);
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
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
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});


app.post('/api/conversation/:requestId/mark-read', requireLogin, async (req, res) => {
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

app.get('/admin/cleanup-conversations', requireAdmin, async (req, res) => {
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
// User-specific deadlines API endpoint
app.get('/api/user-deadlines', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user._id;
    const deadlinesData = {};

    // Get user's approval requests
    const approvals = await Approval.find({ userId }).lean();
    
    // Get user's service requests
    const services = await ServiceRequest.find({ userId }).lean();

    // Process approval requests
    approvals.forEach(item => {
      const dateStr = new Date(item.deadline || item.createdAt).toISOString().split('T')[0];
      if (!deadlinesData[dateStr]) {
        deadlinesData[dateStr] = { approvals: 0, services: 0 };
      }
      deadlinesData[dateStr].approvals++;
    });

    // Process service requests
    services.forEach(item => {
      const dateStr = new Date(item.deadline || item.createdAt).toISOString().split('T')[0];
      if (!deadlinesData[dateStr]) {
        deadlinesData[dateStr] = { approvals: 0, services: 0 };
      }
      deadlinesData[dateStr].services++;
    });

    res.json(deadlinesData);
  } catch (error) {
    console.error('Error fetching user deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

// User-specific deadline details API endpoint
app.get('/api/user-deadlines/:date/details', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user._id;
    const date = req.params.date;
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');

    // Get user's approval requests for this date
    const approvals = await Approval.find({
      userId,
      $or: [
        { deadline: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ]
    }).populate('userId', 'fName lName').lean();

    // Get user's service requests for this date
    const services = await ServiceRequest.find({
      userId,
      $or: [
        { deadline: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ]
    }).populate('userId', 'fName lName').lean();

    // Add dateType field to distinguish between deadline and submission dates
    const processedApprovals = approvals.map(item => ({
      ...item,
      dateType: (item.deadline && item.deadline >= startDate && item.deadline <= endDate) ? 'deadline' : 'submitted'
    }));

    const processedServices = services.map(item => ({
      ...item,
      dateType: (item.deadline && item.deadline >= startDate && item.deadline <= endDate) ? 'deadline' : 'submitted'
    }));

    const result = {
      approvals: processedApprovals,
      services: processedServices,
      totalCount: processedApprovals.length + processedServices.length
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching user deadline details:', error);
    res.status(500).json({ error: 'Failed to fetch deadline details' });
  }
});
/*****Profile Actions*****/
// user update profile details
app.post('/profile/update-popup', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  
  console.log('Profile update request body:', req.body); // Debug log
  
  const { fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, studentId, affiliation } = req.body;
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).send('User not found');
    
    console.log('User type:', user.userType); // Debug log
    
    const updateData = { fName, mName, lName, email, username, phoneNumber };
    
    if (user.userType === 'student') {
      console.log('Updating student data');
      // Handle studentOrganization as array
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
      
      // Handle affiliation as array
      if (typeof affiliation === 'string') {
        updateData.affiliation = affiliation.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(affiliation)) {
        updateData.affiliation = affiliation;
      } else {
        updateData.affiliation = [];
      }
      
      console.log('Final affiliation update:', updateData.affiliation);
    }

    console.log('Final update data:', updateData); // Debug log

    await User.findByIdAndUpdate(req.session.userId, updateData);
    
    console.log('Profile updated successfully');
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Update failed: ' + err.message);
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
  
  console.log('Admin profile update request body:', req.body); // Debug log
  
  const { userId, fName, mName, lName, email, username, phoneNumber, studentOrganization, cys, affiliation } = req.body;

  // For security: optionally verify admin or self
  if (!userId) return res.status(400).send('Missing user ID');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    console.log('User type:', user.userType); // Debug log

    const updateData = { fName, mName, lName, email, username, phoneNumber };

    if (user.userType === 'student') {
      console.log('Updating admin student data');
      // studentOrganization from front end may be array or comma string
      if (typeof studentOrganization === 'string') {
        updateData.studentOrganization = studentOrganization.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(studentOrganization)) {
        updateData.studentOrganization = studentOrganization;
      } else {
        updateData.studentOrganization = [];
      }
      updateData.cys = cys;
      
      console.log('Student organization update:', updateData.studentOrganization);
    } else {
      console.log('Updating admin non-student data');
      console.log('Received affiliation:', affiliation);
      
      // Handle affiliation as array too
      if (typeof affiliation === 'string') {
        updateData.affiliation = affiliation.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(affiliation)) {
        updateData.affiliation = affiliation;
      } else {
        updateData.affiliation = [];
      }
      
      console.log('Final affiliation update:', updateData.affiliation);
    }

    console.log('Final update data:', updateData); // Debug log

    await User.findByIdAndUpdate(userId, updateData);
    
    console.log('Admin profile updated successfully');
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Admin profile update error:', err);
    res.status(500).send('Update failed: ' + err.message);
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
app.post('/submit-request-approval', upload.array('upload', 20), async (req, res) => {
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

app.post('/submit-service-request', upload.array('uploadServiceFile', 20), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  
  const { projectTitle, organization, description, deadline, specificRequestType } = req.body; // ADD specificRequestType
  
  console.log('Files received:', req.files);
  console.log('Organization received:', organization);
  console.log('Specific Request Type received:', specificRequestType); // ADD DEBUG LOG
  
  // Handle multiple files
  let filePaths = [];
  if (req.files && req.files.length > 0) {
    filePaths = req.files.map(file => file.filename);
    console.log('File paths:', filePaths);
  }
  
  try {
    const user = await User.findById(req.session.userId);
    
    // FIXED: Use the organization selected by the user from the form
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
      specificRequestType: specificRequestType, // ADD THIS LINE
      userId: req.session.userId,
      files: filePaths,
      file: filePaths[0] || null
    });
    
    await newRequest.save();
    console.log('Service request saved with organization:', actualOrganization);
    console.log('Service request saved with specific type:', specificRequestType); // ADD DEBUG LOG
    console.log('Service request saved with files:', filePaths);
    res.redirect('/service-requests');
  } catch (err) {
    console.error('Error saving service request:', err);
    res.status(500).send('Failed to save service request: ' + err.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

