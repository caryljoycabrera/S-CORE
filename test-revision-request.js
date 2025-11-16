const mongoose = require('mongoose');

// Clear any cached models
if (mongoose.models.ServiceRequest) {
  delete mongoose.models.ServiceRequest;
}

const ServiceRequest = require('./models/ServiceRequest');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ Connected to database\n');
    
    // Get a test request
    const testId = '6919721ce27a7e92777473e5';
    const userId = '68958a9110c0edfd87dda473';
    
    const request = await ServiceRequest.findById(testId);
    
    if (!request) {
      console.log('❌ Test request not found');
      mongoose.disconnect();
      return;
    }
    
    console.log('📋 TEST REQUEST INFO:');
    console.log(`   ID: ${request._id}`);
    console.log(`   Title: ${request.title}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Current revision count: ${request.revisionCount}`);
    console.log(`   Revision history length: ${request.revisionHistory?.length || 0}`);
    console.log(`   Revision history is array: ${Array.isArray(request.revisionHistory)}`);
    
    // Simulate what the route will do
    console.log('\n🧪 SIMULATING REVISION REQUEST...\n');
    
    try {
      // Ensure revisionHistory is initialized as an array
      if (!Array.isArray(request.revisionHistory)) {
        console.log('⚠️ Initializing revisionHistory as array');
        request.revisionHistory = [];
      }

      // Increment revision count
      request.revisionCount += 1;
      request.status = 'For Revision';
      
      // Create the revision entry with proper types
      const revisionEntry = {
        requestedBy: new mongoose.Types.ObjectId(userId),
        requestedAt: new Date(),
        revisionNotes: '<p>Test revision request</p>',
        revisionFiles: [],
        status: 'for_revision',
        revisionType: 'revision_requested'
      };
      
      console.log('📝 Revision entry to be added:');
      console.log(JSON.stringify(revisionEntry, null, 2));
      
      // Add to revision history
      request.revisionHistory.push(revisionEntry);
      
      console.log('\n💾 Attempting to save...');
      
      // Save the request
      await request.save();
      
      console.log('✅ SUCCESS! Request saved successfully');
      console.log(`   New revision count: ${request.revisionCount}`);
      console.log(`   New status: ${request.status}`);
      console.log(`   Revision history length: ${request.revisionHistory.length}`);
      
      // Verify the save
      const verifyRequest = await ServiceRequest.findById(testId);
      console.log('\n🔍 VERIFICATION:');
      console.log(`   Revision count in DB: ${verifyRequest.revisionCount}`);
      console.log(`   Status in DB: ${verifyRequest.status}`);
      console.log(`   Revision history in DB:`, JSON.stringify(verifyRequest.revisionHistory, null, 2));
      
      // Rollback for testing
      console.log('\n↩️ Rolling back test changes...');
      verifyRequest.revisionCount -= 1;
      verifyRequest.status = 'For Checking';
      verifyRequest.revisionHistory.pop();
      await verifyRequest.save();
      console.log('✅ Rollback complete - database restored to original state');
      
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      console.error('Full error:', error);
    }
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('❌ Connection error:', error);
    mongoose.disconnect();
  });
