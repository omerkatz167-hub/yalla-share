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
    initSettle();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { root.classList.add('loaded'); });
    });
    var revealEls = $$('.rv, [data-reveal]');
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
    var pinned = reduced ? [] : $$('[data-progress]');
    pinned.forEach(function (el) { if (el.classList.contains('merge')) el.classList.add('is-live'); });
    var orbit = document.querySelector('.orbit');
    var fitOrbit = function () {
      if (orbit) orbit.style.setProperty('--ky', Math.min(1, orbit.clientHeight / 440).toFixed(3));
    };
    var route = document.getElementById('route');
    var line = route && route.querySelector('.route-line');
    var dots = route ? $$('.dot', route) : [];
    var lineTop = 0;
    var lineLen = 0;
    var placeLine = function () {
      if (!line || dots.length < 2) return;
      var base = route.getBoundingClientRect().top;
      var first = dots[0].getBoundingClientRect();
      var last = dots[dots.length - 1].getBoundingClientRect();
      lineTop = first.top + first.height / 2 - base;
      lineLen = Math.max(0, last.top + last.height / 2 - base - lineTop);
      line.style.setProperty('--lt', lineTop.toFixed(1) + 'px');
      line.style.setProperty('--lh', lineLen.toFixed(1) + 'px');
    };
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      pinned.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        el.style.setProperty('--p', p.toFixed(4));
      });
      if (line && lineLen && !reduced) {
        var top = route.getBoundingClientRect().top + lineTop;
        var d = Math.min(1, Math.max(0, (vh * 0.7 - top) / lineLen));
        line.style.setProperty('--d', d.toFixed(4));
      }
      dots.forEach(function (dot) {
        dot.classList.toggle('on', reduced || dot.getBoundingClientRect().top < vh * 0.7);
      });
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    var onResize = function () { fitOrbit(); placeLine(); onScroll(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('load', onResize);
    onResize();
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
  function initSettle() {
    var box = document.getElementById('settle');
    var out = document.getElementById('settle-out');
    var sum = document.getElementById('settle-sum');
    if (!box || !out || !sum) return;
    var rows = $$('.row', box);
    var fmt = function (n) {
      var r = Math.round(n * 100) / 100;
      return r.toLocaleString('he-IL', { maximumFractionDigits: r % 1 ? 2 : 0 }) + ' ₪';
    };
    var item = function (from, to, amount) {
      var li = document.createElement('li');
      var who = document.createElement('span');
      var a = document.createElement('b');
      var b = document.createElement('b');
      a.textContent = from;
      b.textContent = to;
      who.append('מ', a, ' ל', b);
      var num = document.createElement('span');
      num.className = 'num';
      num.textContent = fmt(amount);
      li.append(who, ' ', num);
      return li;
    };
    var calc = function () {
      var people = rows.map(function (row, i) {
        var nm = row.querySelector('.nm').value.trim() || 'חבר ' + (i + 1);
        var paid = parseFloat(row.querySelector('.amt').value);
        return { name: nm, paid: isFinite(paid) && paid > 0 ? paid : 0 };
      });
      var total = people.reduce(function (s, p) { return s + p.paid; }, 0);
      var share = total / people.length;
      sum.textContent = 'סה״כ ' + fmt(total) + ', לכל אחד ' + fmt(share);
      var bal = people.map(function (p) { return { name: p.name, b: p.paid - share }; });
      var cred = bal.filter(function (x) { return x.b > 0.005; }).sort(function (x, y) { return y.b - x.b; });
      var debt = bal.filter(function (x) { return x.b < -0.005; }).sort(function (x, y) { return x.b - y.b; });
      out.textContent = '';
      var i = 0;
      var j = 0;
      while (i < debt.length && j < cred.length) {
        var amount = Math.min(-debt[i].b, cred[j].b);
        if (amount > 0.005) out.append(item(debt[i].name, cred[j].name, amount));
        debt[i].b += amount;
        cred[j].b -= amount;
        if (debt[i].b > -0.005) i++;
        if (cred[j].b < 0.005) j++;
      }
      if (!out.children.length) {
        var none = document.createElement('li');
        none.className = 'none';
        none.textContent = total ? 'כולם שילמו אותו דבר. אין מה להעביר.' : 'הכניסו כמה כל אחד שילם.';
        out.append(none);
      }
    };
    box.addEventListener('input', calc);
    calc();
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
