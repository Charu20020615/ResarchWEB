(function () {
  /* Highlight the current section in the Domain table of contents */
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (!tocLinks.length || !("IntersectionObserver" in window)) return;

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
})();
