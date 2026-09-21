import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import ReviewsTaxPlanningForm from './ReviewsTaxPlanningForm';

const { Text, Title } = Typography;

// Mock Data structure for Tax Planning matching the UI image
const taxPlanningData = {
    summary: {
        currentTax: '-$810',
        currentTaxSub: 'net refund (incl. Medicare)',
        proposedTax: '$3,788',
        proposedTaxSub: 'net payable (incl. Medicare)',
        taxSavings: '-$4,598',
        taxSavingsSub: 'additional tax',
        personalTaxSavings: '$112',
        personalTaxSavingsSub: 'proposed vs current',
    },
    graphData: [
        { scenario: 'Current', taxAmount: -810, displayVal: '$-810' }, { scenario: 'Proposed', taxAmount: 3788, displayVal: '$4K' },
    ],
    tableData: [
        { key: '1', item: 'Gross Income', current: '$85,000', proposed: '$92,000', variance: '+$7,000' },
        { key: '2', item: 'Allowable Deductions', current: '$2,500', proposed: '$3,800', variance: '+$1,300' },
        { key: '3', item: 'Taxable Income', current: '$82,500', proposed: '$88,200', variance: '+$5,700' },
        { key: '4', item: 'Gross Tax on Taxable Income', current: '$16,422', proposed: '$18,312', variance: '+$1,890' },
        { key: '5', item: 'Medicare Levy', current: '$1,650', proposed: '$1,764', variance: '+$114' },
        { key: '6', item: 'Tax Offsets & Credits', current: '$18,882', proposed: '$16,288', variance: '-$2,594' },
        { key: '7', item: 'Net Tax Payable / (Refund)', current: '-$810', proposed: '$3,788', variance: '+$4,598' },
    ],
};

// Table Column Definitions
const columns = [
    { title: 'Tax Breakdown Item', dataIndex: 'item', key: 'item', align: 'left' },
    { title: 'Current Position', dataIndex: 'current', key: 'current', align: 'right' },
    { title: 'Proposed Position', dataIndex: 'proposed', key: 'proposed', align: 'right' },
    {
        title: 'Variance',
        dataIndex: 'variance',
        key: 'variance',
        align: 'right',
        render: (val) => {
            const isNegative = val.startsWith('-');
            return <span style={{ color: isNegative ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{val}</span>;
        }
    },
];

// Custom bar renderer to draw distinct colors and top value labels
const RenderCustomBar = (props) => {
    const { x, y, width, height, payload } = props;
    const isCurrent = payload.scenario === 'Current';
    const barColor = isCurrent ? '#22c55e' : '#1e293b';

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={barColor} rx={4} ry={4} />
            <text
                x={x + width / 2}
                y={isCurrent ? y - 10 : y - 12}
                fill={isCurrent ? '#22c55e' : '#0f172a'}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
            >
                {payload.displayVal}
            </text>
        </g>
    );
};

const ReviewsTaxPlanning = () => {
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState('client');

    const headingStyle = { fontFamily: "Georgia,serif" };
    const renderTitleBlock = useTitleBlock({ titleStyle: headingStyle });

    const summary = taxPlanningData.summary;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Left Client Pill Indicator */}
                <Segmented
                    value={selectedProfile}
                    onChange={(val) => setSelectedProfile(val)}
                    options={[
                        { label: 'Client', value: 'client', icon: '👤' },
                        { label: 'Partner', value: 'partner', icon: '👥' },
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
                                {summary.currentTax}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{summary.currentTaxSub}</Text>
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
                                {summary.proposedTax}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#ea580c', fontWeight: 600 }}>{summary.proposedTaxSub}</Text>
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
                                {summary.taxSavings}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{summary.taxSavingsSub}</Text>
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
                                {summary.personalTaxSavings}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{summary.personalTaxSavingsSub}</Text>
                    </Card>
                </Col>
            </Row>

            {/* Dynamic View Card (Graph vs Table) */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <div style={{ position: 'relative' }}>
                        {/* Red Lost Indicator Pill Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '46%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: '#fff',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            padding: '4px 14px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            $5K lost
                        </div>

                        <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer>
                                <BarChart data={taxPlanningData.graphData} margin={{ top: 30, right: 80, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                                        tickFormatter={(val) => `$${val < 0 ? `-${Math.abs(val / 1000)}` : val / 1000}K`}
                                        domain={[-1000, 4000]}
                                    />
                                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, 'Tax Amount']} />
                                    <Bar
                                        dataKey="taxAmount"
                                        shape={<RenderCustomBar />}
                                        maxBarSize={160}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12, marginTop: 12, fontWeight: 600, color: '#334155' }}>
                            Client
                        </Text>
                    </div>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            TAX PLANNING ANALYSIS BREAKDOWN
                        </Title>

                        <DynamicDataTable
                            columns={columns}
                            data={taxPlanningData.tableData}
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

            {/* Modal Context for Editing */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Tax Planning Inputs",
                    icon: "📑",
                })}
            >
                <ReviewsTaxPlanningForm />
            </AppModal>
        </div>
    );
};

export default ReviewsTaxPlanning;