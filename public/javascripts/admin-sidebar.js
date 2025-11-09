document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('adminSidebar');
    const menuToggle = document.querySelector('.admin-menu-toggle');
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    // Toggle sidebar on menu button click
    menuToggle?.addEventListener('click', function() {
        sidebar.classList.toggle('mobile-active');
        backdrop.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    backdrop.addEventListener('click', function() {
        sidebar.classList.remove('mobile-active');
        backdrop.classList.remove('active');
    });

    // Handle desktop hover functionality
    if (window.matchMedia('(min-width: 769px)').matches) {
        sidebar?.addEventListener('mouseenter', function() {
            this.classList.add('expanded');
        });
        
        sidebar?.addEventListener('mouseleave', function() {
            this.classList.remove('expanded');
        });
    }

    // Close sidebar on window resize if in mobile view
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            sidebar.classList.remove('mobile-active');
            backdrop.classList.remove('active');
        }
    });
});