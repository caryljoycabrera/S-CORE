# Configuration Page - All Functionalities Working

## ✅ Working Features

### Tab Navigation
- **Homepage Configuration Tab** - Switch to edit homepage content
- **System Configuration Tab** - Switch to edit system settings
- Auto-switches to appropriate tab based on URL parameter (`?tab=system`)
- Default loads Homepage tab

### Homepage Configuration (Form ID: `configForm`)
**POST Endpoint:** `/admin/configuration`

#### Sections:
1. **Hero Section**
   - Hero Title, Title Highlight, Subtitle
   - Primary and Secondary Button Text/Links

2. **Pledge Section** (Dynamic)
   - Add/Remove pledge items
   - Each item: Name, Description
   - Function: `addPledgeItem()`, `removePledgeItem(button)`

3. **About Section**
   - Section titles and subtitles
   - Mission and Vision with titles
   - Dynamic Features (Add/Remove)
   - Function: `addAboutFeature()`, `removeAboutFeature(button)`

4. **Services Section** (Dynamic)
   - Add/Remove service items
   - Each item: Title, Description
   - Function: `addServiceItem()`, `removeServiceItem(button)`

5. **Team Section** (Dynamic)
   - Add/Remove team members
   - Each member: Name, Role, Email
   - Function: `addTeamMember()`, `removeTeamMember(button)`

6. **Contact Section** (Dynamic)
   - Section title and intro text
   - Add/Remove contact cards
   - Each card: Icon, Title, Description, Contact Info, Contact Type
   - Function: `addContactCard()`, `removeContactCard(button)`

7. **Social Media Section** (Dynamic)
   - Add/Remove social media links
   - Each link: Icon, Title, URL
   - Function: `addSocialMedia()`, `removeSocialMedia(button)`

8. **Footer Section** (Dynamic)
   - Footer tagline and text
   - Add/Remove footer links
   - Each link: Text, URL
   - Function: `addFooterLink()`, `removeFooterLink(button)`

#### Actions:
- **Preview Changes** - Opens modal with live preview of homepage
  - Function: `showPreview()`, `closePreview()`
- **Save Changes** - Submits form with validation
  - Validates required fields (heroTitle, heroSubtitle)
  - Shows confirmation modal before saving
  - Function: `confirmSave()`
- **Reset Form** - Reloads page to discard changes
  - Shows confirmation modal
  - Function: `resetForm()`, `confirmReset()`

---

### System Configuration (Form ID: `systemConfigForm`)
**POST Endpoint:** `/admin/system-configuration`

#### Sections:

1. **Organizations**
   - Textarea input (one per line)
   - Currently has 70 organizations

2. **Offices/Departments**
   - Textarea input (one per line)
   - Currently has 106 offices

3. **Units & Request Types** (Dynamic)
   - Add/Remove units with their request types
   - Each unit: Name, Request Types (textarea, one per line)
   - Auto-updates unit label when name changes
   - Function: `addUnitWithRequestTypes()`, `removeUnitWithRequestTypes(button)`
   - Function: `updateUnitLabel(input)`, `updateUnitNumbers(container)`

4. **Request Statuses**
   - Textarea input (one per line)
   - Default statuses: Pending, Queued, In Progress, For Checking, Approved, For Revision, Completed, Rejected, Archived

5. **User Types**
   - Textarea input (one per line)
   - Customizable user types for registration (Student, Faculty, Staff, Alumni, etc.)
   - Admins can add/modify user types as needed

6. **User Roles** (Dynamic)
   - Add/Remove user roles with simplified permissions
   - Each role: Name, Access Level (dropdown)
   - Auto-updates role label when name changes
   - Function: `addUserRole()`, `removeUserRole(button)`
   - Function: `updateRoleLabel(input)`, `updateRoleNumbers(container)`
   
   **Access Levels:**
   - **Submits Requests** - Can create and view their own requests
   - **Works on Tasks** - Can view all requests, work on assigned tasks, and upload deliverables
   - **Full System Access** - Complete administrative access to all system features

7. **Announcement Priorities**
   - Textarea input (one per line)
   - Default: low, medium, high

8. **Announcement Types**
   - Textarea input (one per line)
   - Default: Event, News, Reminder, Update, Maintenance

9. **General Settings**
   - Site Title (text input)
   - Site Description (textarea)
   - Timezone (select dropdown)
   - Date Format (select dropdown)
   - Language (select: English/Filipino)
   - Logo URL (text input, optional)
   - Favicon URL (text input, optional)

10. **Request Management Settings**
   - Max Major Revisions (number)
   - Max Minor Revisions (number)
   - Default Deadline Days (number)
   - Auto-approve After Revisions (checkbox)
   - Require Unit Review (checkbox)

11. **File Storage Settings**
    - Max File Size in MB (number)
    - Allowed File Types (textarea, one per line)
    - Storage Type (select: local/aws/gcs)
    - Retain All Revision Files (checkbox)
    - Auto-delete Old Files After Days (number, optional)

12. **Notification Settings**
    - Enable Email Notifications (checkbox)
    - Notification Frequency (select: immediate/daily/weekly)
    - Email From Address (email input)
    - SMTP Host (text input)
    - SMTP Port (number input)

13. **Maintenance & Backup**
    - Maintenance Mode (checkbox)
    - Maintenance Message (textarea)
    - Backup Enabled (checkbox)
    - Backup Frequency (select: daily/weekly/monthly)
    - Backup Retention Days (number)

14. **Audit & Logging**
    - Enable Detailed Logs (checkbox)
    - Track User Actions (checkbox)
    - Log Retention Days (number)

#### Actions:
- **Save Changes** - Submits form directly
  - Basic validation for required fields
- **Reset Form** - Clears form and dynamic containers
  - Shows browser confirmation dialog
  - Function: `resetSystemForm()`

---

## Success/Error Message Handling
- Displays success messages from URL parameter: `?success=...`
- Displays error messages from URL parameter: `?error=...`
- Auto-cleans URL after displaying message
- Uses alert() for now (can be enhanced with custom toast notifications)

---

## Form Styling
- All form elements styled consistently:
  - Text inputs, email inputs, URL inputs
  - Number inputs (with spin buttons removed for cleaner UI)
  - Select dropdowns (custom arrow icon)
  - Textareas (resizable)
  - Checkboxes (custom styled with blue checkmark)
- Focus states with blue border and shadow
- Hover effects on checkboxes and labels
- Smooth transitions on all interactive elements

---

## Dynamic Item Management
- **Auto-numbering**: All dynamic items auto-update their numbers when added/removed
- **Item labels**: Unit and role items show their names in the header
- **Remove buttons**: Styled "×" button to remove items
- **Consistent styling**: All dynamic items use same `.dynamic-item` class

---

## Backend Routes

### GET `/admin/configuration`
- Requires admin authentication
- Loads homepage content from Page model (slug: 'home')
- Loads system settings from SystemSettings model
- Passes both to configuration.ejs template

### POST `/admin/configuration`
- Requires admin authentication
- Saves homepage content to Page model
- Also saves backup to `data/homepage.json`
- Redirects with success/error message

### POST `/admin/system-configuration`
- Requires admin authentication
- Processes all system configuration fields
- Saves to SystemSettings via settingsService
- Updates cache
- Redirects with success/error message

---

## Database Integration
- **All data loads from database** - No hardcoded values
- **SystemSettings model** - Single document with all configuration
- **Page model** - Homepage content stored with slug 'home'
- **settingsService** - Caches settings for performance

---

## Notes
- Feature Flags section has been removed as requested
- All missing SystemSettings fields have been added to UI
- Forms are fully functional with proper validation
- All dynamic add/remove functions working
- Tab switching works with URL parameters
- Success/error messages displayed properly
