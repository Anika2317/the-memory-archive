// Opening sequence: the shots change as the visitor scrolls through the tall intro section.
(function () {
  var intro = document.getElementById('intro');
  if (!intro || !document.documentElement.classList.contains('intro-on')) return;
  var shots = [].slice.call(intro.querySelectorAll('[data-shot]'));
  var bar = document.getElementById('introBar');
  var at = -1;

  function update() {
    var r = intro.getBoundingClientRect(),
      run = r.height - window.innerHeight,
      p = Math.min(1, Math.max(0, -r.top / run));
    // The last shot holds for a while before the archive scrolls in.
    var i = Math.min(shots.length - 1, Math.floor(p * (shots.length + 0.6)));
    bar.style.transform = 'scaleX(' + p + ')';
    intro.classList.toggle('moved', p > 0.01);
    if (i === at) return;
    shots.forEach(function (s, k) {
      s.classList.toggle('on', k === i);
      s.classList.toggle('gone', k < i);
    });
    at = i;
  }

  // People who have seen it before start at the archive; they can scroll up to watch again.
  var seen = false;
  try {
    seen = !!localStorage.getItem('archive-intro-seen');
    localStorage.setItem('archive-intro-seen', '1');
  } catch (e) {}
  if (seen && !location.hash && window.scrollY === 0)
    window.scrollTo({ top: document.getElementById('archive').offsetTop, behavior: 'instant' });

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
