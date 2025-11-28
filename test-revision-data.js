const mongoose = require('mongoose');
require('dotenv').config();

async function testRevisionHistory() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/s-core';
    console.log('Connecting to:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log

    await mongoose.connect(mongoUri);

    const ServiceRequest = require('./models/ServiceRequest');
    const Conversation = require('./models/Conversation');
    const User = require('./models/User');

    // Find all service requests
    const serviceRequests = await ServiceRequest.find({}).limit(5);

    console.log('Found', serviceRequests.length, 'service requests total');

    for (const req of serviceRequests) {
      console.log('\n=== Service Request:', req._id, '===');
      console.log('Title:', req.title);
      console.log('Status:', req.status);
      console.log('Revision history length:', req.revisionHistory ? req.revisionHistory.length : 0);

      const conversation = await Conversation.findOne({ serviceRequestId: req._id });
      console.log('Conversation messages:', conversation ? conversation.messages.length : 0);

      if (req.revisionHistory && req.revisionHistory.length > 0) {
        console.log('Revision types:', req.revisionHistory.map(r => r.revisionType || r.type));
        req.revisionHistory.forEach((rev, idx) => {
          console.log(`  Revision ${idx}:`, {
            type: rev.revisionType || rev.type,
            requestedBy: rev.requestedBy,
            respondedBy: rev.respondedBy,
            requestedAt: rev.requestedAt,
            respondedAt: rev.respondedAt
          });
        });
      }

      if (conversation && conversation.messages.length > 0) {
        console.log('Message details:');
        conversation.messages.forEach((msg, idx) => {
          console.log(`  Message ${idx}:`, {
            senderRole: msg.senderRole,
            content: msg.content ? msg.content.substring(0, 50) + '...' : 'No content',
            timestamp: msg.timestamp
          });
        });
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

testRevisionHistory();