# Testing Guide - Queued & In Progress Status Integration

## Pre-Testing Checklist

✅ Server is running on http://localhost:8080
✅ Database connection is active
✅ You have test accounts for:
- User account (to submit requests)
- Unit member account (Graphics/Multimedia/PR)
- Admin account

---

## Test Plan Overview

1. **Visual Testing** - Check status badges display correctly
2. **Filter Testing** - Verify filter dropdowns work
3. **Workflow Testing** - Test status transitions
4. **Start Task Testing** - Test Queued → In Progress
5. **Browser Console Testing** - Check for JavaScript errors

---

## 1. VISUAL TESTING (5 minutes)

### Test Status Badge Display

**Pages to Check:**
- Admin: http://localhost:8080/admin
- Admin Services: http://localhost:8080/admin/services
- Admin Approvals: http://localhost:8080/admin/approvals
- Unit Dashboard: http://localhost:8080/unit/dashboard
- Unit All Tasks: http://localhost:8080/unit/all-tasks
- Unit Task Services: http://localhost:8080/unit/task-services
- Unit Task Approvals: http://localhost:8080/unit/task-approvals
- User Dashboard: http://localhost:8080/user/dashboard
- User All Requests: http://localhost:8080/user/all-requests

**What to Check:**
```
✅ Queued status displays with amber/yellow background
✅ In Progress status displays with blue background
✅ Icons show correctly (📥 for Queued, ⚙️ for In Progress)
✅ Text is readable and properly formatted
✅ No CSS layout breaks or overlaps
```

**How to Check:**
1. Open each page
2. Look for any requests with "Queued" or "In Progress" status
3. Verify color matches:
   - **Queued**: Amber/Yellow background, dark brown text
   - **In Progress**: Light blue background, dark blue text

---

## 2. FILTER TESTING (5 minutes)

### Test Filter Dropdowns

**Admin Pages:**
1. Go to http://localhost:8080/admin/services
2. Click on "Status" filter dropdown
3. **Verify:** You see these options:
   ```
   □ Pending
   □ Queued          ← NEW
   □ In Progress     ← NEW
   □ Approved
   □ For Revision
   □ Completed
   □ Rejected
   □ Archived
   ```

4. Select "Queued" only
5. **Expected:** Table shows only Queued requests
6. Select "In Progress" only
7. **Expected:** Table shows only In Progress requests

**Unit Pages:**
1. Go to http://localhost:8080/unit/all-tasks
2. Click "Status" dropdown in filters
3. **Verify:** You see:
   ```
   All Statuses
   Pending
   Queued          ← NEW
   In Progress     ← NEW
   For Revision
   Approved
   Completed
   Cancelled
   ```

4. Filter by "Queued"
5. **Expected:** Only Queued tasks appear
6. Filter by "In Progress"
7. **Expected:** Only In Progress tasks appear

**Repeat for:**
- http://localhost:8080/unit/task-services
- http://localhost:8080/unit/task-approvals

---

## 3. WORKFLOW TESTING (10 minutes)

### Test Smart Triage (Auto-Assignment)

**Step 1: Create a New Graphics Request**
1. Log in as a **User**
2. Go to http://localhost:8080/user/request-service
3. Fill out the form:
   - Service Type: Select **"Graphics Design (Poster)"**
   - Title: "Test Graphics Request - [Your Name]"
   - Description: "Testing auto-assignment to Graphics unit"
   - Organization: Any
   - Deadline: Any future date
4. Submit the request
5. **Expected Result:** Request is created with status **"Queued"**

**Step 2: Verify in Admin View**
1. Log in as **Admin**
2. Go to http://localhost:8080/admin/services
3. Find your test request
4. **Verify:**
   ```
   ✅ Status shows "Queued" (amber/yellow)
   ✅ Assigned Units shows "Graphics"
   ✅ Request appears in table
   ```

**Step 3: Verify in Unit View**
1. Log in as **Graphics Unit Member**
2. Go to http://localhost:8080/unit/all-tasks
3. Find your test request
4. **Verify:**
   ```
   ✅ Request appears in the list
   ✅ Status badge shows "Queued" (amber/yellow with 📥 icon)
   ✅ Can see all request details
   ```

---

## 4. START TASK TESTING (10 minutes)

### Test Queued → In Progress Transition

**Step 1: Open Queued Task**
1. As **Unit Member** (Graphics/Multimedia/PR)
2. Go to http://localhost:8080/unit/all-tasks
3. Filter by "Queued" status (if needed)
4. Click "View Details" on a Queued request
5. **Modal Opens**

**Step 2: Verify Start Task Button**
1. In the modal, look for a special panel/button at the top
2. **Verify you see:**
   ```
   ╔═══════════════════════════════════════════════╗
   ║ 📥 Task Queued                                 ║
   ║ This task has been assigned to your unit.     ║
   ║ Click below to start working on it.           ║
   ║                                               ║
   ║ [✓ Start Task - Change to "In Progress"]     ║
   ╚═══════════════════════════════════════════════╝
   ```

3. **Visual Check:**
   ```
   ✅ Button has blue background
   ✅ Button has checkmark icon
   ✅ Text clearly says "Start Task - Change to In Progress"
   ✅ Panel has light blue gradient background
   ```

**Step 3: Click Start Task**
1. Click the "Start Task" button
2. **Expected:** Confirmation dialog appears:
   ```
   "Are you ready to start working on this task? 
    This will change the status to 'In Progress'."
   
   [Cancel] [OK]
   ```

3. Click **OK**

**Step 4: Verify Status Change**
1. **Expected:** Success message appears:
   ```
   ✅ "Task started successfully! Status changed to 'In Progress'."
   ```

2. **Expected:** Page reloads automatically after 1.5 seconds

3. After reload, find the same request again
4. **Verify:**
   ```
   ✅ Status badge now shows "In Progress" (blue with ⚙️ icon)
   ✅ Start Task button is GONE from modal
   ✅ Request moved from "Queued" filter to "In Progress" filter
   ```

**Step 5: Verify Notification Sent**
1. Log in as the **User who submitted** the request
2. Check notifications (bell icon)
3. **Expected:** You received a notification:
   ```
   "Your service request '[Title]' is now In Progress. 
    The [Unit Name] team has started working on it."
   ```

---

## 5. BROWSER CONSOLE TESTING (2 minutes)

### Check for JavaScript Errors

**Open Developer Console:**
- Chrome/Edge: Press `F12` or `Ctrl+Shift+I`
- Firefox: Press `F12` or `Ctrl+Shift+K`
- Safari: Press `Cmd+Option+I`

**Step 1: Check Console on Page Load**
1. Go to any page (admin, unit, or user)
2. Open console
3. Refresh page (`F5`)
4. **Expected:** No red error messages
5. **Allowed:** Gray/blue info messages are okay

**Step 2: Test Status Handler Functions**
In the console, type these commands:

```javascript
// Test 1: Check if functions exist
console.log(typeof window.getStatusDisplay);
// Expected: "function"

console.log(typeof window.acknowledgeTask);
// Expected: "function" (on unit pages)

// Test 2: Get status display info
window.getStatusDisplay('Queued');
// Expected: Object with class, icon, text, color

window.getStatusDisplay('In Progress');
// Expected: Object with class, icon, text, color

// Test 3: Create status badges
window.createStatusBadge('Queued', true);
// Expected: HTML string with badge

window.createStatusBadge('In Progress', true);
// Expected: HTML string with badge

// Test 4: Test filter update
window.updateStatusFilterDropdown();
// Expected: No errors, filter dropdowns updated
```

**Expected Console Output:**
```javascript
> window.getStatusDisplay('Queued')
< {class: 'status-badge-info', icon: '📥', text: 'Queued', color: '#fbbf24'}

> window.getStatusDisplay('In Progress')
< {class: 'status-badge-primary', icon: '⚙️', text: 'In Progress', color: '#3b82f6'}

> window.createStatusBadge('Queued', true)
< '<span class="status-badge status-badge-info">📥 Queued</span>'
```

---

## 6. EDGE CASE TESTING (5 minutes)

### Test Non-Queued Statuses

**Test 1: Pending Request**
1. Open a request with "Pending" status
2. **Verify:** No "Start Task" button appears
3. **Verify:** Status badge shows yellow/amber for Pending

**Test 2: Completed Request**
1. Open a request with "Completed" status
2. **Verify:** No "Start Task" button appears
3. **Verify:** Status badge shows green for Completed

**Test 3: Approved Request**
1. Open a request with "Approved" status
2. **Verify:** No "Start Task" button appears
3. **Verify:** Normal approval workflow still works

---

## 7. NETWORK TESTING (Optional - 3 minutes)

### Verify API Endpoint

**Open Network Tab in DevTools:**
1. Go to unit page with Queued request
2. Open DevTools → Network tab
3. Click "Start Task" button
4. **Look for request:** `POST /unit/task/acknowledge/[id]`

**Verify Response:**
```json
{
  "success": true,
  "message": "Task acknowledged and status updated to In Progress"
}
```

**Response Status:** `200 OK`

---

## 8. CROSS-BROWSER TESTING (10 minutes)

Test on different browsers:

### Chrome/Edge
✅ All status badges display correctly
✅ Filters work
✅ Start Task button works
✅ No console errors

### Firefox
✅ All status badges display correctly
✅ Filters work
✅ Start Task button works
✅ No console errors

### Safari (if available)
✅ All status badges display correctly
✅ Filters work
✅ Start Task button works
✅ No console errors

---

## 9. MOBILE TESTING (Optional - 5 minutes)

### Test Responsive Design
1. Open DevTools
2. Click "Toggle Device Toolbar" (phone icon) or press `Ctrl+Shift+M`
3. Select device: iPhone 12 Pro or Galaxy S20
4. Navigate through pages

**Verify:**
```
✅ Status badges visible on mobile
✅ Filter dropdowns work on mobile
✅ Start Task button visible and clickable
✅ Modal displays properly
✅ No layout breaks
```

---

## 10. DATABASE VERIFICATION (Optional - 2 minutes)

### Check Database Records

If you have database access, verify:

```javascript
// In MongoDB Compass or Mongo Shell
db.servicerequests.find({ status: "Queued" })
// Should return Queued requests

db.servicerequests.find({ status: "In Progress" })
// Should return In Progress requests

// Check one specific request
db.servicerequests.findOne({ 
  status: "In Progress",
  assignedUnits: { $exists: true }
})
// Should show the request you changed from Queued to In Progress
```

---

## Quick Test Scenario (5 minutes)

If you're short on time, do this quick test:

1. **Login as User** → Submit Graphics Design request
2. **Verify:** Request shows "Queued" status
3. **Login as Graphics Unit Member** → Open the request
4. **Verify:** "Start Task" button appears
5. **Click:** Start Task → Confirm
6. **Verify:** Status changes to "In Progress"
7. **Check Console:** No errors (F12)

**All passing? ✅ Integration is working!**

---

## Common Issues & Solutions

### Issue: Status badges not colored
**Solution:** Clear browser cache (`Ctrl+F5`) and reload

### Issue: Start Task button not appearing
**Check:**
- Status is exactly "Queued" (check database)
- You're logged in as a unit member
- JavaScript has no errors in console

### Issue: Filter dropdown missing new statuses
**Solution:** 
- Refresh page (`F5`)
- Check if status-handler.js is loaded (Console → Sources tab)

### Issue: "Address in use" when starting server
**Solution:** Server is already running - just test at http://localhost:8080

---

## Test Results Checklist

After completing all tests, verify:

- [ ] All status badges display with correct colors
- [ ] Queued shows amber/yellow background with 📥 icon
- [ ] In Progress shows blue background with ⚙️ icon
- [ ] Filter dropdowns include Queued and In Progress
- [ ] Filtering by new statuses works correctly
- [ ] Smart triage creates requests with Queued status
- [ ] Start Task button appears for Queued items only
- [ ] Clicking Start Task changes status to In Progress
- [ ] Page reloads after status change
- [ ] Notification sent to user
- [ ] No JavaScript console errors
- [ ] Works in multiple browsers
- [ ] Mobile responsive design works

**All checked? 🎉 Integration is complete and working!**

---

## Reporting Issues

If you find any issues:

1. **Screenshot** the problem
2. **Open Console** (F12) and copy any error messages
3. **Note** which page/browser
4. **Check** the files modified in INTEGRATION_COMPLETE.md
5. **Test** the specific JavaScript function in console

---

**Testing Date**: _______________
**Tested By**: _______________
**Result**: ☐ Pass ☐ Fail (notes: _______________)
