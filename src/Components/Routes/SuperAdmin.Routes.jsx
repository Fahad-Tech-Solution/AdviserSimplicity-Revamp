import PricingTable from "../Auth/PricingTable";
import AdvisersPage from "../Pages/SuperAdmin/AdvisersPage/AdvisersPage";
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