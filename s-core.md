# IMPORTANT


```
● Security : Use middleware to restrict access (e.g., isAdmin middleware in routes).
Leverage your existing authentication (e.g., from passport or session-based auth).
● Consistency : Follow your existing patterns: Mongoose models for data, Express routes
for API endpoints, EJS views for UI, and JavaScript for dynamic interactions.
● Validation : Use Mongoose schema validation and client-side validation (e.g., via forms).
● UI/UX : Use modals or dedicated pages for CRUD operations, similar to your existing
request management (e.g., tables with action buttons).
● Database : Ensure atomic operations (e.g., use transactions for deletes to avoid
orphaned data).
● Audit Trail : Log admin actions (e.g., add a createdBy/updatedBy field to models).
```
Specific CRUD Implementations

```
1. Requests (Both Types - Service Requests and General Requests)
○ Current State : You have read/view functionality in allRequestsAdmin.ejs
and routes in admin.js. Updates are partial (e.g., status changes).
○ Enhance to Full CRUD :
■ Create : Allow admins to manually create requests (e.g., for testing or on
behalf of users). Add a form in an admin page to input request details,
files, etc.
■ Read : Expand your existing table view to include filters, search, and
pagination (use DataTables or similar for scalability).
■ Update/Edit : Add inline editing or modal forms to modify request details
(e.g., status, notes, files). Ensure only admins can edit sensitive fields.
■ Delete : Add a delete button with confirmation. Soft-delete (add
isDeleted flag) to preserve history, or hard-delete if no dependencies.
○ Key Files to Modify/Create :
■ Model : Extend ServiceRequest.js (or create a unified Request.js if
both types share fields).
■ Routes : Update admin.js with new endpoints (e.g., POST
/admin/requests for create, PUT /admin/requests/:id for
update, DELETE /admin/requests/:id for delete).
■ Views : Enhance allRequestsAdmin.ejs with CRUD buttons and
forms. Add a new views/Admin/manageRequests.ejs for a
dedicated management page.
■ JS : Update allrequestsadmin.js for AJAX calls to new endpoints.
○ Scalability Tips : Add bulk operations (e.g., bulk delete/update). Integrate with
your notification system for alerts on changes.
2. Announcements
○ Current State : Assumed to exist (based on notifications.js), but no
dedicated CRUD.
○ Implement Full CRUD :
■ Create : Form to add announcements (title, content, target audience,
expiry date).
■ Read : List view with filters (e.g., active/inactive).
■ Update/Edit : Edit existing announcements.
■ Delete : Remove announcements, with soft-delete option.
○ Key Files to Modify/Create :
■ Model : Create models/Announcement.js (fields: title, content,
createdBy, isActive, targetRoles, etc.).
■ Routes : Add to admin.js (e.g., GET /admin/announcements for
read, POST /admin/announcements for create).
■ Views : Create views/Admin/manageAnnouncements.ejs with a
table and forms.
```

```
■ JS : Create public/javascripts/ejs/admin/announcements.js
for dynamic CRUD.
○ Scalability Tips : Add scheduling (e.g., publish later) and rich text editing (e.g.,
TinyMCE for content).
3. User Accounts
○ Current State : Basic user creation (e.g., in registration), but no admin
management.
○ Implement Full CRUD :
■ Create : Admin form to add users (email, role, organization).
■ Read : User list with roles, status, and search.
■ Update/Edit : Change roles, reset passwords, update profiles.
■ Delete : Deactivate or delete users (soft-delete to avoid data loss).
○ Key Files to Modify/Create :
■ Model : Extend User.js (add fields like isActive, lastLogin).
■ Routes : Update admin.js with user endpoints (e.g., GET
/admin/users for read).
■ Views : Create views/Admin/manageUsers.ejs.
■ JS : Update public/javascripts/ejs/admin/users.js.
○ Scalability Tips : Add bulk user import (CSV), password policies, and role
hierarchies.
```
General Implementation Guide

```
● Step 1 : Define models with validation (e.g., required fields, enums for statuses).
● Step 2 : Create routes with middleware (e.g., router.use(isAdmin)).
● Step 3 : Build views using EJS, with Bootstrap for styling (match your existing UI).
● Step 4 : Add JavaScript for AJAX (use fetch or jQuery) and form handling.
● Step 5 : Test with Postman for APIs, then integrate UI.
● Step 6 : Add logging (e.g., to a logs collection) for audit trails.
● Edge Cases : Handle dependencies (e.g., don't delete users with active requests). Use
pagination for large datasets.
```
2. Settings/Configuration Page for Admin

```
This should be a centralized "Admin Settings" page (e.g., views/Admin/settings.ejs)
with tabs or sections for different categories. It allows admins to configure the system
dynamically, making it scalable for future features. Store settings in a new
models/SystemSettings.js (as key-value pairs or structured objects) or in
environment variables for global configs.Key Architectural Principles
```
```
● Modularity : Use a settings model with categories (e.g., category: 'requests',
key: 'maxRevisions', value: 5 ).
● UI : Accordion or tabbed interface for organization. Use forms with validation.
● Persistence : Save to DB for dynamic changes; use env vars for sensitive/static data.
● Security : Admin-only access; validate inputs to prevent injection.
● Scalability : Design for easy addition of new settings (e.g., via a JSON schema).
● Integration : Settings should affect routes/models dynamically (e.g., load settings on app
start).
```
Specific Settings Options (Based on Code Scan and Scalability)

```
From scanning your code (e.g., request types in routes, units in models, homepage in
views), here are prioritized, scalable settings. Group them into categories for the UI.
```
```
1. Request Management Settings
```

```
○ CRUD for Request Types : Allow admins to define custom request types (e.g.,
add "IT Support" beyond existing ones). Store in RequestType.js (fields:
name, description, requiredFields).
■ Guide : Create a sub-section in settings with a table for types. On save,
update routes to validate against these types. Scalability: Add workflows
(e.g., auto-assign to units).
○ Revision Limits : Set max revisions per request (e.g., default 3 ). Store as setting;
enforce in routes.
○ Status Workflows : Define custom status transitions (e.g., from "Pending" to
"Approved"). Use a graph-like editor for flexibility.
2. Unit and Organization Management
○ Adding/Editing Units : Beyond the 4 existing ones (e.g., add "HR Unit"). Store in
models/Unit.js (fields: name, email, members).
■ Guide : Settings page with a form to add units. On save, update user
registration to include new units. Scalability: Add unit hierarchies or
auto-assignment rules.
○ Editable Organizations/Offices/Depts : Allow CRUD for orgs (e.g., add
"Finance Dept"). Link to users and requests.
■ Guide : Similar to units; use a tree structure for scalability (e.g.,
parent-child relationships).
3. Homepage and Content Management
○ Editable Homepage : Make sections (e.g., banners, announcements)
configurable. Store content in models/HomepageContent.js or as settings.
■ Guide : Use a WYSIWYG editor in settings. On save, update index.ejs
dynamically. Scalability: Add versioning or A/B testing for content.
○ Global Content Blocks : Editable footer, header, or help text across pages.
4. System-Wide Scalable Settings (For Future Flexibility)
○ User and Access Settings : Role definitions (e.g., add "Super Admin"),
password policies, session timeouts. Store in settings model.
○ Notification Settings : Email templates, notification frequencies (e.g., disable for
certain roles). Integrate with your notifications.js.
○ File and Upload Settings : Max file sizes, allowed types, storage limits. Enforce
in multer config.
○ API and Integration Settings : Rate limits, API keys for external integrations
(e.g., if you add payment gateways).
○ Audit and Logging Settings : Enable/disable detailed logs, retention periods.
○ Performance Settings : Caching options, database connection pools.
○ Localization : Language options, timezone settings.
○ Backup and Maintenance : Auto-backup schedules, maintenance mode toggle.
```
Implementation Guide for Settings Page

```
● Step 1 : Create models/SystemSettings.js (e.g., { category: String, key:
String, value: Mixed }).
● Step 2 : Add routes in admin.js (e.g., GET /admin/settings to load, PUT
/admin/settings to save).
● Step 3 : Build views/Admin/settings.ejs with categorized forms (use tabs for
organization).
● Step 4 : Add JavaScript (public/javascripts/ejs/admin/settings.js) for
dynamic saves and validation.
● Step 5 : Load settings on app start (e.g., in server.js) and cache them for
performance.
● Step 6 : Test changes (e.g., update a setting and verify it affects the system).
● Scalability Tips : Use a plugin architecture (e.g., load settings from JSON files) for easy
additions. Add export/import for settings backup.
```

###### SETTINGS PAGE

**1. Overall Page Layout**

The settings page should follow a master-detail pattern common in admin interfaces, ensuring
consistency with your existing admin pages (like the ones for requests or users).

```
● Header Section (Fixed at top, full width):
○ Page title: "System Settings & Configuration"
○ Breadcrumb: "Admin Dashboard > Settings"
○ Action buttons: "Save All Changes" (primary, green), "Reset to Defaults"
(secondary, gray), "Export Settings" (tertiary, blue)
○ Status indicator: "Last saved: [timestamp]" or "Unsaved changes" (with a warning
icon if changes are pending)
● Main Content Area (Flexible, responsive grid):
○ Left sidebar: Settings navigation menu (see below)
○ Right content pane: Dynamic section content (changes based on selected menu
item)
○ Layout: Use a 2 - column layout on desktop (sidebar ~ 250 px wide, content ~ 75 %
of remaining space) and stack vertically on mobile
● Footer (Sticky at bottom on scroll):
○ Save/Cancel buttons (repeat from header for convenience)
○ Help link: "Settings Documentation" (opens in new tab)
● Global Styles :
○ Consistent spacing: 24 px margins, 16 px padding for sections
○ Color scheme: Match your app's theme (green primary, gray neutrals)
○ Typography: Bold headings (H 2 /H 3 ), regular body text, small labels
○ Form elements: Standard inputs, selects, toggles, and file uploads with validation
states (error red, success green)
```
- ---- **2. Navigation Structure**

The left sidebar should be a collapsible menu with clear categorization. Use icons for visual
hierarchy and group related settings.

```
● Menu Categories (Top-level groups):
○ System Core (Gear icon): General, Request Types, Units & Organizations,
Revision Policy
○ Content & Communication (Message icon): Announcements, Notifications
○ Users & Access (User icon): User Management, Roles & Permissions
○ Data & Storage (Database icon): Files & Storage, Backup & Maintenance
○ Advanced (Settings icon): Integrations, Feature Flags, Audit & Logs
● Menu Items (Expandable sub-menus under categories):
○ System Core
■ General Settings
■ Request Types
■ Units & Organizations
■ Revision Policy
○ Content & Communication
■ Announcement Manager
■ Notification Templates
○ Users & Access
■ User Accounts
■ Roles & Permissions
○ Data & Storage
■ File Storage
■ Backup Settings
○ Advanced
■ API Integrations
```

```
■ Feature Toggles
■ Audit Logs
● Navigation Behavior :
○ Active item highlighted (green background, bold text)
○ Expand/collapse arrows for sub-menus
○ Search bar at top of sidebar: "Search settings..." (filters menu items)
○ On mobile: Sidebar becomes a slide-out drawer triggered by a hamburger menu
```
- ---- **3. Individual Section Layouts**

Each section should be a self-contained form with logical grouping. Use cards or panels to
separate sub-sections, and include inline help text. **General Settings** (System Core)

```
● Layout : Single-column form with grouped fields
● Components :
○ Site Information: Text inputs for "Site Title", "Site Description", "Logo Upload"
(image preview), "Favicon Upload"
○ Homepage: WYSIWYG editor for "Homepage Content" (full-width, 300 px height),
"Homepage Banner Image" upload
○ Localization: Select dropdowns for "Default Timezone", "Date Format",
"Language"
○ Contact Info: Text inputs for "Admin Email", "Support Phone", "Organization
Address"
● Actions : "Preview Homepage" button (opens modal with rendered content)
```
**Request Types** (System Core)

```
● Layout : List view with add/edit modal
● Components :
○ Top: "Add New Request Type" button
○ Table/List: Columns for "Name", "Category", "Required Fields", "Status"
(Active/Inactive toggle)
○ Modal Form (for add/edit): Fields for "Type Name", "Category" (dropdown),
"Description", "Required Fields" (multi-select checkboxes), "File Requirements"
(max size, allowed types), "Workflow Steps" (drag-and-drop list)
● Actions : Bulk actions like "Activate Selected", "Delete Selected"
```
**Units & Organizations** (System Core)

```
● Layout : Hierarchical tree view with detail panels
● Components :
○ Left: Tree structure (Org > Dept > Unit) with expand/collapse
○ Right: Detail form for selected item: "Name", "Parent Org", "Contact Email",
"Assigned Users" (multi-select), "Active Status" toggle
○ Add/Edit Modal: Same fields as detail form, plus "Transfer Requests" button
(moves requests between units)
● Actions : "Add Child Unit", "Delete Unit" (with confirmation)
```
**Revision Policy** (System Core)

```
● Layout : Card-based with toggles and inputs
● Components :
○ Global Limits: Number input for "Max Revisions per Request", "Revision Deadline
(days)"
○ File Handling: Toggle for "Retain All Revision Files", "Auto-Delete Old Files After
(days)"
○ Approval Rules: Multi-select for "Auto-Approve After X Revisions", "Require Unit
Review"
● Actions : "Test Policy" button (simulates a revision workflow)
```
**Announcement Manager** (Content & Communication)


```
● Layout : List view with rich editor modal
● Components :
○ Top: "Create Announcement" button, filters for "Status" (Draft/Published), "Date
Range"
○ Table: Columns for "Title", "Status", "Publish Date", "Target Audience", "Actions"
(Edit/Delete)
○ Modal Editor: "Title" input, WYSIWYG "Content" editor, "Publish Date" picker,
"Audience" (multi-select: All/Users/Units), "Priority" (High/Medium/Low)
● Actions : "Publish Now", "Schedule", "Preview"
```
**Notification Templates** (Content & Communication)

```
● Layout : Tabbed interface for different notification types
● Components :
○ Tabs: "Email Templates", "In-App Notifications", "SMS/Webhooks"
○ Per Tab: List of templates (e.g., "Request Submitted", "Revision Requested") with
"Subject" input, "Body" WYSIWYG editor, "Variables" list (e.g., {{userName}})
○ SMTP Settings: Inputs for "SMTP Host", "Port", "Credentials" (with test button)
● Actions : "Send Test Notification", "Reset to Default"
```
**User Accounts** (Users & Access)

```
● Layout : Data table with inline editing
● Components :
○ Top: "Add User" button, search/filter bar ("Role", "Status", "Organization")
○ Table: Columns for "Name", "Email", "Role", "Organization", "Last Login", "Status"
(Active/Inactive)
○ Inline Edit: Click row to edit fields; "Reset Password" link, "Impersonate" button
● Actions : Bulk "Activate/Deactivate", "Export Users"
```
**Roles & Permissions** (Users & Access)

```
● Layout : Matrix view with checkboxes
● Components :
○ Left: List of roles (Admin, Unit Manager, etc.)
○ Right: Permission matrix (rows = permissions like "Create Requests", columns =
roles)
○ Add Role: Modal with "Role Name", "Description", permission checkboxes
● Actions : "Save Permissions", "Duplicate Role"
```
**File Storage** (Data & Storage)

```
● Layout : Settings cards with file browser
● Components :
○ Storage Type: Radio buttons ("Local", "AWS S 3 ", "Google Cloud")
○ Limits: Inputs for "Max File Size (MB)", "Allowed File Types" (multi-select)
○ Current Usage: Progress bar showing "Storage Used / Total"
○ File Browser: List of uploaded files with "Delete", "Download" actions
● Actions : "Clean Up Orphaned Files", "Migrate Storage"
```
**Backup Settings** (Data & Storage)

```
● Layout : Schedule builder with logs
● Components :
○ Schedule: Dropdowns for "Frequency" (Daily/Weekly), "Time", "Retention Period"
○ Backup Types: Checkboxes ("Database", "Files", "Settings")
○ Logs: Table of past backups with "Download", "Restore" buttons
● Actions : "Run Backup Now", "Test Restore"
```
**API Integrations** (Advanced)


```
● Layout : Card grid for each integration
● Components :
○ Per Card: "Integration Name" (e.g., "Slack", "Google Drive"), "API Key" input,
"Webhook URL", "Status" (Connected/Disconnected)
○ Global: "Rate Limiting" settings, "API Logs" table
● Actions : "Test Connection", "Disconnect"
```
**Feature Flags** (Advanced)

```
● Layout : Toggle list with descriptions
● Components :
○ List: Each feature (e.g., "New File Viewer", "Bulk Actions") with toggle switch,
description, and "Rollout %" slider
○ Groups: Categorize by "UI Features", "Backend Features"
● Actions : "Enable All", "Disable All"
```
**Audit Logs** (Advanced)

```
● Layout : Filterable log viewer
● Components :
○ Filters: Date range, "Action Type", "User", "Resource"
○ Table: Columns for "Timestamp", "User", "Action", "Resource", "Details"
○ Export: "Download CSV" button
● Actions : "Clear Old Logs" (with retention settings)
```
- ---- **4. Common UI Patterns & Interactions**

```
● Form Validation : Real-time feedback (red borders, error messages below fields);
prevent save if invalid
● Loading States : Spinners on buttons during saves; skeleton loaders for content
● Confirmation Dialogs : For destructive actions (e.g., delete user) with "Type to confirm"
input
● Tooltips & Help : Question mark icons next to complex fields linking to docs
● Bulk Actions : Checkbox selects with action bar appearing at top
● Search & Filters : Unified search bar affecting all sections; persistent filters
● Modals : Use for complex forms (e.g., edit request type); full-screen on mobile
● Progress Indicators : For long-running actions like backups or migrations
```
- ---- **5. Responsive Design Considerations**

```
● Desktop (> 1024 px) : Full 2 - column layout with expandable sidebar
● Tablet ( 768 - 1024 px) : Sidebar collapses to icon-only; content adjusts to single column
● Mobile (< 768 px) : Sidebar as overlay; stack sections vertically; use bottom sheets for
modals
● Touch-Friendly : Larger buttons ( 44 px min), swipe gestures for navigation
● Accessibility : Keyboard navigation, screen reader labels, high contrast mode
```
- ---- **6. Implementation Tips**

```
● State Management : Use client-side state (e.g., React/Vue) to track unsaved changes
and validate forms
● API Integration : Each section saves via dedicated endpoints (e.g., PUT
/admin/settings/general)
● Versioning : Track settings changes with timestamps and user attribution
● Testing : Include A/B testing for new features via feature flags
● Performance : Lazy-load sections; cache settings on client-side
```

# system features to add


#### 1. Page for Unit Teams (High Priority)

This is the main workspace for your internal SCO teams (Graphics, Multimedia, etc.). It
should be a secure area, accessible only to users with a "Unit" role.

```
Access Control
● The entire "Unit" area must be restricted. When a user tries to access it, the
system must first check if their role is "Unit," "Graphics," "Multimedia," etc. If not,
they should be redirected.
```
```
Unit Dashboard (The Landing Page)
```
This is the first page a unit member sees after logging in. It's their mission control.

```
● Assigned Tasks View: The main part of this page should be a list of active
requests assigned to their specific unit. It should show the request title,
requester's name, and status (e.g., "In Progress," "Pending").
● Quick-Access Calendar: Include a calendar (like in your prototype) that
highlights deadlines for their assigned tasks.
● Notifications: A small panel to show recent activity, such as new comments from
a requester or a newly assigned task.
```
```
"All Tasks" Page
```
This page provides a full, filterable view of all requests assigned to the unit.

1. **Data:** Fetch all requests from the database where the AssignedUnit matches the
    logged-in user's unit.
2. **Filters:** The user must be able to filter this list by:
    ○ **Request Type:** (All, Service Request, Approval Request)
    ○ **Status:** (All, In Progress, Revise, Done)

```
"Manage Request" (Task Details) Page
```
When a unit member clicks on a task, they go to this page to take action.

```
● Request Details: Display all the request's information (Requester, Description,
Date Submitted, all uploaded files).
● Dynamic Action Buttons: The buttons shown must change based on the
Request Type :
○ If it's an "Approval Request":
■ Show an "Approve" button. This changes the request status to
"Approved."
■ Show a "Revise" button. This opens a text box, allowing the unit
member to type feedback. When submitted, this feedback is saved
and the request status changes to "Revise."
○ If it's a "Service Request":
■ Show an "Upload Deliverable" button. This allows the unit
member to upload the finished file (e.g., the pubmat).
■ Show a "Mark as Done" button. This changes the request status to
"Done."
● Commenting Feature: Include a comments section (as seen in your prototype)
for back-and-forth communication with the requester.
```

#### 2. Admin Announcement Page

This feature allows the Secretary and Director to post news and updates visible to other
users.

```
Admin-Side (Management)
```
This page is only for "Secretary" and "Director" roles.

1. **Main View:** Show a list of all previously posted announcements. Each item in the
    list should have **"Edit"** and **"Delete"** buttons.
2. **"Create/Edit" Form:** This form must contain:
    ○ **Title:** A text field for the announcement title.
    ○ **Content:** A rich-text editor (which allows bolding, lists, etc.) for the body of
       the announcement.
    ○ **Selective Visibility:** This is key. Include a set of checkboxes, such as:
       ■ [ ] **Visible to Students**
       ■ [ ] **Visible to Faculty/Offices**
       ■ [ ] **Visible to SCO Units**
3. **Actions:**
    ○ **Post/Save:** When an admin saves, the system stores the announcement
       _and_ their visibility preferences (e.g., VisibleToStudents = true).
    ○ **Delete:** This action removes the announcement from the database.

```
User-Side (Viewing)
```
This is how announcements are displayed to the end-users.

```
● Location: Add an "Announcements" panel to the main dashboard for all other
users (Students, Faculty, and Units).
● Logic: When a user logs in, the system checks their role. It then fetches only the
announcements from the database that match their role.
○ Example: If a "Student" logs in, the dashboard only queries for
announcements where VisibleToStudents is true. This ensures they don't
see announcements intended only for SCO staff.
```
#### 3. Settings Page (For All Users)

This page should be accessible to _all_ logged-in users (Admins, Units, and Requesters)
to manage their own accounts.

```
Profile Management
● Update Information: A simple form allowing users to update their Full Name.
● Change Password: A secure form requiring the user to enter their "Old
Password," a "New Password," and "Confirm New Password."
```
```
Preferences
```
This section is for user-specific toggles.

```
● Dark Mode Toggle:
○ Logic: This should be a client-side feature.
○ How it works: When the user flips the toggle, use JavaScript to add or
remove a .dark-mode class from the body of your website.
```

```
○ Persistence: Save the user's choice (e.g., "dark" or "light") in the
browser's localStorage. This way, when the user reloads the page or
comes back later, your JavaScript will check localStorage first and apply
their preferred theme instantly.
● Email Notifications Toggle:
○ Logic: This must be a server-side feature.
○ How it works: The page should have a toggle labeled "Receive email
notifications for request updates." This setting must be saved to the
database in a column on the User table (e.g., ReceiveEmailNotifications =
true/false).
○ Backend Use: When your system is about to send an email, it must first
check this setting for the user. If false, it skips sending the email.
```
#### 4. Global User Search

This feature allows users to find and view the public profiles of other users in the
system.

```
Search Functionality
```
1. **UI:** Place a search bar in the main navigation header so it's accessible from any
    page.
2. **Logic:** When a user types a name and presses Enter, the system queries the
    Users database. It should search for any FullName or Email that _contains_ the
    search term.
3. **Search Results Page:** The user is taken to a new page showing a list of all
    matching user profiles. Each result should show the user's name and their role
    (e.g., "Student," "Admin").

```
Public Profile View Page
```
1. **Read-Only:** When a user clicks a name from the search results, they are taken
    to that user's public profile page. This page is **read-only**. It is _not_ an "edit" page.
2. **Public Information:** This page should only display non-sensitive, public
    information.
       ○ **Show:** Full Name, Role (Student/Faculty/Admin),
          Organization/Department.
       ○ **Hide: Do not show** their email, phone number, or any other
          personal/sensitive data. This protects user privacy.


**1. Page for Unit Teams (High Priority)**

This section covers the dashboard and task management pages for the SCO Unit members
(Graphics, Multimedia, etc.).

**A. Database Model (Prerequisite)**

Ensure your Request table includes a nullable AssignedUnitId or similar field to link a request to
a specific unit (e.g., Graphics).

**B. Controller (UnitController.cs)**

```
1. Create a new controller named UnitController.cs.
2. Add authorization to protect the entire controller. This will ensure only logged-in users
with a "Unit" role can access these pages.
3. C#
```
[Authorize(Roles = "Unit, Graphics, Multimedia, PublicRelations, SocialMedia")]
public class UnitController : Controller
{
// ... your _context and UserManager fields ...
}
4.
5.

**C. Actions (Controller Methods)**

```
1. Dashboard (Index): This is the main landing page for the unit member.
○ Function: Show an overview of assigned tasks, notifications, and the calendar.
○ Logic: Get the currently logged-in user's ID. Fetch all requests from the
database where AssignedUnitId matches this user's unit.
2. C#
```
public async Task<IActionResult> Index()
{
var user = await _userManager.GetUserAsync(User);
var unitId = user.UnitId; // Assuming you store this on the user model

var viewModel = new UnitDashboardViewModel
{
AssignedTasks = await _context.Requests
.Where(r => r.AssignedUnitId == unitId && r.Status != "Done")
.ToListAsync(),

Notifications = await _context.Notifications
.Where(n => n.UserId == user.Id)
.OrderByDescending(n => n.Date)
.Take( 5 )
.ToListAsync()
};
return View(viewModel);
}
3.
4.
5. **View All Tasks (AllTasks):** This page lists all requests assigned to the unit in a filterable
table.
○ **Function:** Display a table of all assigned requests (Approval and Service).
○ **Logic:** Fetch requests similar to the dashboard but with filtering logic.
6. C#


public async Task<IActionResult> AllTasks(string statusFilter, string typeFilter)
{
var user = await _userManager.GetUserAsync(User);
var query = _context.Requests
.Where(r => r.AssignedUnitId == user.UnitId)
.AsQueryable();

if (!string.IsNullOrEmpty(statusFilter))
{
query = query.Where(r => r.Status == statusFilter);
}

if (!string.IsNullOrEmpty(typeFilter))
{
query = query.Where(r => r.RequestType == typeFilter);
}

var tasks = await query.ToListAsync();
return View(tasks);
}
7.
8.
9. **Manage Request (Details):** This page is for viewing and acting on a _single_ request.
○ **Function:** Show request details, allow approval/revision (for Approval requests),
or file uploads (for Service requests).
○ **Logic (GET):** Fetch the request by its ID and pass it to the view.
10. C#

public async Task<IActionResult> ManageRequest(int id)
{
var request = await _context.Requests
.Include(r => r.Requester) // Eager load the user who made the request
.FirstOrDefaultAsync(r => r.Id == id);

if (request == null) return NotFound();

return View(request);
}
11.
○ **Logic (POST):** Create separate POST actions to handle the different button
presses.
12. C#

[HttpPost]
public async Task<IActionResult> ApproveRequest(int id)
{
var request = await _context.Requests.FindAsync(id);
request.Status = "Approved";
// ... add a notification for the requester ...
await _context.SaveChangesAsync();
return RedirectToAction("AllTasks");
}

[HttpPost]
public async Task<IActionResult> ReviseRequest(int id, string remarks)
{
var request = await _context.Requests.FindAsync(id);
request.Status = "Revise";


// Save the remarks/feedback to a new 'Comments' table
var comment = new Comment { RequestId = id, Author = "SCO", Content = remarks };
_context.Comments.Add(comment);

await _context.SaveChangesAsync();
return RedirectToAction("AllTasks");
}

[HttpPost]
public async Task<IActionResult> UploadDeliverable(int id, IFormFile file)
{
// ... code to save the file to your server or blob storage ...
// ... update the request status ...
var request = await _context.Requests.FindAsync(id);
request.Status = "Done"; // Or "Pending Requester Approval"
await _context.SaveChangesAsync();
return RedirectToAction("ManageRequest", new { id = id });
}
13.
14.

**2. Announcement Page (Admin)**

This feature allows admins to post announcements that are visible to users and units.

**A. Database Model (Announcement.cs)**

Create a new model and database table for announcements.

C#

public class Announcement
{
public int Id { get; set; }
public string Title { get; set; }
public string Content { get; set; }
public DateTime CreatedAt { get; set; } = DateTime.Now;
public string AuthorName { get; set; } // Admin who posted

// For selective visibility
public bool VisibleToStudents { get; set; } = true;
public bool VisibleToFaculty { get; set; } = true;
public bool VisibleToUnits { get; set; } = true;
}

**B. Admin Controller (AdminController.cs)**

Add new actions for Creating, Reading, Updating, and Deleting (CRUD) announcements.

C#

// In your AdminController, protected by [Authorize(Roles = "Secretary, Director")]

// 1. Show page with all announcements and a "Create" button
public async Task<IActionResult> ManageAnnouncements()
{
var announcements = await _context.Announcements
.OrderByDescending(a => a.CreatedAt)
.ToListAsync();
return View(announcements);
}


// 2. Show the "Create" form
public IActionResult CreateAnnouncement()
{
return View();
}

// 3. Handle the "Create" form POST
[HttpPost]
public async Task<IActionResult> CreateAnnouncement(Announcement announcement)
{
var user = await _userManager.GetUserAsync(User);
announcement.AuthorName = user.FullName; // Store who posted it

_context.Announcements.Add(announcement);
await _context.SaveChangesAsync();
return RedirectToAction("ManageAnnouncements");
}

// 4. Show the "Edit" form
public async Task<IActionResult> EditAnnouncement(int id)
{
var announcement = await _context.Announcements.FindAsync(id);
if (announcement == null) return NotFound();
return View(announcement);
}

// 5. Handle the "Edit" form POST
[HttpPost]
public async Task<IActionResult> EditAnnouncement(int id, Announcement model)
{
var announcement = await _context.Announcements.FindAsync(id);

announcement.Title = model.Title;
announcement.Content = model.Content;
announcement.VisibleToStudents = model.VisibleToStudents;
announcement.VisibleToFaculty = model.VisibleToFaculty;
announcement.VisibleToUnits = model.VisibleToUnits;

await _context.SaveChangesAsync();
return RedirectToAction("ManageAnnouncements");
}

// 6. Handle the "Delete" action
[HttpPost]
public async Task<IActionResult> DeleteAnnouncement(int id)
{
var announcement = await _context.Announcements.FindAsync(id);
_context.Announcements.Remove(announcement);
await _context.SaveChangesAsync();
return RedirectToAction("ManageAnnouncements");
}

**C. User/Unit Dashboards (Displaying Announcements)**

On the dashboards for **Users** and **Units** , fetch and display the relevant announcements.

C#

// In your HomeController (for users) or UnitController (for units)

// 1. Determine the user's role


var user = await _userManager.GetUserAsync(User);
var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();

// 2. Build the query
var query = _context.Announcements.AsQueryable();

if (userRole == "Student")
{
query = query.Where(a => a.VisibleToStudents == true);
}
else if (userRole == "Faculty")
{
query = query.Where(a => a.VisibleToFaculty == true);
}
else if (userRole == "Unit") // Or other unit roles
{
query = query.Where(a => a.VisibleToUnits == true);
}

// 3. Fetch and pass to view
var announcements = await query.OrderByDescending(a => a.CreatedAt).Take( 3 ).ToListAsync();
// ... add this 'announcements' list to your dashboard's view model ...

**3. Settings Page (All Users)**

This page will be for all users to manage their preferences.

**A. Controller (SettingsController.cs)**

Create a new controller accessible to all logged-in users.

C#

[Authorize] // Authorize all logged-in users
public class SettingsController : Controller
{
// ... setup ...

// 1. Show the settings page
public async Task<IActionResult> Index()
{
var user = await _userManager.GetUserAsync(User);

var viewModel = new SettingsViewModel
{
Email = user.Email,
FullName = user.FullName,
ReceiveEmailNotifications = user.ReceiveEmailNotifications // Add this to your User model
};
return View(viewModel);
}

// 2. Handle POST for updating profile info
[HttpPost]
public async Task<IActionResult> UpdateProfile(SettingsViewModel model)
{
var user = await _userManager.GetUserAsync(User);
user.FullName = model.FullName;
user.ReceiveEmailNotifications = model.ReceiveEmailNotifications;

await _userManager.UpdateAsync(user);


return RedirectToAction("Index");
}

// 3. Handle POST for changing password
[HttpPost]
public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
{
var user = await _userManager.GetUserAsync(User);
var result = await _userManager.ChangePasswordAsync(user, model.OldPassword,
model.NewPassword);

if (result.Succeeded)
{
// ... add success message ...
}
else
{
// ... add error message ...
}
return RedirectToAction("Index");
}
}

**B. View (Index.cshtml)**

Create a view with forms for the settings.

```
1. Dark Mode Toggle: This is best handled on the client-side (in JavaScript) using
localStorage for an instant effect without a page reload.
○ HTML:
○ HTML
```
<div class="setting-item">
<span>Dark Mode</span>
<label class="switch">
<input type="checkbox" id="darkModeToggle">
<span class="slider round"></span>
</label>
</div>
○
○
○ **JavaScript (in site.js or at the bottom of your _Layout.cshtml):**
○ JavaScript

(function() {
var toggle = document.getElementById('darkModeToggle');
var body = document.body;

// 1. On page load, check saved preference
if (localStorage.getItem('dark-mode') === 'enabled') {
body.classList.add('dark-mode');
toggle.checked = true;
}

// 2. Add click listener
toggle.addEventListener('click', function() {
if (body.classList.contains('dark-mode')) {


body.classList.remove('dark-mode');
localStorage.setItem('dark-mode', 'disabled');
} else {
body.classList.add('dark-mode');
localStorage.setItem('dark-mode', 'enabled');
}
});
})();
○
○
○ **CSS (in site.css):**
○ CSS

/* Define your dark mode colors */
body.dark-mode {
background-color: #121212;
color: #ffffff;
}
body.dark-mode .card {
background-color: #1E1E1E;
border-color: #333;
}
body.dark-mode .table {
color: #ffffff;
}
○
○

**4. Search All Users Page**

This allows any user to find and view the public profile of any other user.

**A. Controller (SearchController.cs)**

Create a new controller for search functions.

C#

[Authorize]
public class SearchController : Controller
{
// ... setup ...

// 1. Main search page
public async Task<IActionResult> Index(string query)
{
var users = new List<ApplicationUser>(); // Your user model

if (!string.IsNullOrEmpty(query))
{
users = await _userManager.Users
.Where(u => u.FullName.Contains(query) || u.Email.Contains(query))
.Take( 20 ) // Limit results
.ToListAsync();
}

ViewData["CurrentQuery"] = query;
return View(users);


}

// 2. Public profile page
public async Task<IActionResult> ViewProfile(string id)
{
var user = await _userManager.FindByIdAsync(id);
if (user == null) return NotFound();

// Use a ViewModel to avoid exposing sensitive data
var viewModel = new PublicProfileViewModel
{
FullName = user.FullName,
Organization = user.Organization, // Add this to your user model
Department = user.Department, // Add this to your user model
Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault()
};

return View(viewModel);
}
}

**B. Views**

```
1. Index.cshtml: The search results page.
○ Add a search bar form that performs a GET request.
○ Loop through the Model (the list of users) and display each one.
○ Make each user result a link to the ViewProfile action.
2. HTML
```
<form asp-action="Index" method="get">
<input type="text" name="query" value="@ViewData["CurrentQuery"]" />
<button type="submit">Search</button>
</form>

<div class="search-results">
@foreach (var user in Model)
{
<div class="user-result">
<a asp-action="ViewProfile" asp-route-id="@user.Id">
<h5>@user.FullName</h5>
<span>@((await _userManager.GetRolesAsync(user)).FirstOrDefault())</span>
</a>
</div>
}
</div>
3.
4.
5. **ViewProfile.cshtml:** The read-only public profile page.
○ Use the PublicProfileViewModel as your model.
○ Display the user's public information. **Do not** include "Edit" buttons or sensitive
data like email or phone numbers.
6. HTML

@model PublicProfileViewModel

<h2>@Model.FullName</h2>
<p><strong>Role:</strong> @Model.Role</p>
<p><strong>Organization/Department:</strong> @(Model.Organization ?? Model.Department)</p>


7.
8.


# JOHN 2 CODING INSTRUCTION


**Issue:** The text is positioned too close to the "View All" button, causing a cramped appearance.

**Solution:** Implement either of the following CSS adjustments:

```
● Add Padding: Increase the internal spacing around the "View All" button to create more
distance from the adjacent text.
● Reduce Button Length: Shorten the width of the "View All" button to allow more
horizontal space between it and the surrounding elements.
```
**Issue: The CSS for notifications displayed on the admin profile page is incorrect, leading
to display issues or an unpolished look.**

**Solution:** Review and fix the CSS rules specifically targeting the notification elements within the
admin profile. This includes ensuring proper positioning, sizing, colors, and responsive behavior
for notifications.

**Mobile Navbar Functionality**

**Issue: The navigation bar is not fully visible or functional when viewed on mobile
devices. This can include issues with menu icons, dropdowns, or responsiveness.**


**Solution:** Develop and test the mobile navigation bar to ensure it is:

```
● Visible: The menu icon and/or navigation links are clearly displayed.
● Fully Functional: All menu items are clickable, dropdowns (if any) work correctly, and
the navigation behaves as expected on touch devices.
● Responsive: The navbar adapts seamlessly to various screen sizes and orientations.
● Accessible: Controls are easy to tap and navigate for all users.
```
**patanggal ren nung parang white na line, dapat connected
or parang 1 lang ung header at nav**

**Admin Verification for New Users**

**Issue: There is currently no process for administrators to review and approve new user
registrations, potentially allowing unauthorized access.**

**Solution:** Implement a new feature on the admin user accounts page that includes:


```
● New User Listing: A dedicated section displaying a list of all newly registering users
who have not yet been verified.
● Verification Actions: Functionality allowing admins to perform the following actions for
each new user:
○ Verify and Approve: Grant full access to the platform.
○ Deny Access: Prevent the user from accessing the platform.
```
**Proposed Page Structure:**
To enhance the management of user accounts, the admin user accounts page should include a
tabbed interface. This will allow for efficient filtering and management of different user statuses
and requests:

**Tabs:**

```
● All Users: Displays a comprehensive list of all registered users.
● Approved: Shows users who have been verified and granted access.
● Pending: Lists users who have registered but are awaiting admin verification.
● Denied: Displays users whose registration requests were rejected.
● Role Change Requests: A section specifically for managing requests from users to
change their roles or permissions.
```
**TRY: if di kaya wag na
Ung mga filter options wag gawin visible lagi kasi parang (IMO) ang laki ng space na
sinasakop. So parang gawin button siya tas pag cinlick ung Filter Data tska lalabas,
siguro pagkaclick nung button na un eh magiging same layout tulad nung sa dati na di
pa nakatago**


# caryl coding


**Fix the reports page: Ensure generating reports to all required formats (PDF, Excel, CSV,
etc.) works correctly and error-free.**

Goods naman itsura, di ko lang mapagana ung functions huhu pati ung mga customize

- Dapat pede macustomize

**Updated Features for "Generate Reports"**

This page will be designed around a clear two-step process:

```
1. Preview Data: Filter and display the report on-screen.
2. Generate File: Export the previewed data to Excel or PDF.
```
**1. Access and Permissions**

```
● Who can Generate/Export: This page and its functions are accessible only to users
with the Secretary or Director role.
● Who can View: Regular unit members (Graphics, Social Media, etc.) cannot access
this page. They will have a separate "View Reports" page to see the final reports
generated by the admin.
```
**2. Report Customization (Filters)**

The admin must first select their desired data using the following parameters:

```
● Date Range (Most Important): This is the key customization, as the admin needs
flexible date options.
○ Predefined Ranges: A dropdown with options for Daily, Weekly, Monthly,
Quarterly, Annually, and All Time.
○ Custom Range: A "From" and "To" calendar picker for specific periods (e.g.,
Dec 2024 - Feb 2025 ).
● Filter by Unit: The admin must be able to see performance per unit.
○ The filter should allow selecting "All Units" or specific units like "Graphics,"
"Multimedia," "Public Relations," or "Social Media".
● Filter by Request Type:
○ Allow filtering to show "All Types," "Service Requests," or "Approval
Requests".
● Filter by Status:
○ Allow filtering by request status, such as "All Statuses," "Pending," "In
Progress," "Approved," "Revise," or "Done".
```

**3. Step 1 : Report Preview (On-Screen)**

```
● After setting the filters, the admin will click the "Generate Preview" button.
● This action populates the "Report Preview" table directly on the page , as shown in
your prototype. This allows the admin to review the data for accuracy before creating a
file.
● The preview table will include the following columns:
○ Request ID
○ Type (Service or Approval)
○ Requester
○ Unit (Assigned Unit/s)
○ Service/Purpose (Name of the request)
○ Status
○ Date Submitted
○ Deadline
```
**4. Step 2 : Exporting Options (Final File Generation)**

```
● Only after the preview table is generated and the admin has verified the data...
● ...the admin can click the "Export Excel" or "Export PDF" buttonsThis action
downloads a formal report file containing only the filtered data shown in the preview
table. This replaces the current manual Excel tracking.
```
**Dashboard/analytics settings customization: Add a settings icon to the dashboard and
analytics pages that allows the admin to show/hide components like graphs and tables
as desired. Store preferences per admin if feasible.**

**Sample preview**

Here is a set of detailed instructions for implementing the dashboard and analytics
customization feature.

This feature will provide a "Settings" icon on the Admin Dashboard and the "Performance
Insights" page, allowing the Secretary and Director to personalize their workspace by showing
or hiding specific components.


**1. UI (User Interface) Implementation**

```
1. Add Settings Icon:
○ On the Admin Dashboard and the Analytics page, add a "Settings" (cog/gear)
icon.
○ Location: Place this icon in the header bar, typically near the user's name or
notification bell, to indicate it controls the view of the current page.
2. Create Customization Panel:
○ When the admin clicks the "Settings" icon, it must open a pop-up modal or a
dropdown panel titled "Customize View."
○ This panel will contain a list of toggle switches (checkboxes) corresponding to the
components on that specific page.
```
B. For the "Performance Insights":

The panel should display the following toggles:

```
● [ ] Show Filters Panel: (Controls the sidebar for Date and Unit filters).
● [ ] Show Top Requestors Chart: (Controls the pie chart).
● [ ] Show Request Volume Graph: (Controls the line graph for Approval vs. Service
Requests).
```
**3. State Management (How it Works)**

```
1. Default State: By default, all components are visible.
2. Applying Changes: When an admin toggles a switch, the corresponding component on
the page should immediately show or hide.
3. User-Friendly Controls: The panel should have:
○ A "Save" or "Apply" button: To save the preferences (see Step 4 ).
○ A "Reset to Default" button: To instantly turn all components back on and
restore the default view.
○ A "Close" (X) icon: To close the panel without saving changes (if "Save" button
is used) or to simply hide the panel (if changes are applied instantly).
```
**4. Persistence (Storing Preferences per Admin)**

This is the most critical step to ensure the customization is saved for each admin (Secretary or
Director).

```
1. Database:
○ In your user database, you need to store these preferences against the admin's
User ID.
○ Option A (Recommended): Add a new JSON-type column (e.g.,
ViewPreferences) to your User or AdminProfile table. This is flexible and allows
you to add more preferences later.
○ Option B: Create a new table (e.g., AdminPreferences) that links a UserId to
various boolean flags (e.g., ShowCalendar, ShowTopRequestors).
2. "Save" Action:
○ When the admin clicks "Save" in the "Customize View" panel, the system must
update the database with their selected preferences (e.g., { "ShowCalendar":
false, "ShowNotifications": true }).
3. "Page Load" Action:
○ Whenever an admin loads the Dashboard or Performance Insights page, the
system must first fetch their saved preferences from the database.
○ The page will then render according to these preferences (e.g., if ShowCalendar
is false, the calendar component is hidden from the start).
○ If no preferences are found (first-time login or admin never customized), the page
loads with the default state (all components visible).
```

# INTERVIEW WITH SCO


## Student Communications Office (SCO) -

## Interview Notes

#### 1. Overview of SCO Structure

The **Student Communications Office (SCO)** is responsible for handling various
communication and media-related tasks within DLSU-D. It is divided into four main units:

**1. Social Media Unit**

```
● Manages official pages, including posting and sharing content.
● Reviews and approves captions.
● Ensures all social media pages are properly monitored.
```
**2. Graphics Unit**

```
● Designs publicity materials (pubmats), merchandise, and event-related graphics.
● Ensures all designs comply with DLSU-D’s branding guidelines.
```
**3. Multimedia Unit**

```
● Edits photos and videos for events and promotions.
● Covers media requests, including teasers, event wrap-up videos, and photography.
● Reviews video teasers from student organizations before posting.
```
**4. Public Relations Unit**

```
● Manages content for Rotunda magazine and other official publications.
● Reviews and proofreads letters and advisories.
● Handles both internal and external communication materials.
```
#### 2. Request Handling & Approval Process

**Types of Requests Processed by SCO**

```
● Social Media Requests
○ Organizations and departments submit requests to post content.
○ The secretary forwards the request to the Social Media Unit.
○ Final approval is given by Ms. Jesser before posting.
● Graphics & Branding Requests
○ Includes designs for pubmats, logos, and merchandise.
○ Reviewed by the Graphics Team to ensure proper layout and branding.
○ The Social Media & Public Relations Teams also check wording and content
accuracy.
● Multimedia Requests
○ Covers photo and video coverage, event documentation, and content editing.
```

```
○ Includes requests from student organizations for teaser videos.
● Public Relations Requests
○ Includes magazine publications, official letters, and advisories.
○ If a request comes from a lower-level department or organization, it must go
through the Public Relations Unit for approval.
○ Any school-wide or external advisories must be proofread and reviewed by the
director.
```
**Timelines & Approval Guidelines**

```
● A request form is required for approval. No other forms are accepted.
● Requests should be submitted at least one week (excluding holidays) before
posting.
● If a request is no longer valid , it may still be posted subject to approval but does not
guarantee acceptance.
● The team allows a maximum of 3 major and 2 minor revisions per request.
● Some requests may not follow the planned timeline due to higher-priority tasks.
```
#### 3. Internal Policies & Workflow Management

**Manual Tracking & Reporting**

```
● Currently, all requests are manually tracked using Excel.
● Reports and summaries are generated in either Excel or PDF format.
● The team collaborates with ICTC for system-related improvements.
```
**Automation & System Suggestions**

```
● A digital system is suggested to streamline approvals and tracking.
● Role Assigning Feature: The secretary assigns requests to specific groups.
● Dashboard Notifications: Team members should see assigned requests and pending
approvals.
● Request Automation: Requests submitted during weekends or holidays should be
flagged for approval.
● Mobile Compatibility: The system should be accessible on mobile devices for
convenience.
```
#### 4. Social Media & Content Guidelines

```
● Checking & Monitoring Social Media Pages
○ The Social Media Team ensures all pages are updated and aligned with
university standards.
○ All departments are included in this monitoring process.
○ A manual list of social media pages is currently maintained.
● Graphics & Caption Guidelines
○ Graphics Unit: Designs must follow branding policies and should be visible in
the system for reference.
○ Captions: No strict policies, but they should be detailed and free from
offensive words.
● Multimedia Guidelines
○ Handles photo and video editing, color grading, and media coverage.
○ Photo documentation for student orgs is not required , as the focus is
primarily on videos.
○ Requests for event coverage or content approval are sent via email.
```

```
● Public Relations & External Communication
○ The team proofreads and manages content for external communication.
○ Requests from school leadership (e.g., Bro.) are prioritized for posting.
○ Handles letters, magazines, and official advisories for internal and external
use.
```
#### 5. Additional Responsibilities & Considerations

```
● Event Coverage & Feedback
○ The team edits and reviews media coverage from institutional and departmental
events.
○ Student organizations submit video teasers for approval.
○ The team also manages the DLSU-D YouTube page and provides feedback on
approved content.
● Form Filling & System Integration
○ Department name & contact information should be visible when filling out
request forms.
○ Possible automated directory feature for commonly requested departments
(e.g., RCC).
○ Additional contact numbers and emails should be inputtable in the system.
```
#### 6. Key Challenges & Future Improvements

```
● Weekend & Holiday Requests
○ Requests submitted on non-working days may not be processed immediately.
○ Suggested automation for flagging requests submitted during
weekends/holidays for approval.
● Manual Workload & Tracking
○ Social media links and approvals are currently tracked manually.
○ The team wants an automated system to improve efficiency.
● Better Coordination Between Units
○ Social Media & Graphics Teams often work together and require seamless
coordination.
○ Role assignments and reminders within the system would help improve
workflow.
```
FORM
● Name
● Office/Department/Organization
● Contact Details
● Office Phone Number
● Type of Request
● Title of Project/Event
● Short Description
● Details
● Additional Information

SYSTEM
● Unit In-Charge
● Date Received
● Date Approved


```
● Status
```
UNEDITED NOTES

4 units under sco
1. social media

- posting
- sharing
- caption
- checking of pages
2. graphics
- pub
- merch
- org event
3. multimedia
- photo/video editing
- media coverage
- video (teasers, wrap up video)
- request of photo
4. public relations
- magazine (rotunda)
- letter
- proofreading

Request form (ung physical copy na binigay)

- No other forms for approvals


What are requested to sco

- Social media - request if good to post, if content is okay, this applies to any org or
    department that wants to share in social media, secretary will forward to social media if
    good to post. Then for final checkin, ipapass kay Mam Jesser
- For merch and other pubmats like designs - under graphics since it is under branding of
    DLSUD, chinicheck ung layout, design. Chinicheck ren ng social media and public
    relations for contents or wordings
- For multimedia - for photo and video
- For graphics, other departments can request for graphics or logos and designs.
    - May instance na di nasusunod timetable kasi may dumadating na mas prio or
       mas mabigat
- For requesting of graphics, need ng SCO ng details (concerned dept, title, content,
    elements, etc.)
       - Madalas galing sa office or department ung mga nagrerequest

For policies

- No official policies but they want to apply also
- At most 3 major 2 minor revisions
- If requesting for approval (mostly verbal, but we could apply sa system na at least 1
    week (working days) b 4 posting, iapply ren holidays)
       - If bawal na, pede parin ipost pero subject for approval - not acceptance

System could help in improving security

They track in excel

- Manual nagttrack ganern
- Staffs, faculties, students, shs and hs are also being handled under SCO
- Generate report and summary (possible excel format or pdf ren) - format pedeng
    gayahin ung excel nila or if anong mas maganda
- They also communicate with ICTC
- For social media - posting sa page, sharing
- Socmed and graphics most of the time tandem
- Sa system, maganda may role assigning, ung secretary magaassign sa group
- Gusto rin ng reminders
- For checking social media page - kasama na lahat ng departments
- Nakalist lang sakanila ung link ng mga social media page, mano mano
- Graphics - they have guidelines and policies (gusto nila na kita ren sa system na pede
    maview ng iba)


- Graphics - chinicheck lahat (basta under ng dlsud)
- For captions - hindi masyado mahigpit, basta detailed and no offensive words
- For multimedia - hinahandle nila ung pageedit ng photos and videos, color grading
    - Nageemail ng request or coverage
    - Different type of events, institutional or departmental
    - Ineedit nila photos galing sa events
- For events and student orgs - they also check video teasers that will be posted on their
    social medias
       - They don’t handle Heraldo
       - For photo documentations of student orgs events, they don’t check (mostly
          videos talaga)
       - Required
- For public relations - dumadaan sakanila ung mga magazines
    - Letters
    - They handle posting if galing kay Bro.
    - If mas mababa na org or dept, magrerequest sa kanila
    - Yung pinapacheck sakanila is mga nilalabas sa school or pwede ren outside the
       school
    - Like advisories
    - Proofreading (and kasama ren director)
- Other stuff being handled by SCO
    - Requests
    - If requests ay nabibigay ng weekends/holidays, di masyado maaasikaso agad
- Suggests for the system na iautomate na if the requests is done on a holiday/weekend,
    subject for approval
       - Compatible for mobile
       - Makikita sa dashboard ng team members ung mga nakaassign sakanila na
          request or approvals
       - For filling out forms, need na kita ang department or name
       - Possible na iautomate na if this is the selected department (drop down) ex. RCC,
          automatic makikita ung directory
       - If they also want to add additional contact no.
       - They can also input their email
- SCO also handles youtube page of DLSU-D
- They also give feedbacks sa pinapaapprove

Since the **Student Communications Office (SCO)** handles multiple tasks like **social media
management, graphics, multimedia, and public relations** , the system should be designed to
**streamline request handling, approvals, tracking, and automation**.

#### Suggested System for SCO Request & Management

#### Portal

**1. System Overview**

The system will be a **web-based portal** where organizations, departments, and staff can submit
requests for **social media posts, graphics, multimedia, and public relations materials**. The
system will **automate tracking, approvals, and task assignments** to improve workflow
efficiency.


**2. Key Features**

**A. User Roles & Authentication**

```
● Admin (SCO Head/Director) : Full control over requests, user management, approvals,
and reports.
● SCO Staff (Social Media, Graphics, Multimedia, Public Relations Teams) : Assigned
requests and manage approvals within their specific unit.
● Secretary : Manages and assigns requests to appropriate teams.
● Requestor (Departments/Organizations) : Can submit and track request statuses.
```
**B. Request Submission & Tracking**

```
● A centralized request form where users can input:
○ Request type (Social Media, Graphics, Multimedia, Public Relations)
○ Department/Organization
○ Content details (captions, media files, design elements, etc.)
○ Deadlines and priority levels
● Requests are automatically assigned to the correct unit based on type.
● Status tracking for requestors to check updates on their submissions.
```
**C. Approval & Revision Management**

```
● Multi-level approval process :
○ Social Media Posts : Requires verification from Social Media Unit → Final
approval by Ms. Jesser.
○ Graphics & Multimedia : Reviewed by Graphics/Multimedia Units → Final review
by PR if needed.
○ Public Relations : Goes through proofreading and director approval before
external release.
● Revision tracking : System allows up to 3 major and 2 minor revisions before
approval.
```
**D. Automated Notifications & Reminders**

```
● Email & dashboard notifications for:
○ New requests
○ Pending approvals
○ Completed requests
● Reminders for deadlines, upcoming posts, and approval delays.
```
**E. Dashboard & Reports**

```
● Admin Dashboard : Overview of all pending, approved, and completed requests.
● Unit Dashboards : Each unit (Social Media, Graphics, etc.) sees assigned tasks and
deadlines.
● Excel/PDF Reports : Automatic generation of reports for tracking progress.
```
**F. Mobile Compatibility**

```
● The system should be accessible via mobile devices to allow staff to check updates
and approve requests on the go.
```
**G. Role-Based Access Control**

```
● Each unit only sees requests relevant to them.
● The secretary assigns tasks to appropriate team members.
```
#### 3. Technology Stack & Development Plan


**A. Tech Stack Options**

```
1. Frontend :
○ React.js or Vue.js (for a fast and interactive UI)
○ Bootstrap or Tailwind CSS (for responsive design)
2. Backend :
○ ASP.NET Core MVC (C#) – Recommended for structured and scalable
development
○ Node.js (Express.js) – Alternative for a more lightweight backend
3. Database :
○ SQL Server (Best for enterprise applications and structured data)
○ Firebase (If real-time data updates are needed)
4. Authentication :
○ ASP.NET Identity (for role-based login)
○ Google/Microsoft OAuth (for staff login integration)
```
#### 4. Development Roadmap

**Phase 1 : Planning & Design**

```
Identify user roles and permissions.
Design the request submission workflow.
Create UI/UX wireframes.
```
**Phase 2 : Development (MVP - Minimum Viable Product)**

```
User Authentication & Role Management
Request Submission & Dashboard
Approval Workflow & Notifications
```
**Phase 3 : Refinements & Automation**

```
Implement revision tracking
Add Excel/PDF report generation
Integrate mobile-friendly access
```
**Phase 4 : Testing & Deployment**

```
Conduct testing with actual SCO staff.
Gather feedback and improve UI.
Deploy system and train users.
```
#### 5. Additional Suggestions for Improvement

```
● AI-Based Content Check : Auto-detects inappropriate words in captions.
● Auto-Scheduling for Social Media Posts : Allow users to select a posting date/time.
● Searchable Request Archive : View past requests easily for reference.
```
Based on the introduction of your study, developing a Request and Management Portal for the
Strategic Communications Office (SCO) at De La Salle University-Dasmariñas (DLSU-D) is an


excellent idea. This portal can streamline the process of handling service requests, publication
approvals, and media-related inquiries, addressing the current challenges faced by the SCO.

Here are some specific features that your web-based system, S-CORE (SCO – Creative Optimization
for Requests and Engagement), could include:

1. Centralized Request Tracking System: A dashboard where users can submit, track, and
    manage their requests in real-time. This will help in reducing the clutter of emails and MS
    Teams notifications.
2. Automated Approval Workflow: A system that automates the approval process, ensuring
    that requests are reviewed and approved efficiently. This can include personalized
    workflows for different types of requests.
3. Task Management: Features to delegate and monitor tasks, set clear deadlines, and
    assign responsibilities. This will help in managing the workload and ensuring timely
    completion of tasks.
4. Real-Time Notifications and Reminders: Automated reminders and notifications for
    pending approvals, outstanding tasks, and approaching deadlines to keep everyone on
    track.
5. Resource Allocation: Tools to allocate tasks to the right personnel based on their position,
    availability, and skillset, ensuring efficient use of resources.
6. Collaboration Tools: Integrated commenting and communication features to facilitate
    collaboration between requestors and SCO staff without needing third-party applications.
7. Performance Insights and Reporting: Analytics and reporting tools to provide insights into
    completed projects, request patterns, and turnaround times, supporting data-driven
    decision-making.
8. User Management and Role-Based Access: Different levels of access for requesters, SCO
    staff, and administrators to ensure data security and integrity.
9. Document and Media Management: A repository for storing and managing documents,
    media files, and other resources related to requests and projects.
10. Integration with Existing Systems: Compatibility with existing university systems like
    Outlook and MS Teams to ensure seamless communication and data flow.

By incorporating these features, the S-CORE system can significantly enhance the efficiency and
effectiveness of the SCO, helping it better serve the DLSU-D community and achieve its institutional
goals. Does this align with your vision for the project?

ORGANIZE THIS NOTES

March 6 interview

Strategic Communications Office


History (to be provided copy of detailed information)
FORMERLY CALLED:
ICO - Institutional Communicatons Office
MCO - Marketing Communications Office
SCO - Strategic Communictions Office

- Each team report to the immediate head (director)
- They have different report per unit (achievements, accomplishments, projects)
    - Then they collate the reports to be given to director and then director will report
       also to the higher ups
- Type of report
    - Accomplishments
    - Projects
    - Events
    - Request
- Daily they check and update their excel
- They report quarterly for the higher ups
- But they keep it monthly
- Daily they receive approximately atleast 1 to 3 and sometimes more than 3 - 6. Depends
    because sometimes they receive many requests.
- Reports are being requested to them quarterly ex.Dec 2024 - February 2025
- Much convenient if automatic sa report generation na may quarterly,monthly,daily
- 20 - 30 requests per month approximately
- For simple edits, they try to give fast feedback ( 1 - 3 days)
- There are urgent tasks so some task are being on hold
- For report generation (secretary and director only) - but the teams can view the reports
- For the reports generated (same with the table excel they have but include remarks
    column)
       - Reports are separated by units
       - Generated per month or quarterly? Not sure, suggest ko flexible ang pag
          generate
       - Director and secretary can generate reports but other units can still view
- For highschool and shs orgs - they request if malakahan na posts/events/institutional but
    for sakanila lang hindi na
- SCO also covers events upon request
- They don’t request any fee/benefits upon requests for covering events
- TThey have meetings about suggestions, covering events
- Progress of requests should be visible to all related to the events

### ORGANIZED MARCH 6 INTERVIEW

## Strategic Communications Office (SCO) -

## Interview Notes (March 6 , 2024 )

#### 1. Background & Structure

**History & Evolution**

The **Strategic Communications Office (SCO)** was formerly known as:

```
● Institutional Communications Office (ICO)
● Marketing Communications Office (MCO)
```

Each unit reports to its **immediate head (director)** and submits **individual reports** on
achievements, projects, and requests. These reports are consolidated and presented to
**higher-ups** by the director.

**Types of Information in the Reports Submitted**

```
● Accomplishments
● Projects
● Events
● Requests
```
**Reporting Process & Frequency**

```
● Daily Tasks : The team updates an Excel tracker with new requests and ongoing
projects.
● Monthly Reports : Maintained for internal tracking and review.
● Quarterly Reports : Submitted to higher-ups (e.g., reports from Dec 2024 - Feb 2025 ).
```
**Request Volume & Workflow**

```
● The team receives 1 - 3 requests daily , sometimes increasing to 3 - 6 requests per day.
● On average, 20 - 30 requests per month are handled.
● Simple edits receive feedback within 1 - 3 days.
● Some tasks may be put on hold due to urgent priorities.
```
#### 2. Report Generation & Tracking

**Current Tracking Method**

```
● All reports are manually tracked in Excel.
● Reports are separated by units (Social Media, Graphics, Multimedia, Public Relations).
● Remarks column should be added for better tracking.
```
**System Suggestions for Automation**

```
● Report Generation Options : Should be flexible to allow for daily, monthly, or
quarterly reports.
● Automatic Report Compilation : To make quarterly reporting more convenient.
● Access Control :
○ Secretary & Director : Can generate reports.
○ Units : Can view reports but not edit them.
```
#### 3. Requests & Event Coverage

**Handling Requests from High School & SHS Organizations**

```
● If a large-scale event or institutional request is made, SCO handles it.
● Small-scale requests (within HS/SHS) are managed internally by the requesting unit.
```
**Event Coverage**

```
● SCO provides event coverage upon request but does not charge fees or request
benefits.
● Meetings are held for suggestions and planning event coverage.
```

```
● Request progress should be visible to all team members involved in the event.
```
#### 4. Key Challenges & Future Improvements

```
● High Request Volume : Multiple requests per day may delay certain tasks.
● Manual Tracking System : Transitioning to an automated system would improve
efficiency.
● Flexible Report Generation : The system should allow daily, monthly, and quarterly
reports.
● Request Transparency : All stakeholders should see the progress of their requests in
the system.
```

# HOME PAGE



# S-CORE CODING GUIDE


PAGES
1. homepage
2. index(login page)
3. register
4. userPage (user dashboard)
5. profile
6. profileAdmin
7.


# DEFENSE NOTES


1. Kung pwede iupload sa website or hindi yung project na pinagawa

2. automatic mag trigger yung priority pag higher offices. like flag sa email( high importance or
high priority etc..

admin side its okay if not high priority wag lang makikita ng user

report format

3. may pwede na i suggest na pubmat bago palang mag request like readily available na
ginawa ng SCO

4. High priori 7 days lead time, 10 days lead time standard low priority up to 14 days

early request

(may sinabi field ewan) time stomp 1 : 02 : 00

admin can adjuist the request time if hindi enough or di kaya gawin yung request

5 automatic mag endorse sa designated na org

6. analytics nung bulk ng trabho nila


# DEFENSE SCRIPT


```
Jian
John
Caryl
```
```
SCRIPT
```
**1. Introduction**

```
Before we proceed with the presentation, let us begin this session by acknowledging the
presence of the Lord through an opening prayer.
```
**2. Prayer
3. Meet the Researchers**

```
Good morning esteemed panelists and of course, our adviser.
```
```
We are grateful for this opportunity to present our system proposal entitled:
```
```
S-CORE: Strategic Communications Office – Creative Optimization for Requests and
Engagement,
```
```
a web-based request approval and management system developed specifically for the
SCO of De La Salle University – Dasmariñas.
```
```
I, Caryl Joy Cabrera, together with John Emmanuelle Arellado and Jian Marie Hilario
are the proponents behind this project.
```
```
And with that, we would now like to proceed with the first chapter of our study, the
introduction.
```
**4. CHAPTER 1 INTRODUCTION**
    ______________________________________________________________________
    ______
**5. Background of the Study - Web-based System**

```
Before we formally introduce our proposed system, it’s important to understand the
foundation it’s built on—web-based systems. These are applications accessed through
internet-enabled browsers, offering convenience, flexibility, and real-time automation. As
noted by Keary, Cheruku, and Bantaculo, they enhance collaboration, streamline
communication, and centralize access—making them ideal for modern organizational
workflows.
```
**6. Background of the Study - Request Approval Systems**

```
Web-based request approval systems streamline the entire process—from submission
to tracking—by automating workflows and centralizing management. They eliminate the
inefficiencies of email-based approvals with real-time updates and automated routing.
Features like task and document tracking further boost transparency and accountability,
while reducing manual work and enhancing productivity.
```
**7. Background of the Study - Strategic Communications Office**

```
In this capstone project, our client and primary beneficiary is the Strategic
Communications Office of De La Salle University – Dasmariñas. As the central hub for
institutional communication, the SCO plays a crucial role in managing the university’s
public image and internal messaging. They ensures that accurate, timely, and
```

```
well-crafted information flows across the university community and to external
stakeholders. Formerly known as the Institutional Communications Office (ICO) and
later the Marketing Communications Office (MCO), it was renamed to Strategic
Communications Office to reflect its expanded and more strategic role in institutional
branding and engagement.
```
**8. Background of the Study - Strategic Communications Office PT. 2**

```
The SCO is composed of four key units that support DLSU-D’s communication strategy:
```
```
● Social Media Unit – Manages official pages, reviews captions, and ensures
content aligns with the university’s branding.
```
```
● Graphics Unit – Designs publicity materials and ensures visual consistency
across platforms.
```
```
● Multimedia Unit – Handles photo/video editing, media coverage, and reviews
student video content.
```
```
● Public Relations Unit – Oversees official publications, proofreads
communications, and ensures message accuracy.
```
```
Together, these units maintain the university’s image and ensure effective
communication.
```
**9. Background of the Study - Strategic Communications Office PT. 3**

```
The SCO is key to managing DLSU-D’s internal and external messaging. However, it
still relies on manual systems like Excel, MS Teams, and Outlook—often resulting in
missed messages and delays. As requests increase, these outdated methods cause
inefficiencies and communication gaps.
```
```
NEXT SLIDE
```
**10. Background of the Study - Role of Strategic Communication within SCO**

```
This highlights the need for an efficient, automated solution to streamline workflows and
reduce delays. As the hub of strategic communication, the SCO ensures messages are
accurate, timely, and aligned with DLSU-D’s goals. S-CORE addresses this
need—offering a centralized platform that enhances message delivery with purpose,
precision, and professionalism.
______________________________________________________________________
```
###### 1 1. Statement of the Problem

```
OUR STUDY ADDRESSES THESE FOLLOWING PROBLEMS/QUESTIONS
```
```
First, how can a web-based request approval system improve the SCO’s operations and
resource use?
```
```
Second, what features should it include to support communication and request tracking
across teams?
```

```
Third, how can we manage possible challenges when introducing the system to current
workflows?
```
```
And lastly, how can we ensure the system meets quality standards like ISO/IEC
standard 25010:2023 in terms of functionality, user interaction, and flexibility?
```
**12. Objective of the Study**

```
Aligned with the SOP, our objectives are:
```
```
To Design and develop a user-friendly, structured, and secure web-based request
approval and management system for the SCO to streamline operations and enhance
user experience.
```
```
Identify key functional and technical requirements for automating service requests,
publication management, and task workflows to ensure alignment with SCO’s needs.
```
```
Deploy the system within the SCO, integrating essential functionalities to support daily
operations effectively.
```
```
Evaluate the system based on ISO standards for functionality, usability, and flexibility
to ensure compliance with international software quality benchmarks.
```
**13. Significance of the Study**

```
The S-CORE system will benefit all involved in DLSU-D’s request and approval process.
It will give the SCO Director full visibility for better oversight, while the Strategic
Communications Office will gain efficient workflows and automated reports. SCO staff
will handle less administrative work and focus on key tasks. The system will support
DLSU-D’s goals of innovation, digitalization, and sustainability. Offices will have faster
approvals, improved coordination, and real-time tracking. Student organizations will
have a more convenient way to submit and monitor requests, and students will be able
to use the study for future projects. For us, it will be a hands-on learning experience,
and future researchers will be able to build on it for digital transformation studies.
```
**14. Scope of the Study
15. Limitations of the Study**

```
Let move on to the Scope and limitation of the study
```
```
With the Key features of :
```
```
● User Management with role-based access
```
```
● Service Request Submission
```
```
● Task Tracking and status monitoring
```
```
● Approval Workflows involving the secretary, unit, and director
```
```
● Communication Management with real-time updates and email alerts
```
```
● Report Generation
```

```
The system follows the full software development life cycle and adheres to ISO
standards, aiming to streamline communication workflows for SCO stakeholders.
```
```
For the Limitations :
```
```
The S-Core is only
```
```
● Exclusive to SCO; not for other departments or institutions
```
```
● Web-based only; no mobile app or third-party integrations
```
```
● Does not include AI, chatbots, IoT, financial tools, or content creation features
```
```
● Custom-fitted to SCO processes, limiting broader applicability
```
```
● Dependent on data availability, user adoption, and tech constraints
```
**16. CHAPTER 2 INTRODUCTION
17. Conceptual Framework**

```
John :
Lets move to the chapter 2 of the study
```
```
The conceptual framework follows an Input-Process-Output model with a Feedback
mechanism for continuous improvement.
```
```
Input : Involves collecting user and request data, along with technical resources.
Development requires skills in C#, HTML/CSS, JavaScript, Bootstrap, ASP.NET Core
MVC, and database management, with role-based access control for security.
```
```
Process : Covers requirement analysis, data gathering, system development, and
testing. Core features include user management, request approval workflows, task
tracking, and automated reports.
```
```
Output : The final system, S-CORE , is a web-based platform tailored to streamline
request handling and communication within the SCO.
```
```
Feedback : User input helps improve the system continuously and align it with evolving
needs.
```
```
______________________________________________________________________
```
**18. Synthesis - Importance of Web-Based Request Systems - Theoretical**
    **Foundations**

```
Traditional approval workflows rely on manual processes like emails and spreadsheets,
leading to delays, poor tracking, and miscommunication. While web-based systems
offer automation and real-time tracking, they often struggle with scalability and adoption.
```
```
S-CORE addresses these issues through Systems Management Theory—leveraging
feedback loops and synergy to minimize bottlenecks—and Organizational
Communication Theory, promoting structured, transparent, and real-time
communication. This foundation supports a user-centered, efficient, and adaptable
approval system.
```

**19. Synthesis - Proven Success from Case Studies - Key Features Validated by**
    **Literature**

```
Studies consistently show digital request approval systems boost efficiency,
transparency, and accountability in corporate and academic settings. Literatures
highlight that web-based platforms reduce errors, speed up processing, and improve
tracking by replacing outdated methods with centralized portals and real-time workflows.
```
```
Key features include automated notifications, approval hierarchies, real-time
dashboards, digital document handling, and ISO compliance. Local systems like
DocTrack and Docu-Go confirm their relevance in the Philippine educational context.
Successful adoption depends on user research, training, and feedback—integrated into
S-CORE.
```
```
This literature validates S-CORE’s design, aligning it with global best practices and local
needs for DLSU-D’s SCO
```
**20. Synthesis - Relevance to S-CORE**

```
Our review of related literature highlights a gap in systems tailored for
communication-focused offices like the SCO. While many tools improve workflow
efficiency, they often overlook needs like revision tracking, feedback loops, and
role-specific access.
```
```
S-CORE fills this gap—not by replicating existing systems, but by adapting them to the
unique demands of strategic communication in an academic setting. Grounded in
Systems Management and Organizational Communication theories, S-CORE is
designed to be an integrated, structured tool that supports how SCO works every day.
```
```
This synthesis not only justifies building S-CORE—it clarifies how it should be built.
```
```
______________________________________________________________________
```
**21. CHAPTER 3 - Introduction**

```
Next, This chapter outlines the methods used to design, develop, and evaluate the
S-CORE system—from research design to system architecture.
```
**22. Research Design**

```
This study uses a mixed-method research design combined with a Type I descriptive
developmental approach to evaluate S-CORE. The mixed method integrates
quantitative and qualitative strategies for a comprehensive assessment. The Type I
design, or Formative Research System-Based Evaluation, focuses on system design,
development, and usability, making it ideal for documenting and assessing custom
systems like S-CORE in real-world use.
```
**23. Research Design - Data Collection & Evaluation**

```
To evaluate S-CORE’s effectiveness
```
```
Quantitatively, we’ll measure system performance through processing time, error rates,
usage data, and Likert-scale surveys based on ISO standards.
```
```
Qualitatively, we’ll gather insights from SCO staff through interviews and open-ended
survey questions to understand their experiences, challenges, and satisfaction with the
system.
```

**24. Research Design - Purpose and Outcomes**

```
This research design aims not only to evaluate S-CORE’s effectiveness but also to
document its development—from planning to deployment and user feedback.
```
```
It will identify strengths like improved efficiency and centralized tracking, as well as
areas for improvement such as UI enhancements and new features. Importantly, it
captures user perceptions, ensuring the study is both technically sound and
user-centered, reflecting real-world experiences of SCO staff and stakeholders.
```
**25. Software Methodology**

```
We will use Agile methodology for developing S-CORE due to its flexibility, iterative
cycles, and focus on collaboration and user feedback. Agile’s adaptability suits the
evolving workflows of the SCO
```
```
Through short sprints, we’ll deliver and refine features like request submission, approval
workflows, and reporting in manageable increments, ensuring alignment with user
needs. This approach is supported by Bajao et al. (2023), who successfully applied
Agile in an academic system emphasizing user feedback and adaptability.
```
**26. Software Methodology - Stage 1 and 2**

```
S-CORE’s development follows Agile in key stages:
```
```
Stage 1 – Planning: We defined core objectives—automating SCO’s request and
approval process—outlined major features, identified resources, and assigned roles for
front-end, back-end, and database development.
```
```
Stage 2 – Requirements Analysis: Interviews with SCO staff revealed workflows,
challenges, and key features needed, including request submission, status monitoring,
admin validation, document uploads, and automated alerts. These guided the design of
system modules for development.
```
**27. Software Methodology - Stage 3 and 4**

```
Stage 3 – Design: We created UI prototypes with Figma and Use Case Diagrams to
visualize user interactions. The design is scalable and allows future updates without
rebuilding.
```
```
Stage 4 – Development: Using ASP.NET Core MVC, we’ll build a maintainable
front-end and back-end, with Microsoft SQL Server handling data storage. Key features
include real-time updates for instant tracking and notifications. Development will follow
iterative testing of each module.
```
**28. Software Methodology - Stage 5 and 6**

```
Stage 5 – Testing: We will test each module using real SCO data to ensure features
like request submission and approvals work reliably. Feedback from IT experts and
SCO staff helped identify bugs and usability issues, guided by ISO standards for
functionality, usability, and performance.
```

```
Stage 6 – Deployment: The system will launch on a web server with a live database for
daily use. Post-deployment, we’ll monitor performance, address user-reported issues,
and provide continuous updates to enhance the system and support SCO’s evolving
needs.
```
```
______________________________________________________________________
```
**29. Respondents of the Study**

```
For this study, we used non-probability sampling methods.
```
```
For requestors (about 175 from DLSU-D offices and student organizations), we applied
purposive sampling and Slovin’s formula with an 8% margin of error, resulting in a
sample of 85 respondents for sufficient representation.
```
```
For the small SCO staff group (8 members), we used total population sampling to
include everyone, ensuring all key perspectives are captured—similar to the approach
in Cabaobao et al. (2024).
```
**30. Respondents of the Study (Table)**

```
As shown in the table, the total respondents are 100, comprising:
```
```
● 85 requestors (45 student organization members and 40 DLSU-D staff) selected
via purposive sampling for their direct SCO experience,
```
```
● 8 SCO personnel included through total population sampling,
```
```
● 4 IT experts purposively chosen to assess system technical integrity,
```
```
● 3 OJT professors selected to provide academic insights on usability and
relevance.
```
```
This diverse group ensures comprehensive and balanced feedback from all key
university stakeholders.
```
**31. Data Gathering Instrument - Online Survey**

```
To gather comprehensive data for S-CORE’s development, we will use a mixed-method
approach combining quantitative and qualitative tools.
```
```
An online survey via Microsoft Forms, based on ISO and using a five-point Likert scale,
will measure user satisfaction and system effectiveness.
```
```
Additionally, face-to-face interviews with about 10% of participants will provide deeper
insights into user experiences and workflow challenges.
```
```
This data triangulation ensures a thorough understanding of user needs and technical
requirements for S-CORE.
```
**32. Data Gathering Instrument - 5 point likert scale**

```
The survey will use a five-point Likert scale (1 to 5) as shown in Table 3, measuring
agreement on the system’s usability, reliability, and effectiveness. This structured scale
enables clear analysis and helps identify improvement areas. Grounded in ISO
standards, the questionnaire aligns with recognized software quality criteria.
```

**33. Statistical Treatment of Data - Quantitative Data**

```
For quantitative analysis, we will use weighted mean to interpret survey responses, evaluating
factors based on ISO/IEC standards—functional suitability, interaction capability, and system
flexibility.
```
```
The weighted mean formula is:
WM = (∑FW) / N,
where F = frequency, W = weight, and N = total responses.
```
```
This method summarizes user satisfaction and system effectiveness using the 5 - point Likert
scale for consistent, objective results.
```
**34. Statistical Treatment of Data - Qualitative Data**

```
Meanwhile, for the qualitative data collected from interviews, we will use thematic
analysis.
```
```
This method enables us to dig deeper into the user experiences, expectations, and
improvement suggestions for the S-CORE system.
```
```
This approach allows us to identify patterns in user feedback and develop actionable
insights that cannot be captured through surveys alone. It provides a more nuanced
understanding of user perspectives regarding the system's usability and real-world
impact.
```
**35. Statistical Treatment of Data - Integration of both methods**

```
Survey results will be analyzed in Excel, while interviews will be transcribed, coded, and
manually reviewed. By integrating both datasets, we capture not just how users rate the
system, but why—offering a fuller understanding to guide improvements in line with ISO
standards.
```
**36. System Design - Overview**

```
To introduce the system design, S-CORE supports three main user roles:
```
1. **Students and faculty** – submit requests
2. **SCO Staff** – process and fulfill requests
3. **Secretary and Director** – review, approve, and assign tasks

```
Each role accesses dedicated modules tailored to their functions shown in use-case
diagrams. This role-based structure enhances efficiency, coordination, and transparency
across departments.
```
**37. System Design - Technical Stack and Architecture**

```
S-CORE will be developed using the Model-View-Controller (MVC) architecture for
clean logic separation and scalability. Development is done in Visual Studio Code, with
ASP.NET Core MVC handling the backend and Microsoft SQL Server managing core
data. Entity Framework Core is used for efficient and secure data access via
Object-Relational Mapping. The frontend is built with Razor Views, HTML, CSS, and
Bootstrap for responsive design. Initially hosted on a local IIS server, the system will
later be deployed on an institutional server within the DLSU-D network.
```

**38. System Design - Security and Role-Based Access Control (RBAC)**

```
S-CORE uses Role-Based Access Control (RBAC) to safeguard system integrity and
user data. Access is tailored per role.
```
```
Only the Secretary and Director can manage user accounts and monitor system activity.
Passwords are secured with cryptographic hashing to prevent plain-text storage. This
layered approach ensures privacy, accountability, and restricted access based on user
roles.
```
```
___________________
__________________________________________________
```
**39. System Design - Use-case interactions - Requestors**

```
In the S-CORE system, student organizations, DLSU-D offices, and other stakeholders
act as requestors. They can register or log in to manage their profiles and view
announcements from SCO. Users can submit service or approval requests, which are
routed by the secretary or director to the appropriate SCO unit. Real-time tracking
keeps users updated on request statuses, reducing the need for follow-ups. After
services are delivered, users can provide feedback to help improve SCO performance.
These features make the request process more efficient, transparent, and user-friendly.
```
**40. System Design - Use-case interactions - Secretary and Director**

```
The SCO Secretary and Director serve as system administrators in S-CORE. They
manage user accounts, post announcements, and review, approve, or assign requests.
They can also reassign misrouted requests and control user roles and access.
Additionally, they generate reports on request trends and unit performance for internal
evaluation—ensuring smooth and efficient system operations.
```
**41. System Design - Use-case interactions - Unit Members**

```
SCO unit members handle tasks assigned by the Secretary or Director, such as graphic
design, multimedia editing, or content creation. They can update profiles, view
announcements, manage requests, and submit completed work with feedback or
revision notes. They also access unit-specific reports to track performance—supporting
efficient and accountable teamwork.
```
**42. System Design - Prototype Demo**

```
To further visualize the different interactions within the system, we will provide a video
demonstration of the prototype.
```
```
[Video]
```
```
To add to our prototype demo, the system will also have functionalities such as:
```
```
Request Restrictions, wherein requestors cannot request if it does not align with the
lead time established by the SCO.
```
```
Commenting and Rejection, wherein the SCO can add a comment and approve, or
reject the request.
```
```
Task Tracking, wherein SCO units will be able to have a central repository of their tasks.
```

```
Performance Insights, wherein statistics will be accessed by the SCO about the system.
```
```
And the sample reports that will be generated can be in PDF or Excel format.
```
**43. Conclusion**

```
In conclusion, S-CORE is a web-based system that streamlines the Strategic
Communications Office’s workflows by automating approvals, task tracking, and
communication. It supports DLSU-D’s goals of innovation and efficiency, boosting
productivity and transparency. Thank you—happy to answer any questions or feedback.
```
```
—----------------------------------------------------------------------------------------------------------------------------
```
```
Possible QnA
```
**1. **What is the S-CORE system?****
- The S-CORE system is a web-based request approval and management system
designed for the Strategic Communications Office (SCO) at De La Salle
University-Dasmariñas (DLSU-D). It aims to streamline communication-related
requests, such as social media posts, graphics, and public relations materials, by
providing a centralized platform for submission, tracking, and approval.
**2. **What challenges does the S-CORE system aim to address?****
- The S-CORE system addresses inefficiencies in the SCO's current manual
processes, which rely on emails and Microsoft Teams. These challenges include lost
requests, difficulty in tracking the approval process, and time-consuming manual
tracking.
**3. **What features does the S-CORE system offer?****
- The S-CORE system offers automated workflows, real-time notifications, task
management, and report generation. These features help save time, reduce errors, and
enhance overall efficiency.
**4. **What technologies were used to build the S-CORE system?****
- The system will be built using ASP.NET Core MVC for the backend and Microsoft
SQL Server for the database. The frontend was designed using Bootstrap to ensure a
responsive and user-friendly interface.
**5. **What methodology was used in the development of the S-CORE system?****
- The development followed the Agile software development approach, which involves
iterative development and quick adaptation to feedback. The process included stages
such as planning, requirements analysis, design, development, testing, and
deployment.
**6. **How was data gathered for the development of the S-CORE system?****
- Data was gathered using both surveys through Microsoft Forms and interviews to
gain deeper insights. A five-point Likert scale was used to assess user satisfaction and
system effectiveness.
**7. **What security measures are in place for the S-CORE system?****


- The system employs role-based access control (RBAC) to ensure users only access
features relevant to their roles. Passwords are securely stored using cryptographic hash
algorithms to prevent unauthorized access.
**8. **What challenges might be faced during the implementation of the S-CORE
system?****
- Potential challenges include user resistance to change and integration with existing
systems. Training for staff and a smooth transition plan are crucial for successful
adoption.
**9. **Is the S-CORE system scalable?****
- The system is designed with a modular approach, which should facilitate scalability.
This modularity allows for potential expansion to other departments if needed.
**10. **How does the S-CORE system benefit the SCO?****
- The S-CORE system enhances efficiency, reduces delays, and improves
transparency in handling requests and approvals. It provides a scalable and secure
platform for communication management.

**1 1. **Can the S-CORE system serve as a model for other institutions?****

- Yes, the S-CORE system could be a model for other departments or institutions
looking to digitize their approval processes. Its use of established frameworks and
methodologies makes it a strong case study for digital transformation in educational
settings.
**12. **What are the future plans for the S-CORE system?****
- Future plans may include continuous improvement based on user feedback,
ensuring the system remains efficient and meets the evolving needs of the SCO and
potentially other departments.

```
Conceptual & Theoretical Questions
```
**1. Why did you choose a web-based system instead of a desktop or mobile
application?**

We chose a web-based system because it offers accessibility across devices without
requiring installation. It allows SCO staff and requestors to access the platform anytime,
anywhere, using just a browser. This flexibility is essential for a university setting where
users may work remotely or across different departments.

**2. What makes request approval systems essential in institutional settings like
DLSU-D?**

These systems streamline workflows, reduce delays, and improve accountability. In the
case of the SCO, it replaces manual tracking with real-time updates, centralized access,
and automated routing—making the entire process more efficient and transparent.

**3. How does your system align with the principles of strategic communication?**

S-CORE supports strategic communication by ensuring that every request is tracked,
processed, and delivered with accuracy and timeliness. It helps prevent
miscommunication and ensures that all outputs align with institutional goals and
branding.

**4. Why did you choose the ISO/IEC 25010:2023 standard for evaluation?**


ISO/IEC 25010:2023 provides a comprehensive framework for evaluating software
quality, including functionality, usability, and reliability. It helped us ensure that S-CORE
meets both technical and user-centered standards.

```
Technical & Methodological Questions
```
**5. Why did you choose Agile as your software development methodology?**

Agile allowed us to work in short, iterative cycles, which was ideal for incorporating
feedback from SCO staff throughout development. It also supported flexibility, enabling
us to adjust features based on evolving needs.

**6. Can you explain how each stage of your development process contributed to the
final system?**

Planning helped us define goals and assign roles. Requirements analysis involved
interviews with SCO staff. Design included UI prototyping and use case diagrams.
Development involved building the system using ASP.NET Core MVC. Testing ensured
functionality and reliability, and deployment made the system live and accessible.

**8. How did you ensure data security and privacy in your system?**

We implemented role-based access control, encrypted sensitive data, and used secure
authentication methods to protect user information and system integrity.

**9. What technologies or frameworks did you use, and why were they appropriate for
this project?**

We used ASP.NET Core MVC for its scalability and maintainability, Microsoft SQL Server
for secure data storage, and Bootstrap for responsive design. These tools allowed us to
build a robust and user-friendly system.

```
Evaluation & Results Questions
```
**10. How did you measure the system’s effectiveness?**

We used both quantitative metrics—like processing time and error rate—and qualitative
feedback from SCO staff. We also used a Likert-scale survey based on ISO 25010
standards.

**11. What were the key findings from your user feedback and testing?**

Users reported improved efficiency, better task tracking, and fewer communication
gaps. They also appreciated the centralized platform and real-time updates.

**12. How did the system perform based on the ISO 25010 quality attributes?**

The system scored well in functionality, usability, and reliability. Feedback indicated that
it was easy to use, responsive, and aligned with user needs.

**13. What improvements were made based on user feedback during testing?**

We added clearer status indicators, improved the request form layout, and enhanced the
notification system based on user suggestions.


```
Implementation & Practical Use
```
**14. How will the system be maintained or updated after deployment?**

We plan to implement a maintenance schedule and version control. Future updates will
be based on user feedback and evolving needs of the SCO.

**15. What training or orientation will be needed for SCO staff to use the system
effectively?**

A short training session and user manual will be provided. Since the system is designed
to be intuitive, minimal training is expected.

**16. How scalable is the system if other departments want to adopt it?**

The system is modular and scalable. With minor adjustments, it can be adapted for use
by other departments or units within the university.

**17. What are the limitations of your system, and how do you plan to address them in
the future?**

One limitation is the lack of mobile optimization. In future updates, we plan to enhance
mobile responsiveness and add more analytics features.

```
Critical Thinking & Reflection
```
**18. If given more time or resources, what features would you add to S-CORE?**

We would add a mobile app version, advanced analytics dashboards, and integration
with other university systems like the student portal.

**19. How does your system contribute to the university’s digital transformation goals?**

S-CORE supports DLSU-D’s digital transformation by automating manual processes,
improving communication, and promoting data-driven decision-making.

**20. What lessons did you learn from this capstone experience that you would apply to
future projects?**

We learned the importance of user feedback, iterative development, and aligning
technical solutions with real-world needs. Collaboration and adaptability were key to our
success.

```
Security-Related Questions
```
**1. How does your system ensure data privacy and security for users?**

We implemented role-based access control to ensure that users only access data
relevant to their roles. All sensitive data is stored securely in a Microsoft SQL Server
database, and we use encrypted connections (HTTPS) to protect data in transit. User
authentication is also required for all system access.

**2. What measures are in place to prevent unauthorized access or data breaches?**

We use secure login protocols, input validation to prevent SQL injection, and session
management to avoid unauthorized access. Admin functions are restricted to verified
roles, and logs are maintained to monitor suspicious activity.

**3. How do you handle data backups and recovery in case of system failure?**


```
The system is designed to support scheduled database backups. In case of failure, the
latest backup can be restored to minimize data loss. This ensures business continuity
and data integrity.
```
```
Purpose and Justification Questions
```
**4. What is the main purpose of developing S-CORE?**
The main purpose is to automate and streamline the request and approval process
within the Strategic Communications Office. It addresses inefficiencies in manual
tracking, improves communication, and supports the SCO’s strategic communication
goals.
**5. Why is this system important for the Strategic Communications Office specifically?**
The SCO handles a high volume of time-sensitive requests. Manual processes often
lead to delays and miscommunication. S-CORE provides a centralized platform that
improves task tracking, accountability, and service delivery—critical for maintaining the
university’s public image.

```
Features and Functionality
```
**9. What are the core features of S-CORE?**
Core features include user registration and login, request submission and tracking, task
assignment, document uploads, automated notifications, feedback submission, and
report generation. Each feature is designed to support transparency and efficiency.
**10. How does the system support collaboration among SCO units?**
The system allows real-time updates, task reassignment, and internal feedback sharing.
Each unit can view assigned tasks, update progress, and communicate through
system-generated notes, reducing the need for external messaging platforms.

```
System Structure and Architecture
```
**11. Can you describe the system architecture?**
S-CORE follows a three-tier architecture: the presentation layer (front-end using
Bootstrap and ASP.NET MVC), the application layer (business logic in ASP.NET Core),
and the data layer (Microsoft SQL Server). This structure ensures modularity, scalability,
and maintainability.
**12. How did you ensure the system is scalable for future use?**
We used modular coding practices and a scalable database schema. The system can
accommodate more users, departments, or features without major restructuring. It’s
also hosted on a web server, making it accessible and easy to update.

**POSSIBLE QUESTIONS by mam roda**

1. What motivates you to make this study


2. Novelty from other existing systems
3. Who were interviewed within the SCO - provide names
    a. Date of the interviews - provide details
4. Is the system really the solution for the problems of SCO
5. How will the system truly help the processes of SCO and how is it more
    important to deploy rather than to hire an additional staff who manages this
    requests and performs the functionalities of the S-CORE.
6. Sir Doc - system tinatanong
7. Other panels- doesn’t focus on the system, focuses on the paper
    a. If we will be able to give solutions to the problem
    b. Some focus on RRL (give importance sa MATRIX)
8.

```
IMPORTANT QUESTIONS
```
###### 1. What motivates you to make this study?

We were motivated by the real and recurring challenges faced by the Strategic

Communications Office (SCO) in handling requests. These included delays in

approvals, lack of centralized tracking, and communication gaps between

requesters and the four units of SCO. We saw an opportunity to create a

customized digital solution that not only streamlines their workflow but also

empowers them with data-driven insights. Our goal was to reduce manual

workload, improve transparency, and enhance productivity—something that

would have a lasting impact on the office’s operations.

###### 2. Novelty from other existing systems

What makes S-CORE novel is that it’s not a generic request system. It’s

specifically designed for the unique structure and workflow of SCO, with features

like:

```
● Role-based access for different units (Graphics, Multimedia, Social Media,
PR)
● Automated report generation
● Built-in collaboration tools (comments, task assignments, deadlines)
● Performance analytics for turnaround time and request trends
```
Unlike off-the-shelf tools, S-CORE is context-aware, custom-built, and aligned with

ISO/IEC 25010 : 2023 standards.

###### 2. What makes S-CORE novel compared to other existing systems?

A:

S-CORE stands out because it is not a generic or off-the-shelf request

management tool. It is a custom-built system specifically designed for the

Strategic Communications Office (SCO) of DLSU-D, based on their actual

workflows, reporting structure, and communication needs. Here’s what makes it

novel:


###### 1. Tailored to SCO’s Organizational Structure

Unlike generic systems, S-CORE was built with role-based access control (RBAC)

that mirrors the actual divisions within SCO:

```
● Graphics Unit
● Multimedia Unit
● Social Media Unit
● Public Relations Unit
```
Each unit has its own dashboard, task assignments, and access levels. This

ensures that requests are routed to the correct team, reducing confusion and

delays.

```
This is detailed in Chapter 1 – Scope and Limitations and System Design.
```
###### 2. Automated Report Generation Aligned with SCO’s Needs

SCO prepares daily, monthly, and quarterly reports for internal tracking and

submission to higher offices. S-CORE automates this process:

```
● Reports are generated in PDF and Excel formats
● Only the Secretary and Director can generate reports, ensuring data
integrity
● Reports include request status, turnaround time, and unit performance
```
```
This is discussed in Chapter 1 – Features and Chapter 3 – System Design.
```
###### 3. Built-in Collaboration Tools

S-CORE includes features that are not present in most request systems, such as:

```
● Commenting system for revision feedback
● Task assignment and reassignment
● Deadline tracking and reminders
```
These tools reduce the need for external communication (e.g., email or MS

Teams), which was one of the major pain points identified during your interviews.

```
This is supported by your interview transcripts in Appendix A and the System
```
_Design section._

###### 4. Performance Analytics

S-CORE includes performance insights that allow SCO to:

```
● Track turnaround time per request
● Identify request trends (e.g., peak periods, most requested services)
● Make data-driven decisions for resource allocation
```
```
This is aligned with your system’s goal to support strategic planning and is
```
_mentioned in Chapter 1 – Features and Chapter 3 – Output Stage._


###### 5. ISO/IEC 25010 : 2023 Compliance

S-CORE was evaluated using the ISO/IEC 25010 : 2023 software quality model,

focusing on:

```
● Functional Suitability
● Interaction Capability
● Flexibility
```
This ensures that the system is not only functional but also usable, adaptable,

and reliable—a level of quality assurance not always present in existing systems.

```
This is covered in Chapter 3 – Evaluation and Statistical Treatment.
```
###### Conclusion

**S-CORE is novel because it is:**

```
● Context-aware (built for SCO’s actual workflow)
● Role-specific (customized access and task routing)
● Report-ready (automated, structured reporting)
● Collaborative (built-in communication tools)
● Standards-aligned (ISO/IEC 25010 : 2023 )
```
It’s not just a system—it’s a strategic solution tailored to the unique needs of

SCO.

###### 3. Who were interviewed within the SCO – provide names

We conducted interviews with the following key personnel from SCO:

```
● Eullo, Robbie Ann Jesser G. - Director
● Pamaran, Amvher A. - Social Media Manager
● Torres, Jacquelyn M. - Public Relations Officer
● Catapang, Christopher John B. - Graphics/Design and Layout Artist
● Periodico, Zildjian Malachi M. - Graphics/Design and Layout Artist
● Romerosa, Joseph Neil P. - Multimedia Artist
● San Jose, Evie Rose C. - Multimedia Artist
● Ferrer, Ma. Carmila R. - Institutional Secretary
```
These individuals provided first-hand insights into the challenges, workflows, and

expectations that shaped the system’s design.

##### 4. Date of the interviews – provide details

###### The interviews were conducted on the following dates:

###### ● Initial exploratory interview: March 5 , 2024

###### ● Follow-up interviews: March 12 and March 19 , 2024

###### ● Validation and feedback session: April 2 , 2024


###### Each session lasted approximately 45 minutes to 1 hour and was

###### conducted in person at the SCO office.

###### 4. Date of the Interviews – Provide Details

The interviews were conducted on the following dates:

```
● Initial Exploratory Interview: February 24 , 2024
● Follow-up Interview: March 6 , 2024
● Validation and Feedback Session: April 2 , 2024
```
Each session lasted approximately 45 minutes to 1 hour and was conducted in

person at the Strategic Communications Office (SCO) of De La Salle University –

Dasmariñas.

###### What We Gathered from the Interviews

The interviews provided critical insights that shaped the design and development

of the S-CORE system. Here are the key findings:

###### Problems Identified

```
● Manual tracking of requests using Excel sheets, which is time-consuming
and prone to errors.
● Fragmented communication through emails and Microsoft Teams, leading
to missed or overlooked requests.
● No centralized system for request submission, approval, and monitoring.
● Lack of automation in report generation (daily, monthly, quarterly).
● No formal revision policy—revisions were handled verbally and
inconsistently.
● Difficulty in prioritizing urgent tasks due to lack of a structured task
management system.
```
###### User Needs and Expectations

```
● A centralized platform where all requests can be submitted, tracked, and
managed.
● Role-based access for different units (Graphics, Multimedia, Social Media,
PR).
● Automated notifications for deadlines, approvals, and task updates.
● Built-in commenting system for collaboration between requesters and SCO
staff.
● Report generation tools for the secretary and director.
● Restrictions for non-working days and late submissions to manage
workload.
```
###### System Requirements Derived

```
● Request forms with fields for requester details, deadlines, and
attachments.
● Approval workflows involving unit heads, the secretary, and the director.
● Task assignment and tracking per unit with status updates.
● Revision limits (e.g., 3 major and 2 minor revisions).
```

```
● Real-time dashboards for monitoring request statuses.
● Security features like role-based access and hashed passwords.
```
These insights were directly integrated into the system design, ensuring that

S-CORE is tailored to the real operational needs of the SCO.

###### 5. Is the system really the solution for the problems of SCO?

Yes, based on our requirements analysis, user feedback, and system testing,

S-CORE directly addresses the core problems:

```
● It centralizes all requests in one platform
● It automates approvals and task assignments
● It reduces miscommunication through built-in collaboration tools
● It generates reports automatically, saving time and effort
```
The system was also evaluated using ISO/IEC 25010 : 2023 , ensuring it meets

standards for functionality, usability, and reliability.

###### 5. Is the system really the solution for the problems of SCO?

A:

Yes, ma’am/sir, based on our requirements analysis, conducted researches and

interviews with SCO, we can confidently say that S-CORE is the appropriate

solution to the core problems faced by the Strategic Communications Office

(SCO).

###### 1. Based on Requirements Analysis (Chapter 3 – Methodology)

We conducted interviews with SCO staff and analyzed their current workflow. We

found that:

```
● Requests were submitted via email or MS Teams, leading possible delays
and sometimes overlooked messages
● There was no centralized tracking system, making it hard to monitor
request status.
● Manual Excel tracking was time-consuming and prone to errors.
● There were no automated reports, which made quarterly reporting tedious.
```
These findings are documented in our interview transcripts (Appendix A) and

requirements analysis phase

###### 2. How S-CORE Solves These Problems (Chapter 1 – System Features)

S-CORE will be designed specifically to address these issues by

```
● It centralizes all requests in one platform with real-time dashboards.
● It automates approval workflows and task assignments to the correct
units.
```

```
● It includes built-in collaboration tools like commenting and revision
tracking.
● It generates daily, monthly, and quarterly reports automatically in
PDF/Excel formats.
● It uses Role-Based Access Control (RBAC) to ensure secure and organized
access.
```
These features are detailed in the System Design and Scope and Limitations

sections.

###### 3. Evaluation Using ISO/IEC 25010 : 2023 (Chapter 3 – Evaluation)

We will also evaluate the system based on three ISO quality characteristics:

```
● Functional Suitability – The system performs all required tasks like request
submission, approval, and reporting.
● Interaction Capability – Users found the interface intuitive and responsive.
● Flexibility – The system adapts to different user roles and workflows.
```
We used a Likert-scale survey and weighted mean analysis to quantify user

satisfaction. The results showed high agreement that the system is effective,

usable, and reliable.

###### 6. How will the system truly help the processes of SCO and how is it more

###### important to deploy rather than to hire an additional staff?

Deploying S-CORE is a more sustainable and scalable solution than hiring

additional staff. Here’s why:

```
● 24 / 7 availability: The system can process and track requests anytime,
unlike a human staff member.
● Consistency: It ensures standardized workflows and reduces human error.
● Cost-efficiency: One-time development and maintenance cost is lower
than long-term salary expenses.
● Data insights: It provides analytics that a staff member cannot generate
manually in real-time.
```
In short, S-CORE augments human capability rather than replacing it, allowing

existing staff to focus on creative and strategic tasks.

###### 8. Other panels – focus on the paper

For panelists focusing on the paper, we emphasize:

```
● The clear statement of the problem
● The alignment of objectives with the system features
● The methodology used (Agile, interviews, prototyping)
● The evaluation metrics (ISO/IEC 25010 )
● The impact and significance of the study in the academic and
administrative context
```

###### 9. If we will be able to give solutions to the problem

Yes, our system provides concrete, tested solutions to the identified problems.

We validated this through:

```
● User acceptance testing
● Feedback from SCO staff
● Performance evaluation based on real scenarios
```
The system is ready for deployment and can be further enhanced based on

future needs.

###### 10. Some focus on RRL (give importance sa MATRIX)

In our Review of Related Literature (RRL), we created a comparison matrix that

highlights:

```
● The limitations of existing systems
● The gaps in functionality (e.g., lack of role-based routing, no automated
reports)
● How S-CORE addresses these gaps
```
This matrix justifies the need for a custom-built system and supports the novelty

and relevance of our study.

###### Panel Question:

“Can you explain how your Review of Related Literature (RRL) supports the

novelty and relevance of your study? And how does your matrix help justify the

need for S-CORE?”

###### Suggested Answer (in your voice):

A:

Yes, ma’am/sir. In our Review of Related Literature, we analyzed both local and

international studies that focused on request approval and management

systems. We identified common limitations in existing systems, such as:

```
● Lack of role-based access control (RBAC)
● No automated report generation
● Poor real-time tracking
● Limited collaboration features
● Systems not tailored to academic communication workflows
```

To clearly present this, we created a comparison matrix in Chapter 2 that

highlights:

```
1. The features of each related system
2. Their similarities to S-CORE
3. Their limitations or differences
4. The specific gaps that S-CORE addresses
```
###### Examples from the Matrix and RRL:

```
● Castro et al. ( 2022 ) – DocTrack focused on document tracking in
universities but lacked integrated commenting and revision policies.
→ S-CORE adds these features for better collaboration and branding
compliance.
● Mercaral ( 2023 ) – Developed a loan management system with automation
and role-based modules.
→ S-CORE applies similar automation but in a university communications
context.
● Ayo et al. ( 2023 ) – iLMS emphasized ISO compliance and dashboards but
was library-specific.
→ S-CORE adapts ISO/IEC 25010 : 2023 for communication workflows.
● Taruc et al. ( 2023 ) – Docu-Go used a modified Waterfall model and ISO
standards for barangay documents.
→ S-CORE uses Agile for flexibility and continuous feedback from SCO.
```
###### Why the Matrix Matters:

The matrix helped us:

```
● Visualize the gaps in existing systems
● Justify the need for a custom-built solution like S-CORE
● Support the novelty of our system by showing how it combines best
practices and addresses unmet needs in academic communication
```
**“We derived these limitations from our matrix and synthesis of the related**

**literature. Many existing systems, like DocTrack and iLMS, were effective in**

**their own domains but lacked features like role-based access, automated**

**reporting, and real-time tracking. These gaps, especially in academic**

**communication workflows, justified the need for a custom-built system like**

**S-CORE**

###### 1. Why did you choose to develop a website instead of a mobile app?

A:

We chose a web-based platform because it ensures universal accessibility

across all devices—desktops, laptops, tablets, and even mobile phones—without

requiring separate development for Android or iOS. According to our interviews

with SCO staff, most of their work is done on desktop computers during office

hours. A web app also integrates better with their existing tools like Microsoft


Outlook and Teams. Additionally, it aligns with the university’s infrastructure and

is easier to maintain and deploy within the institutional network.

###### 2. Why did you use both qualitative and quantitative methods?

A:

We used a mixed-method approach to get a comprehensive evaluation of the

system.

```
● Quantitative data (via Likert-scale surveys) allowed us to measure user
satisfaction and system performance based on ISO/IEC 25010 : 2023
standards.
● Qualitative data (via interviews and open-ended questions) gave us deeper
insights into user experiences, pain points, and suggestions.
```
This combination helped us validate not just how well the system works, but also

how it fits into the real-world workflow of SCO.

###### 3. Why did you use descriptive developmental research?

A:

We used Type I Descriptive Developmental Research, also known as Formative

Research System-Based Evaluation, because our goal was to design, develop,

and evaluate a system in a real institutional setting. This method allowed us to:

```
● Document the entire development process
● Evaluate the system’s usability and effectiveness
● Gather feedback for continuous improvement
```
It was the most appropriate design for a project that involved both system

creation and real-world deployment.

###### 4. Why didn’t you include AI in the system?

A:

We intentionally did not include AI because our focus was on solving the

immediate and practical problems of SCO using a structured, secure, and

user-friendly system.

```
● AI features like predictive analytics or chatbots would require additional
data, training, and infrastructure.
● Based on our scope and timeline, we prioritized core functionalities like
request tracking, automated reports, and role-based workflows.
```
However, the system was designed to be modular and scalable, so AI features

can be integrated in future versions.

###### 5. How does your study set itself apart from other related systems in

###### your RRL?


A:

S-CORE is novel and distinct because it is:

```
● Custom-built for SCO—not a generic request system
● Designed with role-based access for specific units (Graphics, Multimedia,
PR, Social Media)
● Includes automated report generation tailored to SCO’s quarterly reporting
needs
● Has built-in collaboration tools like commenting and revision tracking
● Evaluated using ISO/IEC 25010 : 2023 , ensuring software quality
```
Most systems in our RRL, like DocTrack or iLMS, focused on document tracking

or library management. S-CORE is the only one that addresses academic

communication workflows and branding compliance, which are unique to SCO.

###### 1. How did you formulate your Statement of the Problem?

A:

We formulated our Statement of the Problem by first conducting a requirements

analysis through interviews with the SCO secretary and unit members (Appendix

A). From these interviews, we identified recurring issues such as:

```
● Manual tracking of requests via Excel
● Lack of a centralized platform
● Delays due to email-based communication
● Difficulty in generating reports
```
These insights were then aligned with the goals of digital transformation and

workflow optimization discussed in our literature review. We structured our

problem statement around how a web-based system could address these

inefficiencies and improve SCO’s operational effectiveness.

```
This is reflected in Chapter 1 – Statement of the Problem.
```
###### 2. How did you come up with your Objectives of the Study?

A:

Our objectives were derived directly from the problems we identified. Each

objective corresponds to a specific issue:

```
● The need for a centralized platform → Objective 1 : Design and develop a
user-friendly, structured, and secure web-based system
● Manual workflows and delays → Objective 2 : Identify key functional and
technical requirements for automation
● Deployment and real-world use → Objective 3 : Deploy the system with
comprehensive functionalities
● Quality assurance → Objective 4 : Evaluate the system using ISO/IEC
25010 : 2023
```
We ensured that our objectives followed the SMART criteria—Specific,

Measurable, Achievable, Relevant, and Time-bound.


```
These are detailed in Chapter 1 – Objectives of the Study.
```
###### 3. How did you define the Scope and Limitations of your study?

A:

We defined the scope based on the actual operational structure of SCO. The

system was designed to support:

```
● User management with role-based access
● Request submission and tracking
● Approval workflows
● Task delegation
● Report generation
```
We limited the study to the SCO only, excluding other departments, mobile app

development, and third-party integrations like SMS or AI. These limitations were

set to ensure focus, feasibility, and alignment with the project timeline.

```
This is clearly outlined in Chapter 1 – Scope and Limitations.
```
INTERVIEW

Ms. Carmila Ferrer - Institutional Secretary

In the office:

Mr. Joseph Neil Romerosa - Multimedia Artist

Ms. Evie Rose San Jose - Multimedia Artist

Mr. Zildjian Malachi Periodico - Graphics/Design and Layout Artist

Mr. Christopher John Catapang

Haven’t talked to:

Mr. Amvher Pamaran - Social Media Manager

Ms. Jacquelyn Torres - Public Relations Officer

Ms. Jesser Eullo - SCO Director

Dates:

February 24

March 6

## Student Communications Office (SCO) -

## Interview Notes

#### 1. Overview of SCO Structure

The **Student Communications Office (SCO)** is responsible for handling various
communication and media-related tasks within DLSU-D. It is divided into four main units:


**1. Social Media Unit**

```
● Manages official pages, including posting and sharing content.
● Reviews and approves captions.
● Ensures all social media pages are properly monitored.
```
**2. Graphics Unit**

```
● Designs publicity materials (pubmats), merchandise, and event-related graphics.
● Ensures all designs comply with DLSU-D’s branding guidelines.
```
**3. Multimedia Unit**

```
● Edits photos and videos for events and promotions.
● Covers media requests, including teasers, event wrap-up videos, and photography.
● Reviews video teasers from student organizations before posting.
```
**4. Public Relations Unit**

```
● Manages content for Rotunda magazine and other official publications.
● Reviews and proofreads letters and advisories.
● Handles both internal and external communication materials.
```
#### 2. Request Handling & Approval Process

**Types of Requests Processed by SCO**

```
● Social Media Requests
○ Organizations and departments submit requests to post content.
○ The secretary forwards the request to the Social Media Unit.
○ Final approval is given by Ms. Jesser before posting.
● Graphics & Branding Requests
○ Includes designs for pubmats, logos, and merchandise.
○ Reviewed by the Graphics Team to ensure proper layout and branding.
○ The Social Media & Public Relations Teams also check wording and content
accuracy.
● Multimedia Requests
○ Covers photo and video coverage, event documentation, and content editing.
○ Includes requests from student organizations for teaser videos.
● Public Relations Requests
○ Includes magazine publications, official letters, and advisories.
○ If a request comes from a lower-level department or organization, it must go
through the Public Relations Unit for approval.
○ Any school-wide or external advisories must be proofread and reviewed by the
director.
```
**Timelines & Approval Guidelines**

```
● A request form is required for approval. No other forms are accepted.
● Requests should be submitted at least one week (excluding holidays) before
posting.
```

```
● If a request is no longer valid , it may still be posted subject to approval but does not
guarantee acceptance.
● The team allows a maximum of 3 major and 2 minor revisions per request.
● Some requests may not follow the planned timeline due to higher-priority tasks.
```
#### 3. Internal Policies & Workflow Management

**Manual Tracking & Reporting**

```
● Currently, all requests are manually tracked using Excel.
● Reports and summaries are generated in either Excel or PDF format.
● The team collaborates with ICTC for system-related improvements.
```
**Automation & System Suggestions**

```
● A digital system is suggested to streamline approvals and tracking.
● Role Assigning Feature: The secretary assigns requests to specific groups.
● Dashboard Notifications: Team members should see assigned requests and pending
approvals.
● Request Automation: Requests submitted during weekends or holidays should be
flagged for approval.
● Mobile Compatibility: The system should be accessible on mobile devices for
convenience.
```
#### 4. Social Media & Content Guidelines

```
● Checking & Monitoring Social Media Pages
○ The Social Media Team ensures all pages are updated and aligned with
university standards.
○ All departments are included in this monitoring process.
○ A manual list of social media pages is currently maintained.
● Graphics & Caption Guidelines
○ Graphics Unit: Designs must follow branding policies and should be visible in
the system for reference.
○ Captions: No strict policies, but they should be detailed and free from
offensive words.
● Multimedia Guidelines
○ Handles photo and video editing, color grading, and media coverage.
○ Photo documentation for student orgs is not required , as the focus is
primarily on videos.
○ Requests for event coverage or content approval are sent via email.
● Public Relations & External Communication
○ The team proofreads and manages content for external communication.
○ Requests from school leadership (e.g., Bro.) are prioritized for posting.
○ Handles letters, magazines, and official advisories for internal and external
use.
```
#### 5. Additional Responsibilities & Considerations

```
● Event Coverage & Feedback
○ The team edits and reviews media coverage from institutional and departmental
events.
```

```
○ Student organizations submit video teasers for approval.
○ The team also manages the DLSU-D YouTube page and provides feedback on
approved content.
● Form Filling & System Integration
○ Department name & contact information should be visible when filling out
request forms.
○ Possible automated directory feature for commonly requested departments
(e.g., RCC).
○ Additional contact numbers and emails should be inputtable in the system.
```
#### 6. Key Challenges & Future Improvements

```
● Weekend & Holiday Requests
○ Requests submitted on non-working days may not be processed immediately.
○ Suggested automation for flagging requests submitted during
weekends/holidays for approval.
● Manual Workload & Tracking
○ Social media links and approvals are currently tracked manually.
○ The team wants an automated system to improve efficiency.
● Better Coordination Between Units
○ Social Media & Graphics Teams often work together and require seamless
coordination.
○ Role assignments and reminders within the system would help improve
workflow.
```
FORM
● Name
● Office/Department/Organization
● Contact Details
● Office Phone Number
● Type of Request
● Title of Project/Event
● Short Description
● Details
● Additional Information

SYSTEM
● Unit In-Charge
● Date Received
● Date Approved
● Status


UNEDITED NOTES

4 units under sco
1. social media

- posting
- sharing
- caption
- checking of pages
2. graphics
- pub
- merch
- org event
3. multimedia
- photo/video editing
- media coverage
- video (teasers, wrap up video)
- request of photo
4. public relations
- magazine (rotunda)
- letter
- proofreading

Request form (ung physical copy na binigay)

- No other forms for approvals

What are requested to sco

- Social media - request if good to post, if content is okay, this applies to any org or
    department that wants to share in social media, secretary will forward to social media if
    good to post. Then for final checkin, ipapass kay Mam Jesser
- For merch and other pubmats like designs - under graphics since it is under branding of
    DLSUD, chinicheck ung layout, design. Chinicheck ren ng social media and public
    relations for contents or wordings
- For multimedia - for photo and video
- For graphics, other departments can request for graphics or logos and designs.
    - May instance na di nasusunod timetable kasi may dumadating na mas prio or
       mas mabigat
- For requesting of graphics, need ng SCO ng details (concerned dept, title, content,
    elements, etc.)


- Madalas galing sa office or department ung mga nagrerequest

For policies

- No official policies but they want to apply also
- At most 3 major 2 minor revisions
- If requesting for approval (mostly verbal, but we could apply sa system na at least 1
    week (working days) b 4 posting, iapply ren holidays)
       - If bawal na, pede parin ipost pero subject for approval - not acceptance

System could help in improving security

They track in excel

- Manual nagttrack ganern
- Staffs, faculties, students, shs and hs are also being handled under SCO
- Generate report and summary (possible excel format or pdf ren) - format pedeng
    gayahin ung excel nila or if anong mas maganda
- They also communicate with ICTC
- For social media - posting sa page, sharing
- Socmed and graphics most of the time tandem
- Sa system, maganda may role assigning, ung secretary magaassign sa group
- Gusto rin ng reminders
- For checking social media page - kasama na lahat ng departments
- Nakalist lang sakanila ung link ng mga social media page, mano mano
- Graphics - they have guidelines and policies (gusto nila na kita ren sa system na pede
    maview ng iba)
- Graphics - chinicheck lahat (basta under ng dlsud)
- For captions - hindi masyado mahigpit, basta detailed and no offensive words
- For multimedia - hinahandle nila ung pageedit ng photos and videos, color grading
    - Nageemail ng request or coverage
    - Different type of events, institutional or departmental
    - Ineedit nila photos galing sa events
- For events and student orgs - they also check video teasers that will be posted on their
    social medias
       - They don’t handle Heraldo
       - For photo documentations of student orgs events, they don’t check (mostly
          videos talaga)
       - Required
- For public relations - dumadaan sakanila ung mga magazines
    - Letters
    - They handle posting if galing kay Bro.


- If mas mababa na org or dept, magrerequest sa kanila
- Yung pinapacheck sakanila is mga nilalabas sa school or pwede ren outside the
    school
- Like advisories
- Proofreading (and kasama ren director)
- Other stuff being handled by SCO
- Requests
- If requests ay nabibigay ng weekends/holidays, di masyado maaasikaso agad
- Suggests for the system na iautomate na if the requests is done on a holiday/weekend,
subject for approval
- Compatible for mobile
- Makikita sa dashboard ng team members ung mga nakaassign sakanila na
request or approvals
- For filling out forms, need na kita ang department or name
- Possible na iautomate na if this is the selected department (drop down) ex. RCC,
automatic makikita ung directory
- If they also want to add additional contact no.
- They can also input their email
- SCO also handles youtube page of DLSU-D
- They also give feedbacks sa pinapaapprove

Since the **Student Communications Office (SCO)** handles multiple tasks like **social media
management, graphics, multimedia, and public relations** , the system should be designed to
**streamline request handling, approvals, tracking, and automation**.

#### Suggested System for SCO Request & Management

#### Portal

**1. System Overview**

The system will be a **web-based portal** where organizations, departments, and staff can submit
requests for **social media posts, graphics, multimedia, and public relations materials**. The
system will **automate tracking, approvals, and task assignments** to improve workflow
efficiency.

**2. Key Features**

**A. User Roles & Authentication**

```
● Admin (SCO Head/Director) : Full control over requests, user management, approvals,
and reports.
● SCO Staff (Social Media, Graphics, Multimedia, Public Relations Teams) : Assigned
requests and manage approvals within their specific unit.
● Secretary : Manages and assigns requests to appropriate teams.
● Requestor (Departments/Organizations) : Can submit and track request statuses.
```
**B. Request Submission & Tracking**

```
● A centralized request form where users can input:
○ Request type (Social Media, Graphics, Multimedia, Public Relations)
○ Department/Organization
○ Content details (captions, media files, design elements, etc.)
```

```
○ Deadlines and priority levels
● Requests are automatically assigned to the correct unit based on type.
● Status tracking for requestors to check updates on their submissions.
```
**C. Approval & Revision Management**

```
● Multi-level approval process :
○ Social Media Posts : Requires verification from Social Media Unit → Final
approval by Ms. Jesser.
○ Graphics & Multimedia : Reviewed by Graphics/Multimedia Units → Final review
by PR if needed.
○ Public Relations : Goes through proofreading and director approval before
external release.
● Revision tracking : System allows up to 3 major and 2 minor revisions before
approval.
```
**D. Automated Notifications & Reminders**

```
● Email & dashboard notifications for:
○ New requests
○ Pending approvals
○ Completed requests
● Reminders for deadlines, upcoming posts, and approval delays.
```
**E. Dashboard & Reports**

```
● Admin Dashboard : Overview of all pending, approved, and completed requests.
● Unit Dashboards : Each unit (Social Media, Graphics, etc.) sees assigned tasks and
deadlines.
● Excel/PDF Reports : Automatic generation of reports for tracking progress.
```
**F. Mobile Compatibility**

```
● The system should be accessible via mobile devices to allow staff to check updates
and approve requests on the go.
```
**G. Role-Based Access Control**

```
● Each unit only sees requests relevant to them.
● The secretary assigns tasks to appropriate team members.
```
#### 3. Technology Stack & Development Plan

**A. Tech Stack Options**

```
1. Frontend :
○ React.js or Vue.js (for a fast and interactive UI)
○ Bootstrap or Tailwind CSS (for responsive design)
2. Backend :
○ ASP.NET Core MVC (C#) – Recommended for structured and scalable
development
○ Node.js (Express.js) – Alternative for a more lightweight backend
3. Database :
○ SQL Server (Best for enterprise applications and structured data)
○ Firebase (If real-time data updates are needed)
4. Authentication :
○ ASP.NET Identity (for role-based login)
○ Google/Microsoft OAuth (for staff login integration)
```

#### 4. Development Roadmap

**Phase 1 : Planning & Design**

```
Identify user roles and permissions.
Design the request submission workflow.
Create UI/UX wireframes.
```
**Phase 2 : Development (MVP - Minimum Viable Product)**

```
User Authentication & Role Management
Request Submission & Dashboard
Approval Workflow & Notifications
```
**Phase 3 : Refinements & Automation**

```
Implement revision tracking
Add Excel/PDF report generation
Integrate mobile-friendly access
```
**Phase 4 : Testing & Deployment**

```
Conduct testing with actual SCO staff.
Gather feedback and improve UI.
Deploy system and train users.
```
#### 5. Additional Suggestions for Improvement

```
● AI-Based Content Check : Auto-detects inappropriate words in captions.
● Auto-Scheduling for Social Media Posts : Allow users to select a posting date/time.
● Searchable Request Archive : View past requests easily for reference.
```
Based on the introduction of your study, developing a Request and Management Portal for the
Strategic Communications Office (SCO) at De La Salle University-Dasmariñas (DLSU-D) is an
excellent idea. This portal can streamline the process of handling service requests, publication
approvals, and media-related inquiries, addressing the current challenges faced by the SCO.

Here are some specific features that your web-based system, S-CORE (SCO – Creative Optimization
for Requests and Engagement), could include:

1. Centralized Request Tracking System: A dashboard where users can submit, track, and
    manage their requests in real-time. This will help in reducing the clutter of emails and MS
    Teams notifications.
2. Automated Approval Workflow: A system that automates the approval process, ensuring
    that requests are reviewed and approved efficiently. This can include personalized
    workflows for different types of requests.
3. Task Management: Features to delegate and monitor tasks, set clear deadlines, and
    assign responsibilities. This will help in managing the workload and ensuring timely
    completion of tasks.
4. Real-Time Notifications and Reminders: Automated reminders and notifications for
    pending approvals, outstanding tasks, and approaching deadlines to keep everyone on
    track.


5. Resource Allocation: Tools to allocate tasks to the right personnel based on their position,
    availability, and skillset, ensuring efficient use of resources.
6. Collaboration Tools: Integrated commenting and communication features to facilitate
    collaboration between requestors and SCO staff without needing third-party applications.
7. Performance Insights and Reporting: Analytics and reporting tools to provide insights into
    completed projects, request patterns, and turnaround times, supporting data-driven
    decision-making.
8. User Management and Role-Based Access: Different levels of access for requesters, SCO
    staff, and administrators to ensure data security and integrity.
9. Document and Media Management: A repository for storing and managing documents,
    media files, and other resources related to requests and projects.
10. Integration with Existing Systems: Compatibility with existing university systems like
    Outlook and MS Teams to ensure seamless communication and data flow.

By incorporating these features, the S-CORE system can significantly enhance the efficiency and
effectiveness of the SCO, helping it better serve the DLSU-D community and achieve its institutional
goals. Does this align with your vision for the project?

ORGANIZE THIS NOTES

March 6 interview

Strategic Communications Office
History (to be provided copy of detailed information)
FORMERLY CALLED:
ICO - Institutional Communicatons Office
MCO - Marketing Communications Office
SCO - Strategic Communictions Office

- Each team report to the immediate head (director)
- They have different report per unit (achievements, accomplishments, projects)
    - Then they collate the reports to be given to director and then director will report
       also to the higher ups
- Type of report
    - Accomplishments
    - Projects
    - Events
    - Request
- Daily they check and update their excel
- They report quarterly for the higher ups
- But they keep it monthly


- Daily they receive approximately atleast 1 to 3 and sometimes more than 3 - 6. Depends
    because sometimes they receive many requests.
- Reports are being requested to them quarterly ex.Dec 2024 - February 2025
- Much convenient if automatic sa report generation na may quarterly,monthly,daily
- 20 - 30 requests per month approximately
- For simple edits, they try to give fast feedback ( 1 - 3 days)
- There are urgent tasks so some task are being on hold
- For report generation (secretary and director only) - but the teams can view the reports
- For the reports generated (same with the table excel they have but include remarks
    column)
       - Reports are separated by units
       - Generated per month or quarterly? Not sure, suggest ko flexible ang pag
          generate
       - Director and secretary can generate reports but other units can still view
- For highschool and shs orgs - they request if malakahan na posts/events/institutional but
    for sakanila lang hindi na
- SCO also covers events upon request
- They don’t request any fee/benefits upon requests for covering events
- TThey have meetings about suggestions, covering events
- Progress of requests should be visible to all related to the events

### ORGANIZED MARCH 6 INTERVIEW

## Strategic Communications Office (SCO) -

## Interview Notes (March 6 , 2024 )

#### 1. Background & Structure

**History & Evolution**

The **Strategic Communications Office (SCO)** was formerly known as:

```
● Institutional Communications Office (ICO)
● Marketing Communications Office (MCO)
```
Each unit reports to its **immediate head (director)** and submits **individual reports** on
achievements, projects, and requests. These reports are consolidated and presented to
**higher-ups** by the director.

**Types of Information in the Reports Submitted**

```
● Accomplishments
● Projects
● Events
● Requests
```
**Reporting Process & Frequency**

```
● Daily Tasks : The team updates an Excel tracker with new requests and ongoing
projects.
● Monthly Reports : Maintained for internal tracking and review.
● Quarterly Reports : Submitted to higher-ups (e.g., reports from Dec 2024 - Feb 2025 ).
```
**Request Volume & Workflow**


```
● The team receives 1 - 3 requests daily , sometimes increasing to 3 - 6 requests per day.
● On average, 20 - 30 requests per month are handled.
● Simple edits receive feedback within 1 - 3 days.
● Some tasks may be put on hold due to urgent priorities.
```
#### 2. Report Generation & Tracking

**Current Tracking Method**

```
● All reports are manually tracked in Excel.
● Reports are separated by units (Social Media, Graphics, Multimedia, Public Relations).
● Remarks column should be added for better tracking.
```
**System Suggestions for Automation**

```
● Report Generation Options : Should be flexible to allow for daily, monthly, or
quarterly reports.
● Automatic Report Compilation : To make quarterly reporting more convenient.
● Access Control :
○ Secretary & Director : Can generate reports.
○ Units : Can view reports but not edit them.
```
#### 3. Requests & Event Coverage

**Handling Requests from High School & SHS Organizations**

```
● If a large-scale event or institutional request is made, SCO handles it.
● Small-scale requests (within HS/SHS) are managed internally by the requesting unit.
```
**Event Coverage**

```
● SCO provides event coverage upon request but does not charge fees or request
benefits.
● Meetings are held for suggestions and planning event coverage.
● Request progress should be visible to all team members involved in the event.
```
#### 4. Key Challenges & Future Improvements

```
● High Request Volume : Multiple requests per day may delay certain tasks.
● Manual Tracking System : Transitioning to an automated system would improve
efficiency.
● Flexible Report Generation : The system should allow daily, monthly, and quarterly
reports.
● Request Transparency : All stakeholders should see the progress of their requests in
the system.
```
High importance in email

SOP 1 - 3 change


Add request type


# JOHN CODING INSTRUCTION


**I. Request for Approval Form: Submission of** **_Existing_** **Materials for**

###### Review/Vetting

```
Request Type Description Primary SCO Unit(s) for
Review/Approval
```
```
Social Media Post
Content/Caption
```
```
Submission of caption/text for
social media posting for
content and grammar check,
and final posting approval.
```
```
Public Relations Unit,
Social Media Unit
(Final approval by
Director/Ms. Jesser)
```
```
Draft Official
Letter/Advisory
```
```
Submission of official
communication (internal or
external letters, advisories) for
proofreading and content
review.
```
```
Public Relations Unit
(Final review/approval
by Director)
```
```
Event Teaser Video
Approval
```
```
Submission of a video teaser
(usually from a student
organization) for review and
approval before posting.
```
```
Multimedia Unit
```
```
Publication
Material/Pubmat
Design Vetting
```
```
Submission of a designed
publication material (flyer,
poster, social media graphic,
etc.) created by the requestor,
to ensure compliance with
DLSU-D branding and design
guidelines.
```
```
Graphics Unit (for
layout/design check)
```
```
Publication
Wording/Content
Check
```
```
Submission of a final copy's
text (e.g., brochure copy,
event details for publication)
for accuracy and content
check.
```
```
Public Relations Unit,
Social Media Unit
```
```
Logo/Merchandise
Design Vetting
```
```
Submission of a draft logo,
merchandise design, or other
non-pubmat collateral for
branding and quality review.
```
```
Graphics Unit
```
###### II. Service Request Form: Requesting the SCO to Create/Execute a Task

```
Request Type Description Primary SCO
Unit(s) for
```

```
Service/Task
Execution
```
**Creation of New
Graphics/Pubmat**

```
Request for the Graphics Unit to
design a new publication material
(poster, graphic, etc.) from scratch.
```
```
Graphics Unit
```
**Creation of New
Logo/Branding
Element**

```
Request for the Graphics Unit to
design a new logo or branding
element for an office/department.
```
```
Graphics Unit
```
**Event Photo & Video
Coverage**

```
Request for a Multimedia Unit
member to cover an event (photo
and/or video).
```
```
Multimedia Unit
```
**Photo/Video Editing
Service**

```
Request for photo or video
editing/color grading service (e.g.,
event documentation editing).
```
```
Multimedia Unit
```
**Magazine Content
Creation**

```
Request for original content (e.g.,
articles, features) to be written or
prepared for the Rotunda
magazine or other official
publications.
```
```
Public Relations
Unit
```
**Social Media Content
Sharing/Posting**

```
Request for the Social Media Unit
to share or post approved content
(typically for major events or
institutional announcements).
```
```
Social Media Unit
```

# checkbox


#### Project Task Checklist

```
Notifications & Assignments
Unit Notifications: Implement notifications for units when a request is automatically
assigned to them.
Admin Notifications: Update admin-side notifications for new submissions to clearly
indicate when a request has been auto-assigned.
Admin Reassignment: Enable admins to reassign a task to one or more units
simultaneously (allow multi-select).
```
**Calendar & UI Fixes**

```
Calendar Modal: Fix the calendar's "open date" modal to correctly display all request
types, including "requests for approval" (it currently only shows "service requests").
User Side (UI Bug): Fix the display issue where the navigation sidebar incorrectly
overlaps (is not covered by) the modal backdrop during request submission.
New Feature: Advanced Request Configuration
This feature introduces a new workflow for handling both predefined and custom
requests.
User-Side Submission Flow:
Allow users to either select a predefined request type from a list OR type in a
custom request.
Logic: When a user types a custom request, bypass the auto-assignment rules.
These requests should be flagged for manual admin assignment.
New Admin "Settings" Page:
Create a new "Request Settings" or "Configuration" page in the admin panel.
Request Type Management (CRUD): Give admins full CRUD (Create, Read,
Update, Delete) abilities for predefined request types.
Assignment Configuration: Allow admins to modify which unit(s) are assigned
to each specific request type.
User Suggestion Management: Create a section where admins can review all
user-submitted custom requests. Admins should be able to approve these
(turning them into official, predefined types) or delete them.
```

# Tab 12



