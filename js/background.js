(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var canvases = document.querySelectorAll("[data-net]");
  if (!canvases.length) return;

  var scenes = [];

  function makeScene(canvas) {
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;
    var parent = canvas.parentElement;
    var particles = [];
    var running = true;
    var frame = 0;

    function resize() {
      var rect = parent.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.floor(rect.width));
      var h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = w < 700 ? 16 : 34;
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28
        });
      }
    }

    function step() {
      if (!running) return;
      frame = requestAnimationFrame(step);
      if (document.hidden) return;
      var w = parent.clientWidth;
      var h = parent.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, dist;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        for (j = i + 1; j < particles.length; j++) {
          q = particles[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = "rgba(34, 211, 238," + ((1 - dist / 120) * 0.18).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    var observer = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) step();
      else cancelAnimationFrame(frame);
    });
    observer.observe(parent);
    window.addEventListener("resize", resize);
    return { resize: resize };
  }

  canvases.forEach(function (canvas) {
    var scene = makeScene(canvas);
    if (scene) scenes.push(scene);
  });
})();
