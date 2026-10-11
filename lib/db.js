const { Pool } = require("pg");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL || "";
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.RAILWAY_ENVIRONMENT ? "/data/uploads" : path.join(__dirname, "..", "data", "uploads"));

let pool = null;
let ready = false;
let lastError = null;

const SEED_MEMBERS = [
  {
    kind: "member",
    name: "Ranaweera K U I",
    student_id: "IT22194312",
    role_label: "Member 1 · IT22194312",
    email: "ranaweeraimashi880@gmail.com",
    component_title: "Vision-based hygienic risk assessment and species-aware animal deterrent.",
    description:
      "A Teachable Machine binary classifier separates organic from non-organic waste. Organic content, temperature, and time combine into a hygienic risk score. A second classifier recognises stray dogs, cats, and cattle, and a graduated, species-specific ultrasonic deterrent (18–25 kHz) runs only when risk is high, so animals do not habituate and scatter the waste.",
    sort_order: 1
  },
  {
    kind: "member",
    name: "Edirisinghe E A",
    student_id: "IT22200006",
    role_label: "Member 2 · IT22200006",
    email: "charukasedirisinghe@gmail.com",
    component_title: "Motion-triggered camera-based fill level detection.",
    description:
      "A PIR motion sensor triggers image capture, and a TFLite edge model trained on 500+ augmented images across several fill levels classifies the result. This removes the need for continuous ultrasonic sensing, cutting power use and data volume while giving finer-grained fill insight.",
    sort_order: 2
  },
  {
    kind: "member",
    name: "Herath H M A M",
    student_id: "IT22296214",
    role_label: "Member 3 · IT22296214",
    email: "it22296214@my.sliit.lk",
    component_title: "Event-aware waste demand forecasting.",
    description:
      "A spatio-temporal model combines calendar events (Poya days, school terms, Fridays) with location profiles (temples, schools) to predict waste spikes. A decision-support interface turns the forecast into advance alerts, so municipalities can adjust schedules or place temporary bins instead of following static routes.",
    sort_order: 3
  },
  {
    kind: "member",
    name: "Ranasinghe M J N",
    student_id: "IT22262318",
    role_label: "Member 4 · IT22262318",
    email: "janinethminaa2002@gmail.com",
    component_title: "Motion-triggered improper disposal and litter severity detection.",
    description:
      "Existing systems ignore the area outside the bin. A Teachable Machine image classifier, trained on clean, moderate, and severe litter, identifies and quantifies improper disposal in the zones around the bin.",
    sort_order: 4
  }
];

const SEED_MILESTONES = [
  { slug: "proposal", title: "Project Proposal", sort_order: 1 },
  { slug: "progress-1", title: "Progress Presentation 1", sort_order: 2 },
  { slug: "progress-2", title: "Progress Presentation 2", sort_order: 3 },
  { slug: "final", title: "Final Assessment", sort_order: 4 },
  { slug: "viva", title: "Viva", sort_order: 5 }
];

const SEED_DOCS = [
  { category: "charter", title: "Project charter", description: "One charter document is expected.", sort_order: 1 },
  { category: "proposal", title: "Proposal document", description: "The written proposal for the research project.", sort_order: 2 },
  { category: "checklist", title: "Checklist documents", description: "Checklist files for the research project.", sort_order: 3 },
  { category: "reports", title: "Research and progress reports", description: "Progress report files.", sort_order: 4 },
  { category: "final", title: "Final documentation", description: "Main final document and related final files.", sort_order: 5 },
  {
    category: "other",
    title: "VisionWaste system overview",
    description: "Technical overview of capture, models, risk rules, hardware, API, and clients.",
    event_date: "30 August 2026",
    sort_order: 6
  }
];

const SEED_SLIDES = [
  { slug: "proposal", title: "Proposal presentation", tag_label: "Proposal", sort_order: 1 },
  { slug: "progress-1", title: "Progress presentation 1", tag_label: "Progress 1", sort_order: 2 },
  { slug: "progress-2", title: "Progress presentation 2", tag_label: "Progress 2", sort_order: 3 },
  { slug: "final", title: "Final presentation", tag_label: "Final", sort_order: 4 }
];

function isConfigured() {
  return Boolean(DATABASE_URL);
}

function isReady() {
  return ready;
}

function getUploadDir() {
  return UPLOAD_DIR;
}

function getLastError() {
  return lastError;
}

async function query(text, params) {
  if (!pool) throw new Error("Database is not configured.");
  return pool.query(text, params);
}

async function init() {
  if (!DATABASE_URL) {
    ready = false;
    lastError = "DATABASE_URL is not set.";
    return { ok: false, reason: lastError };
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false }
  });

  try {
    await pool.query("SELECT 1");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('member', 'supervisor', 'co_supervisor')),
        name TEXT NOT NULL,
        student_id TEXT DEFAULT '',
        role_label TEXT DEFAULT '',
        email TEXT DEFAULT '',
        component_title TEXT DEFAULT '',
        description TEXT DEFAULT '',
        photo_path TEXT DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_media (
        id SERIAL PRIMARY KEY,
        slot TEXT NOT NULL UNIQUE,
        title TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        description TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        mime_type TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gallery_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        caption TEXT DEFAULT '',
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        event_date TEXT DEFAULT '',
        marks TEXT DEFAULT '',
        completion TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        status_label TEXT DEFAULT '',
        sort_order INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        event_date TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        sort_order INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS slides (
        id SERIAL PRIMARY KEY,
        slug TEXT DEFAULT '',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        event_date TEXT DEFAULT '',
        tag_label TEXT DEFAULT '',
        file_path TEXT DEFAULT '',
        file_name TEXT DEFAULT '',
        sort_order INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await seed();
    ready = true;
    lastError = null;
    return { ok: true };
  } catch (error) {
    ready = false;
    lastError = error.message || String(error);
    console.error("Database init failed:", lastError);
    return { ok: false, reason: lastError };
  }
}

async function seed() {
  const peopleCount = await pool.query("SELECT COUNT(*)::int AS c FROM people");
  if (peopleCount.rows[0].c === 0) {
    for (const member of SEED_MEMBERS) {
      await pool.query(
        `INSERT INTO people (kind, name, student_id, role_label, email, component_title, description, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          member.kind,
          member.name,
          member.student_id,
          member.role_label,
          member.email,
          member.component_title,
          member.description,
          member.sort_order
        ]
      );
    }
  }

  for (const milestone of SEED_MILESTONES) {
    await pool.query(
      `INSERT INTO milestones (slug, title, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [milestone.slug, milestone.title, milestone.sort_order]
    );
  }

  const docCount = await pool.query("SELECT COUNT(*)::int AS c FROM documents");
  if (docCount.rows[0].c === 0) {
    for (const doc of SEED_DOCS) {
      await pool.query(
        `INSERT INTO documents (category, title, description, event_date, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [doc.category, doc.title, doc.description || "", doc.event_date || "", doc.sort_order]
      );
    }
  }

  const slideCount = await pool.query("SELECT COUNT(*)::int AS c FROM slides");
  if (slideCount.rows[0].c === 0) {
    for (const slide of SEED_SLIDES) {
      await pool.query(
        `INSERT INTO slides (slug, title, tag_label, sort_order)
         VALUES ($1,$2,$3,$4)`,
        [slide.slug, slide.title, slide.tag_label, slide.sort_order]
      );
    }
  }

  const slots = ["architecture", "iot_device", "app_citizen", "app_municipal"];
  for (const slot of slots) {
    await pool.query(
      `INSERT INTO site_media (slot, title) VALUES ($1, $2)
       ON CONFLICT (slot) DO NOTHING`,
      [slot, slot]
    );
  }
}

async function getAllContent() {
  if (!ready) return null;
  const [people, media, gallery, milestones, documents, slides] = await Promise.all([
    query("SELECT * FROM people ORDER BY sort_order ASC, id ASC"),
    query("SELECT * FROM site_media ORDER BY slot ASC"),
    query("SELECT * FROM gallery_items ORDER BY sort_order ASC, id ASC"),
    query("SELECT * FROM milestones ORDER BY sort_order ASC, id ASC"),
    query("SELECT * FROM documents ORDER BY sort_order ASC, id ASC"),
    query("SELECT * FROM slides ORDER BY sort_order ASC, id ASC")
  ]);
  const mediaBySlot = {};
  for (const row of media.rows) mediaBySlot[row.slot] = row;
  return {
    people: people.rows,
    members: people.rows.filter(function (p) { return p.kind === "member"; }),
    supervisors: people.rows.filter(function (p) {
      return p.kind === "supervisor" || p.kind === "co_supervisor";
    }),
    mediaBySlot,
    gallery: gallery.rows,
    milestones: milestones.rows,
    documents: documents.rows,
    slides: slides.rows
  };
}

module.exports = {
  init,
  query,
  isConfigured,
  isReady,
  getUploadDir,
  getLastError,
  getAllContent,
  SEED_MEMBERS
};
