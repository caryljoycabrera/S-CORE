const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const RequestApproval = require('./models/RequestApproval');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
  .then(async () => {
    console.log('Connected to database');

    // Get all service requests with revision history
    const serviceRequests = await ServiceRequest.find({})
      .sort({ createdAt: -1 })
      .select('title status revisionHistory createdAt');

    const serviceWithRevisions = serviceRequests.filter(req => req.revisionHistory && req.revisionHistory.length > 0);

    console.log('\n=== SERVICE REQUESTS WITH REVISIONS ===');
    serviceWithRevisions.forEach((req, i) => {
      console.log(`${i+1}. ${req.title} (${req.status}) - Created: ${req.createdAt}`);
      console.log(`   Raw revisionHistory:`, JSON.stringify(req.revisionHistory, null, 2));
      console.log('');
    });

    // Get all approval requests with revision history
    const approvalRequests = await RequestApproval.find({})
      .sort({ createdAt: -1 })
      .select('title status revisionHistory createdAt');

    const approvalWithRevisions = approvalRequests.filter(req => req.revisionHistory && req.revisionHistory.length > 0);

    console.log('\n=== APPROVAL REQUESTS WITH REVISIONS ===');
    approvalWithRevisions.forEach((req, i) => {
      console.log(`${i+1}. ${req.title} (${req.status}) - Created: ${req.createdAt}`);
      console.log(`   Raw revisionHistory:`, JSON.stringify(req.revisionHistory, null, 2));
      console.log('');
    });

    console.log(`Total Service Requests with revisions: ${serviceWithRevisions.length}`);
    console.log(`Total Approval Requests with revisions: ${approvalWithRevisions.length}`);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });