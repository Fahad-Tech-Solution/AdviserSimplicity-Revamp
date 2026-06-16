import { useMemo, useState } from "react";
import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import {
  Drawer,
  Layout,
  Menu,
  Grid,
  Avatar,
  ConfigProvider,
  Dropdown,
} from "antd";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import logo from "../../assets/image/Adviser-Simpilicity1.png";
import {
  allSuperAdminRoutes,
  catalogChildRoutes,
  catalogParentRoute,
  superAdminNavRoutes,
  superAdminSubMenuRoutes,
} from "../Routes/SuperAdmin.Routes.jsx";
import { useAtomValue } from "jotai";
import { loggedInUser } from "../../store/authState.js";
import useAuthSession from "../../hooks/useAuthSession";
import { HiDotsVertical } from "react-icons/hi";
import { capitalizeWords } from "../../hooks/helpers.js";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function SuperAdminLayout() {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const session = useAtomValue(loggedInUser);
  const navigate = useNavigate();
  const { logout } = useAuthSession();

  const navItems = useMemo(() => {
    const passes = (route) => route.condition?.() !== false;
    return [
      ...superAdminNavRoutes.filter(passes),
      ...superAdminSubMenuRoutes
        .filter((group) => group.children?.length)
        .map((group) => ({
          ...group,
          children: (group.children || []).filter(passes),
        })),
    ];
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = useMemo(() => {
    const all = [
      ...navItems.flatMap((item) => [item, ...(item.children || [])]),
    ];
    const found =
      all.find((item) => location.pathname === item.key) ||
      [...all]
        .sort((a, b) => b.key.length - a.key.length)
        .find((item) => location.pathname.startsWith(item.key));
    return found?.key || "/super-admin";
  }, [location.pathname, navItems]);

  const visibleRoutes = useMemo(
    () =>
      allSuperAdminRoutes.filter(
        (route) => route.path !== catalogParentRoute.path,
      ),
    [],
  );

  const visibleCatalogRoutes = useMemo(
    () => catalogChildRoutes.filter((route) => route.condition?.() !== false),
    [],
  );

  const handleMenuClick = (info) => {
    if (info.key.startsWith("/")) {
      navigate(info.key);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
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
              style={{
                maxHeight: screens.xl
                  ? "calc(100vh - 16.9vh)"
                  : "calc(100vh - 27vh)",
                overflowY: "auto",
              }}
            >
              <ConfigProvider
                theme={{
                  components: {
                    Menu: {
                      fontSize: 12,
                      subMenuItemBg: "#fff",
                    },
                  },
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={[selectedKey]}
                  items={navItems}
                  inlineIndent={12}
                  style={{ borderRight: 0 }}
                  styles={{
                    item: { padding: "0px 10px", height: "35px" },
                    subMenu: {
                      item: {
                        padding: "0px 20px",
                        height: "35px",
                      },
                    },
                  }}
                  onClick={(info) => handleMenuClick(info)}
                />
              </ConfigProvider>
            </div>

            <div
              style={{
                marginTop: "auto",
                padding: "10px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <Avatar
                size={35}
                src={session?.user?.profileImage}
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e, rgb(22, 163, 74))",
                  color: "#fff",
                }}
              >
                {!session?.user?.profileImage &&
                  (capitalizeWords(
                    session?.user?.firstName?.charAt(0) +
                      session?.user?.lastName?.charAt(0),
                  ) ||
                    "SA")}
              </Avatar>

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 500, fontSize: "12px" }}>
                  {capitalizeWords(
                    session?.user?.firstName + " " + session?.user?.lastName ||
                      "Super Admin",
                  )}
                </div>
                <div style={{ fontSize: "10px", color: "#888" }}>
                  {session?.user?.email || ""}
                </div>
              </div>
              <div>
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "profile",
                        label: "Profile",
                        icon: <UserOutlined />,
                        onClick: () => navigate("/super-admin/profile"),
                      },
                      {
                        key: "logout",
                        label: "Logout",
                        icon: <LogoutOutlined />,
                        danger: true,
                        onClick: () => logout(),
                      },
                    ],
                  }}
                  styles={{
                    root: {
                      width: 200,
                      left: "10px",
                      bottom: "65px",
                    },
                  }}
                >
                  <HiDotsVertical />
                </Dropdown>
              </div>
            </div>
          </div>
        </Sider>
      )}

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
              onClick={(info) => {
                handleMenuClick(info);
                setDrawerOpen(false);
              }}
            />
          </Drawer>

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

      <Layout>
        <Content
          style={{
            background: "#fff",
            height: "100vh",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 8,
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
                  element={
                    r.component ?? <Navigate to="/super-admin" replace />
                  }
                />
              ))}
              <Route
                path={catalogParentRoute.path.replace(/^\//, "")}
                element={catalogParentRoute.component}
              >
                <Route
                  index
                  element={
                    <Navigate
                      to={
                        visibleCatalogRoutes[0]?.relativePath ||
                        "financial-institutions"
                      }
                      replace
                    />
                  }
                />
                {visibleCatalogRoutes.map((r) => (
                  <Route
                    key={r.key}
                    path={r.relativePath}
                    element={
                      r.component ?? <Navigate to="/super-admin/catalog" replace />
                    }
                  />
                ))}
              </Route>
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
