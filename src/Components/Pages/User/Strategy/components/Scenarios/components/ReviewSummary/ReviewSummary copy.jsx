import React, { useState, useMemo } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Radio,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Statistic,
    Row,
    Col,
    Progress,
    Typography,
    Space
} from 'antd';
import {
    BarChartOutlined,
    PieChartOutlined,
    DownloadOutlined,
    EditOutlined,
    FilterOutlined,
    ArrowUpOutlined,
    DollarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Sample mock data
const INITIAL_DATA = [
    { key: '1', id: 1, category: 'Superannuation', preReview: 450000, postReview: 520000, status: 'Completed', owner: 'Client & Partner' },
    { key: '2', id: 2, category: 'Insurance', preReview: 12000, postReview: 9500, status: 'Optimized', owner: 'Client' },
    { key: '3', id: 3, category: 'Investment Portfolio', preReview: 280000, postReview: 310000, status: 'Completed', owner: 'Joint' },
    { key: '4', id: 4, category: 'Age Pension Estimate', preReview: 18000, postReview: 22000, status: 'In Review', owner: 'Partner' },
];

const ReviewSummary = () => {
    const [data, setData] = useState(INITIAL_DATA);
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [form] = Form.useForm();

    // Helper Formatter
    const formatCurrency = (val) =>
        new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

    // Metric Computations
    const stats = useMemo(() => {
        const totalPre = data.reduce((acc, curr) => acc + curr.preReview, 0);
        const totalPost = data.reduce((acc, curr) => acc + curr.postReview, 0);
        const totalDiff = totalPost - totalPre;
        const percentageGrowth = totalPre > 0 ? ((totalDiff / totalPre) * 100).toFixed(1) : 0;

        return { totalPre, totalPost, totalDiff, percentageGrowth };
    }, [data]);

    // Filtered List
    const filteredData = useMemo(() => {
        if (activeTab === 'all') return data;
        return data.filter(item => item.status.toLowerCase().replace(' ', '-') === activeTab);
    }, [data, activeTab]);

    // Modal Handlers
    const handleOpenEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleSave = (values) => {
        setData(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...values } : item));
        setIsModalOpen(false);
    };

    // AntD Table Columns Definition
    const columns = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (text) => <Text font-weight="600">{text}</Text>
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            render: (text) => <Text type="secondary">{text}</Text>
        },
        {
            title: 'Pre-Review',
            dataIndex: 'preReview',
            key: 'preReview',
            align: 'right',
            render: (val) => formatCurrency(val)
        },
        {
            title: 'Post-Review',
            dataIndex: 'postReview',
            key: 'postReview',
            align: 'right',
            render: (val) => <Text type="success" strong>{formatCurrency(val)}</Text>
        },
        {
            title: 'Difference',
            key: 'difference',
            align: 'right',
            render: (_, record) => {
                const diff = record.postReview - record.preReview;
                return (
                    <Text type={diff >= 0 ? 'default' : 'danger'} strong>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                    </Text>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'Completed' ? 'success' : status === 'Optimized' ? 'processing' : 'warning';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenEdit(record)}
                />
            )
        }
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* ── HEADER BAR ── */}
            <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: '20px 24px' }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col>
                        <Text type="success" strong style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>
                            Annual Review
                        </Text>
                        <Title level={2} style={{ margin: '4px 0 0 0' }}>Review Summary & Action Plan</Title>
                        <Text type="secondary">Comparative analysis of financial position pre and post annual review.</Text>
                    </Col>
                    <Col>
                        <Space align="center" size="middle">
                            <Button
                                icon={viewMode === 'table' ? <PieChartOutlined /> : <BarChartOutlined />}
                                onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                            >
                                {viewMode === 'table' ? 'Chart View' : 'Table View'}
                            </Button>
                            <Button type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#10b981' }}>
                                Export Summary
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* ── TOP STATS CARDS ── */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Pre-Review Position"
                            value={stats.totalPre}
                            prefix={<DollarOutlined />}
                            formatter={(val) => formatCurrency(val)}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Baseline financial valuation</Text>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Post-Review Position"
                            value={stats.totalPost}
                            valueStyle={{ color: '#10b981' }}
                            prefix={<ArrowUpOutlined />}
                            formatter={(val) => formatCurrency(val)}
                        />
                        <Text type="success" style={{ fontSize: '12px', fontWeight: 500 }}>
                            ▲ +{stats.percentageGrowth}% growth projected
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Net Position Benefit"
                            value={stats.totalDiff}
                            valueStyle={{ color: stats.totalDiff >= 0 ? '#1f2937' : '#ef4444' }}
                            formatter={(val) => formatCurrency(val)}
                        />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Total estimated value added</Text>
                    </Card>
                </Col>
            </Row>

            {/* ── MAIN CONTENT CARD ── */}
            <Card
                title={
                    <Space>
                        <FilterOutlined style={{ color: '#94a3b8' }} />
                        <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'bold' }}>STATUS FILTER:</Text>
                        <Radio.Group
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                            size="small"
                        >
                            <Radio.Button value="all">All</Radio.Button>
                            <Radio.Button value="completed">Completed</Radio.Button>
                            <Radio.Button value="optimized">Optimized</Radio.Button>
                            <Radio.Button value="in-review">In Review</Radio.Button>
                        </Radio.Group>
                    </Space>
                }
            >
                {/* ── VIEW MODE 1: TABLE ── */}
                {viewMode === 'table' ? (
                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        pagination={false}
                        rowKey="id"
                    />
                ) : (
                    /* ── VIEW MODE 2: CHART / PROGRESS SUMMARY ── */
                    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
                            Post-Review Value Breakdown
                        </Title>
                        {filteredData.map(item => {
                            const percentage = Math.round((item.postReview / stats.totalPost) * 100);
                            return (
                                <div key={item.id} style={{ marginBottom: 16 }}>
                                    <Row justify="space-between" style={{ marginBottom: 4 }}>
                                        <Text strong>{item.category}</Text>
                                        <Text type="secondary">{formatCurrency(item.postReview)} ({percentage}%)</Text>
                                    </Row>
                                    <Progress percent={percentage} strokeColor="#10b981" showInfo={false} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* ── EDIT ITEM MODAL ── */}
            <Modal
                title="Edit Summary Item"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Save Changes"
                okButtonProps={{ style: { backgroundColor: '#10b981' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please enter category name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="preReview"
                                label="Pre-Review ($)"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="postReview"
                                label="Post-Review ($)"
                                rules={[{ required: true, message: 'Required' }]}
                            >
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="status"
                        label="Status"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Select.Option value="Completed">Completed</Select.Option>
                            <Select.Option value="Optimized">Optimized</Select.Option>
                            <Select.Option value="In Review">In Review</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default ReviewSummary;