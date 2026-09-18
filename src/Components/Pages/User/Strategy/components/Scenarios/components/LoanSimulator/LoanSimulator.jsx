import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import LoanSimulatorForm from './LoanSimulatorForm';

const { Text, Title } = Typography;

// Mock Data structure for Loan Simulator matching the image UI
const loanData = {
    client: {
        metrics: {
            topPill: 'Saving $862 interest · 24 yrs faster',
            repayment: '$1.05',
            repaymentFrequency: 'per weekly · minimum',
            totalInterest: '$862',
            totalInterestSub: 'over full loan term',
            interestSaved: '$862',
            interestSavedSub: 'with extras & offset',
            termSaved: '24 yrs',
            termSavedSub: 'with extras & offset',
            chartSummary: 'With extras & offset: loan paid off 24 yrs earlier, saving $862 interest'
        },
        chart: Array.from({ length: 25 }, (_, i) => ({
            year: `Yr ${i + 1}`,
            minimumOnly: 900 - i * 32,
            withExtraOffset: Math.max(0, 900 - i * 150)
        })),
        table: [
            { key: '1', year: 'Yr 1', openingBalance: '$1,000', minimumRepayment: '$55', extraRepayment: '$10', interestPaid: '$40', principalPaid: '$25', closingBalance: '$975' },
            { key: '2', year: 'Yr 2', openingBalance: '$975', minimumRepayment: '$55', extraRepayment: '$10', interestPaid: '$38', principalPaid: '$27', closingBalance: '$948' },
            { key: '3', year: 'Yr 3', openingBalance: '$948', minimumRepayment: '$55', extraRepayment: '$10', interestPaid: '$36', principalPaid: '$29', closingBalance: '$919' }
        ]
    },
    partner: {
        metrics: {
            topPill: 'Saving $1,420 interest · 20 yrs faster',
            repayment: '$2.50',
            repaymentFrequency: 'per weekly · minimum',
            totalInterest: '$1,420',
            totalInterestSub: 'over full loan term',
            interestSaved: '$1,420',
            interestSavedSub: 'with extras & offset',
            termSaved: '20 yrs',
            termSavedSub: 'with extras & offset',
            chartSummary: 'With extras & offset: loan paid off 20 yrs earlier, saving $1,420 interest'
        },
        chart: Array.from({ length: 25 }, (_, i) => ({
            year: `Yr ${i + 1}`,
            minimumOnly: 1500 - i * 50,
            withExtraOffset: Math.max(0, 1500 - i * 200)
        })),
        table: [
            { key: '1', year: 'Yr 1', openingBalance: '$2,000', minimumRepayment: '$130', extraRepayment: '$20', interestPaid: '$80', principalPaid: '$70', closingBalance: '$1,930' }
        ]
    }
};

// Table Column Definitions
const columns = [
    { title: 'Year', dataIndex: 'year', key: 'year', align: 'center' },
    { title: 'Opening Balance', dataIndex: 'openingBalance', key: 'openingBalance', align: 'right' },
    { title: 'Minimum Repayment', dataIndex: 'minimumRepayment', key: 'minimumRepayment', align: 'right' },
    { title: 'Extra Repayment', dataIndex: 'extraRepayment', key: 'extraRepayment', align: 'right', render: (val) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{val}</span> },
    { title: 'Interest Paid', dataIndex: 'interestPaid', key: 'interestPaid', align: 'right', render: (val) => <span style={{ color: '#dc2626' }}>{val}</span> },
    { title: 'Principal Paid', dataIndex: 'principalPaid', key: 'principalPaid', align: 'right', render: (val) => <span style={{ color: '#2563eb', fontWeight: 600 }}>{val}</span> },
    { title: 'Closing Balance', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (val) => <span style={{ fontWeight: 700 }}>{val}</span> }
];

const LoanSimulator = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);

    const headingStyle = { fontFamily: "Georgia,serif" };
    const renderTitleBlock = useTitleBlock({ titleStyle: headingStyle });

    const [seriesVisibility, setSeriesVisibility] = useState({
        withExtraOffset: true,
        minimumOnly: true,
    });

    const toggleSeries = (key) => {
        setSeriesVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const currentMetrics = loanData[selectedProfile].metrics;
    const currentChartData = loanData[selectedProfile].chart;
    const currentTableData = loanData[selectedProfile].table;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Bar with Top Left Pill Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Space size={16}>
                    <Segmented
                        value={selectedProfile === 'client' ? 'Client' : 'Partner'}
                        onChange={(val) => setSelectedProfile(val.toLowerCase())}
                        options={[
                            { label: 'Client', value: 'Client', icon: "👤" },
                            { label: 'Partner', value: 'Partner', icon: "👥" },
                        ]}
                        style={{ padding: 2 }}
                    />

                    {/* Top Pill Highlight Banner */}
                    <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#16a34a',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        🏠 {currentMetrics.topPill}
                    </div>
                </Space>

                {/* Right Top Actions */}
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
                        onClick={() => setOpenModal(true)}
                    >
                        Edit Inputs
                    </Button>
                </Space>
            </div>

            {/* Metric KPI Cards (4 Cards Layout based on Image) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Repayment Card (Highlighted Green Box) */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#374151' }}>Repayment</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 700, color: '#16a34a' }}>
                                {currentMetrics.repayment}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{currentMetrics.repaymentFrequency}</Text>
                    </Card>
                </Col>

                {/* Total Interest */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Total Interest</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.totalInterest}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.totalInterestSub}</Text>
                    </Card>
                </Col>

                {/* Interest Saved */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Interest Saved</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.interestSaved}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.interestSavedSub}</Text>
                    </Card>
                </Col>

                {/* Term Saved */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Term Saved</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.termSaved}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.termSavedSub}</Text>
                    </Card>
                </Col>
            </Row>

            {/* Dynamic View: Graph vs Table */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Loan Balance Over Time
                        </Title>

                        <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer>
                                <BarChart data={currentChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="year"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        interval={2}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={(val) => `$${val / 1000}K`}
                                    />
                                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />

                                    {seriesVisibility.withExtraOffset && (
                                        <Bar dataKey="withExtraOffset" name="With Extra / Offset" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                    {seriesVisibility.minimumOnly && (
                                        <Bar dataKey="minimumOnly" name="Minimum Only" fill="#2b3b5c" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12, marginTop: 12 }}>
                            {currentMetrics.chartSummary}
                        </Text>

                        {/* Interactive Legend Pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, gap: 6 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button
                                    size="small"
                                    onClick={() => toggleSeries('withExtraOffset')}
                                    style={{
                                        borderRadius: 16,
                                        borderColor: '#22c55e',
                                        color: seriesVisibility.withExtraOffset ? '#16a34a' : '#94a3b8',
                                        fontWeight: 600
                                    }}
                                >
                                    ● With Extra / Offset
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => toggleSeries('minimumOnly')}
                                    style={{
                                        borderRadius: 16,
                                        borderColor: '#2b3b5c',
                                        color: seriesVisibility.minimumOnly ? '#2b3b5c' : '#94a3b8',
                                        fontWeight: 600
                                    }}
                                >
                                    ● Minimum Only
                                </Button>
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Click a legend pill to show / hide</Text>
                        </div>
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            LOAN REPAYMENT SCHEDULE
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

            {/* Footer Disclaimer */}
            <div style={{ marginTop: 16, textAlign: 'left' }}>
                <Text type="secondary" style={{ fontSize: 10, letterSpacing: '0.5px', fontWeight: 600 }}>
                    PROJECTED · ALL VALUES IN AUD · INDICATIVE ONLY
                </Text>
            </div>

            {/* Modal for editing inputs */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Loan Simulator Inputs",
                    icon: "🏠",
                })}
            >
                <LoanSimulatorForm />
            </AppModal>
        </div>
    );
};

export default LoanSimulator;