/* Strategy page — isolated header, side menu and horizontal chapter sliders */
(() => {
  'use strict';
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const pad = (n) => String(n).padStart(2, '0');

  // Header: hide after scrolling down; reveal when the pointer returns to the top.
  let previousY = window.scrollY;
  let headerTimer;
  const updateHeader = () => {
    const y = window.scrollY;
    document.body.classList.toggle('is-scrolled', y > 24);
    if (y < 24 || y < previousY - 4) {
      document.body.classList.remove('header-hidden');
    } else if (y > previousY + 4) {
      document.body.classList.add('header-hidden');
    }
    previousY = y;
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  document.addEventListener('mousemove', (e) => {
    if (e.clientY <= 18) {
      document.body.classList.remove('header-hidden');
      clearTimeout(headerTimer);
      headerTimer = setTimeout(() => {
        if (window.scrollY > 24) document.body.classList.add('header-hidden');
      }, 2400);
    }
  }, { passive: true });
  updateHeader();

  // Side menu, including keyboard/touch behavior and active section.
  const menu = document.querySelector('.side-menu');
  const toggle = document.querySelector('.side-toggle');
  if (menu) {
    const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    };
    if (toggle) toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    links.forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('is-open') && !menu.contains(e.target) && e.target !== toggle) setOpen(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    if ('IntersectionObserver' in window && links.length) {
      const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
      const spy = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        links.forEach((link) => {
          const active = link.getAttribute('href') === '#' + visible.target.id;
          link.classList.toggle('is-current', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.1, 0.25, 0.5] });
      sections.forEach((section) => spy.observe(section));
    }
  }

  // Horizontal chapter sliders: arrows, dots, counter, drag and native touch/trackpad.
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const scroller = chapter.querySelector('.hscroll');
    if (!scroller || scroller.dataset.sliderReady === 'true') return;
    scroller.dataset.sliderReady = 'true';
    const pages = Array.from(scroller.querySelectorAll('.page'));
    const counter = chapter.querySelector('.chapter__count');
    if (counter) counter.textContent = `${pad(pages.length ? 1 : 0)} / ${pad(pages.length)}`;
    if (pages.length < 2) return;

    const nav = document.createElement('div');
    nav.className = 'hnav';
    nav.innerHTML = '<button type="button" class="hnav__prev" aria-label="Pagina precedente">←</button><div class="hnav__dots"></div><button type="button" class="hnav__next" aria-label="Pagina successiva">→</button>';
    chapter.appendChild(nav);
    const prev = nav.querySelector('.hnav__prev');
    const next = nav.querySelector('.hnav__next');
    const dotsBox = nav.querySelector('.hnav__dots');
    let index = 0;
    const go = (i) => {
      const target = pages[clamp(i, 0, pages.length - 1)];
      const left = target.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft;
      scroller.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    const dots = pages.map((_, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Vai alla pagina ${i + 1}`);
      button.addEventListener('click', () => go(i));
      dotsBox.appendChild(button);
      return button;
    });
    const update = () => {
      const center = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
      index = pages.reduce((best, page, i) => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs((rect.left + rect.width / 2) - center);
        return distance < best.distance ? { index: i, distance } : best;
      }, { index: 0, distance: Infinity }).index;
      dots.forEach((dot, i) => {
        dot.textContent = i === index ? '✴' : '·';
        dot.setAttribute('aria-current', String(i === index));
      });
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      if (counter) counter.textContent = `${pad(index + 1)} / ${pad(pages.length)}`;
    };
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    let down = false, moved = false, startX = 0, startLeft = 0;
    scroller.addEventListener('dragstart', (e) => e.preventDefault());
    scroller.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, a')) return;
      down = true; moved = false; startX = e.clientX; startLeft = scroller.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; scroller.classList.add('is-dragging'); }
      if (moved) { scroller.scrollLeft = startLeft - dx; e.preventDefault(); }
    }, { passive: false });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      scroller.classList.remove('is-dragging');
      if (moved) go(index);
    });
    window.addEventListener('pointercancel', () => { down = false; scroller.classList.remove('is-dragging'); });
  });
})();
