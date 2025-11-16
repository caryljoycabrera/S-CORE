const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceRequest = require('./models/ServiceRequest');

// Use the Atlas connection string
const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri).then(async () => {
  console.log('🔌 Connected to MongoDB Atlas\n');
  console.log('🔍 Finding Pending requests with assigned units...\n');
  
  // Find all Pending requests that have units assigned
  const pendingWithUnits = await ServiceRequest.find({
    status: 'Pending',
    $and: [
      { assignedUnits: { $exists: true, $ne: null, $ne: '' } },
      { assignedUnits: { $ne: 'Not yet assigned' } },
      { assignedUnits: { $regex: /Unit|Graphics|Multimedia|Social Media|Public Relations/i } }
    ]
  }).populate('userId', 'fName lName');
  
  console.log(`Found ${pendingWithUnits.length} Pending requests to update:\n`);
  
  pendingWithUnits.forEach((r, idx) => {
    console.log(`${idx + 1}. "${r.title}"`);
    console.log(`   Current Status: ${r.status}`);
    console.log(`   Assigned Unit: ${r.assignedUnits}`);
    console.log(`   User: ${r.userId ? r.userId.fName + ' ' + r.userId.lName : 'Unknown'}`);
    console.log('');
  });
  
  if (pendingWithUnits.length > 0) {
    console.log('🔄 Updating status to Queued...\n');
    
    const result = await ServiceRequest.updateMany(
      {
        status: 'Pending',
        $and: [
          { assignedUnits: { $exists: true, $ne: null, $ne: '' } },
          { assignedUnits: { $ne: 'Not yet assigned' } },
          { assignedUnits: { $regex: /Unit|Graphics|Multimedia|Social Media|Public Relations/i } }
        ]
      },
      {
        $set: { status: 'Queued' }
      }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} requests to Queued status!\n`);
    
    // Verify the changes
    const updatedRequests = await ServiceRequest.find({
      _id: { $in: pendingWithUnits.map(r => r._id) }
    }).select('title status assignedUnits');
    
    console.log('📊 Verification - Updated Requests:');
    updatedRequests.forEach((r, idx) => {
      console.log(`   ${idx + 1}. "${r.title}" → Status: ${r.status} | Unit: ${r.assignedUnits}`);
    });
  } else {
    console.log('✅ No Pending requests with assigned units found - all up to date!');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
