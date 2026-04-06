// Central registry for all /user/* routes used in the app.
// Fill in the `component` fields as you implement actual pages.

import { Spin } from "antd";
import { lazy, Suspense } from "react";
import HouseholdTable from "../Pages/User/Clients/HouseholdTable";
import MyClients from "../Pages/User/Clients/MyClients";
import DashboardPage from "../Pages/User/Dashboard/DashboardPage";
import CDFProspects from "../Pages/User/Prospects/CDFProspects";
import MyTeam from "../Pages/User/MyTeam/MyTeam";

/** Lazy so `PersonalDetails` can import route helpers from this file without a circular dependency. */
const PersonalDetailsLazy = lazy(() =>
  import("../Pages/User/Discovery/PersonalDetails/PersonalDetails.jsx").then(
    (m) => ({ default: m.PersonalDetails }),
  ),
);

const personalDetailsElement = (
  <Suspense
    fallback={
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    }
  >
    <PersonalDetailsLazy />
  </Suspense>
);

export const withSpacing = ({
  icon,
  label,
  marginLeft = 0,
  fontSize = "12px",
  color = "inherit",
  fontWeight = "400",
}) => ({
  label: (
    <span
      style={{
        marginLeft: marginLeft + "px",
        fontWeight: fontWeight,
        fontSize: fontSize,
        color: color,
      }}
    >
      <span>{icon}</span> {label}
    </span>
  ),
});

export const userRoutes = [
  {
    key: "/user",
    path: "/",
    ...withSpacing({ icon: "🏠", label: "Dashboard", fontSize: "13px" }),
    component: <DashboardPage />,
    condition: () => true,
  },
  {
    key: "/user/clients",
    path: "/clients",
    ...withSpacing({ icon: "👥", label: "My Clients", fontSize: "13px" }),
    component: <MyClients />,
    condition: () => true,
  },
  {
    key: "/user/prospects",
    path: "/prospects",
    ...withSpacing({ icon: "📊", label: "Prospects", fontSize: "13px" }),
    component: <CDFProspects />,
    condition: () => true,
  },
  {
    key: "/user/my-team",
    path: "/my-team",
    ...withSpacing({ icon: "👤", label: "My Team", fontSize: "13px" }),
    component: <MyTeam />,
    condition: () => true,
  },
];

/**
 * Discovery section: `relativePath` is the segment under `/user/discovery/:segment`.
 * `stepTitle` / `stepIcon` drive DiscoveryFlowLayout heading + stepper (keep in sync with labels).
 * `showInDiscoveryStepper: false` — show in sidebar only, not in the horizontal stepper.
 */
export const discoveryRoutes = [
  {
    key: "/user/discovery/client-summary",
    relativePath: "client-summary",
    stepTitle: "Client Summary",
    stepIcon: "📄",
    path: "/user/discovery/client-summary",
    showInDiscoveryStepper: false,
    ...withSpacing({
      icon: "📄",
      label: "Client Summary",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/personal-details",
    relativePath: "personal-details",
    stepTitle: "Personal Details",
    stepIcon: "👤",
    path: "/user/discovery/personal-details",
    ...withSpacing({
      icon: "👤",
      label: "Personal Details",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: personalDetailsElement,
    condition: () => true,
  },
  {
    key: "/user/discovery/income-expenses",
    relativePath: "income-expenses",
    stepTitle: "Income & Expenses",
    stepIcon: "💲",
    path: "/user/discovery/income-expenses",
    ...withSpacing({
      icon: "💲",
      label: "Income & Expenses",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/assets-debt",
    relativePath: "assets-debt",
    stepTitle: "Assets & Debt",
    stepIcon: "🏡",
    path: "/user/discovery/assets-debt",
    ...withSpacing({
      icon: "🏡",
      label: "Assets & Debt",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/financial-investments",
    relativePath: "financial-investments",
    stepTitle: "Financial Investments",
    stepIcon: "📈",
    path: "/user/discovery/financial-investments",
    ...withSpacing({
      icon: "📈",
      label: "Financial Investments",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/estate-planning",
    relativePath: "estate-planning",
    stepTitle: "Estate Planning",
    stepIcon: "📋",
    path: "/user/discovery/estate-planning",
    ...withSpacing({
      icon: "📋",
      label: "Estate Planning",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/personal-insurance",
    relativePath: "personal-insurance",
    stepTitle: "Personal Insurance",
    stepIcon: "🛡️",
    path: "/user/discovery/personal-insurance",
    ...withSpacing({
      icon: "🛡️",
      label: " Personal Insurance",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: (q) =>
      String(q?.personalInsuranceTab ?? "").toLowerCase() === "yes",
  },
  {
    key: "/user/discovery/business-entities",
    relativePath: "business-entities",
    stepTitle: "Business Entities",
    stepIcon: "🏢",
    path: "/user/discovery/business-entities",
    ...withSpacing({
      icon: "🏢",
      label: "Business Entities",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: (q) => {
      return (
        String(q?.BusinessAsCompanyStructure ?? "").toLowerCase() === "yes" ||
        String(q?.BusinessAsTrusts ?? "").toLowerCase() === "yes"
      );
    },
  },
  {
    key: "/user/discovery/smsf",
    relativePath: "smsf",
    stepTitle: "SMSF",
    stepIcon: "🔐",
    path: "/user/discovery/smsf",
    ...withSpacing({
      icon: "🔐",
      label: " SMSF",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: (q) =>
      String(q?.SMSFManagedFundsTab ?? "").toLowerCase() === "yes",
  },
  {
    key: "/user/discovery/investment-trust",
    relativePath: "investment-trust",
    stepTitle: "Investment Trust",
    stepIcon: "📊",
    path: "/user/discovery/investment-trust",
    ...withSpacing({
      icon: "📊",
      label: " Investment Trust",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: (q) =>
      String(q?.businessAsInvestmentTab ?? "").toLowerCase() === "yes",
  },
  {
    key: "/user/discovery/goals-objectives",
    relativePath: "goals-objectives",
    stepTitle: "Goals & Objectives",
    stepIcon: "🎯",
    path: "/user/discovery/goals-objectives",
    ...withSpacing({
      icon: "🎯",
      label: "Goals & Objectives",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/risk-profile",
    relativePath: "risk-profile",
    stepTitle: "Risk Profile",
    stepIcon: "🌐",
    path: "/user/discovery/risk-profile",
    ...withSpacing({
      icon: "🌐",
      label: "Risk Profile",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/add-section",
    relativePath: "add-section",
    stepTitle: "Add Section",
    stepIcon: "＋",
    path: "/user/discovery/add-section",
    /** No page route — opens `AddDiscoverySectionsModal` via Jotai (see UserLayout / DiscoveryFlowLayout). */
    modalOnly: true,
    ...withSpacing({
      icon: "＋",
      label: "Add Section",
      fontSize: "12px",
      color: "rgb(34, 197, 94)",
      fontWeight: "700",
    }),
    component: null,
    condition: () => true,
  },
];

/** Menu / stepper key for Add Section (opens modal instead of navigating). */
export const DISCOVERY_ADD_SECTION_KEY = "/user/discovery/add-section";

/** Routes shown in nav + stepper for the current discovery questionnaire state. */
export function getVisibleDiscoveryRoutes(questions = {}) {
  return discoveryRoutes.filter((r) => r.condition?.(questions) !== false);
}

/** Routes that appear in DiscoveryFlowLayout’s horizontal stepper (sidebar can list more). */
export function getDiscoveryStepperRoutes(questions = {}) {
  return getVisibleDiscoveryRoutes(questions).filter(
    (r) => r.showInDiscoveryStepper !== false,
  );
}

export function pathMatchesDiscoveryRoute(pathname, route) {
  if (!route?.relativePath) return false;
  const p = pathname.replace(/\/$/, "");
  return (
    p === route.key ||
    p.endsWith(`/user/discovery/${route.relativePath}`) ||
    p.endsWith(`/${route.relativePath}`)
  );
}

export function matchDiscoveryRoute(pathname, questions) {
  return getVisibleDiscoveryRoutes(questions).find((r) =>
    pathMatchesDiscoveryRoute(pathname, r),
  );
}

export function getNextDiscoveryNavKey(pathname, questions) {
  const visible = getVisibleDiscoveryRoutes(questions).filter(
    (r) => !r.modalOnly,
  );
  const idx = visible.findIndex((r) => pathMatchesDiscoveryRoute(pathname, r));
  if (idx >= 0 && idx < visible.length - 1) return visible[idx + 1].key;
  return null;
}

export const strategyRoutes = [
  {
    key: "/strategy/denaro-deck",
    path: "/strategy/denaro-deck",
    ...withSpacing({
      icon: "🃏",
      label: "Denaro Deck",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/scenarios",
    path: "/strategy/scenarios",
    ...withSpacing({
      icon: "📍",
      label: "Scenarios",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/inputs",
    path: "/strategy/inputs",
    ...withSpacing({
      icon: "⬛",
      label: "Inputs",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/cashflow",
    path: "/strategy/cashflow",
    ...withSpacing({
      icon: "$",
      label: "Cashflow",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/networth",
    path: "/strategy/networth",
    ...withSpacing({
      icon: "↗",
      label: "Networth",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/reports",
    path: "/strategy/reports",
    ...withSpacing({
      icon: "📄",
      label: "Reports",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/compare",
    path: "/strategy/compare",
    ...withSpacing({
      icon: "⚖️",
      label: "Compare",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/advice",
    path: "/strategy/advice",
    ...withSpacing({
      icon: "✍️",
      label: "Advice",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
];

/** Flat routes rendered inside UserLayout (Discovery uses nested routes + DiscoveryFlowLayout). */
export const allUserRoutes = [...userRoutes, ...strategyRoutes];
