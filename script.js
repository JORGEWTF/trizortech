/* =====================================================
   TRIZOR TECH - JavaScript Interactions
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    initNavigation();
    initScrollHeader();
    initParticles();
    initRevealAnimations();
    initCounterAnimations();
    initContactForm();
    initSmoothScroll();
});

/* =====================================================
   NAVIGATION
   ===================================================== */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!navToggle?.contains(e.target) && !navMenu?.contains(e.target)) {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
        }
    });
}

/* =====================================================
   SCROLL HEADER
   ===================================================== */
function initScrollHeader() {
    const header = document.getElementById('header');

    const handleScroll = () => {
        if (window.scrollY > 100) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
}

/* =====================================================
   PARTICLES ANIMATION
   ===================================================== */
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random size
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Random animation delay and duration
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

        particlesContainer.appendChild(particle);
    }
}

/* =====================================================
   REVEAL ANIMATIONS ON SCROLL
   ===================================================== */
function initRevealAnimations() {
    const reveals = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const revealOnScroll = () => {
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const revealPoint = 150;

            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check
}

/* =====================================================
   COUNTER ANIMATIONS
   ===================================================== */
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');

    const animateCounter = (counter) => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

/* =====================================================
   CONTACT FORM - Formspree Integration
   ===================================================== */
function initContactForm() {
    const form = document.getElementById('contact-form');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                submitBtn.textContent = '¡Mensaje Enviado!';
                submitBtn.style.background = 'linear-gradient(135deg, #7CB342 0%, #5A8A2A 100%)';
                form.reset();

                // Show success alert
                showFormAlert('¡Gracias! Tu mensaje ha sido enviado. Te responderemos pronto.', 'success');
            } else {
                throw new Error('Error en el envío');
            }
        } catch (error) {
            // Show error message
            submitBtn.textContent = 'Error al enviar';
            submitBtn.style.background = 'linear-gradient(135deg, #e53935 0%, #c62828 100%)';
            showFormAlert('Hubo un problema al enviar el mensaje. Por favor intenta de nuevo o contáctanos por WhatsApp.', 'error');
        }

        // Reset button after delay
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 4000);
    });
}

// Helper function to show form alerts
function showFormAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `form-alert form-alert-${type}`;
    alert.style.cssText = `
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 0.5rem;
        text-align: center;
        font-weight: 500;
        animation: fadeUp 0.3s ease;
        ${type === 'success'
            ? 'background: rgba(124, 179, 66, 0.1); color: #7CB342; border: 1px solid #7CB342;'
            : 'background: rgba(229, 57, 53, 0.1); color: #e53935; border: 1px solid #e53935;'}
    `;
    alert.textContent = message;

    const form = document.getElementById('contact-form');
    form.parentNode.insertBefore(alert, form.nextSibling);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/* =====================================================
   SMOOTH SCROLL
   ===================================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =====================================================
   PARALLAX EFFECTS (Optional Enhancement)
   ===================================================== */
function initParallax() {
    const heroImage = document.querySelector('.hero-image');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (heroImage && scrolled < window.innerHeight) {
            heroImage.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
    });
}

/* =====================================================
   TYPING ANIMATION (Optional Enhancement)
   ===================================================== */
function initTypingAnimation() {
    const text = document.querySelector('.hero-title');
    if (!text) return;

    // Add typing effect if needed
}

/* =====================================================
   PRELOADER (Optional)
   ===================================================== */
function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
}

// Call after all content is loaded
window.addEventListener('load', hidePreloader);
