// Opening sequence: the shots change as the visitor scrolls through the tall intro section.
(function () {
  // The sticky top bar's height, so the intro frame and anchor jumps sit below it.
  var top = document.querySelector('.top');
  function topHeight() {
    document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
    return top.offsetHeight;
  }
  topHeight();
  window.addEventListener('resize', topHeight);

  var intro = document.getElementById('intro');
  if (!intro) return;
  // Links to a part of the page still go there. Otherwise the browser's own scroll position is
  // ignored, so a reload starts at the title too.
  var fresh = !location.hash;
  if (fresh && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!document.documentElement.classList.contains('intro-on')) {
    if (fresh) {
      var title = intro.querySelector('.intro-shot.title');
      title.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    return;
  }
  var shots = [].slice.call(intro.querySelectorAll('[data-shot]'));
  var bar = document.getElementById('introBar');
  // The sprig drawings grow in from the stem as you scroll, the second one a little later.
  var sprigs = [].map.call(intro.querySelectorAll('.sprig'), function (el, k) {
    return { el: el, late: k * 0.2 };
  });
  function draw(p) {
    sprigs.forEach(function (s) {
      var t = Math.min(1, Math.max(0, 0.4 + (p - s.late) * 1.6));
      s.el.style.clipPath = 'inset(' + ((1 - t) * 100).toFixed(1) + '% 0 0 0)';
    });
  }
  var at = -1;

  function update() {
    var h = top.offsetHeight,
      r = intro.getBoundingClientRect(),
      run = r.height - (window.innerHeight - h),
      p = Math.min(1, Math.max(0, (h - r.top) / run));
    // The last shot holds for a while before the archive scrolls in.
    var i = Math.min(shots.length - 1, Math.floor(p * (shots.length + 0.6)));
    bar.style.transform = 'scaleX(' + p + ')';
    draw(p);
    intro.classList.toggle('moved', p > 0.01);
    if (i === at) return;
    shots.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      s.classList.toggle('gone', k < i);
    });
    at = i;
  }

  // Every load opens on the title shot; visitors can scroll up for the lines before it.
  if (fresh) {
    var p0 = (shots.length - 1) / (shots.length + 0.6);
    window.scrollTo({
      top:
        intro.offsetTop -
        topHeight() +
        (p0 + (1 - p0) * 0.4) * (intro.offsetHeight - window.innerHeight + topHeight()),
      behavior: 'instant',
    });
  }

  var queued = false;
  window.addEventListener(
    'scroll',
    function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        update();
      });
    },
    { passive: true },
  );
  window.addEventListener('resize', update);
  update();
})();
