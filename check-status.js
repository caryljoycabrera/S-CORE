const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

mongoose.connect('mongodb://localhost:27017/sCore').then(async () => {
  const results = await ServiceRequest.aggregate([
    { $match: { assignedUnits: { $exists: true, $ne: 'Not yet assigned' } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  console.log('Service Requests by Status (with assigned units):');
  results.forEach(r => console.log(`  ${r._id}: ${r.count}`));
  
  const totalQueued = await ServiceRequest.countDocuments({ status: 'Queued' });
  const totalInProgress = await ServiceRequest.countDocuments({ status: 'In Progress' });
  
  console.log('\nAll Service Requests Status Counts:');
  console.log(`  Queued: ${totalQueued}`);
  console.log(`  In Progress: ${totalInProgress}`);
  
  process.exit(0);
});
