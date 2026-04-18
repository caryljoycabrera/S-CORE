/**
 * Fix Completed Status Casing
 * 
 * This script normalizes the 'status' field in ServiceRequest and RequestApproval collections
 * to ensure 'Completed' uses proper casing (not 'COMPLETED' or other variations)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const RequestApproval = require('../models/RequestApproval');

async function fixCompletedStatusCasing() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully\n');

    // Fix ServiceRequest collection
    console.log('Checking ServiceRequest collection...');
    const serviceRequests = await ServiceRequest.find({ 
      status: { $regex: /^completed$/i } // Case-insensitive match
    });
    
    console.log(`Found ${serviceRequests.length} service requests with 'completed' status (any casing)`);
    
    let serviceUpdated = 0;
    for (const request of serviceRequests) {
      if (request.status !== 'Completed') {
        console.log(`  Fixing: ${request._id} - "${request.status}" → "Completed"`);
        request.status = 'Completed';
        await request.save();
        serviceUpdated++;
      }
    }
    console.log(`Updated ${serviceUpdated} service requests\n`);

    // Fix RequestApproval collection
    console.log('Checking RequestApproval collection...');
    const approvalRequests = await RequestApproval.find({ 
      status: { $regex: /^approved$/i } // Case-insensitive match for approved
    });
    
    console.log(`Found ${approvalRequests.length} approval requests with 'approved' status (any casing)`);
    
    let approvalUpdated = 0;
    for (const request of approvalRequests) {
      if (request.status !== 'Approved') {
        console.log(`  Fixing: ${request._id} - "${request.status}" → "Approved"`);
        request.status = 'Approved';
        await request.save();
        approvalUpdated++;
      }
    }
    console.log(`Updated ${approvalUpdated} approval requests\n`);

    // Also check for other common status mismatches
    console.log('Checking for other status casing issues...');
    const statusMap = {
      'pending': 'Pending',
      'queued': 'Queued',
      'in progress': 'In Progress',
      'for checking': 'For Checking',
      'approved': 'Approved',
      'for revision': 'For Revision',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'archived': 'Archived'
    };

    let otherUpdates = 0;
    for (const [lowercase, properCase] of Object.entries(statusMap)) {
      const incorrectServices = await ServiceRequest.find({ 
        status: { $regex: new RegExp(`^${lowercase}$`, 'i') } 
      });
      
      for (const request of incorrectServices) {
        if (request.status !== properCase) {
          console.log(`  Service ${request._id}: "${request.status}" → "${properCase}"`);
          request.status = properCase;
          await request.save();
          otherUpdates++;
        }
      }
    }
    console.log(`Fixed ${otherUpdates} other status casing issues\n`);

    console.log('✅ Status casing migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing status casing:', error);
    process.exit(1);
  }
}

// Run the migration
fixCompletedStatusCasing();
