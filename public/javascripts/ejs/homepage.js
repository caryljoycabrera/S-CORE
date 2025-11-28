/* =============================================================================
   HOMEPAGE.JS - JAVASCRIPT FUNCTIONALITY FOR HOMEPAGE.EJS
   =============================================================================
   Purpose: Interactive functionality for the DLSU-D Strategic Communications
           Office homepage including navigation, animations, and mobile menu
   Connected file: views/homepage.ejs
   ============================================================================= */

// Page loading animation and initialization
window.addEventListener('load', function() {
    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => {
        loading.style.display = 'none';
    }, 500);
});

// Set current year in footer (commented out as it's handled in EJS)
// const currentYearElement = document.getElementById('currentYear');
// if (currentYearElement) {
//   currentYearElement.textContent = new Date().getFullYear();
// }

// Mobile menu toggle functionality
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileNav = document.getElementById('mobileNav');

// Check if elements exist and add event listener
if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });
}

// Active navigation link highlighting based on scroll position
function updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link:not(.cta-nav)');
    navLinks.forEach(link => link.classList.remove('active'));

    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    if (current) {
        const activeLink = document.querySelector(`a[href="#${current}"]`);
        if (activeLink && !activeLink.classList.contains('cta-nav')) {
            activeLink.classList.add('active');
        }
    }
}

// Close mobile menu when clicking nav links
document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
    link.addEventListener('click', function() {
        mobileMenuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    if (!mobileMenuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileMenuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
    }
});

// Navbar scroll effect for transparency/blur changes
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = '0.1s';
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Enhanced card hover effects with dynamic scaling
document.querySelectorAll('.team-card, .service-card, .feature-card, .contact-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Material Design-inspired button ripple effects
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-cta, .cta-nav').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Dynamic injection of ripple animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Contact card icon animations
document.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const icon = this.querySelector('.contact-card-icon');
        icon.style.transform = 'scale(1.1) rotate(5deg)';
    });

    card.addEventListener('mouseleave', function() {
        const icon = this.querySelector('.contact-card-icon');
        icon.style.transform = 'scale(1) rotate(0deg)';
    });
});

// Social media link hover animations
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.1)';
    });

    link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Initialize scroll-based active navigation on page load
window.addEventListener('scroll', updateActiveNavLink);
updateActiveNavLink(); // Run once on load to set initial state
