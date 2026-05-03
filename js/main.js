document.addEventListener('DOMContentLoaded', () => {
    // Current year in footer
    const yearSpan = document.querySelector('#current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const navLinksContainer = document.getElementById('nav-links');

    if (menuToggle && navLinksContainer) {
        const closeBtn = document.getElementById('mobile-close-btn');

        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navLinksContainer.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    }

    // Mobile Dropdown Toggle
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const dropdown = dropdownToggle.parentElement;
                dropdown.classList.toggle('active');
            }
        });
    }

    // FAQ Accordion
    const faqHeaders = document.querySelectorAll('.faq-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all other items
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Active link highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        } else if (currentPath.endsWith('/') && link.getAttribute('href') === 'index.html') {
            link.classList.add('active');
        }
    });
});
