const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const fs = require('fs');
const path = require('path');

// Use the same connection string as the server
const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('Connected to database: scoremis');
    
    // Check the specific requests from the error logs
    const requestIds = ['691979699905c54f9cacfdf0', '6919721ce27a7e92777473e5'];
    
    for (const id of requestIds) {
      try {
        const req = await ServiceRequest.findById(id);
        if (req) {
          console.log(`\n========== REQUEST: ${id} ==========`);
          console.log(`Title: ${req.title}`);
          console.log(`Status: ${req.status}`);
          console.log(`Files:`, req.files || []);
          console.log(`Deliverables:`, req.deliverables || []);
          console.log(`Revision History:`, JSON.stringify(req.revisionHistory, null, 2));
          
          // Check if files exist
          const uploadsDir = path.join(__dirname, 'uploads');
          const allFiles = [
            ...(req.files || []),
            ...(req.deliverables || [])
          ];
          
          if (allFiles.length > 0) {
            console.log('\nFile existence check:');
            allFiles.forEach(filename => {
              const filePath = path.join(uploadsDir, filename);
              const exists = fs.existsSync(filePath);
              console.log(`  ${filename}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
            });
          }
          
          // Check revision history files
          if (req.revisionHistory && req.revisionHistory.length > 0) {
            console.log('\nRevision history files:');
            req.revisionHistory.forEach((rev, i) => {
              const allRevFiles = [
                ...(rev.deliverableFiles || []),
                ...(rev.revisionFiles || []),
                ...(rev.responseFiles || [])
              ];
              if (allRevFiles.length > 0) {
                console.log(`  Revision ${i + 1}:`);
                allRevFiles.forEach(filename => {
                  const filePath = path.join(uploadsDir, filename);
                  const exists = fs.existsSync(filePath);
                  console.log(`    ${filename}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
                });
              }
            });
          }
        } else {
          console.log(`\nRequest ${id} not found`);
        }
      } catch (error) {
        console.error(`Error checking request ${id}:`, error.message);
      }
    }

    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });
