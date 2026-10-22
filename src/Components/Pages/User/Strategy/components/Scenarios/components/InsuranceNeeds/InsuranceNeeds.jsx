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
import AnalysisModal from "../AnalysisModal/AnalysisModal.jsx";

const { Text, Title } = Typography;

const COVER_META = [
    { key: "life", label: "Life Cover", color: "#b91c1c" },
    { key: "tpd", label: "TPD Cover", color: "#c2410c" },
    { key: "trauma", label: "Trauma Cover", color: "#7e22ce" },
];

const INSURANCE_ANALYSIS_DISCLAIMER =
    "The figures shown are projections and estimates based on the assumptions and inputs provided. They are <strong>not guaranteed</strong> and actual outcomes may differ materially due to investment returns, legislative changes, taxation rules, inflation, contribution caps, market volatility, or personal circumstances. This is general information only and does not constitute personal financial product advice. Past performance is not a reliable indicator of future performance. For formal advice tailored to the client's specific situation, refer to the calculator's detailed output and the Record of Advice.";

const MONEY_TOOLTIP = (value) => formatInsuranceMoney(value);

function getMarginalTaxRate(grossIncome) {
    const gross = toInsuranceNumber(grossIncome);
    if (gross <= 18_200) return 0;
    if (gross <= 26_000) return 0.16;
    if (gross <= 45_000) return 0.18;
    if (gross <= 135_000) return 0.32;
    if (gross <= 190_000) return 0.39;
    return 0.47;
}

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

function formatInsuranceSpeechCurrency(value) {
    const rounded = Math.round(Number(value) || 0);
    if (rounded === 0) return "zero dollars";
    const sign = rounded < 0 ? "negative " : "";
    const absolute = Math.abs(rounded);
    if (absolute >= 1000000) {
        const millions = Math.round((absolute / 1000000) * 10) / 10;
        return `${sign}${Number.isInteger(millions) ? millions : millions.toFixed(1)} million dollars`;
    }
    if (absolute >= 100000) return `${sign}${Math.round(absolute / 1000)} thousand dollars`;
    if (absolute >= 10000) {
        const thousands = Math.round(absolute / 500) * 500 / 1000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    if (absolute >= 1000) {
        const thousands = Math.round(absolute / 100) * 100 / 1000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    return `${sign}${absolute} dollars`;
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
        { key: "income-benefit-monthly", label: <>Income Benefit Covered <span style={{ fontSize: "11px", color: "#9ca3af" }}>(monthly)</span></>, value: formatInsuranceMoney(calculated.ip.monthlyBenefit, "/mo"), color: "#1d4ed8" },
        { key: "super-benefit-monthly", label: <>Super Contributions Cover <span style={{ fontSize: "11px", color: "#9ca3af" }}>(monthly)</span></>, value: formatInsuranceMoney(calculated.ip.monthlySuper, "/mo"), color: "#1d4ed8" },
        { key: "income-benefit-annual", label: <>IP Income Benefit <span style={{ fontSize: "11px", color: "#9ca3af" }}>(annual gross)</span></>, value: formatInsuranceMoney(calculated.ip.annualBenefit), color: "#1d4ed8" },
        { key: "net-monthly", label: <>Net Monthly After Tax <span style={{ fontSize: "11px", color: "#9ca3af" }}>(IP income net)</span></>, value: formatInsuranceMoney(calculated.ip.netMonthlyAfterTax, "/mo"), color: "#15803d" },
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
    const [premiumChartMode, setPremiumChartMode] = useState("cost");
    const [premiumHorizon, setPremiumHorizon] = useState("10y");
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
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
    const allowPartner = selectedReviewAllData?.personalDetails?.owner?.includes("partner")

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
            shortfall: Math.max(
                0,
                calculated.totalNeedsByType[key] - calculated.existingByType[key],
            ),
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
    const incomeForTax = profile?.incomeReplacement?.grossIncome;
    const marginalTaxRate = getMarginalTaxRate(incomeForTax);
    const ipOwnershipRows = useMemo(
        () => premiumChartProjection.rows.map((row) => ({
            age: row.age,
            insideSuper: row.ip * 0.85,
            ownName: row.ip * (1 - marginalTaxRate),
        })),
        [premiumChartProjection.rows, marginalTaxRate],
    );
    const ipOwnershipSummary = useMemo(() => {
        if (!ipOwnershipRows.length) return "";

        const insideSuperTotal = ipOwnershipRows.reduce(
            (total, row) => total + row.insideSuper,
            0,
        );
        const ownNameTotal = ipOwnershipRows.reduce(
            (total, row) => total + row.ownName,
            0,
        );
        const savings = insideSuperTotal - ownNameTotal;
        const firstAge = ipOwnershipRows[0].age;
        const lastAge = ipOwnershipRows[ipOwnershipRows.length - 1].age;
        const savingsText = savings < 0
            ? `-${formatInsuranceMoney(Math.abs(savings))}`
            : formatInsuranceMoney(savings);

        return `First ${ipOwnershipRows.length} years (age ${firstAge}–${lastAge}) after-tax cost — Inside Super: ${formatInsuranceMoney(insideSuperTotal)} · Own Name: ${formatInsuranceMoney(ownNameTotal)} · Savings owning in own name: ${savingsText} · MTR ${Math.round(marginalTaxRate * 100)}%`;
    }, [ipOwnershipRows, marginalTaxRate]);
    const ipOwnershipNotice = !age
        ? "Add a date of birth in Client Details to see the comparison."
        : age >= 65
            ? "IP cover typically ceases at age 65 — no projection."
            : toInsuranceNumber(profile?.existingCover?.ipPremium) <= 0
                ? "Enter an IP premium in Edit Inputs to see the ownership comparison."
                : "";
    const premiumProjectionSummary = useMemo(() => {
        const rows = premiumChartProjection.rows;
        if (!rows.length) return "";

        const firstYear = rows[0];
        const lastYear = rows[rows.length - 1];
        return `First ${rows.length} years (age ${firstYear.age}–${lastYear.age}) · Annual premium at year ${lastYear.age - firstYear.age}: ${formatInsuranceMoney(lastYear.total)} · Cumulative: ${formatInsuranceMoney(lastYear.cumulative)}`;
    }, [premiumChartProjection]);
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

    const analysisContent = useMemo(() => {
        const getFirstName = (person) => {
            const preferredName = String(getReviewName(person) || "").trim();
            if (preferredName && !["client", "partner"].includes(preferredName.toLowerCase())) {
                return preferredName.split(/\s+/)[0];
            }
            return person === "partner" ? "your partner" : "the client";
        };
        const people = ["client", ...(allowPartner ? ["partner"] : [])];
        const leadName = getFirstName("client");
        const bullets = [];
        const tiles = [];
        const speakParts = [`${leadName}, here's your insurance cover summary:`];
        const gapDetails = (gap) => ({
            abs: Math.abs(gap),
            color: gap > 1000 ? "#dc2626" : gap < -1000 ? "#16a34a" : "#6b7280",
            label: gap > 1000 ? "shortfall" : gap < -1000 ? "surplus" : "covered",
        });
        const fmtRow = (label, gap, existing, suffix = "") => {
            const formattedGap = gapDetails(gap);
            const existingText = `${formatInsuranceMoney(existing)}${suffix}`;
            if (formattedGap.label === "covered") {
                return `<span style="color:${formattedGap.color}">${label}: ${existingText} held · ${formattedGap.label}</span>`;
            }
            return `<span style="color:${formattedGap.color}">${label}: ${existingText} held · ${formattedGap.label} ${formatInsuranceMoney(formattedGap.abs)}${suffix}</span>`;
        };
        const speakCover = (label, gap) => {
            if (gap > 1000) return `${label}: ${formatInsuranceSpeechCurrency(gap)} additional cover required`;
            if (gap < -1000) return `${label}: ${formatInsuranceSpeechCurrency(Math.abs(gap))} surplus to needs`;
            return `${label}: adequately covered`;
        };

        let totalHouseholdShortfall = 0;
        people.forEach((person) => {
            const personProfile = section?.[person] || {};
            const personAge = getAgeFromDob(
                getPersonDob(selectedReviewAllData, selectedClient, person),
            );
            const personResults = person === activeProfile
                ? calculated
                : calculateInsuranceNeeds(
                    personProfile,
                    personAge,
                    taxRatesSchema,
                    {
                        mortgageAmount:
                            selectedReviewAllData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal,
                    },
                );
            if (!personResults) return;

            const name = getFirstName(person);
            const gaps = Object.fromEntries(
                COVER_META.map(({ key }) => {
                    const required = Math.max(0, personResults.coverRequiredByType[key]);
                    return [key, required - personResults.existingByType[key]];
                }),
            );
            const ipGap = personResults.ip.shortfall;
            const existing = personResults.existingByType;
            const personShortfall = COVER_META.reduce(
                (total, { key }) => total + Math.max(0, gaps[key]),
                0,
            );
            totalHouseholdShortfall += personShortfall;

            bullets.push(`<strong style="font-size:14px">${name}</strong>`);
            bullets.push(fmtRow("❤️ Life", gaps.life, existing.life));
            bullets.push(fmtRow("♿ TPD", gaps.tpd, existing.tpd));
            bullets.push(fmtRow("🏥 Trauma", gaps.trauma, existing.trauma));
            bullets.push(fmtRow("💼 IP", ipGap, personResults.ip.existingMonthly, "/mo"));

            const speakBits = [
                speakCover("Life cover", gaps.life),
                speakCover("TPD cover", gaps.tpd),
                speakCover("Trauma cover", gaps.trauma),
            ];
            if (ipGap > 50) {
                speakBits.push(`Income Protection: ${formatInsuranceSpeechCurrency(ipGap)} per month shortfall`);
            } else if (ipGap < -50) {
                speakBits.push(`Income Protection: ${formatInsuranceSpeechCurrency(Math.abs(ipGap))} per month surplus`);
            } else {
                speakBits.push("Income Protection: adequately covered");
            }
            speakParts.push(personShortfall > 1000
                ? `For ${name}: ${speakBits.join(". ")}. Total shortfall of ${formatInsuranceSpeechCurrency(personShortfall)} across all cover types.`
                : `For ${name}: ${speakBits.join(". ")}. Existing cover is adequate across all categories.`);

            if (person === "client") {
                const tileLabel = (gap) => gap > 1000
                    ? `${formatInsuranceMoney(gap)} short`
                    : gap < -1000
                        ? `${formatInsuranceMoney(Math.abs(gap))} surplus`
                        : "Covered";
                const tileColor = (gap) => gap > 1000
                    ? "#dc2626"
                    : gap < -1000
                        ? "#16a34a"
                        : "#374151";
                tiles.push(
                    ...COVER_META.map(({ key, label }) => ({
                        label: label.replace(" Cover", ""),
                        value: tileLabel(gaps[key]),
                        color: tileColor(gaps[key]),
                    })),
                    {
                        label: "IP",
                        value: ipGap > 50
                            ? `${formatInsuranceMoney(ipGap)}/mo short`
                            : ipGap < -50
                                ? `${formatInsuranceMoney(Math.abs(ipGap))}/mo surplus`
                                : "Covered",
                        color: ipGap > 50 ? "#dc2626" : ipGap < -50 ? "#16a34a" : "#374151",
                    },
                );
            }
        });

        if (!bullets.length) return { subtitle: "", metrics: [], analysis: [], readAloud: "" };
        bullets.push(totalHouseholdShortfall > 1000
            ? `<strong style="color:#dc2626">⚠ Total household shortfall: ${formatInsuranceMoney(totalHouseholdShortfall)} additional cover required</strong>`
            : '<strong style="color:#16a34a">✓ Household is adequately covered across all categories</strong>');

        const subtitle = allowPartner
            ? `🛡️ Insurance Summary for ${getFirstName("client")} & ${getFirstName("partner")}`
            : `🛡️ Insurance Summary for ${leadName}`;
        return {
            subtitle,
            metrics: tiles.slice(0, 4),
            analysis: bullets,
            readAloud: speakParts.join(" "),
        };
    }, [
        activeProfile,
        allowPartner,
        calculated,
        getReviewName,
        section,
        selectedClient,
        selectedReviewAllData,
        taxRatesSchema,
    ]);

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
                            setOpenAnalysisModal(true);
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
                                            <Bar dataKey="shortfall" name="Shortfall" stackId="cover" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={60} />
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
                                showCount={false}
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
                                showCount={false}
                                tableProps={{ rowKey: "key" }}
                                tableStyle={{ borderRadius: 12, overflow: "hidden" }}
                            />
                        </>
                    )
                ) : (
                    viewMode === "Graph" ? (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                                <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                                    {premiumChartMode === "cost"
                                        ? `Cost of Cover — Annual Premium Projection (${getReviewName(activeProfile)})`
                                        : `IP Ownership Comparison — ${getReviewName(activeProfile)} (10-Year After-Tax Cost)`}
                                </Title>
                                <Segmented
                                    value={premiumChartMode}
                                    onChange={setPremiumChartMode}
                                    options={[
                                        { label: "Cost of Cover", value: "cost" },
                                        { label: "IP Ownership", value: "ipOwnership" },
                                    ]}
                                />
                            </div>
                            {premiumChartMode === "cost" && premiumNotice ? (
                                <div style={{ minHeight: 280, display: "grid", placeItems: "center" }}>
                                    <Text type="secondary">{premiumNotice}</Text>
                                </div>
                            ) : premiumChartMode === "ipOwnership" && ipOwnershipNotice ? (
                                <div style={{ minHeight: 280, display: "grid", placeItems: "center" }}>
                                    <Text type="secondary">{ipOwnershipNotice}</Text>
                                </div>
                            ) : (
                                <>
                                    <div style={{ width: "100%", height: 360 }}>
                                        <ResponsiveContainer>
                                            <BarChart
                                                data={premiumChartMode === "cost" ? premiumChartProjection.rows : ipOwnershipRows}
                                                margin={{ top: 20, right: 24, left: 20, bottom: 32 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="age"
                                                    tickFormatter={(value, index) => index === 0 ? `${value} (now)` : value}
                                                />
                                                <YAxis tickFormatter={(value) => `$${Math.round(value).toLocaleString("en-AU")}`} />
                                                <Tooltip formatter={MONEY_TOOLTIP} labelFormatter={(value) => `Age ${value}`} />
                                                {premiumChartMode === "cost" ? (
                                                    <>
                                                        <Legend />
                                                        <Bar dataKey="life" name="Life" fill="#3b82f6" />
                                                        <Bar dataKey="tpd" name="TPD" fill="#8b5cf6" />
                                                        <Bar dataKey="trauma" name="Trauma" fill="#f59e0b" />
                                                        <Bar dataKey="ip" name="IP" fill="#22c55e" />
                                                        <Bar dataKey="total" name="Total" fill="#2b3a5e" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Bar dataKey="insideSuper" name="Inside Super (×0.85)" fill="#3b82f6" />
                                                        <Bar dataKey="ownName" name="Own Name (×(1 − MTR))" fill="#22c55e" />
                                                    </>
                                                )}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 12 }}>
                                        {premiumChartMode === "cost" ? premiumProjectionSummary : ipOwnershipSummary}
                                    </Text>
                                    {premiumChartMode === "ipOwnership" && (
                                        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                                            <Button size="small" style={{ borderRadius: 16, borderColor: "#3b82f6", color: "#2563eb", fontWeight: 600 }}>
                                                ● Inside Super (×0.85)
                                            </Button>
                                            <Button size="small" style={{ borderRadius: 16, borderColor: "#22c55e", color: "#16a34a", fontWeight: 600 }}>
                                                ● Own Name (×(1 − MTR))
                                            </Button>
                                        </div>
                                    )}
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
            <AnalysisModal
                content={analysisContent}
                subtitle={analysisContent.subtitle}
                disclaimer={INSURANCE_ANALYSIS_DISCLAIMER}
                openAnalysisModal={openAnalysisModal}
                onClose={() => { setOpenAnalysisModal(false) }}
            />
        </div>
    );
};

export default InsuranceNeeds;
