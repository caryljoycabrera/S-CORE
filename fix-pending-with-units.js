const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const RequestApproval = require('./models/RequestApproval');

mongoose.connect('mongodb://localhost:27017/sCore').then(async () => {
  console.log('🔍 Finding all Pending requests with assigned units...\n');
  
  // Find ALL service requests with Pending status that have units assigned
  const pendingServices = await ServiceRequest.find({
    status: 'Pending',
    $or: [
      { assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' } },
      { assignedUnits: { $regex: /Unit/i } } // Match any string containing "Unit"
    ]
  }).populate('userId', 'fName lName');
  
  console.log(`Found ${pendingServices.length} Pending service requests with assigned units:`);
  pendingServices.forEach((r, idx) => {
    console.log(`  ${idx + 1}. "${r.title}"`);
    console.log(`     Status: ${r.status}`);
    console.log(`     Unit: ${r.assignedUnits}`);
    console.log(`     User: ${r.userId ? r.userId.fName + ' ' + r.userId.lName : 'Unknown'}`);
    console.log('');
  });
  
  if (pendingServices.length > 0) {
    console.log('🔄 Updating these requests to Queued status...\n');
    
    const result = await ServiceRequest.updateMany(
      {
        status: 'Pending',
        $or: [
          { assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' } },
          { assignedUnits: { $regex: /Unit/i } }
        ]
      },
      {
        $set: { status: 'Queued' }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} service requests to Queued status`);
  } else {
    console.log('✅ No Pending service requests found with assigned units');
  }
  
  // Also check approval requests
  const pendingApprovals = await RequestApproval.find({
    status: 'Pending',
    $or: [
      { assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' } },
      { assignedUnits: { $regex: /Unit/i } }
    ]
  }).populate('userId', 'fName lName');
  
  if (pendingApprovals.length > 0) {
    console.log(`\nFound ${pendingApprovals.length} Pending approval requests with assigned units`);
    const approvalResult = await RequestApproval.updateMany(
      {
        status: 'Pending',
        $or: [
          { assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' } },
          { assignedUnits: { $regex: /Unit/i } }
        ]
      },
      {
        $set: { status: 'Queued' }
      }
    );
    console.log(`✅ Updated ${approvalResult.modifiedCount} approval requests to Queued status`);
  }
  
  process.exit(0);
});
