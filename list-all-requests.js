const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

mongoose.connect('mongodb://localhost:27017/sCore').then(async () => {
  console.log('🔍 All Service Requests:\n');
  
  const requests = await ServiceRequest.find({})
    .populate('userId', 'fName lName')
    .select('title status assignedUnits specificRequestType createdAt')
    .sort({ createdAt: -1 });
  
  requests.forEach((r, idx) => {
    console.log(`${idx + 1}. "${r.title}"`);
    console.log(`   ID: ${r._id}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Unit: ${r.assignedUnits || 'None'}`);
    console.log(`   Type: ${r.specificRequestType || 'N/A'}`);
    console.log(`   User: ${r.userId ? r.userId.fName + ' ' + r.userId.lName : 'Unknown'}`);
    console.log(`   Created: ${r.createdAt}`);
    console.log('');
  });
  
  console.log(`Total: ${requests.length} requests\n`);
  
  // Show breakdown by status
  const statusCounts = {};
  requests.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  
  console.log('Status Breakdown:');
  Object.keys(statusCounts).sort().forEach(status => {
    console.log(`  ${status}: ${statusCounts[status]}`);
  });
  
  process.exit(0);
});
