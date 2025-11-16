const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

mongoose.connect('mongodb://localhost:27017/sCore').then(async () => {
  console.log('ALL Service Requests in database:');
  const requests = await ServiceRequest.find({}).select('title status assignedUnits specificRequestType userId').populate('userId', 'fName lName');
  
  requests.forEach((r, idx) => {
    console.log(`\n${idx + 1}. "${r.title}"`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Unit: ${r.assignedUnits}`);
    console.log(`   Type: ${r.specificRequestType}`);
    console.log(`   User: ${r.userId ? r.userId.fName + ' ' + r.userId.lName : 'Unknown'}`);
  });
  
  console.log(`\nTotal: ${requests.length} service requests`);
  
  const pending = requests.filter(r => r.status === 'Pending');
  console.log(`Pending: ${pending.length}`);
  
  process.exit(0);
});
