function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mediaUrl(filePath) {
  if (!filePath) return "";
  return "/uploads/" + encodeURIComponent(filePath.replace(/^.*[\\/]/, ""));
}

function replaceBlock(html, name, content) {
  const re = new RegExp(
    "<!--\\s*CMS:" + name + "\\s*-->[\\s\\S]*?<!--\\s*/CMS:" + name + "\\s*-->",
    "i"
  );
  if (!re.test(html)) return html;
  return html.replace(re, "<!-- CMS:" + name + " -->\n" + content + "\n<!-- /CMS:" + name + " -->");
}

function personCard(person, index) {
  const label =
    person.kind === "co_supervisor"
      ? "Co-supervisor"
      : person.kind === "supervisor"
        ? "Supervisor"
        : "Member " + index;
  const src = person.photo_path
    ? mediaUrl(person.photo_path)
    : person.kind === "member" && index
      ? "assets/team/member-" + index + ".jpg"
      : "";
  const img = src
    ? '<img src="' + escapeHtml(src) + '" alt="Portrait of ' + escapeHtml(person.name) + '" loading="lazy">'
    : "";
  const idChip = person.student_id ? '<span class="person__id">' + escapeHtml(person.student_id) + "</span>" : "";
  const title = person.component_title
    ? '<p class="person__title">' + escapeHtml(person.component_title) + "</p>"
    : "";
  const desc = person.description ? "<p>" + escapeHtml(person.description) + "</p>" : "";
  const email = person.email
    ? '<p><a href="mailto:' + escapeHtml(person.email) + '">' + escapeHtml(person.email) + "</a></p>"
    : "";
  return (
    '<article class="person">' +
    '<div class="person__photo" data-initials="' + escapeHtml(initials(person.name)) + '">' + img + idChip + "</div>" +
    '<div class="person__body">' +
    '<p class="role">' + escapeHtml(label) + "</p>" +
    "<h2>" + escapeHtml(person.name) + "</h2>" +
    title + desc + email +
    "</div></article>"
  );
}

function renderTeam(members) {
  if (!members || !members.length) return null;
  return '<div class="team-grid">\n' + members.map(function (m, i) { return personCard(m, i + 1); }).join("\n") + "\n</div>";
}

function renderSupervisors(supervisors) {
  if (!supervisors || !supervisors.length) {
    return (
      '<article class="panel gap-top">' +
      '<p class="eyebrow">Supervision</p>' +
      "<h2>Supervisor and co-supervisor</h2>" +
      "<p>Names and designations have not been supplied yet. Add the approved details here before the site is published.</p>" +
      "</article>"
    );
  }
  return (
    '<div class="team-grid gap-top">' +
    supervisors
      .map(function (person) {
        return personCard(person, 0);
      })
      .join("\n") +
    "</div>"
  );
}

function renderArchitecture(media) {
  if (!media || !media.file_path) return "";
  return (
    '<figure class="media-figure">' +
    '<img src="' +
    escapeHtml(mediaUrl(media.file_path)) +
    '" alt="' +
    escapeHtml(media.title || "Architecture diagram") +
    '">' +
    ((media.description || media.caption) ? "<figcaption>" + escapeHtml(media.description || media.caption) + "</figcaption>" : "") +
    "</figure>"
  );
}

function renderAppDevice(content) {
  const citizen = content.mediaBySlot.app_citizen;
  const municipal = content.mediaBySlot.app_municipal;
  const device = content.mediaBySlot.iot_device;
  const gallery = content.gallery || [];
  const hasApp =
    (citizen && (citizen.file_path || citizen.description)) ||
    (municipal && (municipal.file_path || municipal.description));
  const hasDevice = device && (device.file_path || device.caption || device.description);
  const hasGallery = gallery.length > 0;
  if (!hasApp && !hasDevice && !hasGallery) return "";

  let html = "";
  if (hasApp || hasDevice) {
    html +=
      '<section class="section section--tight">' +
      '<div class="container">' +
      '<div class="section-head"><div>' +
      '<p class="eyebrow">Product</p>' +
      "<h2>App and edge device</h2>" +
      "</div>" +
      "<p>The VisionWaste app helps citizens find nearby empty bins and helps municipal staff navigate to a device.</p>" +
      "</div>" +
      '<div class="product-grid">';

    if (hasApp) {
      html += mediaCard(
        "Citizen app",
        citizen && citizen.description
          ? citizen.description
          : "Find nearby empty bins from the phone.",
        citizen
      );
      html += mediaCard(
        "Municipal navigation",
        municipal && municipal.description
          ? municipal.description
          : "Navigate collection staff to a monitored device.",
        municipal
      );
    }
    if (hasDevice) {
      html += mediaCard(
        device.title && device.title !== "iot_device" ? device.title : "IoT device",
        device.description || device.caption || "Edge camera and sensing hardware at the bin.",
        device
      );
    }
    html += "</div></div></section>";
  }

  if (hasGallery) {
    html +=
      '<section class="section section--tight">' +
      '<div class="container">' +
      '<div class="section-head"><div>' +
      '<p class="eyebrow">Gallery</p>' +
      "<h2>Photos and videos</h2>" +
      "</div></div>" +
      '<div class="gallery-grid">' +
      gallery
        .map(function (item) {
          const isVideo = String(item.mime_type || "").startsWith("video/");
          const src = escapeHtml(mediaUrl(item.file_path));
          const media = isVideo
            ? '<video controls preload="metadata" src="' + src + '"></video>'
            : '<img src="' + src + '" alt="' + escapeHtml(item.title || "Gallery item") + '">';
          return (
            '<figure class="gallery-item">' +
            media +
            "<figcaption><strong>" +
            escapeHtml(item.title || "") +
            "</strong>" +
            (item.caption ? "<span>" + escapeHtml(item.caption) + "</span>" : "") +
            "</figcaption></figure>"
          );
        })
        .join("") +
      "</div></div></section>";
  }

  return html;
}

function mediaCard(title, description, media) {
  const img =
    media && media.file_path
      ? '<img src="' +
        escapeHtml(mediaUrl(media.file_path)) +
        '" alt="' +
        escapeHtml(title) +
        '">'
      : '<div class="media-placeholder">Photo coming soon</div>';
  return (
    '<article class="panel product-card">' +
    '<div class="product-media">' +
    img +
    "</div>" +
    "<h3>" +
    escapeHtml(title) +
    "</h3>" +
    "<p>" +
    escapeHtml(description || "") +
    "</p>" +
    "</article>"
  );
}

function renderMilestones(rows) {
  if (!rows || !rows.length) return null;
  return rows
    .map(function (m) {
      const hasFile = Boolean(m.file_path);
      const status = m.status_label || (hasFile ? "Available" : "Not recorded");
      const tagClass = m.status_label === "Completed" || (hasFile && !m.status_label) ? "tag tag--ok" : "tag tag--wait";
      const fileLine = hasFile
        ? '<li><strong>Linked file</strong> <a href="' +
          escapeHtml(mediaUrl(m.file_path)) +
          '" target="_blank" rel="noopener">' +
          escapeHtml(m.file_name || "Download") +
          "</a></li>"
        : "<li><strong>Linked file</strong> No document or slides are linked yet</li>";
      return (
        '<article class="milestone" id="' +
        escapeHtml(m.slug) +
        '" data-milestone="' +
        escapeHtml(m.slug) +
        '">' +
        '<div class="mile-top"><h2>' +
        escapeHtml(m.title) +
        '</h2><span class="' +
        tagClass +
        '">' +
        escapeHtml(status) +
        "</span></div>" +
        "<p>" +
        escapeHtml(m.description || "Details will be added here.") +
        "</p>" +
        '<ul class="meta-list">' +
        "<li><strong>Date</strong> " +
        escapeHtml(m.event_date || "Not recorded") +
        "</li>" +
        "<li><strong>Marks allocated</strong> " +
        escapeHtml(m.marks || "Not recorded") +
        "</li>" +
        fileLine +
        "</ul></article>"
      );
    })
    .join("\n");
}

function renderDocuments(rows) {
  if (!rows || !rows.length) return null;
  return rows
    .map(function (d) {
      const hasFile = Boolean(d.file_path);
      const search =
        (d.title + " " + (d.description || "") + " " + d.category).toLowerCase();
      const tagClass = hasFile ? "tag tag--ok" : "tag tag--wait";
      const status = hasFile ? "Available" : "Not uploaded";
      const actions = hasFile
        ? '<div class="doc-actions">' +
          '<a class="btn btn--primary" href="' +
          escapeHtml(mediaUrl(d.file_path)) +
          '" target="_blank" rel="noopener">View</a>' +
          '<a class="btn btn--ghost" href="' +
          escapeHtml(mediaUrl(d.file_path)) +
          '" download>Download</a></div>'
        : "";
      return (
        '<article class="doc" data-doc="' +
        escapeHtml(search) +
        '" data-category="' +
        escapeHtml(d.category) +
        '">' +
        '<div class="doc-top"><span class="tag">' +
        escapeHtml(d.category) +
        '</span><span class="' +
        tagClass +
        '">' +
        status +
        "</span></div>" +
        "<h2>" +
        escapeHtml(d.title) +
        "</h2>" +
        "<p>" +
        escapeHtml(d.description || "") +
        "</p>" +
        '<ul class="meta-list">' +
        "<li><strong>Date</strong> " +
        escapeHtml(d.event_date || "Not recorded") +
        "</li>" +
        "<li><strong>File</strong> " +
        escapeHtml(hasFile ? d.file_name || "Uploaded" : "Not available") +
        "</li></ul>" +
        actions +
        "</article>"
      );
    })
    .join("\n");
}

function renderSlides(rows) {
  if (!rows || !rows.length) return null;
  return rows
    .map(function (s) {
      const hasFile = Boolean(s.file_path);
      const tagClass = hasFile ? "tag tag--ok" : "tag tag--wait";
      const status = hasFile ? "Available" : "Not uploaded";
      const actions = hasFile
        ? '<div class="doc-actions">' +
          '<a class="btn btn--primary" href="' +
          escapeHtml(mediaUrl(s.file_path)) +
          '" target="_blank" rel="noopener">View</a>' +
          '<a class="btn btn--ghost" href="' +
          escapeHtml(mediaUrl(s.file_path)) +
          '" download>Download</a></div>'
        : "";
      return (
        '<article class="slide" data-slide="' +
        escapeHtml((s.title || "").toLowerCase()) +
        '">' +
        '<div class="slide-top"><span class="tag">' +
        escapeHtml(s.tag_label || "Slides") +
        '</span><span class="' +
        tagClass +
        '">' +
        status +
        "</span></div>" +
        "<h2>" +
        escapeHtml(s.title) +
        "</h2>" +
        "<p>" +
        escapeHtml(s.description || "Date and file are not recorded.") +
        "</p>" +
        '<ul class="meta-list"><li><strong>Date</strong> ' +
        escapeHtml(s.event_date || "Not recorded") +
        "</li><li><strong>File</strong> " +
        escapeHtml(hasFile ? s.file_name || "Uploaded" : "Not available") +
        "</li></ul>" +
        actions +
        "</article>"
      );
    })
    .join("\n");
}

function renderContactOptions(members) {
  if (!members || !members.length) return null;
  return (
    '<option value="">Select a team member</option>' +
    members
      .filter(function (m) { return m.email; })
      .map(function (m) {
        return (
          '<option value="' +
          escapeHtml(m.email) +
          '">' +
          escapeHtml(m.name) +
          "</option>"
        );
      })
      .join("")
  );
}

function renderContactList(members) {
  if (!members || !members.length) return null;
  return (
    '<ul class="meta-list">' +
    members
      .map(function (m) {
        return (
          "<li><strong>" +
          escapeHtml(m.name) +
          "</strong><br>" +
          (m.email
            ? '<a href="mailto:' +
              escapeHtml(m.email) +
              '">' +
              escapeHtml(m.email) +
              "</a>"
            : "Not recorded") +
          "</li>"
        );
      })
      .join("") +
    '<li><strong>Phone</strong><br>Not recorded</li></ul>'
  );
}

function applyContent(html, page, content) {
  if (!content) return html;
  let out = html;

  if (page === "about.html") {
    const team = renderTeam(content.members);
    if (team) out = replaceBlock(out, "team", team);
    out = replaceBlock(out, "supervisors", renderSupervisors(content.supervisors));
  }

  if (page === "index.html") {
    out = replaceBlock(out, "product", renderAppDevice(content));
  }

  if (page === "domain.html") {
    out = replaceBlock(
      out,
      "architecture",
      renderArchitecture(content.mediaBySlot.architecture)
    );
  }

  if (page === "milestones.html") {
    const body = renderMilestones(content.milestones);
    if (body) out = replaceBlock(out, "milestones", body);
  }

  if (page === "documents.html") {
    const body = renderDocuments(content.documents);
    if (body) out = replaceBlock(out, "documents", body);
  }

  if (page === "slides.html") {
    const body = renderSlides(content.slides);
    if (body) out = replaceBlock(out, "slides", body);
  }

  if (page === "contact.html") {
    const opts = renderContactOptions(content.members);
    const list = renderContactList(content.members);
    if (opts) out = replaceBlock(out, "contact-options", opts);
    if (list) out = replaceBlock(out, "contact-list", list);
  }

  return out;
}

module.exports = {
  escapeHtml,
  mediaUrl,
  applyContent,
  initials
};
