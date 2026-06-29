import { useCallback, useMemo, useState, useEffect } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { EditOutlined, EyeOutlined, PoweroffOutlined } from "@ant-design/icons";
import ActiveDot from "../../../Common/ActiveDot";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { BiSearch } from "react-icons/bi";
import { MdAdd } from "react-icons/md";
import useApi from "../../../../hooks/useApi";
import { advisersDataAtom } from "../../../../store/authState";
import { useAtom } from "jotai";
import {
  capitalizeFirst,
  capitalizeWords,
  getInitials,
} from "../../../../hooks/helpers";
import AdviserForm from "./AdviserForm";
import ViewAdviserModal from "./ViewAdviserModal";

const { Text, Title } = Typography;
const headingStyle = { fontFamily: "Georgia, serif" };
const PRIMARY_GREEN = "#22c55e";

const PLAN_STYLES = {
  "Gold Plan": {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  "Platinum Plan": {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  Platinum: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  "Silver Plan": {
    background: "#fff7ed",
    color: "#ea580c",
    border: "1px solid #fed7aa",
  },
  None: {
    background: "#fff",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
  },
};

const AvatarColors = [
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
  "#22c55e",
];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = Number.parseInt(value, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b]
    .map((n) => clamp(n).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixRgb(base, target, amount) {
  return {
    r: base.r + (target.r - base.r) * amount,
    g: base.g + (target.g - base.g) * amount,
    b: base.b + (target.b - base.b) * amount,
  };
}

/** Light → dark gradient using the main avatar color as the mid-tone anchor. */
function getAvatarGradient(mainColor) {
  const base = hexToRgb(mainColor);
  const light = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.38);
  const dark = mixRgb(base, { r: 0, g: 0, b: 0 }, 0.22);
  return `linear-gradient(135deg, ${rgbToHex(light)} 0%, ${mainColor} 48%, ${rgbToHex(dark)} 100%)`;
}

const MOCK_ADVISERS = [
  {
    id: "1",
    name: "Nathan Williams",
    email: "nathan.williams@adviser.com",
    plan: "Practice",
    status: "active",
    joined: "2022-03-14",
  },
  {
    id: "2",
    name: "James O'Brien",
    email: "james.obrien@adviser.com",
    plan: "Pro",
    status: "active",
    joined: "2021-11-02",
  },
  {
    id: "3",
    name: "Priya Sharma",
    email: "priya.sharma@adviser.com",
    plan: "Starter",
    status: "active",
    joined: "2024-01-18",
  },
  {
    id: "4",
    name: "Emma Collins",
    email: "emma.collins@adviser.com",
    plan: "Pro",
    status: "disabled",
    joined: "2020-07-09",
  },
  {
    id: "5",
    name: "Michael Tran",
    email: "michael.tran@adviser.com",
    plan: "Practice",
    status: "active",
    joined: "2023-06-22",
  },
  {
    id: "6",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@adviser.com",
    plan: "Starter",
    status: "active",
    joined: "2024-02-05",
  },
  {
    id: "7",
    name: "David Park",
    email: "david.park@adviser.com",
    plan: "Pro",
    status: "disabled",
    joined: "2019-12-11",
  },
  {
    id: "8",
    name: "Olivia Hughes",
    email: "olivia.hughes@adviser.com",
    plan: "Practice",
    status: "active",
    joined: "2023-11-30",
  },
];

function formatJoinedDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isWithinLast30Days(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date >= thirtyDaysAgo;
}

function PlanBadge({ plan, index }) {
  const style = PLAN_STYLES[plan] || PLAN_STYLES["None"];
  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "20px",
      }}
    >
      {plan || "None"}
    </span>
  );
}

function AdviserStatusTag({ status }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 10px",
        borderRadius: 15,
        fontSize: 11,
        fontWeight: 600,
        background: isActive ? "#f0fdf4" : "#fef2f2",
        border: isActive
          ? "1px solid rgb(187, 247, 208)"
          : "1px solid rgb(254, 202, 202)",
        color: isActive ? "rgb(22, 163, 74)" : "rgb(220, 38, 38)",
      }}
    >
      {isActive ? (
        <ActiveDot size={7} marginRight={0} />
      ) : (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "rgb(239, 68, 68)",
            flexShrink: 0,
          }}
        />
      )}
      {isActive ? "Active" : "Disabled"}
    </span>
  );
}

function StatCard({ title, value, subtext, subtextColor, showActiveDot }) {
  return (
    <Card
      styles={{ body: { padding: "16px 18px" } }}
      style={{
        borderRadius: 14,
        height: "100%",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(0, 0, 0, .04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        {showActiveDot ? <ActiveDot size={5} marginRight={0} /> : null}
        <Text
          style={{
            fontFamily: "Arial",
            fontSize: 10.5,
            letterSpacing: 1.4,
            color: "#6b7280",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {title}
        </Text>
      </div>
      <Title
        level={3}
        style={{
          margin: 0,
          fontFamily: "Georgia, serif",
          fontSize: 32,
          fontWeight: 300,
          color: "#111827",
          lineHeight: 1.05,
        }}
      >
        {value}
      </Title>
      {subtext ? (
        <Text
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 11,
            fontFamily: "Arial",
            color: subtextColor || "#6b7280",
            fontWeight: 600,
          }}
        >
          {subtext}
        </Text>
      ) : null}
    </Card>
  );
}

function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "none" : "1px solid #e5e7eb",
        background: active ? PRIMARY_GREEN : "#fff",
        color: active ? "#fff" : "#374151",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label} • {count}
    </button>
  );
}

const AdvisersPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [advisersLoading, setAdvisersLoading] = useState(false);
  const [adviserModalOpen, setAdviserModalOpen] = useState(false);
  const [editingAdviser, setEditingAdviser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAdviser, setViewingAdviser] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const { message } = AntdApp.useApp();
  const { confirm } = Modal;
  const [advisers, setAdvisers] = useAtom(advisersDataAtom);

  const counts = useMemo(() => {
    const total = advisers.length;
    const active = advisers.filter((a) => a.isActive === true).length;
    const disabled = advisers.filter((a) => a.isActive === false).length;
    const newest = advisers.filter((a) =>
      isWithinLast30Days(a.createdAt),
    ).length;
    return { total, active, disabled, newest };
  }, [advisers]);

  const filteredAdvisers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return advisers.filter((adviser) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "active"
            ? adviser.isActive === true
            : activeTab === "disabled"
              ? adviser.isActive === false
              : isWithinLast30Days(adviser.createdAt);

      if (!matchesTab) return false;
      if (!normalizedSearch) return true;

      return (
        adviser.firstName.toLowerCase().includes(normalizedSearch) ||
        adviser.lastName.toLowerCase().includes(normalizedSearch) ||
        adviser.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeTab, searchText, advisers]);

  const tableData = useMemo(
    () =>
      filteredAdvisers.map((row, index) => ({
        ...row,
        key: row.id,
        index: index + 1,
      })),
    [filteredAdvisers, advisers],
  );

  const { get, patch } = useApi();

  useEffect(() => {
    fetchAdvisers();
  }, []);

  const fetchAdvisers = async () => {
    try {
      setAdvisersLoading(true);
      const response = await get("/user/Advisers");
      // console.log(response, "response, advisers");
      setAdvisers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
    } finally {
      setAdvisersLoading(false);
    }
  };

  const openAddAdviserModal = () => {
    setEditingAdviser(null);
    setAdviserModalOpen(true);
  };

  const openEditAdviserModal = (row) => {
    setEditingAdviser(row);
    setAdviserModalOpen(true);
  };

  const closeAdviserModal = () => {
    setAdviserModalOpen(false);
    setEditingAdviser(null);
  };

  const openViewAdviserModal = (row) => {
    setViewingAdviser(row);
    setViewModalOpen(true);
  };

  const closeViewAdviserModal = () => {
    setViewModalOpen(false);
    setViewingAdviser(null);
  };

  const handleEditFromView = (row) => {
    closeViewAdviserModal();
    openEditAdviserModal(row);
  };

  const tabLabel =
    activeTab === "all"
      ? "ALL ADVISERS"
      : activeTab === "active"
        ? "ACTIVE ADVISERS"
        : activeTab === "disabled"
          ? "DISABLED ADVISERS"
          : "NEW ADVISERS";

  const enableDisableAdviser = useCallback(
    (id, action) => {
      const adviserId = id?._id ?? id;
      if (!adviserId) return;

      const isEnabling = action === "enable";

      confirm({
        title: `Are you sure you want to ${
          isEnabling ? "enable" : "disable"
        } this Adviser?`,
        content: `This action will ${
          isEnabling ? "enable" : "disable"
        } the adviser.`,
        okText: `Yes, ${isEnabling ? "Enable" : "Disable"}`,
        okType: isEnabling ? "primary" : "danger",
        cancelText: "Cancel",
        centered: true,
        onOk: async () => {
          setStatusBusy(true);
          try {
            await patch("/user/UpdateStatus", { _id: adviserId });
            setAdvisers((prev) =>
              (prev || []).map((item) =>
                (item._id ?? item.id) === adviserId
                  ? { ...item, isActive: !item.isActive }
                  : item,
              ),
            );
            message.success(
              `Adviser ${isEnabling ? "enabled" : "disabled"} successfully.`,
            );
          } catch (error) {
            message.error(
              error?.response?.data?.message ||
                error?.message ||
                `An error occurred while ${
                  isEnabling ? "enabling" : "disabling"
                } the adviser.`,
            );
          } finally {
            setStatusBusy(false);
          }
        },
      });
    },
    [confirm, message, patch, setAdvisers],
  );

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "index",
        key: "index",
        width: 48,
        align: "center",
        onCell: () => ({
          style: { color: "#9ca3af", fontWeight: 700, fontSize: 12 },
        }),
      },
      {
        title: "NAME",
        key: "name",
        width: 220,
        render: (_, row, index) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: getAvatarGradient(
                  AvatarColors[index % AvatarColors.length],
                ),
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {getInitials(row.firstName + " " + row.lastName)}
            </span>
            <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
              {capitalizeWords(row.firstName + " " + row.lastName)}
            </span>
          </div>
        ),
      },
      {
        title: "EMAIL",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
        render: (email) => (
          <span style={{ color: "#6b7280", fontSize: 13 }}>{email}</span>
        ),
      },
      {
        title: "PLAN",
        dataIndex: "plan",
        key: "plan",
        width: 110,
        render: (plan, row, index) => (
          <PlanBadge
            plan={row?.subscription?.productName || ""}
            index={index}
          />
        ),
      },
      {
        title: "STATUS",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (_, row) => (
          <AdviserStatusTag status={row.isActive ? "active" : "disabled"} />
        ),
      },
      {
        title: "JOINED",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 110,
        render: (createdAt) => (
          <span style={{ color: "#374151", fontSize: 13 }}>
            {formatJoinedDate(createdAt)}
          </span>
        ),
      },
      {
        title: "ACTIONS",
        key: "actions",
        width: 110,
        align: "center",
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="View">
              <Button
                type="text"
                size="small"
                icon={
                  <EyeOutlined style={{ color: "#9ca3af", fontSize: 10 }} />
                }
                onClick={() => openViewAdviserModal(row)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: "#9ca3af", fontSize: 10 }} />
                }
                onClick={() => openEditAdviserModal(row)}
              />
            </Tooltip>
            <Tooltip title={row.isActive ? "Disable" : "Enable"}>
              <Button
                type="text"
                size="small"
                disabled={statusBusy}
                icon={
                  <PoweroffOutlined
                    style={{ color: "#9ca3af", fontSize: 10 }}
                  />
                }
                onClick={() =>
                  enableDisableAdviser(
                    row._id ?? row.id,
                    row.isActive ? "disable" : "enable",
                  )
                }
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [
      enableDisableAdviser,
      openEditAdviserModal,
      openViewAdviserModal,
      statusBusy,
    ],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 32px)",
        padding: "12px 4px 24px",
      }}
    >
      <AdviserForm
        open={adviserModalOpen}
        onClose={closeAdviserModal}
        editingAdviser={editingAdviser}
      />

      <ViewAdviserModal
        open={viewModalOpen}
        onClose={closeViewAdviserModal}
        adviser={viewingAdviser}
        onEdit={handleEditFromView}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginTop: 8,
          marginBottom: 20,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Text
            type="secondary"
            style={{
              fontFamily: "Arial, serif",
              fontWeight: 700,
              letterSpacing: "3px",
              fontSize: "11px",
              color: PRIMARY_GREEN,
            }}
          >
            ADMIN
          </Text>
          <Title
            level={3}
            style={{ ...headingStyle, margin: 0, fontWeight: "500" }}
          >
            Advisers
          </Title>
          <Text
            style={{
              fontSize: "12px",
              color: "#6b7280",
              fontFamily: "Arial, sans-serif",
              maxWidth: "580px",
              marginTop: 4,
            }}
          >
            <ActiveDot /> Manage adviser accounts, subscriptions, and access.
          </Text>
        </div>

        <Space wrap>
          <Input
            placeholder="Search advisers"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 240,
              height: 35,
              borderRadius: 8,
              fontSize: 13,
            }}
            prefix={<BiSearch style={{ color: "#9ca3af" }} />}
          />
          <Button
            type="primary"
            icon={<MdAdd size={15} />}
            onClick={openAddAdviserModal}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
            }}
          >
            Add Adviser
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Advisers"
            value={counts.total}
            subtext="▲ 12 this month"
            subtextColor={PRIMARY_GREEN}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active"
            value={counts.active}
            subtext={`${((counts.active / counts.total) * 100).toFixed(1)}% of total`}
            subtextColor={PRIMARY_GREEN}
            showActiveDot
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Disabled"
            value={counts.disabled}
            subtext="▼ 3 this month"
            subtextColor="#ef4444"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="New (30 days)"
            value={counts.newest}
            subtext="▲ 21% vs prev"
            subtextColor={PRIMARY_GREEN}
          />
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <FilterPill
          label="All"
          count={counts.total}
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <FilterPill
          label="Active"
          count={counts.active}
          active={activeTab === "active"}
          onClick={() => setActiveTab("active")}
        />
        <FilterPill
          label="Disabled"
          count={counts.disabled}
          active={activeTab === "disabled"}
          onClick={() => setActiveTab("disabled")}
        />
        <FilterPill
          label="New"
          count={counts.newest}
          active={activeTab === "new"}
          onClick={() => setActiveTab("new")}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #ebedf0",
          boxShadow: "0 10px 35px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px 12px",
            flexWrap: "wrap",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "2px",
              color: PRIMARY_GREEN,
              textTransform: "uppercase",
            }}
          >
            {tabLabel}
          </Text>
          <span style={{ color: "#d1d5db" }}>|</span>
          <Text style={{ fontSize: 13, color: "#9ca3af" }}>
            {filteredAdvisers.length} adviser
            {filteredAdvisers.length === 1 ? "" : "s"}
          </Text>
        </div>

        <div style={{ padding: "0 12px 12px" }}>
          <DynamicDataTable
            loading={advisersLoading}
            columns={columns}
            data={tableData}
            total={tableData.length}
            pageSize={10}
            showCount={false}
            bordered
            size="small"
            tableStyle={{ borderRadius: 8, overflow: "hidden" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvisersPage;
