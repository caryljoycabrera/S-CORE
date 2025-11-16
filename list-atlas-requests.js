const mongoose = require('mongoose');
const User = require('./models/User'); // Load User model first
const ServiceRequest = require('./models/ServiceRequest');

// Use the Atlas connection string
const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri).then(async () => {
  console.log('🔍 Connected to MongoDB Atlas\n');
  console.log('All Service Requests:\n');
  
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
    console.log('');
  });
  
  console.log(`Total: ${requests.length} requests\n`);
  
  const statusCounts = {};
  requests.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  
  console.log('Status Breakdown:');
  Object.keys(statusCounts).sort().forEach(status => {
    console.log(`  ${status}: ${statusCounts[status]}`);
  });
  
  // Find Pending with units
  const pendingWithUnits = requests.filter(r => 
    r.status === 'Pending' && 
    r.assignedUnits && 
    r.assignedUnits !== 'Not yet assigned'
  );
  
  if (pendingWithUnits.length > 0) {
    console.log(`\n⚠️  Found ${pendingWithUnits.length} Pending requests with assigned units that need updating:`);
    pendingWithUnits.forEach((r, idx) => {
      console.log(`   ${idx + 1}. "${r.title}" → ${r.assignedUnits}`);
    });
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
