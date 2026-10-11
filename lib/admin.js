const { escapeHtml, mediaUrl } = require("./render");

/* ---------- Categories ---------- */

const SECTIONS = [
  { key: "team", label: "Team", hint: "Members, supervisors, and photos" },
  { key: "media", label: "App and device", hint: "App screenshots, IoT photo, architecture" },
  { key: "gallery", label: "Gallery", hint: "Photos and videos" },
  { key: "milestones", label: "Milestones", hint: "Dates, marks, and status" },
  { key: "documents", label: "Documents", hint: "Reports and project files" },
  { key: "slides", label: "Slides", hint: "Presentation files" }
];

const MEDIA_SLOTS = [
  { slot: "app_citizen", label: "Citizen app screenshot" },
  { slot: "app_municipal", label: "Municipal navigation screenshot" },
  { slot: "iot_device", label: "IoT device photo" },
  { slot: "architecture", label: "Architecture diagram" }
];

const DOC_CATEGORIES = [
  ["charter", "Project charter"],
  ["proposal", "Proposal"],
  ["checklist", "Checklists"],
  ["reports", "Reports"],
  ["final", "Final documentation"],
  ["other", "Other"]
];

const STATUSES = ["Upcoming", "In progress", "Completed"];

const ASSET_VERSION = Date.now();

/* ---------- Helpers ---------- */

function head(title) {
  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex">' +
    "<title>" + escapeHtml(title) + " · VisionWaste Admin</title>" +
    '<link rel="icon" href="/assets/favicon.png" type="image/png">' +
    '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_VERSION + '">' +
    '<link rel="stylesheet" href="/css/admin.css?v=' + ASSET_VERSION + '"></head>'
  );
}

function flashHtml(flash) {
  if (!flash) return "";
  return '<p class="a-flash a-flash--' + escapeHtml(flash.kind) + '" role="status">' + escapeHtml(flash.message) + "</p>";
}

function option(value, label, current) {
  return '<option value="' + escapeHtml(value) + '"' + (current === value ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
}

function field(label, name, value, extra) {
  const e = extra || {};
  const control =
    e.type === "textarea"
      ? '<textarea name="' + name + '"' + (e.required ? " required" : "") + ">" + escapeHtml(value || "") + "</textarea>"
      : '<input name="' + name + '" type="' + (e.type || "text") + '" value="' + escapeHtml(value || "") + '"' +
        (e.placeholder ? ' placeholder="' + escapeHtml(e.placeholder) + '"' : "") +
        (e.required ? " required" : "") + ">";
  return '<div class="a-field"><label>' + escapeHtml(label) + "</label>" + control + "</div>";
}

function fileField(label, name, accept, filePath, mime, required) {
  return (
    '<div class="a-field"><label>' + escapeHtml(label) + "</label>" +
    '<input name="' + name + '" type="file" accept="' + escapeHtml(accept) + '"' + (required ? " required" : "") + ">" +
    preview(filePath, mime) +
    "</div>"
  );
}

function preview(filePath, mime) {
  if (!filePath) return "";
  const url = escapeHtml(mediaUrl(filePath));
  if (String(mime || "").startsWith("video/")) return '<video class="a-preview" controls src="' + url + '"></video>';
  if (String(mime || "").startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath)) {
    return '<img class="a-preview" src="' + url + '" alt="">';
  }
  return '<p class="a-filelink"><a href="' + url + '" target="_blank" rel="noopener">Open current file</a></p>';
}

function isImage(filePath, mime) {
  return String(mime || "").startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath || "");
}

function thumb(filePath, mime, fallback) {
  if (filePath && isImage(filePath, mime)) {
    return '<span class="a-thumb"><img src="' + escapeHtml(mediaUrl(filePath)) + '" alt=""></span>';
  }
  return '<span class="a-thumb a-thumb--blank">' + escapeHtml(fallback || "·") + "</span>";
}

function status(text, ok) {
  return '<span class="a-status' + (ok ? " a-status--ok" : "") + '">' + escapeHtml(text) + "</span>";
}

function item(summaryHtml, formHtml, open) {
  return (
    '<details class="a-item"' + (open ? " open" : "") + "><summary>" + summaryHtml +
    '<span class="a-edit">Edit</span></summary><div class="a-item__body">' + formHtml + "</div></details>"
  );
}

function addBox(label, formHtml) {
  return (
    '<details class="a-item a-item--new"><summary><span class="a-plus">+</span>' +
    '<span class="a-text"><strong>' + escapeHtml(label) + "</strong></span></summary>" +
    '<div class="a-item__body">' + formHtml + "</div></details>"
  );
}

function actions(deleteAction, what) {
  return (
    '<div class="a-actions"><button class="btn btn--primary" type="submit">Save</button>' +
    (deleteAction
      ? '<button class="a-delete" type="submit" formaction="' + deleteAction + '" formmethod="post" onclick="return confirm(\'Delete this ' + what + '?\')">Delete</button>'
      : "") +
    "</div>"
  );
}

function section(title, hint, inner) {
  return '<section class="a-block"><div class="a-block__head"><h2>' + escapeHtml(title) + "</h2>" + (hint ? "<p>" + escapeHtml(hint) + "</p>" : "") + "</div>" + inner + "</section>";
}

/* ---------- Layout ---------- */

function layout(title, active, body, flash) {
  const nav = SECTIONS.map(function (s) {
    return '<a href="/admin/' + s.key + '"' + (s.key === active ? ' aria-current="page"' : "") + ">" + escapeHtml(s.label) + "</a>";
  }).join("");
  return (
    head(title) +
    '<body class="a-body"><header class="a-top"><a class="a-brand" href="/admin"><img src="/assets/logo-mark.webp" alt="" width="37" height="30"><span>VisionWaste <em>Admin</em></span></a>' +
    '<nav class="a-top__links"><a href="/" target="_blank" rel="noopener">View site</a><a href="/admin/logout">Log out</a></nav></header>' +
    '<div class="a-shell"><aside class="a-side"><a class="a-side__home"' + (active === "home" ? ' aria-current="page"' : "") + ' href="/admin">Overview</a>' + nav + "</aside>" +
    '<main class="a-main">' + flashHtml(flash) + body + "</main></div></body></html>"
  );
}

function pageHead(title, lead) {
  return '<div class="a-pagehead"><h1>' + escapeHtml(title) + "</h1><p>" + escapeHtml(lead) + "</p></div>";
}

/* ---------- Login and setup ---------- */

function loginPage(message, kind) {
  return (
    head("Login") +
    '<body class="a-body a-body--center"><main class="a-login">' +
    '<img class="a-login__logo" src="/assets/logo.webp" alt="VisionWaste" width="1000" height="725">' +
    "<h1>Admin sign in</h1>" +
    (message ? '<p class="a-flash a-flash--' + escapeHtml(kind || "error") + '">' + escapeHtml(message) + "</p>" : "") +
    '<form method="post" action="/admin/login" class="a-card">' +
    field("Username", "username", "", { required: true }).replace("<input", '<input autocomplete="username"') +
    '<div class="a-field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"></div>' +
    '<button class="btn btn--primary" type="submit">Sign in</button></form></main></body></html>'
  );
}

function setupPage(dbConfigured, dbReady, dbError, credsOk) {
  function row(name, ok, note) {
    return '<li><span class="a-dot a-dot--' + (ok ? "ok" : "no") + '"></span><strong>' + name + "</strong><small>" + note + "</small></li>";
  }
  return (
    head("Setup") +
    '<body class="a-body a-body--center"><main class="a-login"><img class="a-login__logo" src="/assets/logo.webp" alt="VisionWaste" width="1000" height="725">' +
    "<h1>Admin setup</h1><p>Set these Railway variables, then redeploy.</p>" +
    '<ul class="a-checklist a-card">' +
    row("DATABASE_URL", dbReady, dbConfigured ? (dbReady ? "connected" : "set, but connection failed") : "missing") +
    row("ADMIN_USERNAME", credsOk, credsOk ? "set" : "missing") +
    row("ADMIN_PASSWORD", credsOk, credsOk ? "set" : "missing") +
    row("SESSION_SECRET", credsOk, credsOk ? "set" : "missing") +
    "<li><span class=\"a-dot a-dot--ok\"></span><strong>Volume</strong><small>mount at /data for uploads</small></li></ul>" +
    (dbError ? '<p class="a-flash a-flash--error">' + escapeHtml(dbError) + "</p>" : "") +
    "</main></body></html>"
  );
}

/* ---------- Overview ---------- */

function overview(content, flash) {
  const slotsDone = MEDIA_SLOTS.filter(function (m) { return content.mediaBySlot[m.slot] && content.mediaBySlot[m.slot].file_path; }).length;
  const withFile = function (rows) { return rows.filter(function (r) { return r.file_path; }).length; };
  const stats = {
    team: content.people.length + " people, " + content.people.filter(function (p) { return p.photo_path; }).length + " with photo",
    media: slotsDone + " of " + MEDIA_SLOTS.length + " images added",
    gallery: content.gallery.length + " items",
    milestones: content.milestones.filter(function (m) { return m.status_label || m.file_path; }).length + " of " + content.milestones.length + " updated",
    documents: withFile(content.documents) + " of " + content.documents.length + " uploaded",
    slides: withFile(content.slides) + " of " + content.slides.length + " uploaded"
  };
  const cards = SECTIONS.map(function (s) {
    return (
      '<a class="a-tile" href="/admin/' + s.key + '"><strong>' + escapeHtml(s.label) + "</strong><span>" + escapeHtml(s.hint) +
      '</span><em>' + escapeHtml(stats[s.key]) + "</em></a>"
    );
  }).join("");
  return layout("Overview", "home", pageHead("Content overview", "Pick a category to edit. Changes appear on the public site as soon as you save.") + '<div class="a-tiles">' + cards + "</div>", flash);
}

/* ---------- Team ---------- */

function personForm(p, kind) {
  const person = p || {};
  const id = person.id || "";
  const isSup = kind === "supervisor";
  return (
    '<form class="a-form" method="post" action="' + (id ? "/admin/people/" + id : "/admin/people") + '" enctype="multipart/form-data">' +
    (isSup
      ? '<div class="a-field"><label>Role</label><select name="kind">' + option("supervisor", "Supervisor", person.kind) + option("co_supervisor", "Co-supervisor", person.kind) + "</select></div>"
      : '<input type="hidden" name="kind" value="member">') +
    '<div class="a-grid2">' + field("Name", "name", person.name, { required: true }) + field("Student ID", "student_id", person.student_id) + "</div>" +
    field("Email", "email", person.email, { type: "email" }) +
    field("What they work on", "component_title", person.component_title) +
    field("Description", "description", person.description, { type: "textarea" }) +
    fileField("Photo", "photo", "image/*", person.photo_path, "image/") +
    actions(id ? "/admin/people/" + id + "/delete" : "", "person") +
    "</form>"
  );
}

function teamPage(content, flash) {
  const members = content.members.map(function (p) {
    return item(thumb(p.photo_path, "image/", (p.name || "?").charAt(0)) + '<span class="a-text"><strong>' + escapeHtml(p.name) + "</strong><small>" + escapeHtml(p.student_id || "No ID") + "</small></span>" + status(p.photo_path ? "Photo added" : "No photo", Boolean(p.photo_path)), personForm(p, "member"));
  }).join("");
  const sups = content.supervisors.map(function (p) {
    return item(thumb(p.photo_path, "image/", (p.name || "?").charAt(0)) + '<span class="a-text"><strong>' + escapeHtml(p.name) + "</strong><small>" + (p.kind === "co_supervisor" ? "Co-supervisor" : "Supervisor") + "</small></span>" + status(p.photo_path ? "Photo added" : "No photo", Boolean(p.photo_path)), personForm(p, "supervisor"));
  }).join("");
  return layout(
    "Team", "team",
    pageHead("Team", "Photos are shown large on the Team page. Use a portrait or head-and-shoulders image, landscape works best.") +
      section("Team members", "", members + addBox("Add team member", personForm(null, "member"))) +
      section("Supervisors", "", sups + addBox("Add supervisor", personForm(null, "supervisor"))),
    flash
  );
}

/* ---------- App and device ---------- */

function mediaForm(slot, row) {
  const r = row || {};
  return (
    '<form class="a-form" method="post" action="/admin/media/' + slot + '" enctype="multipart/form-data">' +
    fileField("Image", "file", "image/*", r.file_path, r.mime_type) +
    field("Short description", "description", r.description, { type: "textarea" }) +
    actions("", "") + "</form>"
  );
}

function mediaPage(content, flash) {
  const cards = MEDIA_SLOTS.map(function (m) {
    const r = content.mediaBySlot[m.slot];
    return item(thumb(r && r.file_path, r && r.mime_type, "+") + '<span class="a-text"><strong>' + escapeHtml(m.label) + "</strong><small>" + escapeHtml((r && r.description) || "No description yet") + "</small></span>" + status(r && r.file_path ? "Added" : "Empty", Boolean(r && r.file_path)), mediaForm(m.slot, r));
  }).join("");
  return layout("App and device", "media", pageHead("App and device", "Four fixed image slots. They appear in the Product section on the home page and the architecture figure on the Domain page.") + section("Images", "", cards), flash);
}

/* ---------- Gallery ---------- */

function galleryForm(g) {
  const item_ = g || {};
  const id = item_.id || "";
  return (
    '<form class="a-form" method="post" action="' + (id ? "/admin/gallery/" + id : "/admin/gallery") + '" enctype="multipart/form-data">' +
    fileField("Photo or video", "file", "image/*,video/mp4,video/webm", item_.file_path, item_.mime_type, !id) +
    '<div class="a-grid2">' + field("Title", "title", item_.title, { required: true }) + field("Caption", "caption", item_.caption) + "</div>" +
    actions(id ? "/admin/gallery/" + id + "/delete" : "", "item") + "</form>"
  );
}

function galleryPage(content, flash) {
  const rows = content.gallery.map(function (g) {
    return item(thumb(g.file_path, g.mime_type, "▶") + '<span class="a-text"><strong>' + escapeHtml(g.title || "Untitled") + "</strong><small>" + escapeHtml(String(g.mime_type || "").startsWith("video/") ? "Video" : "Photo") + "</small></span>", galleryForm(g));
  }).join("");
  return layout("Gallery", "gallery", pageHead("Gallery", "Photos and videos shown in the gallery on the home page.") + section("Items", "", rows + addBox("Add photo or video", galleryForm(null))), flash);
}

/* ---------- Milestones ---------- */

function milestoneForm(m) {
  return (
    '<form class="a-form" method="post" action="/admin/milestones/' + m.id + '" enctype="multipart/form-data">' +
    '<div class="a-grid3">' + field("Date", "event_date", m.event_date, { placeholder: "e.g. 12 March 2026" }) +
    '<div class="a-field"><label>Status</label><select name="status_label"><option value="">Not set</option>' + STATUSES.map(function (s) { return option(s, s, m.status_label); }).join("") + "</select></div>" +
    field("Marks", "marks", m.marks) + "</div>" +
    field("Notes", "description", m.description, { type: "textarea" }) +
    fileField("Linked file", "file", ".pdf,.ppt,.pptx,.doc,.docx,image/*", m.file_path, "") +
    actions("", "") + "</form>"
  );
}

function milestonesPage(content, flash) {
  const rows = content.milestones.map(function (m) {
    return item('<span class="a-text"><strong>' + escapeHtml(m.title) + "</strong><small>" + escapeHtml(m.event_date || "No date yet") + "</small></span>" + status(m.status_label || (m.file_path ? "File added" : "Not set"), m.status_label === "Completed"), milestoneForm(m));
  }).join("");
  return layout("Milestones", "milestones", pageHead("Milestones", "The five assessments are fixed. Set the date, status, marks, and attach a file.") + section("Assessments", "", rows), flash);
}

/* ---------- Documents and slides ---------- */

function documentForm(d) {
  const doc = d || {};
  const id = doc.id || "";
  return (
    '<form class="a-form" method="post" action="' + (id ? "/admin/documents/" + id : "/admin/documents") + '" enctype="multipart/form-data">' +
    '<div class="a-grid2">' + field("Title", "title", doc.title, { required: true }) +
    '<div class="a-field"><label>Category</label><select name="category">' + DOC_CATEGORIES.map(function (c) { return option(c[0], c[1], doc.category || "other"); }).join("") + "</select></div></div>" +
    '<div class="a-grid2">' + field("Date", "event_date", doc.event_date) + "<div></div></div>" +
    field("Description", "description", doc.description, { type: "textarea" }) +
    fileField("File", "file", ".pdf,.doc,.docx,image/*", doc.file_path, "") +
    actions(id ? "/admin/documents/" + id + "/delete" : "", "document") + "</form>"
  );
}

function documentsPage(content, flash) {
  const groups = DOC_CATEGORIES.map(function (c) {
    const rows = content.documents.filter(function (d) { return d.category === c[0]; });
    if (!rows.length) return "";
    return '<h3 class="a-group">' + escapeHtml(c[1]) + "</h3>" + rows.map(function (d) {
      return item('<span class="a-text"><strong>' + escapeHtml(d.title) + "</strong><small>" + escapeHtml(d.file_name || "No file yet") + "</small></span>" + status(d.file_path ? "Uploaded" : "Missing", Boolean(d.file_path)), documentForm(d));
    }).join("");
  }).join("");
  return layout("Documents", "documents", pageHead("Documents", "Grouped by category. Open one to upload or replace its file.") + section("Library", "", groups + addBox("Add document", documentForm(null))), flash);
}

function slideForm(s) {
  const slide = s || {};
  const id = slide.id || "";
  return (
    '<form class="a-form" method="post" action="' + (id ? "/admin/slides/" + id : "/admin/slides") + '" enctype="multipart/form-data">' +
    '<div class="a-grid3">' + field("Title", "title", slide.title, { required: true }) + field("Label", "tag_label", slide.tag_label, { placeholder: "e.g. Progress 1" }) + field("Date", "event_date", slide.event_date) + "</div>" +
    field("Description", "description", slide.description, { type: "textarea" }) +
    fileField("File", "file", ".pdf,.ppt,.pptx,image/*", slide.file_path, "") +
    actions(id ? "/admin/slides/" + id + "/delete" : "", "slides") + "</form>"
  );
}

function slidesPage(content, flash) {
  const rows = content.slides.map(function (s) {
    return item('<span class="a-text"><strong>' + escapeHtml(s.title) + "</strong><small>" + escapeHtml(s.file_name || "No file yet") + "</small></span>" + status(s.file_path ? "Uploaded" : "Missing", Boolean(s.file_path)), slideForm(s));
  }).join("");
  return layout("Slides", "slides", pageHead("Slides", "Presentation files for each assessment.") + section("Presentations", "", rows + addBox("Add slides", slideForm(null))), flash);
}

const PAGES = { team: teamPage, media: mediaPage, gallery: galleryPage, milestones: milestonesPage, documents: documentsPage, slides: slidesPage };

function sectionPage(key, content, flash) {
  const fn = PAGES[key];
  return fn ? fn(content, flash) : null;
}

module.exports = { loginPage, setupPage, overview, sectionPage, SECTIONS };
