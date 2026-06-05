import CatalogsLayoutPage from "../Layout/CatalogsLayoutPage";
import AdvisersPage from "../Pages/SuperAdmin/AdvisersPage/AdvisersPage";
import FinancialInstitutionsPage from "../Pages/SuperAdmin/Catalogs/FinancialInstitutionsPage";
import SupderAdminDashboardPage from "../Pages/SuperAdmin/Dashboard/SupderAdminDashboardPage";
import SuperAdminPricingTablePage from "../Pages/SuperAdmin/PricingTable/SuperAdminPricingTablePage";
import SettingsPage from "../Pages/SuperAdmin/SettingsPage";
import ProfilePage from "../Pages/User/Clients/ProfilePage";

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

/** Nested catalog sections — each child is a route + page under `/super-admin/catalog/*`. */

export const catalogChildRoutes = [
  {
    key: "/super-admin/catalog/financial-institutions",
    relativePath: "financial-institutions",
    catalogDataKey: "FinancialInstitutions",
    catalogTitle: "Financial Institutions",
    catalogIcon: "🏦",
    ...withSpacing({
      icon: "🏦",
      label: "Financial Institutions",
      fontSize: "13px",
    }),
    component: <FinancialInstitutionsPage />,
    condition: () => true,
  },
];

export const catalogParentRoute = {
  key: "/super-admin/catalog",
  path: "/catalog",
  ...withSpacing({ icon: "📚", label: "Catalog", fontSize: "13px" }),
  component: <CatalogsLayoutPage />,
  condition: () => true,
};

export const superAdminNavRoutes = [
  {
    key: "/super-admin",
    path: "/",
    ...withSpacing({ icon: "📊", label: "Dashboard", fontSize: "13px" }),
    component: <SupderAdminDashboardPage />,
    condition: () => true,
  },

  {
    key: "/super-admin/advisers",
    path: "/advisers",
    ...withSpacing({ icon: "👥", label: "Advisers", fontSize: "13px" }),
    component: <AdvisersPage />,
    condition: () => true,
  },
  catalogParentRoute,
  {
    key: "/super-admin/subscriptions",
    path: "/subscriptions",
    ...withSpacing({ icon: "💳", label: "Subscriptions", fontSize: "13px" }),
    component: <SuperAdminPricingTablePage />,
    condition: () => true,
  },
  {
    key: "/super-admin/settings",
    path: "/settings",
    ...withSpacing({ icon: "⚙️", label: "Settings", fontSize: "13px" }),
    component: <SettingsPage />,
    condition: () => true,
  },
  {
    key: "/super-admin/profile",
    path: "/profile",
    ...withSpacing({ icon: "👤", label: "Profile", fontSize: "13px" }),
    component: <ProfilePage />,
    condition: () => false,
  },
];

export const superAdminSubMenuRoutes = [];
export const allSuperAdminRoutes = [...superAdminNavRoutes];
