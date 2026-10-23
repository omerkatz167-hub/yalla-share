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
    var revealEls = $$('.rv, .stg');
    if (reduced || !hasIO) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      revealEls.forEach(function (el) { rio.observe(el); });
    }
    var nav = document.querySelector('.nav');
    var hero = document.getElementById('top');
    var para = reduced ? [] : $$('[data-parallax]');
    var pinned = $$('[data-progress]');
    if (reduced) pinned.forEach(function (el) { el.style.setProperty('--p', '1'); });
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      var max = Math.max(1, document.documentElement.scrollHeight - vh);
      if (nav) {
        nav.classList.toggle('is-solid', !!hero && y > hero.offsetHeight - 80);
        nav.style.setProperty('--sp', (y / max).toFixed(4));
      }
      if (!reduced) pinned.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        el.style.setProperty('--p', p.toFixed(4));
      });
      para.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = (r.top + r.height / 2 - vh / 2) * -0.08;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    };
    var orbit = document.querySelector('.orbit');
    var fitOrbit = function () {
      if (orbit) orbit.style.setProperty('--ky', Math.min(1, orbit.clientHeight / 440).toFixed(3));
    };
    fitOrbit();
    window.addEventListener('resize', fitOrbit, { passive: true });
    window.addEventListener('load', fitOrbit);
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    initFilm();
  });
  function initFilm() {
    var vid = document.getElementById('film-v');
    var btn = document.getElementById('film-ctl');
    if (!vid || !btn) return;
    var frame = vid.parentNode;
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
