# Quick Guide: Adding User Navbar to Other Pages

## Template Structure

Use this template when adding the navbar to other user pages:

### 1. Head Section
```html
<head>
  <!-- ... existing meta tags and stylesheets ... -->
  <link rel="stylesheet" href="/stylesheets/user-navbar.css" />
</head>
```

### 2. Body Structure
```html
<body>
  <!-- SIDEBAR NAVIGATION -->
  <div class="user-sidebar" id="userSidebar">
    <div class="sidebar-items">
      <a href="/dashboard" class="sidebar-item" title="Dashboard">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span class="sidebar-label">Dashboard</span>
      </a>
      
      <a href="/all-requests" class="sidebar-item" title="All Requests">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
        </svg>
        <span class="sidebar-label">All Requests</span>
      </a>
      
      <a href="/request-approvals" class="sidebar-item" title="Request Approvals">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="sidebar-label">Request Approvals</span>
      </a>
      
      <a href="/service-requests" class="sidebar-item" title="Request Services">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"></path>
        </svg>
        <span class="sidebar-label">Request Services</span>
      </a>
      
      <a href="/profile" class="sidebar-item" title="My Profile">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="sidebar-label">My Profile</span>
      </a>
    </div>
    
    <!-- Logout Button at Bottom -->
    <div class="sidebar-bottom">
      <a href="/logout" class="sidebar-item sidebar-logout" title="Logout">
        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span class="sidebar-label">Logout</span>
      </a>
    </div>
  </div>

  <!-- MAIN CONTENT WITH HEADER -->
  <div class="user-main-content">
    <!-- HEADER -->
    <div class="overlap">
      <!-- Left Group: Hamburger, Logo, Title -->
      <div class="header-left-group">
        <!-- Hamburger Menu Button for Mobile -->
        <button class="user-menu-toggle" id="userMenuToggle" title="Open Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="group">
          <img src="/Picture/logo.jpg" alt="S-CORE Logo" style="width:64px;height:59px;">
        </div>
        <a href="/dashboard" class="text-wrapper">S-CORE</a>
      </div>
      
      <span class="text-wrapper-2">Welcome, <%= name %>!</span>

      <div class="header-right-section">
        <%- include('../partials/notifications') %>
        
        <div class="dropdown-wrapper">
          <div class="overlap-group dropdown-toggle" onclick="toggleDropdown()">
            <div class="text-wrapper-3"><%= user.fName %> <%= user.lName %></div>
            <div class="user">
              <img class="user-icon" src="<%= user.profilePicture ? '/uploads/' + user.profilePicture : '/Picture/user.png' %>" alt="User Icon" />
            </div>
          </div>
          <div class="dropdown-menu" id="dropdownMenu">
            <a href="/profile">My Profile</a>
            <a href="/logout">Logout</a>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGE CONTENT GOES HERE -->
    <div class="student-side">
      <!-- Your existing page content -->
    </div>
  </div>
  <!-- End of user-main-content -->

  <!-- Your existing modals and scripts -->
  
  <script>
    // Sidebar hover effect for desktop
    const sidebar = document.getElementById('userSidebar');
    if (sidebar) {
      sidebar.addEventListener('mouseenter', function() {
        this.classList.add('expanded');
      });
      sidebar.addEventListener('mouseleave', function() {
        this.classList.remove('expanded');
      });
    }

    // Mobile Navigation Setup
    document.addEventListener('DOMContentLoaded', () => {
      const menuToggle = document.getElementById('userMenuToggle');
      const sidebarEl = document.getElementById('userSidebar');
      let touchStartX = 0;
      let touchEndX = 0;

      function initMobileNavigation() {
        if (menuToggle && sidebarEl) {
          menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebarEl.classList.toggle('mobile-active');
          });

          sidebarEl.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
          }, { passive: true });

          sidebarEl.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
          }, { passive: true });

          sidebarEl.addEventListener('touchend', () => {
            handleSwipe();
          });

          document.addEventListener('click', (e) => {
            if (sidebarEl.classList.contains('mobile-active') &&
                !sidebarEl.contains(e.target) &&
                !menuToggle.contains(e.target)) {
              sidebarEl.classList.remove('mobile-active');
            }
          });
        }
      }

      function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        if (swipeDistance < -50 && sidebarEl.classList.contains('mobile-active')) {
          sidebarEl.classList.remove('mobile-active');
        }
        if (swipeDistance > 50 && !sidebarEl.classList.contains('mobile-active') && touchStartX < 50) {
          sidebarEl.classList.add('mobile-active');
        }
      }

      initMobileNavigation();
    });
  </script>
</body>
```

## Active Page Highlighting

Add the `active` class to the appropriate sidebar item for each page:

### For `/all-requests` (allRequestsUser.ejs)
```html
<a href="/all-requests" class="sidebar-item active" title="All Requests">
```

### For `/request-approvals` (Requestapproval.ejs)
```html
<a href="/request-approvals" class="sidebar-item active" title="Request Approvals">
```

### For `/service-requests` (ServiceRequest.ejs)
```html
<a href="/service-requests" class="sidebar-item active" title="Request Services">
```

### For `/profile` (profile.ejs)
```html
<a href="/profile" class="sidebar-item active" title="My Profile">
```

## CSS Adjustments for Existing Pages

If a page already has custom styles that conflict with the navbar, you may need to adjust:

1. **Remove fixed header styles** if page already has one
2. **Remove left margin** from main content (handled by user-main-content wrapper)
3. **Adjust padding-top** to accommodate fixed header (handled by user-main-content)

## Testing After Implementation

1. ✅ Hover works on desktop
2. ✅ Active state shows correctly
3. ✅ Mobile menu opens/closes
4. ✅ Swipe gestures work
5. ✅ All links navigate correctly
6. ✅ No layout breaks
7. ✅ Responsive at all breakpoints

## Common Issues and Fixes

### Issue: Sidebar overlaps content
**Fix**: Ensure content is wrapped in `<div class="user-main-content">` wrapper

### Issue: Active state not showing
**Fix**: Add `active` class to current page's sidebar item

### Issue: Mobile menu not closing
**Fix**: Verify `userMenuToggle` ID matches button ID

### Issue: Sidebar too wide on mobile
**Fix**: CSS already handles this; check for conflicting styles

### Issue: Header text cut off
**Fix**: Reduce text size in mobile breakpoint or hide secondary text
