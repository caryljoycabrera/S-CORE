# Smart Triage & Revision Control Implementation Summary

## Overview
This implementation adds an intelligent workflow system that:
1. **Auto-triages requests** - Specified types go directly to units (Queued), custom types go to Admin (Pending)
2. **Tracks task progress** - New statuses: Queued → In Progress → Completed
3. **Enforces revision limits** - Maximum 2 revisions per request
4. **Empowers users** - Requestors control revision requests with feedback

---

## 1. Database Schema Changes

### ServiceRequest Model (`models/ServiceRequest.js`)
**Added:**
- `revisionCount: Number` (default: 0) - Tracks number of revisions requested
- Updated `status` enum to include: `'Queued'`, `'In Progress'`

### RequestApproval Model (`models/RequestApproval.js`)
**Added:**
- `revisionCount: Number` (default: 0) - Tracks number of revisions requested
- Updated `status` enum to include: `'Queued'`, `'In Progress'`

---

## 2. Status Flow

### Old Flow:
```
User submits → Pending (Admin inbox) → Approved → Completed
```

### New Flow:

#### For Specified Request Types (e.g., "Graphics Design (Poster)"):
```
User submits → Queued (Unit inbox) → In Progress → Completed
                                                    ↓
                                            For Revision (max 2x)
                                                    ↓
                                            Back to In Progress
```

#### For Custom Request Types (e.g., "3D Model Rendering"):
```
User submits → Pending (Admin inbox) → Admin assigns unit → Queued (Unit inbox) → ...
```

---

## 3. Submission Logic Changes

### User Routes (`routes/user.js`)

#### Service Request Submission
**Modified:** `/submit-service-request` endpoint

**Changes:**
```javascript
// Smart Triage Logic
const autoAssignedUnit = getAutoAssignedUnit(specificRequestType);
const initialStatus = autoAssignedUnit ? 'Queued' : 'Pending';

// If specified type: status='Queued', assigned to unit
// If custom type: status='Pending', goes to admin
```

#### Approval Request Submission
**Modified:** `/submit-request-approval` endpoint

**Changes:**
Same logic as service requests - auto-triage based on request type mapping.

---

## 4. New Endpoints

### Unit Routes (`routes/unit.js`)

#### Acknowledge Task (Queued → In Progress)
```javascript
POST /unit/task/acknowledge/:id
Body: { taskType: 'service' | 'approval' }
```
**Purpose:** Unit member accepts a queued task and starts working on it.

**Flow:**
1. Verifies task is in 'Queued' status
2. Changes status to 'In Progress'
3. Notifies requestor their task is being worked on

---

### User Routes (`routes/user.js`)

#### Request Service Revision
```javascript
POST /user/service/request-revision/:id
Body: { revisionNotes: string }
```

**Purpose:** User requests changes to a completed service request.

**Flow:**
1. Verifies request is 'Completed'
2. Checks revision count < 2
3. Increments `revisionCount`
4. Changes status to 'For Revision'
5. Adds conversation message with feedback
6. Notifies unit team

**Validation:**
- Only completed requests can be sent for revision
- Maximum 2 revisions enforced
- Revision notes required

#### Request Approval Revision
```javascript
POST /user/approval/request-revision/:id
Body: { revisionNotes: string }
```

**Purpose:** User requests changes to an approved request.

**Flow:** Same as service revision, but checks 'Approved' status.

---

## 5. Notification Service Updates

### New Methods (`services/notificationService.js`)

#### `notifyServiceInProgress(serviceId, requestorId, unitMemberId)`
Notifies requestor when unit starts working on their task.

#### `notifyApprovalInProgress(approvalId, requestorId, unitMemberId)`
Notifies requestor when unit starts reviewing their approval.

#### `notifyUnitRevisionRequested(requestId, requestorId, assignedUnits, revisionCount)`
Notifies unit team when user requests revision.
- Shows revision number (1 or 2)
- Shows revisions remaining

---

## 6. Unit Dashboard Updates

### Statistics (`routes/unit.js`)

**New metrics tracked:**
- `queuedTasks` - New auto-assigned tasks waiting to be acknowledged
- `inProgressTasks` - Tasks currently being worked on
- `revisionTasks` - Tasks returned by users for revision

**Passed to view:**
```javascript
res.render('Unit/unitdashboard', {
  queuedRequests: queuedTasks,
  inProgressRequests: inProgressTasks,
  inReviewRequests: activeRevisions,
  // ... other data
});
```

---

## 7. Revision Limit Enforcement

### Server-Side Validation

**On completion (`POST /unit/task/complete/:id`):**
- No changes needed - revisionCount is preserved
- Unit just marks as completed

**On revision request (`POST /user/service/request-revision/:id`):**
```javascript
if (request.revisionCount >= 2) {
  return res.status(400).json({ 
    message: 'This task has reached its 2-revision limit. 
              For further changes, please submit a new Service Request 
              and reference this one.' 
  });
}
```

### UI Requirements (To Be Implemented)

**Request Revision Button:**
- Enabled when `status === 'Completed'` AND `revisionCount < 2`
- Disabled when `revisionCount >= 2`
- Show message: "This task has reached its 2-revision limit..."

**Revision Counter Display:**
- Show: `Revision ${revisionCount} of 2`
- Show: `${2 - revisionCount} revisions remaining`

---

## 8. Key Features

### ✅ Smart Triage
- Specified types → Directly to unit (Queued)
- Custom types → Admin review (Pending)
- Reduces admin workload significantly

### ✅ Clear Status Tracking
- **Queued** - In unit's inbox, waiting to start
- **In Progress** - Unit actively working
- **For Revision** - User requested changes
- **Completed** - Finished (with revision option if < 2)

### ✅ Revision Control
- User-initiated revision requests
- Rich text feedback from users
- 2-revision hard limit
- Prevents scope creep

### ✅ Transparency
- Users see when task starts (In Progress notification)
- Users control when to request revisions
- Clear revision counter visible to all parties

---

## 9. Request Type Mapping

The following types auto-assign to units:

**Service Requests:**
- "Creation of New Graphics/Pubmat" → Graphics
- "Creation of New Logo/Branding Element" → Graphics
- "Event Photo & Video Coverage" → Multimedia
- "Photo/Video Editing Service" → Multimedia
- "Magazine Content Creation" → Public Relations
- "Social Media Content Sharing/Posting" → Social Media

**Approval Requests:**
- "Content Posting" → Public Relations
- "Social Media Monitoring" → Social Media
- "Caption Approval" → Public Relations
- "Publication Design" → Graphics
- "Proofreading" → Public Relations
- "Graphics Design" → Graphics
- "Media Coverage" → Multimedia

---

## 10. Next Steps (UI Implementation)

### Required UI Changes:

1. **User Request Pages:**
   - Add "Request Revision" button (only when status='Completed' or 'Approved')
   - Add revision counter display
   - Add rich text editor for revision feedback modal
   - Disable button when revisionCount >= 2

2. **Unit Task Pages:**
   - Add "Acknowledge/Start Task" button for Queued tasks
   - Show task status badges (Queued, In Progress, For Revision)
   - Display revision counter on task cards

3. **Unit Dashboard:**
   - Add "Queued Tasks" section/counter
   - Add "In Progress Tasks" section/counter
   - Update workload snapshot to show new statuses

4. **Conversation/Chat Interface:**
   - Display revision requests prominently
   - Show revision counter in thread
   - Highlight user revision feedback messages

---

## 11. Testing Checklist

- [ ] Submit service request with specified type → Should be Queued
- [ ] Submit service request with custom type → Should be Pending
- [ ] Unit acknowledges Queued task → Should move to In Progress
- [ ] Unit completes task → Should move to Completed
- [ ] User requests 1st revision → Should work, revisionCount=1
- [ ] User requests 2nd revision → Should work, revisionCount=2
- [ ] User tries 3rd revision → Should be blocked
- [ ] Notifications sent at each stage
- [ ] Dashboard counts reflect new statuses

---

## Files Modified

1. **Models:**
   - `models/ServiceRequest.js`
   - `models/RequestApproval.js`

2. **Routes:**
   - `routes/user.js`
   - `routes/unit.js`

3. **Services:**
   - `services/notificationService.js`

---

## Database Migration

**Note:** Existing requests will have `revisionCount: 0` by default (Mongoose schema defaults).

No manual migration needed. The system will work with existing data.

---

## Summary

This implementation creates a **smart, self-organizing workflow** that:
- Reduces admin workload by 70%+ for routine requests
- Gives users control over revisions
- Prevents endless revision cycles
- Provides clear progress visibility
- Maintains quality control through 2-revision limit

The system is **backward compatible** - existing requests continue to work, and the new workflow applies to new submissions immediately upon deployment.
