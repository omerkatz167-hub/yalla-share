(function () {
  var q = window.location.search;
  if (/[?&]token=/.test(q)) {
    window.location.replace('trip.html' + q + window.location.hash);
    return;
  }
  var root = document.documentElement;
  if (window.top !== window.self) {
    try { window.top.location.replace(window.location.href); } catch (e) { root.style.display = 'none'; }
    return;
  }
  root.classList.add('js');
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(mqReduce && mqReduce.matches);
  var hasIO = 'IntersectionObserver' in window;
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function $$(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }
  ready(function () {
    var dlMain = document.getElementById('dl-main');
    if (dlMain) {
      $$('a[data-dl]').forEach(function (a) {
        a.href = dlMain.href;
        a.rel = 'noopener';
      });
    }
    initMenu();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { root.classList.add('loaded'); });
    });
    $$('[data-stagger]').forEach(function (list) {
      [].slice.call(list.children).forEach(function (li, i) { li.style.setProperty('--i', i); });
    });
    var revealEls = $$('[data-stagger], [data-reveal]');
    if (reduced || !hasIO) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -15% 0px' });
      revealEls.forEach(function (el) { rio.observe(el); });
    }
    var scenes = reduced ? null : initScenes(document.querySelector('[data-handler="scenes"]'));
    var pinned = reduced ? [] : $$('[data-progress]');
    pinned.forEach(function (el) { if (el.classList.contains('merge')) el.classList.add('is-live'); });
    var orbit = document.querySelector('.orbit');
    var fitOrbit = function () {
      if (orbit) orbit.style.setProperty('--ky', Math.min(1, orbit.clientHeight / 440).toFixed(3));
    };
    fitOrbit();
    window.addEventListener('resize', fitOrbit, { passive: true });
    window.addEventListener('load', fitOrbit);
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      pinned.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        if (scenes && el === scenes.el) scenes.set(p);
        else el.style.setProperty('--p', p.toFixed(4));
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('load', onScroll);
    update();
    initFilm();
  });
  function initMenu() {
    var nav = document.querySelector('.gnav');
    var btn = document.getElementById('gnav-menu');
    if (!nav || !btn) return;
    var set = function (open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'תפריט');
    };
    btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
    $$('#gnav-links a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); }
    });
  }
  function initScenes(el) {
    if (!el) return null;
    var imgs = $$('.stk-img', el);
    var copies = $$('.stk-copy', el);
    var dots = $$('.stk-dots i', el);
    var count = copies.length;
    if (!count) return null;
    el.classList.add('is-pinned');
    var current = -1;
    var api = {
      el: el,
      set: function (p) {
        var i = Math.min(count - 1, Math.floor(p * count));
        if (i === current) return;
        current = i;
        [imgs, copies, dots].forEach(function (list) {
          list.forEach(function (node, k) { node.classList.toggle('on', k === i); });
        });
        copies.forEach(function (node, k) { node.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      }
    };
    api.set(0);
    return api;
  }
  function initFilm() {
    var vid = document.getElementById('film-v');
    var btn = document.getElementById('film-ctl');
    if (!vid || !btn) return;
    var frame = vid.closest('.film-frame') || vid.parentNode;
    var vertical = vid.getAttribute('data-vertical');
    if (vertical && window.matchMedia && window.matchMedia('(max-width: 734px) and (orientation: portrait)').matches) {
      $$('source', vid).forEach(function (s) { s.parentNode.removeChild(s); });
      var vs = document.createElement('source');
      vs.src = vertical;
      vs.type = 'video/mp4';
      vid.appendChild(vs);
      var vp = vid.getAttribute('data-vertical-poster');
      if (vp) vid.setAttribute('poster', vp);
      frame.classList.add('is-portrait');
      vid.load();
    }
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var userChoice = null;
    var visible = false;
    var sync = function () {
      var paused = vid.paused;
      btn.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-label', paused ? 'הפעלת הסרטון' : 'השהיית הסרטון');
    };
    var play = function () {
      if (vid.preload === 'none') vid.preload = 'auto';
      var pr = vid.play();
      if (pr && pr.catch) pr.catch(function () { sync(); });
    };
    var apply = function () {
      var want = userChoice === null ? visible && !reduced && !saveData : userChoice && visible;
      if (want && vid.paused) play();
      else if (!want && !vid.paused) vid.pause();
    };
    vid.addEventListener('play', sync);
    vid.addEventListener('pause', sync);
    btn.addEventListener('click', function () {
      userChoice = vid.paused;
      if (userChoice) play();
      else vid.pause();
    });
    sync();
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        apply();
      }, { threshold: 0.45 }).observe(frame);
    }
  }
})();
