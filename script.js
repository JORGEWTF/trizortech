/* ============================================
   IZZY CORPORATION — Script
   Scroll-driven frame animation, webhook form,
   security, theme toggle, scroll reveals
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════
    // CONFIGURATION — Update these when n8n is ready
    // ══════════════════════════════════════
    const CONFIG = {
        // 🔧 Replace this URL with your n8n webhook URL when ready
        // Example: 'https://n8n.izzycorporation.com/webhook/contact'
        WEBHOOK_URL: '',

        // Fallback: If no webhook URL, use WhatsApp + Email
        WHATSAPP_NUMBER: '59168490383',
        EMAIL: 'izzycorporation.sa@gmail.com',

        // Rate limiting (seconds between submissions)
        RATE_LIMIT_SECONDS: 30,
    };

    // ── Theme Toggle ──
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('izzy-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('izzy-theme', next);
    });

    // ── Mobile Menu ──
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ── Navbar scroll effect ──
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ── Scroll Reveal Animations ──
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ── Active nav link highlight ──
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-links a[href^="#"]');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinksAll.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => sectionObserver.observe(section));

    // ════════════════════════════════════════
    // SCROLL-DRIVEN FRAME ANIMATION
    // ════════════════════════════════════════
    const heroCanvas = document.getElementById('hero-canvas');
    const heroScrollContainer = document.getElementById('hero-scroll-container');
    const heroTextOverlay = document.getElementById('hero-text-overlay');
    const scrollIndicator = document.getElementById('scroll-indicator');

    if (heroCanvas && heroScrollContainer) {
        const ctx = heroCanvas.getContext('2d');
        const TOTAL_FRAMES = 80;
        const TEXT_APPEAR_AT = 0.75;

        const frames = [];
        let loadedCount = 0;
        let currentFrame = 0;
        let allLoaded = false;

        // Mobile performance optimization flag
        const isMobile = window.innerWidth <= 768;

        function resizeCanvas() {
            heroCanvas.width = window.innerWidth;
            heroCanvas.height = window.innerHeight;
            if (allLoaded || loadedCount > 0) {
                drawFrame(currentFrame);
            } else {
                drawLoadingScreen();
            }
        }

        // Show loading progress on canvas
        function drawLoadingScreen() {
            const w = heroCanvas.width;
            const h = heroCanvas.height;
            const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, w, h);

            // Progress bar
            const barW = Math.min(w * 0.4, 300);
            const barH = 3;
            const barX = (w - barW) / 2;
            const barY = h / 2 + 30;

            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(barX, barY, barW, barH);

            ctx.fillStyle = '#00c896';
            ctx.fillRect(barX, barY, barW * (percent / 100), barH);

            // Percentage text
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '13px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${percent}%`, w / 2, barY + 24);
        }

        // Preload frames progressively (batch loading)
        function preloadFrames() {
            // Determine folder and prefix based on device
            const folder = isMobile ? 'video_000_mobile_000' : 'video_000';
            const prefix = isMobile ? 'video_000_mobile_' : 'video_';
            const ext = '.webp';

            // Load first frame immediately
            const firstImg = new Image();
            firstImg.src = `${folder}/${prefix}000${ext}`;
            firstImg.onload = () => {
                loadedCount++;
                drawFrame(0);
                // Then load the rest in batches
                loadBatch(1);
            };
            frames[0] = firstImg;

            // Prepare empty slots
            for (let i = 1; i < TOTAL_FRAMES; i++) {
                frames[i] = null;
            }
        }

        function loadBatch(startIndex) {
            const BATCH_SIZE = 10;
            const end = Math.min(startIndex + BATCH_SIZE, TOTAL_FRAMES);

            const folder = isMobile ? 'video_000_mobile_000' : 'video_000';
            const prefix = isMobile ? 'video_000_mobile_' : 'video_';
            const ext = '.webp';

            for (let i = startIndex; i < end; i++) {
                const img = new Image();
                const num = String(i).padStart(3, '0');
                img.src = `${folder}/${prefix}${num}${ext}`;
                img.onload = () => {
                    loadedCount++;
                    if (!allLoaded) drawLoadingScreen();
                    if (loadedCount >= TOTAL_FRAMES) {
                        allLoaded = true;
                        drawFrame(currentFrame);
                    }
                };
                frames[i] = img;
            }

            // Schedule next batch
            if (end < TOTAL_FRAMES) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => loadBatch(end));
                } else {
                    setTimeout(() => loadBatch(end), 50);
                }
            }
        }

        function drawFrame(index) {
            if (index < 0 || index >= frames.length) return;
            const img = frames[index];
            if (!img || !img.complete) return;

            const canvasW = heroCanvas.width;
            const canvasH = heroCanvas.height;
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;

            const scale = Math.max(canvasW / imgW, canvasH / imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const drawX = (canvasW - drawW) / 2;
            const drawY = (canvasH - drawH) / 2;

            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }

        function onScroll() {
            const containerTop = heroScrollContainer.offsetTop;
            const containerHeight = heroScrollContainer.offsetHeight;
            const viewportHeight = window.innerHeight;

            const scrolled = window.scrollY - containerTop;
            const maxScroll = containerHeight - viewportHeight;
            const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);

            const frameIndex = Math.min(Math.floor(progress * TOTAL_FRAMES), TOTAL_FRAMES - 1);

            if (frameIndex !== currentFrame) {
                // Throttle frame updates on mobile devices to save CPU/RAM
                if (isMobile && Math.abs(frameIndex - currentFrame) < 2 && frameIndex !== TOTAL_FRAMES - 1) {
                    return; // Skip rendering intermediate frames on small screens
                }

                currentFrame = frameIndex;
                requestAnimationFrame(() => drawFrame(currentFrame));
            }

            if (progress >= TEXT_APPEAR_AT) {
                heroTextOverlay.classList.add('visible');
            } else {
                heroTextOverlay.classList.remove('visible');
            }

            if (scrollIndicator) {
                scrollIndicator.classList.toggle('hidden', progress > 0.05);
            }
        }

        resizeCanvas();
        preloadFrames();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ════════════════════════════════════════
    const toastEl = document.getElementById('toast');

    function showToast(message, isError = false) {
        toastEl.textContent = message;
        toastEl.className = 'toast' + (isError ? ' error' : '');
        // Force reflow
        void toastEl.offsetWidth;
        toastEl.classList.add('visible');

        setTimeout(() => {
            toastEl.classList.remove('visible');
        }, 4000);
    }

    // ════════════════════════════════════════
    // FORM SECURITY & SUBMISSION
    // ════════════════════════════════════════
    let lastSubmitTime = 0;

    // Sanitize input to prevent XSS
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.trim();
    }

    // Validate phone number format
    function isValidPhone(phone) {
        return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone);
    }

    // Get form data from a form element
    function getFormData(form) {
        return {
            name: sanitize(form.querySelector('[name="name"]')?.value || ''),
            email: sanitize(form.querySelector('[name="email"]')?.value || ''),
            phone: sanitize(form.querySelector('[name="phone"]')?.value || ''),
            service: sanitize(form.querySelector('[name="service"]')?.value || ''),
            message: sanitize(form.querySelector('[name="message"]')?.value || ''),
        };
    }

    // Check honeypot (anti-spam)
    function isSpam(form) {
        const honeypot = form.querySelector('[name="website"]');
        return honeypot && honeypot.value.length > 0;
    }

    // Rate limit check
    function isRateLimited() {
        const now = Date.now();
        if (now - lastSubmitTime < CONFIG.RATE_LIMIT_SECONDS * 1000) {
            const remaining = Math.ceil((CONFIG.RATE_LIMIT_SECONDS * 1000 - (now - lastSubmitTime)) / 1000);
            showToast(`Por favor espera ${remaining}s antes de enviar otro mensaje.`, true);
            return true;
        }
        return false;
    }

    // Validate required fields
    function validateForm(data) {
        if (!data.name || !data.phone || !data.message) {
            showToast('Por favor, completa los campos obligatorios.', true);
            return false;
        }
        if (!isValidPhone(data.phone)) {
            showToast('Por favor, ingresa un número de teléfono válido.', true);
            return false;
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showToast('Por favor, ingresa un email válido.', true);
            return false;
        }
        return true;
    }

    // ── Submit form via webhook or fallback ──
    async function submitForm(form, button, serviceName = '') {
        // Anti-spam check
        if (isSpam(form)) {
            showToast('¡Mensaje enviado! Te contactaremos pronto. ✅');
            form.reset();
            return;
        }

        // Rate limit check
        if (isRateLimited()) return;

        const data = getFormData(form);
        if (serviceName) data.service = serviceName;

        // Validate
        if (!validateForm(data)) return;

        // Set loading state
        button.classList.add('loading');
        button.disabled = true;

        try {
            if (CONFIG.WEBHOOK_URL) {
                // ── WEBHOOK MODE (n8n) ──
                const response = await fetch(CONFIG.WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...data,
                        source: 'landing-page',
                        timestamp: new Date().toISOString(),
                        page_url: window.location.href,
                    }),
                });

                if (!response.ok) throw new Error('Error en el servidor');

                lastSubmitTime = Date.now();
                showToast('¡Mensaje enviado! Te contactaremos pronto. ✅');
                form.reset();

            } else {
                // ── WHATSAPP MODE ──
                lastSubmitTime = Date.now();

                // Build WhatsApp message
                let waMsg = `🟢 *Nuevo contacto web — IZZY Corporation*\n\n`;
                waMsg += `👤 *Nombre:* ${data.name}\n`;
                waMsg += `📱 *Teléfono:* ${data.phone}\n`;
                if (data.email) waMsg += `📧 *Email:* ${data.email}\n`;
                if (data.service) waMsg += `📋 *Servicio:* ${data.service}\n`;
                waMsg += `\n💬 *Mensaje:*\n${data.message}`;

                // Open WhatsApp
                window.open(
                    `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`,
                    '_blank'
                );

                showToast('¡Redirigido a WhatsApp! ✅');
                form.reset();
            }

        } catch (error) {
            console.error('Form submission error:', error);
            showToast('Error al enviar. Intenta de nuevo o contáctanos por WhatsApp.', true);
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // ── Main Contact Form ──
    const mainForm = document.getElementById('contact-form');
    const mainBtn = document.getElementById('btn-submit-main');

    if (mainForm && mainBtn) {
        mainForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitForm(mainForm, mainBtn);
        });
    }

    // ── Contact Modal ──
    const modal = document.getElementById('contact-modal');
    const modalServiceName = document.getElementById('modal-service-name');
    const modalClose = document.getElementById('modal-close');
    const modalForm = document.getElementById('modal-form');
    const modalBtn = document.getElementById('btn-submit-modal');

    document.querySelectorAll('.btn-service').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceName = btn.getAttribute('data-service');
            if (modalServiceName) modalServiceName.textContent = serviceName;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    if (modalForm && modalBtn) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const serviceName = modalServiceName?.textContent || '';
            submitForm(modalForm, modalBtn, serviceName);
            setTimeout(() => closeModal(), 1500);
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

});
