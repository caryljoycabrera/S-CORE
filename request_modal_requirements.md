# Request Modal Requirements - Unified Specification

## Overview
Unify request modal implementations across user, unit, and admin sides into a single reusable JavaScript component. Each side retains its own styling but uses the same underlying code structure. Do not modify content inside modals—only extract and organize the component logic.

---

## 1. USER SIDE

### Pages
- All Requests
- Request Approvals  
- Request Service

### Functionality
**All Requests Page**
- ✅ Click individual requests to view details
- ✅ Click user profile to logout
- ✅ Right-side column displays: Chat, Revision History

**Request Approvals Page**
- ✅ Click individual requests to view details
- ✅ Click user profile to logout
- ✅ Right-side column displays: Chat, Revision History
- ❌ Remove chat from bottom-left position

**Request Service Page**
- ✅ Click individual requests to view details
- ✅ Click user profile to logout
- ✅ Right-side column displays: Chat, Revision History, Task Queued

---

## 2. UNIT SIDE

### Pages
- All Tasks
- Request Approvals
- Request Service

### Functionality
**All Tasks Page (Service Requests Modal)**
- ✅ Right-side column displays: Chat, Revision History, Task Queued
- ✅ Modal opens from service requests context

**Request Approvals Page**
- ✅ Right-side column displays: Chat, Revision History, Task Queued

**Request Service Page**
- ✅ Right-side column displays: Chat, Revision History, Task Queued

---

## 3. ADMIN SIDE

### Pages
- All Requests
- Request Approvals
- Request Service

### Functionality
**All Requests Page**
- ✅ Right-side column displays: Chat, Revision History
- ✅ Chat does NOT send notifications

**Request Approvals Page**
- ✅ Right-side column displays: Chat, Revision History
- ✅ Chat does NOT send notifications
- ✅ "Allow users to upload additional files" button/toggle (ONLY on this page, NOT on Request Service)

**Request Service Page**
- ✅ Right-side column displays: Chat, Revision History
- ✅ Display Unit Status (e.g., Queued, In Progress) — sourced from unit data
- ✅ Status is viewable to admin (read-only, no notifications)
- ✅ Chat does NOT send notifications
- ❌ NO "Allow users to upload additional files" button
- ❌ NO revision history currently (TO BE ADDED)

---

## 4. IMPLEMENTATION STRATEGY

### Create Unified Modal Component
**File:** `RequestModal.js` (or similar)

**Purpose:** Single reusable component for all request/service modals

**Features:**
- Accept configuration object specifying which columns/features to display
- Render based on role (user, unit, admin)
- Render based on page context (all requests, approvals, service)
- Do NOT modify or restructure content inside modals
- Retain individual styling per role/page

### Configuration Example
```javascript
const modalConfig = {
  role: 'admin', // 'user', 'unit', 'admin'
  page: 'serviceRequest', // 'allRequests', 'approvals', 'service'
  rightColumn: ['chat', 'revisionHistory', 'unitStatus'],
  features: {
    allowFileUpload: false,
    notifyOnChat: false
  }
}
```

### Integration Points
1. **User Side**: Import and use in All Requests, Request Approvals, Request Service
2. **Unit Side**: Import and use in All Tasks modal, Request Approvals, Request Service
3. **Admin Side**: Import and use in All Requests, Request Approvals, Request Service

---

## 5. DETAILED REQUIREMENTS CHECKLIST

### Right-Side Column Content Locations

| Page | User | Unit | Admin |
|------|------|------|-------|
| All Requests | Chat, Revision | Chat, Rev, Task Q | Chat, Revision |
| Request Approvals | Chat, Revision | Chat, Rev, Task Q | Chat, Revision |
| Request Service | Chat, Rev, Task Q | Chat, Rev, Task Q | Chat, Revision, Unit Status |

### Feature Toggles

| Feature | User | Unit | Admin |
|---------|------|------|-------|
| Allow File Upload | No | No | Approvals Only |
| Chat Notifications | Yes | Yes | No |
| Unit Status Visible | No | Yes | Yes |

### Bug Fixes Required

- [ ] **User All Requests**: Ensure clicking on profile works for logout
- [ ] **User Request Approvals**: Remove chat from bottom-left, move to right column
- [ ] **User Request Service**: Add Task Queued to right column
- [ ] **Unit All Tasks Modal**: Populate right-side column with Chat, Revision, Task Queued
- [ ] **Admin Request Service**: Add Revision History (currently missing)
- [ ] **Admin Request Service**: Add Unit Status indicator
- [ ] **Admin Chat**: Disable notifications across all pages
- [ ] **All Pages**: Ensure individual request details are clickable
- [ ] **All Pages**: Ensure profile/logout is accessible

---

## 6. MIGRATION NOTES

- Extract existing modal logic without changing display content
- Map each page's current modal behavior to the unified component
- Use conditional rendering based on configuration
- Preserve existing CSS/styling for each role
- Test each combination (role + page + features) before deployment