const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

mongoose.connect('mongodb://localhost:27017/sCore').then(async () => {
  console.log('All Service Requests with assigned units:');
  const requests = await ServiceRequest.find({ 
    assignedUnits: { $ne: 'Not yet assigned' } 
  }).select('title status assignedUnits specificRequestType');
  
  requests.forEach(r => {
    console.log(`  "${r.title}"`);
    console.log(`    Status: ${r.status}`);
    console.log(`    Unit: ${r.assignedUnits}`);
    console.log(`    Type: ${r.specificRequestType}`);
    console.log('');
  });
  
  console.log(`Total: ${requests.length} requests`);
  process.exit(0);
});
