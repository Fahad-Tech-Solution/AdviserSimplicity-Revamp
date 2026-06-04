import { useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Space,
    Tooltip,
    Typography,
} from "antd";
import {
    EditOutlined,
    EyeOutlined,
    PoweroffOutlined,
} from "@ant-design/icons";
import ActiveDot from "../../../Common/ActiveDot";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { BiSearch } from "react-icons/bi";
import { MdAdd } from "react-icons/md";

const { Text, Title } = Typography;
const headingStyle = { fontFamily: "Georgia, serif" };
const PRIMARY_GREEN = "#22c55e";

const PLAN_STYLES = {
    Practice: { background: "#f3e8ff", color: "#7c3aed", border: "1px solid #e9d5ff" },
    Pro: { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
    Starter: {
        background: "#fff7ed",
        color: "#ea580c",
        border: "1px solid #fed7aa",
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

function getInitials(name = "") {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

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

function PlanBadge({ plan }) {
    const style = PLAN_STYLES[plan] || PLAN_STYLES.Starter;
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
            {plan}
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
                borderRadius: 6,
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
                        fontWeight: 700,

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

    const counts = useMemo(() => {
        const total = MOCK_ADVISERS.length;
        const active = MOCK_ADVISERS.filter((a) => a.status === "active").length;
        const disabled = MOCK_ADVISERS.filter((a) => a.status === "disabled").length;
        const newest = MOCK_ADVISERS.filter((a) => isWithinLast30Days(a.joined)).length;
        return { total, active, disabled, newest };
    }, []);

    const filteredAdvisers = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        return MOCK_ADVISERS.filter((adviser) => {
            const matchesTab =
                activeTab === "all"
                    ? true
                    : activeTab === "active"
                        ? adviser.status === "active"
                        : activeTab === "disabled"
                            ? adviser.status === "disabled"
                            : isWithinLast30Days(adviser.joined);

            if (!matchesTab) return false;
            if (!normalizedSearch) return true;

            return (
                adviser.name.toLowerCase().includes(normalizedSearch) ||
                adviser.email.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [activeTab, searchText]);

    const tableData = useMemo(
        () =>
            filteredAdvisers.map((row, index) => ({
                ...row,
                key: row.id,
                index: index + 1,
            })),
        [filteredAdvisers],
    );

    const tabLabel =
        activeTab === "all"
            ? "ALL ADVISERS"
            : activeTab === "active"
                ? "ACTIVE ADVISERS"
                : activeTab === "disabled"
                    ? "DISABLED ADVISERS"
                    : "NEW ADVISERS";

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
                            {getInitials(row.name)}
                        </span>
                        <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{row.name}</span>
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
                render: (plan) => <PlanBadge plan={plan} />,
            },
            {
                title: "STATUS",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status) => <AdviserStatusTag status={status} />,
            },
            {
                title: "JOINED",
                dataIndex: "joined",
                key: "joined",
                width: 110,
                render: (joined) => (
                    <span style={{ color: "#374151", fontSize: 13 }}>
                        {formatJoinedDate(joined)}
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
                                icon={<EyeOutlined style={{ color: "#9ca3af", fontSize: 10 }} />}
                                onClick={() => console.log("view", row.id)}
                            />
                        </Tooltip>
                        <Tooltip title="Edit">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined style={{ color: "#9ca3af", fontSize: 10 }} />}
                                onClick={() => console.log("edit", row.id)}
                            />
                        </Tooltip>
                        <Tooltip title={row.status === "active" ? "Disable" : "Enable"}>
                            <Button
                                type="text"
                                size="small"
                                icon={
                                    <PoweroffOutlined style={{ color: "#9ca3af", fontSize: 10 }} />
                                }
                                onClick={() => console.log("toggle", row.id)}
                            />
                        </Tooltip>
                    </Space>
                ),
            },
        ],
        [],
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
                        value={counts.total + 239}
                        subtext="▲ 12 this month"
                        subtextColor={PRIMARY_GREEN}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Active"
                        value={counts.active + 225}
                        subtext={`${((counts.active / counts.total) * 100).toFixed(1)}% of total`}
                        subtextColor={PRIMARY_GREEN}
                        showActiveDot
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="Disabled"
                        value={counts.disabled + 14}
                        subtext="▼ 3 this month"
                        subtextColor="#ef4444"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatCard
                        title="New (30 days)"
                        value={counts.newest + 28}
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
