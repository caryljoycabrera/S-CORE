/**
 * Migration Script: Update Pending Service Requests with Assigned Units to Queued
 * 
 * This script updates all service requests that:
 * - Have status = "Pending"
 * - Have assignedUnits set (not "Not yet assigned")
 * 
 * These should be changed to status = "Queued" so they appear in unit inboxes.
 */

const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
const RequestApproval = require('./models/RequestApproval');

const DB_URI = 'mongodb://localhost:27017/sCore';

async function migratePendingToQueued() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to database');

    // Update Service Requests
    console.log('\n📋 Checking Service Requests...');
    const serviceResult = await ServiceRequest.updateMany(
      {
        status: 'Pending',
        assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' }
      },
      {
        $set: { status: 'Queued' }
      }
    );

    console.log(`✅ Updated ${serviceResult.modifiedCount} service requests from Pending to Queued`);

    // Update Request Approvals
    console.log('\n📋 Checking Request Approvals...');
    const approvalResult = await RequestApproval.updateMany(
      {
        status: 'Pending',
        assignedUnits: { $exists: true, $ne: 'Not yet assigned', $ne: null, $ne: '' }
      },
      {
        $set: { status: 'Queued' }
      }
    );

    console.log(`✅ Updated ${approvalResult.modifiedCount} approval requests from Pending to Queued`);

    // Show summary of updated requests
    console.log('\n📊 Summary:');
    console.log(`   Service Requests: ${serviceResult.modifiedCount} updated`);
    console.log(`   Approval Requests: ${approvalResult.modifiedCount} updated`);
    console.log(`   Total: ${serviceResult.modifiedCount + approvalResult.modifiedCount} requests now Queued`);

    // Show sample of updated service requests
    if (serviceResult.modifiedCount > 0) {
      console.log('\n🔍 Sample of updated Service Requests:');
      const updatedServices = await ServiceRequest.find({ status: 'Queued' })
        .limit(5)
        .select('title assignedUnits status');
      
      updatedServices.forEach((req, index) => {
        console.log(`   ${index + 1}. "${req.title}" → ${req.assignedUnits} (Status: ${req.status})`);
      });
    }

    // Show sample of updated approval requests
    if (approvalResult.modifiedCount > 0) {
      console.log('\n🔍 Sample of updated Approval Requests:');
      const updatedApprovals = await RequestApproval.find({ status: 'Queued' })
        .limit(5)
        .select('title assignedUnits status');
      
      updatedApprovals.forEach((req, index) => {
        console.log(`   ${index + 1}. "${req.title}" → ${req.assignedUnits} (Status: ${req.status})`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the migration
migratePendingToQueued()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
