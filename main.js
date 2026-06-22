/* ============================================================
   GRADIENT BLOB — cursor-tracking with lerp
   ============================================================ */
(function initGradientBlob() {
    const blob = document.getElementById('gradientBlob');
    if (!blob) return;

    let targetX  = window.innerWidth  / 2;
    let targetY  = window.innerHeight / 2;
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
   SOUND ENGINE — Web Audio API
   All sounds are generated programmatically (no audio files).
   AudioContext must be created after a user gesture.
   ============================================================ */
const SoundEngine = (() => {
    let ctx         = null;
    let master      = null;
    let sfxOn       = true;
    let musicOn     = false;
    let musicNodes  = null;
    let arpTimer    = null;
    let arpIndex    = 0;
    let lastHover   = 0;

    const ARP_NOTES = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];

    function boot() {
        if (ctx) return;
        ctx    = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.45;
        master.connect(ctx.destination);
    }

    function tone(freq, type, duration, vol) {
        if (!sfxOn || !ctx) return;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol || 0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    function noise(freq, q, duration, vol) {
        if (!sfxOn || !ctx) return;
        const size = ctx.sampleRate * duration;
        const buf  = ctx.createBuffer(1, size, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
        const src    = ctx.createBufferSource();
        src.buffer   = buf;
        const filter = ctx.createBiquadFilter();
        filter.type  = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = q;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol || 0.025, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        src.start();
    }

    function reverb() {
        const bufSize = ctx.sampleRate * 1.5;
        const buf     = ctx.createBuffer(2, bufSize, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c);
            for (let i = 0; i < bufSize; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2.5);
            }
        }
        const conv = ctx.createConvolver();
        conv.buffer = buf;
        return conv;
    }

    return {
        boot,

        hover() {
            const now = Date.now();
            if (now - lastHover < 80) return;
            lastHover = now;
            tone(1100, 'sine', 0.055, 0.025);
        },

        click() {
            tone(650, 'sine', 0.07, 0.06);
            setTimeout(() => tone(950, 'sine', 0.05, 0.035), 35);
        },

        reveal() {
            noise(1200, 0.4, 0.28, 0.022);
        },

        success() {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
                setTimeout(() => tone(f, 'sine', 0.35, 0.06), i * 85)
            );
        },

        uiTick() {
            tone(880, 'sine', 0.04, 0.03);
        },

        startMusic() {
            if (!ctx || musicNodes) return;
            musicNodes = {};

            const rev   = reverb();
            const revG  = ctx.createGain();
            revG.gain.value = 0.25;
            rev.connect(revG);
            revG.connect(master);
            musicNodes.rev   = rev;
            musicNodes.revG  = revG;

            // Drone — low sawtooth filtered
            const drone     = ctx.createOscillator();
            const droneF    = ctx.createBiquadFilter();
            const droneG    = ctx.createGain();
            drone.type      = 'sawtooth';
            drone.frequency.value = 55;
            droneF.type     = 'lowpass';
            droneF.frequency.value = 130;
            droneG.gain.value = 0.03;
            drone.connect(droneF);
            droneF.connect(droneG);
            droneG.connect(master);
            droneG.connect(rev);
            drone.start();
            musicNodes.drone = drone;

            // LFO
            const lfo  = ctx.createOscillator();
            const lfoG = ctx.createGain();
            lfo.frequency.value = 0.07;
            lfoG.gain.value = 180;
            lfo.connect(lfoG);
            lfo.start();
            musicNodes.lfo = lfo;

            // Pad — sine with slow LFO filter
            const pad   = ctx.createOscillator();
            const padF  = ctx.createBiquadFilter();
            const padG  = ctx.createGain();
            pad.type    = 'sine';
            pad.frequency.value = 110;
            padF.type   = 'lowpass';
            padF.frequency.value = 500;
            lfoG.connect(padF.frequency);
            padG.gain.value = 0.022;
            pad.connect(padF);
            padF.connect(padG);
            padG.connect(master);
            padG.connect(rev);
            pad.start();
            musicNodes.pad = pad;

            // Arpeggio — gentle bell tones
            arpIndex  = 0;
            arpTimer  = setInterval(() => {
                if (!ctx || !master) return;
                const freq = ARP_NOTES[arpIndex % ARP_NOTES.length];
                const o    = ctx.createOscillator();
                const g    = ctx.createGain();
                o.type     = 'sine';
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.0001, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.017, ctx.currentTime + 0.12);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
                o.connect(g);
                g.connect(master);
                g.connect(rev);
                o.start();
                o.stop(ctx.currentTime + 2.2);
                arpIndex++;
            }, 1800);

            musicOn = true;
        },

        stopMusic() {
            clearInterval(arpTimer);
            arpTimer = null;
            if (musicNodes) {
                ['drone', 'pad', 'lfo'].forEach(k => {
                    try { if (musicNodes[k]) musicNodes[k].stop(); } catch (_) {}
                });
                musicNodes = null;
            }
            musicOn   = false;
            arpIndex  = 0;
        },

        toggleMusic() {
            if (musicOn) { this.stopMusic(); } else { this.startMusic(); }
            return musicOn;
        },

        toggleSFX() {
            sfxOn = !sfxOn;
            return sfxOn;
        },

        isMusicOn()  { return musicOn; },
        isSFXOn()    { return sfxOn;   },
    };
})();

/* ============================================================
   MUSIC PLAYER UI
   ============================================================ */
(function initMusicPlayer() {
    const musicBtn = document.getElementById('musicToggle');
    const sfxBtn   = document.getElementById('sfxToggle');
    if (!musicBtn) return;

    // Music toggle
    musicBtn.addEventListener('click', () => {
        SoundEngine.boot();
        SoundEngine.uiTick();
        const on = SoundEngine.toggleMusic();
        musicBtn.classList.toggle('playing', on);
        musicBtn.classList.toggle('active',  on);
        musicBtn.setAttribute('aria-label', on ? 'Stop ambient music' : 'Play ambient music');
    });

    // SFX toggle
    sfxBtn.addEventListener('click', () => {
        SoundEngine.boot();
        const on = SoundEngine.toggleSFX();
        sfxBtn.classList.toggle('active', on);
        sfxBtn.querySelector('span').textContent = on ? '🔊' : '🔇';
        sfxBtn.setAttribute('aria-label', on ? 'Sound effects on' : 'Sound effects off');
        if (on) SoundEngine.uiTick();
    });
})();

/* ============================================================
   RIPPLE + CLICK SOUNDS — all .card-clickable, .card-link, .sound-click
   ============================================================ */
(function initClickEffects() {
    function addRipple(el, e) {
        const rect   = el.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 1.4;
        const ripple = document.createElement('span');
        ripple.className     = 'ripple';
        ripple.style.width   = ripple.style.height = size + 'px';
        ripple.style.left    = (e.clientX - rect.left  - size / 2) + 'px';
        ripple.style.top     = (e.clientY - rect.top   - size / 2) + 'px';
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    document.addEventListener('click', (e) => {
        const el = e.target.closest('.card-clickable, .card-link, .sound-click');
        if (!el) return;
        SoundEngine.boot();
        SoundEngine.click();
        if (!el.classList.contains('card-link')) addRipple(el, e);
    });

    // Hover sound for interactive elements
    let lastHoverEl = null;
    document.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.card-clickable, .card-link, .sound-hover, .nav-link, .sound-click');
        if (!el || el === lastHoverEl) return;
        lastHoverEl = el;
        SoundEngine.hover();
    });
    document.addEventListener('mouseout', (e) => {
        const el = e.target.closest('.card-clickable, .card-link, .sound-hover, .nav-link, .sound-click');
        if (el === lastHoverEl) lastHoverEl = null;
    });
})();

/* ============================================================
   NAVBAR — scroll state + active section tracking
   ============================================================ */
(function initNavbar() {
    const navbar   = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function onScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 130) current = sec.id;
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
    const hamburger  = document.getElementById('navHamburger');
    const drawer     = document.getElementById('navDrawer');
    const overlay    = document.getElementById('drawerOverlay');
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
        SoundEngine.boot();
        SoundEngine.uiTick();
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
   Plays a subtle whoosh on each element's first appearance.
   ============================================================ */
(function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    let revealCount = 0;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const delay = parseInt(entry.target.dataset.delay || 0, 10);
            setTimeout(() => {
                entry.target.classList.add('is-visible');
                // Only play reveal sound for section headings, not every element
                if (entry.target.matches('.section-label, h2') && revealCount < 20) {
                    revealCount++;
                    SoundEngine.reveal();
                }
            }, delay);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   SKILL BARS — animate width on scroll into view
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
   3D CARD TILT — project cards
   Disabled on touch devices automatically.
   ============================================================ */
(function initTiltCards() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.project-card').forEach(card => {
        const inner = card.querySelector('.card-inner');
        const glow  = card.querySelector('.card-glow');

        card.addEventListener('mouseenter', () => {
            inner.style.transition = 'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s';
        });

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x    = (e.clientX - rect.left) / rect.width;
            const y    = (e.clientY - rect.top)  / rect.height;
            const rotX = (0.5 - y) * 24;
            const rotY = (x - 0.5) * 24;

            inner.style.transform  = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
            inner.style.boxShadow  = `${rotY * 2.5}px ${-rotX * 2.5}px 50px rgba(0,0,0,0.5), 0 0 50px rgba(0,255,204,0.07)`;

            if (glow) {
                glow.style.left    = `${x * 100}%`;
                glow.style.top     = `${y * 100}%`;
                glow.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            inner.style.transition = 'transform 0.6s cubic-bezier(0.25,1,0.5,1), box-shadow 0.6s ease, border-color 0.3s';
            inner.style.transform  = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
            inner.style.boxShadow  = '';
            if (glow) glow.style.opacity = '0';
        });
    });
})();

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
(function initMagneticButtons() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const dx   = (e.clientX - (rect.left + rect.width  / 2)) * 0.32;
            const dy   = (e.clientY - (rect.top  + rect.height / 2)) * 0.32;
            btn.style.transform = `translate(${dx}px, ${dy}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
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

        setTimeout(() => {
            SoundEngine.boot();
            SoundEngine.success();
            success.textContent = '✓ Message sent! I\'ll get back to you soon.';
            btn.querySelector('.btn-submit-text').textContent = 'Sent!';
            form.reset();
            setTimeout(() => {
                btn.disabled = false;
                btn.querySelector('.btn-submit-text').textContent = 'Send Message';
                success.textContent = '';
            }, 4500);
        }, 1200);
    });
})();
