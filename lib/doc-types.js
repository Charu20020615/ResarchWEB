const DOC_CATEGORIES = [
  {
    key: "taf",
    label: "TAF / Project Charter",
    tag: "TAF",
    hint: "Topic Assessment Form / project charter.",
    addLabel: "Add TAF document"
  },
  {
    key: "proposal",
    label: "Proposal Documents",
    tag: "Proposal",
    hint: "Four proposal documents, one per team member.",
    addLabel: "Add proposal document"
  },
  {
    key: "presentation",
    label: "Presentations",
    tag: "Presentation",
    hint: "Four presentations: proposal, progress 1, progress 2, and final.",
    addLabel: "Add presentation"
  },
  {
    key: "research_paper",
    label: "Research Papers",
    tag: "Research paper",
    hint: "ICAC paper, plus any further conference or journal papers.",
    addLabel: "Add research paper"
  },
  {
    key: "poster",
    label: "Research Poster Presentation",
    tag: "Poster",
    hint: "Research poster files.",
    addLabel: "Add poster"
  },
  {
    key: "checklist",
    label: "Checklist Documents",
    tag: "Checklist",
    hint: "Checklists in PDF, Word, or Excel (.xls, .xlsx).",
    addLabel: "Add checklist"
  },
  {
    key: "thesis",
    label: "Thesis Documents",
    tag: "Thesis",
    hint: "Four thesis documents.",
    addLabel: "Add thesis document"
  },
  {
    key: "final",
    label: "Final Report",
    tag: "Final report",
    hint: "Final reports. Add extra versions if needed.",
    addLabel: "Add final report"
  },
  {
    key: "log",
    label: "Log Entries",
    tag: "Log",
    hint: "Four log-entry PDFs.",
    addLabel: "Add log entry"
  }
];

const DOC_FILE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,image/*";
const DOC_FILE_EXT = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv"];

const SEED_DOCUMENTS = [
  {
    category: "taf",
    title: "TAF document (Project Charter)",
    description: "Topic Assessment Form / project charter for VisionWaste.",
    sort_order: 10
  },
  {
    category: "proposal",
    title: "Proposal document 1",
    description: "Proposal document for member 1 (IT22194312).",
    sort_order: 21
  },
  {
    category: "proposal",
    title: "Proposal document 2",
    description: "Proposal document for member 2 (IT22200006).",
    sort_order: 22
  },
  {
    category: "proposal",
    title: "Proposal document 3",
    description: "Proposal document for member 3 (IT22296214).",
    sort_order: 23
  },
  {
    category: "proposal",
    title: "Proposal document 4",
    description: "Proposal document for member 4 (IT22262318).",
    sort_order: 24
  },
  {
    category: "presentation",
    title: "Proposal Presentation",
    description: "Slides for the project proposal presentation.",
    sort_order: 31
  },
  {
    category: "presentation",
    title: "Progress presentation 1",
    description: "Slides for progress presentation 1.",
    sort_order: 32
  },
  {
    category: "presentation",
    title: "Progress presentation 2",
    description: "Slides for progress presentation 2.",
    sort_order: 33
  },
  {
    category: "presentation",
    title: "Final Presentation",
    description: "Slides for the final presentation.",
    sort_order: 34
  },
  {
    category: "research_paper",
    title: "ICAC research paper",
    description: "ICAC conference research paper. Add further papers in this category.",
    sort_order: 41
  },
  {
    category: "poster",
    title: "Research poster presentation",
    description: "Research poster for the project.",
    sort_order: 51
  },
  {
    category: "checklist",
    title: "Checklist document",
    description: "Project checklist. Excel (.xls, .xlsx) and PDF are accepted.",
    sort_order: 61
  },
  {
    category: "thesis",
    title: "Thesis document 1",
    description: "Thesis document for member 1 (IT22194312).",
    sort_order: 71
  },
  {
    category: "thesis",
    title: "Thesis document 2",
    description: "Thesis document for member 2 (IT22200006).",
    sort_order: 72
  },
  {
    category: "thesis",
    title: "Thesis document 3",
    description: "Thesis document for member 3 (IT22296214).",
    sort_order: 73
  },
  {
    category: "thesis",
    title: "Thesis document 4",
    description: "Thesis document for member 4 (IT22262318).",
    sort_order: 74
  },
  {
    category: "final",
    title: "Final report",
    description: "Main final report. Add extra reports in this category if needed.",
    sort_order: 81
  },
  {
    category: "log",
    title: "Log entry 1",
    description: "Log-entry PDF for member 1 (IT22194312).",
    sort_order: 91
  },
  {
    category: "log",
    title: "Log entry 2",
    description: "Log-entry PDF for member 2 (IT22200006).",
    sort_order: 92
  },
  {
    category: "log",
    title: "Log entry 3",
    description: "Log-entry PDF for member 3 (IT22296214).",
    sort_order: 93
  },
  {
    category: "log",
    title: "Log entry 4",
    description: "Log-entry PDF for member 4 (IT22262318).",
    sort_order: 94
  }
];

function categoryLabel(key) {
  for (let i = 0; i < DOC_CATEGORIES.length; i++) {
    if (DOC_CATEGORIES[i].key === key) return DOC_CATEGORIES[i].tag;
  }
  return key || "Document";
}

function categoryTitle(key) {
  for (let i = 0; i < DOC_CATEGORIES.length; i++) {
    if (DOC_CATEGORIES[i].key === key) return DOC_CATEGORIES[i].label;
  }
  return key || "Documents";
}

function isDocCategory(key) {
  return DOC_CATEGORIES.some(function (category) {
    return category.key === key;
  });
}

function normalizeDocCategory(value) {
  return isDocCategory(value) ? value : "proposal";
}

module.exports = {
  DOC_CATEGORIES,
  DOC_FILE_ACCEPT,
  DOC_FILE_EXT,
  SEED_DOCUMENTS,
  categoryLabel,
  categoryTitle,
  isDocCategory,
  normalizeDocCategory
};
