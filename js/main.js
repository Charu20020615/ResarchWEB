(function () {
  var toggle = document.getElementById("nav-toggle");

  function closeNav() {
    if (toggle) toggle.checked = false;
  }

  document.querySelectorAll(".site-nav a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });

  if (toggle) {
    var burgerText = document.querySelector(".nav-burger .sr-only");
    toggle.addEventListener("change", function () {
      if (burgerText) burgerText.textContent = toggle.checked ? "Close menu" : "Open menu";
    });
  }

  var milestoneFilter = document.getElementById("milestone-filter");
  if (milestoneFilter) {
    var milestones = document.querySelectorAll("[data-milestone]");
    milestoneFilter.addEventListener("change", function () {
      var value = milestoneFilter.value;
      milestones.forEach(function (item) {
        var show = value === "all" || item.getAttribute("data-milestone") === value;
        item.hidden = !show;
      });
      if (value !== "all") {
        var target = document.getElementById(value);
        if (target) target.scrollIntoView({ block: "start" });
      }
    });
  }

  var docSearch = document.getElementById("doc-search");
  var docFilter = document.getElementById("doc-filter");
  var docEmpty = document.getElementById("doc-empty");
  if (docSearch && docFilter) {
    var docs = document.querySelectorAll("[data-doc]");
    function applyDocs() {
      var query = docSearch.value.trim().toLowerCase();
      var category = docFilter.value;
      var visible = 0;
      docs.forEach(function (card) {
        var haystack = (card.getAttribute("data-doc") || "").toLowerCase();
        var cat = card.getAttribute("data-category");
        var show = (category === "all" || cat === category) && (!query || haystack.indexOf(query) !== -1);
        card.hidden = !show;
        if (show) visible += 1;
      });
      document.querySelectorAll("[data-doc-group]").forEach(function (group) {
        var groupKey = group.getAttribute("data-doc-group");
        var any = false;
        group.querySelectorAll("[data-doc]").forEach(function (card) {
          if (!card.hidden) any = true;
        });
        group.hidden = !((category === "all" || category === groupKey) && any);
      });
      if (docEmpty) docEmpty.hidden = visible !== 0;
    }
    docSearch.addEventListener("input", applyDocs);
    docFilter.addEventListener("change", applyDocs);
  }

  var slideSearch = document.getElementById("slide-search");
  if (slideSearch) {
    var slides = document.querySelectorAll("[data-slide]");
    var slideEmpty = document.getElementById("slide-empty");
    slideSearch.addEventListener("input", function () {
      var query = slideSearch.value.trim().toLowerCase();
      var visible = 0;
      slides.forEach(function (card) {
        var haystack = (card.getAttribute("data-slide") || "").toLowerCase();
        var show = !query || haystack.indexOf(query) !== -1;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (slideEmpty) slideEmpty.hidden = visible !== 0;
    });
  }

  var siteSearch = document.getElementById("site-search");
  if (siteSearch) {
    var entries = document.querySelectorAll("[data-search-item]");
    var siteEmpty = document.getElementById("site-search-empty");
    siteSearch.addEventListener("input", function () {
      var query = siteSearch.value.trim().toLowerCase();
      var visible = 0;
      entries.forEach(function (item) {
        var haystack = (item.getAttribute("data-search-item") || "").toLowerCase();
        var show = !query || haystack.indexOf(query) !== -1;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (siteEmpty) siteEmpty.hidden = visible !== 0;
    });
  }

  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var hp = document.getElementById("company");

  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = "form-status form-status--" + kind;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (hp && hp.value) {
      setStatus("The form could not be submitted.", "error");
      return;
    }

    var name = form.elements.namedItem("name").value.trim();
    var email = form.elements.namedItem("email").value.trim();
    var recipient = form.elements.namedItem("recipient").value;
    var subject = form.elements.namedItem("subject").value.trim();
    var message = form.elements.namedItem("message").value.trim();
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !recipient || !subject || message.length < 10) {
      setStatus("Enter your name, a valid email, a recipient, a subject, and a message of at least 10 characters.", "error");
      return;
    }

    var body = "Name: " + name + "\nEmail: " + email + "\n\n" + message;
    var href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    setStatus("Your email application should open with this draft. This website does not send email itself.", "success");
    window.location.href = href;
  });
})();
