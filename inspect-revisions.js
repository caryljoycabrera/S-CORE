const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const RequestApproval = require('./models/RequestApproval');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
  .then(async () => {
    console.log('Connected to database');

    // Get recent service requests
    const serviceRequests = await ServiceRequest.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status revisionHistory createdAt');

    console.log('\n=== SERVICE REQUESTS ===');
    serviceRequests.forEach((req, i) => {
      console.log(`${i+1}. ${req.title} (${req.status}) - Revisions: ${req.revisionHistory?.length || 0}`);
      if (req.revisionHistory && req.revisionHistory.length > 0) {
        req.revisionHistory.forEach((rev, j) => {
          console.log(`   ${j+1}. ${rev.revisionType || rev.type} - ${rev.requestedBy ? 'Unit' : 'User'} - ${rev.requestedAt || rev.respondedAt}`);
        });
      }
    });

    // Get recent approval requests
    const approvalRequests = await RequestApproval.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status revisionHistory createdAt');

    console.log('\n=== APPROVAL REQUESTS ===');
    approvalRequests.forEach((req, i) => {
      console.log(`${i+1}. ${req.title} (${req.status}) - Revisions: ${req.revisionHistory?.length || 0}`);
      if (req.revisionHistory && req.revisionHistory.length > 0) {
        req.revisionHistory.forEach((rev, j) => {
          console.log(`   ${j+1}. ${rev.status} - ${rev.requestedBy ? 'Unit' : 'User'} - ${rev.requestedAt || rev.respondedAt}`);
        });
      }
    });

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });