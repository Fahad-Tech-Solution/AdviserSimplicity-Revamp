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

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const navItems = [
  { key: "/user", icon: "🏠", label: <Link to="/user">Dashboard</Link> },
  {
    key: "/user/clients",
    icon: "👥",
    label: <Link to="/user/clients">My Clients</Link>,
  },
  {
    key: "/user/prospects",
    icon: "📊",
    label: <Link to="/user/prospects">Prospects</Link>,
  },
  {
    key: "/user/my-team",
    icon: "👤",
    label: <Link to="/user/my-team">My Team</Link>,
  },
  {
    key: "discovery",
    icon: "⚙️",
    label: "Discovery",
    children: [
      {
        key: "/discovery/client-summary",
        icon: "📄",
        label: <Link to="/discovery/client-summary">Client Summary</Link>,
      },
      {
        key: "/discovery/personal-details",
        icon: "👤",
        label: <Link to="/discovery/personal-details">Personal Details</Link>,
      },
      {
        key: "/discovery/income-expenses",
        icon: "💲",
        label: <Link to="/discovery/income-expenses">Income & Expenses</Link>,
      },
      {
        key: "/discovery/assets-debt",
        icon: "🏡",
        label: <Link to="/discovery/assets-debt">Assets & Debt</Link>,
      },
      {
        key: "/discovery/financial-investments",
        icon: "📈",
        label: (
          <Link to="/discovery/financial-investments">
            Financial Investments
          </Link>
        ),
      },
      {
        key: "/discovery/estate-planning",
        icon: "📋",
        label: <Link to="/discovery/estate-planning">Estate Planning</Link>,
      },
      {
        key: "/discovery/goals-objectives",
        icon: "🎯",
        label: <Link to="/discovery/goals-objectives">Goals & Objectives</Link>,
      },
      {
        key: "/discovery/risk-profile",
        icon: "🌐",
        label: <Link to="/discovery/risk-profile">Risk Profile</Link>,
      },
      {
        key: "/discovery/add-section",
        icon: "＋",
        label: <Link to="/discovery/add-section">Add Section</Link>,
      },
    ],
  },
  {
    key: "strategy",
    icon: "📋",
    label: "Strategy",
    children: [
      {
        key: "/strategy/denaro-deck",
        icon: "🃏",
        label: <Link to="/strategy/denaro-deck">Denaro Deck</Link>,
      },
      {
        key: "/strategy/scenarios",
        icon: "📍",
        label: <Link to="/strategy/scenarios">Scenarios</Link>,
      },
      {
        key: "/strategy/inputs",
        icon: "⬛",
        label: <Link to="/strategy/inputs">Inputs</Link>,
      },
      {
        key: "/strategy/cashflow",
        icon: "$",
        label: <Link to="/strategy/cashflow">Cashflow</Link>,
      },
      {
        key: "/strategy/networth",
        icon: "↗",
        label: <Link to="/strategy/networth">Networth</Link>,
      },
      {
        key: "/strategy/reports",
        icon: "📄",
        label: <Link to="/strategy/reports">Reports</Link>,
      },
      {
        key: "/strategy/compare",
        icon: "⚖️",
        label: <Link to="/strategy/compare">Compare</Link>,
      },
      {
        key: "/strategy/advice",
        icon: "✍️",
        label: <Link to="/strategy/advice">Advice</Link>,
      },
    ],
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
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          width={220}
          style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
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
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={navItems}
            style={{ borderRight: 0 }}
          />
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
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              mode="inline"
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
