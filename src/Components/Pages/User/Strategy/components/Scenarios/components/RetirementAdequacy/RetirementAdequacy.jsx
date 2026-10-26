import React, { useMemo, useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useAtom } from 'jotai';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import RetirementAdequacyForm from './RetirementAdequacyForm.jsx';
import { SelectedReviewAllData } from '../../../../../../../../store/authState';
import { useGetReviewName } from '../../../../../../../../hooks/useUserDashboardData';
import AnalysisModal from '../AnalysisModal/AnalysisModal.jsx';

const { Text, Title } = Typography;

const ABP_MIN_RATES = [
    { maxAge: 65, rate: 0.04 },
    { maxAge: 75, rate: 0.05 },
    { maxAge: 80, rate: 0.06 },
    { maxAge: 85, rate: 0.07 },
    { maxAge: 90, rate: 0.09 },
    { maxAge: 95, rate: 0.11 },
    { maxAge: 999, rate: 0.14 },
];

const DEFAULT_RISK_RETURNS = {
    Cash: 3,
    Conservative: 3.8,
    'Moderately Conservative': 4.5,
    Balanced: 5,
    Growth: 6,
    'High Growth': 6.5,
};

const AGE_PENSION_AGE = 67;
const AGE_PENSION_RATES = {
    singleBaseFn: 1100.3,
    singlePharmFn: 86.5,
    singleCleanFn: 14.1,
    coupleBaseFn: 829.4,
    couplePharmFn: 65.2,
    coupleCleanFn: 10.6,
    singleHomeLower: 333000,
    coupleHomeLower: 499000,
    singleRentLower: 600000,
    coupleRentLower: 766000,
    incomeFreeSingleFn: 226,
    incomeFreeCoupleFn: 396,
    deemSingleThreshold: 66800,
    deemCoupleThreshold: 110600,
    deemLowerRate: 0.0125,
    deemUpperRate: 0.0325,
    assetsTaperPerThousandFn: 3,
};

const parseNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
    `$${Math.round(value || 0).toLocaleString('en-AU')}`;

function getDate(value) {
    if (!value) return null;
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getAgeAtDate(dateOfBirth, projectionDate) {
    const dob = getDate(dateOfBirth);
    if (!dob || !projectionDate) return null;

    let age = projectionDate.getFullYear() - dob.getFullYear();
    if (
        projectionDate.getMonth() < dob.getMonth() ||
        (projectionDate.getMonth() === dob.getMonth() && projectionDate.getDate() < dob.getDate())
    ) {
        age -= 1;
    }
    return age >= 0 ? age : null;
}

function getFinancialYearStart() {
    const today = new Date();
    const year = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(year, 6, 1);
}

function getMinimumDrawdownRate(age) {
    return ABP_MIN_RATES.find(({ maxAge }) => age < maxAge)?.rate ?? 0.14;
}

function calculatePersonProjection(person = {}, pensionStartDate, { applyAdjustments = true } = {}) {
    const startingBalance = Math.max(0, parseNumber(person.accountBasedPensionTotal));
    const nccTopUp = applyAdjustments ? Math.max(0, parseNumber(person.nccTopUp)) : 0;
    const topUpYearValue = parseInt(String(person.nccTopUpYear || '').replace(/\D/g, ''), 10);
    const topUpYear = Math.min(40, Math.max(1, topUpYearValue || 1));
    const withdrawal = applyAdjustments ? Math.max(0, parseNumber(person.withdrawalAmount)) : 0;
    const explicitReturn = parseNumber(person.investmentReturn, NaN);
    const returnRate = (Number.isFinite(explicitReturn)
        ? explicitReturn
        : DEFAULT_RISK_RETURNS[person.riskGoal] ?? DEFAULT_RISK_RETURNS.Balanced) / 100;
    const firstYearDate = getDate(pensionStartDate) || getFinancialYearStart();
    const dateOfBirth = person.DOB;
    const ageAtStart = getAgeAtDate(dateOfBirth, firstYearDate);
    const initialBalance = Math.max(
        0,
        startingBalance - withdrawal + (topUpYear === 1 ? nccTopUp : 0),
    );

    if (initialBalance <= 0 || ageAtStart === null) {
        return { rows: [], startingBalance, nccTopUp, withdrawal, hasAdjustments: nccTopUp > 0 || withdrawal > 0 };
    }

    const firstFinancialYear = firstYearDate.getFullYear();
    const rows = [];
    let balance = startingBalance;

    for (let yearIndex = 0; yearIndex < 40 && balance > 0; yearIndex += 1) {
        const year = yearIndex + 1;
        const topUp = year === topUpYear ? nccTopUp : 0;
        const oneOffWithdrawal = year === 1 ? withdrawal : 0;
        const openingBalance = balance;
        const adjustedOpening = Math.max(0, openingBalance + topUp - oneOffWithdrawal);
        const age = ageAtStart + yearIndex;
        const minimumRate = getMinimumDrawdownRate(age);
        const earnings = adjustedOpening * returnRate;
        const annualPayment = Math.min(adjustedOpening + earnings, adjustedOpening * minimumRate);
        const closingBalance = Math.max(0, adjustedOpening + earnings - annualPayment);

        rows.push({
            key: String(year),
            year,
            financialYear: firstFinancialYear + year,
            age,
            openingBalance,
            topUp,
            oneOffWithdrawal,
            earnings,
            minimumRate,
            annualPayment,
            closingBalance,
        });

        balance = closingBalance;
        if (balance <= 0) break;
    }

    return {
        rows,
        startingBalance,
        nccTopUp,
        withdrawal,
        hasAdjustments: nccTopUp > 0 || withdrawal > 0,
    };
}

function buildMetrics(rows, startingBalance, nccTopUp, withdrawal, sustainedText = 'until depleted') {
    const firstRow = rows[0];
    const totalDrawn = rows.reduce((total, row) => total + row.annualPayment, 0);
    const effectiveStartingBalance = firstRow
        ? Math.max(0, firstRow.openingBalance + firstRow.topUp - firstRow.oneOffWithdrawal)
        : 0;

    let startingSubtext = `${formatCurrency(startingBalance)} starting balance`;
    if (nccTopUp > 0 && withdrawal > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} + ${formatCurrency(nccTopUp)} top-up − ${formatCurrency(withdrawal)} withdrawal`;
    } else if (nccTopUp > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} + ${formatCurrency(nccTopUp)} top-up`;
    } else if (withdrawal > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} − ${formatCurrency(withdrawal)} withdrawal`;
    }

    return {
        startingBalance: formatCurrency(effectiveStartingBalance),
        startingSubtext,
        annualDrawdown: formatCurrency(firstRow?.annualPayment || 0),
        drawdownSubtext: 'first-year minimum payment',
        yearsSustained: rows.length ? String(rows.length) : '—',
        sustainedSubtext: rows.at(-1)?.closingBalance > 100 ? 'still has a balance' : sustainedText,
        totalDrawn: formatCurrency(totalDrawn),
        drawnSubtext: 'total minimum payments',
    };
}

function calculateProjection(person, pensionStartDate, baselinePerson = person) {
    const adjusted = calculatePersonProjection(person, pensionStartDate);
    const baseline = adjusted.hasAdjustments
        ? calculatePersonProjection(baselinePerson, pensionStartDate, { applyAdjustments: false })
        : null;
    const rows = adjusted.rows.map((row, index) => ({
        ...row,
        balance: row.closingBalance,
        currentBalance: baseline
            ? baseline.rows[index]?.closingBalance ?? 0
            : row.closingBalance,
        yearLabel: `Yr ${row.year}`,
    }));

    return {
        rows,
        metrics: buildMetrics(
            adjusted.rows,
            adjusted.startingBalance,
            adjusted.nccTopUp,
            adjusted.withdrawal,
        ),
        hasAdjustments: adjusted.hasAdjustments,
    };
}

function calculateAgePension(assessableAssets, financialAssets, isCouple, homeowner, indexation, eligibleCount) {
    const rates = AGE_PENSION_RATES;
    const fullSingle = rates.singleBaseFn * 26 * indexation;
    const fullCoupleEach = rates.coupleBaseFn * 26 * indexation;
    const fullPension = isCouple ? fullCoupleEach * 2 : fullSingle;
    const lowerThreshold = homeowner
        ? (isCouple ? rates.coupleHomeLower : rates.singleHomeLower)
        : (isCouple ? rates.coupleRentLower : rates.singleRentLower);
    const assetsReduction = Math.min(
        Math.max(0, assessableAssets - lowerThreshold * indexation) / 1000
            * rates.assetsTaperPerThousandFn * 26,
        fullPension,
    );
    const deemingThreshold = (isCouple ? rates.deemCoupleThreshold : rates.deemSingleThreshold) * indexation;
    const deemedIncome = Math.min(financialAssets, deemingThreshold) * rates.deemLowerRate
        + Math.max(0, financialAssets - deemingThreshold) * rates.deemUpperRate;
    const incomeFreeArea = (isCouple ? rates.incomeFreeCoupleFn : rates.incomeFreeSingleFn) * 26 * indexation;
    const incomeReduction = Math.min(Math.max(0, deemedIncome - incomeFreeArea) * 0.5, fullPension);
    const basis = Math.max(0, Math.min(fullPension - assetsReduction, fullPension - incomeReduction));
    const supplements = basis > 0
        ? (isCouple
            ? (rates.couplePharmFn + rates.coupleCleanFn) * 26 * 2
            : (rates.singlePharmFn + rates.singleCleanFn) * 26) * indexation
        : 0;
    const eligibleScale = isCouple ? Math.min(2, eligibleCount) / 2 : Number(eligibleCount > 0);

    return {
        deemedIncome,
        pension: (basis + supplements) * eligibleScale,
    };
}

function calculateCashflowProjection(people, pensionStartDate, projection = {}) {
    const maxYears = Math.max(0, ...people.map(({ rows }) => rows.length));
    const firstYearDate = getDate(pensionStartDate) || getFinancialYearStart();
    const startingAges = people.map(({ DOB }) => getAgeAtDate(DOB, firstYearDate));
    const isCouple = projection.isCouple;
    const homeowner = String(projection.homeOwnership || '').toLowerCase() === 'homeowner';
    const personalAssets = Math.max(0, parseNumber(projection.personalAssets));
    const initialOtherFinancialInvestments = Math.max(0, parseNumber(projection.otherFinancialInvestments));
    const thresholdIndexation = Math.max(0, parseNumber(projection.thresholdIndexation, 2.5)) / 100;
    const expenses = Math.max(0, parseNumber(projection.annualLivingExpenses));
    const expensesIndexation = Math.max(0, parseNumber(projection.expensesIndexation, 2.5)) / 100;
    const includeAgePension = projection.includeAgePension;
    let otherFinancialInvestments = initialOtherFinancialInvestments;
    const rows = Array.from({ length: maxYears }, (_, index) => {
        const client = people[0]?.rows[index];
        const partner = people[1]?.rows[index];
        const combined = (field) => (client?.[field] || 0) + (partner?.[field] || 0);
        const age = (startingAge) => startingAge === null ? '—' : startingAge + index;
        const clientAge = startingAges[0] === null ? null : startingAges[0] + index;
        const partnerAge = startingAges[1] === null ? null : startingAges[1] + index;
        const closingBalance = combined('closingBalance');
        const indexation = (1 + thresholdIndexation) ** index;
        const expenseForYear = expenses * (1 + expensesIndexation) ** index;
        otherFinancialInvestments *= 1 + AGE_PENSION_RATES.deemUpperRate;
        const assessableAssets = closingBalance + personalAssets + otherFinancialInvestments;
        const financialAssets = closingBalance + otherFinancialInvestments;
        const eligibleCount = Number(clientAge !== null && clientAge >= AGE_PENSION_AGE)
            + Number(isCouple && partnerAge !== null && partnerAge >= AGE_PENSION_AGE);
        const agePension = calculateAgePension(
            assessableAssets,
            financialAssets,
            isCouple,
            homeowner,
            indexation,
            eligibleCount,
        );
        const pension = includeAgePension ? agePension.pension : 0;
        const annualDrawdown = combined('annualPayment');
        const totalIncome = annualDrawdown + pension;
        const surplus = expenses > 0 ? totalIncome - expenseForYear : null;

        return {
            key: String(index + 1),
            year: index + 1,
            financialYear: client?.financialYear ?? partner?.financialYear,
            age: `${age(startingAges[0])} / ${age(startingAges[1])}`,
            closingBalance,
            assessableAssets,
            deemedIncome: agePension.deemedIncome,
            agePension: eligibleCount ? pension : null,
            annualPayment: annualDrawdown,
            totalIncome,
            surplus,
            balance: closingBalance,
            yearLabel: `Yr ${index + 1}`,
        };
    });

    const total = (field) => people.reduce((sum, person) => sum + (person[field] || 0), 0);
    const totalTopUp = people.reduce((sum, person) => sum + (person.nccTopUp || 0), 0);
    const totalWithdrawal = people.reduce((sum, person) => sum + (person.withdrawal || 0), 0);
    const totalStarting = total('startingBalance');
    const totalAdjustedStarting = people.reduce((sum, person) => {
        const row = person.rows[0];
        return sum + (row ? Math.max(0, row.openingBalance + row.topUp - row.oneOffWithdrawal) : 0);
    }, 0);

    return {
        rows,
        metrics: {
            ...buildMetrics(rows, totalStarting, totalTopUp, totalWithdrawal, 'projection complete'),
            startingBalance: formatCurrency(totalAdjustedStarting),
            startingSubtext: 'combined client and partner balances',
            drawdownSubtext: 'first-year combined payment',
            yearsSustained: rows.length ? String(rows.length) : '—',
            totalDrawn: formatCurrency(rows.reduce((sum, row) => sum + row.annualPayment, 0)),
        },
        hasAdjustments: people.some((person) => person.hasAdjustments),
    };
}

const columns = [
    { title: 'Financial Year', dataIndex: 'financialYear', key: 'financialYear', align: 'center' },
    { title: 'Age', dataIndex: 'age', key: 'age', align: 'center' },
    { title: 'Opening Balance', dataIndex: 'openingBalance', key: 'openingBalance', align: 'right', render: formatCurrency },
    { title: 'Top-Up', dataIndex: 'topUp', key: 'topUp', align: 'right', render: formatCurrency },
    { title: 'One-Off Withdrawal', dataIndex: 'oneOffWithdrawal', key: 'oneOffWithdrawal', align: 'right', render: (value) => <span style={{ color: '#dc2626' }}>{formatCurrency(value)}</span> },
    { title: 'Earnings', dataIndex: 'earnings', key: 'earnings', align: 'right', render: (value) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(value)}</span> },
    { title: 'Min %', dataIndex: 'minimumRate', key: 'minimumRate', align: 'right', render: (value) => value === null ? '—' : `${(value * 100).toFixed(1)}%` },
    { title: 'Annual Payment', dataIndex: 'annualPayment', key: 'annualPayment', align: 'right', render: (value) => <span style={{ color: '#b45309' }}>{formatCurrency(value)}</span> },
    { title: 'Closing Balance', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (value) => <span style={{ color: '#2563eb', fontWeight: 700 }}>{formatCurrency(value)}</span> },
];

const cashflowColumns = [
    { title: 'Year', dataIndex: 'financialYear', key: 'financialYear', align: 'center' },
    { title: 'Age', dataIndex: 'age', key: 'age', align: 'center' },
    { title: 'Closing ABP', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (value) => value > 0 ? formatCurrency(value) : '—' },
    { title: 'Assessable Assets', dataIndex: 'assessableAssets', key: 'assessableAssets', align: 'right', render: formatCurrency },
    { title: 'Deemed Income', dataIndex: 'deemedIncome', key: 'deemedIncome', align: 'right', render: formatCurrency },
    { title: 'Age Pension (p.a.)', dataIndex: 'agePension', key: 'agePension', align: 'right', render: (value) => value === null ? <Text type="secondary">— pre-{AGE_PENSION_AGE}</Text> : value > 0 ? formatCurrency(value) : '—' },
    { title: 'ABP Drawdown', dataIndex: 'annualPayment', key: 'annualPayment', align: 'right', render: formatCurrency },
    { title: 'Total Income (p.a.)', dataIndex: 'totalIncome', key: 'totalIncome', align: 'right', render: formatCurrency },
    { title: 'Surplus / (Shortfall)', dataIndex: 'surplus', key: 'surplus', align: 'right', render: (value) => value === null ? '—' : <span style={{ color: value < 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>{value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}</span> },
];

const RetirementAdequacy = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
    const [selectedReviewAllData] = useAtom(SelectedReviewAllData);
    const getReviewName = useGetReviewName();

    const headingStyle = { fontFamily: "Georgia, serif" };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const calculatedData = useMemo(() => {
        const section = selectedReviewAllData?.retirementAdequacyDetails || {};
        const startDate = section.pensionStartDate;
        const client = {
            ...section.client,
            DOB: section.client?.DOB || selectedReviewAllData?.personalDetails?.client?.DOB,
        };
        const partner = {
            ...section.partner,
            DOB: section.partner?.DOB || selectedReviewAllData?.personalDetails?.partner?.DOB,
        };
        const clientProjection = calculateProjection(client, startDate);
        const partnerProjection = calculateProjection(partner, startDate);

        if (selectedProfile === 'partner') return partnerProjection;
        if (selectedProfile === 'cashflow') {
            const agePensionProjection = section.agePensionProjection || {};
            const relationshipStatus = String(agePensionProjection.relationshipStatus || 'Auto').toLowerCase();
            return calculateCashflowProjection([
                { ...clientProjection, DOB: client.DOB, startingBalance: parseNumber(client.accountBasedPensionTotal), nccTopUp: parseNumber(client.nccTopUp), withdrawal: parseNumber(client.withdrawalAmount) },
                { ...partnerProjection, DOB: partner.DOB, startingBalance: parseNumber(partner.accountBasedPensionTotal), nccTopUp: parseNumber(partner.nccTopUp), withdrawal: parseNumber(partner.withdrawalAmount) },
            ], startDate, {
                ...agePensionProjection,
                isCouple: relationshipStatus === 'couple'
                    || (relationshipStatus !== 'single' && selectedReviewAllData?.personalDetails?.owner?.includes('partner')),
                includeAgePension: section.includeAgePension
                    ?? agePensionProjection.includeAgePension
                    ?? false,
            });
        }
        return clientProjection;
    }, [selectedProfile, selectedReviewAllData]);

    const currentMetrics = calculatedData.metrics;
    const currentChartData = calculatedData.rows;
    const currentTableData = calculatedData.rows;
    const currentColumns = selectedProfile === 'cashflow' ? cashflowColumns : columns;
    const hasData = currentChartData.length > 0;

    const analysisContent = useMemo(() => {
        const section = selectedReviewAllData?.retirementAdequacyDetails || {};
        const isHousehold = selectedProfile === 'cashflow';
        const person = section[selectedProfile] || {};
        const storedName = person.preferredName || getReviewName(selectedProfile);
        const normalizedName = String(storedName || '').trim();
        const personName = normalizedName && !['client', 'partner'].includes(normalizedName.toLowerCase())
            ? normalizedName.split(/\s+/)[0]
            : selectedProfile === 'partner' ? 'your partner' : 'you';
        const years = currentChartData.length;
        const finalBalance = currentChartData.at(-1)?.closingBalance ?? 0;
        const sustainable = years >= 40 && finalBalance > 0;
        const duration = sustainable
            ? 'over 40 years (still funded at the projection limit)'
            : `about ${years} ${years === 1 ? 'year' : 'years'}`;
        const annualPayment = parseNumber(currentChartData[0]?.annualPayment);
        const analysis = [];
        const readAloud = [];

        if (!years) {
            analysis.push('Enter a pension balance and date of birth to generate a retirement income projection.');
            readAloud.push('Enter a pension balance and date of birth to generate a retirement income projection.');
        } else if (isHousehold) {
            analysis.push(
                `The combined account-based pension starts at ${currentMetrics.startingBalance}, with a first-year minimum payment of ${formatCurrency(annualPayment)}. The projection is funded for ${duration}, ending with ${formatCurrency(finalBalance)}.`,
            );
            readAloud.push(
                `The combined account-based pension starts at ${currentMetrics.startingBalance}, with a first-year minimum payment of ${formatCurrency(annualPayment)}. It is projected to last ${duration}, with a final balance of ${formatCurrency(finalBalance)}.`,
            );
        } else {
            const explicitReturn = parseNumber(person.investmentReturn, NaN);
            const returnRate = Number.isFinite(explicitReturn)
                ? explicitReturn
                : DEFAULT_RISK_RETURNS[person.riskGoal] ?? DEFAULT_RISK_RETURNS.Balanced;
            const returnLabel = `${Number(returnRate.toFixed(1))}%`;
            analysis.push(
                `${personName}: ${currentMetrics.startingBalance} at ${returnLabel} annual return · first-year minimum annual pension ${formatCurrency(annualPayment)} · projected to last ${duration}.`,
            );
            readAloud.push(
                `${personName}, your account-based pension of ${currentMetrics.startingBalance}, at a ${returnLabel} annual return and drawing a minimum of ${formatCurrency(annualPayment)} in the first year, is projected to last ${duration}.`,
            );
        }

        const durationColor = sustainable || years >= 25
            ? '#16a34a'
            : years >= 15 ? '#d97706' : '#dc2626';

        return {
            subtitle: isHousehold
                ? '🏦 Household Account-Based Pension Results'
                : `🏦 Account-Based Pension Results for ${personName}`,
            metrics: years
                ? [
                    { label: isHousehold ? 'Combined balance' : 'Starting balance', value: currentMetrics.startingBalance },
                    { label: 'First-year pension', value: formatCurrency(annualPayment) },
                    { label: 'Years sustained', value: sustainable ? '40+ yrs' : `${years} yrs`, color: durationColor },
                    { label: 'Final balance', value: formatCurrency(finalBalance) },
                ]
                : [],
            analysis,
            readAloud: readAloud.join(' '),
        };
    }, [currentChartData, currentMetrics, getReviewName, selectedProfile, selectedReviewAllData]);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Profile Selector (Client, Partner, Cashflow) matching image styling */}
                <Segmented
                    value={selectedProfile}
                    onChange={(val) => setSelectedProfile(val)}
                    options={[
                        { label: getReviewName('client'), value: 'client', icon: '👤' },
                        ...(selectedReviewAllData?.personalDetails?.owner?.includes("partner")
                            ? [{ label: getReviewName("partner"), value: 'partner', icon: "👥" }]
                            : []),
                        { label: 'Cashflow', value: 'cashflow', icon: '🏛️' },
                    ]}
                    style={{ padding: 3, backgroundColor: '#f3f4f6', borderRadius: 8 }}
                />

                <Space size={12}>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: 'Graph', value: 'Graph', icon: '📈' },
                            { label: 'Table', value: 'Table', icon: '📋' },
                        ]}
                        style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                    />

                    <Button
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff', borderRadius: 8, fontWeight: 600 }}
                        icon={"🧠"}
                        onClick={() => setOpenAnalysisModal(true)}
                    >
                        Analyse
                    </Button>

                    <Button
                        type="primary"
                        icon={"✏️"}
                        style={{ backgroundColor: '#22c55e', borderColor: '#22c55e', borderRadius: 8, fontWeight: 600 }}
                        onClick={() => setOpenModal(true)}
                    >
                        Edit Inputs
                    </Button>
                </Space>
            </div>

            {/* KPI Cards Grid */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Card 1: Starting Balance */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Starting Balance</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.startingBalance}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.startingSubtext}</Text>
                    </Card>
                </Col>

                {/* Card 2: Annual Drawdown */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Annual Drawdown</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.annualDrawdown}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.drawdownSubtext}</Text>
                    </Card>
                </Col>

                {/* Card 3: Years Sustained */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Years Sustained</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.yearsSustained}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.sustainedSubtext}</Text>
                    </Card>
                </Col>

                {/* Card 4: Total Drawn (Green Highlighted Border & Text matching UI) */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#16a34a' }}>Total Drawn</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#16a34a' }}>
                                {currentMetrics.totalDrawn}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>{currentMetrics.drawnSubtext}</Text>
                    </Card>
                </Col>
            </Row>

            {/* Graph vs Table Main Container */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8', minHeight: 380 }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Pension Balance Projection
                        </Title>

                        {hasData ? (
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => formatCurrency(val)} />
                                        <Tooltip formatter={(val, name) => [formatCurrency(val), name]} />
                                        {calculatedData.hasAdjustments && (
                                            <Legend />
                                        )}
                                        {calculatedData.hasAdjustments && (
                                            <Bar dataKey="currentBalance" name="Current Balance" fill="#2b3a5e" radius={[3, 3, 0, 0]} maxBarSize={24} />
                                        )}
                                        <Bar
                                            dataKey="balance"
                                            name={calculatedData.hasAdjustments ? 'Adjusted Balance' : 'Pension Balance'}
                                            fill="#22c55e"
                                            radius={[3, 3, 0, 0]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            /* Empty state matching the reference image display */
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>
                                    Enter pension details to see projection
                                </Text>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            {selectedProfile === 'cashflow' ? 'CASHFLOW PROJECTION BREAKDOWN' : 'PENSION PROJECTION BREAKDOWN'}
                        </Title>

                        <DynamicDataTable
                            columns={currentColumns}
                            data={currentTableData}
                            headerFontSize={12}
                            bodyFontSize={12}
                            showCount={false}
                            size="small"
                            tableProps={{
                                scroll: { x: 'max-content' },
                                locale: {
                                    emptyText: 'Enter pension balance and date of birth to see projection',
                                },
                            }}
                            tableStyle={{ borderRadius: 12 }}
                        />
                    </>
                )}
            </Card>

            {/* Inputs Modal */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Retirement & Pension Inputs",
                    icon: "💸",
                })}
            >
                <RetirementAdequacyForm modalData={{ closeModal: () => { setOpenModal(false) } }} />
            </AppModal>
            <AnalysisModal
                content={analysisContent}
                subtitle={analysisContent.subtitle}
                openAnalysisModal={openAnalysisModal}
                onClose={() => { setOpenAnalysisModal(false) }}
            />
        </div>
    );
};

export default RetirementAdequacy;