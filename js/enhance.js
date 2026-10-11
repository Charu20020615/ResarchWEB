(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");

  /* Missing team photos: drop the broken image so the initials show */
  function dropBroken(img) {
    if (img.parentNode) img.parentNode.removeChild(img);
  }
  document.addEventListener("error", function (event) {
    var t = event.target;
    if (t && t.tagName === "IMG" && t.closest(".person__photo")) dropBroken(t);
  }, true);
  document.querySelectorAll(".person__photo img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) dropBroken(img);
  });

  /* Scroll progress bar and header state */
  var bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      if (header) header.classList.toggle("is-scrolled", y > 12);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (!("IntersectionObserver" in window)) return;

  /* Count-up numbers */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduce) {
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counter.unobserve(el);
        var end = parseFloat(el.getAttribute("data-count"));
        var start = performance.now();
        var dur = 1500;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(end * eased);
          if (p < 1) window.requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = "0";
      counter.observe(el);
    });
  }

  /* Scroll reveal with a short stagger inside each group */
  if (!reduce) {
    var selector = ".section-head, .stat, .card, .steps li, .panel, .doc, .slide, .milestone, .person, .feature, .table-wrap, .note, .cite, .gallery-item, .search-list li, .toolbar, .contact-layout > *";
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        reveal.unobserve(el);
        el.classList.add("is-in");
        window.setTimeout(function () {
          el.removeAttribute("data-reveal");
          el.style.removeProperty("--d");
        }, 1300);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    document.querySelectorAll(selector).forEach(function (el) {
      if (el.closest(".hero-art, .page-hero, .site-header")) return;
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.setAttribute("data-reveal", "");
      el.style.setProperty("--d", Math.min(siblings, 6) * 80 + "ms");
      reveal.observe(el);
    });
    root.classList.add("js-reveal");
  }

  /* Highlight the current section in the Domain table of contents */
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
        var link = byId[entry.target.id];
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }
})();
