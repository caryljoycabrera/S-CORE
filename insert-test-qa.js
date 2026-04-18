const mongoose = require('mongoose');
const ChatbotQA = require('./models/ChatbotQA.js');

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

async function insertTestData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('[DB] Connected');

    // Clear existing data
    await ChatbotQA.deleteMany({});
    console.log('[DB] Cleared existing Q&A');

    // Insert test data for each role
    const testData = [
      // Public Q&A
      { role: 'public', category: 'General', question: 'What is S-CORE?', answer: 'S-CORE is the Strategic Communications Office Request Engine - an integrated system for managing communication requests, service approvals, and administrative workflows.', isActive: true },
      { role: 'public', category: 'General', question: 'How do I submit a request?', answer: 'To submit a request, log in to your account, navigate to Services, and fill out the request form with the required details. Submit and track your request status in real-time.', isActive: true },
      
      // User Q&A
      { role: 'user', category: 'Request Process', question: 'How long does it take to process a request?', answer: 'Request processing time varies by request type, typically between 2-5 business days. You can check the status of your request in the dashboard at any time.', isActive: true },
      { role: 'user', category: 'Account', question: 'How do I reset my password?', answer: 'Click the Forgot Password link on the login page, enter your email, and follow the instructions sent to your inbox to create a new password.', isActive: true },
      
      // Unit Q&A  
      { role: 'unit', category: 'Technical', question: 'What are unit communication requests?', answer: 'Unit communication requests allow your department to request communication support including content creation, social media management, and event coverage.', isActive: true },
      { role: 'unit', category: 'Request Process', question: 'How do we manage team members in unit requests?', answer: 'Navigate to Unit Settings, then Team Members. Add members by their email and assign roles (Approver, Contributor, Viewer).', isActive: true },
      
      // Admin Q&A
      { role: 'admin', category: 'Technical', question: 'How do I manage system settings?', answer: 'Admin users can access System Settings from the Configuration tab. Here you can manage user roles, email templates, and system parameters.', isActive: true },
      { role: 'admin', category: 'General', question: 'How do I view analytics and reports?', answer: 'The Analytics dashboard provides real-time insights into request volume, processing times, user activity, and more. Access via Admin > Analytics.', isActive: true }
    ];

    const inserted = await ChatbotQA.insertMany(testData);
    console.log('[DB] Inserted', inserted.length, 'Q&A records');

    // Show counts by role
    const stats = await ChatbotQA.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    console.log('[DB] Q&A by role:', stats);

    await mongoose.disconnect();
    console.log('[DB] Disconnected');
  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(1);
  }
}

insertTestData();
