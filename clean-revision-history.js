const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('Connected to database');
    
    // Find the specific problematic requests
    const requestIds = ['6919721ce27a7e92777473e5', '691979699905c54f9cacfdf0'];
    
    for (const id of requestIds) {
      const req = await ServiceRequest.findById(id);
      
      if (req) {
        console.log(`\nChecking request: ${id}`);
        console.log(`Title: ${req.title}`);
        console.log(`Current revisionHistory type:`, typeof req.revisionHistory);
        console.log(`Is array:`, Array.isArray(req.revisionHistory));
        console.log(`Length:`, req.revisionHistory?.length);
        console.log(`Content:`, JSON.stringify(req.revisionHistory, null, 2));
        
        // Clean up if needed
        if (!Array.isArray(req.revisionHistory)) {
          console.log('⚠️ revisionHistory is not an array - fixing...');
          req.revisionHistory = [];
          await req.save();
          console.log('✅ Fixed');
        } else if (req.revisionHistory.length > 0) {
          // Check if any entry is malformed
          let needsFix = false;
          const cleaned = req.revisionHistory.filter(entry => {
            if (typeof entry === 'string') {
              console.log('⚠️ Found string entry in revisionHistory');
              needsFix = true;
              return false;
            }
            return true;
          });
          
          if (needsFix) {
            req.revisionHistory = cleaned;
            await req.save();
            console.log('✅ Cleaned malformed entries');
          }
        }
      }
    }
    
    console.log('\n✅ Cleanup complete');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });
