import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, Cell, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useAtomValue } from 'jotai';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import ReviewsTaxPlanningForm from './ReviewsTaxPlanningForm';
import { useGetReviewName } from '../../../../../../../../hooks/useUserDashboardData';
import { SelectedReviewAllData } from '../../../../../../../../store/authState.js';
import { calculateTaxPlanningProfile } from './taxPlanningCalculations.js';
import AnalysisModal from '../AnalysisModal/AnalysisModal.jsx';

const { Text, Title } = Typography;

const TAX_ANALYSIS_DISCLAIMER =
    "The figures shown are projections and estimates based on the assumptions and inputs provided. They are <strong>not guaranteed</strong> and actual outcomes may differ materially due to investment returns, legislative changes, taxation rules, inflation, contribution caps, market volatility, or personal circumstances. This is general information only and does not constitute personal financial product advice. Past performance is not a reliable indicator of future performance. For formal advice tailored to the client's specific situation, refer to the calculator's detailed output and the Record of Advice.";

const formatTaxMoney = (value) => {
    const rounded = Math.round(Number(value) || 0);
    return `${rounded < 0 ? "-$" : "$"}${Math.abs(rounded).toLocaleString("en-AU")}`;
};

const formatTaxSpeechMoney = (value) => {
    const rounded = Math.round(Number(value) || 0);
    if (rounded === 0) return "zero dollars";
    const sign = rounded < 0 ? "negative " : "";
    const absolute = Math.abs(rounded);
    if (absolute >= 1_000_000) {
        const millions = Math.round((absolute / 1_000_000) * 10) / 10;
        return `${sign}${Number.isInteger(millions) ? millions : millions.toFixed(1)} million dollars`;
    }
    if (absolute >= 100_000) return `${sign}${Math.round(absolute / 1_000)} thousand dollars`;
    if (absolute >= 10_000) {
        const thousands = Math.round(absolute / 500) * 500 / 1_000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    if (absolute >= 1_000) {
        const thousands = Math.round(absolute / 100) * 100 / 1_000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    return `${sign}${absolute} dollars`;
};

const formatTaxTableMoney = (value) => {
    const rounded = Math.round(Number(value) || 0);
    const amount = Math.abs(rounded).toLocaleString("en-AU");
    return rounded < 0 ? `($${amount})` : `$${amount}`;
};

const formatCompactTaxMoney = (value) => {
    const amount = Number(value) || 0;
    const sign = amount < 0 ? "-$" : "$";
    const absoluteAmount = Math.abs(amount);
    if (absoluteAmount >= 1_000_000) return `${sign}${(absoluteAmount / 1_000_000).toFixed(1)}M`;
    if (absoluteAmount >= 1_000) return `${sign}${(absoluteAmount / 1_000).toFixed(1)}K`;
    return `${sign}${Math.round(absoluteAmount)}`;
};

const renderTaxLabel = ({ x, y, width, height, value }) => (
    <text
        x={x + width / 2}
        y={value < 0 ? y + height + 18 : y - 8}
        textAnchor="middle"
        fill={value < 0 ? '#f1f2f3' : '#1f2937'}
        fontSize={13}
        fontWeight={700}
    >
        {formatTaxMoney(value)}
    </text>
);

const columns = [
    {
        title: 'Tax Breakdown Item',
        dataIndex: 'label',
        key: 'label',
        render: (value, record) => (
            <span style={{
                fontWeight: record.type === 'section' || record.type === 'total' || record.type === 'grand' ? 700 : 400,
                color: record.type === 'section' ? '#15803d' : undefined,
            }}>
                {value}
            </span>
        ),
        onCell: (record) => record.type === 'section'
            ? { colSpan: 4, style: { backgroundColor: '#f8fafc' } }
            : {},
    },
    {
        title: 'Current',
        dataIndex: 'currentValue',
        key: 'currentValue',
        align: 'right',
        render: (value, record) => record.type === 'section' ? '' : formatTaxTableMoney(value),
        onCell: (record) => record.type === 'section' ? { colSpan: 0 } : {},
    },
    {
        title: 'Proposed',
        dataIndex: 'proposedValue',
        key: 'proposedValue',
        align: 'right',
        render: (value, record) => record.type === 'section' ? '' : formatTaxTableMoney(value),
        onCell: (record) => record.type === 'section' ? { colSpan: 0 } : {},
    },
    {
        title: 'Difference',
        key: 'difference',
        align: 'right',
        render: (_, record) => {
            if (record.type === 'section') return '';
            const difference = (record.proposedValue || 0) - (record.currentValue || 0);
            if (Math.abs(difference) < 0.5) {
                return <span style={{ color: '#9ca3af' }}>$0</span>;
            }
            const beneficial = record.benefitSign === -1
                ? difference < 0
                : record.benefitSign === 1
                    ? difference > 0
                    : null;
            const color = beneficial === null ? '#6b7280' : beneficial ? '#15803d' : '#dc2626';
            const sign = difference > 0 ? '+' : '−';
            return (
                <span style={{ color, fontWeight: 600 }}>
                    {sign}{formatTaxMoney(Math.abs(difference))}
                </span>
            );
        },
        onCell: (record) => record.type === 'section' ? { colSpan: 0 } : {},
    },
];

const ReviewsTaxPlanning = () => {
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState('client');
    const getReviewName = useGetReviewName();
    const selectedReviewAllData = useAtomValue(SelectedReviewAllData);
    const profile = selectedReviewAllData?.taxPlanningDetails?.[selectedProfile];
    const calculation = calculateTaxPlanningProfile(profile);
    const current = calculation.current;
    const proposed = calculation.proposed;
    const currentTax = current?.netPayable ?? 0;
    const proposedTax = proposed?.netPayable ?? 0;
    const taxSavings = current && proposed ? currentTax - proposedTax : 0;
    const personalTaxSavings = current && proposed ? current.totalTax - proposed.totalTax : 0;
    const graphData = [
        { scenario: 'Current', netPayable: currentTax },
        { scenario: 'Proposed', netPayable: proposedTax },
    ];
    const tableData = calculation.tableRows;

    const headingStyle = { fontFamily: "Georgia,serif" };
    const renderTitleBlock = useTitleBlock({ titleStyle: headingStyle });
    const analysisContent = (() => {
        const preferredName = String(getReviewName(selectedProfile) || '').trim();
        const name = preferredName &&
            !['client', 'partner'].includes(preferredName.toLowerCase())
            ? preferredName.split(/\s+/)[0]
            : selectedProfile === 'partner' ? 'your partner' : 'the client';
        const scenarios = [
            { label: 'Current', result: current },
            { label: 'Proposed', result: proposed },
        ].filter(({ result }) => result);
        const subtitle = `💰 Tax Results for ${name}`;

        if (!scenarios.length) {
            const prompt = 'Enter tax information for Current or Proposed to generate the tax analysis.';
            return { subtitle, metrics: [], analysis: [prompt], readAloud: prompt };
        }

        const scenarioSummary = ({ label, result }) => {
            const effectiveRate = result.assessable > 0
                ? (result.taxBasicPayable / result.assessable) * 100
                : 0;
            const netTax = result.netPayable;
            const settlement = netTax < 0
                ? `Refund ${formatTaxMoney(Math.abs(netTax))}`
                : netTax > 0
                    ? `Balance owing ${formatTaxMoney(netTax)}`
                    : 'No balance owing or refund';
            return {
                effectiveRate,
                label,
                result,
                settlement,
                text: `${label}: Taxable income ${formatTaxMoney(result.taxable)} · Tax + Medicare ${formatTaxMoney(result.taxBasicPayable)} · Effective ${effectiveRate.toFixed(2).replace(/\.?0+$/, '')}% · ${settlement}`,
            };
        };
        const summaries = scenarios.map(scenarioSummary);
        const analysis = summaries.map(({ text }) => text);
        const speech = [
            `${name}, here's your tax analysis:`,
            ...summaries.map(({ label, result, effectiveRate }) => {
                const settlement = result.netPayable < 0
                    ? `You may be due a refund of approximately ${formatTaxSpeechMoney(Math.abs(result.netPayable))}.`
                    : result.netPayable > 0
                        ? `You may have a balance owing of approximately ${formatTaxSpeechMoney(result.netPayable)}.`
                        : 'There is no estimated balance owing or refund.';
                return `${label} scenario: your taxable income is ${formatTaxSpeechMoney(result.taxable)}, with tax and Medicare of approximately ${formatTaxSpeechMoney(result.taxBasicPayable)} and an effective rate of ${effectiveRate.toFixed(2).replace(/\.?0+$/, '')}%. ${settlement}`;
            }),
        ];

        if (current && proposed) {
            const savings = current.netPayable - proposed.netPayable;
            const comparison = Math.abs(savings) < 0.5
                ? 'The proposed scenario makes no material change to the estimated total tax payable or refund.'
                : savings > 0
                    ? `The proposed scenario reduces estimated total tax payable by ${formatTaxMoney(savings)} compared with Current.`
                    : `The proposed scenario increases estimated total tax payable by ${formatTaxMoney(Math.abs(savings))} compared with Current.`;
            analysis.push(
                `<strong style="color:${savings >= 0 ? '#16a34a' : '#dc2626'}">${comparison}</strong>`,
            );
            speech.push(comparison);
        }

        const proposedSummary = summaries.find(({ label }) => label === 'Proposed') || summaries[0];
        const taxSavings = current && proposed
            ? current.netPayable - proposed.netPayable
            : null;
        const metrics = [
            { label: 'Taxable income', value: formatTaxMoney(proposedSummary.result.taxable) },
            { label: 'Tax + Medicare', value: formatTaxMoney(proposedSummary.result.taxBasicPayable) },
            { label: 'Effective rate', value: `${proposedSummary.effectiveRate.toFixed(2).replace(/\.?0+$/, '')}%` },
            ...(taxSavings === null
                ? []
                : [{
                    label: taxSavings >= 0 ? 'Tax saved' : 'Additional tax',
                    value: formatTaxMoney(Math.abs(taxSavings)),
                    color: taxSavings >= 0 ? '#16a34a' : '#dc2626',
                }]),
        ];

        return {
            subtitle,
            metrics,
            analysis,
            readAloud: `${speech.join(' ')} Tax figures are estimates based on current Australian tax rules.`,
        };
    })();

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Left Client Pill Indicator */}
                <Segmented
                    value={selectedProfile}
                    onChange={(val) => setSelectedProfile(val)}
                    options={[
                        { label: getReviewName('client'), value: 'client', icon: '👤' },
                        ...(selectedReviewAllData?.personalDetails?.owner?.includes("partner") || selectedReviewAllData?.owner?.includes("partner") || selectedReviewAllData?.personalDetails?.owner?.includes("partner")
                            ? [{ label: getReviewName("partner"), value: 'partner', icon: "👥" }]
                            : []),
                    ]}
                    style={{ padding: 3, backgroundColor: '#f3f4f6', borderRadius: 8 }}
                />

                {/* Right Action Controls */}
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

            {/* Top Metric Cards (4 Cards Layout) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Current Tax Card */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Current Tax</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {formatTaxMoney(currentTax)}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: currentTax < 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {currentTax < 0 ? 'net refund (incl. Medicare)' : 'net payable (incl. Medicare)'}
                        </Text>
                    </Card>
                </Col>

                {/* Proposed Tax Card */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Proposed Tax</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {formatTaxMoney(proposedTax)}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: proposedTax < 0 ? '#16a34a' : '#ea580c', fontWeight: 600 }}>
                            {proposedTax < 0 ? 'net refund (incl. Medicare)' : 'net payable (incl. Medicare)'}
                        </Text>
                    </Card>
                </Col>

                {/* Tax Savings Card (Highlighted Light Green) */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#374151' }}>Tax Savings</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 700, color: '#16a34a' }}>
                                {formatTaxMoney(taxSavings)}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: taxSavings >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {taxSavings > 0 ? 'tax saved' : taxSavings < 0 ? 'additional tax' : 'proposed vs current'}
                        </Text>
                    </Card>
                </Col>

                {/* Personal Tax Savings Card */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Personal Tax Savings</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {formatTaxMoney(personalTaxSavings)}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>proposed vs current</Text>
                    </Card>
                </Col>
            </Row>

            {/* Dynamic View Card (Graph vs Table) */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <div style={{ width: '100%', height: 380, position: 'relative' }}>
                        {current && proposed && taxSavings !== 0 && (
                            <div style={{
                                position: 'absolute',
                                zIndex: 1,
                                top: 8,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '4px 14px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                backgroundColor: taxSavings > 0 ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${taxSavings > 0 ? '#22c55e' : '#dc2626'}`,
                                color: taxSavings > 0 ? '#15803d' : '#dc2626',
                            }}>
                                {taxSavings > 0 ? '+' : ''}{formatCompactTaxMoney(taxSavings)} {taxSavings > 0 ? 'saved' : 'additional tax'}
                            </div>
                        )}
                        <ResponsiveContainer>
                            <BarChart data={graphData} margin={{ top: 34, right: 24, left: 12, bottom: 12 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <XAxis
                                    dataKey="scenario"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    domain={([dataMin, dataMax]) => {
                                        const range = Math.abs(dataMax - dataMin);
                                        const padding = (range || Math.abs(dataMin) || Math.abs(dataMax) || 1) * 0.08;
                                        return [
                                            Math.min(0, dataMin - padding),
                                            Math.max(0, dataMax + padding),
                                        ];
                                    }}
                                    tickFormatter={formatCompactTaxMoney}
                                />
                                <Tooltip formatter={(val) => [formatTaxMoney(val), 'Tax payable / (refund)']} />
                                <Bar
                                    dataKey="netPayable"
                                    maxBarSize={160}
                                    radius={[0, 0, 6, 6]}
                                >
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#1e293b" />
                                    <LabelList
                                        dataKey="netPayable"
                                        content={renderTaxLabel}
                                        style={{ fontSize: 13, fontWeight: 700 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12, marginTop: 12, fontWeight: 600, color: '#334155' }}>
                            {getReviewName(selectedProfile)}
                        </Text>
                    </div>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            TAX PLANNING COMPARISON · CURRENT VS PROPOSED
                        </Title>

                        {tableData.length ? (
                            <>
                                <DynamicDataTable
                                    columns={columns}
                                    data={tableData}
                                    headerFontSize={12}
                                    bodyFontSize={12}
                                    showCount={false}
                                    size="small"
                                    tableProps={{ scroll: { x: 'max-content' } }}
                                    tableStyle={{ borderRadius: 12 }}
                                />
                                <Text type="secondary" style={{ display: 'block', marginTop: 14, fontSize: 11 }}>
                                    DIFFERENCE COLUMN · GREEN = TAX SAVING · RED = ADDITIONAL TAX
                                </Text>
                            </>
                        ) : (
                            <Text type="secondary">
                                Enter tax information for both Current and Proposed to see the comparison.
                            </Text>
                        )}
                    </>
                )}
            </Card>

            {/* Modal Context for Editing */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"60vw"}
                title={renderTitleBlock({
                    title: "Tax Planning Inputs",
                    icon: "📑",
                })}
            >
                <ReviewsTaxPlanningForm
                    modalData={{ closeModal: () => setOpenModal(false) }}
                />
            </AppModal>

            <AnalysisModal
                content={analysisContent}
                subtitle={analysisContent.subtitle}
                disclaimer={TAX_ANALYSIS_DISCLAIMER}
                openAnalysisModal={openAnalysisModal}
                onClose={() => { setOpenAnalysisModal(false) }}
            />
        </div>
    );
};

export default ReviewsTaxPlanning;