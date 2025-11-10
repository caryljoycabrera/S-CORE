# Profile Dropdown Fixes Summary

## Overview
Fixed the organization/office dropdown issues in user and admin profile pages, and added "add if not in list" functionality for non-student registration.

## Changes Made

### 1. User Profile Page (`views/profile.ejs`)
**Issues Fixed:**
- Dropdown not loading organization options
- Deletion of selected organizations not working

**Changes:**
- Added `<script src="/javascripts/shared-data.js"></script>` before the closing body tag
- Updated organization options to use `window.studentOrgsArray` from shared-data.js
- Updated office options to use `window.affiliationsArray` from shared-data.js
- Ensured click handlers are properly set up for tag removal

**Code Changes:**
```javascript
// Before:
const organizationOptions = [/* hardcoded array */];
const officeOptions = [/* hardcoded array */];

// After:
const organizationOptions = window.studentOrgsArray || [];
const officeOptions = window.affiliationsArray || [];
```

### 2. Admin Profile Page (`views/Admin/profileadmin.ejs`)
**Issues Fixed:**
- Dropdown not loading organization/office options
- Deletion of selected items not working

**Changes:**
- Added `<script src="/javascripts/shared-data.js"></script>` to load centralized data
- Updated inline openModal function to use shared arrays instead of hardcoded lists
- Both student organizations and office/department now use the centralized lists

**Code Changes:**
```javascript
// Before:
const organizationOptions = [/* hardcoded array */];
const officeOptions = [/* hardcoded array */];

// After:
const organizationOptions = window.studentOrgsArray || [];
const officeOptions = window.affiliationsArray || [];
```

### 3. Registration Page (`views/register.ejs`)
**New Feature:**
- Added "Can't find your office/department? Add it here" button for non-students
- Matches the existing functionality for student organizations

**Changes:**
- Added toggle button for custom office/department input
- Added custom office input field with add button
- Added counter display showing number of offices selected
- Added click-to-remove functionality on selected tags
- Implemented validation and feedback messages

**New Functions Added:**
- `updateOfficeCounter()` - Updates the counter display
- `setupOfficeClickHandlers()` - Enables click-to-remove functionality
- `toggleCustomOffice()` - Shows/hides custom office input
- `addCustomOffice()` - Adds custom office to the list
- `showOfficeFeedback()` / `hideOfficeFeedback()` - Shows feedback messages

**HTML Structure:**
```html
<!-- Office/Department Selection -->
<div class="input-group has-label office-selections">
  <label for="nonStudentOffice" class="input-label">
    Office/Department
    <span class="org-counter" id="officeCounter">No offices selected</span>
    <small>Tip: Click on any selected office/department to remove it</small>
  </label>
  <select name="affiliation[]" id="nonStudentOffice" multiple="multiple" required></select>
</div>

<!-- Toggle Button for Custom Office -->
<button type="button" class="toggle-org-button" onclick="toggleCustomOffice()">
  Can't find your office/department? Add it here
</button>

<!-- Hidden Custom Office Input -->
<div class="input-group has-label" id="customOfficeContainer" style="display: none;">
  <label for="otherOffice" class="input-label">Add Custom Office/Department</label>
  <div class="custom-org-input-wrapper">
    <input type="text" id="otherOffice" placeholder="Enter office/department name" maxlength="150" />
    <button type="button" id="addOfficeButton" class="add-org-button">+</button>
  </div>
  <div id="officeAddedFeedback" class="org-added-feedback"></div>
</div>
```

## Data Source
All organization and office/department lists now come from:
- **File:** `public/javascripts/shared-data.js`
- **Arrays:**
  - `studentOrgsArray` - List of all student organizations
  - `affiliationsArray` - List of all offices and departments

## Benefits
1. **Centralized Data Management:** All organization/office lists are in one place
2. **Consistent Data:** Same lists used across registration and profile pages
3. **Easy Updates:** Update once in shared-data.js, applies everywhere
4. **Better UX:** Users can now add custom organizations/offices if not in the list
5. **Improved Deletion:** Click-to-remove functionality works consistently

## Testing Checklist
- [x] User profile (student) - organization dropdown loads
- [x] User profile (student) - click to remove organizations
- [x] User profile (non-student) - office dropdown loads
- [x] User profile (non-student) - click to remove offices
- [x] Admin profile (student) - organization dropdown loads
- [x] Admin profile (student) - click to remove organizations
- [x] Admin profile (non-student) - office dropdown loads
- [x] Admin profile (non-student) - click to remove offices
- [x] Registration (student) - organization dropdown loads
- [x] Registration (student) - add custom organization
- [x] Registration (non-student) - office dropdown loads
- [x] Registration (non-student) - add custom office (NEW)

## Notes
- The click-to-remove functionality uses Select2's selection tags
- Custom additions are validated (min 3 characters, no duplicates)
- Feedback messages display for 2-3 seconds after actions
- All dropdowns support multiple selections
- Counter displays update dynamically

## Files Modified
1. `views/profile.ejs`
2. `views/Admin/profileadmin.ejs`
3. `views/register.ejs`

## No Changes Needed
- `public/javascripts/shared-data.js` - Already contains the correct data
- `public/javascripts/ejs/profileadmin.js` - Functions already defined
- Backend routes - No changes needed, already support arrays

---

**Date:** November 11, 2025
**Status:** ✅ Complete
