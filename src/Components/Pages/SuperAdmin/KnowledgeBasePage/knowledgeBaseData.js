export const KNOWLEDGE_CATEGORIES = [
  { value: "Tax Rates", label: "Tax Rates" },
  { value: "Superannuation", label: "Superannuation" },
  { value: "Centrelink", label: "Centrelink" },
  { value: "General", label: "General" },
];

export const CATEGORY_STYLES = {
  Super: {
    background: "#eff6ff", // Blue
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  "Age Pension & Centrelink": {
    background: "#f0fdf4", // Green
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  "Small Business": {
    background: "#f0fdf4", // Green
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  Tax: {
    background: "#f3e8ff", // Purple
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  Investment: {
    background: "#f3e8ff", // Purple
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  "Budgeting & Wealth": {
    background: "#f3e8ff", // Purple
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  "Self-Managed Super (SMSF)": {
    background: "#ecfeff", // Cyan (Related to Super, but distinct)
    color: "#0891b2",
    border: "1px solid #c5f6fa",
  },
  "Mortgages & Debt": {
    background: "#fff7ed", // Orange
    color: "#ea580c",
    border: "1px solid #ffedd5",
  },
  "Buying Your First Home": {
    background: "#fff7ed", // Orange (Grouped with Mortgages)
    color: "#ea580c",
    border: "1px solid #ffedd5",
  },
  Insurance: {
    background: "#fdf2f8", // Pink
    color: "#db2777",
    border: "1px solid #fbcfe8",
  },
  "Aged Care": {
    background: "#fff1f2", // Rose (Related to Pension/Care, softer red)
    color: "#e11d48",
    border: "1px solid #ffe4e6",
  },
  "Redundancy & Leaving Work": {
    background: "#f8fafc", // Slate/Grey
    color: "#475569",
    border: "1px solid #e2e8f0",
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
  Super: "💼",
  "Age Pension & Centrelink": "👵",
  Tax: "📉",
  Investment: "📈",
  "Budgeting & Wealth": "🐷",
  "Small Business": "🏪",
  "Self-Managed Super (SMSF)": "🏛️",
  "Mortgages & Debt": "🏠",
  Insurance: "☂️",
  "Aged Care": "❤️",
  "Buying Your First Home": "🔑",
  "Redundancy & Leaving Work": "🚪",
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

export const SelectedCategory = [
  {
    value: "Super",
    icon: "🏦",
    label: "Super",
    subCategories: [
      { value: "Contributions", label: "Contributions" },
      { value: "Strategy & planning", label: "Strategy & planning" },
      { value: "Pension phase", label: "Pension phase" },
      { value: "Death benefits", label: "Death benefits" },
      { value: "Accumulation phase", label: "Accumulation phase" },
      { value: "Access & withdrawals", label: "Access & withdrawals" },
    ],
  },
  {
    icon: "💰",
    value: "Age Pension & Centrelink",
    label: "Age Pension & Centrelink",
    subCategories: [
      { value: "Age Pension eligibility", label: "Age Pension eligibility" },
      { value: "Age Pension strategy", label: "Age Pension strategy" },
      { value: "Other payments", label: "Other payments" },
      { value: "Health & Medicare", label: "Health & Medicare" },
    ],
  },
  {
    value: "Tax",
    label: "Tax",
    icon: "📊",
    subCategories: [
      { value: "Income tax", label: "Income tax" },
      { value: "Deductions", label: "Deductions" },
      { value: "Capital gains", label: "Capital gains" },
      { value: "Structures", label: "Structures" },
      { value: "EOFY & returns", label: "EOFY & returns" },
    ],
  },
  {
    value: "Investment",
    label: "Investment",
    icon: "📈",
    subCategories: [
      { value: "Portfolio basics", label: "Portfolio basics" },
      { value: "Products", label: "Products" },
      { value: "Strategy & behaviour", label: "Strategy & behaviour" },
      { value: "Tax-efficient investing", label: "Tax-efficient investing" },
    ],
  },
  {
    value: "Budgeting & Wealth",
    label: "Budgeting & Wealth",
    icon: "💼",
    subCategories: [
      {
        value: "Budgeting basics",
        label: "Budgeting basics",
      },
      { value: "Goals & planning", label: "Goals & planning" },
      { value: "Family", label: "Family" },
      { value: "Life events", label: "Life events" },
      { value: "Retirement lifestyle", label: "Retirement lifestyle" },
      { value: "Wealth strategy", label: "Wealth strategy" },
      { value: "Advice & tools", label: "Advice & tools" },
      { value: "Strategic/meta", label: "Strategic/meta" },
    ],
  },
  {
    value: "Small Business",
    label: "Small Business",
    icon: "🏢",
    subCategories: [
      { value: "Structures", label: "Structures" },
      { value: "CGT & exit", label: "CGT & exit" },
      { value: "Tax & distributions", label: "Tax & distributions" },
      { value: "Succession & sale", label: "Succession & sale" },
    ],
  },
  {
    value: "Self-Managed Super (SMSF)",
    label: "Self-Managed Super (SMSF)",
    icon: "📋",
    subCategories: [
      { value: "Setup & compliance", label: "Setup & compliance" },
      { value: "Investments", label: "Investments" },
      { value: "Pensions", label: "Pensions" },
      { value: "Closing & switching", label: "Closing & switching" },
    ],
  },
  {
    value: "Mortgages & Debt",
    label: "Mortgages & Debt",
    icon: "🏠",
    subCategories: [
      { value: "Mortgages", label: "Mortgages" },
      { value: "Credit scores", label: "Credit scores" },
      { value: "Debt strategy", label: "Debt strategy" },
      { value: "Other debt", label: "Other debt" },
    ],
  },
  {
    value: "Insurance",
    label: "Insurance",
    icon: "🛡️",
    subCategories: [
      { value: "Life & TPD", label: "Life & TPD" },
      {
        value: "Income protection & Trauma",
        label: "Income protection & Trauma",
      },
      { value: "General & PHI", label: "General & PHI" },
      { value: "Claims & review", label: "Claims & review" },
    ],
  },
  {
    value: "Aged Care",
    label: "Aged Care",
    icon: "👴",
    subCategories: [
      { value: "Residential care", label: "Residential care" },
      { value: "Home care", label: "Home care" },
      { value: "Planning & decisions", label: "Planning & decisions" },
    ],
  },
  {
    value: "Buying Your First Home",
    label: "Buying Your First Home",
    icon: "🔑",
    subCategories: [
      { value: "Government schemes", label: "Government schemes" },
      { value: "Deposit & borrowing", label: "Deposit & borrowing" },
      { value: "Buy decisions", label: "Buy decisions" },
    ],
  },
  {
    value: "Redundancy & Leaving Work",
    label: "Redundancy & Leaving Work",
    icon: "🚪",
    subCategories: [
      { value: "Redundancy", label: "Redundancy" },
      { value: "Termination payments", label: "Termination payments" },
      { value: "Pre-retirement payouts", label: "Pre-retirement payouts" },
    ],
  },
];
