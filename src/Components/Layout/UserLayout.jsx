import { useMemo, useState } from "react";
import {
  AppstoreOutlined,
  DollarOutlined,
  HomeOutlined,
  MenuOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Drawer, Layout, Menu, Typography, Grid, Avatar } from "antd";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import logo from "../../assets/image/Adviser-Simpilicity1.png";
import {
  allUserRoutes,
  discoveryRoutes,
  strategyRoutes,
  userRoutes,
  withSpacing,
} from "../Routes/User.Routes.jsx";
import { useAtomValue } from "jotai";
import { loggedInUser } from "../../Store/authState.js";
import useUserDashboardData from "../../hooks/useUserDashboardData";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const navItems = [
  ...userRoutes,
  {
    key: "discovery",
    ...withSpacing("⚙️", "Discovery", 0),
    children: [...discoveryRoutes],
  },
  {
    key: "strategy",
    ...withSpacing("📋", "Strategy", 0),
    children: [...strategyRoutes],
  },
];

export default function UserLayout() {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const session = useAtomValue(loggedInUser);
  const navigate = useNavigate();

  useUserDashboardData({
    enabled: Boolean(session?.token),
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = useMemo(() => {
    const all = [
      ...navItems.flatMap((item) => [item, ...(item.children || [])]),
    ];
    const found =
      all.find((item) => location.pathname === item.key) ||
      all.find((item) => location.pathname.startsWith(item.key));
    return found?.key || "/user";
  }, [location.pathname]);

  const visibleRoutes = useMemo(() => {
    // For now, render only routes that belong to /user and are already mounted by App.jsx (`/user/*`).
    // You can expand this later to include /discovery and /strategy once those routes exist in App.jsx.
    return allUserRoutes;
  }, []);

  const handleMenuClick = (info) => {
    console.log("Clicked menu item:", info);
    // Example navigation
    if (info.key.startsWith("/")) {
      navigate(info.key); // if using react-router
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          width={220}
          height="100vh"
          style={{
            background: "#fff",
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <div className="d-flex flex-column h-100">
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: "100px" }}
            >
              <img
                src={logo}
                alt="logo"
                className="img-fluid"
                style={{ width: "75%", height: "auto", objectFit: "contain" }}
              />
            </div>
            <div
              style={{ maxHeight: screens.xl? "calc(100vh - 16.9vh)" : "calc(100vh - 27vh)", overflowY: "auto" }}
              // style={{ flex: 1, overflowY: "auto" }}
            >
              <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={navItems}
                style={{ borderRight: 0 }}
                styles={{
                  // item: { paddingInline: 0 },
                  subMenu: {
                    item: { paddingLeft: "25px" },
                  },
                }}
                onClick={(info) => handleMenuClick(info)}
              />
            </div>

            {/* User Profile Section */}
            <div
              style={{
                marginTop: "auto",
                padding: "15px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
              onClick={() => console.log("Profile clicked", session)}
            >
              <Avatar size={35} src={session?.user?.profileImage}>
                {!session?.user?.profileImage &&
                  session?.user?.firstName?.charAt(0) +
                    session?.user?.lastName?.charAt(0)}
              </Avatar>

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 500 }}>
                  {session?.user?.firstName + " " + session?.user?.lastName ||
                    "John Doe"}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {session?.user?.email || "john.doe@example.com"}
                </div>
              </div>
            </div>
          </div>
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <>
          <Drawer
            title={
              <span style={{ fontFamily: "Georgia, serif" }}>Navigation</span>
            }
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
          >
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              items={navItems}
              onClick={() => setDrawerOpen(false)}
            />
          </Drawer>

          {/* Mobile drawer button */}
          <div
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 1000,
              background: "#fff",
              borderRadius: 8,
              padding: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuOutlined />
          </div>
        </>
      )}

      {/* Content */}
      <Layout>
        <Content style={{ background: "#fff" }}>
          <div
            style={{
              background: "#fff",
              height: "100vh",
              padding: 8,
              overflowX: "hidden",
              overflowY: "auto",
              maxWidth: screens.lg ? "1100px" : "100%",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto",
            }}
          >
            <Routes>
              {visibleRoutes.map((r) => (
                <Route
                  key={r.key}
                  path={r.path}
                  element={r.component ?? <Navigate to="/user" replace />}
                />
              ))}
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
