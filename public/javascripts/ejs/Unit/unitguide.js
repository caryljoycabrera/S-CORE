// ==========================================
// UNIT GUIDE PAGE JAVASCRIPT
// Interactive functionality for unit guide page
// ==========================================

// Dropdown toggle functionality
function toggleDropdown() {
  const dropdown = document.getElementById('dropdownMenu');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
  if (!e.target.matches('.dropdown-toggle') && !e.target.closest('.dropdown-toggle')) {
    const dropdowns = document.getElementsByClassName('dropdown-menu');
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
});

// Smooth scroll for internal links
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe all guide sections
  document.querySelectorAll('.guide-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

  // Add highlight effect to guide steps on hover
  document.querySelectorAll('.guide-step, .guide-tip, .guide-warning').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s ease';
    });
  });

  // Print functionality for the guide
  const printBtn = document.getElementById('printGuide');
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      window.print();
    });
  }
});

// Add keyboard navigation for quick links
document.addEventListener('keydown', function(e) {
  // Press 'H' to go to dashboard
  if (e.key === 'h' || e.key === 'H') {
    if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      window.location.href = '/unit/dashboard';
    }
  }
});

// Track reading progress
window.addEventListener('scroll', function() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  // You can use this to show a progress bar if needed
  // Example: document.getElementById('progressBar').style.width = scrolled + '%';
});

// Add copy functionality for code snippets if any
document.querySelectorAll('code').forEach(block => {
  block.addEventListener('click', function() {
    const text = this.textContent;
    navigator.clipboard.writeText(text).then(() => {
      // Show a temporary tooltip or notification
      const tooltip = document.createElement('span');
      tooltip.textContent = 'Copied!';
      tooltip.style.cssText = 'position:absolute;background:#2d7a4a;color:white;padding:4px 8px;border-radius:4px;font-size:12px;';
      this.appendChild(tooltip);
      setTimeout(() => tooltip.remove(), 1500);
    });
  });
});

// Initialize tooltips for better UX
const initTooltips = () => {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', function(e) {
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = this.getAttribute('data-tooltip');
      tooltip.style.cssText = `
        position: absolute;
        background: #1e3a5f;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
      `;
      document.body.appendChild(tooltip);
      
      const rect = this.getBoundingClientRect();
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
      tooltip.style.left = (rect.left + (rect.width - tooltip.offsetWidth) / 2) + 'px';
      
      this.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
    });
  });
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initTooltips);

console.log('Unit Guide page loaded successfully');
