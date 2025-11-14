/**
 * =============================================================================
 * UNIT-NAVBAR.JS - SIDEBAR NAVIGATION FUNCTIONALITY FOR UNIT PAGES
 * =============================================================================
 * Purpose: Handle sidebar interactions for all unit pages
 * Features: Mobile toggle, hover expansion, backdrop handling
 * =============================================================================
 */

(function() {
  'use strict';

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[UNIT-NAVBAR] DOM Content Loaded');
    
    // Get elements
    const sidebar = document.getElementById('unitSidebar');
    const menuToggle = document.getElementById('unitMenuToggle');
    const backdrop = document.getElementById('unitSidebarBackdrop');
    
    console.log('[UNIT-NAVBAR] Elements found:', {
      sidebar: !!sidebar,
      menuToggle: !!menuToggle,
      backdrop: !!backdrop
    });
    
    if (sidebar) {
      const computedStyle = window.getComputedStyle(sidebar);
      console.log('[UNIT-NAVBAR] Sidebar computed styles:', {
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        zIndex: computedStyle.zIndex,
        display: computedStyle.display
      });
    }
    
    // Check if elements exist before proceeding
    if (!sidebar || !menuToggle) {
      console.warn('[UNIT-NAVBAR] Unit sidebar elements not found');
      return;
    }

    // Debug CSS variables
    const rootStyles = window.getComputedStyle(document.documentElement);
    const headerHeight = rootStyles.getPropertyValue('--header-height-desktop');
    const sidebarCollapsed = rootStyles.getPropertyValue('--sidebar-width-collapsed');
    const sidebarExpanded = rootStyles.getPropertyValue('--sidebar-width-expanded');
    
    console.log('[UNIT-NAVBAR] CSS Variables:', {
      headerHeight: headerHeight,
      sidebarCollapsed: sidebarCollapsed,
      sidebarExpanded: sidebarExpanded
    });
    
    // Check main content positioning
    const mainContent = document.querySelector('.unit-main-content');
    if (mainContent) {
      const mainStyle = window.getComputedStyle(mainContent);
      console.log('[UNIT-NAVBAR] Main content styles:', {
        marginLeft: mainStyle.marginLeft,
        paddingTop: mainStyle.paddingTop,
        position: mainStyle.position
      });
    }
    
    // Check header positioning
    const header = document.querySelector('.unit-main-content .overlap');
    if (header) {
      const headerStyle = window.getComputedStyle(header);
      console.log('[UNIT-NAVBAR] Header styles:', {
        position: headerStyle.position,
        top: headerStyle.top,
        height: headerStyle.height,
        zIndex: headerStyle.zIndex
      });
    }

    /**
     * Toggle sidebar on mobile
     */
    function toggleSidebar() {
      console.log('[UNIT-NAVBAR] Toggle sidebar');
      sidebar.classList.toggle('mobile-active');
      
      // Toggle backdrop if it exists
      if (backdrop) {
        backdrop.classList.toggle('active');
      }
      
      // Prevent body scroll when sidebar is open on mobile
      if (sidebar.classList.contains('mobile-active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
      sidebar.classList.remove('mobile-active');
      
      if (backdrop) {
        backdrop.classList.remove('active');
      }
      
      document.body.style.overflow = '';
    }

    /**
     * Desktop hover expansion
     */
    function handleDesktopHover() {
      // Only apply hover on desktop (width > 768px)
      if (window.innerWidth > 768) {
        sidebar.addEventListener('mouseenter', function() {
          sidebar.classList.add('expanded');
        });

        sidebar.addEventListener('mouseleave', function() {
          sidebar.classList.remove('expanded');
        });
      }
    }

    // Event Listeners
    
    // Hamburger menu toggle
    menuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });

    // Backdrop click to close
    if (backdrop) {
      backdrop.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        if (sidebar.classList.contains('mobile-active') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
          closeSidebar();
        }
      }
    });

    // Close sidebar when clicking a link on mobile
    const sidebarLinks = sidebar.querySelectorAll('.unit-sidebar-item, .unit-sidebar-profile-link');
    sidebarLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        // Close mobile sidebar on resize to desktop
        if (window.innerWidth > 768 && sidebar.classList.contains('mobile-active')) {
          closeSidebar();
        }
      }, 250);
    });

    // Initialize desktop hover
    handleDesktopHover();

    // Re-initialize hover on window resize
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleDesktopHover, 250);
    });

    // Handle escape key to close sidebar on mobile
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && window.innerWidth <= 768) {
        if (sidebar.classList.contains('mobile-active')) {
          closeSidebar();
        }
      }
    });

  });

})();
