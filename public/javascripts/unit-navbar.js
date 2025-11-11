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
    
    // Get elements
    const sidebar = document.getElementById('unitSidebar');
    const menuToggle = document.getElementById('unitMenuToggle');
    const backdrop = document.getElementById('unitSidebarBackdrop');
    
    // Check if elements exist before proceeding
    if (!sidebar || !menuToggle) {
      console.warn('Unit sidebar elements not found');
      return;
    }

    /**
     * Toggle sidebar on mobile
     */
    function toggleSidebar() {
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
