# Service Request Notifications Summary

## Overview
All service request actions now trigger notifications to both requestors and unit team members.

## Notification Triggers

### 1. **Unit Uploads Deliverables**
**Route:** `POST /unit/task/upload/:id`  
**File:** `routes/unit.js` (lines 1525-1595)

**Notifications Sent:**
- ✅ **Requestor Notification** - `notifyRequestorDeliverableUploaded()`
  - Notifies the requestor that deliverables are ready for review
  - Status changes to "For Checking"
  
- ✅ **Admin Notification** - `notifyAdminUnitDeliverable()`
  - Notifies admins that unit has uploaded deliverables
  - Includes file count

**Status Change:** → "For Checking"

---

### 2. **Requestor Approves Deliverables**
**Route:** `POST /user/service/mark-complete/:id`  
**File:** `routes/user.js` (lines 1507-1568)

**Notifications Sent:**
- ✅ **Unit Team Notification** - `notifyServiceApproved()`
  - Notifies all members of the assigned unit team
  - Indicates requestor has approved deliverables
  - Unit can now complete the task with final remarks

**Status Change:** → "Approved"

---

### 3. **Requestor Requests Revision**
**Route:** `POST /user/service/request-revision/:id`  
**File:** `routes/user.js` (lines 1414-1500)

**Notifications Sent:**
- ✅ **Unit Team Notification** - `notifyUnitRevisionRequested()`
  - Notifies all members of the assigned unit team
  - Includes revision notes and uploaded files
  - Shows revision count (1 of 2 or 2 of 2)

**Status Change:** → "For Revision"  
**Revision Count:** Incremented (max 2 revisions)

---

### 4. **Unit Completes Task**
**Route:** `POST /unit/task/complete/:id`  
**File:** `routes/unit.js` (lines 1598-1670)

**Notifications Sent:**
- ✅ **Requestor Notification** - `notifyServiceCompleted()`
  - Notifies requestor that service is fully completed
  - Includes final remarks from unit team

**Status Change:** → "Completed"

---

## Notification Service Functions

All notification functions are located in `services/notificationService.js`:

| Function | Line | Purpose |
|----------|------|---------|
| `notifyRequestorDeliverableUploaded()` | 1096 | Notify requestor deliverables are uploaded |
| `notifyAdminUnitDeliverable()` | 1065 | Notify admin of unit deliverable upload |
| `notifyServiceApproved()` | 105 | Notify unit team of requestor approval |
| `notifyUnitRevisionRequested()` | 1195 | Notify unit team of revision request |
| `notifyServiceCompleted()` | ~130 | Notify requestor of service completion |

---

## Complete Workflow with Notifications

```
1. Unit Uploads Deliverables
   └─> Status: "For Checking"
   └─> Notifies: Requestor + Admin
   
2a. Requestor Approves
    └─> Status: "Approved"
    └─> Notifies: Unit Team
    └─> Unit clicks "Complete Task"
        └─> Status: "Completed"
        └─> Notifies: Requestor
        
2b. Requestor Requests Revision
    └─> Status: "For Revision"
    └─> Notifies: Unit Team
    └─> Go back to step 1 (max 2 revision cycles)
```

---

## Message Duplication Fix

**Issue:** Messages were being duplicated in conversation modals due to multiple event listeners being attached.

**Solution Applied:**
- Removed duplicate `sendMessage` event listener from initialization in `alltasks.js`
- Used element cloning in DOMContentLoaded to ensure clean event listeners
- Only one `sendTeamMessage` function is called per send action

**Files Modified:**
- `public/javascripts/ejs/Unit/alltasks.js` (lines 167-179, 2900-2930)

---

## Testing Checklist

- [ ] Upload deliverables → Check requestor receives notification
- [ ] Upload deliverables → Check admin receives notification
- [ ] Approve deliverables → Check unit team receives notification
- [ ] Request revision → Check unit team receives notification
- [ ] Complete task → Check requestor receives notification
- [ ] Send message in conversation → Verify no duplicates appear
- [ ] Send message with Enter key → Verify no duplicates appear

---

## Notes

- All notifications include relevant request details and context
- Notification services handle errors gracefully without blocking main operations
- Socket service updates active request counts for real-time admin dashboard updates
- Revision limit (2 max) is enforced with clear messaging to users
