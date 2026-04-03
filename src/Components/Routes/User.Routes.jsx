// Central registry for all /user/* routes used in the app.
// Fill in the `component` fields as you implement actual pages.

import HouseholdTable from "../Pages/User/Clients/HouseholdTable";
import MyClients from "../Pages/User/Clients/MyClients";
import DashboardPage from "../Pages/User/Dashboard/DashboardPage";
import CDFProspects from "../Pages/User/Prospects/CDFProspects";
import MyTeam from "../Pages/User/MyTeam/MyTeam";
import { PersonalDetails } from "../Pages/User/Discovery/PersonalDetails/PersonalDetails";

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

export const discoveryRoutes = [
  {
    key: "/user/discovery/client-summary",
    path: "/user/discovery/client-summary",
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
    path: "/discovery/personal-details",
    ...withSpacing({
      icon: "👤",
      label: "Personal Details",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <PersonalDetails />,
    condition: () => true,
  },
  {
    key: "/discovery/income-expenses",
    path: "/discovery/income-expenses",
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
    key: "/discovery/assets-debt",
    path: "/discovery/assets-debt",
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
    key: "/discovery/financial-investments",
    path: "/discovery/financial-investments",
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
    key: "/discovery/estate-planning",
    path: "/discovery/estate-planning",
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
    key: "/discovery/estate-planning",
    path: "/discovery/estate-planning",
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
    key: "/discovery/business-entities",
    path: "/discovery/business-entities",
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
    key: "/discovery/smsf",
    path: "/discovery/smsf",
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
    key: "/discovery/investment-trust",
    path: "/discovery/investment-trust",
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
    key: "/discovery/goals-objectives",
    path: "/discovery/goals-objectives",
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
    key: "/discovery/risk-profile",
    path: "/discovery/risk-profile",
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
    key: "/discovery/add-section",
    path: "/discovery/add-section",
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

export const allUserRoutes = [
  ...userRoutes,
  ...discoveryRoutes,
  ...strategyRoutes,
];
