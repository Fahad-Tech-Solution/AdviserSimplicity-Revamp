import React, { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button, Card, Segmented, Space, Typography } from "antd";
import { useAtom } from "jotai";
import DynamicDataTable from "../../../../../../../Common/DynamicDataTable";
import AppModal from "../../../../../../../Common/AppModal";
import useTitleBlock from "../../../../../../../../hooks/useTitleBlock";
import LoanSimulatorForm from "./LoanSimulatorForm";
import { SelectedReviewAllData } from "../../../../../../../../store/authState";
import { useGetReviewName } from "../../../../../../../../hooks/useUserDashboardData";
import AnalysisModal from "../AnalysisModal/AnalysisModal";

const { Text, Title } = Typography;
const FREQUENCIES = {
    Weekly: 52,
    Fortnightly: 26,
    Monthly: 12,
    Annually: 1,
};
const NUMERIC_FREQUENCIES = {
    52: "Weekly",
    26: "Fortnightly",
    12: "Monthly",
    1: "Annually",
};
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
});
const CURRENCY_FORMATTER_DECIMALS = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
    return CURRENCY_FORMATTER.format(value || 0);
}

function formatCurrencyWithDecimals(value) {
    return CURRENCY_FORMATTER_DECIMALS.format(value || 0);
}

function formatTerm(years) {
    if (!years) return "—";
    return `${years} ${years === 1 ? "yr" : "yrs"}`;
}

function formatAnalysisYears(years) {
    const rounded = Math.round(Number(years) || 0);
    return Math.abs(years - rounded) < 0.05 ? String(rounded) : Number(years).toFixed(1);
}

function formatSpeechCurrency(value) {
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

function simulateLoan({ amount, annualRate, termYears, frequency, loanType, extraPerPeriod, offset }) {
    const periodRate = annualRate / 100 / frequency;
    const totalPeriods = termYears * frequency;
    const isInterestOnly = loanType === "Interest Only" || loanType === "io";
    const minimumRepayment = isInterestOnly
        ? amount * periodRate
        : periodRate > 0
            ? (amount * periodRate * ((1 + periodRate) ** totalPeriods)) /
            (((1 + periodRate) ** totalPeriods) - 1)
            : amount / totalPeriods;
    const rows = [];
    let balance = amount;
    let periodCount = 0;
    let yearlyRepayment = 0;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let year = 1;

    while (balance > 0.005 && periodCount < totalPeriods) {
        periodCount += 1;
        const interest = Math.max(0, balance - offset) * periodRate;
        const repayment = Math.min(
            minimumRepayment + extraPerPeriod,
            balance + interest,
        );
        const principal = Math.min(
            balance,
            isInterestOnly
                ? Math.max(0, repayment - interest)
                : Math.max(0, repayment - interest),
        );

        balance = Math.max(0, balance - principal);
        yearlyRepayment += repayment;
        yearlyPrincipal += principal;
        yearlyInterest += interest;

        if (periodCount % frequency === 0 || balance <= 0.005) {
            const closingBalance = Math.max(0, balance);
            rows.push({
                key: String(year),
                year: `Yr ${year}`,
                repayment: yearlyRepayment,
                principal: yearlyPrincipal,
                interest: yearlyInterest,
                loanBalance: closingBalance,
                offsetAccount: offset,
                netBalance: Math.max(0, closingBalance - offset),
                paidOff: closingBalance <= 0.005,
            });
            year += 1;
            yearlyRepayment = 0;
            yearlyPrincipal = 0;
            yearlyInterest = 0;
        }
    }

    return {
        rows,
        minimumRepayment,
        totalInterest: rows.reduce((total, row) => total + row.interest, 0),
        actualYears: rows.length,
    };
}

// eslint-disable-next-line react-refresh/only-export-components
export function calculateLoanResults(loanData) {
    const loanSetup = loanData?.loanSetup || {};
    const extrasAndOffsets = loanData?.extrasAndOffsets || {};
    const amount = toNumber(loanSetup.homeLoanTotal);
    const annualRate = toNumber(loanSetup.interestRate);
    const termYears = Math.floor(toNumber(loanSetup.termYears));
    const rawFrequency = String(loanSetup.paymentFrequency || "Monthly").trim();
    const frequencyLabel = Object.keys(FREQUENCIES).find(
        (label) => label.toLowerCase() === rawFrequency.toLowerCase(),
    ) || NUMERIC_FREQUENCIES[Number(rawFrequency)] || rawFrequency;
    const frequency = FREQUENCIES[frequencyLabel];

    if (amount <= 0 || annualRate < 0 || termYears <= 0 || !frequency) return null;

    const commonInputs = {
        amount,
        annualRate,
        termYears,
        frequency,
        loanType: loanSetup.loanType || "Principal & Interest",
    };
    const minimumScenario = simulateLoan({
        ...commonInputs,
        extraPerPeriod: 0,
        offset: 0,
    });
    const withExtrasScenario = simulateLoan({
        ...commonInputs,
        extraPerPeriod:
            toNumber(extrasAndOffsets.extraRepayments) +
            toNumber(extrasAndOffsets.surplusCash),
        offset: toNumber(extrasAndOffsets.offsetAccountBalance),
    });

    const termSaved = Math.max(
        0,
        minimumScenario.actualYears - withExtrasScenario.actualYears,
    );
    const interestSaved = Math.max(
        0,
        minimumScenario.totalInterest - withExtrasScenario.totalInterest,
    );
    const chartLength = Math.max(
        minimumScenario.rows.length,
        withExtrasScenario.rows.length,
    );
    const chartData = Array.from({ length: chartLength }, (_, index) => ({
        year: `Yr ${index + 1}`,
        minimumOnly: minimumScenario.rows[index]?.loanBalance || 0,
        withExtraOffset: withExtrasScenario.rows[index]?.loanBalance || 0,
    }));

    return {
        minimumScenario,
        withExtrasScenario,
        chartData,
        termSaved,
        interestSaved,
        frequencyLabel,
    };
}

const TABLE_COLUMNS = [
    { title: "Year", dataIndex: "year", key: "year", align: "center" },
    {
        title: "Repayment",
        dataIndex: "repayment",
        key: "repayment",
        align: "right",
        render: (value, record) => (<span style={record.paidOff ? { color: "#15803d", fontWeight: 700 } : undefined}>
            {formatCurrency(value)}
        </span>),
    },
    {
        title: "Principal",
        dataIndex: "principal",
        key: "principal",
        align: "right",
        render: (value) => formatCurrency(value),
    },
    {
        title: "Interest",
        dataIndex: "interest",
        key: "interest",
        align: "right",
        render: (value) => <span style={{ color: "#dc2626" }}>{formatCurrency(value)}</span>,
    },
    {
        title: "Loan Balance",
        dataIndex: "loanBalance",
        key: "loanBalance",
        align: "right",
        render: (value, record) => (
            <span style={record.paidOff ? { color: "#15803d", fontWeight: 700 } : undefined}>
                {formatCurrency(value)}
            </span>
        ),
    },
    {
        title: "Offset Acct",
        dataIndex: "offsetAccount",
        key: "offsetAccount",
        align: "right",
        render: (value) => value > 0 ? formatCurrency(value) : "—",
    },
    {
        title: "Net Balance",
        dataIndex: "netBalance",
        key: "netBalance",
        align: "right",
        render: (value) => <span style={{ fontWeight: 600 }}>{formatCurrency(value)}</span>,
    },
];

const LoanSimulator = () => {
    const [viewMode, setViewMode] = useState("Graph");
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
    const [selectedReviewAllData] = useAtom(SelectedReviewAllData);
    const getReviewName = useGetReviewName();
    const [seriesVisibility, setSeriesVisibility] = useState({
        withExtraOffset: true,
        minimumOnly: true,
    });
    const renderTitleBlock = useTitleBlock({ titleStyle: { fontFamily: "Georgia,serif" } });
    const loanDetails = selectedReviewAllData?.loanSimulatorDetails;
    const results = useMemo(() => calculateLoanResults(loanDetails), [loanDetails]);
    const currentTableData = results?.withExtrasScenario.rows || [];
    const toggleSeries = (key) => {
        setSeriesVisibility((current) => {
            const nextVisible = !current[key];
            const otherKey = key === "withExtraOffset" ? "minimumOnly" : "withExtraOffset";
            if (!nextVisible && !current[otherKey]) return current;
            return { ...current, [key]: nextVisible };
        });
    };

    const metrics = results
        ? {
            topPill: results.interestSaved > 0 && results.termSaved > 0
                ? `Saving ${formatCurrency(results.interestSaved)} interest · ${formatTerm(results.termSaved)} faster`
                : "Loan Simulator",
            repayment: formatCurrencyWithDecimals(results.minimumScenario.minimumRepayment),
            repaymentFrequency: `per ${results.frequencyLabel.toLowerCase()} · minimum`,
            totalInterest: formatCurrency(results.minimumScenario.totalInterest),
            interestSaved: formatCurrency(results.interestSaved),
            termSaved: results.termSaved > 0 ? formatTerm(results.termSaved) : "—",
            termSavedSub: results.termSaved > 0 ? "with extras & offset" : "no acceleration",
            chartSummary: results.interestSaved > 0
                ? `With extras & offset: loan paid off ${formatTerm(results.termSaved)} earlier, saving ${formatCurrency(results.interestSaved)} interest`
                : "Add extra repayments or an offset balance to see savings",
        }
        : null;

    // const analysisContent = useMemo(() => {
    //     const loanSetup = loanDetails?.loanSetup || {};
    //     const strategy = loanDetails?.extrasAndOffsets || {};
    //     const amount = toNumber(loanSetup.homeLoanTotal);
    //     const rate = toNumber(loanSetup.interestRate);
    //     const termYears = Math.floor(toNumber(loanSetup.termYears));
    //     const frequencyLabel = results?.frequencyLabel || loanSetup.paymentFrequency || "payment period";
    //     const extraRepayments = toNumber(strategy.extraRepayments);
    //     const offsetBalance = toNumber(strategy.offsetAccountBalance);
    //     const surplusCash = toNumber(strategy.surplusCash);
    //     const hasStrategy = extraRepayments > 0 || offsetBalance > 0 || surplusCash > 0;
    //     const preferredName = String(getReviewName("client") || "").trim();
    //     const name = preferredName && !["client", "partner"].includes(preferredName.toLowerCase())
    //         ? preferredName.split(/\s+/)[0]
    //         : "you";

    //     if (!results) {
    //         const prompt = "Enter a valid loan amount, interest rate, and loan term to generate the loan analysis.";
    //         return {
    //             subtitle: "🏠 Loan Results",
    //             metrics: [],
    //             analysis: [prompt],
    //             readAloud: prompt,
    //         };
    //     }

    //     const minimumRepayment = results.minimumScenario.minimumRepayment;
    //     const strategyBits = [];
    //     if (extraRepayments > 0) {
    //         strategyBits.push(`${formatCurrency(extraRepayments)} extra per ${frequencyLabel.toLowerCase()}`);
    //     }
    //     if (offsetBalance > 0) strategyBits.push(`${formatCurrency(offsetBalance)} in offset`);
    //     if (surplusCash > 0) {
    //         strategyBits.push(`${formatCurrency(surplusCash)} surplus per ${frequencyLabel.toLowerCase()}`);
    //     }

    //     const analysis = [
    //         `<strong>${name}</strong>, your loan of <strong>${formatCurrency(amount)}</strong> over <strong>${termYears} years</strong> at <strong>${rate}%</strong>.`,
    //         `Minimum repayment: <strong>${formatCurrency(minimumRepayment)} per ${frequencyLabel.toLowerCase()}</strong>.`,
    //     ];
    //     const speech = [
    //         `${name}, based on your loan details:`,
    //         `Your ${formatSpeechCurrency(amount)} loan over ${termYears} years at ${rate}% has a minimum repayment of ${formatSpeechCurrency(minimumRepayment)} per ${frequencyLabel.toLowerCase()}.`,
    //     ];

    //     if (hasStrategy) {
    //         analysis.push(`Your strategy: ${strategyBits.join(" · ")}.`);
    //         if (results.termSaved > 0.05) {
    //             const yearsSaved = formatAnalysisYears(results.termSaved);
    //             analysis.push(`<strong style="color:#16a34a">✓ You’ll pay off ${yearsSaved} years sooner.</strong>`);
    //             speech.push(`${name}, with this strategy you’ll pay off the loan ${yearsSaved} years sooner than the minimum schedule.`);
    //         }
    //         if (results.interestSaved > 1000) {
    //             analysis.push(`<strong style="color:#16a34a">✓ Interest saved: ${formatCurrency(results.interestSaved)}.</strong>`);
    //             speech.push(`You’ll save approximately ${formatSpeechCurrency(results.interestSaved)} in interest.`);
    //         }
    //     } else {
    //         speech.push(`${name}, currently no additional strategy is applied — the loan follows the minimum repayment schedule.`);
    //     }

    //     return {
    //         subtitle: `🏠 Loan Results for ${name}`,
    //         metrics: [
    //             { label: "Loan amount", value: formatCurrency(amount) },
    //             { label: "Min repayment", value: formatCurrency(minimumRepayment) },
    //             ...(results.termSaved > 0.05
    //                 ? [{ label: "Years saved", value: `${formatAnalysisYears(results.termSaved)} yrs`, color: "#16a34a" }]
    //                 : []),
    //             ...(results.interestSaved > 1000
    //                 ? [{ label: "Interest saved", value: formatCurrency(results.interestSaved), color: "#16a34a" }]
    //                 : []),
    //         ],
    //         analysis,
    //         readAloud: speech.join(" "),
    //     };
    // }, [getReviewName, loanDetails, results]);


    const analysisContent = useMemo(() => {
        const loanSetup = loanDetails?.loanSetup || {};
        const strategy = loanDetails?.extrasAndOffsets || {};
        const amount = toNumber(loanSetup.homeLoanTotal);
        const rate = toNumber(loanSetup.interestRate);
        const termYears = Math.floor(toNumber(loanSetup.termYears));
        const frequencyLabel = results?.frequencyLabel || loanSetup.paymentFrequency || "payment period";
        const extraRepayments = toNumber(strategy.extraRepayments);
        const offsetBalance = toNumber(strategy.offsetAccountBalance);
        const surplusCash = toNumber(strategy.surplusCash);
        const hasStrategy = extraRepayments > 0 || offsetBalance > 0 || surplusCash > 0;

        const owners = loanDetails?.owner || selectedReviewAllData?.personalDetails?.owner || [];
        const hasPartner = owners.includes("partner") || Boolean(selectedReviewAllData?.personalDetails?.partner);

        const getPreferredName = (profileKey) => {
            const name = String(getReviewName(profileKey) || "").trim();
            return name && !["client", "partner"].includes(name.toLowerCase())
                ? name.split(/\s+/)[0]
                : profileKey === "partner" ? "Partner" : "Client";
        };

        const clientName = getPreferredName("client");
        const partnerName = getPreferredName("partner");

        if (!results) {
            const prompt = "Enter a valid loan amount, interest rate, and loan term to generate the loan analysis.";
            return {
                subtitle: "🏠 Loan Results",
                metrics: [],
                analysis: [prompt],
                readAloud: prompt,
            };
        }

        const minimumRepayment = results.minimumScenario.minimumRepayment;
        const strategyBits = [];
        if (extraRepayments > 0) {
            strategyBits.push(`${formatCurrency(extraRepayments)} extra per ${frequencyLabel.toLowerCase()}`);
        }
        if (offsetBalance > 0) strategyBits.push(`${formatCurrency(offsetBalance)} in offset`);
        if (surplusCash > 0) {
            strategyBits.push(`${formatCurrency(surplusCash)} surplus per ${frequencyLabel.toLowerCase()}`);
        }

        const analysis = [
            `<strong>${clientName}</strong>, your loan of <strong>${formatCurrency(amount)}</strong> over <strong>${termYears} years</strong> at <strong>${rate}%</strong>. Minimum repayment: <strong>${formatCurrency(minimumRepayment)} per ${frequencyLabel.toLowerCase()}</strong>.`,
        ];
        const speech = [
            `${clientName}, based on your loan details: your ${formatSpeechCurrency(amount)} loan over ${termYears} years at ${rate}% has a minimum repayment of ${formatSpeechCurrency(minimumRepayment)} per ${frequencyLabel.toLowerCase()}.`,
        ];

        if (hasPartner) {
            analysis.push(
                `<strong>${partnerName}</strong>: Shared mortgage liability of <strong>${formatCurrency(amount)}</strong>.`
            );
            speech.push(
                `${partnerName}, you share the mortgage liability of ${formatSpeechCurrency(amount)}.`
            );
        }

        if (hasStrategy) {
            analysis.push(`Your strategy: ${strategyBits.join(" · ")}.`);
            if (results.termSaved > 0.05) {
                const yearsSaved = formatAnalysisYears(results.termSaved);
                analysis.push(`<strong style="color:#16a34a">✓ You’ll pay off ${yearsSaved} years sooner.</strong>`);
                speech.push(`With this strategy you’ll pay off the loan ${yearsSaved} years sooner than the minimum schedule.`);
            }
            if (results.interestSaved > 1000) {
                analysis.push(`<strong style="color:#16a34a">✓ Interest saved: ${formatCurrency(results.interestSaved)}.</strong>`);
                speech.push(`You’ll save approximately ${formatSpeechCurrency(results.interestSaved)} in interest.`);
            }
        } else {
            speech.push(`Currently no additional strategy is applied — the loan follows the minimum repayment schedule.`);
        }

        const metrics = [
            { label: `${clientName} Loan`, value: formatCurrency(amount) },
            { label: "Min Repayment", value: formatCurrency(minimumRepayment) },
            ...(results.termSaved > 0.05
                ? [{ label: "Years Saved", value: `${formatAnalysisYears(results.termSaved)} yrs`, color: "#16a34a" }]
                : []),
            ...(results.interestSaved > 1000
                ? [{ label: "Interest Saved", value: formatCurrency(results.interestSaved), color: "#16a34a" }]
                : []),
        ];

        return {
            subtitle: `🏠 Combined Loan Simulator Analysis`,
            metrics,
            analysis,
            readAloud: speech.join(" "),
        };
    }, [getReviewName, loanDetails, results, selectedReviewAllData]);

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <Space size={16}>
                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                        🏠 {metrics?.topPill || "Loan Simulator"}
                    </div>
                </Space>

                <Space size={12} wrap>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: "📈 Graph", value: "Graph" },
                            { label: "📋 Table", value: "Table" },
                        ]}
                    />
                    <Button
                        style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", color: "#fff", borderRadius: 8, fontWeight: 600 }}
                        icon="🧠"
                        onClick={() => setOpenAnalysisModal(true)}
                    >
                        Analyse
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => setOpenModal(true)}
                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                    >
                        ✏️ Edit Inputs
                    </Button>
                </Space>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                <MetricCard label="Repayment" value={metrics?.repayment || "—"} subtext={metrics?.repaymentFrequency || "per period · minimum"} highlighted />
                <MetricCard label="Total Interest" value={metrics?.totalInterest || "—"} subtext="over full loan term" />
                <MetricCard label="Interest Saved" value={metrics?.interestSaved || "—"} subtext="with extras & offset" />
                <MetricCard label="Term Saved" value={metrics?.termSaved || "—"} subtext={metrics?.termSavedSub || "payoff acceleration"} />
            </div>

            <Card style={{ borderRadius: 16, borderColor: "#e8e8e8" }} styles={{ body: { padding: 24 } }}>
                {!results ? (
                    <div style={{ minHeight: 240, display: "grid", placeItems: "center", textAlign: "center" }}>
                        <Text type="secondary">Enter a loan amount, interest rate, and term in Edit Inputs to view the projection.</Text>
                    </div>
                ) : viewMode === "Graph" ? (
                    <>
                        <Title level={4} style={{ textAlign: "center", marginBottom: 24, fontWeight: 700, color: "#0f172a" }}>
                            Loan Balance Over Time
                        </Title>
                        <div style={{ width: "100%", height: 380 }}>
                            <ResponsiveContainer>
                                <BarChart data={results.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} interval="preserveStartEnd" />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${Math.round(value / 1000)}K`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    {seriesVisibility.minimumOnly && (
                                        <Bar dataKey="minimumOnly" name="Minimum Only" fill="#2b3b5c" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                    {seriesVisibility.withExtraOffset && (
                                        <Bar dataKey="withExtraOffset" name="With Extra / Offset" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 12, marginTop: 12 }}>
                            {metrics?.chartSummary}
                        </Text>
                        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                            <Button size="small" onClick={() => toggleSeries("withExtraOffset")} style={{ borderRadius: 16, borderColor: "#22c55e", color: seriesVisibility.withExtraOffset ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                                ● With Extra / Offset
                            </Button>
                            <Button size="small" onClick={() => toggleSeries("minimumOnly")} style={{ borderRadius: 16, borderColor: "#2b3b5c", color: seriesVisibility.minimumOnly ? "#2b3b5c" : "#94a3b8", fontWeight: 600 }}>
                                ● Minimum Only
                            </Button>
                        </div>
                        <Text type="secondary" style={{ display: "block", textAlign: "center", fontSize: 11, marginTop: 6 }}>
                            Click a legend pill to show or hide a series
                        </Text>
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: "#22c55e", letterSpacing: "0.5px", marginBottom: 16, textTransform: "uppercase" }}>
                            Amortisation Schedule
                        </Title>
                        <DynamicDataTable
                            columns={TABLE_COLUMNS}
                            data={currentTableData}
                            headerFontSize={12}
                            bodyFontSize={12}
                            showCount={false}
                            size="small"
                            tableProps={{ scroll: { x: "max-content" } }}
                            tableStyle={{ borderRadius: 12 }}
                        />
                    </>
                )}
            </Card>

            <div style={{ marginTop: 16, textAlign: "left" }}>
                <Text type="secondary" style={{ fontSize: 10, letterSpacing: "0.5px", fontWeight: 600 }}>
                    PROJECTED · ALL VALUES IN AUD · INDICATIVE ONLY
                </Text>
            </div>
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width="50vw"
                title={renderTitleBlock({ title: "Loan Simulator Inputs", icon: "🏠" })}
            >
                <LoanSimulatorForm modalData={{ closeModal: () => setOpenModal(false) }} />
            </AppModal>
            <AnalysisModal
                content={analysisContent}
                subtitle={analysisContent.subtitle}
                openAnalysisModal={openAnalysisModal}
                onClose={() => { setOpenAnalysisModal(false) }}
                disclaimer={
                    "The figures shown are projections and estimates based on the assumptions and inputs provided. They are <strong>not guaranteed</strong> and actual outcomes may differ materially due to investment returns, legislative changes, taxation rules, inflation, contribution caps, market volatility, or personal circumstances. This is general information only and does not constitute personal financial product advice. Past performance is not a reliable indicator of future performance. For formal advice tailored to the client's specific situation, refer to the calculator's detailed output and the Record of Advice."
                }
            />
        </div>
    );
};

function MetricCard({ label, value, subtext, highlighted = false }) {
    return (
        <Card
            style={{
                borderRadius: 12,
                borderColor: highlighted ? "#bbf7d0" : "#e8e8e8",
                backgroundColor: highlighted ? "#f0fdf4" : undefined,
                height: "100%",
            }}
            styles={{ body: { padding: 16 } }}
        >
            <Text type={highlighted ? undefined : "secondary"} style={{ fontSize: 13, color: highlighted ? "#374151" : undefined }}>
                {label}
            </Text>
            <Title level={2} style={{ margin: "4px 0", fontWeight: highlighted ? 700 : 600, color: highlighted ? "#16a34a" : "#1f2937" }}>
                {value}
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>{subtext}</Text>
        </Card>
    );
}

export default LoanSimulator;
