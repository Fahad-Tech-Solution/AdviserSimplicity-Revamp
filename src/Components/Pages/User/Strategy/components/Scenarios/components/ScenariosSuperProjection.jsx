import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space, Table } from 'antd';
// Change this:
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DynamicDataTable from '../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../hooks/useTitleBlock';
import ScenariosSuperProjectionForm from './ScenariosSuperProjectionForm';

const { Text, Title } = Typography;

// Dynamic Mock Data for Client & Partner
const projectionData = {
    client: {
        metrics: {
            projectedBalance: '$41,628',
            todayBalance: '$32,520 in today\'s $',
            balanceWithout: '$24,794',
            totalContributions: '$27,037',
            insuranceCost: '$200',
            strategyGain: '$16,834',
            yr10Summary: 'Yr 10: $41,628 (with) vs $24,794 (without)'
        },
        chart: [
            { year: 'Yr 1', withStrategy: 3200, withoutInsurance: 3400, minimumSG: 2100 },
            { year: 'Yr 2', withStrategy: 5800, withoutInsurance: 6100, minimumSG: 3500 },
            { year: 'Yr 3', withStrategy: 8600, withoutInsurance: 9000, minimumSG: 5000 },
            { year: 'Yr 4', withStrategy: 11600, withoutInsurance: 12100, minimumSG: 6700 },
            { year: 'Yr 5', withStrategy: 15100, withoutInsurance: 15700, minimumSG: 8700 },
            { year: 'Yr 6', withStrategy: 19200, withoutInsurance: 19900, minimumSG: 11000 },
            { year: 'Yr 7', withStrategy: 23800, withoutInsurance: 24600, minimumSG: 13700 },
            { year: 'Yr 8', withStrategy: 29100, withoutInsurance: 30000, minimumSG: 16900 },
            { year: 'Yr 9', withStrategy: 35000, withoutInsurance: 36100, minimumSG: 20600 },
            { year: 'Yr 10', withStrategy: 41628, withoutInsurance: 42900, minimumSG: 24794 },
        ],
        table: [
            { key: '1', year: 1, openingBalance: '$1,000', sg: '$1,000', salarySacrifice: '$1,000', ncc: '$100', earnings: '$300', contribTax: '-$300', insurance: '-$9', closingWith: '$3,092', closingToday: '$3,016', closingNoIns: '$3,100', closingWithout: '$2,042', difference: '+$1,050' },
            { key: '2', year: 2, openingBalance: '$3,092', sg: '$1,100', salarySacrifice: '$1,000', ncc: '$100', earnings: '$519', contribTax: '-$315', insurance: '-$9', closingWith: '$5,486', closingToday: '$5,222', closingNoIns: '$5,505', closingWithout: '$3,281', difference: '+$2,205' },
            { key: '3', year: 3, openingBalance: '$5,486', sg: '$1,210', salarySacrifice: '$1,000', ncc: '$100', earnings: '$770', contribTax: '-$332', insurance: '-$10', closingWith: '$8,224', closingToday: '$7,637', closingNoIns: '$8,255', closingWithout: '$4,749', difference: '+$3,475' },
            { key: '4', year: 4, openingBalance: '$8,224', sg: '$1,331', salarySacrifice: '$1,000', ncc: '$100', earnings: '$1,056', contribTax: '-$350', insurance: '-$11', closingWith: '$11,350', closingToday: '$10,282', closingNoIns: '$11,395', closingWithout: '$6,477', difference: '+$4,873' },
            { key: '5', year: 5, openingBalance: '$11,350', sg: '$1,464', salarySacrifice: '$1,000', ncc: '$100', earnings: '$1,381', contribTax: '-$370', insurance: '-$12', closingWith: '$14,913', closingToday: '$13,181', closingNoIns: '$14,975', closingWithout: '$8,503', difference: '+$6,410' },
            { key: '6', year: 6, openingBalance: '$14,913', sg: '$1,611', salarySacrifice: '$1,000', ncc: '$100', earnings: '$1,752', contribTax: '-$392', insurance: '-$14', closingWith: '$18,971', closingToday: '$16,358', closingNoIns: '$19,053', closingWithout: '$10,869', difference: '+$8,101' },
            { key: '7', year: 7, openingBalance: '$18,971', sg: '$1,772', salarySacrifice: '$1,000', ncc: '$100', earnings: '$2,174', contribTax: '-$416', insurance: '-$15', closingWith: '$23,586', closingToday: '$19,842', closingNoIns: '$23,691', closingWithout: '$13,624', difference: '+$9,962' },
            { key: '8', year: 8, openingBalance: '$23,586', sg: '$1,949', salarySacrifice: '$1,000', ncc: '$100', earnings: '$2,653', contribTax: '-$442', insurance: '-$17', closingWith: '$28,829', closingToday: '$23,661', closingNoIns: '$28,962', closingWithout: '$16,821', difference: '+$12,008' },
            { key: '9', year: 9, openingBalance: '$28,829', sg: '$2,144', salarySacrifice: '$1,000', ncc: '$100', earnings: '$3,197', contribTax: '-$472', insurance: '-$18', closingWith: '$34,780', closingToday: '$27,849', closingNoIns: '$34,944', closingWithout: '$20,522', difference: '+$14,258' }
        ]
    },
    partner: {
        metrics: {
            projectedBalance: '$68,450',
            todayBalance: '$51,200 in today\'s $',
            balanceWithout: '$38,210',
            totalContributions: '$42,500',
            insuranceCost: '$1,450',
            strategyGain: '$30,240',
            yr10Summary: 'Yr 10: $68,450 (with) vs $38,210 (without)'
        },
        chart: [
            { year: 'Yr 1', withStrategy: 4800, withoutInsurance: 5300, minimumSG: 3100 },
            { year: 'Yr 2', withStrategy: 9200, withoutInsurance: 10100, minimumSG: 5800 },
            { year: 'Yr 3', withStrategy: 14100, withoutInsurance: 15400, minimumSG: 8900 },
            { year: 'Yr 4', withStrategy: 19600, withoutInsurance: 21300, minimumSG: 12400 },
            { year: 'Yr 5', withStrategy: 25800, withoutInsurance: 27900, minimumSG: 16200 },
            { year: 'Yr 6', withStrategy: 32700, withoutInsurance: 35200, minimumSG: 20500 },
            { year: 'Yr 7', withStrategy: 40400, withoutInsurance: 43400, minimumSG: 25200 },
            { year: 'Yr 8', withStrategy: 48900, withoutInsurance: 52500, minimumSG: 30300 },
            { year: 'Yr 9', withStrategy: 58200, withoutInsurance: 62500, minimumSG: 34100 },
            { year: 'Yr 10', withStrategy: 68450, withoutInsurance: 73300, minimumSG: 38210 },
        ],
        table: [
            { key: '1', year: 1, openingBalance: '$2,000', sg: '$1,500', salarySacrifice: '$1,500', ncc: '$200', earnings: '$500', contribTax: '-$450', insurance: '-$50', closingWith: '$4,800', closingToday: '$4,500', closingNoIns: '$5,300', closingWithout: '$3,100', difference: '+$1,700' },
            { key: '2', year: 2, openingBalance: '$4,800', sg: '$1,650', salarySacrifice: '$1,500', ncc: '$200', earnings: '$850', contribTax: '-$472', insurance: '-$50', closingWith: '$9,200', closingToday: '$8,600', closingNoIns: '$10,100', closingWithout: '$5,800', difference: '+$3,400' },
            { key: '3', year: 3, openingBalance: '$9,200', sg: '$1,815', salarySacrifice: '$1,500', ncc: '$200', earnings: '$1,250', contribTax: '-$497', insurance: '-$55', closingWith: '$14,100', closingToday: '$12,900', closingNoIns: '$15,400', closingWithout: '$8,900', difference: '+$5,200' },
        ]
    }
};

// Table Column Definitions with exact matching header colors
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
    { title: 'Closing (Today\'s $)', dataIndex: 'closingToday', key: 'closingToday', align: 'right', render: (val) => <span style={{ color: '#4b5563' }}>{val}</span> },
    { title: 'Closing (No Ins.)', dataIndex: 'closingNoIns', key: 'closingNoIns', align: 'right', render: (val) => <span style={{ color: '#d97706', fontWeight: 600 }}>{val}</span> },
    { title: 'Closing (Without)', dataIndex: 'closingWithout', key: 'closingWithout', align: 'right' },
    { title: 'Difference', dataIndex: 'difference', key: 'difference', align: 'right', render: (val) => <span style={{ color: '#16a34a', fontWeight: 700 }}>{val}</span> },
];

const ScenariosSuperProjection = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [openModal, setOpenModal] = useState(false);

    const headingStyle = { fontFamily: "Georgia,serif" };
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

    const currentMetrics = projectionData[selectedProfile].metrics;
    const currentChartData = projectionData[selectedProfile].chart;
    const currentTableData = projectionData[selectedProfile].table;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar */}
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
            {/* Dynamic Metric KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Card 1 */}
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Projected Balance</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.projectedBalance}
                            </Title>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>at age —</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.todayBalance}</Text>
                        </div>
                    </Card>
                </Col>

                {/* Card 2 */}
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Balance Without</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.balanceWithout}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Yr 10 — minimum SG only</Text>
                    </Card>
                </Col>

                {/* Card 3 */}
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Total Contributions</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {currentMetrics.totalContributions}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>over 10 years</Text>
                    </Card>
                </Col>

                {/* Card 4 */}
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#fecdd3', backgroundColor: '#fff1f2', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#e11d48' }}>Insurance Cost</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#e11d48' }}>
                                {currentMetrics.insuranceCost}
                            </Title>
                        </div>
                        <Text style={{ fontSize: 11, color: '#be123c', fontWeight: 600 }}>total drag on super</Text>
                    </Card>
                </Col>

                {/* Card 5 */}
                <Col xs={24} sm={12} md={4.8} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                    >
                        <div>
                            <Text style={{ fontSize: 13, color: '#16a34a' }}>Strategy Gain</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#16a34a' }}>
                                {currentMetrics.strategyGain}
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
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}K`} />
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

                        {/* Projection Table Container with styled green header */}
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
        </div >
    );
};

export default ScenariosSuperProjection;