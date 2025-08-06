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

    return res.redirect(user.role === 'admin' ? '/admin' : '/userPage');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).render('error', { message: 'Login failed.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err);
      return res.redirect('/userPage');
    }
    res.redirect('/');
  });
});

// User Routes
app.get('/userpage', requireLogin, async (req, res) => {
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

app.get('/Requestapproval', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    const approvals = await RequestApproval.find({ userId: user._id }).sort({ createdAt: -1 });
    res.render('Requestapproval', { approvals, user });
  } catch (err) {
    console.error('Error loading approvals:', err);
    res.status(500).send('Error loading page');
  }
});

app.get('/ServiceRequest', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    const serviceRequests = await ServiceRequest.find({ userId: user._id }).sort({ createdAt: -1 });
    res.render('ServiceRequest', { user, serviceRequests });
  } catch (err) {
    console.error('Error loading service requests:', err);
    res.status(500).render('error', { message: 'Error loading page' });
  }
});

app.get('/allRequestsUser', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const user = await User.findById(req.session.userId);
    const approvals = await RequestApproval.find({ userId: user._id }).sort({ createdAt: -1 });
    const serviceRequests = await ServiceRequest.find({ userId: user._id }).sort({ createdAt: -1 });
    
    const allRequests = [
      ...approvals.map(r => ({ ...r.toObject(), type: "Request Approval" })),
      ...serviceRequests.map(r => ({ ...r.toObject(), type: "Service Request" }))
    ];

    res.render('allRequestsUser', { user, approvals, serviceRequests, allRequests });
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

app.get('/profileadmin', async (req, res) => {
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
  const approvals = await RequestApproval.find().populate('userId');
  res.render('approvals', { approvals, user: req.user });
});

app.get('/admin/services', requireAdmin, async (req, res) => {
  const serviceRequests = await ServiceRequest.find().populate('userId');
  res.render('services', { serviceRequests, user: req.user });
});

app.get('/admin/users', requireAdmin, async (req, res) => {
  const users = await User.find();
  res.render('users', { users, user: req.user });
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
    await ServiceRequest.findByIdAndUpdate(requestId, { status: status || 'Pending' });
    res.redirect('/admin/services');
  } catch (err) {
    console.error('Error updating service request:', err);
    res.status(500).render('error', { message: 'Failed to update service request.' });
  }
});

app.post('/admin/user/update', requireAdmin, async (req, res) => {
  const {
    userId, fName, lName, email,
    phoneNumber, cys, studentOrganization, role
  } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      fName, lName, email, phoneNumber, cys, studentOrganization, role
    });

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

    // Combine all requests with type identifier
    const allRequests = [
      ...approvals.map(r => ({ ...r, type: "Request Approval" })),
      ...serviceRequests.map(r => ({ ...r, type: "Service Request" }))
    ];

    // Sort by creation date (newest first)
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('allrequestsadmin', { 
      allRequests, 
      user: req.user 
    });
  } catch (err) {
    console.error('Error loading all requests:', err);
    res.status(500).render('error', { message: 'Failed to load all requests page.' });
  }
});

/*****Profile Actions*****/
//update profile details
app.post('/profile/update-popup', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { fName, mName, lName, email, username, phoneNumber, studentOrganization, cys } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      fName, mName, lName, email, username, phoneNumber, studentOrganization, cys
    });
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


app.post('/profileadmin/update-popup', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { fName, mName, lName, email, username, phoneNumber, studentOrganization, cys } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      fName, mName, lName, email, username, phoneNumber, studentOrganization, cys
    });
    res.status(200).send('Profile updated');
  } catch (err) {
    console.error('Popup profile update error:', err);
    res.status(500).send('Update failed');
  }
});

app.post('/profileadmin/change-password-popup', async (req, res) => {
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

// File Upload Handlers
app.post('/submit-request-approval', upload.single('upload'), async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { projectTitle, organization, description } = req.body;
  const filePath = req.file?.filename || null;
  try {
    const newRequest = new RequestApproval({
      title: projectTitle,
      organization,
      description,
      userId: req.session.userId,
      file: filePath
    });
    await newRequest.save();
    res.redirect('/Requestapproval');
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
    const newRequest = new ServiceRequest({
      title: projectTitle,
      organization,
      description,
      deadline,
      userId: req.session.userId,
      file: filePath
    });
    await newRequest.save();
    res.redirect('/ServiceRequest');
  } catch (err) {
    console.error('Error saving service request:', err);
    res.status(500).send('Failed to save service request');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});