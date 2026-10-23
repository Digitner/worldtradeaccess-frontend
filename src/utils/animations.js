/* Scroll reveals, page transitions, count-up numbers, scroll progress and button ripples.
   Works on the pages the engine renders into <main id="app">. */
const REVEAL =
  '.card,.cat,.mkt,.kpi,.rev,.news-item,.fund-item,.partner,.frail,.feature-row>*,' +
  '.astat>*,.section-h,.page-h,.stp,.gthumb,.getcard,.choice,.quote';

function countUp(el) {
  const m = el.textContent.trim().match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m || el.dataset.cu) return;
  el.dataset.cu = '1';
  const [, pre, num, post] = m;
  const end = parseFloat(num.replace(/,/g, ''));
  if (!isFinite(end) || end === 0) return;
  const dec = (num.split('.')[1] || '').length;
  const comma = num.includes(',');
  const t0 = performance.now();
  const dur = 1100;
  const tick = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const v = end * (1 - Math.pow(1 - p, 3));
    const s = v.toFixed(dec);
    el.textContent = pre + (comma ? Number(s).toLocaleString('en-US', { minimumFractionDigits: dec }) : s) + post;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = pre + num + post;
  };
  requestAnimationFrame(tick);
}

export function initAnimations() {
  const app = document.getElementById('app');
  if (!app || app.dataset.anim) return;
  app.dataset.anim = '1';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll */
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll?.('.n').forEach((n) => !reduce && e.target.matches('.kpi,.astat>*') && countUp(n));
        io.unobserve(e.target);
      }),
    { threshold: 0.08, rootMargin: '0px 0px -5% 0px' }
  );
  const scan = () => {
    app.querySelectorAll(REVEAL).forEach((el) => {
      if (el.dataset.rv || el.closest('.hero,.carousel,.vmodal,.match-grid')) return;
      el.dataset.rv = '1';
      const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--d', Math.min(idx, 8) * 70 + 'ms');
      el.classList.add('reveal');
      if (el.matches('.cat,.kpi,.rev,.partner,.astat>*')) el.classList.add('pop');
      else if (el.matches('.news-item,.fund-item')) el.classList.add('slide');
      io.observe(el);
    });
  };
  if (!reduce) {
    new MutationObserver(scan).observe(app, { childList: true, subtree: true });
    scan();
  }

  /* page-change transition */
  let pt;
  const pageEnter = () => {
    if (reduce) return;
    app.classList.remove('page-enter');
    void app.offsetWidth;
    app.classList.add('page-enter');
    clearTimeout(pt);
    pt = setTimeout(() => app.classList.remove('page-enter'), 700);
  };
  window.addEventListener('hashchange', pageEnter);

  /* scroll progress + sticky header shadow */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const top = document.querySelector('.topbar');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(h.scrollTop / max, 1) : 0})`;
      top && top.classList.toggle('scrolled', h.scrollTop > 8);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  initEffects(app, reduce);

  /* button ripple */
  document.addEventListener('pointerdown', (ev) => {
    const b = ev.target.closest?.('.btn');
    if (!b || b.disabled || reduce) return;
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${ev.clientX - r.left - d / 2}px;top:${ev.clientY - r.top - d / 2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });
}

/* word-by-word headings: wraps each word (and <em>) so CSS can stagger it in */
function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.trim());
  el.classList.add('split');
  let i = 0;
  const walk = (node) =>
    Array.from(node.childNodes).forEach((ch) => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) return frag.append(p);
          const s = document.createElement('span');
          s.className = 'w';
          s.setAttribute('aria-hidden', 'true');
          s.style.setProperty('--i', Math.min(i++, 14));
          s.textContent = p;
          frag.append(s);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) {
        if (ch.tagName === 'EM') {
          ch.classList.add('w');
          ch.style.setProperty('--i', Math.min(i++, 14));
        } else walk(ch);
      }
    });
  walk(el);
}

/* tilt + glow on cards, magnetic buttons, hero orbs, cursor light, parallax, back-to-top */
function initEffects(app, reduce) {
  if (reduce) return;
  const GLOW = '.mkt,.cat,.frail,.kpi,.news-item,.fund-item';
  const TILT = '.mkt,.cat,.frail,.kpi';

  const decorate = () => {
    app.querySelectorAll(GLOW).forEach((el) => {
      if (el.closest('.vmodal')) return;
      el.classList.add('glow');
      if (el.matches(TILT)) el.classList.add('tilt');
    });
    app.querySelectorAll('.hero:not([data-orbs])').forEach((h) => {
      h.dataset.orbs = '1';
      h.insertAdjacentHTML('beforeend', '<i class="orb o1" aria-hidden="true"></i><i class="orb o2" aria-hidden="true"></i><i class="orb o3" aria-hidden="true"></i>');
    });
    app.querySelectorAll('.hero h1,.page-h').forEach(splitWords);
  };
  new MutationObserver(decorate).observe(app, { childList: true, subtree: true });
  decorate();

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    const glowEl = document.createElement('div');
    glowEl.className = 'cursor-glow';
    document.body.appendChild(glowEl);
    document.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      glowEl.classList.add('on');
      glowEl.style.transform = `translate(${ev.clientX}px,${ev.clientY}px)`;
      const g = ev.target.closest?.('.glow');
      if (g) {
        const r = g.getBoundingClientRect();
        const x = ev.clientX - r.left;
        const y = ev.clientY - r.top;
        g.style.setProperty('--mx', x + 'px');
        g.style.setProperty('--my', y + 'px');
        if (g.classList.contains('tilt')) {
          g.style.setProperty('--ry', ((x / r.width - 0.5) * 10).toFixed(2) + 'deg');
          g.style.setProperty('--rx', ((0.5 - y / r.height) * 8).toFixed(2) + 'deg');
        }
      }
      const b = ev.target.closest?.('.hero .btn,.btn-gold');
      if (b) {
        const r = b.getBoundingClientRect();
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        b.style.setProperty('--tx', Math.max(-8, Math.min(8, dx * 0.22)).toFixed(1) + 'px');
        b.style.setProperty('--ty', Math.max(-6, Math.min(6, dy * 0.28)).toFixed(1) + 'px');
      }
    });
    document.addEventListener('pointerout', (ev) => {
      const t = ev.target.closest?.('.tilt');
      if (t && !t.contains(ev.relatedTarget)) {
        t.style.setProperty('--rx', '0deg');
        t.style.setProperty('--ry', '0deg');
      }
      const b = ev.target.closest?.('.btn');
      if (b && !b.contains(ev.relatedTarget)) {
        b.style.removeProperty('--tx');
        b.style.removeProperty('--ty');
      }
    });
    document.documentElement.addEventListener('mouseleave', () => glowEl.classList.remove('on'));
  }

  /* back-to-top with progress ring + hero parallax */
  const top = document.createElement('button');
  top.className = 'to-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<span aria-hidden="true">\u2191</span>';
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(top);
  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      top.style.setProperty('--p', max > 0 ? (h.scrollTop / max) * 100 : 0);
      top.classList.toggle('show', h.scrollTop > 500);
      h.style.setProperty('--py', Math.min(h.scrollTop * 0.16, 70).toFixed(1) + 'px');
      tick = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
