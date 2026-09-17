import React, { useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space, Table, Tag } from 'antd';
import { AreaChartOutlined, TableOutlined, BulbOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ReviewAgePensionAssessmentForm from './ReviewAgePensionAssessmentForm';

const { Text, Title } = Typography;

// Mock Data for Assets & Income Tests Assessment
const pensionData = {
    summary: {
        status: 'Full pension',
        combinedPensionAnnual: '$31,223',
        combinedPensionFortnight: '$1,201 / fn',
        clientPensionAnnual: '$31,223',
        clientPensionFortnight: '$1,201',
        partnerPensionAnnual: '—',
        partnerPensionFortnight: '—',
        maxPossibleAnnual: '$31,223',
        pensionLost: 'Pension lost: $0 · $0 / fn',
    },
    assetsTest: [
        { key: '1', item: 'Motor Vehicle', client: '$2,500', partner: '—', total: '$5,000' },
        { key: '2', item: 'Contents', client: '$10,000', partner: '—', total: '$10,000' },
        { key: '3', item: 'Other Lifestyle (Boats/Caravan)', client: '$2,500', partner: '—', total: '$2,500' },
        { key: '4', item: 'Savings / Bank Accounts', client: '$100', partner: '—', total: '$200' },
        { key: '5', item: 'Term Deposits', client: '$100', partner: '—', total: '$200' },
        { key: '6', item: 'Shares / Managed Funds', client: '$100', partner: '—', total: '$200' },
        { key: '7', item: 'Other Investments', client: '$100', partner: '—', total: '$100' },
        { key: '8', item: 'Superannuation', client: '$100', partner: '—', total: '$100' },
        { key: '9', item: 'Account Based Pension (Balance)', client: '$100', partner: '—', total: '$200' },
        { key: '10', item: 'Investment Property (Net)', client: '—', partner: '—', total: '—' },
        { key: '11', item: 'Other Assets', client: '$100', partner: '—', total: '$100' },
        { key: '12', item: 'Total Assessable Assets', client: '$15,600', partner: '—', total: '$18,400', isHighlighted: true, isTotal: true },
        { key: '13', item: 'Lower Threshold', client: '', partner: '', total: '$333,000' },
        { key: '14', item: 'Upper Threshold', client: '', partner: '', total: '$733,500' },
        { key: '15', item: 'Excess Assets', client: '', partner: '', total: '$0', isHighlighted: true },
        { key: '16', item: 'Assets Test Reduction', client: '', partner: '', total: '—' },
        { key: '17', item: 'Under Assets Test (p.a.)', client: '', partner: '', total: '$28,608', isHighlighted: true, isFinal: true },
    ],
    incomeTest: [
        { key: '1', item: 'Salary & Employment Income', client: '$0', partner: '—', total: '$0' },
        { key: '2', item: 'Deemed Income from Financial Assets', client: '$120', partner: '—', total: '$120' },
        { key: '3', item: 'Deemed Income from Super / ABP', client: '$80', partner: '—', total: '$80' },
        { key: '4', item: 'Other Income', client: '$0', partner: '—', total: '$0' },
        { key: '5', item: 'Total Assessable Income', client: '$200', partner: '—', total: '$200', isHighlighted: true, isTotal: true },
        { key: '6', item: 'Income Free Area', client: '', partner: '', total: '$212' },
        { key: '7', item: 'Excess Income', client: '', partner: '', total: '$0', isHighlighted: true },
        { key: '8', item: 'Income Test Reduction', client: '', partner: '', total: '—' },
        { key: '9', item: 'Under Income Test (p.a.)', client: '', partner: '', total: '$31,223', isHighlighted: true, isFinal: true },
    ],
    graphData: [
        { year: 'Yr 1', assetsTestPension: 28608, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 2', assetsTestPension: 28900, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 3', assetsTestPension: 29200, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 4', assetsTestPension: 29500, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 5', assetsTestPension: 29800, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 6', assetsTestPension: 30100, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 7', assetsTestPension: 30500, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 8', assetsTestPension: 30900, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 9', assetsTestPension: 31223, incomeTestPension: 31223, maxPension: 31223 },
        { year: 'Yr 10', assetsTestPension: 31223, incomeTestPension: 31223, maxPension: 31223 },
    ],
};

const ReviewAgePensionAssessment = () => {
    const [viewMode, setViewMode] = useState('Table');
    const [meansTestTab, setMeansTestTab] = useState('Assets Test');
    const [openModal, setOpenModal] = useState(false);
    const [seriesVisibility, setSeriesVisibility] = useState({
        assetsTestPension: true,
        incomeTestPension: false,
        maxPension: true,
    });

    const headingStyle = { fontFamily: 'Georgia, serif' };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const columns = [
        {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
            render: (text, record) => (
                <Text style={{ fontWeight: record.isHighlighted || record.isTotal ? 700 : 400 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Client',
            dataIndex: 'client',
            key: 'client',
            align: 'right',
            render: (text, record) => (
                <Text style={{ fontWeight: record.isTotal ? 700 : 400 }}>{text}</Text>
            ),
        },
        {
            title: 'Partner',
            dataIndex: 'partner',
            key: 'partner',
            align: 'right',
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (text, record) => {
                let color = '#1f2937';
                if (record.isTotal) color = '#16a34a';
                if (record.isFinal) color = '#16a34a';
                return <Text style={{ fontWeight: record.isHighlighted ? 700 : 400, color }}>{text}</Text>;
            },
        },
    ];

    const currentTableData =
        meansTestTab === 'Assets Test' ? pensionData.assetsTest : pensionData.incomeTest;

    // 2. Define the toggleSeries function
    const toggleSeries = (key) => {
        setSeriesVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Tag
                    icon={<CheckCircleOutlined />}
                    style={{
                        padding: '4px 16px',
                        borderRadius: 20,
                        backgroundColor: '#f0fdf4',
                        borderColor: '#22c55e',
                        color: '#16a34a',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    {pensionData.summary.status}
                </Tag>

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

            {/* Top Summary Metric Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Combined Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Combined Pension</Text>
                            <Title level={2} style={{ margin: '4px 0', fontWeight: 700, color: '#16a34a' }}>
                                {pensionData.summary.combinedPensionAnnual}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Annual · {pensionData.summary.combinedPensionFortnight}
                        </Text>
                    </Card>
                </Col>

                {/* Client Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Client Pension</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {pensionData.summary.clientPensionAnnual}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Fortnightly: {pensionData.summary.clientPensionFortnight}
                        </Text>
                    </Card>
                </Col>

                {/* Partner Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Partner Pension</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {pensionData.summary.partnerPensionAnnual}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Fortnightly: {pensionData.summary.partnerPensionFortnight}
                        </Text>
                    </Card>
                </Col>

                {/* Max Possible */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Max Possible</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {pensionData.summary.maxPossibleAnnual}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {pensionData.summary.pensionLost}
                        </Text>
                    </Card>
                </Col>
            </Row>

            {/* Main Section: Dynamic View (Graph vs Table) */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Age Pension Entitlement Projection
                        </Title>

                        <div style={{ width: '100%', height: 360 }}>
                            <ResponsiveContainer>
                                <BarChart data={pensionData.graphData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}K`} />
                                    <Tooltip formatter={(val) => [`$${val.toLocaleString()}`, '']} />

                                    {seriesVisibility.assetsTestPension && (
                                        <Bar dataKey="assetsTestPension" name="Assets Test Pension" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                    {seriesVisibility.incomeTestPension && (
                                        <Bar dataKey="incomeTestPension" name="Income Test Pension" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                    {seriesVisibility.maxPension && (
                                        <Bar dataKey="maxPension" name="Max Pension Rate" fill="#1e293b" radius={[3, 3, 0, 0]} maxBarSize={16} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                            <Button
                                size="small"
                                onClick={() => toggleSeries('assetsTestPension')}
                                style={{ borderRadius: 16, borderColor: '#22c55e', color: seriesVisibility.assetsTestPension ? '#16a34a' : '#94a3b8' }}
                            >
                                ● Assets Test Pension
                            </Button>

                            <Button
                                size="small"
                                onClick={() => toggleSeries('incomeTestPension')}
                                style={{ borderRadius: 16, borderColor: '#8b5cf6', color: seriesVisibility.incomeTestPension ? '#7c3aed' : '#94a3b8' }}
                            >
                                ● Income Test Pension
                            </Button>

                            <Button
                                size="small"
                                onClick={() => toggleSeries('maxPension')}
                                style={{ borderRadius: 16, borderColor: '#1e293b', color: seriesVisibility.maxPension ? '#0f172a' : '#94a3b8' }}
                            >
                                ● Max Pension Rate
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#16a34a', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase', fontSize: 12 }}>
                            MEANS TEST BREAKDOWN
                        </Title>

                        {/* Means Test Toggle */}
                        <div style={{ marginBottom: 20 }}>
                            <Segmented
                                value={meansTestTab}
                                onChange={setMeansTestTab}
                                options={[
                                    { label: 'Assets Test', value: 'Assets Test', icon: '🏝️' },
                                    { label: 'Income Test', value: 'Income Test', icon: '💰' },
                                ]}
                                style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                            />
                        </div>

                        {/* Table Breakdown Container */}
                        <DynamicDataTable
                            columns={columns}
                            data={currentTableData}
                            headerFontSize={13}
                            bodyFontSize={13}
                            showCount={false}
                            size="middle"
                            tableProps={{
                                pagination: false,
                                scroll: { x: 'max-content' },
                            }}
                            tableStyle={{ borderRadius: 12 }}
                        />
                    </>
                )}

                <div style={{ marginTop: 20, textAlign: 'left' }}>
                    <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.5px' }}>
                        PROJECTED · ALL VALUES IN AUD · FY 2025–26 RATES
                    </Text>
                </div>
            </Card>

            {/* Edit Modal Context */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={'70vw'}
                title={renderTitleBlock({
                    title: 'Age Pension Assessment Inputs',
                    icon: '🏛️',
                })}
            >
                <ReviewAgePensionAssessmentForm />
            </AppModal>
        </div>
    );
};

export default ReviewAgePensionAssessment;