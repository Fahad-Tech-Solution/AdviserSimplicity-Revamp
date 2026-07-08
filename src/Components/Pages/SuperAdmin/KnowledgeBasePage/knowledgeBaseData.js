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

export const SelectedCategory = [
  {
    value: "Super",
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
    subCategories: [
      { value: "Residential care", label: "Residential care" },
      { value: "Home care", label: "Home care" },
      { value: "Planning & decisions", label: "Planning & decisions" },
    ],
  },
  {
    value: "Buying Your First Home",
    label: "Buying Your First Home",
    subCategories: [
      { value: "Government schemes", label: "Government schemes" },
      { value: "Deposit & borrowing", label: "Deposit & borrowing" },
      { value: "Buy decisions", label: "Buy decisions" },
    ],
  },
  {
    value: "Redundancy & Leaving Work",
    label: "Redundancy & Leaving Work",
    subCategories: [
      { value: "Redundancy", label: "Redundancy" },
      { value: "Termination payments", label: "Termination payments" },
      { value: "Pre-retirement payouts", label: "Pre-retirement payouts" },
    ],
  },
];
