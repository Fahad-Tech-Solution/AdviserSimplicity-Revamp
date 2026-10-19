import React, { useMemo, useState } from "react";
import {
    Button,
    Card,
    Col,
    Row,
    Segmented,
    Space,
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
import DynamicDataTable from "../../../../../../../Common/DynamicDataTable";
import useTitleBlock from "../../../../../../../../hooks/useTitleBlock";
import InsuranceNeedsForm from "./InsuranceNeedsForm";
import {
    calculateInsuranceNeeds,
    formatInsuranceMoney,
    getAgeFromDob,
    projectInsurancePremiums,
    toInsuranceNumber,
} from "./insuranceNeedsCalculations.js";
import { useGetReviewName } from "../../../../../../../../hooks/useUserDashboardData.js";

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
    if (value > 0) return { label: "Shortfall", color: "error" };
    if (value < 0) return { label: "Surplus", color: "success" };
    return { label: "Fully covered", color: "success" };
}

function buildDetailedColumns() {
    const cellStyle = (record, value) => {
        if (record.rowType === "section") {
            return { background: "#f9fafb", color: "#16a34a", fontWeight: 700 };
        }
        if (record.rowType === "total") {
            return { background: "#f0fdf4", color: "#15803d", fontWeight: 700 };
        }
        if (record.rowType === "muted") {
            return { color: "#6b7280", fontStyle: "italic" };
        }
        if (record.rowType === "tax") {
            return { color: "#c2410c", fontWeight: 600 };
        }
        if (record.rowType === "cover") {
            return {
                color: Number(value) < 0 ? "#15803d" : "#b91c1c",
                fontWeight: 700,
                background: "#f0fdf4",
            };
        }
        return {};
    };

    return [
        {
            title: "Item",
            dataIndex: "label",
            key: "label",
            width: "46%",
            onCell: (record) => ({ style: cellStyle(record) }),
            render: (value, record) =>
                record.rowType === "section"
                    ? <Text strong style={{ color: "#16a34a", textTransform: "uppercase", letterSpacing: "1px", fontSize: 11 }}>{value}</Text>
                    : <Text style={cellStyle(record)}>{value}</Text>,
        },
        ...COVER_META.map(({ key, label }) => ({
            title: label.replace(" Cover", ""),
            dataIndex: key,
            key,
            align: "right",
            width: "18%",
            onCell: (record) => ({ style: cellStyle(record, record[key]) }),
            render: (value, record) =>
                record.rowType === "section" || value === ""
                    ? ""
                    : record.rowType === "years"
                        ? `${Math.round(Number(value) || 0)} yrs`
                        : value === "N/A"
                            ? <Text type="secondary">N/A</Text>
                            : formatInsuranceMoney(value),
        })),
    ];
}

function buildIncomeProtectionRows(profile, calculated) {
    const details = profile?.incomeProtectionDetails || {};
    const percentIncome = details.percentIncome === "" ||
        details.percentIncome === null || details.percentIncome === undefined
        ? 70
        : toInsuranceNumber(details.percentIncome);
    const percentSuper = details.percentSuper === "" ||
        details.percentSuper === null || details.percentSuper === undefined
        ? 12
        : toInsuranceNumber(details.percentSuper);

    return [
        { key: "annual-income", label: "Annual Income to be Covered", value: formatInsuranceMoney(calculated.ip.annualIncome) },
        { key: "income-percent", label: "% of Income to Cover", value: `${percentIncome}%` },
        { key: "super-percent", label: "Super Contrib. % Cover", value: `${percentSuper}%` },
        { key: "income-benefit-monthly", label: "Income Benefit Covered (monthly)", value: formatInsuranceMoney(calculated.ip.monthlyBenefit, "/mo"), color: "#1d4ed8" },
        { key: "super-benefit-monthly", label: "Super Contributions Cover (monthly)", value: formatInsuranceMoney(calculated.ip.monthlySuper, "/mo"), color: "#1d4ed8" },
        { key: "income-benefit-annual", label: "IP Income Benefit (annual gross)", value: formatInsuranceMoney(calculated.ip.annualBenefit), color: "#1d4ed8" },
        { key: "net-monthly", label: "Net Monthly After Tax (IP income net)", value: formatInsuranceMoney(calculated.ip.netMonthlyAfterTax, "/mo"), color: "#15803d" },
        { key: "existing-cover", label: "Existing Monthly IP Cover", value: formatInsuranceMoney(calculated.ip.existingMonthly, "/mo") },
        { key: "waiting-period", label: "Waiting Period", value: details.waitingPeriod || "30 days" },
        { key: "benefit-period", label: "Benefit Period", value: details.benefitPeriod || "To age 65" },
    ];
}

const INCOME_PROTECTION_COLUMNS = [
    { title: "Item", dataIndex: "label", key: "label", width: "70%" },
    {
        title: "Value",
        dataIndex: "value",
        key: "value",
        align: "right",
        width: "30%",
        render: (value, record) => <Text strong style={{ color: record.color }}>{value}</Text>,
    },
];

const PREMIUM_COLUMNS = [
    {
        title: "Age", dataIndex: "age", key: "age", fixed: "left", width: 90,
        render: (value, record) => `${value}${record.isCurrent ? " (now)" : value === 65 ? " (end)" : ""}`
    },
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
    const getReviewName = useGetReviewName();

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
        () => calculateInsuranceNeeds(
            profile,
            age,
            taxRatesSchema,
            { mortgageAmount: selectedReviewAllData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal },
        ),
        [profile, age, taxRatesSchema, selectedReviewAllData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal],
    );
    const premiumProjection = useMemo(
        () => projectInsurancePremiums(profile, age, premiumHorizon),
        [profile, age, premiumHorizon],
    );

    const ipRequiredMonthly =
        calculated.ip.monthlyBenefit + calculated.ip.monthlySuper;
    const incomeProtectionRows = buildIncomeProtectionRows(profile, calculated);

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
            const subText = gap > 0
                ? `Shortfall · ${formatInsuranceMoney(gap)}`
                : gap < 0
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
            subText: calculated.ip.shortfall > 0
                ? `Shortfall · ${formatInsuranceMoney(calculated.ip.shortfall, "/mo")}`
                : calculated.ip.shortfall < 0
                    ? `Surplus · ${formatInsuranceMoney(Math.abs(calculated.ip.shortfall), "/mo")}`
                    : "Fully covered",
            color: calculated.ip.shortfall > 0 ? "#b91c1c" : "#15803d",
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
                        { label: getReviewName("client"), value: "Client", icon: "👤" },
                        ...(allowPartner ? [{ label: getReviewName("partner"), value: "Partner", icon: "👥" }] : []),
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
                            style={{ borderRadius: 12, borderColor: "#e8e8e8", height: "100%", }}
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
                            <Title level={5} style={{ color: "#22c55e", letterSpacing: "2px", marginBottom: 16, textTransform: "uppercase" }}>
                                Cover Needs — {getReviewName(activeProfile)}
                            </Title>
                            <DynamicDataTable
                                columns={detailColumns}
                                data={calculated.detailedRows}
                                noPagination
                                size="small"
                                headerFontSize={12}
                                bodyFontSize={12}
                                horizontalScroll={false}
                                tableProps={{ rowKey: "key" }}
                                tableStyle={{ borderRadius: 12, overflow: "hidden" }}
                            />
                            <Title level={5} style={{ color: "#22c55e", letterSpacing: "2px", margin: "20px 0px 12px", textTransform: "uppercase" }}>
                                Income Protection
                            </Title>
                            <DynamicDataTable
                                columns={INCOME_PROTECTION_COLUMNS}
                                data={incomeProtectionRows}
                                noPagination
                                size="small"
                                headerFontSize={12}
                                bodyFontSize={12}
                                horizontalScroll={false}
                                tableProps={{ rowKey: "key" }}
                                tableStyle={{ borderRadius: 12, overflow: "hidden" }}
                            />
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
                                <DynamicDataTable
                                    columns={PREMIUM_COLUMNS}
                                    data={premiumProjection.rows}
                                    showCount={false}
                                    noPagination
                                    size="small"
                                    headerFontSize={12}
                                    bodyFontSize={12}
                                    tableProps={{ rowKey: "age", scroll: { x: "max-content" } }}
                                    tableStyle={{ borderRadius: 12 }}
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
                width="70vw"
                title={renderTitleBlock({ title: "Insurance Needs Inputs", icon: "🛡️" })}
            >
                <InsuranceNeedsForm modalData={{ closeModal: () => setOpenModal(false) }} />
            </AppModal>
        </div>
    );
};

export default InsuranceNeeds;
