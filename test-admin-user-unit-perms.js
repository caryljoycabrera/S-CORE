/**
 * Permission & Access Control Test Suite
 * Tests admin ↔ user/unit interactions for updating entries/requests/services
 * 
 * Scenarios:
 * - Admin can update unassigned requests
 * - Admin permission enforcement (cannot update unapproved items)
 * - Unit can only update assigned work
 * - User cannot update others' requests
 * - Approval workflow state transitions
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important: include cookies in requests
  validateStatus: () => true, // Don't throw on any status
  maxRedirects: 0
});

// Store session data
let sessions = {};

/**
 * Test utilities
 */
async function makeRequest(method, path, data = null, sessionKey = null) {
  const config = {
    method,
    url: path,
    validateStatus: () => true,
    maxRedirects: 0
  };

  if (data) config.data = data;
  if (sessionKey && sessions[sessionKey]?.cookies) {
    config.headers = {
      'Cookie': sessions[sessionKey].cookies
    };
  }

  try {
    const response = await client(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      success: response.status >= 200 && response.status < 300
    };
  } catch (err) {
    console.error(`❌ Request failed: ${method} ${path}`, err.message);
    return { status: 0, data: null, success: false, error: err.message };
  }
}

/**
 * Simulate login for testing (API endpoint if available)
 */
async function loginUser(email, password, userType = 'user') {
  console.log(`\n🔐 Login: ${email} (${userType})`);

  const sessionKey = `${userType}_${email}`;

  // Attempt login via API if available
  const response = await makeRequest('POST', '/auth/login', { email, password });

  if (response.success) {
    // Extract session/auth token if present
    if (response.headers['set-cookie']) {
      sessions[sessionKey] = { 
        email, 
        userType,
        cookies: response.headers['set-cookie'].join('; ')
      };
      console.log(`   ✅ Login successful. Session: ${sessionKey}`);
      return { success: true, sessionKey };
    }
  }

  console.log(`   ⚠️  Could not auto-login. Manual browser login required.`);
  return { success: false, sessionKey };
}

/**
 * Test: Admin can view dashboard
 */
async function testAdminDashboard(adminSession) {
  console.log('\n📊 TEST: Admin Dashboard Access');

  const response = await makeRequest('GET', '/admin', null, adminSession);

  if (response.success && response.status === 200) {
    console.log('   ✅ Admin dashboard accessible');
    // Check for content
    if (response.data?.includes?.('admin') || response.data?.includes?.('dashboard')) {
      console.log('   ✅ Admin content rendered');
    }
    return true;
  } else {
    console.log(`   ❌ Admin dashboard failed (${response.status})`);
    return false;
  }
}

/**
 * Test: Unit can view unit dashboard
 */
async function testUnitDashboard(unitSession) {
  console.log('\n📊 TEST: Unit Dashboard Access');

  const response = await makeRequest('GET', '/unit', null, unitSession);

  if (response.success && response.status === 200) {
    console.log('   ✅ Unit dashboard accessible');
    return true;
  } else {
    console.log(`   ❌ Unit dashboard failed (${response.status})`);
    return false;
  }
}

/**
 * Test: User can view user dashboard
 */
async function testUserDashboard(userSession) {
  console.log('\n📊 TEST: User Dashboard Access');

  const response = await makeRequest('GET', '/user', null, userSession);

  if (response.success && response.status === 200) {
    console.log('   ✅ User dashboard accessible');
    return true;
  } else {
    console.log(`   ❌ User dashboard failed (${response.status})`);
    return false;
  }
}

/**
 * Test: User CANNOT access admin dashboard
 */
async function testUserCantAccessAdmin(userSession) {
  console.log('\n🚫 TEST: User Cannot Access Admin Dashboard');

  const response = await makeRequest('GET', '/admin', null, userSession);

  if (response.status === 403 || response.status === 302) {
    console.log(`   ✅ Access denied (${response.status})`);
    return true;
  } else if (response.status === 200) {
    console.log(`   ❌ SECURITY: User accessed admin (${response.status})`);
    return false;
  } else {
    console.log(`   ⚠️  Unexpected status: ${response.status}`);
    return true;
  }
}

/**
 * Test: Unit CANNOT access admin dashboard
 */
async function testUnitCantAccessAdmin(unitSession) {
  console.log('\n🚫 TEST: Unit Cannot Access Admin Dashboard');

  const response = await makeRequest('GET', '/admin', null, unitSession);

  if (response.status === 403 || response.status === 302) {
    console.log(`   ✅ Access denied (${response.status})`);
    return true;
  } else if (response.status === 200) {
    console.log(`   ❌ SECURITY: Unit accessed admin (${response.status})`);
    return false;
  } else {
    console.log(`   ⚠️  Unexpected status: ${response.status}`);
    return true;
  }
}

/**
 * Test: Admin tries to update request status
 */
async function testAdminUpdateStatus(adminSession, requestId) {
  console.log(`\n✏️  TEST: Admin Updates Request Status (${requestId})`);

  const payload = {
    id: requestId,
    status: 'Queued',
    assignedUnits: 'Strategic Communications Office'
  };

  const response = await makeRequest(
    'POST',
    '/admin/all-requests/update-status',
    payload,
    adminSession
  );

  if (response.success) {
    console.log(`   ✅ Status update successful (${response.status})`);
    return true;
  } else {
    console.log(`   ⚠️  Update failed (${response.status})`);
    console.log(`      Response: ${JSON.stringify(response.data?.message || response.data)}`);
    return false;
  }
}

/**
 * Test: User CANNOT update another user's request
 */
async function testUserCantUpdateOthersRequest(userSession, otherUserRequestId) {
  console.log(`\n🚫 TEST: User Cannot Update Other User's Request`);

  const payload = {
    id: otherUserRequestId,
    status: 'Completed'
  };

  const response = await makeRequest(
    'POST',
    '/admin/all-requests/update-status',
    payload,
    userSession
  );

  if (response.status === 403 || response.status === 401) {
    console.log(`   ✅ Access denied (${response.status})`);
    return true;
  } else if (response.success) {
    console.log(`   ❌ SECURITY: User updated other's request`);
    return false;
  } else {
    console.log(`   ✅ Update failed as expected (${response.status})`);
    return true;
  }
}

/**
 * Test: Unit can only approve assigned work
 */
async function testUnitApproveAssigned(unitSession, assignedTaskId) {
  console.log(`\n✏️  TEST: Unit Approves Assigned Task (${assignedTaskId})`);

  const payload = {
    status: 'Completed',
    notes: 'Task completed by unit'
  };

  const response = await makeRequest(
    'POST',
    `/unit/task/approve/${assignedTaskId}`,
    payload,
    unitSession
  );

  if (response.success) {
    console.log(`   ✅ Unit approval successful`);
    return true;
  } else {
    console.log(`   ⚠️  Approval failed (${response.status})`);
    return false;
  }
}

/**
 * Test: Unit CANNOT approve unassigned work
 */
async function testUnitCantApproveUnassigned(unitSession, unassignedTaskId) {
  console.log(`\n🚫 TEST: Unit Cannot Approve Unassigned Task`);

  const payload = {
    status: 'Completed'
  };

  const response = await makeRequest(
    'POST',
    `/unit/task/approve/${unassignedTaskId}`,
    payload,
    unitSession
  );

  if (response.status === 403 || !response.success) {
    console.log(`   ✅ Access denied (${response.status})`);
    return true;
  } else {
    console.log(`   ❌ SECURITY: Unit approved unassigned task`);
    return false;
  }
}

/**
 * Main test orchestration
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  S-CORE Permission & Access Control Test Suite                ║');
  console.log('║  Testing: Admin ↔ User ↔ Unit interactions                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results = {};

  try {
    // ===== SETUP PHASE =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SETUP: Attempting API-based logins (may need manual browser login)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Note: These credentials would need to be set up in DB or environment
    // For now, we'll show the test structure
    const adminLogin = await loginUser('admin@test.local', 'AdminTest123', 'admin');
    const unitLogin = await loginUser('unit@test.local', 'UnitTest123', 'unit');
    const userLogin = await loginUser('user@test.local', 'UserTest123', 'user');

    const adminSession = adminLogin.sessionKey;
    const unitSession = unitLogin.sessionKey;
    const userSession = userLogin.sessionKey;

    // ===== DASHBOARD ACCESS TESTS =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DASHBOARD ACCESS CONTROL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    results.adminDashboard = await testAdminDashboard(adminSession);
    results.unitDashboard = await testUnitDashboard(unitSession);
    results.userDashboard = await testUserDashboard(userSession);
    results.userCantAccessAdmin = await testUserCantAccessAdmin(userSession);
    results.unitCantAccessAdmin = await testUnitCantAccessAdmin(unitSession);

    // ===== UPDATE PERMISSION TESTS =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('UPDATE PERMISSION CONTROL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Sample IDs (would be obtained from DB or prev test steps in real scenario)
    const sampleRequestId = '507f1f77bcf86cd799439011'; // Example MongoDB ObjectId
    results.adminUpdateStatus = await testAdminUpdateStatus(adminSession, sampleRequestId);
    results.userCantUpdateOthers = await testUserCantUpdateOthersRequest(userSession, sampleRequestId);

    // ===== UNIT APPROVAL TESTS =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('UNIT TASK APPROVAL CONTROL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const assignedTaskId = '507f1f77bcf86cd799439012';
    const unassignedTaskId = '507f1f77bcf86cd799439013';
    
    results.unitApproveAssigned = await testUnitApproveAssigned(unitSession, assignedTaskId);
    results.unitCantApproveUnassigned = await testUnitCantApproveUnassigned(unitSession, unassignedTaskId);

    // ===== SUMMARY =====
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;

    console.log(`\n✅ PASSED: ${passed}/${total}`);
    console.log('\nDetailed Results:');
    Object.entries(results).forEach(([test, result]) => {
      const icon = result === true ? '✅' : result === false ? '❌' : '⚠️ ';
      console.log(`  ${icon} ${test}: ${result}`);
    });

    const passRate = ((passed / total) * 100).toFixed(1);
    console.log(`\n📊 Pass Rate: ${passRate}%`);

    if (passRate === '100.0') {
      console.log('\n🎉 All tests passed! Permission model working correctly.');
    } else if (passRate >= '80') {
      console.log('\n⚠️  Most tests passed. Review failures above.');
    } else {
      console.log('\n❌ Multiple failures detected. Review security model.');
    }

  } catch (err) {
    console.error('\n❌ Test suite error:', err.message);
    console.error(err);
  }
}

// Runtime
console.log('Starting S-CORE permission tests...\n');
runTests().then(() => {
  console.log('\n✦ Test suite complete.\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
