import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import RetirementAdequacyForm from './RetirementAdequacyform';

const { Text, Title } = Typography;

// Mock Data structure for Client, Partner, and Combined Cashflow
const adequacyData = {
    client: {
        metrics: {
            startingBalance: '$100',
            startingSubtext: '$100 + $100 top-up – $100 withdraw',
            annualDrawdown: '$105',
            drawdownSubtext: 'first-year payment',
            yearsSustained: '1',
            sustainedSubtext: 'until depleted',
            totalDrawn: '$105',
            drawnSubtext: 'across projection',
        },
        chart: [
            { year: 'Yr 1', balance: 100, drawdown: 105 },
            { year: 'Yr 2', balance: 0, drawdown: 0 },
        ],
        table: [
            { key: '1', year: 1, openingBalance: '$100', topUp: '$100', investmentReturn: '$5', drawdown: '$105', closingBalance: '$100' },
            { key: '2', year: 2, openingBalance: '$100', topUp: '$0', investmentReturn: '$5', drawdown: '$105', closingBalance: '$0' },
        ]
    },
    partner: {
        metrics: {
            startingBalance: '$250',
            startingSubtext: '$200 + $50 top-up',
            annualDrawdown: '$20',
            drawdownSubtext: 'first-year payment',
            yearsSustained: '15',
            sustainedSubtext: 'until depleted',
            totalDrawn: '$300',
            drawnSubtext: 'across projection',
        },
        chart: [
            { year: 'Yr 1', balance: 250, drawdown: 20 },
            { year: 'Yr 2', balance: 235, drawdown: 20 },
            { year: 'Yr 3', yearLabel: 'Yr 3', balance: 220, drawdown: 20 },
        ],
        table: [
            { key: '1', year: 1, openingBalance: '$250', topUp: '$50', investmentReturn: '$15', drawdown: '$20', closingBalance: '$295' },
        ]
    },
    cashflow: {
        metrics: {
            startingBalance: '$350',
            startingSubtext: 'Combined Client + Partner',
            annualDrawdown: '$125',
            drawdownSubtext: 'total combined draw',
            yearsSustained: '8',
            sustainedSubtext: 'average coverage',
            totalDrawn: '$405',
            drawnSubtext: 'across projection',
        },
        chart: [
            { year: 'Yr 1', balance: 350, drawdown: 125 },
            { year: 'Yr 2', balance: 235, drawdown: 125 },
        ],
        table: [
            { key: '1', year: 1, openingBalance: '$350', topUp: '$150', investmentReturn: '$20', drawdown: '$125', closingBalance: '$395' },
        ]
    }
};

const columns = [
    { title: 'Year', dataIndex: 'year', key: 'year', align: 'center' },
    { title: 'Opening Balance', dataIndex: 'openingBalance', key: 'openingBalance', align: 'right' },
    { title: 'Top-Up', dataIndex: 'topUp', key: 'topUp', align: 'right' },
    { title: 'Investment Return', dataIndex: 'investmentReturn', key: 'investmentReturn', align: 'right', render: (val) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{val}</span> },
    { title: 'Annual Drawdown', dataIndex: 'drawdown', key: 'drawdown', align: 'right', render: (val) => <span style={{ color: '#dc2626' }}>{val}</span> },
    { title: 'Closing Balance', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (val) => <span style={{ color: '#2563eb', fontWeight: 700 }}>{val}</span> },
];

const RetirementAdequacy = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);

    const headingStyle = { fontFamily: "Georgia, serif" };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const currentMetrics = adequacyData[selectedProfile]?.metrics || {};
    const currentChartData = adequacyData[selectedProfile]?.chart || [];
    const currentTableData = adequacyData[selectedProfile]?.table || [];

    const hasData = currentChartData.length > 0;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Profile Selector (Client, Partner, Cashflow) matching image styling */}
                <Segmented
                    value={selectedProfile}
                    onChange={(val) => setSelectedProfile(val)}
                    options={[
                        { label: 'Client', value: 'client', icon: '👤' },
                        { label: 'Partner', value: 'partner', icon: '👥' },
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
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />
                                        <Bar dataKey="balance" name="Pension Balance" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
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
                            PENSION PROJECTION BREAKDOWN
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
                <RetirementAdequacyForm/>
            </AppModal>
        </div>
    );
};

export default RetirementAdequacy;