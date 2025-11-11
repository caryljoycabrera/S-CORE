# Unit Navbar System - Complete Implementation

## Overview
A dedicated, mobile-responsive navigation system for all unit pages with hover tooltips and smooth animations. This system provides a consistent navigation experience across desktop and mobile devices.

## Files Created/Modified

### 1. **CSS Stylesheet**
**File:** `public/stylesheets/unit-navbar.css`
- Dedicated unit-specific styling
- Mobile-first responsive design
- Hover tooltip system for collapsed state
- Smooth animations and transitions
- Green color scheme (matching unit branding)

### 2. **JavaScript Handler**
**File:** `public/javascripts/unit-navbar.js`
- Handles mobile sidebar toggle
- Desktop hover expansion
- Backdrop click handling
- Escape key support
- Window resize handling

### 3. **Reusable Partial**
**File:** `views/partials/unit-navbar.ejs`
- Reusable sidebar component
- Accepts `user` and `activePage` parameters
- Consistent across all unit pages
- Includes profile section, navigation items, and logout

## Updated Unit Pages

All unit pages now use the new navbar system:

1. **unitdashboard.ejs** - Dashboard page
2. **AllTasks.ejs** - All tasks page
3. **TaskApprovals.ejs** - Approval tasks page
4. **TaskServices.ejs** - Service tasks page

## Features

### 🖥️ Desktop Features
- **Hover to Expand**: Sidebar expands from 64px to 240px on hover
- **Tooltip on Hover**: When collapsed, hovering over icons shows tooltips with labels
- **Smooth Transitions**: All animations use cubic-bezier easing
- **Profile Section**: Shows avatar and user info when expanded
- **Active State**: Current page is highlighted with white border and background

### 📱 Mobile Features
- **Hamburger Menu**: Toggle button in header
- **Slide-in Sidebar**: Smooth slide animation from left
- **Backdrop Overlay**: Semi-transparent backdrop with blur effect
- **Always Expanded**: Full labels visible when sidebar is open
- **Touch-Friendly**: Large tap targets for mobile devices
- **Responsive Header**: Adjusts height and spacing based on screen size

### 🎨 Visual Design
- **Green Gradient**: Linear gradient from `#10b981` to `#059669`
- **White Icons & Text**: High contrast for readability
- **Rounded Corners**: 12px border radius on interactive elements
- **Hover Effects**: Background highlight and transform on hover
- **Active Indicator**: 4px white left border on current page

### 🔄 Responsive Breakpoints
- **Desktop** (>768px): Hover expansion, tooltips enabled
- **Tablet** (≤768px): Mobile sidebar, 60px header
- **Mobile** (≤480px): Compact header, 56px height
- **Extra Small** (≤360px): Minimum padding preserved

## Usage

### Including the Navbar in a Page

```html
<!-- In the <head> section -->
<link rel="stylesheet" href="/stylesheets/unit-navbar.css" />
<script src="/javascripts/unit-navbar.js"></script>

<!-- In the <body> section -->
<%- include('../partials/unit-navbar', { user: user, activePage: 'dashboard' }) %>
```

### Active Page Values
- `'dashboard'` - Dashboard page
- `'all-tasks'` - All Tasks page
- `'task-approvals'` - Approval Tasks page
- `'task-services'` - Service Tasks page
- `'reports'` - Reports page
- `'guide'` - Help & Guide page

### Main Content Container

All unit pages should use:
```html
<div class="unit-main-content">
  <!-- Header and content here -->
</div>
```

### Header Structure

```html
<div class="overlap">
  <div class="header-left-group">
    <button class="unit-menu-toggle" id="unitMenuToggle" title="Open Menu">
      <!-- Hamburger SVG -->
    </button>
    <div class="group">
      <img src="/Picture/logo.jpg" alt="S-CORE Logo">
    </div>
    <a href="/unit/dashboard" class="text-wrapper">S-CORE UNIT</a>
  </div>
  
  <span class="text-wrapper-2">Page Title</span>
  
  <div class="header-right-section">
    <!-- Notifications and profile dropdown -->
  </div>
</div>
```

## CSS Classes Reference

### Sidebar Classes
- `.unit-sidebar` - Main sidebar container
- `.unit-sidebar-profile` - Profile section at top
- `.unit-sidebar-profile-link` - Profile link wrapper
- `.unit-sidebar-profile-avatar` - User profile image
- `.unit-sidebar-items` - Navigation items container
- `.unit-sidebar-item` - Individual nav item
- `.unit-sidebar-item.active` - Active/current page
- `.unit-sidebar-icon` - Icon SVG
- `.unit-sidebar-label` - Text label
- `.unit-sidebar-logout` - Logout button
- `.unit-sidebar-bottom` - Bottom section container
- `.unit-sidebar-backdrop` - Mobile overlay backdrop

### Main Content Classes
- `.unit-main-content` - Main content wrapper
- `.unit-menu-toggle` - Mobile hamburger button
- `.header-left-group` - Header left section
- `.header-right-section` - Header right section

### State Classes
- `.mobile-active` - Mobile sidebar open state
- `.expanded` - Desktop expanded state (hover)
- `.active` - Active navigation item / backdrop visible

## JavaScript API

### Functions
- `toggleSidebar()` - Toggle mobile sidebar open/closed
- `closeSidebar()` - Close mobile sidebar
- `handleDesktopHover()` - Initialize desktop hover behavior

### Event Listeners
- Hamburger button click
- Backdrop click
- Outside click (mobile)
- Navigation link click (mobile auto-close)
- Window resize
- Escape key press

## Customization

### Changing Colors

Edit CSS custom properties in `unit-navbar.css`:
```css
:root {
  --unit-primary: #10b981;      /* Primary green */
  --unit-secondary: #059669;    /* Secondary green */
  --unit-dark: #047857;         /* Dark green */
  --unit-light: #d1fae5;        /* Light green */
}
```

### Adjusting Sidebar Width

```css
:root {
  --sidebar-width-collapsed: 64px;   /* Collapsed width */
  --sidebar-width-expanded: 240px;   /* Expanded width */
}
```

### Header Heights

```css
:root {
  --header-height-desktop: 80px;
  --header-height-mobile: 60px;
  --header-height-mobile-xs: 56px;
}
```

## Tooltip System

### Desktop Only
Tooltips appear when hovering over sidebar items in collapsed state:
- Dark background (`rgba(0, 0, 0, 0.9)`)
- 8px border radius
- Positioned 12px to the right of icon
- Includes arrow pointer
- Smooth fade-in animation

### Customizing Tooltips

The tooltip text is taken from the `title` attribute:
```html
<a href="/unit/dashboard" class="unit-sidebar-item" title="Dashboard">
```

## Browser Compatibility

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile Safari (iOS)
✅ Chrome Mobile (Android)

## Performance Optimizations

- CSS transitions use GPU-accelerated properties
- Debounced resize event handler (250ms)
- Efficient event delegation
- Minimal repaints with transform properties
- backdrop-filter for smooth blur effect

## Accessibility

- Semantic HTML structure
- ARIA-friendly tooltips via title attributes
- Keyboard navigation support (Escape key)
- High contrast text and icons
- Focus states preserved
- Touch-friendly tap targets (48px minimum)

## Testing Checklist

### Desktop
- [x] Sidebar expands on hover
- [x] Tooltips appear when collapsed
- [x] Active page is highlighted
- [x] Smooth transitions
- [x] Profile section shows avatar when expanded

### Mobile
- [x] Hamburger menu toggles sidebar
- [x] Backdrop appears/disappears correctly
- [x] Sidebar slides in from left
- [x] Clicking outside closes sidebar
- [x] Clicking nav link closes sidebar
- [x] Escape key closes sidebar
- [x] Header is responsive

### Tablet (768px)
- [x] Switches to mobile mode
- [x] Header height adjusts
- [x] Touch interactions work

### Small Mobile (480px)
- [x] Even more compact header
- [x] All elements remain accessible
- [x] Logo scales down appropriately

## Troubleshooting

### Sidebar not expanding on desktop
- Check that JavaScript file is loaded
- Verify screen width > 768px
- Ensure `.expanded` class is being toggled

### Mobile menu not opening
- Confirm `unit-navbar.js` is included
- Check hamburger button ID: `unitMenuToggle`
- Verify sidebar ID: `unitSidebar`

### Tooltips not showing
- Desktop only feature (width > 768px)
- Check `title` attribute is set
- Ensure sidebar is in collapsed state

### Styling conflicts
- Unit navbar uses specific class names (`.unit-*`)
- Should not conflict with user navbar (`.user-*`)
- Check CSS file load order

## Future Enhancements

Potential improvements for future versions:
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] ARIA labels for screen readers
- [ ] Dark mode support
- [ ] Customizable icon sets
- [ ] Nested navigation items
- [ ] Badge notifications on nav items
- [ ] Animation preferences respect (prefers-reduced-motion)

## Maintenance Notes

- All unit pages should use the new `unit-navbar.ejs` partial
- Old `unit-sidebar.ejs` is kept for backwards compatibility
- CSS variables make theming easy
- JavaScript is vanilla JS (no dependencies)
- Mobile-first approach ensures good performance

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all files are properly linked
3. Test in different browsers/devices
4. Review this documentation

---

**Last Updated:** January 13, 2025
**Version:** 1.0.0
**Maintained by:** S-CORE Development Team
