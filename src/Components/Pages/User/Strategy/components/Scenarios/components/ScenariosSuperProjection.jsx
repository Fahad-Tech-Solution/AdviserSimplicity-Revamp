import React, { useState, useMemo } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../hooks/useTitleBlock';
import ScenariosSuperProjectionForm from './ScenariosSuperProjectionForm';
import { useGetReviewName } from '../../../../../../../hooks/useUserDashboardData';
import { SelectedReviewAllData } from '../../../../../../../store/authState';
import { useAtom } from 'jotai';

const { Text, Title } = Typography;

const CONCESSIONAL_CAP = 32500;
const CONTRIBUTION_TAX_RATE = 0.15;
const INSURANCE_NET_COST = 0.85;

const DEFAULT_RISK_RETURNS = {
    Cash: 3,
    Conservative: 3.8,
    'Moderately Conservative': 4.5,
    Balanced: 5,
    Growth: 6,
    'High Growth': 6.5,
};

// Helper function to convert numeric strings like "$30,000" or "2.5%" to Float
const parseNum = (val, defaultVal = 0) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'number') return Number.isFinite(val) ? val : defaultVal;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? defaultVal : parsed;
};

// Currency Formatter Helper
const formatCurrency = (val) => {
    if (!Number.isFinite(val)) return '$0';
    const isNegative = val < 0;
    const formatted = Math.abs(Math.round(val)).toLocaleString('en-US');
    return isNegative ? `-$${formatted}` : `$${formatted}`;
};

const formatDifference = (value) => `${value >= 0 ? '+' : ''}${formatCurrency(value)}`;

const getAgeFromDob = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }
    return age;
};

const getInsuranceIndexationRate = (value, age) => {
    const selectedValue = parseNum(value, 0);
    if (selectedValue === 0) {
        if (!age || age < 40) return 8;
        if (age < 60) return 12;
        return 18;
    }
    return Math.max(0, selectedValue - 1);
};

// Mirrors calcSuperProjection in AdviserSimplicity_Review.html.
const calculateProjections = (personData, currentAge) => {
    if (!personData) return { metrics: {}, chart: [], table: [] };

    const startingBalance = parseNum(personData.superAnnuationTotal, 0);
    const annualIncome = parseNum(personData.incomeFromBusinessTotal, 0);
    const sgcPercent = parseNum(personData.sgcPercent, 12);
    const salarySacrifice = parseNum(personData.ssPersonalConcessional, 0);
    const annualNcc = parseNum(personData.nonConcessional, 0);
    const lumpSumNcc = parseNum(personData.lumpSumNcc, 0);
    const riskReturn = DEFAULT_RISK_RETURNS[personData.riskGoal] ?? 5;
    const returnRate = parseNum(personData.investmentReturn, riskReturn) / 100;
    const salaryGrowthRate = parseNum(personData.salaryGrowth, 2) / 100;
    const years = Math.max(0, Math.floor(parseNum(personData.projectionPeriod, 10)));
    const grossInsurancePremium = parseNum(personData.insurancePremium, 0);
    const premiumIndexationRate = getInsuranceIndexationRate(personData.premiumIndexation, currentAge) / 100;
    const requestedPremiumYears = parseNum(personData.premiumYears, 0);
    const premiumYears = requestedPremiumYears > 0
        ? Math.min(Math.floor(requestedPremiumYears), years)
        : years;
    const annualInflationRate = 0.025;
    const annualNccAllowed = currentAge >= 75 ? 0 : annualNcc;
    const finalLumpSumNcc = years === 0 || currentAge + years >= 75 ? 0 : lumpSumNcc;
    let currentIncome = annualIncome;
    let currentPremium = grossInsurancePremium * INSURANCE_NET_COST;

    const table = [];
    const chart = [];
    let balanceWith = startingBalance;
    let balanceWithout = startingBalance;
    let balanceNoPremiums = startingBalance;
    let totalContributions = 0;

    for (let yr = 1; yr <= years; yr++) {
        const sgContribution = currentIncome * (sgcPercent / 100);
        const concessionalContribution = Math.min(
            sgContribution + salarySacrifice,
            CONCESSIONAL_CAP,
        );
        const actualSalarySacrifice = Math.max(0, concessionalContribution - sgContribution);
        const concessionalTax = (sgContribution + actualSalarySacrifice) * CONTRIBUTION_TAX_RATE;
        const annualInsurance = yr <= premiumYears
            ? currentPremium * Math.pow(1 + premiumIndexationRate, yr - 1)
            : 0;
        const nccThisYear = annualNccAllowed;
        const lumpSumThisYear = yr === years ? finalLumpSumNcc : 0;

        const earningsWith = (balanceWith + sgContribution + actualSalarySacrifice) * returnRate;
        const closingWith = balanceWith + sgContribution + actualSalarySacrifice +
            earningsWith - concessionalTax + nccThisYear + lumpSumThisYear - annualInsurance;

        const earningsWithout = (balanceWithout + sgContribution) * returnRate;
        const taxWithout = sgContribution * CONTRIBUTION_TAX_RATE;
        const closingWithout = balanceWithout + sgContribution + earningsWithout - taxWithout - annualInsurance;

        const earningsNoPremiums = (balanceNoPremiums + sgContribution + actualSalarySacrifice) * returnRate;
        const closingNoPremiums = balanceNoPremiums + sgContribution + actualSalarySacrifice +
            earningsNoPremiums - concessionalTax + nccThisYear + lumpSumThisYear;
        const closingToday = closingWith / Math.pow(1 + annualInflationRate, yr);
        const difference = closingWith - closingWithout;
        const contributionTotal = sgContribution + actualSalarySacrifice + nccThisYear + lumpSumThisYear;

        totalContributions += contributionTotal;

        table.push({
            key: String(yr),
            year: yr,
            openingBalance: formatCurrency(balanceWith),
            sg: formatCurrency(sgContribution),
            salarySacrifice: formatCurrency(actualSalarySacrifice),
            ncc: formatCurrency(nccThisYear + lumpSumThisYear),
            earnings: formatCurrency(earningsWith),
            contribTax: `-${formatCurrency(concessionalTax)}`,
            insurance: annualInsurance > 0 ? `-${formatCurrency(annualInsurance)}` : '$0',
            closingWith: formatCurrency(closingWith),
            closingToday: formatCurrency(closingToday),
            closingNoIns: formatCurrency(closingNoPremiums),
            closingWithout: formatCurrency(closingWithout),
            difference: formatDifference(difference),
        });

        chart.push({
            year: `Yr ${yr}`,
            withStrategy: Math.round(closingWith),
            withoutInsurance: Math.round(closingNoPremiums),
            minimumSG: Math.round(closingWithout),
        });

        balanceWith = closingWith;
        balanceWithout = closingWithout;
        balanceNoPremiums = closingNoPremiums;
        currentIncome *= 1 + salaryGrowthRate;
    }

    const finalWith = balanceWith;
    const finalWithout = balanceWithout;
    const finalNoPremiums = balanceNoPremiums;
    const projectedBalance = formatCurrency(finalWith);
    const balanceWithoutFormatted = formatCurrency(finalWithout);
    const realBalance = formatCurrency(finalWith / Math.pow(1 + annualInflationRate, years));

    return {
        metrics: {
            projectedBalance,
            todayBalance: `${realBalance} in today's $`,
            balanceWithout: balanceWithoutFormatted,
            totalContributions: formatCurrency(totalContributions),
            insuranceCost: formatCurrency(finalNoPremiums - finalWith),
            strategyGain: formatCurrency(finalWith - finalWithout),
            yr10Summary: `Yr ${years}: ${projectedBalance} (with) vs ${balanceWithoutFormatted} (without)`,
        },
        chart,
        table
    };
};

// Table Column Definitions with stylized renders
const columns = [
    { title: 'Year', dataIndex: 'year', key: 'year', align: 'center' },
    { title: 'Opening Balance', dataIndex: 'openingBalance', key: 'openingBalance', align: 'right' },
    { title: 'SG', dataIndex: 'sg', key: 'sg', align: 'right' },
    { title: 'Salary Sacrifice', dataIndex: 'salarySacrifice', key: 'salarySacrifice', align: 'right' },
    { title: 'NCC', dataIndex: 'ncc', key: 'ncc', align: 'right' },
    { title: 'Earnings', dataIndex: 'earnings', key: 'earnings', align: 'right', render: (val) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{val}</span> },
    { title: 'Contrib. Tax', dataIndex: 'contribTax', key: 'contribTax', align: 'right', render: (val) => <span style={{ color: '#dc2626' }}>{val}</span> },
    { title: 'Insurance', dataIndex: 'insurance', key: 'insurance', align: 'right', render: (val) => <span style={{ color: '#dc2626' }}>{val}</span> },
    { title: 'Closing (With)', dataIndex: 'closingWith', key: 'closingWith', align: 'right', render: (val) => <span style={{ color: '#2563eb', fontWeight: 700 }}>{val}</span> },
    { title: "Closing (Today's $)", dataIndex: 'closingToday', key: 'closingToday', align: 'right', render: (val) => <span style={{ color: '#4b5563' }}>{val}</span> },
    { title: 'Closing (No Ins.)', dataIndex: 'closingNoIns', key: 'closingNoIns', align: 'right', render: (val) => <span style={{ color: '#d97706', fontWeight: 600 }}>{val}</span> },
    { title: 'Closing (Without)', dataIndex: 'closingWithout', key: 'closingWithout', align: 'right' },
    { title: 'Difference', dataIndex: 'difference', key: 'difference', align: 'right', render: (val) => <span style={{ color: '#16a34a', fontWeight: 700 }}>{val}</span> },
];

const ScenariosSuperProjection = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);
    const [selectedReviewAllData] = useAtom(SelectedReviewAllData);

    const getReviewName = useGetReviewName();

    const headingStyle = { fontFamily: "Georgia, serif" };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const [seriesVisibility, setSeriesVisibility] = useState({
        withStrategy: true,
        withoutInsurance: false,
        minimumSG: true,
    });

    const toggleSeries = (key) => {
        setSeriesVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Dynamic Calculation derived from Jotai Atom Data
    const calculatedData = useMemo(() => {
        const currentData = selectedReviewAllData?.superannuationDetails?.[selectedProfile] || {};
        const currentAge = getAgeFromDob(selectedReviewAllData?.personalDetails?.[selectedProfile]?.DOB);
        return calculateProjections(currentData, currentAge);
    }, [selectedReviewAllData, selectedProfile]);

    const currentMetrics = calculatedData.metrics;
    const currentChartData = calculatedData.chart;
    const currentTableData = calculatedData.table;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Segmented
                    value={selectedProfile === 'client' ? 'Client' : 'Partner'}
                    onChange={(val) => setSelectedProfile(val.toLowerCase())}
                    options={[
                        { label: getReviewName("client"), value: 'Client', icon: "👤" },
                        ...(selectedReviewAllData?.superannuationDetails?.owner?.includes("partner") || selectedReviewAllData?.owner?.includes("partner") || selectedReviewAllData?.personalDetails?.owner?.includes("partner")
                            ? [{ label: getReviewName("partner"), value: 'Partner', icon: "👥" }]
                            : []),
                    ]}
                    style={{ padding: 2 }}
                />

                <Space size={12}>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: 'Graph', value: 'Graph', icon: "📈" },
                            { label: 'Table', value: 'Table', icon: "📋" },
                        ]}
                        style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                    />

                    <Button
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff', borderRadius: 8, fontWeight: 600 }}
                        icon={"🧠"}
                    >
                        Analyse
                    </Button>

                    <Button
                        type="primary"
                        icon={"✏️"}
                        style={{ backgroundColor: '#22c55e', borderColor: '#22c55e', borderRadius: 8, fontWeight: 600 }}
                        onClick={() => { setOpenModal(true) }}
                    >
                        Edit Inputs
                    </Button>
                </Space>
            </div>

            {/* Dynamic Metric KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Projected Balance</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.projectedBalance || '$0'}
                            </Title>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>at age —</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.todayBalance}</Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Balance Without</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.balanceWithout || '$0'}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Yr 10 — minimum SG only</Text>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Total Contributions</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.totalContributions || '$0'}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>over 10 years</Text>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#fecdd3', backgroundColor: '#fff1f2', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#e11d48' }}>Insurance Cost</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#e11d48' }}>
                                {currentMetrics.insuranceCost || '$0'}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#be123c', fontWeight: 600 }}>total drag on super</Text>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#16a34a' }}>Strategy Gain</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#16a34a' }}>
                                {currentMetrics.strategyGain || '$0'}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>vs. minimum SG only</Text>
                    </Card>
                </Col>
            </Row>

            {/* Dynamic View: Graph vs Table */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Super Balance Projection
                        </Title>

                        <div style={{ width: '100%', height: 360 }}>
                            <ResponsiveContainer>
                                <BarChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${Math.round(val / 1000)}K`} />
                                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />

                                    {seriesVisibility.withStrategy && <Bar dataKey="withStrategy" name="With Contributions" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={16} />}
                                    {seriesVisibility.withoutInsurance && <Bar dataKey="withoutInsurance" name="Without Insurance" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={16} />}
                                    {seriesVisibility.minimumSG && <Bar dataKey="minimumSG" name="Without Contributions" fill="#1e293b" radius={[3, 3, 0, 0]} maxBarSize={16} />}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 11, marginTop: 8 }}>
                            {currentMetrics.yr10Summary}
                        </Text>

                        {/* Interactive Legend Pills */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                            <Button size="small" onClick={() => toggleSeries('withStrategy')} style={{ borderRadius: 16, borderColor: '#22c55e', color: seriesVisibility.withStrategy ? '#16a34a' : '#94a3b8' }}>● With Strategy</Button>
                            <Button size="small" onClick={() => toggleSeries('withoutInsurance')} style={{ borderRadius: 16, borderColor: '#f59e0b', color: seriesVisibility.withoutInsurance ? '#d97706' : '#94a3b8' }}>● Without Insurance</Button>
                            <Button size="small" onClick={() => toggleSeries('minimumSG')} style={{ borderRadius: 16, borderColor: '#1e293b', color: seriesVisibility.minimumSG ? '#0f172a' : '#94a3b8' }}>● Minimum SG Only</Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            YEAR-BY-YEAR PROJECTION
                        </Title>

                        <DynamicDataTable
                            columns={columns}
                            data={currentTableData}
                            headerFontSize={12}
                            bodyFontSize={12}
                            showCount={false}
                            size="small"
                            tableProps={{
                                scroll: { x: 'max-content' }
                            }}
                            tableStyle={{ borderRadius: 12 }}
                        />
                    </>
                )}
            </Card>

            <AppModal
                open={openModal}
                onClose={() => { setOpenModal(false) }}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Superannuation Inputs",
                    icon: "🐷",
                })}
            >
                <ScenariosSuperProjectionForm />
            </AppModal>
        </div>
    );
};

export default ScenariosSuperProjection;