import { useState } from "react";
import {
  AppstoreOutlined,
  DollarOutlined,
  HomeOutlined,
  MenuOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Drawer, Layout, Menu, Typography, Grid } from "antd";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/image/Adviser-Simpilicity1.png";
import {
  discoveryRoutes,
  strategyRoutes,
  userRoutes,
} from "../Routes/User.Routes.jsx";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const navItems = [
  ...userRoutes,
  {
    key: "discovery",
    icon: "⚙️",
    label: " Discovery",
    children: [...discoveryRoutes],
  },
  {
    key: "strategy",
    icon: "📋",
    label: " Strategy",
    children: [...strategyRoutes],
  },
];

export default function UserLayout() {
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey =
    navItems.find((item) => location.pathname.startsWith(item.key))?.key ||
    "/user";

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
            style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={navItems}
              style={{ borderRight: 0 }}
            />
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
        <Content style={{ background: "#fafafa" }}>
          <div
            style={{
              background: "#fff",
              minHeight: "100vh",
              border: "1px solid #f0f0f0",
              padding: 16,
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            {/* You can render nested routes or any component here */}
            {location.pathname === "/user" ? (
              <>
                <Title level={4} style={{ fontFamily: "Georgia, serif" }}>
                  Dashboard
                </Title>
                <Text type="secondary">
                  Welcome! Your main user content will appear here. Navigate
                  using the sidebar.
                </Text>
              </>
            ) : (
              <div>
                <Text>
                  {/* You can use react-router <Outlet /> if you want nested pages */}
                </Text>
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
