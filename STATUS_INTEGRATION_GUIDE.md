# Status Display Integration Guide

## Quick Integration Steps

### 1. Add CSS to All Pages

Add this line to the `<head>` section of these files:
- `views/Admin/allrequestsadmin.ejs`
- `views/Admin/approvals.ejs`
- `views/Admin/services.ejs`
- `views/Unit/AllTasks.ejs`
- `views/Unit/TaskApprovals.ejs`
- `views/Unit/TaskServices.ejs`
- `views/User/ServiceRequest.ejs`
- `views/User/Requestapproval.ejs`
- `views/User/allRequestsUser.ejs`

```html
<link rel="stylesheet" href="/stylesheets/status-badges-new.css" />
```

### 2. Add JavaScript to All Pages

Add this line before the closing `</body>` tag:

```html
<script src="/javascripts/status-handler.js"></script>
```

### 3. Update Status Display in EJS Templates

Replace existing status badge code with this:

**OLD CODE (example):**
```ejs
<span class="status-badge"><%= request.status %></span>
```

**NEW CODE:**
```ejs
<% 
  const statusInfo = getStatusDisplay(request.status);
%>
<span class="status-badge <%= statusInfo.class %>">
  <%= statusInfo.icon %> <%= statusInfo.text %>
</span>
```

### 4. Add Helper Function to EJS Context

At the top of each EJS file (after `<body>`), add:

```html
<script>
  // Make status handler available in EJS templates
  function getStatusDisplay(status) {
    const statusLower = (status || '').toLowerCase().trim();
    const statusMap = {
      'pending': { class: 'status-badge-warning', icon: '⏳', text: 'Pending' },
      'queued': { class: 'status-badge-info', icon: '📥', text: 'Queued' },
      'in progress': { class: 'status-badge-primary', icon: '⚙️', text: 'In Progress' },
      'approved': { class: 'status-badge-success', icon: '✅', text: 'Approved' },
      'completed': { class: 'status-badge-success', icon: '✅', text: 'Completed' },
      'rejected': { class: 'status-badge-danger', icon: '❌', text: 'Rejected' },
      'for revision': { class: 'status-badge-warning', icon: '🔄', text: 'For Revision' },
      'archived': { class: 'status-badge-secondary', icon: '📦', text: 'Archived' }
    };
    return statusMap[statusLower] || { class: 'status-badge-secondary', icon: '❓', text: status };
  }
</script>
```

## Specific File Changes

### Admin Pages

#### allrequestsadmin.ejs
1. Add CSS link in `<head>`
2. Add JS script before `</body>`
3. Status filters will auto-update with new options

#### approvals.ejs
1. Add CSS link in `<head>`
2. Add JS script before `</body>`
3. Update status dropdown options:

```html
<select id="statusFilter" class="filter-input">
  <option value="">All Statuses</option>
  <option value="Pending">⏳ Pending</option>
  <option value="Queued">📥 Queued</option>
  <option value="In Progress">⚙️ In Progress</option>
  <option value="For Revision">🔄 For Revision</option>
  <option value="Approved">✅ Approved</option>
  <option value="Rejected">❌ Rejected</option>
</select>
```

#### services.ejs
Same as approvals.ejs, but also add:
- "Completed" option to status dropdown

### Unit Pages

#### AllTasks.ejs, TaskApprovals.ejs, TaskServices.ejs

1. Add CSS link in `<head>`
2. Add JS script before `</body>`
3. Update status badges in table rows to use new classes
4. Add "Start Task" button for Queued status:

```html
<% if (task.status === 'Queued') { %>
  <button class="btn-start-task" onclick="acknowledgeTask('<%= task._id %>', '<%= task.type %>')">
    ▶️ Start Task
  </button>
<% } else if (task.status === 'In Progress') { %>
  <span class="status-badge status-badge-primary">⚙️ In Progress</span>
<% } %>
```

5. Add JavaScript function for acknowledge:

```javascript
async function acknowledgeTask(taskId, taskType) {
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
      location.reload();
    } else {
      alert(data.message || 'Failed to acknowledge task');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
}
```

### User Pages

#### ServiceRequest.ejs, Requestapproval.ejs, allRequestsUser.ejs

1. Add CSS link in `<head>`
2. Add JS script before `</body>`
3. Add revision counter display:

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

4. Add "Request Revision" button:

```html
<% if ((request.type === 'Service Request' && request.status === 'Completed') || 
       (request.type === 'Request Approval' && request.status === 'Approved')) { %>
  <% if (request.revisionCount < 2) { %>
    <button class="btn-revision" onclick="openRevisionModal('<%= request._id %>', '<%= request.type %>')">
      🔄 Request Revision
    </button>
  <% } else { %>
    <button class="btn-revision-disabled" disabled>
      🔒 Revision Limit Reached
    </button>
    <p class="revision-limit-message">
      This task has reached its 2-revision limit.
    </p>
  <% } %>
<% } %>
```

## Testing Checklist

After implementing these changes:

- [ ] All status badges display with correct colors
- [ ] New statuses (Queued, In Progress) show properly
- [ ] Icons appear next to status text
- [ ] Filter dropdowns include new status options
- [ ] "Start Task" button appears on Queued tasks (Unit pages)
- [ ] "Request Revision" button appears on completed tasks (User pages)
- [ ] Revision counter displays correctly
- [ ] Status sorting works correctly

## CSS Classes Reference

- `status-badge-info` - Queued (amber/yellow)
- `status-badge-primary` - In Progress (blue)
- `status-badge-warning` - Pending, For Revision (amber)
- `status-badge-success` - Approved, Completed (green)
- `status-badge-danger` - Rejected (red)
- `status-badge-secondary` - Archived, Unknown (gray)

## Status Icons Reference

- ⏳ Pending
- 📥 Queued
- ⚙️ In Progress
- 🔄 For Revision
- ✅ Approved/Completed
- ❌ Rejected
- 📦 Archived

---

**Note:** The JavaScript file `status-handler.js` automatically updates filter dropdowns when the page loads, so existing dropdowns will get the new options automatically.
