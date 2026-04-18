# S-CORE Permission Testing Guide
## Admin ↔ User ↔ Unit Interaction Tests

**Status**: Interactive manual testing via browser tools  
**Date**: 2026-04-18  
**Scope**: Admin, Unit, User role permission boundaries for CRUD operations on requests/services

---

## Test Environment Setup

### Prerequisites
- S-CORE running on `http://localhost:8080`
- Browser with developer tools open
- Test accounts created:
  - Admin account (role: 'admin')
  - Unit account (role: 'unit')
  - User account (role: 'user')

### Account Roles & Permissions

| Role | Can View | Can Edit | Can Approve | Endpoint Access |
|------|----------|----------|-------------|-----------------|
| Admin | All | All* | Yes | /admin/* |
| Unit | Assigned | Assigned | Assigned | /unit/* |
| User | Own only | Own | No | /user/* |

*Admin cannot edit if request in "For Revision" state

---

## Test Scenarios

### Scenario 1: Admin Dashboard Access Control

**Goal**: Verify role-based dashboard access  
**Steps**:

1. Navigate to `/admin` as:
   - ✅ Admin account → Should see admin dashboard
   - ✅ Unit account → Should redirect to /unit or show error 403
   - ✅ User account → Should redirect to /user or show error 403
   - ✅ Unauthenticated → Should redirect to /login

**Expected Result**: Each role sees only their dashboard

**Permission Check**: `requireAdmin` middleware in `routes/admin.js` line ~66

---

### Scenario 2: Request Creation & Visibility

**Goal**: Verify users can only see their own requests  
**Steps**:

1. **Admin creates approval request** as User A
   - Title: "Test Approval A"
   - Status: Pending
   - Organization: "Test Org A"

2. **Check visibility**:
   - User A logs in → Should see "Test Approval A" in dashboard
   - User B logs in → Should NOT see "Test Approval A"
   - Admin logs in → Should see "Test Approval A"
   - Unit logs in → Should NOT see it (not assigned yet)

**Expected Result**: Users see only their requests; Admin sees all

**Code Reference**: `routes/user.js` - user dashboard query filters by `userId`

---

### Scenario 3: Request Assignment (Admin → Unit)

**Goal**: Verify only admins can assign units  
**Steps**:

1. Admin views pending "Test Approval A"
2. Admin clicks "Assign to Unit" and assigns to Strategic Communications Office
3. Status changes: Pending → Queued
4. Unit logs in → Should now see the request in dashboard

**Expected Result**: Only admin can assign; unit gets notification

**Endpoint**: POST `/admin/approval/update-status`  
**Middleware**: `requireAdmin` (line 1813)  
**Payload Check**:
```javascript
{
  id: "requestId",
  status: "Queued",
  assignedUnits: "Strategic Communications Office"
}
```

---

### Scenario 4: Unit Can Only Update Assigned Requests

**Goal**: Verify units cannot modify unassigned or other-unit's requests  
**Steps**:

1. Create 2 service requests:
   - Service A assigned to Unit 1
   - Service B assigned to Unit 2

2. **Unit 1 tries to**:
   - ✅ Update Service A (own) → Should succeed
   - ❌ Update Service B (other unit) → Should get 403 error

3. **Unit 1 tries unassigned request**:
   - Create Service C (Pending, not assigned)
   - Unit 1 tries to approve → Should get 403

**Expected Result**: Unit can only modify assigned requests

**Endpoint Check**: POST `/unit/task/approve/:id`  
**Middleware**: `requireUnit` checks assignment against `req.user._id`

---

### Scenario 5: User Cannot Update Other User's Requests

**Goal**: Verify users cannot modify requests created by other users  
**Steps**:

1. User A creates approval request "User A Request"
2. User B tries to:
   - ✅ View any request details → May be allowed for public requests
   - ❌ Edit "User A Request" → Should get 403 error
   - ❌ Change status of "User A Request" → Should be denied

3. Check network tab for 403 or 401 responses

**Expected Result**: User can only modify own requests

**Code Check**: Routes verify `userId` matches `req.session.userId`

---

### Scenario 6: Request State Transition Rules

**Goal**: Verify state machine enforces valid transitions  
**Steps**:

1. **Pending → Queued**
   - ✅ Admin can (requires valid assignment)
   - ❌ Unit cannot
   - ❌ User cannot

2. **Queued → In Progress**
   - ❌ Admin cannot (unit's responsibility)
   - ✅ Unit can
   - ❌ User cannot

3. **In Progress → For Checking**
   - ❌ Admin cannot jump directly
   - ✅ Unit must transition
   - ❌ User cannot

4. **For Checking → Approved**
   - ✅ Admin can approve
   - ❌ Unit cannot approve (must admin)
   - ❌ User cannot

5. **For Revision State**
   - ❌ Admin cannot mark Approved (invalid transition)
   - ✅ User must create revision/resubmit
   - Then cycle repeats

**Expected Result**: Invalid transitions rejected; proper sequence enforced

**Code Check**: `models/ServiceRequest.js` line ~48 - enum validates allowed statuses

---

### Scenario 7: Permission Edge Cases

**Goal**: Test security boundary conditions  
**Steps**:

1. **Deleted Request**:
   - Admin deletes request
   - Unit tries to access → 404 or error
   - User tries to access own deleted → 404 or soft-deleted indicator

2. **Archived Request**:
   - Request moves to Archived status
   - Admin tries to edit → Should allow or show warning
   - Unit tries to edit → Should be denied
   - User tries to edit → Should be denied

3. **Unapproved User Account**:
   - Create user with `approved: false`
   - Try to access dashboard → May show limited view
   - Try to create request → Should fail
   - Check `emailVerified` requirement

4. **Session Hijacking Test**:
   - In developer console, modify `connect.sid` cookie
   - Refresh → Should log out or show error
   - Verify session validation on each request

**Expected Result**: All edge cases properly handled

---

## API Endpoint Permissions Matrix

### Admin Endpoints

| Endpoint | Method | Purpose | Requires |
|----------|--------|---------|----------|
| `/admin` | GET | Dashboard | requireAdmin |
| `/admin/all-requests/update-status` | POST | Update request status | requireAdmin |
| `/admin/approval/update-status` | POST | Update approval status | requireAdmin |
| `/admin/service/update-status` | POST | Update service status | requireAdmin |
| `/admin/service/update-deadline` | POST | Change deadline | requireAdmin |
| `/admin/user/update-status` | POST | Activate/deactivate user | requireAdmin |
| `/admin/user/update` | POST | Edit user profile | requireAdmin |

### Unit Endpoints

| Endpoint | Method | Purpose | Requires |
|----------|--------|---------|----------|
| `/unit` | GET | Dashboard | requireUnit |
| `/unit/task/approve/:id` | POST | Approve assigned task | requireUnit + owner check |

### User Endpoints

| Endpoint | Method | Purpose | Requires |
|----------|--------|---------|----------|
| `/user` | GET | Dashboard | requireAuth |
| `/user/request/create` | POST | Create request | requireAuth |
| `/user/profile` | GET | User profile | requireAuth |

---

## Test Verification Checklist

### Security Tests
- [ ] Cross-role access attempts return proper errors (401/403/404, not 200)
- [ ] Database queries filter by user/unit correctly
- [ ] Session/JWT validation happens on every protected route
- [ ] No sensitive data leaked in error messages
- [ ] Request updates create audit log entries
- [ ] Email notifications sent with correct role information

### Functional Tests
- [ ] Admin can perform full CRUD on all entities
- [ ] Unit can perform CRUD only on assigned entities
- [ ] User can perform CRUD only on own entities
- [ ] State transitions follow valid workflow
- [ ] Permissions re-checked after status changes
- [ ] Archived/deleted items not accessible

### Integration Tests
- [ ] User role changes immediately reflected in permissions
- [ ] Assignment changes propagate to unit user
- [ ] Notifications respect permission boundaries
- [ ] API rate limiter doesn't interfere with valid requests
- [ ] Concurrent edits handled correctly

---

## Code Review Checklist

### Files to Review

**Authentication Middleware** - `middleware/auth.js`
- [ ] `requireAdmin` checks `role === 'admin'`
- [ ] `requireUnit` checks `role === 'unit'`
- [ ] `requireAuth` validates session/JWT
- [ ] All check `emailVerified` where required
- [ ] All check `approved` status where required

**Routes** - `routes/admin.js`, `routes/unit.js`, `routes/user.js`
- [ ] Each protected route uses correct middleware
- [ ] GET queries filter by role/ownership
- [ ] POST/PUT/DELETE verify ownership before update
- [ ] Error responses don't leak implementation details

**Models** - `models/*.js`
- [ ] Schemas define correct enum values for statuses
- [ ] No sensitive fields exposed in queries
- [ ] Proper indexing on userId, unitId for fast lookups

---

## Known Limitations & TODOs

- [ ] Mobile permission tests (responsive design + mobile auth)
- [ ] Rate limiting per role (admin vs user throttling difference)
- [ ] Batch operation permissions (export multiple requests as user vs admin)
- [ ] Historical permission changes (who could access what at what time)
- [ ] OAuth provider permission sync (Clerk/Microsoft permissions)

---

## Test Result Recording

### Sample Structure

```json
{
  "test_date": "2026-04-18",
  "test_scenarios": [
    {
      "scenario": "Admin Dashboard Access",
      "status": "✅ PASS",
      "notes": "All roles properly denied/allowed"
    },
    {
      "scenario": "Unit Assignment Permissions",
      "status": "⚠️  PARTIAL",
      "notes": "Missing audit log on status change",
      "action_items": ["Add audit log", "Test concurrent updates"]
    }
  ]
}
```

---

## Running Automated Tests

From command line (after fixing test runner):
```bash
npm test                          # Run full test suite
npm run test:admin               # Test admin permissions only
npm run test:unit                # Test unit permissions only
npm run test:user                # Test user permissions only
npm run test:api                 # Test API endpoints
npm run test:coverage            # Coverage report
```

---

## References

- Auth Middleware: `middleware/auth.js`
- Admin API: `routes/admin.js` lines 1602-2800
- Unit API: `routes/unit.js` lines 1076+
- User API: `routes/user.js` lines 200+
- Models: `models/User.js`, `models/ServiceRequest.js`, `models/RequestApproval.js`

