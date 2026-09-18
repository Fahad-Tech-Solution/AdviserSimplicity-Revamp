import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import InsuranceNeedsForm from './InsuranceNeedsForm';

const { Text, Title } = Typography;

// Mock Data structure for Insurance Needs matching the provided design
const insuranceData = {
    client: {
        metrics: {
            lifeCover: '$1,000,000',
            lifeShortfall: 'Shortfall · $969,763',
            lifeStatus: 'shortfall',
            tpdCover: '$1,000,000',
            tpdShortfall: 'Shortfall · $816,715',
            tpdStatus: 'shortfall',
            traumaCover: '$100,000',
            traumaShortfall: 'Fully covered',
            traumaStatus: 'covered',
            ipCover: '$3,600/mo',
            ipShortfall: 'Shortfall · $3,599/mo',
            ipStatus: 'shortfall',
            chartSummary: '$1,786,478 additional cover needed across Life / TPD / Trauma'
        },
        chart: [
            { category: 'Life', currentCover: 30237, shortfall: 969763, displayVal: '$1.00M' },
            { category: 'TPD', currentCover: 183285, shortfall: 816715, displayVal: '$1.00M' },
            { category: 'Trauma', currentCover: 100000, shortfall: 0, displayVal: '$100K' },
            { category: 'IP', currentCover: 12, shortfall: 43188, displayVal: '$43K' },
        ],
        table: [
            { key: '1', coverType: 'Life Cover', required: '$1,000,000', existing: '$30,237', shortfall: '$969,763', status: 'Shortfall' },
            { key: '2', coverType: 'TPD Cover', required: '$1,000,000', existing: '$183,285', shortfall: '$816,715', status: 'Shortfall' },
            { key: '3', coverType: 'Trauma Cover', required: '$100,000', existing: '$100,000', shortfall: '$0', status: 'Fully Covered' },
            { key: '4', coverType: 'Income Protection', required: '$3,600/mo', existing: '$1/mo', shortfall: '$3,599/mo', status: 'Shortfall' },
        ]
    },
    partner: {
        metrics: {
            lifeCover: '$750,000',
            lifeShortfall: 'Shortfall · $500,000',
            lifeStatus: 'shortfall',
            tpdCover: '$500,000',
            tpdShortfall: 'Shortfall · $200,000',
            tpdStatus: 'shortfall',
            traumaCover: '$150,000',
            traumaShortfall: 'Fully covered',
            traumaStatus: 'covered',
            ipCover: '$4,500/mo',
            ipShortfall: 'Shortfall · $1,200/mo',
            ipStatus: 'shortfall',
            chartSummary: '$700,000 additional cover needed across Life / TPD / Trauma'
        },
        chart: [
            { category: 'Life', currentCover: 250000, shortfall: 500000, displayVal: '$750K' },
            { category: 'TPD', currentCover: 300000, shortfall: 200000, displayVal: '$500K' },
            { category: 'Trauma', currentCover: 150000, shortfall: 0, displayVal: '$150K' },
            { category: 'IP', currentCover: 3300, shortfall: 1200, displayVal: '$4.5K' },
        ],
        table: [
            { key: '1', coverType: 'Life Cover', required: '$750,000', existing: '$250,000', shortfall: '$500,000', status: 'Shortfall' },
            { key: '2', coverType: 'TPD Cover', required: '$500,000', existing: '$300,000', shortfall: '$200,000', status: 'Shortfall' },
            { key: '3', coverType: 'Trauma Cover', required: '$150,000', existing: '$150,000', shortfall: '$0', status: 'Fully Covered' },
            { key: '4', coverType: 'Income Protection', required: '$4,500/mo', existing: '$3,300/mo', shortfall: '$1,200/mo', status: 'Shortfall' },
        ]
    }
};

// Table Column Definitions
const columns = [
    { title: 'Cover Type', dataIndex: 'coverType', key: 'coverType', align: 'left' },
    { title: 'Required Cover', dataIndex: 'required', key: 'required', align: 'right' },
    { title: 'Existing Cover', dataIndex: 'existing', key: 'existing', align: 'right' },
    { title: 'Shortfall / Surplus', dataIndex: 'shortfall', key: 'shortfall', align: 'right', render: (val) => <span style={{ color: val === '$0' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{val}</span> },
    {
        title: 'Status', dataIndex: 'status', key: 'status', align: 'center', render: (val) => (
            <span style={{ color: val === 'Fully Covered' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {val}
            </span>
        )
    },
];

const InsuranceNeeds = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [coverTab, setCoverTab] = useState('Insurance Cover');
    const [openModal, setOpenModal] = useState(false);

    const headingStyle = { fontFamily: "Georgia,serif" };
    const renderTitleBlock = useTitleBlock({ titleStyle: headingStyle });

    const [seriesVisibility, setSeriesVisibility] = useState({
        currentCover: true,
        shortfall: true,
    });

    const toggleSeries = (key) => {
        setSeriesVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const currentMetrics = insuranceData[selectedProfile].metrics;
    const currentChartData = insuranceData[selectedProfile].chart;
    const currentTableData = insuranceData[selectedProfile].table;

    // Helper for rendering top KPI status subtitle
    const renderStatusSub = (text, status) => {
        const isCovered = status === 'covered';
        return (
            <Text style={{ fontSize: 11, color: isCovered ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {text}
            </Text>
        );
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Bar Navigation & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Segmented
                    value={selectedProfile === 'client' ? 'Client' : 'Partner'}
                    onChange={(val) => setSelectedProfile(val.toLowerCase())}
                    options={[
                        { label: 'Client', value: 'Client', icon: "👤" },
                        { label: 'Partner', value: 'Partner', icon: "👥" },
                    ]}
                    style={{ padding: 2 }}
                />

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

            {/* Metric KPI Cards (4 Cards Layout) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20, display: 'flex' }}>
                {/* Life Cover */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Life Cover</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.lifeCover}
                            </Title>
                        </div>
                        {renderStatusSub(currentMetrics.lifeShortfall, currentMetrics.lifeStatus)}
                    </Card>
                </Col>

                {/* TPD Cover */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>TPD Cover</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.tpdCover}
                            </Title>
                        </div>
                        {renderStatusSub(currentMetrics.tpdShortfall, currentMetrics.tpdStatus)}
                    </Card>
                </Col>

                {/* Trauma Cover */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Trauma Cover</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.traumaCover}
                            </Title>
                        </div>
                        {renderStatusSub(currentMetrics.traumaShortfall, currentMetrics.traumaStatus)}
                    </Card>
                </Col>

                {/* IP Cover */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>IP Cover</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.ipCover}
                            </Title>
                        </div>
                        {renderStatusSub(currentMetrics.ipShortfall, currentMetrics.ipStatus)}
                    </Card>
                </Col>
            </Row>

            {/* Inner Sub-navigation Pill (Insurance Cover / Premiums) */}
            <div style={{ marginBottom: 16 }}>
                <Segmented
                    value={coverTab}
                    onChange={setCoverTab}
                    options={[
                        { label: 'Insurance Cover', value: 'Insurance Cover', icon: "🛡️" },
                        { label: 'Premiums', value: 'Premiums', icon: "💵" },
                    ]}
                    style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                />
            </div>

            {/* Dynamic View: Graph vs Table */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Insurance Cover — Required vs Existing
                        </Title>

                        <div style={{ width: '100%', height: 380 }}>
                            <ResponsiveContainer>
                                <BarChart data={currentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={(val) => `$${(val / 1000).toLocaleString()}K`}
                                        domain={[0, 2000000]}
                                    />
                                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />

                                    {seriesVisibility.currentCover && (
                                        <Bar
                                            dataKey="currentCover"
                                            name="Current Cover"
                                            stackId="a"
                                            fill="#2b3b5c"
                                            maxBarSize={60}
                                        />
                                    )}
                                    {seriesVisibility.shortfall && (
                                        <Bar
                                            dataKey="shortfall"
                                            name="Shortfall"
                                            stackId="a"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={60}
                                        />
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
                                    onClick={() => toggleSeries('currentCover')}
                                    style={{
                                        borderRadius: 16,
                                        borderColor: '#2b3b5c',
                                        color: seriesVisibility.currentCover ? '#2b3b5c' : '#94a3b8',
                                        fontWeight: 600
                                    }}
                                >
                                    ● Current Cover
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => toggleSeries('shortfall')}
                                    style={{
                                        borderRadius: 16,
                                        borderColor: '#10b981',
                                        color: seriesVisibility.shortfall ? '#10b981' : '#94a3b8',
                                        fontWeight: 600
                                    }}
                                >
                                    ● Shortfall
                                </Button>
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Click a legend pill to show / hide</Text>
                        </div>
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            INSURANCE COVER BREAKDOWN
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
                    PROJECTED · ALL VALUES IN AUD · INDICATIVE NEEDS ANALYSIS ONLY
                </Text>
            </div>

            {/* Modal for editing inputs */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Insurance Needs Inputs",
                    icon: "🛡️",
                })}
            >
                <InsuranceNeedsForm/>
            </AppModal>
        </div>
    );
};

export default InsuranceNeeds;