import React, { useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    Row,
    Segmented,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAtomValue } from "jotai";
import {
    RateReferenceObject,
    SelectedClient,
    SelectedReviewAllData,
} from "../../../../../../../../store/authState.js";
import AppModal from "../../../../../../../Common/AppModal";
import useTitleBlock from "../../../../../../../../hooks/useTitleBlock";
import InsuranceNeedsForm from "./InsuranceNeedsForm";
import {
    calculateInsuranceNeeds,
    formatInsuranceMoney,
    getAgeFromDob,
    projectInsurancePremiums,
    toInsuranceNumber,
} from "./insuranceNeedsCalculations.js";

const { Text, Title } = Typography;

const COVER_META = [
    { key: "life", label: "Life Cover", color: "#b91c1c" },
    { key: "tpd", label: "TPD Cover", color: "#c2410c" },
    { key: "trauma", label: "Trauma Cover", color: "#7e22ce" },
];

const MONEY_TOOLTIP = (value) => formatInsuranceMoney(value);

function getInsuranceSection(reviewData) {
    return (
        reviewData?.insuranceNeedsDetails ||
        (reviewData?.insuranceNeeds &&
        typeof reviewData.insuranceNeeds === "object"
            ? reviewData.insuranceNeeds
            : {})
    );
}

function getPersonDob(reviewData, selectedClient, person) {
    return (
        reviewData?.personalDetails?.[person]?.DOB ||
        selectedClient?.[person]?.DOB ||
        selectedClient?.[person]?.dob ||
        ""
    );
}

function getCoverStatus(value) {
    if (value > 100) return { label: "Shortfall", color: "error" };
    if (value < -100) return { label: "Surplus", color: "success" };
    return { label: "Fully covered", color: "success" };
}

function buildDetailedColumns() {
    return [
        {
            title: "Calculation",
            dataIndex: "label",
            key: "label",
            fixed: "left",
            width: 260,
        },
        ...COVER_META.map(({ key, label }) => ({
            title: label.replace(" Cover", ""),
            dataIndex: key,
            key,
            align: "right",
            width: 150,
            render: (value, record) =>
                record.label === "Years required"
                    ? `${Math.round(Number(value) || 0)} years`
                    : formatInsuranceMoney(value),
        })),
    ];
}

const SUMMARY_COLUMNS = [
    {
        title: "Cover Type",
        dataIndex: "coverType",
        key: "coverType",
        render: (value) => <Text strong>{value}</Text>,
    },
    {
        title: "Required Cover",
        dataIndex: "required",
        key: "required",
        align: "right",
        render: (value, record) =>
            record.key === "ip"
                ? formatInsuranceMoney(value, "/mo")
                : formatInsuranceMoney(value),
    },
    {
        title: "Existing Cover",
        dataIndex: "existing",
        key: "existing",
        align: "right",
        render: (value, record) =>
            record.key === "ip"
                ? formatInsuranceMoney(value, "/mo")
                : formatInsuranceMoney(value),
    },
    {
        title: "Shortfall / Surplus",
        dataIndex: "shortfall",
        key: "shortfall",
        align: "right",
        render: (value, record) => {
            const status = getCoverStatus(value);
            const surplus = status.label === "Surplus";
            const color = status.label === "Shortfall" ? "#b91c1c" : "#15803d";
            return (
                <Text strong style={{ color }}>
                    {status.label === "Fully covered"
                        ? "Fully covered"
                        : `${surplus ? "Surplus" : "Shortfall"} · ${formatInsuranceMoney(
                            Math.abs(value),
                            record.key === "ip" ? "/mo" : "",
                        )}`}
                </Text>
            );
        },
    },
    {
        title: "Status",
        dataIndex: "status",
        key: "status",
        align: "center",
        render: (value, record) => {
            const status = record.key === "ip"
                ? getCoverStatus(record.shortfall)
                : getCoverStatus(record.shortfall);
            return <Tag color={status.color}>{value || status.label}</Tag>;
        },
    },
];

const PREMIUM_COLUMNS = [
    { title: "Age", dataIndex: "age", key: "age", fixed: "left", width: 90,
        render: (value, record) => `${value}${record.isCurrent ? " (now)" : value === 65 ? " (end)" : ""}` },
    ...["life", "tpd", "trauma", "ip"].map((key) => ({
        title: key.toUpperCase(),
        dataIndex: key,
        key,
        align: "right",
        render: (value, record) => key === "ip" && record.age >= 65
            ? "—"
            : formatInsuranceMoney(value),
    })),
    {
        title: "Total ($/yr)",
        dataIndex: "total",
        key: "total",
        align: "right",
        render: (value) => <Text strong>{formatInsuranceMoney(value)}</Text>,
    },
    {
        title: "Cumulative Premium",
        dataIndex: "cumulative",
        key: "cumulative",
        align: "right",
        render: (value) => <Text strong style={{ color: "#7c3aed" }}>{formatInsuranceMoney(value)}</Text>,
    },
];

const InsuranceNeeds = () => {
    const [selectedProfile, setSelectedProfile] = useState("client");
    const [viewMode, setViewMode] = useState("Graph");
    const [coverTab, setCoverTab] = useState("Insurance Cover");
    const [premiumHorizon, setPremiumHorizon] = useState("10y");
    const [openModal, setOpenModal] = useState(false);
    const [seriesVisibility, setSeriesVisibility] = useState({
        currentCover: true,
        shortfall: true,
    });
    const selectedReviewAllData = useAtomValue(SelectedReviewAllData);
    const selectedClient = useAtomValue(SelectedClient);
    const rateReference = useAtomValue(RateReferenceObject);
    const taxRatesSchema = rateReference?.taxRatesSchema;
    const headingStyle = { fontFamily: "Georgia,serif" };
    const renderTitleBlock = useTitleBlock({ titleStyle: headingStyle });

    const section = useMemo(
        () => getInsuranceSection(selectedReviewAllData),
        [selectedReviewAllData],
    );
    const maritalStatus =
        selectedReviewAllData?.personalDetails?.client?.clientMaritalStatus ||
        selectedClient?.client?.clientMaritalStatus ||
        "";
    const allowPartner = !["single", "widowed"].includes(
        String(maritalStatus).toLowerCase(),
    );

    const activeProfile = allowPartner ? selectedProfile : "client";

    const profile = useMemo(
        () => section?.[activeProfile] || {},
        [section, activeProfile],
    );
    const age = getAgeFromDob(
        getPersonDob(selectedReviewAllData, selectedClient, activeProfile),
    );
    const calculated = useMemo(
        () => calculateInsuranceNeeds(profile, age, taxRatesSchema),
        [profile, age, taxRatesSchema],
    );
    const premiumProjection = useMemo(
        () => projectInsurancePremiums(profile, age, premiumHorizon),
        [profile, age, premiumHorizon],
    );

    const ipRequiredMonthly =
        calculated.ip.monthlyBenefit + calculated.ip.monthlySuper;
    const summaryRows = [
        ...calculated.coverRows.map((row) => ({
            ...row,
            coverType: `${row.coverType} Cover`,
        })),
        {
            key: "ip",
            coverType: "Income Protection",
            required: ipRequiredMonthly,
            existing: calculated.ip.existingMonthly,
            shortfall: calculated.ip.shortfall,
            status: getCoverStatus(calculated.ip.shortfall).label,
        },
    ];

    const chartData = [
        ...COVER_META.map(({ key, label }) => ({
            category: label.replace(" Cover", ""),
            currentCover: calculated.existingByType[key],
            shortfall: Math.max(0, calculated.shortfallByType[key]),
            required: calculated.coverRequiredByType[key],
        })),
        {
            category: "IP (annualised)",
            currentCover: calculated.ip.existingMonthly * 12,
            shortfall: Math.max(0, calculated.ip.shortfall * 12),
            required: ipRequiredMonthly * 12,
        },
    ];

    const premiumChartProjection = useMemo(
        () => projectInsurancePremiums(profile, age, "10y"),
        [profile, age],
    );
    const aggregateShortfall = COVER_META.reduce(
        (total, { key }) => total + Math.max(0, calculated.shortfallByType[key]),
        0,
    );
    const chartSummary = aggregateShortfall > 1000
        ? `${formatInsuranceMoney(aggregateShortfall)} additional lump-sum cover required across Life / TPD / Trauma`
        : "Existing cover meets or exceeds calculated lump-sum needs";

    const toggleSeries = (key) => {
        setSeriesVisibility((previous) => {
            const otherKey = key === "currentCover" ? "shortfall" : "currentCover";
            if (previous[key] && !previous[otherKey]) return previous;
            return { ...previous, [key]: !previous[key] };
        });
    };

    const metricCards = [
        ...COVER_META.map(({ key, label, color }) => {
            const gap = calculated.shortfallByType[key];
            const status = getCoverStatus(gap);
            const subText = gap > 100
                ? `Shortfall · ${formatInsuranceMoney(gap)}`
                : gap < -100
                    ? `Surplus · ${formatInsuranceMoney(Math.abs(gap))}`
                    : "Fully covered";
            return {
                key,
                label,
                value: formatInsuranceMoney(calculated.existingByType[key]),
                subText,
                color: status.color === "error" ? "#b91c1c" : "#15803d",
                accent: color,
            };
        }),
        {
            key: "ip",
            label: "IP Cover",
            value: formatInsuranceMoney(calculated.ip.existingMonthly, "/mo"),
            subText: calculated.ip.shortfall > 50
                ? `Shortfall · ${formatInsuranceMoney(calculated.ip.shortfall, "/mo")}`
                : calculated.ip.shortfall < -50
                    ? `Surplus · ${formatInsuranceMoney(Math.abs(calculated.ip.shortfall), "/mo")}`
                    : "Fully covered",
            color: calculated.ip.shortfall > 50 ? "#b91c1c" : "#15803d",
            accent: "#1d4ed8",
        },
    ];

    const premiumNotice = premiumProjection.reason === "dob"
        ? "Add a date of birth in Client Details to see the age-banded projection."
        : premiumProjection.reason === "premiums"
            ? "Enter annual premiums in Edit Inputs to see the projection."
            : "";

    const detailColumns = useMemo(() => buildDetailedColumns(), []);

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <Segmented
                    value={activeProfile === "client" ? "Client" : "Partner"}
                    onChange={(value) => setSelectedProfile(value.toLowerCase())}
                    options={[
                        { label: "Client", value: "Client", icon: "👤" },
                        ...(allowPartner ? [{ label: "Partner", value: "Partner", icon: "👥" }] : []),
                    ]}
                />
                <Space size={12} wrap>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: "Graph", value: "Graph", icon: "📈" },
                            { label: "Table", value: "Table", icon: "📋" },
                        ]}
                    />
                    <Button
                        style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", color: "#fff", borderRadius: 8, fontWeight: 600 }}
                        onClick={() => {
                            setCoverTab("Insurance Cover");
                            setViewMode("Table");
                        }}
                    >
                        🧠 Analyse
                    </Button>
                    <Button
                        type="primary"
                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", borderRadius: 8, fontWeight: 600 }}
                        onClick={() => setOpenModal(true)}
                    >
                        ✏️ Edit Inputs
                    </Button>
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {metricCards.map((metric) => (
                    <Col key={metric.key} xs={24} sm={12} md={6}>
                        <Card
                            bodyStyle={{ padding: 16, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                            style={{ borderRadius: 12, borderColor: "#e8e8e8", height: "100%", borderTop: `3px solid ${metric.accent}` }}
                        >
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>{metric.label}</Text>
                                <Title level={3} style={{ margin: "4px 0", fontWeight: 600, color: "#1f2937" }}>
                                    {metric.value}
                                </Title>
                            </div>
                            <Text style={{ fontSize: 11, color: metric.color, fontWeight: 600 }}>
                                {metric.subText}
                            </Text>
                        </Card>
                    </Col>
                ))}
            </Row>

            <div style={{ marginBottom: 16 }}>
                <Segmented
                    value={coverTab}
                    onChange={setCoverTab}
                    options={[
                        { label: "Insurance Cover", value: "Insurance Cover", icon: "🛡️" },
                        { label: "Premiums", value: "Premiums", icon: "💵" },
                    ]}
                />
            </div>

            <Card bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, borderColor: "#e8e8e8" }}>
                {coverTab === "Insurance Cover" ? (
                    viewMode === "Graph" ? (
                        <>
                            <Title level={4} style={{ textAlign: "center", marginBottom: 24, fontWeight: 700, color: "#0f172a" }}>
                                Insurance Cover — Required vs Existing
                            </Title>
                            <div style={{ width: "100%", height: 380 }}>
                                <ResponsiveContainer>
                                    <BarChart data={chartData} margin={{ top: 20, right: 24, left: 20, bottom: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `$${(value / 1000).toLocaleString()}K`} />
                                        <Tooltip formatter={MONEY_TOOLTIP} />
                                        {seriesVisibility.currentCover && (
                                            <Bar dataKey="currentCover" name="Current Cover" stackId="cover" fill="#2b3b5c" maxBarSize={60} />
                                        )}
                                        {seriesVisibility.shortfall && (
                                            <Bar dataKey="shortfall" name="Shortfall" stackId="cover" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 12, marginTop: 12 }}>
                                {chartSummary}. IP is annualised for chart comparison.
                            </Text>
                            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                                <Button size="small" onClick={() => toggleSeries("currentCover")} style={{ borderRadius: 16, borderColor: "#2b3b5c", color: seriesVisibility.currentCover ? "#2b3b5c" : "#94a3b8", fontWeight: 600 }}>
                                    ● Current Cover
                                </Button>
                                <Button size="small" onClick={() => toggleSeries("shortfall")} style={{ borderRadius: 16, borderColor: "#10b981", color: seriesVisibility.shortfall ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
                                    ● Shortfall
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Title level={5} style={{ color: "#22c55e", letterSpacing: "0.5px", marginBottom: 16, textTransform: "uppercase" }}>
                                Insurance Cover Breakdown
                            </Title>
                            <Table
                                columns={SUMMARY_COLUMNS}
                                dataSource={summaryRows}
                                rowKey="key"
                                pagination={false}
                                size="small"
                                scroll={{ x: 800 }}
                            />
                            <details style={{ marginTop: 20 }}>
                                <summary style={{ cursor: "pointer", color: "#15803d", fontWeight: 600 }}>
                                    View calculation breakdown
                                </summary>
                                <Table
                                    style={{ marginTop: 12 }}
                                    columns={detailColumns}
                                    dataSource={calculated.detailedRows}
                                    rowKey="label"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 720 }}
                                />
                            </details>
                        </>
                    )
                ) : (
                    viewMode === "Graph" ? (
                        <>
                            <Title level={4} style={{ textAlign: "center", marginBottom: 8, fontWeight: 700, color: "#0f172a" }}>
                                Cost of Cover — Annual Premium Projection
                            </Title>
                            {premiumNotice ? (
                                <div style={{ minHeight: 280, display: "grid", placeItems: "center" }}>
                                    <Text type="secondary">{premiumNotice}</Text>
                                </div>
                            ) : (
                                <>
                                    <div style={{ width: "100%", height: 360 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={premiumChartProjection.rows} margin={{ top: 20, right: 24, left: 20, bottom: 16 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="age" tickFormatter={(value) => `Age ${value}`} />
                                                <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}K`} />
                                                <Tooltip formatter={MONEY_TOOLTIP} labelFormatter={(value) => `Age ${value}`} />
                                                <Legend />
                                                <Line type="monotone" dataKey="life" name="Life" stroke="#b91c1c" dot={false} />
                                                <Line type="monotone" dataKey="tpd" name="TPD" stroke="#c2410c" dot={false} />
                                                <Line type="monotone" dataKey="trauma" name="Trauma" stroke="#7e22ce" dot={false} />
                                                <Line type="monotone" dataKey="ip" name="IP" stroke="#22c55e" dot={false} />
                                                <Line type="monotone" dataKey="total" name="Total" stroke="#2b3a5e" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 12 }}>
                                        Indicative annual premiums use age-banded increases plus 3% annual cover indexation; IP ceases at age 65.
                                    </Text>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                                <Title level={5} style={{ color: "#22c55e", letterSpacing: "0.5px", margin: 0, textTransform: "uppercase" }}>
                                    Premium Projection
                                </Title>
                                <Segmented
                                    value={premiumHorizon}
                                    onChange={setPremiumHorizon}
                                    options={[
                                        { label: "First 10 Years", value: "10y" },
                                        { label: "To Age 65", value: "65" },
                                    ]}
                                />
                            </div>
                            {premiumNotice ? (
                                <div style={{ minHeight: 140, display: "grid", placeItems: "center" }}>
                                    <Text type="secondary">{premiumNotice}</Text>
                                </div>
                            ) : (
                                <Table
                                    columns={PREMIUM_COLUMNS}
                                    dataSource={premiumProjection.rows}
                                    rowKey="age"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 850 }}
                                />
                            )}
                        </>
                    )
                )}
            </Card>

            <div style={{ marginTop: 16, textAlign: "left" }}>
                <Text type="secondary" style={{ fontSize: 10, letterSpacing: "0.5px", fontWeight: 600 }}>
                    PROJECTED · ALL VALUES IN AUD · INDICATIVE NEEDS ANALYSIS ONLY
                </Text>
                {coverTab === "Insurance Cover" && (
                    <div style={{ marginTop: 5 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Investment return {
                                profile?.assumptions?.investmentReturn === "" ||
                                profile?.assumptions?.investmentReturn === null ||
                                profile?.assumptions?.investmentReturn === undefined
                                    ? 5
                                    : toInsuranceNumber(profile.assumptions.investmentReturn)
                            }% ·
                            Inflation {
                                profile?.assumptions?.inflation === "" ||
                                profile?.assumptions?.inflation === null ||
                                profile?.assumptions?.inflation === undefined
                                    ? 2.5
                                    : toInsuranceNumber(profile.assumptions.inflation)
                            }% ·
                            Real return {(calculated.realReturn * 100).toFixed(2)}%
                            {age ? ` · Age ${age}` : ""}
                        </Text>
                    </div>
                )}
            </div>

            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width="90vw"
                title={renderTitleBlock({ title: "Insurance Needs Inputs", icon: "🛡️" })}
            >
                <InsuranceNeedsForm modalData={{ closeModal: () => setOpenModal(false) }} />
            </AppModal>
        </div>
    );
};

export default InsuranceNeeds;
