export const KNOWLEDGE_CATEGORIES = [
  { value: "Tax Rates", label: "Tax Rates" },
  { value: "Superannuation", label: "Superannuation" },
  { value: "Centrelink", label: "Centrelink" },
  { value: "General", label: "General" },
];

export const CATEGORY_STYLES = {
  "Tax Rates": {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  Superannuation: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  Centrelink: {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  General: {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #e5e7eb",
  },
};

export const CATEGORY_ICONS = {
  "Tax Rates": "📄",
  Superannuation: "💰",
  Centrelink: "🛡️",
  General: "📋",
};

export const INITIAL_KNOWLEDGE_ENTRIES = [
  {
    _id: "kb-1",
    title: "Marginal Tax Rates 2024-25",
    category: "Tax Rates",
    source: "ATO Treasury PDF",
    lastUpdated: "2024-01-12",
    content: "",
  },
  {
    _id: "kb-2",
    title: "Superannuation Transfer Balance Cap 2024-25",
    category: "Superannuation",
    source: "Services Australia PDF",
    lastUpdated: "2024-01-08",
    content: "",
  },
  {
    _id: "kb-3",
    title: "Centrelink FTB Income Test 2024-25",
    category: "Centrelink",
    source: "Manual entry",
    lastUpdated: "2024-01-15",
    content: "",
  },
  {
    _id: "kb-4",
    title: "Medicare Levy Surcharge Thresholds",
    category: "Tax Rates",
    source: "ATO Treasury PDF",
    lastUpdated: "2024-01-10",
    content: "",
  },
  {
    _id: "kb-5",
    title: "Concessional Contribution Caps",
    category: "Superannuation",
    source: "Manual entry",
    lastUpdated: "2024-01-06",
    content: "",
  },
  {
    _id: "kb-6",
    title: "Age Pension Asset Test Limits",
    category: "Centrelink",
    source: "Services Australia PDF",
    lastUpdated: "2024-01-04",
    content: "",
  },
  {
    _id: "kb-7",
    title: "Company Tax Rate 2024-25",
    category: "Tax Rates",
    source: "ATO Treasury PDF",
    lastUpdated: "2024-01-02",
    content: "",
  },
];
