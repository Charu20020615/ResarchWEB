const { escapeHtml, mediaUrl } = require("./render");

function layout(title, body, flash) {
  return (
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>" +
    escapeHtml(title) +
    " · VisionWaste Admin</title>" +
    '<link rel="stylesheet" href="/css/style.css">' +
    '<link rel="stylesheet" href="/css/admin.css"></head><body class="admin-body">' +
    '<header class="admin-top"><div class="container admin-top__bar">' +
    "<strong>VisionWaste Admin</strong>" +
    '<nav><a href="/admin">Dashboard</a><a href="/" target="_blank" rel="noopener">View site</a>' +
    '<a href="/admin/logout">Log out</a></nav></div></header>' +
    '<main class="container admin-main">' +
    (flash
      ? '<p class="admin-flash admin-flash--' +
        escapeHtml(flash.kind) +
        '">' +
        escapeHtml(flash.message) +
        "</p>"
      : "") +
    body +
    "</main></body></html>"
  );
}

function loginPage(message, kind) {
  return (
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Login · VisionWaste Admin</title>" +
    '<link rel="stylesheet" href="/css/style.css">' +
    '<link rel="stylesheet" href="/css/admin.css"></head><body class="admin-body">' +
    '<main class="admin-login container">' +
    "<h1>Admin login</h1>" +
    (message
      ? '<p class="admin-flash admin-flash--' +
        escapeHtml(kind || "error") +
        '">' +
        escapeHtml(message) +
        "</p>"
      : "") +
    '<form method="post" action="/admin/login" class="panel admin-form">' +
    '<div class="field"><label for="username">Username</label>' +
    '<input id="username" name="username" required autocomplete="username"></div>' +
    '<div class="field"><label for="password">Password</label>' +
    '<input id="password" name="password" type="password" required autocomplete="current-password"></div>' +
    '<button class="btn btn--primary" type="submit">Sign in</button></form>' +
    "</main></body></html>"
  );
}

function setupPage(dbConfigured, dbReady, dbError, credsOk) {
  return (
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Setup · VisionWaste Admin</title>" +
    '<link rel="stylesheet" href="/css/style.css">' +
    '<link rel="stylesheet" href="/css/admin.css"></head><body class="admin-body">' +
    '<main class="admin-login container"><h1>Admin setup</h1>' +
    '<article class="panel"><p>Set these Railway variables, then redeploy:</p><ul class="meta-list">' +
    "<li><strong>DATABASE_URL</strong> " +
    (dbConfigured ? (dbReady ? "connected" : "set, but connection failed") : "missing") +
    "</li>" +
    "<li><strong>ADMIN_USERNAME</strong> " +
    (credsOk ? "set" : "missing") +
    "</li>" +
    "<li><strong>ADMIN_PASSWORD</strong> " +
    (credsOk ? "set" : "missing") +
    "</li>" +
    "<li><strong>SESSION_SECRET</strong> " +
    (credsOk ? "set" : "missing") +
    "</li>" +
    "<li><strong>Volume</strong> mount at <code>/data</code> for uploads</li>" +
    "</ul>" +
    (dbError ? "<p class=\"admin-flash admin-flash--error\">" + escapeHtml(dbError) + "</p>" : "") +
    "</article></main></body></html>"
  );
}

function filePreview(filePath, mime) {
  if (!filePath) return "<p class=\"fine\">No file uploaded.</p>";
  const url = mediaUrl(filePath);
  if (String(mime || "").startsWith("video/")) {
    return '<video class="admin-preview" controls src="' + escapeHtml(url) + '"></video>';
  }
  if (String(mime || "").startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath)) {
    return '<img class="admin-preview" src="' + escapeHtml(url) + '" alt="">';
  }
  return '<p><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">Current file</a></p>';
}

function personForm(person) {
  const p = person || {};
  const id = p.id || "";
  const action = id ? "/admin/people/" + id : "/admin/people";
  return (
    '<form class="panel admin-form" method="post" action="' +
    action +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    (id ? "Edit person" : "Add person") +
    "</h3>" +
    '<div class="form-row">' +
    '<div class="field"><label>Kind</label><select name="kind" required>' +
    option("member", "Team member", p.kind) +
    option("supervisor", "Supervisor", p.kind) +
    option("co_supervisor", "Co-supervisor", p.kind) +
    "</select></div>" +
    '<div class="field"><label>Sort order</label><input name="sort_order" type="number" value="' +
    escapeHtml(p.sort_order != null ? p.sort_order : 0) +
    '"></div></div>' +
    '<div class="field"><label>Name</label><input name="name" required value="' +
    escapeHtml(p.name || "") +
    '"></div>' +
    '<div class="form-row"><div class="field"><label>Student ID</label><input name="student_id" value="' +
    escapeHtml(p.student_id || "") +
    '"></div>' +
    '<div class="field"><label>Role label</label><input name="role_label" value="' +
    escapeHtml(p.role_label || "") +
    '"></div></div>' +
    '<div class="field"><label>Email</label><input name="email" type="email" value="' +
    escapeHtml(p.email || "") +
    '"></div>' +
    '<div class="field"><label>Component title</label><input name="component_title" value="' +
    escapeHtml(p.component_title || "") +
    '"></div>' +
    '<div class="field"><label>Description</label><textarea name="description">' +
    escapeHtml(p.description || "") +
    "</textarea></div>" +
    '<div class="field"><label>Photo</label><input name="photo" type="file" accept="image/*">' +
    filePreview(p.photo_path, "image/") +
    "</div>" +
    '<div class="admin-actions"><button class="btn btn--primary" type="submit">Save</button>' +
    (id
      ? '<button class="btn btn--ghost" formaction="/admin/people/' +
        id +
        '/delete" formmethod="post">Delete</button>'
      : "") +
    "</div></form>"
  );
}

function option(value, label, current) {
  return (
    '<option value="' +
    escapeHtml(value) +
    '"' +
    (current === value ? " selected" : "") +
    ">" +
    escapeHtml(label) +
    "</option>"
  );
}

function mediaSlotForm(slot, label, accept, row) {
  const r = row || {};
  return (
    '<form class="panel admin-form" method="post" action="/admin/media/' +
    escapeHtml(slot) +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    escapeHtml(label) +
    "</h3>" +
    '<div class="field"><label>Title</label><input name="title" value="' +
    escapeHtml(r.title && r.title !== slot ? r.title : "") +
    '"></div>' +
    '<div class="field"><label>Caption</label><input name="caption" value="' +
    escapeHtml(r.caption || "") +
    '"></div>' +
    '<div class="field"><label>Description</label><textarea name="description">' +
    escapeHtml(r.description || "") +
    "</textarea></div>" +
    '<div class="field"><label>File</label><input name="file" type="file" accept="' +
    escapeHtml(accept) +
    '">' +
    filePreview(r.file_path, r.mime_type) +
    "</div>" +
    '<button class="btn btn--primary" type="submit">Save</button></form>'
  );
}

function galleryForm(item) {
  const g = item || {};
  const id = g.id || "";
  const action = id ? "/admin/gallery/" + id : "/admin/gallery";
  return (
    '<form class="panel admin-form" method="post" action="' +
    action +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    (id ? "Edit gallery item" : "Add photo or video") +
    "</h3>" +
    '<div class="field"><label>Title</label><input name="title" required value="' +
    escapeHtml(g.title || "") +
    '"></div>' +
    '<div class="field"><label>Caption</label><input name="caption" value="' +
    escapeHtml(g.caption || "") +
    '"></div>' +
    '<div class="field"><label>Sort order</label><input name="sort_order" type="number" value="' +
    escapeHtml(g.sort_order != null ? g.sort_order : 0) +
    '"></div>' +
    '<div class="field"><label>File</label><input name="file" type="file" accept="image/*,video/mp4,video/webm"' +
    (id ? "" : " required") +
    ">" +
    filePreview(g.file_path, g.mime_type) +
    "</div>" +
    '<div class="admin-actions"><button class="btn btn--primary" type="submit">Save</button>' +
    (id
      ? '<button class="btn btn--ghost" formaction="/admin/gallery/' +
        id +
        '/delete" formmethod="post">Delete</button>'
      : "") +
    "</div></form>"
  );
}

function milestoneForm(m) {
  return (
    '<form class="panel admin-form" method="post" action="/admin/milestones/' +
    m.id +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    escapeHtml(m.title) +
    " <span class=\"fine\">(" +
    escapeHtml(m.slug) +
    ")</span></h3>" +
    '<div class="field"><label>Title</label><input name="title" required value="' +
    escapeHtml(m.title || "") +
    '"></div>' +
    '<div class="field"><label>Description</label><textarea name="description">' +
    escapeHtml(m.description || "") +
    "</textarea></div>" +
    '<div class="form-row"><div class="field"><label>Date</label><input name="event_date" value="' +
    escapeHtml(m.event_date || "") +
    '"></div>' +
    '<div class="field"><label>Marks</label><input name="marks" value="' +
    escapeHtml(m.marks || "") +
    '"></div></div>' +
    '<div class="form-row"><div class="field"><label>Completion</label><input name="completion" value="' +
    escapeHtml(m.completion || "") +
    '"></div>' +
    '<div class="field"><label>Status label</label><input name="status_label" value="' +
    escapeHtml(m.status_label || "") +
    '"></div></div>' +
    '<div class="field"><label>Linked file</label><input name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,image/*">' +
    filePreview(m.file_path, "") +
    "</div>" +
    '<button class="btn btn--primary" type="submit">Save milestone</button></form>'
  );
}

function documentForm(d) {
  return (
    '<form class="panel admin-form" method="post" action="/admin/documents/' +
    d.id +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    escapeHtml(d.title) +
    "</h3>" +
    '<div class="form-row"><div class="field"><label>Category</label><select name="category">' +
    ["charter", "proposal", "checklist", "reports", "final", "other"]
      .map(function (c) {
        return option(c, c, d.category);
      })
      .join("") +
    "</select></div>" +
    '<div class="field"><label>Date</label><input name="event_date" value="' +
    escapeHtml(d.event_date || "") +
    '"></div></div>' +
    '<div class="field"><label>Title</label><input name="title" required value="' +
    escapeHtml(d.title || "") +
    '"></div>' +
    '<div class="field"><label>Description</label><textarea name="description">' +
    escapeHtml(d.description || "") +
    "</textarea></div>" +
    '<div class="field"><label>File</label><input name="file" type="file" accept=".pdf,.doc,.docx,image/*">' +
    filePreview(d.file_path, "") +
    "</div>" +
    '<div class="admin-actions"><button class="btn btn--primary" type="submit">Save</button>' +
    '<button class="btn btn--ghost" formaction="/admin/documents/' +
    d.id +
    '/delete" formmethod="post">Delete</button></div></form>'
  );
}

function slideForm(s) {
  return (
    '<form class="panel admin-form" method="post" action="/admin/slides/' +
    s.id +
    '" enctype="multipart/form-data">' +
    "<h3>" +
    escapeHtml(s.title) +
    "</h3>" +
    '<div class="form-row"><div class="field"><label>Tag</label><input name="tag_label" value="' +
    escapeHtml(s.tag_label || "") +
    '"></div>' +
    '<div class="field"><label>Date</label><input name="event_date" value="' +
    escapeHtml(s.event_date || "") +
    '"></div></div>' +
    '<div class="field"><label>Title</label><input name="title" required value="' +
    escapeHtml(s.title || "") +
    '"></div>' +
    '<div class="field"><label>Description</label><textarea name="description">' +
    escapeHtml(s.description || "") +
    "</textarea></div>" +
    '<div class="field"><label>File</label><input name="file" type="file" accept=".pdf,.ppt,.pptx,image/*">' +
    filePreview(s.file_path, "") +
    "</div>" +
    '<div class="admin-actions"><button class="btn btn--primary" type="submit">Save</button>' +
    '<button class="btn btn--ghost" formaction="/admin/slides/' +
    s.id +
    '/delete" formmethod="post">Delete</button></div></form>'
  );
}

function dashboard(content, flash) {
  const body =
    "<h1>Content dashboard</h1>" +
    "<p class=\"lede admin-lede\">Upload photos, videos, and project files. Changes appear on the public site after you save.</p>" +
    '<section class="admin-section"><h2>Team and supervisors</h2>' +
    content.people.map(personForm).join("") +
    personForm(null) +
    "</section>" +
    '<section class="admin-section"><h2>App, IoT device, architecture</h2>' +
    mediaSlotForm("app_citizen", "Citizen app screenshot", "image/*", content.mediaBySlot.app_citizen) +
    mediaSlotForm(
      "app_municipal",
      "Municipal navigation screenshot",
      "image/*",
      content.mediaBySlot.app_municipal
    ) +
    mediaSlotForm("iot_device", "IoT device photo", "image/*", content.mediaBySlot.iot_device) +
    mediaSlotForm(
      "architecture",
      "Architecture diagram",
      "image/*",
      content.mediaBySlot.architecture
    ) +
    "</section>" +
    '<section class="admin-section"><h2>Gallery photos and videos</h2>' +
    content.gallery.map(galleryForm).join("") +
    galleryForm(null) +
    "</section>" +
    '<section class="admin-section"><h2>Milestones</h2>' +
    content.milestones.map(milestoneForm).join("") +
    "</section>" +
    '<section class="admin-section"><h2>Documents</h2>' +
    content.documents.map(documentForm).join("") +
    '<form class="panel admin-form" method="post" action="/admin/documents" enctype="multipart/form-data">' +
    "<h3>Add document</h3>" +
    '<div class="field"><label>Category</label><select name="category">' +
    ["charter", "proposal", "checklist", "reports", "final", "other"]
      .map(function (c) {
        return option(c, c, "other");
      })
      .join("") +
    "</select></div>" +
    '<div class="field"><label>Title</label><input name="title" required></div>' +
    '<div class="field"><label>Description</label><textarea name="description"></textarea></div>' +
    '<div class="field"><label>Date</label><input name="event_date"></div>' +
    '<div class="field"><label>File</label><input name="file" type="file" accept=".pdf,.doc,.docx,image/*"></div>' +
    '<button class="btn btn--primary" type="submit">Add document</button></form>' +
    "</section>" +
    '<section class="admin-section"><h2>Slides</h2>' +
    content.slides.map(slideForm).join("") +
    '<form class="panel admin-form" method="post" action="/admin/slides" enctype="multipart/form-data">' +
    "<h3>Add slides</h3>" +
    '<div class="field"><label>Title</label><input name="title" required></div>' +
    '<div class="field"><label>Tag</label><input name="tag_label"></div>' +
    '<div class="field"><label>Date</label><input name="event_date"></div>' +
    '<div class="field"><label>Description</label><textarea name="description"></textarea></div>' +
    '<div class="field"><label>File</label><input name="file" type="file" accept=".pdf,.ppt,.pptx,image/*"></div>' +
    '<button class="btn btn--primary" type="submit">Add slides</button></form>' +
    "</section>";

  return layout("Dashboard", body, flash);
}

module.exports = {
  loginPage,
  setupPage,
  dashboard
};
