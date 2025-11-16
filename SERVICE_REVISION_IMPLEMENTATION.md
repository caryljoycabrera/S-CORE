# Service Request Revision History - Implementation Guide

## Overview
This document provides a technical overview of the Service Request Revision History feature implementation, detailing the architecture, code structure, and integration points.

---

## Architecture

### Database Schema

**ServiceRequest Model** (`models/ServiceRequest.js`)
```javascript
revisionHistory: [{
  requestedBy: ObjectId,      // User who made the request (requestor)
  respondedBy: ObjectId,      // User who responded (unit member)
  requestedAt: Date,          // When revision was requested
  respondedAt: Date,          // When deliverable was submitted/completed
  revisionNotes: String,      // Requestor's revision request notes
  responseNotes: String,      // Unit's response notes (if any)
  revisionFiles: [String],    // Files attached by requestor
  responseFiles: [String],    // Files attached by unit
  deliverableFiles: [String], // Deliverable files from unit
  status: String,             // for_revision, for_checking, completed
  type: String                // revision_requested, deliverable_submitted, completed
}]
```

---

## Backend Implementation

### API Endpoints

#### 1. Get Service Revision History
**Route:** `GET /api/service-revision-history/:requestId`  
**File:** `routes/api.js`  
**Purpose:** Fetch formatted revision history for display

```javascript
router.get('/api/service-revision-history/:requestId', async (req, res) => {
  // 1. Find service request by ID
  // 2. Populate requestedBy and respondedBy user data
  // 3. Build revision array with formatted entries
  // 4. Return JSON response
});
```

**Response Format:**
```javascript
{
  success: true,
  revisions: [
    {
      requestedBy: { name, role },
      respondedBy: { name, role },
      requestedAt: Date,
      respondedAt: Date,
      revisionNotes: String,
      responseNotes: String,
      revisionFiles: [String],
      responseFiles: [String],
      deliverableFiles: [String],
      status: String,
      type: String
    }
  ]
}
```

---

#### 2. Upload Deliverables
**Route:** `POST /unit/task/upload/:id`  
**File:** `routes/unit.js`  
**Middleware:** `upload.array('deliverables', 10)`

```javascript
router.post('/unit/task/upload/:id', upload.array('deliverables', 10), async (req, res) => {
  // 1. Validate request and user authorization
  // 2. Save uploaded files
  // 3. Update status to "For Checking"
  // 4. Add entry to revisionHistory
  await request.revisionHistory.push({
    respondedBy: userId,
    respondedAt: new Date(),
    deliverableFiles: filenames,
    status: 'for_checking',
    type: 'deliverable_submitted'
  });
  // 5. Save and return success
});
```

---

#### 3. Complete Service Request
**Route:** `POST /unit/task/complete/:id`  
**File:** `routes/unit.js`

```javascript
router.post('/unit/task/complete/:id', async (req, res) => {
  // 1. Validate request and authorization
  // 2. Update status to "Completed"
  // 3. Add completion entry to revisionHistory
  await request.revisionHistory.push({
    respondedBy: userId,
    respondedAt: new Date(),
    status: 'completed',
    type: 'completed'
  });
  // 4. Send notifications
  // 5. Save and return success
});
```

---

#### 4. Request Revision
**Route:** `POST /user/service/request-revision/:id`  
**File:** `routes/user.js`  
**Middleware:** `upload.array('revisionFiles', 10)`

```javascript
router.post('/user/service/request-revision/:id', upload.array('revisionFiles', 10), async (req, res) => {
  // 1. Validate request ownership
  // 2. Check status (must be Completed or For Checking)
  // 3. Enforce revision limit (max 2)
  // 4. Validate revision notes
  // 5. Increment revisionCount
  // 6. Update status to "For Revision"
  // 7. Add entry to revisionHistory
  await request.revisionHistory.push({
    respondedBy: userId,
    respondedAt: new Date(),
    responseNotes: revisionNotes,
    responseFiles: filenames,
    status: 'for_revision',
    type: 'revision_requested'
  });
  // 8. Add to conversation
  // 9. Send notifications
  // 10. Save and return success
});
```

---

## Frontend Implementation

### Unit Side (`public/javascripts/ejs/Unit/alltasks.js`)

#### Load Service Revision History
```javascript
async function loadServiceRevisionHistory(requestId) {
  // 1. Fetch revision history from API
  const response = await fetch(`/api/service-revision-history/${requestId}`);
  const result = await response.json();
  
  // 2. Filter relevant revisions for unit side
  const unitRevisions = result.revisions.filter(rev => 
    rev.type === 'deliverable_submitted' || 
    rev.type === 'completed' || 
    rev.type === 'revision_requested'
  );
  
  // 3. Render timeline
  unitRevisions.forEach((revision, index) => {
    const entry = createServiceRevisionEntry(revision, index, unitRevisions.length);
    historyTimeline.appendChild(entry);
  });
  
  // 4. Show/hide process service panel based on status
  if (hasSubmittedDeliverable) {
    processServicePanel.style.display = 'none';
  }
  
  // 5. Adjust modal layout to two-column
  modalBody.classList.add('two-column');
}
```

#### Create Revision Entry
```javascript
function createServiceRevisionEntry(revision, index, total) {
  const entry = document.createElement('div');
  entry.className = 'revision-conversation-item';
  
  // Determine alignment based on action type
  const isUnitAction = revision.type === 'deliverable_submitted' || revision.type === 'completed';
  const alignment = isUnitAction ? 'right' : 'left';
  entry.classList.add(`align-${alignment}`);
  
  // Build entry HTML with:
  // - Revision number badge
  // - User name and timestamp
  // - Revision/response notes with formatting
  // - File attachments with download buttons
  // - Status indicator
  
  return entry;
}
```

#### Upload Deliverables Enhancement
```javascript
async function uploadDeliverables() {
  // ... existing upload logic ...
  
  if (response.ok && result.success) {
    // Reload revision history after upload
    if (currentRequestType === 'Service') {
      loadServiceRevisionHistory(currentRequestId);
    }
  }
}
```

---

### Requestor Side (`views/User/allRequestsUser.ejs`)

#### Load Service Revision History
```javascript
async function loadServiceRevisionHistory(requestId) {
  // 1. Fetch revision history from API
  const response = await fetch(`/api/service-revision-history/${requestId}`);
  const result = await response.json();
  
  // 2. Filter revisions for requestor perspective
  const requestorRevisions = result.revisions;
  
  // 3. Render timeline
  requestorRevisions.forEach((revision, index) => {
    const entry = createServiceRevisionEntry(revision, index, requestorRevisions.length);
    historyTimeline.appendChild(entry);
  });
  
  // 4. Show revision request form if applicable
  if (canRequestRevision) {
    initializeServiceRevisionForm();
  }
  
  // 5. Adjust modal layout
  modalBody.classList.add('two-column');
}
```

#### Initialize Revision Request Form
```javascript
// Initialize Quill editor for revision notes
serviceRevisionQuill = new Quill('#serviceRevisionEditor', {
  theme: 'snow',
  placeholder: 'Describe what needs to be revised or improved...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }
});

// Add keyboard shortcuts
const serviceEditor = document.querySelector('#serviceRevisionEditor');
serviceEditor.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault();
    const format = serviceRevisionQuill.getFormat();
    serviceRevisionQuill.format('bold', !format.bold);
  }
  // Similar for Ctrl+I and Ctrl+U
});
```

#### Handle Revision Request Submission
```javascript
async function handleServiceRevision() {
  // 1. Validate Quill content
  const revisionText = serviceRevisionQuill.root.innerHTML;
  if (!revisionText || revisionText.trim() === '<p><br></p>') {
    showAlert('error', 'Please describe what needs to be revised');
    return;
  }
  
  // 2. Build FormData with text and files
  const formData = new FormData();
  formData.append('revisionNotes', revisionText);
  
  const filesInput = document.getElementById('serviceRevisionFiles');
  if (filesInput && filesInput.files.length > 0) {
    for (let i = 0; i < filesInput.files.length; i++) {
      formData.append('revisionFiles', filesInput.files[i]);
    }
  }
  
  // 3. Submit to backend
  const response = await fetch(`/user/service/request-revision/${currentConversationId}`, {
    method: 'POST',
    body: formData
  });
  
  // 4. Handle response
  if (result.success) {
    serviceRevisionQuill.setContents([]);
    filesInput.value = '';
    document.getElementById('serviceRevisionFileDisplay').innerHTML = '';
    await loadServiceRevisionHistory(currentConversationId);
    setTimeout(() => {
      document.getElementById('detailsModal').style.display = 'none';
      location.reload();
    }, 1500);
  }
}
```

---

## File Handling

### Upload Configuration (`config/upload.js`)
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Allow specific file types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Invalid file type!');
    }
  }
});
```

### File Serving (`server.js`)
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### File Download in Frontend
```javascript
function createRevisionFileCard(file, index) {
  const fileCard = document.createElement('div');
  fileCard.className = 'revision-file-card';
  
  // Extract file extension for icon
  const fileExt = file.split('.').pop().toLowerCase();
  const icon = getFileIcon(fileExt);
  
  fileCard.innerHTML = `
    <div class="revision-file-icon">${icon}</div>
    <div class="revision-file-info">
      <div class="revision-file-name">${escapeHtml(file)}</div>
    </div>
    <a href="/uploads/${file}" download class="revision-file-download" 
       title="Download file">
      <i class="fas fa-download"></i>
    </a>
  `;
  
  return fileCard;
}
```

---

## UI/UX Details

### Modal Layout

**Two-Column Layout:**
- Left column: Request details and action forms
- Right column: Revision history timeline
- Triggered by `.two-column` class on modal body
- Triggered by `.has-revisions` class on modal content

**CSS Classes:**
```css
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.has-revisions {
  max-width: 1200px;
  width: 95vw;
}
```

### Timeline Styling

**Entry Alignment:**
- Unit actions (deliverable_submitted, completed): Right-aligned, blue theme
- Requestor actions (revision_requested): Left-aligned, green theme

**Components:**
- Revision number badge (e.g., "R1", "R2")
- User name and timestamp
- Message bubble with formatted text
- File attachment cards
- Status indicator badge

---

## Integration Points

### Notifications
- **Unit notified when:** Requestor requests revision
- **Requestor notified when:** Unit uploads deliverables or completes request
- Uses `notificationService.notifyUnitRevisionRequested()`

### Conversations
- Revision requests automatically add messages to conversation
- Message format: "🔄 **Revision Request #X**\n\n{notes}\n\n_Revisions remaining: Y_"

### Status Management
- Revision requests change status to "For Revision"
- Deliverable uploads change status to "For Checking"
- Completion changes status to "Completed"
- Status changes visible in real-time without page reload

---

## Validation & Business Rules

### Revision Limit
- Maximum 2 revisions per service request
- Enforced in backend route
- Tracked via `revisionCount` field
- Error message guides user to create new request if limit reached

### Status Requirements
- Revisions only allowed on "Completed" or "For Checking" requests
- Deliverable uploads only on "In Progress" or "For Revision" requests
- Completion only on "For Checking" requests

### Authorization
- Requestors can only request revisions on their own requests
- Unit members can only upload deliverables on assigned requests
- Verified via session userId and request ownership

---

## Helper Functions

### Display Formatted Text
```javascript
function displayFormattedText(htmlContent) {
  // Sanitize and display HTML content from Quill
  // Preserves bold, italic, underline, lists, links
  return htmlContent;
}
```

### Escape HTML
```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Get File Icon
```javascript
function getFileIcon(extension) {
  const icons = {
    'pdf': '<i class="fas fa-file-pdf" style="color: #e74c3c;"></i>',
    'doc': '<i class="fas fa-file-word" style="color: #2c3e50;"></i>',
    'docx': '<i class="fas fa-file-word" style="color: #2c3e50;"></i>',
    'xls': '<i class="fas fa-file-excel" style="color: #27ae60;"></i>',
    'xlsx': '<i class="fas fa-file-excel" style="color: #27ae60;"></i>',
    'png': '<i class="fas fa-file-image" style="color: #3498db;"></i>',
    'jpg': '<i class="fas fa-file-image" style="color: #3498db;"></i>',
    'jpeg': '<i class="fas fa-file-image" style="color: #3498db;"></i>'
  };
  return icons[extension] || '<i class="fas fa-file" style="color: #95a5a6;"></i>';
}
```

---

## Debugging Tips

### Console Logging
Look for these console prefixes:
- `[Service]` - Service revision specific logs
- `🔍 [AllRequests]` - General request processing logs

### Common Issues

**Revision history not loading:**
```javascript
// Check in browser console:
console.log('[Service] API Response:', result);
console.log('[Service] Filtered revisions:', revisions);
```

**Files not displaying:**
```javascript
// Verify file paths:
console.log('File path:', `/uploads/${filename}`);
// Check network tab for 404s on file requests
```

**Quill not initializing:**
```javascript
// Check if container exists:
const container = document.querySelector('#serviceRevisionEditor');
console.log('Quill container:', container);
```

---

## Future Enhancements

Potential improvements to consider:
1. **Inline file preview** - Show PDF/image previews in modal
2. **Version comparison** - Highlight changes between deliverable versions
3. **Batch downloads** - Download all files in a revision as ZIP
4. **Rich notifications** - Include file previews in notification emails
5. **Revision templates** - Common revision request templates for quick use
6. **Auto-save drafts** - Save revision request drafts automatically
7. **Revision analytics** - Track revision patterns for process improvement
8. **Mobile optimization** - Responsive design for mobile devices

---

## Dependencies

### Backend
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **multer** - File upload middleware
- **express-session** - Session management

### Frontend
- **Quill.js** (v1.3.6) - Rich text editor
- **Font Awesome** - Icons for files and UI elements
- **Vanilla JavaScript** - No additional frameworks

### Database
- **MongoDB** - Document database for flexible schema

---

## Deployment Checklist

Before deploying to production:

- [ ] Verify uploads directory exists with proper permissions
- [ ] Test file upload limits (10MB per file)
- [ ] Verify all file types download correctly
- [ ] Test keyboard shortcuts in target browsers
- [ ] Verify notification emails send properly
- [ ] Test revision limit enforcement
- [ ] Check authorization on all endpoints
- [ ] Verify status transitions work correctly
- [ ] Test mobile responsiveness
- [ ] Validate XSS protection in revision notes
- [ ] Check performance with large file uploads
- [ ] Verify database indexes on ServiceRequest queries

---

## Support & Maintenance

### Monitoring
- Watch for failed file uploads in server logs
- Monitor revision history API response times
- Track notification delivery success rates

### Backup
- Ensure uploads directory is included in backups
- Database backups include revisionHistory array data

### Updates
- Keep Quill.js updated for security patches
- Monitor multer for vulnerability updates
- Review file type whitelist periodically

---

## Code Locations Reference

| Component | File Path | Lines |
|-----------|-----------|-------|
| ServiceRequest Model | `models/ServiceRequest.js` | revisionHistory schema |
| API Endpoint | `routes/api.js` | `/api/service-revision-history/:requestId` |
| Upload Deliverables | `routes/unit.js` | `/unit/task/upload/:id` |
| Complete Request | `routes/unit.js` | `/unit/task/complete/:id` |
| Request Revision | `routes/user.js` | `/user/service/request-revision/:id` |
| Unit Frontend | `public/javascripts/ejs/Unit/alltasks.js` | loadServiceRevisionHistory() |
| Requestor Frontend | `views/User/allRequestsUser.ejs` | loadServiceRevisionHistory() |
| Upload Config | `config/upload.js` | Multer configuration |
| Timeline CSS | `public/stylesheets/ejs/Unit/alltasks-modal.css` | .revision-history-timeline |

---

## Version History

- **v1.0** - Initial implementation
  - Basic revision history tracking
  - File upload support
  - Revision limit enforcement
  - Keyboard shortcuts for text formatting
  - Two-column modal layout

