(function () {
  var q = window.location.search;
  if (/[?&]token=/.test(q)) {
    window.location.replace('trip.html' + q + window.location.hash);
    return;
  }
  var root = document.documentElement;
  root.classList.add('js');
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(mqReduce && mqReduce.matches);
  var nativeScroll = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  if (!nativeScroll) root.classList.add('no-sda');
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function $$(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var hasIO = 'IntersectionObserver' in window;
  ready(function () {
    var dlMain = document.getElementById('dl-main');
    if (dlMain) {
      $$('a[data-dl]').forEach(function (a) {
        a.href = dlMain.href;
        a.rel = 'noopener';
      });
    }
    if (!nativeScroll) {
      var revealEls = $$('.rv, .stg, .reveal, .fan');
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
    }
    if (!nativeScroll && !reduced) {
      var pinned = $$('[data-progress]');
      var ticking = false;
      var update = function () {
        ticking = false;
        var vh = window.innerHeight;
        pinned.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -vh || r.top > 2 * vh) return;
          var p = clamp01(-r.top / Math.max(1, r.height - vh));
          el.style.setProperty('--p', p.toFixed(4));
        });
      };
      var onScroll = function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
    initFilm();
    initStory();
  });
  function initFilm() {
    var hero = document.getElementById('top');
    var vid = document.getElementById('film');
    var btn = document.getElementById('film-ctl');
    if (!hero || !vid || !btn) return;
    var vertical = vid.getAttribute('data-vertical');
    if (vertical && window.matchMedia && window.matchMedia('(max-width: 734px) and (orientation: portrait)').matches) {
      $$('source', vid).forEach(function (s) { s.parentNode.removeChild(s); });
      var vs = document.createElement('source');
      vs.src = vertical;
      vs.type = 'video/mp4';
      vid.appendChild(vs);
      var vp = vid.getAttribute('data-vertical-poster');
      if (vp) vid.setAttribute('poster', vp);
      vid.load();
    }
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var userPaused = reduced || saveData;
    var visible = true;
    var loaded = false;
    var markPortrait = function (w, h) { hero.classList.toggle('is-portrait', h > w * 1.05); };
    var poster = new Image();
    poster.onload = function () { if (!loaded) markPortrait(poster.naturalWidth, poster.naturalHeight); };
    poster.src = vid.getAttribute('poster');
    vid.addEventListener('loadedmetadata', function () {
      loaded = true;
      if (vid.videoWidth) markPortrait(vid.videoWidth, vid.videoHeight);
    });
    var sources = $$('source', vid);
    var last = sources[sources.length - 1];
    if (last) last.addEventListener('error', function () { hero.classList.add('no-video'); });
    var sync = function () {
      btn.classList.toggle('is-paused', userPaused);
      btn.setAttribute('aria-label', userPaused ? 'הפעלת הסרטון' : 'השהיית הסרטון');
    };
    var apply = function () {
      if (visible && !userPaused) {
        if (vid.preload === 'none') vid.preload = 'auto';
        var pr = vid.play();
        if (pr && pr.catch) pr.catch(function () { userPaused = true; sync(); });
      } else if (!vid.paused) {
        vid.pause();
      }
    };
    btn.addEventListener('click', function () { userPaused = !userPaused; sync(); apply(); });
    sync();
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        apply();
      }, { rootMargin: '200px 0px' }).observe(hero.querySelector('.hero-stage'));
      var sentinel = hero.querySelector('.hero-sentinel');
      if (sentinel && !reduced) {
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          hero.classList.toggle('copy-gone', !e.isIntersecting && e.boundingClientRect.top < 0);
        }).observe(sentinel);
      }
    } else {
      apply();
    }
  }
  function initStory() {
    var steps = $$('.story .step');
    if (!steps.length) return;
    var screens = $$('.story .scr');
    var glows = $$('.story .glow i');
    var dots = $$('.story .dots button');
    var phone = document.querySelector('.story .phone');
    var active = 0;
    var show = function (i) {
      if (i === active || i < 0 || i >= steps.length) return;
      phone.setAttribute('data-dir', i > active ? 'fwd' : 'back');
      screens.forEach(function (s, k) {
        s.classList.toggle('was', k === active);
        s.classList.toggle('is-on', k === i);
        if (k === i) s.loading = 'eager';
      });
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      glows.forEach(function (g, k) { g.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) {
        if (k === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      active = i;
    };
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () {
        steps[k].querySelector('.step-copy').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        show(k);
      });
    });
    if (hasIO) {
      var warm = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          screens.forEach(function (s) { s.loading = 'eager'; });
          warm.disconnect();
        }
      }, { rootMargin: '600px 0px' });
      warm.observe(document.querySelector('.story'));
      var copies = steps.map(function (s) { return s.querySelector('.step-copy'); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) show(copies.indexOf(e.target));
        });
      }, { rootMargin: '-55% 0px -25% 0px', threshold: 0 });
      copies.forEach(function (c) { io.observe(c); });
    }
  }
})();
