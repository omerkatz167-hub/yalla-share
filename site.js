(function () {
  var q = window.location.search;
  if (/[?&]token=/.test(q)) {
    window.location.replace('trip.html' + q + window.location.hash);
    return;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var steps = [].slice.call(document.querySelectorAll('[data-yl-step]'));
    var screens = [].slice.call(document.querySelectorAll('[data-yl-scr]'));
    var dots = [].slice.call(document.querySelectorAll('[data-yl-dot]'));
    var active = 0;

    function mark(list, attr, i) {
      list.forEach(function (el) {
        el.classList.toggle('is-on', Number(el.getAttribute(attr)) === i);
      });
    }

    function show(i) {
      if (i === active) return;
      active = i;
      mark(steps, 'data-yl-step', i);
      mark(screens, 'data-yl-scr', i);
      mark(dots, 'data-yl-dot', i);
    }

    document.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('[data-go]') : null;
      if (target) show(Number(target.getAttribute('data-go')));
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) show(Number(entry.target.getAttribute('data-yl-step')));
          });
        },
        { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
      );
      steps.forEach(function (s) {
        io.observe(s);
      });
    }
  });
})();
