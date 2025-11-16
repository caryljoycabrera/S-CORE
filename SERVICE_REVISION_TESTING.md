# Service Request Revision History - Testing Guide

## Overview
This guide covers comprehensive testing of the Service Request Revision History feature, which allows bidirectional communication between requestors and unit teams with file support and text formatting.

## Feature Summary
- **Unit Side**: Upload deliverables, complete service requests, view revision history
- **Requestor Side**: Review deliverables, request revisions with notes and files, view revision history
- **Both Sides**: Consistent revision timeline showing all interactions
- **Revision Limit**: Maximum 2 revisions per request

---

## Test Scenarios

### 1. Unit Side - Initial Deliverable Upload

**Prerequisites:**
- Login as a unit member
- Have at least one service request assigned in "In Progress" status

**Steps:**
1. Navigate to "All Tasks" page
2. Click on a service request to open the details modal
3. Verify the "Process Service" section is visible
4. Select file(s) to upload as deliverables (test with PDF, DOCX, XLSX, images)
5. Click "Upload Deliverables" button

**Expected Results:**
- ✅ Files upload successfully
- ✅ Status changes to "For Checking"
- ✅ Success message appears
- ✅ "Process Service" section disappears
- ✅ Revision history section appears on the right side
- ✅ Revision history shows entry: "Deliverable Submitted" with uploaded files
- ✅ Files are displayed with icons, names, and download links
- ✅ Modal expands to two-column layout

**File Type Testing:**
Test with these file types:
- [ ] PDF file
- [ ] Word document (.docx)
- [ ] Excel spreadsheet (.xlsx)
- [ ] PNG image
- [ ] JPEG image
- [ ] Multiple files at once (up to 10)

---

### 2. Requestor Side - Viewing Deliverables

**Prerequisites:**
- Login as the requestor who created the service request
- Unit has uploaded deliverables (status = "For Checking")

**Steps:**
1. Navigate to "My Requests" page
2. Find the service request and click to open details
3. View the revision history section on the right side

**Expected Results:**
- ✅ Modal displays in two-column layout
- ✅ Left column shows request details
- ✅ Right column shows revision history
- ✅ Revision history shows "Deliverable Submitted" entry
- ✅ Entry shows unit member's name and timestamp
- ✅ Uploaded files are displayed with proper icons
- ✅ Files can be downloaded by clicking the download button
- ✅ Files open correctly in browser/download based on type

**File Download Testing:**
For each file uploaded, verify:
- [ ] PDF files download correctly
- [ ] Word documents download correctly
- [ ] Excel files download correctly
- [ ] Images display/download correctly
- [ ] File names are preserved
- [ ] No file corruption

---

### 3. Requestor Side - Requesting Revision

**Prerequisites:**
- Service request in "For Checking" or "Completed" status
- Deliverables have been uploaded by unit

**Steps:**
1. Open service request details modal
2. Scroll to "Request for Revision" section
3. Click in the text editor
4. Test keyboard shortcuts:
   - Press `Ctrl+B` to toggle bold
   - Press `Ctrl+I` to toggle italic
   - Press `Ctrl+U` to toggle underline
5. Type revision notes with formatting
6. Click "Attach Files" and select files (optional)
7. Verify selected files appear in the file display area
8. Click "Submit Revision Request"

**Expected Results:**
- ✅ Keyboard shortcuts work correctly
- ✅ Text formatting applies/removes on shortcut press
- ✅ Selected files display with icons, names, and sizes
- ✅ Revision request submits successfully
- ✅ Success message appears
- ✅ Revision history reloads automatically
- ✅ New entry appears: "Revision Requested" with notes and files
- ✅ Form clears after successful submission
- ✅ Status changes to "For Revision"
- ✅ Modal closes and page refreshes

**Keyboard Shortcut Testing:**
- [ ] Ctrl+B toggles bold formatting
- [ ] Ctrl+I toggles italic formatting
- [ ] Ctrl+U toggles underline formatting
- [ ] Shortcuts work on selected text
- [ ] Shortcuts work on cursor position
- [ ] Multiple formats can be applied together

**Edge Cases:**
- [ ] Submit without text (should show error)
- [ ] Submit with only files (should show error for missing notes)
- [ ] Submit with text only (should work)
- [ ] Submit with text and files (should work)
- [ ] Select more than 10 files (browser/multer should limit)

---

### 4. Unit Side - Viewing Revision Request

**Prerequisites:**
- Requestor has submitted a revision request
- Status = "For Revision"

**Steps:**
1. Login as unit member
2. Navigate to "All Tasks"
3. Open the service request marked "For Revision"

**Expected Results:**
- ✅ Status badge shows "FOR REVISION"
- ✅ "Process Service" section is now visible again
- ✅ Revision history shows on the right
- ✅ Latest entry shows "Revision Requested"
- ✅ Entry displays requestor's name and timestamp
- ✅ Revision notes are displayed with proper HTML formatting
- ✅ Bold, italic, underline formatting preserved
- ✅ Attached files (if any) are shown
- ✅ Files can be downloaded
- ✅ Revision count indicator shows (e.g., "Revision #1")

---

### 5. Unit Side - Resubmit Deliverables

**Prerequisites:**
- Service request in "For Revision" status
- Revision request received from requestor

**Steps:**
1. Open the service request details
2. In "Process Service" section, select new/updated files
3. Click "Upload Deliverables"

**Expected Results:**
- ✅ Files upload successfully
- ✅ Status changes back to "For Checking"
- ✅ "Process Service" section hides again
- ✅ Revision history updates automatically
- ✅ New entry added: "Deliverable Submitted" with new files
- ✅ Timeline shows chronological order of all interactions

---

### 6. Unit Side - Complete Service Request

**Prerequisites:**
- Service request in "For Checking" status
- Deliverables uploaded

**Steps:**
1. Open service request details
2. Click "Complete Service" button
3. Confirm the action

**Expected Results:**
- ✅ Status changes to "Completed"
- ✅ Success message appears
- ✅ Revision history updates
- ✅ New entry added: "Service Completed"
- ✅ Status badge updates to "COMPLETED"
- ✅ Entry shows unit member's name and timestamp

---

### 7. Requestor Side - Second Revision Request

**Prerequisites:**
- First revision already used
- Service request back in "For Checking" or "Completed" status

**Steps:**
1. Open service request details
2. Request another revision following same steps as test #3
3. Verify revision count increments

**Expected Results:**
- ✅ Second revision request submits successfully
- ✅ Revision count shows "Revision #2"
- ✅ System notes indicate "1 revision remaining" or similar
- ✅ Status changes to "For Revision"

---

### 8. Revision Limit Testing

**Prerequisites:**
- Service request has already used 2 revisions
- Status = "For Checking" or "Completed"

**Steps:**
1. Open service request details
2. Attempt to request a third revision

**Expected Results:**
- ✅ "Request for Revision" section should be hidden OR disabled
- ✅ Error message appears if attempted: "This task has reached its 2-revision limit"
- ✅ User is advised to submit a new service request
- ✅ No further revisions can be submitted

---

### 9. Revision Timeline Consistency

**Prerequisites:**
- Service request with multiple interactions (uploads, revisions, completions)

**Steps:**
1. Open the same service request as both unit member and requestor
2. Compare the revision history timelines

**Expected Results:**
- ✅ Both sides show the same timeline entries
- ✅ Timestamps are identical
- ✅ Files are accessible from both sides
- ✅ Formatting is preserved in both views
- ✅ Entry order is chronological (oldest to newest)
- ✅ Each entry has proper visual indicators (colored badges)

**Visual Consistency:**
- [ ] Unit-initiated actions align to the right (blue)
- [ ] Requestor-initiated actions align to the left (green)
- [ ] File cards have consistent styling
- [ ] Text formatting displays correctly
- [ ] Timestamps are in readable format

---

### 10. File Handling Edge Cases

**Test File Sizes:**
- [ ] Very small file (< 1KB)
- [ ] Medium file (~500KB)
- [ ] Large file (~5MB)
- [ ] File at upload limit (10MB)
- [ ] File exceeding limit (should reject)

**Test File Names:**
- [ ] Simple filename (test.pdf)
- [ ] Filename with spaces (test document.docx)
- [ ] Filename with special characters (test-file_v2.xlsx)
- [ ] Very long filename (>50 characters)
- [ ] Filename with multiple dots (test.v1.2.pdf)

**Test File Types:**
- [ ] Supported types (PDF, DOC, DOCX, XLS, XLSX, PNG, JPEG, JPG)
- [ ] Unsupported type (should reject, e.g., .exe, .zip)

---

### 11. Error Handling

**Test Error Scenarios:**

1. **Network Failure During Upload:**
   - [ ] Disconnect internet before clicking upload
   - [ ] Verify error message displays
   - [ ] Verify form doesn't clear
   - [ ] Verify can retry after reconnecting

2. **Unauthorized Access:**
   - [ ] Try to access another user's service request
   - [ ] Verify 403/404 error
   - [ ] Verify no data leakage

3. **Invalid Request State:**
   - [ ] Try to upload deliverables on "Queued" request
   - [ ] Verify error message
   - [ ] Try to request revision on "In Progress" request
   - [ ] Verify error or section hidden

4. **Missing Required Fields:**
   - [ ] Submit revision request with empty text
   - [ ] Verify validation error
   - [ ] Submit upload without selecting files
   - [ ] Verify validation error

---

### 12. Integration with Existing Features

**Conversation/Messages:**
- [ ] Verify revision requests add messages to conversation
- [ ] Check conversation history includes revision context
- [ ] Ensure conversation messages reference revision count

**Notifications:**
- [ ] Unit receives notification when revision requested
- [ ] Requestor receives notification when deliverables uploaded
- [ ] Notification content is accurate and helpful

**Status Changes:**
- [ ] Status updates correctly throughout workflow
- [ ] Status badges display correct colors
- [ ] Status persists across page reloads
- [ ] Table view reflects status changes without manual refresh

---

## Testing Checklist Summary

### Core Functionality
- [ ] Unit can upload deliverables
- [ ] Requestor can view deliverables
- [ ] Requestor can request revisions with text and files
- [ ] Unit can view revision requests
- [ ] Unit can resubmit deliverables
- [ ] Unit can complete service requests
- [ ] Revision limit enforced (max 2)

### User Experience
- [ ] Keyboard shortcuts work (Ctrl+B, Ctrl+I, Ctrl+U)
- [ ] File preview displays correctly
- [ ] Forms clear after submission
- [ ] Success/error messages are clear
- [ ] Modal layout adapts to content
- [ ] Timeline is easy to read

### Data Integrity
- [ ] Files upload without corruption
- [ ] Text formatting preserved
- [ ] Timestamps accurate
- [ ] Revision count tracks correctly
- [ ] Status updates persist

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

---

## Common Issues & Troubleshooting

### Issue: Files not displaying in revision history
**Check:**
- Browser console for 404 errors on file paths
- Uploads directory exists and has proper permissions
- File paths in database match actual filenames

### Issue: Keyboard shortcuts not working
**Check:**
- Quill editor initialized correctly
- Event listeners attached to correct element
- Browser doesn't override shortcuts (e.g., Ctrl+B for bookmarks)

### Issue: Revision history not loading
**Check:**
- API endpoint `/api/service-revision-history/:requestId` responding
- Request ID is valid
- Network tab for failed requests
- Console for JavaScript errors

### Issue: Modal not expanding to two columns
**Check:**
- CSS classes applied correctly (.has-revisions, .two-column)
- Viewport width sufficient for two-column layout
- No CSS conflicts overriding styles

---

## Performance Testing

**Large Volume Tests:**
- [ ] Request with 10+ revision history entries loads quickly
- [ ] Uploading 10 files simultaneously works smoothly
- [ ] Timeline with many formatted text entries renders properly
- [ ] No memory leaks after multiple modal open/close cycles

---

## Accessibility Testing

- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces revision entries properly
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible on interactive elements
- [ ] File download buttons accessible via keyboard

---

## Security Testing

- [ ] File uploads reject executable files
- [ ] XSS protection in revision notes (HTML sanitized)
- [ ] CSRF tokens present in forms (if applicable)
- [ ] Unauthorized users cannot access/modify requests
- [ ] File paths don't expose server structure

---

## Test Data Setup

### Sample Service Request
```javascript
{
  requestType: "Service",
  status: "In Progress",
  assignedUnits: ["Unit Team Name"],
  userId: "requestor_user_id",
  revisionCount: 0,
  revisionHistory: []
}
```

### Sample Users
- **Unit Member**: Can upload deliverables and complete requests
- **Requestor**: Can create requests and request revisions
- **Admin** (optional): Can view all requests

---

## Sign-Off

### Tested By: _______________
### Date: _______________
### Test Environment: _______________
### Browser/Version: _______________

### Results:
- [ ] All critical tests passed
- [ ] Minor issues documented (attach list)
- [ ] Major issues found (block deployment)
- [ ] Ready for production

---

## Notes:
_Use this space to document any observations, bugs found, or suggestions for improvement._

