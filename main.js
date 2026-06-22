/* ============================================================
   GRADIENT BLOB — follows cursor with smooth lerp
   ============================================================ */
(function initGradientBlob() {
    const blob = document.getElementById('gradientBlob');
    if (!blob) return;

    let targetX = window.innerWidth  / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    }, { passive: true });

    function tick() {
        currentX += (targetX - currentX) * 0.065;
        currentY += (targetY - currentY) * 0.065;
        blob.style.transform = `translate(calc(${currentX}px - 50%), calc(${currentY}px - 50%))`;
        requestAnimationFrame(tick);
    }

    tick();
})();

/* ============================================================
   NAVBAR — scroll state + active section highlighting
   ============================================================ */
(function initNavbar() {
    const navbar   = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function onScroll() {
        // Scrolled state
        navbar.classList.toggle('scrolled', window.scrollY > 40);

        // Active link tracking
        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 130) {
                current = sec.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

/* ============================================================
   MOBILE MENU
   ============================================================ */
(function initMobileMenu() {
    const hamburger = document.getElementById('navHamburger');
    const drawer    = document.getElementById('navDrawer');
    const overlay   = document.getElementById('drawerOverlay');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    if (!hamburger || !drawer) return;

    function openMenu() {
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        drawer.style.display = 'flex';
        overlay.style.display = 'block';
        requestAnimationFrame(() => {
            drawer.classList.add('open');
            overlay.classList.add('visible');
        });
        drawer.removeAttribute('aria-hidden');
    }

    function closeMenu() {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('open');
        overlay.classList.remove('visible');
        drawer.setAttribute('aria-hidden', 'true');
        setTimeout(() => {
            drawer.style.display = '';
            overlay.style.display = '';
        }, 400);
    }

    hamburger.addEventListener('click', () => {
        hamburger.classList.contains('open') ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);
    drawerLinks.forEach(link => link.addEventListener('click', closeMenu));
})();

/* ============================================================
   SCROLL REVEAL — Intersection Observer
   ============================================================ */
(function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const delay = parseInt(entry.target.dataset.delay || 0, 10);
            setTimeout(() => {
                entry.target.classList.add('is-visible');
            }, delay);

            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   SKILL BARS — fill on scroll into view
   ============================================================ */
(function initSkillBars() {
    const fills = document.querySelectorAll('.sbi-fill[data-pct]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.width = entry.target.dataset.pct + '%';
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    fills.forEach(fill => observer.observe(fill));
})();

/* ============================================================
   3D CARD TILT — precise mouse-tracking spatial tilt
   Disabled automatically on touch devices via CSS + hover check.
   ============================================================ */
(function initTiltCards() {
    // Skip on touch-only devices for performance & UX
    if (!window.matchMedia('(hover: hover)').matches) return;

    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        const inner = card.querySelector('.card-inner');
        const glow  = card.querySelector('.card-glow');

        card.addEventListener('mouseenter', () => {
            inner.style.transition = 'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s';
        });

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();

            // Normalised position (0→1 across the card)
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top)  / rect.height;

            // Map to tilt angles (±12°)
            const rotX = (0.5 - y) * 24;
            const rotY = (x - 0.5) * 24;

            // Apply 3D tilt + subtle scale
            inner.style.transform = `
                rotateX(${rotX}deg)
                rotateY(${rotY}deg)
                scale3d(1.03, 1.03, 1.03)
            `;

            // Directional shadow simulating a light source
            inner.style.boxShadow = `
                ${rotY * 2.5}px ${-rotX * 2.5}px 50px rgba(0, 0, 0, 0.5),
                0 0 50px rgba(0, 255, 204, 0.07)
            `;

            // Move the spotlight glow to cursor position
            if (glow) {
                glow.style.left    = `${x * 100}%`;
                glow.style.top     = `${y * 100}%`;
                glow.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            // Smooth reset
            inner.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s ease, border-color 0.3s';
            inner.style.transform  = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            inner.style.boxShadow  = '';

            if (glow) glow.style.opacity = '0';
        });
    });
})();

/* ============================================================
   MAGNETIC BUTTONS — subtle cursor attraction
   ============================================================ */
(function initMagneticButtons() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    const magnetics = document.querySelectorAll('.magnetic');

    magnetics.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx   = rect.left + rect.width  / 2;
            const cy   = rect.top  + rect.height / 2;
            const dx   = (e.clientX - cx) * 0.32;
            const dy   = (e.clientY - cy) * 0.32;
            btn.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
})();

/* ============================================================
   CONTACT FORM
   ============================================================ */
(function initContactForm() {
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = form.querySelector('.btn-submit');
        btn.disabled = true;
        btn.querySelector('.btn-submit-text').textContent = 'Sending…';

        // Simulate async send — replace with real fetch() to a backend/service
        setTimeout(() => {
            success.textContent = '✓ Message sent! I\'ll get back to you soon.';
            btn.querySelector('.btn-submit-text').textContent = 'Sent!';
            form.reset();
            setTimeout(() => {
                btn.disabled = false;
                btn.querySelector('.btn-submit-text').textContent = 'Send Message';
                success.textContent = '';
            }, 4000);
        }, 1200);
    });
})();
