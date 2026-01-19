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
   CONTACT FORM
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
        
        // Simulate form submission (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        submitBtn.textContent = '¡Mensaje Enviado!';
        submitBtn.style.background = 'linear-gradient(135deg, #7CB342 0%, #5A8A2A 100%)';
        
        // Reset form
        form.reset();
        
        // Reset button after delay
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 3000);
    });
}

/* =====================================================
   SMOOTH SCROLL
   ===================================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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
