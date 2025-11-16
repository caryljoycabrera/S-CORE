# Quick Reference - New Status Workflow

## Status Flow

```
USER SUBMITS REQUEST
        ↓
┌───────┴─────────┐
│                 │
│  Known Type?    │
│  (Auto-assign)  │
│                 │
└────┬──────┬─────┘
     │      │
    YES    NO
     │      │
     ↓      ↓
 QUEUED  PENDING ← Admin manually assigns
     │      ↓
     │   QUEUED
     │      │
     └──┬───┘
        ↓
   IN PROGRESS ← Unit clicks "Start Task"
        ↓
    COMPLETED ⟲ FOR REVISION (max 2x)
```

## Status Colors & Icons

| Status | Color | Icon | CSS Class | Meaning |
|--------|-------|------|-----------|---------|
| **Queued** | 🔵 Light Blue | 📋 | `.status-badge.queued` | Auto-assigned, waiting to start |
| **In Progress** | 🔵 Blue | ⚙️ | `.status-badge.in-progress` | Unit actively working |
| Pending | 🟡 Yellow | ⏳ | `.status-badge.pending` | Waiting for admin assignment |
| Approved | 🟢 Green | ✅ | `.status-badge.approved` | Approved by unit |
| Completed | 🟢 Green | ✅ | `.status-badge.completed` | Finished |
| For Revision | 🟠 Orange | 🔄 | `.status-badge.revision` | Needs changes |
| Rejected | 🔴 Red | ❌ | `.status-badge.rejected` | Not approved |

## Key Functions

### JavaScript (status-handler.js)
```javascript
// Get status info
window.getStatusDisplay('Queued')
// Returns: { class: 'status-badge-info', icon: '📥', text: 'Queued', color: '#fbbf24' }

// Create badge HTML
window.createStatusBadge('In Progress', true)
// Returns: <span class="status-badge status-badge-primary">⚙️ In Progress</span>

// Get sort priority
window.getStatusPriority('Queued', 'unit')
// Returns: 1 (highest priority for unit)
```

### Unit Actions
```javascript
// Start a queued task
window.acknowledgeTask(requestId, requestType)
// Changes Queued → In Progress
```

## Files Changed

### Views (9 files)
- Admin: allrequestsadmin.ejs, approvals.ejs, services.ejs
- Unit: AllTasks.ejs, TaskApprovals.ejs, TaskServices.ejs
- User: allRequestsUser.ejs, userPage.ejs

### JavaScript (5 files)
- allrequestsadmin.js, services.js, approvals.js
- Unit/alltasks.js
- status-handler.js

### CSS (1 file)
- status-badges-new.css

## Auto-Assignment Rules

| Request Type | Assigned To | Initial Status |
|--------------|-------------|----------------|
| Graphics Design (Poster) | Graphics | **Queued** |
| Event Photo & Video Coverage | Multimedia | **Queued** |
| Magazine Content Creation | Public Relations | **Queued** |
| Other types | *(None - Admin assigns)* | **Pending** |

## Common Tasks

### 1. Filter by New Status
Already works! Filter dropdowns auto-updated with:
- 📥 Queued
- ⚙️ In Progress

### 2. Start a Queued Task (Unit Member)
1. Open task detail modal
2. See "Start Task" button (only for Queued items)
3. Click button
4. Confirm dialog
5. Status changes to In Progress
6. Page reloads

### 3. Check if Code is Working
```javascript
// In browser console
console.log(window.getStatusDisplay('Queued'));
console.log(window.getStatusDisplay('In Progress'));
```

Should show object with class, icon, text, color.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/unit/task/acknowledge/:id` | POST | Change Queued → In Progress |
| `/user/service/request-revision/:id` | POST | User requests revision |
| `/user/approval/request-revision/:id` | POST | User requests revision (approval) |

## Troubleshooting

### Status badge not showing correct color
1. Check if status-badges-new.css is loaded
2. Verify CSS class name matches (use hyphen: `in-progress` not `inprogress`)
3. Check browser console for CSS conflicts

### Filter dropdown missing new statuses
1. Check if status-handler.js is loaded
2. Verify script runs after DOM ready
3. Manually add to dropdown if auto-update fails

### Start Task button not appearing
1. Verify status is exactly "Queued" (case-sensitive in database)
2. Check JavaScript console for errors
3. Ensure alltasks.js includes `handleQueuedStatus()` function

### Status not changing when clicking Start Task
1. Check backend endpoint: `POST /unit/task/acknowledge/:id`
2. Verify route exists in routes/unit.js
3. Check browser network tab for 200 response
4. Ensure notificationService is working

## Testing Commands

```javascript
// Test status display
Object.keys(['Pending', 'Queued', 'In Progress', 'Approved', 'Completed'])
  .forEach(s => console.log(s, window.getStatusDisplay(s)));

// Test filter update
window.updateStatusFilterDropdown();

// Test badge creation
console.log(window.createStatusBadge('Queued', true));
console.log(window.createStatusBadge('In Progress', true));
```

## Browser Support
✅ Chrome/Edge (latest)
✅ Firefox (latest)  
✅ Safari (latest)
✅ Mobile browsers

---

**Last Updated**: November 16, 2025
**Status**: ✅ Production Ready
