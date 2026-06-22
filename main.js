/* ============================================================
   TYPED.JS
   ============================================================ */
var typed = new Typed(".text", {
    strings: [
        "Python Developer",
        "AI & ML Enthusiast",
        "DevOps Learner",
        "CS Engineer",
        "Frontend Developer"
    ],
    typeSpeed: 90,
    backSpeed: 60,
    backDelay: 1800,
    loop: true
});

/* ============================================================
   THREE.JS — 3D PARTICLE BACKGROUND
   ============================================================ */
(function initThreeJS() {
    if (!window.THREE) return;

    const canvas = document.getElementById('bg');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    /* -- Particle system -- */
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyan   = new THREE.Color(0x00eeff);
    const purple = new THREE.Color(0x7b2ff7);
    const white  = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 140;
        positions[i3 + 1] = (Math.random() - 0.5) * 140;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;

        const r = Math.random();
        const col = r < 0.5 ? cyan : r < 0.8 ? purple : white;
        colors[i3]     = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 0.28,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* -- Floating wireframe geometries -- */
    const geoShapes = [
        new THREE.IcosahedronGeometry(2, 0),
        new THREE.OctahedronGeometry(1.8, 0),
        new THREE.TetrahedronGeometry(1.5, 0),
        new THREE.TorusGeometry(1.5, 0.4, 6, 10),
        new THREE.IcosahedronGeometry(1.4, 0),
        new THREE.OctahedronGeometry(2.2, 0)
    ];

    const shapes = [];
    geoShapes.forEach((geo, i) => {
        const mat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x00eeff : 0x7b2ff7,
            wireframe: true,
            transparent: true,
            opacity: 0.07
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 40 - 10
        );
        mesh.userData.rx = (Math.random() - 0.5) * 0.008;
        mesh.userData.ry = (Math.random() - 0.5) * 0.008;
        scene.add(mesh);
        shapes.push(mesh);
    });

    /* -- Mouse & scroll tracking -- */
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* -- Animation loop -- */
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        particles.rotation.x = t * 0.025;
        particles.rotation.y = t * 0.04;

        shapes.forEach(s => {
            s.rotation.x += s.userData.rx;
            s.rotation.y += s.userData.ry;
        });

        targetX += (mouseX * 4 - targetX) * 0.05;
        targetY += (-mouseY * 4 - targetY) * 0.05;
        camera.position.x = targetX;
        camera.position.y = targetY;

        renderer.render(scene, camera);
    }
    animate();

    /* -- Resize -- */
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
})();

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const progressBar = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    progressBar.style.width = pct + '%';
}, { passive: true });

/* ============================================================
   CUSTOM DUAL CURSOR
   ============================================================ */
const cursor   = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

if (cursor && follower) {
    let cursorX = 0, cursorY = 0;
    let fx = 0, fy = 0;

    window.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        cursor.style.left = cursorX + 'px';
        cursor.style.top  = cursorY + 'px';
    }, { passive: true });

    (function followLoop() {
        fx += (cursorX - fx) * 0.12;
        fy += (cursorY - fy) * 0.12;
        follower.style.left = fx + 'px';
        follower.style.top  = fy + 'px';
        requestAnimationFrame(followLoop);
    })();

    document.querySelectorAll('a, button, .card, .chip').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            follower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            follower.classList.remove('hover');
        });
    });
}

/* ============================================================
   MOBILE MENU TOGGLE
   ============================================================ */
const menuToggle = document.getElementById('menuToggle');
const navbar     = document.getElementById('navbar');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navbar.classList.toggle('open');
});

navbar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navbar.classList.remove('open');
    });
});

/* ============================================================
   ACTIVE NAV HIGHLIGHT ON SCROLL
   ============================================================ */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.navbar a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}, { passive: true });

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('section').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

/* Stagger child grid items */
document.querySelectorAll('.projects-grid .card, .chips-grid .chip, .certs-grid .card, .education-grid .card').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 0.08}s`;
    revealObserver.observe(el);
});

document.querySelectorAll('.card:not(.project-card):not(.cert-card):not(.edu-card)').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

document.querySelectorAll('.skill').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${i * 0.06}s`;
    revealObserver.observe(el);
});

/* ============================================================
   SKILL BARS — SCROLL-TRIGGERED FILL
   ============================================================ */
const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const pct = entry.target.getAttribute('data-percent');
            entry.target.style.width = pct + '%';
            barObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.bar div[data-percent]').forEach(bar => {
    barObserver.observe(bar);
});

/* ============================================================
   3D CARD TILT ON MOUSE MOVE
   ============================================================ */
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
    });

    card.addEventListener('mousemove', (e) => {
        const rect  = card.getBoundingClientRect();
        const x     = (e.clientX - rect.left) / rect.width  - 0.5;
        const y     = (e.clientY - rect.top)  / rect.height - 0.5;
        const rotX  = y * -12;
        const rotY  = x * 12;
        const glowX = (x + 0.5) * 100;
        const glowY = (y + 0.5) * 100;

        card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px) scale(1.01)`;
        card.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(0,238,255,0.1), var(--card-bg))`;
        card.style.boxShadow = `0 8px 40px rgba(0,238,255,0.15), 0 0 0 1px rgba(0,238,255,0.1)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease, background 0.5s ease';
        card.style.transform  = '';
        card.style.background = '';
        card.style.boxShadow  = '';
    });
});

/* ============================================================
   THEME TOGGLE
   ============================================================ */
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    themeBtn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
});
