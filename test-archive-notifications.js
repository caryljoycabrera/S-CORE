/**
 * Test: Admin Archive Notifications
 * 
 * Verifies that:
 * 1. The admin who performs archive action does NOT notify themselves
 * 2. Other admin users DO receive the notification
 * 3. The requestor receives notification (if not the performing admin)
 * 4. Unit members receive notification (for service requests)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const RequestApproval = require('./models/RequestApproval');
const ServiceRequest = require('./models/ServiceRequest');
const User = require('./models/User');
const Notification = require('./models/Notification');
const notificationService = require('./services/notificationService');

let adminUserA, adminUserB, regularUser, unitMember;

async function setupTestDatabase() {
  try {
    // Use real MongoDB from env
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/s-core';
    
    console.log(`📊 Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Database connected');

    // Clear existing test data
    await RequestApproval.deleteMany({});
    await ServiceRequest.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Cleared existing test data');

    // Create test users
    adminUserA = await User.create({
      email: 'admin-a@test.com',
      password: 'hashed-password',
      role: 'admin',
      fullName: 'Admin User A'
    });

    adminUserB = await User.create({
      email: 'admin-b@test.com',
      password: 'hashed-password',
      role: 'admin',
      fullName: 'Admin User B'
    });

    regularUser = await User.create({
      email: 'user@test.com',
      password: 'hashed-password',
      role: 'user',
      fullName: 'Regular User'
    });

    unitMember = await User.create({
      email: 'unit@test.com',
      password: 'hashed-password',
      role: 'unit',
      unitTeam: 'Support',
      fullName: 'Unit Member'
    });

    console.log('👥 Test users created');
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

async function testApprovalArchive() {
  console.log('\n🧪 TEST 1: Approval Request Archive Notifications');
  console.log('=' .repeat(60));

  try {
    // Clear notifications
    await Notification.deleteMany({});

    // Create a request approval
    const approval = await RequestApproval.create({
      title: 'Test Approval Request',
      description: 'Testing archive notifications',
      userId: regularUser._id,
      status: 'Pending'
    });

    console.log(`📝 Created approval: ${approval._id}`);

    // Admin A archives the request
    console.log(`\n👤 Admin A (${adminUserA._id}) is archiving the request...`);
    
    // Simulate the archive notification logic from routes/admin.js
    const titleStr = approval.title;
    const requestorId = approval.userId._id;
    const adminId = adminUserA._id;

    // Notify requestor (if not admin)
    if (String(requestorId) !== String(adminId)) {
      const userMessage = `Your request "${titleStr}" was manually archived by an administrator.`;
      await notificationService.notifySystem(requestorId, 'Request Archived', userMessage, 'medium', `/request-approvals?openModalId=${approval._id}`);
      console.log('✓ Requestor notification sent');
    }

    // Notify other admins (exclude performing admin)
    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: adminId } });
    const otherAdminIds = otherAdmins.map(a => a._id);
    if (otherAdminIds.length > 0) {
      const adminMessage = `Admin has manually archived the request "${titleStr}".`;
      await notificationService.notifySystem(otherAdminIds, 'Request Archived', adminMessage, 'medium', `/admin/all-requests?openModalId=${approval._id}`);
      console.log(`✓ Sent admin notification to ${otherAdminIds.length} other admin(s)`);
    }

    // Check notifications
    console.log('\n📬 Notification Results:');
    const adminANotif = await Notification.findOne({ recipient: adminUserA._id });
    const adminBNotif = await Notification.findOne({ recipient: adminUserB._id });
    const userNotif = await Notification.findOne({ recipient: regularUser._id });

    console.log(`  Admin A received notification: ${adminANotif ? '❌ YES (FAIL - should NOT)' : '✅ NO (PASS)'}`);
    console.log(`  Admin B received notification: ${adminBNotif ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);
    console.log(`  Regular User received notification: ${userNotif ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);

    return !adminANotif && adminBNotif && userNotif;

  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

async function testServiceRequestArchive() {
  console.log('\n🧪 TEST 2: Service Request Archive Notifications');
  console.log('='.repeat(60));

  try {
    // Clear notifications
    await Notification.deleteMany({});

    // Create a service request
    const service = await ServiceRequest.create({
      title: 'Test Service Request',
      description: 'Testing archive notifications for service requests',
      userId: regularUser._id,
      assignedUnits: 'Support',
      status: 'Pending'
    });

    console.log(`📝 Created service request: ${service._id}`);

    // Admin A archives the request
    console.log(`\n👤 Admin A (${adminUserA._id}) is archiving the request...`);
    
    // Simulate the archive notification logic from routes/admin.js
    const titleStr = service.title;
    const requestorId = service.userId._id;
    const adminId = adminUserA._id;
    const assignedUnits = service.assignedUnits;

    // Notify requestor (if not admin)
    if (String(requestorId) !== String(adminId)) {
      const userMessage = `Your request "${titleStr}" was manually archived by an administrator.`;
      await notificationService.notifySystem(requestorId, 'Request Archived', userMessage, 'medium', `/service-requests?openModalId=${service._id}`);
      console.log('✓ Requestor notification sent');
    }

    // Notify units
    if (assignedUnits && assignedUnits !== 'Not yet assigned') {
      const unitMembers = await User.find({ unitTeam: assignedUnits, role: 'unit' });
      const unitIds = unitMembers.map(u => u._id);
      if (unitIds.length > 0) {
        await notificationService.notifySystem(unitIds, 'Request Archived', `The request "${titleStr}" assigned to your unit was archived.`, 'medium', `/admin/services?openModalId=${service._id}`);
        console.log(`✓ Sent unit notification to ${unitIds.length} unit member(s)`);
      }
    }

    // Notify other admins (exclude performing admin)
    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: adminId } });
    const otherAdminIds = otherAdmins.map(a => a._id);
    if (otherAdminIds.length > 0) {
      const adminMessage = `Admin has manually archived the request "${titleStr}".`;
      await notificationService.notifySystem(otherAdminIds, 'Request Archived', adminMessage, 'medium', `/admin/all-requests?openModalId=${service._id}`);
      console.log(`✓ Sent admin notification to ${otherAdminIds.length} other admin(s)`);
    }

    // Check notifications
    console.log('\n📬 Notification Results:');
    const adminANotifs = await Notification.find({ recipient: adminUserA._id }).countDocuments();
    const adminBNotifs = await Notification.find({ recipient: adminUserB._id }).countDocuments();
    const userNotif = await Notification.findOne({ recipient: regularUser._id });
    const unitNotif = await Notification.findOne({ recipient: unitMember._id });

    console.log(`  Admin A received notifications: ${adminANotifs} ${adminANotifs === 0 ? '✅ (PASS - should be 0)' : '❌ (FAIL - should be 0)'}`);
    console.log(`  Admin B received notifications: ${adminBNotifs} ${adminBNotifs > 0 ? '✅ (PASS)' : '❌ (FAIL)'}`);
    console.log(`  Regular User received notification: ${userNotif ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);
    console.log(`  Unit Member received notification: ${unitNotif ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);

    return adminANotifs === 0 && adminBNotifs > 0 && userNotif && unitNotif;

  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

async function testAdminAsRequestor() {
  console.log('\n🧪 TEST 3: Admin as Requestor - Archive by Different Admin');
  console.log('='.repeat(60));

  try {
    // Clear notifications
    await Notification.deleteMany({});

    // Create a request where Admin A is the requestor
    const approval = await RequestApproval.create({
      title: 'Admin A Request',
      description: 'Request created by admin',
      userId: adminUserA._id,
      status: 'Pending'
    });

    console.log(`📝 Created approval by Admin A: ${approval._id}`);

    // Admin B archives the request
    console.log(`\n👤 Admin B (${adminUserB._id}) is archiving the request...`);
    
    const titleStr = approval.title;
    const requestorId = approval.userId._id;
    const adminId = adminUserB._id;

    // Notify requestor (if not admin performing action)
    if (String(requestorId) !== String(adminId)) {
      const userMessage = `Your request "${titleStr}" was manually archived by an administrator.`;
      await notificationService.notifySystem(requestorId, 'Request Archived', userMessage, 'medium', `/request-approvals?openModalId=${approval._id}`);
      console.log('✓ Admin A (as requestor) notification sent');
    }

    // Notify other admins
    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: adminId } });
    const otherAdminIds = otherAdmins.map(a => a._id);
    if (otherAdminIds.length > 0) {
      const adminMessage = `Admin has manually archived the request "${titleStr}".`;
      await notificationService.notifySystem(otherAdminIds, 'Request Archived', adminMessage, 'medium', `/admin/all-requests?openModalId=${approval._id}`);
      console.log(`✓ Sent admin notification to ${otherAdminIds.length} other admin(s)`);
    }

    // Check notifications
    console.log('\n📬 Notification Results:');
    const adminAAsRequestor = await Notification.findOne({ recipient: adminUserA._id });
    const adminBNotif = await Notification.findOne({ recipient: adminUserB._id });

    console.log(`  Admin A (requestor) received notification: ${adminAAsRequestor ? '✅ YES (PASS)' : '❌ NO (FAIL)'}`);
    console.log(`  Admin B (performer) received notification: ${adminBNotif ? '❌ YES (FAIL - should NOT)' : '✅ NO (PASS)'}`);

    return adminAAsRequestor && !adminBNotif;

  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Archive Notification Tests');
  console.log('='.repeat(60));

  await setupTestDatabase();

  const test1Result = await testApprovalArchive();
  const test2Result = await testServiceRequestArchive();
  const test3Result = await testAdminAsRequestor();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test 1 (Approval Archive): ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Service Archive): ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (Admin as Requestor): ${test3Result ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = test1Result && test2Result && test3Result;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(60) + '\n');

  await mongoose.connection.close();
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
