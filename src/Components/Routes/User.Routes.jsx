// Central registry for all /user/* routes used in the app.
// Fill in the `component` fields as you implement actual pages.

import HouseholdTable from "../Pages/User/Clients/HouseholdTable";
import MyClients from "../Pages/User/Clients/MyClients";
import DashboardPage from "../Pages/User/Dashboard/DashboardPage";
import CDFProspects from "../Pages/User/Prospects/CDFProspects";
import MyTeam from "../Pages/User/MyTeam/MyTeam";

export const withSpacing = (icon, label, marginLeft = 0) => ({
  label: (
    <span
      style={{
        marginLeft: marginLeft + "px",
        fontWeight: "400",
        fontSize: "13px",
        color: label == "Add Section" ? "#22c55e" : "inherit",
        // color: "red",
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
    ...withSpacing("🏠", "Dashboard"),
    component: <DashboardPage />,
    condition: () => true,
  },
  {
    key: "/user/clients",
    path: "/clients",
    ...withSpacing("👥", "My Clients"),
    component: <MyClients />,
    condition: () => true,
  },
  {
    key: "/user/prospects",
    path: "/prospects",
    ...withSpacing("📊", "Prospects"),
    component: <CDFProspects />,
    condition: () => true,
  },
  {
    key: "/user/my-team",
    path: "/my-team",
    ...withSpacing("👤", "My Team"),
    component: <MyTeam />,
    condition: () => true,
  },
];

export const discoveryRoutes = [
  {
    key: "/discovery/client-summary",
    path: "/discovery/client-summary",
    ...withSpacing("📄", "Client Summary"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/personal-details",
    path: "/discovery/personal-details",
    ...withSpacing("👤", "Personal Details"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/income-expenses",
    path: "/discovery/income-expenses",
    ...withSpacing("💲", "Income & Expenses"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/assets-debt",
    path: "/discovery/assets-debt",
    ...withSpacing("🏡", "Assets & Debt"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/financial-investments",
    path: "/discovery/financial-investments",
    ...withSpacing("📈", "Financial Investments"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/estate-planning",
    path: "/discovery/estate-planning",
    ...withSpacing("📋", "Estate Planning"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/goals-objectives",
    path: "/discovery/goals-objectives",
    ...withSpacing("🎯", "Goals & Objectives"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/risk-profile",
    path: "/discovery/risk-profile",
    ...withSpacing("🌐", "Risk Profile"),
    component: null,
    condition: () => true,
  },
  {
    key: "/discovery/add-section",
    path: "/discovery/add-section",
    ...withSpacing("＋", "Add Section"),
    component: null,
    condition: () => true,
  },
];

export const strategyRoutes = [
  {
    key: "/strategy/denaro-deck",
    path: "/strategy/denaro-deck",
    ...withSpacing("🃏", "Denaro Deck"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/scenarios",
    path: "/strategy/scenarios",
    ...withSpacing("📍", "Scenarios"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/inputs",
    path: "/strategy/inputs",
    ...withSpacing("⬛", "Inputs"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/cashflow",
    path: "/strategy/cashflow",
    ...withSpacing("$", "Cashflow"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/networth",
    path: "/strategy/networth",
    ...withSpacing("↗", "Networth"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/reports",
    path: "/strategy/reports",
    ...withSpacing("📄", "Reports"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/compare",
    path: "/strategy/compare",
    ...withSpacing("⚖️", "Compare"),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/advice",
    path: "/strategy/advice",
    ...withSpacing("✍️", "Advice"),
    component: null,
    condition: () => true,
  },
];

export const allUserRoutes = [
  ...userRoutes,
  ...discoveryRoutes,
  ...strategyRoutes,
];
