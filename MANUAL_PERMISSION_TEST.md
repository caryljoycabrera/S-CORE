# Interactive Browser Permission Test
## Quick Manual Verification

**Status**: Ready to execute via browser tools  
**Commands**: Click navigation elements to test permission enforcement

---

## Test 1: Public Page Accessibility ✅
**Goal**: Verify public pages accessible to all  
**Result**: ✅ About page accessible (no auth required)

```
✅ http://localhost:8080/about-s-core loads successfully
✅ Login & Sign Up buttons present
✅ Public footer/navigation accessible
```

---

## Test 2: Login Flow (Needs Test Accounts)

### Step 1: Create Test Accounts (via Admin)
Admin must seed test users:
```sql
- admin@test.local / AdminTest123 (role: 'admin')
- unit@test.local / UnitTest123 (role: 'unit')  
- user@test.local / UserTest123 (role: 'user')
```

### Step 2: Login as Each Role

**Admin Login**:
```
1. Navigate to http://localhost:8080/login
2. Enter: admin@test.local / AdminTest123
3. Expected: Redirect to /admin (dashboard)
4. Verify: Admin-only options visible (user management, reports, etc.)
```

**Unit Login**:
```
1. Navigate to http://localhost:8080/login
2. Enter: unit@test.local / UnitTest123
3. Expected: Redirect to /unit (dashboard)
4. Verify: Unit-specific options (assigned tasks, approvals)
```

**User Login**:
```
1. Navigate to http://localhost:8080/login
2. Enter: user@test.local / UserTest123
3. Expected: Redirect to /user (dashboard)
4. Verify: User options (my requests, profile)
```

---

## Test 3: Cross-Role Access Control

### Scenario A: User tries to access /admin

```
1. Login as user@test.local
2. Manually navigate to http://localhost:8080/admin
3. Expected Result:
   ❌ Should NOT see admin dashboard
   - Either: Redirect to /user or error message
   - FAIL if: Sees admin content/options
```

### Scenario B: Unit tries to access /admin

```
1. Login as unit@test.local
2. Manually navigate to http://localhost:8080/admin
3. Expected Result:
   ❌ Should NOT see admin dashboard
   - Either: Redirect to /unit or error message
   - FAIL if: Sees admin content/options
```

### Scenario C: User tries to access /unit

```
1. Login as user@test.local
2. Manually navigate to http://localhost:8080/unit
3. Expected Result:
   ❌ Should NOT see unit dashboard
   - Either: Redirect to /user or error message
   - FAIL if: Sees unit content/options
```

---

## Test 4: Request Visibility

### Setup
Admin creates two approval requests:
- Request A: Created by User A
- Request B: Created by User B

### Test Cases

**User A viewing requests**:
- ✅ Should see Request A (their own)
- ❌ Should NOT see Request B (another user's)

**User B viewing requests**:
- ✅ Should see Request B (their own)
- ❌ Should NOT see Request A (another user's)

**Admin viewing**:
- ✅ Should see both Request A and B
- ✅ All filter/search options available

**Unit viewing** (before assignment):
- ❌ Should NOT see either request (not assigned)

**Unit viewing** (after assignment to Request A):
- ✅ Should see Request A (assigned to them)
- ❌ Should still NOT see Request B (not their assignment)

---

## Test 5: Update Permission Enforcement

### Scenario: User tries to update another's request

**Browser Test**:
```
1. Login as user@test.local
2. Open Request B (created by User B) - may show "View Only"
3. Try to click "Edit" or "Change Status"
4. Expected: 
   ✅ Button disabled, or
   ✅ Error: "You don't have permission to edit this"
   ❌ FAIL if: Request editable
```

**Inspect Network Tab**:
```
1. Open DevTools (F12) → Network tab
2. Try to update Request B via API
3. Expected Response:
   ✅ 403 Forbidden
   ✅ 401 Unauthorized
   ❌ FAIL if: 200 OK with update
```

### Scenario: Unit tries to update unassigned request

```
1. Login as unit@test.local
2. Navigate to unassigned request
3. Try to approve/change status
4. Expected:
   ✅ 403 Error or "Not assigned to you"
   ❌ FAIL if: Successful update
```

---

## Test 6: Status Transition Validation

### Request Workflow

Initial State: **Pending** (created by user)

```
Admin Action: Assign to Unit → Status changes to **Queued**
✅ Success: Notification sent to unit
❌ FAIL: User can still edit after assignment

Unit Action: Start work → Status changes to **In Progress**
✅ Success: Admin sees updated status
❌ FAIL: User can still edit

Unit Action: Submit → Status changes to **For Checking**
✅ Success: Admin gets notification
❌ FAIL: Unit can mark as Completed without admin review

Admin Action: Approve → Status changes to **Approved** or **For Revision**
✅ Success: User gets notification of decision
❌ FAIL: Unit can change back to In Progress

If **For Revision**: User must submit new revision
→ Status back to **For Checking**
→ Repeat review cycle
```

---

## Network Tab Verification

### Expected HTTP Status Codes

**Successful Authorization**:
- `200 OK` - Successful read/update
- `201 Created` - New resource created

**Permission Denied**:
- `403 Forbidden` - User lacks permission (has account, wrong role)
- `401 Unauthorized` - Not authenticated or session invalid
- `404 Not Found` - Resource doesn't exist (or hidden from user)

### Request Headers to Check

```
Cookie: connect.sid=<session_id>
Authorization: Bearer <token> (if applicable)
```

### Response Headers

```
Set-Cookie: connect.sid=... (session management)
x-user-role: admin|unit|user (debug hints if present)
```

---

## Console Errors to Watch For

**Expected (OK)**:
```javascript
// Correct access denied
// 403 Forbidden response
// User doesn't have access to this resource
```

**Suspicious (FAILS)**:
```javascript
// ReferenceError: Cannot read admin property
// CORS error allowing cross-origin admin requests
// Uncaught: user[admin property access] (data leak)
```

---

## Quick Safety Checklist

Before considering perms "secure":

- [ ] Cross-role access properly denied (403/401/redirect)
- [ ] Same-role users can't see each other's data
- [ ] Status can't transition to invalid states
- [ ] API endpoints reject wrong-role requests
- [ ] No error messages leak implementation details
- [ ] Session persists correctly (same user across requests)
- [ ] Logout clears permissions (can't reuse session after logout)

---

## Data Inspection (DevTools)

### Check Database Queries
1. Open browser DevTools → Network tab
2. Filter for requests to API endpoints
3. Look at response JSON:

**Should see**:
```json
{
  "requests": [
    {
      "id": "123",
      "userId": "user-456",
      "title": "My Request",
      "status": "Pending"
    }
  ]
}
```

**Should NOT see**:
```json
{
  "requests": [
    {"password": "hashedPassword"},
    {"internalNotes": "admin-only field"},
    {"allUsers": [...]}  // All users visible to regular user
  ]
}
```

---

## Findings Template

After manual testing, record:

```markdown
### Test Date: 2026-04-18

**✅ Passed**:
- Admin dashboard properly restricted
- User cannot see other user requests
- Requests readonly for non-owned entries

**⚠️ Issues**:
- Unit route /unit/dashboard name pattern not matched (false positive)
- Session validation pattern needs clarification

**❌ Failed**:
- (None detected by automated analysis)

**Next Actions**:
- Manual browser testing with real accounts
- Verify all state transitions
- Check email notifications respect permissions
```

