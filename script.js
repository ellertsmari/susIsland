/* ===================================================================
   Vefskólinn — interactive site script
   =================================================================== */

/* -------- 1. Hero title char-by-char drop -------- */
(function heroDrop() {
    const wrap = document.getElementById('heroTitle');
    if (!wrap) return;
    const text = wrap.textContent;
    wrap.innerHTML = '';
    const words = text.split(' ');
    let i = 0;
    words.forEach((word, wi) => {
        // keep each word on one line — only allow wrapping at the space between words
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        [...word].forEach((ch) => {
            const s = document.createElement('span');
            s.textContent = ch;
            s.style.animationDelay = `${0.4 + i * 0.07}s`;
            wordEl.appendChild(s);
            i++;
        });
        wrap.appendChild(wordEl);
        if (wi < words.length - 1) {
            wrap.appendChild(document.createTextNode(' '));
            i++;
        }
    });
})();

/* -------- 2. Hero subtitle typing effect -------- */
(function typing() {
    const el = document.getElementById('typing');
    if (!el) return;
    const full = el.textContent;
    el.textContent = '';
    let i = 0;
    setTimeout(function tick() {
        if (i <= full.length) {
            el.textContent = full.slice(0, i);
            i++;
            setTimeout(tick, 55);
        }
    }, 1500);
})();

/* -------- 3. Animated background canvas -------- */
(function bgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles, glyphs;

    const GLYPH_CHARS = ['<', '>', '/', '{', '}', '(', ')', ';', '=', '0', '1', '*'];

    function resize() {
        w = canvas.width = window.innerWidth * window.devicePixelRatio;
        h = canvas.height = window.innerHeight * window.devicePixelRatio;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        init();
    }

    function init() {
        const dotCount = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 18000));
        particles = Array.from({ length: dotCount }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
            vy: (Math.random() - 0.5) * 0.4 * window.devicePixelRatio,
            r: (Math.random() * 1.6 + 0.6) * window.devicePixelRatio,
        }));

        const glyphCount = Math.min(28, Math.floor(window.innerWidth / 60));
        glyphs = Array.from({ length: glyphCount }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vy: (Math.random() * 0.3 + 0.1) * window.devicePixelRatio,
            vx: (Math.random() - 0.5) * 0.1 * window.devicePixelRatio,
            ch: GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)],
            size: (Math.random() * 12 + 10) * window.devicePixelRatio,
            opacity: Math.random() * 0.15 + 0.05,
            rot: Math.random() * Math.PI * 2,
        }));
    }

    function step() {
        ctx.clearRect(0, 0, w, h);

        // glyphs (faint code chars drifting up)
        ctx.font = `${14 * window.devicePixelRatio}px JetBrains Mono, monospace`;
        glyphs.forEach(g => {
            g.y -= g.vy;
            g.x += g.vx;
            if (g.y < -20) { g.y = h + 20; g.x = Math.random() * w; g.ch = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)]; }
            if (g.x < -20) g.x = w + 20;
            if (g.x > w + 20) g.x = -20;
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.font = `${g.size}px JetBrains Mono, monospace`;
            ctx.fillStyle = `rgba(255, 155, 33, ${g.opacity})`;
            ctx.fillText(g.ch, 0, 0);
            ctx.restore();
        });

        // particles + connecting lines
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 155, 33, 0.5)';
            ctx.fill();
        });

        // connect close particles
        const maxDist = 140 * window.devicePixelRatio;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < maxDist) {
                    const op = (1 - d / maxDist) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 155, 33, ${op})`;
                    ctx.lineWidth = window.devicePixelRatio;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(step);
    }

    resize();
    window.addEventListener('resize', resize);
    step();
})();

/* -------- 4. Reveal-on-scroll observer -------- */
(function revealOnScroll() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach(i => i.classList.add('in'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(i => io.observe(i));
})();

/* -------- 5. Side nav active dot + scroll progress -------- */
(function navTracker() {
    const sections = document.querySelectorAll('.section');
    const dots = document.querySelectorAll('.nav-dot');
    const bar = document.getElementById('progressBar');

    function onScroll() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = (scrollTop / docHeight) * 100;
        if (bar) bar.style.width = pct + '%';

        const center = scrollTop + window.innerHeight / 2;
        let active = 0;
        sections.forEach((s, i) => {
            if (s.offsetTop <= center) active = i;
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === active));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

/* -------- 6. Card glow follows mouse -------- */
(function cardGlow() {
    document.querySelectorAll('.person-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
        });
    });
})();

/* -------- 7. Subtle 3D tilt on cards -------- */
(function tilt() {
    document.querySelectorAll('[data-tilt]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
})();

/* -------- 8. Stat counters when in view -------- */
(function statCounters() {
    const stats = document.querySelectorAll('.stat-num');
    if (!('IntersectionObserver' in window)) {
        stats.forEach(s => s.textContent = s.dataset.target);
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.dataset.target, 10);
            const duration = 1100;
            const start = performance.now();
            function frame(t) {
                const p = Math.min((t - start) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target);
                if (p < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
            io.unobserve(el);
        });
    }, { threshold: 0.6 });
    stats.forEach(s => io.observe(s));
})();

/* -------- 9. Code window typewriter -------- */
(function codeTypewriter() {
    const target = document.getElementById('codeBody');
    if (!target) return;

    const lines = [
        { t: '<c>// frá hugmynd...</c>' },
        { t: '<k>const</k> <v>verkefni</v> = <k>new</k> <f>SustainableIsland</f>({' },
        { t: '  <v>skolar</v>: <n>3</n>,' },
        { t: '  <v>lond</v>: [<s>"IS"</s>, <s>"DK"</s>, <s>"ES"</s>],' },
        { t: '  <v>vandamal</v>: <s>"dreifðar upplýsingar"</s>,' },
        { t: '});' },
        { t: '' },
        { t: '<c>// í stað þess að púsla saman 5 tólum...</c>' },
        { t: '<k>const</k> <v>lms</v> = <k>await</k> <f>AI</f>.<f>build</f>({' },
        { t: '  <v>thorf</v>: <v>verkefni</v>,' },
        { t: '  <v>stack</v>: [<s>"React"</s>, <s>"Node"</s>, <s>"MySQL"</s>],' },
        { t: '  <v>timi</v>: <s>"vikur, ekki ár"</s>,' },
        { t: '});' },
        { t: '' },
        { t: '<c>// ...að einu sérsniðnu kerfi</c>' },
        { t: '<k>return</k> <v>lms</v>.<f>deploy</f>(<s>"sustainable-island.ieselrincon.es"</s>);' },
    ];

    let started = false;
    function start() {
        if (started) return;
        started = true;
        let i = 0;
        function nextLine() {
            if (i >= lines.length) return;
            const line = lines[i].t;
            const lineEl = document.createElement('div');
            target.appendChild(lineEl);
            // strip pseudo-tags to compute length, but render as html progressively
            const plain = line.replace(/<[^>]+>/g, '');
            let charIdx = 0;
            function typeChar() {
                if (charIdx > plain.length) {
                    i++;
                    setTimeout(nextLine, 80);
                    return;
                }
                // To keep coloring while typing, build using same tag structure but trimmed length
                lineEl.innerHTML = renderPartial(line, charIdx) + (charIdx < plain.length ? '<span class="c">▌</span>' : '');
                charIdx++;
                setTimeout(typeChar, 18);
            }
            typeChar();
        }
        nextLine();
    }

    function renderPartial(html, n) {
        let out = '';
        let textCount = 0;
        let i = 0;
        while (i < html.length && textCount < n) {
            if (html[i] === '<') {
                const close = html.indexOf('>', i);
                if (close === -1) break;
                out += html.slice(i, close + 1);
                i = close + 1;
            } else {
                out += html[i];
                textCount++;
                i++;
            }
        }
        // close any open tags
        const opens = [...out.matchAll(/<([a-z]+)>/g)].map(m => m[1]);
        const closes = [...out.matchAll(/<\/([a-z]+)>/g)].map(m => m[1]);
        const stillOpen = [...opens];
        closes.forEach(c => {
            const idx = stillOpen.lastIndexOf(c);
            if (idx > -1) stillOpen.splice(idx, 1);
        });
        stillOpen.reverse().forEach(t => out += `</${t}>`);
        return out;
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { start(); io.disconnect(); } });
        }, { threshold: 0.3 });
        io.observe(target);
    } else {
        start();
    }
})();

/* -------- 10. Lightbox with FLIP-style zoom -------- */
(function lightbox() {
    const lb = document.getElementById('lightbox');
    const stage = document.getElementById('lightboxStage');
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCap');
    const closeBtn = document.getElementById('lightboxClose');
    const backdrop = document.getElementById('lightboxBackdrop');
    if (!lb || !stage) return;

    let originRect = null;
    let isOpen = false;
    let isAnimating = false;

    function getTargetRect(naturalW, naturalH) {
        const padX = 60;
        const padY = 100;
        const maxW = window.innerWidth - padX * 2;
        const maxH = window.innerHeight - padY * 2;
        const ratio = naturalW / naturalH;
        let w = maxW;
        let h = w / ratio;
        if (h > maxH) {
            h = maxH;
            w = h * ratio;
        }
        const left = (window.innerWidth - w) / 2;
        const top = (window.innerHeight - h) / 2;
        return { left, top, width: w, height: h };
    }

    function open(srcImg, caption) {
        if (isOpen || isAnimating) return;
        const rect = srcImg.getBoundingClientRect();
        originRect = { ...rect.toJSON ? rect.toJSON() : { left: rect.left, top: rect.top, width: rect.width, height: rect.height } };

        lbImg.src = srcImg.currentSrc || srcImg.src;
        lbImg.alt = srcImg.alt || '';
        lbCap.textContent = caption || '';

        // start at origin position/size, no transition
        stage.style.transition = 'none';
        stage.style.left = originRect.left + 'px';
        stage.style.top = originRect.top + 'px';
        stage.style.width = originRect.width + 'px';
        stage.style.height = originRect.height + 'px';
        lb.classList.add('open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // wait for image natural dims, then animate
        const launch = () => {
            const target = getTargetRect(lbImg.naturalWidth || 16, lbImg.naturalHeight || 9);
            // force reflow then enable transitions
            void stage.offsetWidth;
            stage.style.transition = '';
            isAnimating = true;
            stage.style.left = target.left + 'px';
            stage.style.top = target.top + 'px';
            stage.style.width = target.width + 'px';
            stage.style.height = target.height + 'px';
            stage.addEventListener('transitionend', function te(e) {
                if (e.propertyName !== 'width') return;
                stage.removeEventListener('transitionend', te);
                isAnimating = false;
            });
        };

        if (lbImg.complete && lbImg.naturalWidth) {
            requestAnimationFrame(launch);
        } else {
            lbImg.addEventListener('load', () => requestAnimationFrame(launch), { once: true });
        }

        isOpen = true;
    }

    function close() {
        if (!isOpen || isAnimating || !originRect) return;
        isAnimating = true;
        // fade out close & backdrop sooner via removing .open after the FLIP back
        stage.style.left = originRect.left + 'px';
        stage.style.top = originRect.top + 'px';
        stage.style.width = originRect.width + 'px';
        stage.style.height = originRect.height + 'px';
        lb.classList.remove('open'); // fades backdrop & close button

        stage.addEventListener('transitionend', function te(e) {
            if (e.propertyName !== 'width') return;
            stage.removeEventListener('transitionend', te);
            lb.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            isOpen = false;
            isAnimating = false;
        });
    }

    // attach to all timeline images
    document.querySelectorAll('.t-card.has-img .t-img').forEach(wrap => {
        const img = wrap.querySelector('img');
        if (!img) return;
        wrap.addEventListener('click', () => {
            // get caption from the sibling .t-body h4
            const card = wrap.closest('.t-card');
            const h4 = card ? card.querySelector('h4') : null;
            const yearEl = wrap.closest('.t-item')?.querySelector('.t-year');
            const cap = [yearEl?.textContent, h4?.textContent].filter(Boolean).join(' — ');
            open(img, cap);
        });
    });

    // also wire up the who-photo
    const whoPhoto = document.querySelector('.who-photo');
    if (whoPhoto) {
        const img = whoPhoto.querySelector('img');
        whoPhoto.style.cursor = 'zoom-in';
        whoPhoto.addEventListener('click', (e) => {
            // ignore clicks on the figcaption text
            if (e.target.tagName === 'FIGCAPTION') return;
            open(img, 'Smári & Jakub');
        });
    }

    // wire up screenshot browser frames
    document.querySelectorAll('.browser-view:not(.scrollview)').forEach(view => {
        const img = view.querySelector('img');
        if (!img) return;
        view.addEventListener('click', () => {
            const fig = view.closest('.shot');
            const capEl = fig ? fig.querySelector('.shot-cap') : null;
            const cap = capEl ? capEl.textContent.replace(/^\/\/\s*/, '').trim() : (img.alt || '');
            open(img, cap);
        });
    });

    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });

    // recompute on resize while open
    window.addEventListener('resize', () => {
        if (!isOpen || isAnimating) return;
        const target = getTargetRect(lbImg.naturalWidth || 16, lbImg.naturalHeight || 9);
        stage.style.left = target.left + 'px';
        stage.style.top = target.top + 'px';
        stage.style.width = target.width + 'px';
        stage.style.height = target.height + 'px';
        // also refresh originRect reference in case the source moved
        // (no easy lookup back — we accept this minor edge case)
    });
})();

/* -------- 11. Konami / easter egg: spawn extra particles on key 'v' -------- */
(function easter() {
    let count = 0;
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'v') {
            count++;
            if (count >= 3) {
                document.body.style.animation = 'none';
                document.documentElement.style.setProperty('--accent', '#5ee0a3');
                document.documentElement.style.setProperty('--accent-glow', 'rgba(94, 224, 163, 0.45)');
                document.documentElement.style.setProperty('--accent-soft', 'rgba(94, 224, 163, 0.12)');
                count = 0;
                setTimeout(() => {
                    document.documentElement.style.removeProperty('--accent');
                    document.documentElement.style.removeProperty('--accent-glow');
                    document.documentElement.style.removeProperty('--accent-soft');
                }, 4000);
            }
        }
    });
})();

/* -------- 12. Theme toggle (light / dark) -------- */
(function themeToggle() {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const KEY = 'si-theme';
    btn.addEventListener('click', () => {
        const isLight = root.getAttribute('data-theme') === 'light';
        if (isLight) {
            root.removeAttribute('data-theme');
            try { localStorage.setItem(KEY, 'dark'); } catch (e) {}
        } else {
            root.setAttribute('data-theme', 'light');
            try { localStorage.setItem(KEY, 'light'); } catch (e) {}
        }
    });
})();

/* -------- 13. Erasmus+ video modal -------- */
(function erasmusVideo() {
    const btn = document.getElementById('erasmusBtn');
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('erasmusVideo');
    const closeBtn = document.getElementById('videoClose');
    const backdrop = document.getElementById('videoBackdrop');
    if (!btn || !modal || !video) return;

    function open() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const p = video.play();
        if (p && p.catch) p.catch(() => {}); // ignore autoplay rejection
    }

    function close() {
        if (!modal.classList.contains('open')) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        video.pause();
        video.currentTime = 0;
    }

    btn.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
})();
