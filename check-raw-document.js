const mongoose = require('mongoose');

const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('Connected to database\n');
    
    // Query directly without using the model
    const db = mongoose.connection.db;
    const collection = db.collection('servicerequests');
    
    const testId = '6919721ce27a7e92777473e5';
    
    const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(testId) });
    
    if (doc) {
      console.log('📄 RAW DOCUMENT FROM DATABASE:');
      console.log(JSON.stringify(doc, null, 2));
      
      console.log('\n🔍 REVISION HISTORY FIELD:');
      console.log('Type:', typeof doc.revisionHistory);
      console.log('Is Array:', Array.isArray(doc.revisionHistory));
      console.log('Value:', doc.revisionHistory);
      
      // Fix if it's corrupt
      if (typeof doc.revisionHistory === 'string' || !Array.isArray(doc.revisionHistory)) {
        console.log('\n⚠️ CORRUPT DATA DETECTED - Fixing...');
        await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(testId) },
          { $set: { revisionHistory: [] } }
        );
        console.log('✅ Fixed - revisionHistory set to empty array');
      }
    } else {
      console.log('Document not found');
    }
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });
