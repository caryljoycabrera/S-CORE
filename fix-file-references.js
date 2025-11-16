const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';
const uploadsDir = path.join(__dirname, 'uploads');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('Connected to database');
    
    // Find all requests with missing files
    const allRequests = await ServiceRequest.find({});
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const req of allRequests) {
      let needsUpdate = false;
      
      // Check deliverables
      if (req.deliverables && req.deliverables.length > 0) {
        const fixedDeliverables = [];
        
        for (const filename of req.deliverables) {
          const filePath = path.join(uploadsDir, filename);
          
          if (!fs.existsSync(filePath)) {
            console.log(`\n❌ Missing file: ${filename}`);
            console.log(`   Request ID: ${req._id}`);
            console.log(`   Request Title: ${req.title}`);
            
            // Try to find a similar file
            const baseName = filename.replace(/-\d{13}-\d+/, ''); // Remove timestamp pattern
            const similarFiles = fs.readdirSync(uploadsDir).filter(f => f.includes(baseName.split('.')[0]));
            
            if (similarFiles.length > 0) {
              console.log(`   Found similar file(s): ${similarFiles.join(', ')}`);
              console.log(`   Using: ${similarFiles[0]}`);
              fixedDeliverables.push(similarFiles[0]);
              needsUpdate = true;
            } else {
              console.log(`   No replacement found - removing from database`);
              needsUpdate = true;
              errorCount++;
            }
          } else {
            fixedDeliverables.push(filename);
          }
        }
        
        if (needsUpdate) {
          req.deliverables = fixedDeliverables;
        }
      }
      
      // Check files array
      if (req.files && req.files.length > 0) {
        const fixedFiles = [];
        
        for (const filename of req.files) {
          const filePath = path.join(uploadsDir, filename);
          
          if (!fs.existsSync(filePath)) {
            console.log(`\n❌ Missing file in files array: ${filename}`);
            const baseName = filename.replace(/-\d{13}-\d+/, '');
            const similarFiles = fs.readdirSync(uploadsDir).filter(f => f.includes(baseName.split('.')[0]));
            
            if (similarFiles.length > 0) {
              console.log(`   Using: ${similarFiles[0]}`);
              fixedFiles.push(similarFiles[0]);
              needsUpdate = true;
            } else {
              needsUpdate = true;
              errorCount++;
            }
          } else {
            fixedFiles.push(filename);
          }
        }
        
        if (needsUpdate) {
          req.files = fixedFiles;
        }
      }
      
      // Save if needed
      if (needsUpdate) {
        try {
          await req.save();
          fixedCount++;
          console.log(`   ✅ Updated request ${req._id}`);
        } catch (error) {
          console.error(`   ❌ Error updating request ${req._id}:`, error.message);
        }
      }
    }
    
    console.log(`\n========== SUMMARY ==========`);
    console.log(`Fixed ${fixedCount} requests`);
    console.log(`${errorCount} files could not be recovered`);
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });
