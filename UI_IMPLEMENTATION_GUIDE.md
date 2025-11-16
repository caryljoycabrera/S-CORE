# UI Implementation Guide - Queued Status & Revision Control

This guide is for frontend developers implementing the UI for the new workflow features.

---

## 1. User Request Pages - Request Revision Feature

### Location
- `views/User/ServiceRequest.ejs`
- `views/User/Requestapproval.ejs`
- `views/User/allRequestsUser.ejs`

### What to Add

#### A. Request Revision Button

**Show button when:**
- Service Request: `status === 'Completed'`
- Approval Request: `status === 'Approved'`

**Disable button when:**
- `revisionCount >= 2`

**Button HTML Example:**
```html
<% if ((request.type === 'Service Request' && request.status === 'Completed') || 
       (request.type === 'Request Approval' && request.status === 'Approved')) { %>
  <% if (request.revisionCount < 2) { %>
    <button class="btn-revision" onclick="openRevisionModal('<%= request._id %>', '<%= request.type %>')">
      🔄 Request Revision
    </button>
  <% } else { %>
    <button class="btn-revision-disabled" disabled title="Revision limit reached">
      🔒 Revision Limit Reached
    </button>
    <p class="revision-limit-message">
      This task has reached its 2-revision limit. For further changes, 
      please submit a new request and reference this one.
    </p>
  <% } %>
<% } %>
```

#### B. Revision Counter Display

**Show on all requests:**
```html
<% if (request.revisionCount > 0) { %>
  <div class="revision-badge">
    📝 Revision <%= request.revisionCount %> of 2
    <span class="revisions-remaining">
      (<%= 2 - request.revisionCount %> remaining)
    </span>
  </div>
<% } %>
```

#### C. Revision Modal

**Modal structure:**
```html
<div id="revisionModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Request Revision</h2>
      <button onclick="closeRevisionModal()">×</button>
    </div>
    <div class="modal-body">
      <p>Explain what needs to be changed:</p>
      
      <!-- Rich Text Editor (Quill) -->
      <div id="revisionEditor" style="height: 200px;"></div>
      
      <div class="revision-info">
        <p><strong>Note:</strong> You have <span id="revisionsRemaining"></span> revision(s) remaining.</p>
      </div>
    </div>
    <div class="modal-actions">
      <button onclick="closeRevisionModal()">Cancel</button>
      <button onclick="submitRevisionRequest()" class="btn-primary">Submit Revision Request</button>
    </div>
  </div>
</div>
```

#### D. JavaScript for Revision Request

```javascript
let revisionQuill;
let currentRequestId;
let currentRequestType;

function openRevisionModal(requestId, requestType) {
  currentRequestId = requestId;
  currentRequestType = requestType;
  
  // Initialize Quill editor if not already done
  if (!revisionQuill) {
    revisionQuill = new Quill('#revisionEditor', {
      theme: 'snow',
      placeholder: 'Describe what needs to be changed...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          ['link'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }]
        ]
      }
    });
  }
  
  // Clear previous content
  revisionQuill.setContents([]);
  
  document.getElementById('revisionModal').style.display = 'flex';
}

function closeRevisionModal() {
  document.getElementById('revisionModal').style.display = 'none';
}

async function submitRevisionRequest() {
  const revisionNotes = revisionQuill.root.innerHTML;
  
  if (!revisionNotes || revisionNotes.trim() === '<p><br></p>') {
    alert('Please provide revision notes');
    return;
  }
  
  const endpoint = currentRequestType === 'Service Request'
    ? `/user/service/request-revision/${currentRequestId}`
    : `/user/approval/request-revision/${currentRequestId}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionNotes })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      closeRevisionModal();
      location.reload(); // Refresh to show updated status
    } else {
      alert(data.message || 'Failed to submit revision request');
    }
  } catch (error) {
    console.error('Error submitting revision:', error);
    alert('An error occurred. Please try again.');
  }
}
```

---

## 2. Unit Dashboard - Queued Tasks Section

### Location
- `views/Unit/unitdashboard.ejs`

### What to Add

#### A. Queued Tasks Card

```html
<div class="stat-card queued-card">
  <div class="stat-icon">📥</div>
  <div class="stat-details">
    <h3>New Tasks (Queued)</h3>
    <p class="stat-number"><%= queuedRequests %></p>
    <p class="stat-description">Auto-assigned tasks waiting to be started</p>
  </div>
</div>
```

#### B. In Progress Tasks Card

```html
<div class="stat-card in-progress-card">
  <div class="stat-icon">⚙️</div>
  <div class="stat-details">
    <h3>In Progress</h3>
    <p class="stat-number"><%= inProgressRequests %></p>
    <p class="stat-description">Tasks currently being worked on</p>
  </div>
</div>
```

#### C. Update Workload Chart

Add queued and in-progress to your chart data:

```javascript
const workloadData = {
  labels: ['Queued', 'In Progress', 'For Revision', 'Completed'],
  datasets: [{
    data: [
      <%= queuedRequests %>, 
      <%= inProgressRequests %>, 
      <%= inReviewRequests %>, 
      <%= approvedRequests %>
    ],
    backgroundColor: ['#fbbf24', '#3b82f6', '#f59e0b', '#10b981']
  }]
};
```

---

## 3. Unit Task Pages - Acknowledge Button

### Location
- `views/Unit/AllTasks.ejs`
- `views/Unit/TaskServices.ejs`
- `views/Unit/TaskApprovals.ejs`

### What to Add

#### A. Acknowledge/Start Button

**Show for Queued tasks:**
```html
<% if (task.status === 'Queued') { %>
  <button class="btn-start-task" onclick="acknowledgeTask('<%= task._id %>', '<%= task.type %>')">
    ▶️ Start Task
  </button>
<% } else if (task.status === 'In Progress') { %>
  <span class="status-badge in-progress">⚙️ In Progress</span>
<% } %>
```

#### B. Status Badges

Update your status badge styling:

```css
.status-badge.queued {
  background-color: #fbbf24;
  color: #78350f;
}

.status-badge.in-progress {
  background-color: #3b82f6;
  color: #1e3a8a;
}

.status-badge.for-revision {
  background-color: #f59e0b;
  color: #78350f;
}
```

#### C. JavaScript for Acknowledge

```javascript
async function acknowledgeTask(taskId, taskType) {
  // Determine task type from request object
  const type = taskType.includes('Service') ? 'service' : 'approval';
  
  if (!confirm('Start working on this task?')) return;
  
  try {
    const response = await fetch(`/unit/task/acknowledge/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskType: type })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      location.reload(); // Refresh to show In Progress status
    } else {
      alert(data.message || 'Failed to acknowledge task');
    }
  } catch (error) {
    console.error('Error acknowledging task:', error);
    alert('An error occurred. Please try again.');
  }
}
```

---

## 4. Status Display Updates

### Update Everywhere Status is Shown

#### Status Text & Colors

```javascript
function getStatusDisplay(status) {
  const statusMap = {
    'Pending': { text: 'Pending Review', color: '#94a3b8', icon: '⏳' },
    'Queued': { text: 'Queued (New)', color: '#fbbf24', icon: '📥' },
    'In Progress': { text: 'In Progress', color: '#3b82f6', icon: '⚙️' },
    'For Revision': { text: 'For Revision', color: '#f59e0b', icon: '🔄' },
    'Approved': { text: 'Approved', color: '#10b981', icon: '✅' },
    'Completed': { text: 'Completed', color: '#10b981', icon: '✅' },
    'Rejected': { text: 'Rejected', color: '#ef4444', icon: '❌' }
  };
  
  return statusMap[status] || { text: status, color: '#94a3b8', icon: '❓' };
}
```

#### Usage in EJS

```html
<% 
  const statusInfo = getStatusDisplay(request.status);
%>
<span class="status-badge" style="background-color: <%= statusInfo.color %>">
  <%= statusInfo.icon %> <%= statusInfo.text %>
</span>
```

---

## 5. Sorting & Filtering Updates

### Update Status Priority

**For User Pages:**
```javascript
const statusPriority = {
  "queued": 1.5,        // Between pending and in progress
  "in progress": 2,      // High priority - being worked on
  "pending": 1,
  "for revision": 3,
  "approved": 4,
  "completed": 4,
  "rejected": 5,
  "archived": 6
};
```

**For Unit Pages:**
```javascript
const unitStatusPriority = {
  "queued": 1,           // Highest - needs to be started
  "for revision": 2,     // Second - needs attention
  "in progress": 3,      // Third - actively working
  "pending": 4,
  "approved": 5,
  "completed": 6
};
```

---

## 6. Conversation/Chat Display

### Show Revision Requests Prominently

```html
<% conversation.messages.forEach(message => { %>
  <div class="message <%= message.senderRole %>">
    <% if (message.content.includes('🔄 **Revision Request')) { %>
      <!-- Special styling for revision requests -->
      <div class="revision-request-message">
        <div class="revision-header">
          <span class="revision-icon">🔄</span>
          <strong>Revision Requested</strong>
        </div>
        <div class="revision-content">
          <%- message.content %>
        </div>
      </div>
    <% } else { %>
      <!-- Regular message -->
      <div class="message-content">
        <%- message.content %>
      </div>
    <% } %>
  </div>
<% }); %>
```

---

## 7. CSS Recommendations

```css
/* Revision Button */
.btn-revision {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-revision:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-2px);
}

.btn-revision-disabled {
  background: #e5e7eb;
  color: #9ca3af;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: not-allowed;
  font-weight: 600;
}

/* Revision Counter */
.revision-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.revisions-remaining {
  color: #78350f;
  font-weight: 400;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.status-badge.queued {
  background: #fbbf24;
  color: #78350f;
}

.status-badge.in-progress {
  background: #3b82f6;
  color: white;
}

/* Start Task Button */
.btn-start-task {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-start-task:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-2px);
}

/* Revision Request Message */
.revision-request-message {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.revision-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #78350f;
  font-weight: 700;
}

.revision-icon {
  font-size: 1.5rem;
}
```

---

## 8. Testing Checklist for UI

- [ ] Request Revision button appears on completed service requests
- [ ] Request Revision button appears on approved approval requests
- [ ] Button is disabled when revisionCount >= 2
- [ ] Modal opens with Quill editor
- [ ] Revision request submits successfully
- [ ] Page updates to show "For Revision" status
- [ ] Revision counter displays correctly
- [ ] Unit dashboard shows Queued tasks count
- [ ] Unit dashboard shows In Progress tasks count
- [ ] Start Task button appears on Queued tasks
- [ ] Clicking Start Task changes status to In Progress
- [ ] Status badges show correct colors for new statuses
- [ ] Task sorting respects new status priorities
- [ ] Revision request messages appear in conversation
- [ ] All notifications trigger correctly

---

## API Endpoints Reference

### User Endpoints
- `POST /user/service/request-revision/:id` - Request revision for service
- `POST /user/approval/request-revision/:id` - Request revision for approval

### Unit Endpoints
- `POST /unit/task/acknowledge/:id` - Start working on queued task

### Request Bodies
```javascript
// Acknowledge task
{
  taskType: 'service' | 'approval'
}

// Request revision
{
  revisionNotes: '<p>HTML from Quill editor</p>'
}
```

### Response Format
```javascript
{
  success: true|false,
  message: 'Human-readable message',
  revisionCount: 1,           // For revision requests
  revisionsRemaining: 1       // For revision requests
}
```

---

## Questions or Issues?

If you encounter any issues during implementation:
1. Check browser console for JavaScript errors
2. Check network tab for API response errors
3. Verify all required fields are passed in request bodies
4. Ensure Quill editor is properly initialized
5. Check that task IDs and types are correctly passed to functions

Good luck with the implementation! 🚀
