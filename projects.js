/* ==========================================================
   Projects — comportamenti della pagina
   1. header a linguette: sparisce scorrendo, riappare con il mouse in alto
   2. menu laterale: evidenzia il progetto in cui ti trovi, pulsante per touch
   3. capitoli a scorrimento orizzontale: frecce, puntini, contatore, trascinamento col mouse
   Non serve modificarlo per aggiungere progetti o pagine.
   ========================================================== */
(() => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- 1. Header ----------
     In cima alla pagina: header + linguette.
     Appena scorri: spariscono tutti e due.
     Muovendo il mouse verso il bordo alto: ricompaiono solo le scritte dell'header
     (la CSS fa lo stesso con :hover, quindi funziona anche se il JS non vede il mouse).
     Su touch (niente hover): le scritte ricompaiono scorrendo verso l'alto. */
  const body = document.body;
  const TOP_ZONE = 80;      // px dal bordo alto: sotto questa soglia ricompare l'header
  const isTouch = window.matchMedia('(hover: none)').matches;
  const getY = () => window.scrollY || document.documentElement.scrollTop || 0;
  let lastY = getY();

  const onScroll = () => {
    const y = getY();
    body.classList.toggle('is-scrolled', y > 24);
    if (y <= 24) body.classList.remove('show-header');
    else if (isTouch && y !== lastY) body.classList.toggle('show-header', y < lastY);
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('mousemove', (e) => {
    if (!body.classList.contains('is-scrolled')) return;
    body.classList.toggle('show-header', e.clientY <= TOP_ZONE);
  }, { passive: true });
  document.addEventListener('mouseleave', () => body.classList.remove('show-header'));

  // da tastiera: se un link dell'header riceve il focus, l'header si mostra
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    siteHeader.addEventListener('focusin', () => body.classList.add('show-header'));
    siteHeader.addEventListener('focusout', () => body.classList.remove('show-header'));
  }

  /* ---------- 2. Menu laterale ---------- */
  const menu = document.querySelector('.side-menu');
  const toggle = document.querySelector('.side-toggle');

  if (menu) {
    const links = Array.from(menu.querySelectorAll('a[href^="#"]'));

    // Evidenzia il progetto che sta al centro dello schermo
    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id));
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      document.querySelectorAll('.project').forEach((p) => spy.observe(p));
    }

    // Touch: pulsante ✴ apre/chiude il menu
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    };
    if (toggle) toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('is-open') && !menu.contains(e.target) && e.target !== toggle) setOpen(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- 3. Capitoli orizzontali ---------- */
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const scroller = chapter.querySelector('.hscroll');
    if (!scroller) return;
    const pages = Array.from(scroller.querySelectorAll('.page'));
    const counter = chapter.querySelector('.chapter__count');
    if (counter) counter.textContent = pad(1) + ' / ' + pad(pages.length);
    if (pages.length < 2) return;

    // Barra frecce + puntini sotto il capitolo
    const nav = document.createElement('div');
    nav.className = 'hnav';
    nav.innerHTML =
      '<button type="button" class="hnav__prev" aria-label="Pagina precedente">←</button>' +
      '<div class="hnav__dots"></div>' +
      '<button type="button" class="hnav__next" aria-label="Pagina successiva">→</button>';
    chapter.appendChild(nav);

    const prev = nav.querySelector('.hnav__prev');
    const next = nav.querySelector('.hnav__next');
    const dotsBox = nav.querySelector('.hnav__dots');
    let index = 0;

    const go = (i) => {
      const target = pages[clamp(i, 0, pages.length - 1)];
      scroller.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    };

    const dots = pages.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Vai alla pagina ' + (i + 1));
      b.addEventListener('click', () => go(i));
      dotsBox.appendChild(b);
      return b;
    });

    const update = () => {
      index = clamp(Math.round(scroller.scrollLeft / scroller.clientWidth), 0, pages.length - 1);
      dots.forEach((d, i) => {
        d.textContent = i === index ? '✴' : '.';
        d.setAttribute('aria-current', String(i === index));
      });
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(pages.length);
    };

    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Trascinamento col mouse (touch e trackpad scorrono già da soli)
    let down = false, moved = false, startX = 0, startLeft = 0;
    scroller.addEventListener('dragstart', (e) => e.preventDefault());
    scroller.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX; startLeft = scroller.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; scroller.classList.add('is-dragging'); }
      if (moved) scroller.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        scroller.classList.remove('is-dragging');
        go(Math.round(scroller.scrollLeft / scroller.clientWidth));
      }
    });
  });
})();
