import React, { useState, useMemo, useEffect } from 'react';
import { Form, Table, Input, Button, Space, Typography, Tag, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { MyClientsData } from '../../../../../store/authState';

const { Text } = Typography;

const TARGET_FIELDS = ['email', 'phone', 'address', 'firstname', 'lastname'];

export default function IncompleteRowsEditor({ data = [], onProceed }) {
    const [form] = Form.useForm();
    const existingClients = useAtomValue(MyClientsData) || [];
    const [editingRowKeys, setEditingRowKeys] = useState([]);

    const normalize = (val) => String(val || '').trim().toLowerCase();

    // 1. Process and flag rows with missing data or duplicates
    const flaggedData = useMemo(() => {
        // 1. Safely extract clients array from the object wrapper
        const clientsList = Array.isArray(existingClients)
            ? existingClients
            : existingClients?.clients || [];

        // 2. Collect all existing emails & phones (handling nested client and partner objects)
        const existingEmails = new Set();
        const existingPhones = new Set();

        clientsList.forEach((c) => {
            // Client details
            if (c?.client?.Email) existingEmails.add(normalize(c.client.Email));
            if (c?.client?.clientWorkPhone) existingPhones.add(normalize(c.client.clientWorkPhone));
            if (c?.client?.clientMobilePhone) existingPhones.add(normalize(c.client.clientMobilePhone));

            // Partner details
            if (c?.partner?.partnerEmail) existingEmails.add(normalize(c.partner.partnerEmail));
            if (c?.partner?.partnerWorkPhone) existingPhones.add(normalize(c.partner.partnerWorkPhone));
            if (c?.partner?.partnerMobilePhone) existingPhones.add(normalize(c.partner.partnerMobilePhone));
        });

        const emailCounts = {};
        const phoneCounts = {};

        data.forEach((row) => {
            const email = normalize(row.email || row.Email || row['EMAIL']);
            const phone = normalize(row.phone || row.Phone || row['PHONE'] || row['MOBILE PHONE'] || row['CLIENT WORK PHONE']);
            if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
            if (phone) phoneCounts[phone] = (phoneCounts[phone] || 0) + 1;
        });

        return data
            .map((row, index) => {
                const rowEmail = normalize(row.email || row.Email || row['EMAIL']);
                const rowPhone = normalize(row.phone || row.Phone || row['PHONE'] || row['MOBILE PHONE'] || row['CLIENT WORK PHONE']);

                const isSystemDuplicate = (rowEmail && existingEmails.has(rowEmail)) || (rowPhone && existingPhones.has(rowPhone));
                const isFileDuplicate = (rowEmail && emailCounts[rowEmail] > 1) || (rowPhone && phoneCounts[rowPhone] > 1);

                const missingFields = [];
                Object.keys(row).forEach((col) => {
                    if (TARGET_FIELDS.some((f) => col.toLowerCase().includes(f))) {
                        if (!row[col] || String(row[col]).trim() === '') {
                            missingFields.push(col);
                        }
                    }
                });

                return {
                    ...row,
                    key: row.id || `row_${index}`,
                    _isSystemDuplicate: isSystemDuplicate,
                    _isFileDuplicate: isFileDuplicate,
                    _missingFields: missingFields,
                };
            })
            .filter((row) => row._isSystemDuplicate || row._isFileDuplicate || row._missingFields.length > 0);
    }, [data, existingClients]);

    const [tableRows, setTableRows] = useState(flaggedData);

    // Sync state data to AntD Form
    useEffect(() => {
        const formValues = {};
        tableRows.forEach((row) => {
            formValues[row.key] = { ...row };
        });
        form.setFieldsValue(formValues);
    }, [tableRows, form]);

    const toggleRowEdit = (rowKey, enable) => {
        setEditingRowKeys((prev) =>
            enable ? [...prev, rowKey] : prev.filter((k) => k !== rowKey)
        );
    };

    const handleSkipRow = (rowKey) => {
        setTableRows((prev) => prev.filter((item) => item.key !== rowKey));
        setEditingRowKeys((prev) => prev.filter((k) => k !== rowKey));
    };

    // 2. Build Ant Design Table Columns
    const columns = useMemo(() => {
        if (!data.length) return [];

        const problematicKeys = new Set();
        tableRows.forEach((row) => {
            row._missingFields?.forEach((field) => problematicKeys.add(field));
            Object.keys(row).forEach((k) => {
                const lower = k.toLowerCase();
                if (
                    (row._isSystemDuplicate || row._isFileDuplicate) &&
                    (lower.includes('email') || lower.includes('phone') || lower.includes('mobile') || lower.includes('marital status'))
                ) {
                    problematicKeys.add(k);
                }
            });
        });

        const identifierKeys = Object.keys(data[0])
            .filter((k) => {
                const lower = k.toLowerCase();
                // return lower.includes('name') || lower.includes('client');
                return lower.includes('email');
            })
            .slice(0, 2);

        const activeColumns = Array.from(new Set([...identifierKeys, ...problematicKeys]));

        const dynamicCols = [
            {
                title: '# Index',
                key: 'rowIndex',
                width: 80,
                render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
            },
            {
                title: 'Issue Status',
                key: 'status_warning',
                width: 150,
                render: (_, record) => (
                    <Space direction="vertical" size={2}>
                        {record._isSystemDuplicate && (
                            <Tag color="error" icon={<WarningOutlined />}>System Duplicate</Tag>
                        )}
                        {record._isFileDuplicate && (
                            <Tag color="warning" icon={<WarningOutlined />}>File Duplicate</Tag>
                        )}
                        {record._missingFields?.length > 0 && (
                            <Tag color="volcano">Missing Data</Tag>
                        )}
                    </Space>
                ),
            },
        ];

        // Build editable input cells using standard AntD Form.Item
        activeColumns.forEach((key) => {
            dynamicCols.push({
                title: key,
                dataIndex: key,
                key: key,
                render: (text, record) => {
                    const isEditing = editingRowKeys.includes(record.key);

                    if (!isEditing) {
                        return !text ? <Tag color="red">Empty</Tag> : text;
                    }

                    return (
                        <Form.Item
                            name={[record.key, key]}
                            style={{ margin: 0 }}
                        >
                            <Input placeholder={`Enter ${key}`} />
                        </Form.Item>
                    );
                },
            });
        });

        // Action Column
        dynamicCols.push({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 140,
            render: (_, record) => {
                const isEditing = editingRowKeys.includes(record.key);
                return (
                    <Space>
                        {isEditing ? (
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined />}
                                onClick={() => toggleRowEdit(record.key, false)}
                            >
                                Save
                            </Button>
                        ) : (
                            <Button
                                type="default"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => toggleRowEdit(record.key, true)}
                            >
                                Edit
                            </Button>
                        )}

                        <Popconfirm
                            title="Skip this row?"
                            onConfirm={() => handleSkipRow(record.key)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                                Skip
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        });

        return dynamicCols;
    }, [data, tableRows, editingRowKeys]);

    const handleConfirmAndProceed = async () => {
        try {
            const formValues = await form.validateFields();

            // Combine modifications back into complete row structures
            const sanitizedRows = tableRows.map((row) => ({
                ...row,
                ...(formValues[row.key] || {}),
            }));

            if (onProceed) {
                onProceed(sanitizedRows);
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    };

    return (
        <Form form={form} component={false}>
            <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" onClick={() => { console.log(tableRows) }}>
                        Displaying only flagged rows and their specific missing/duplicate fields. Click <strong>Edit</strong> to modify fields inline or <strong>Skip</strong> to drop a row.
                    </Text>
                </div>

                <Table
                    dataSource={tableRows}
                    columns={columns}
                    rowKey="key"
                    scroll={{ x: 'max-content' }}
                    bordered
                    size="small"
                    pagination={{
                        pageSize: 10,
                        hideOnSinglePage: false,
                        showTotal: (total, range) => `Total ${total} items`,
                    }}
                    components={{
                        header: {
                            cell: (props) => (
                                <th
                                    {...props}
                                    style={{
                                        ...props.style,
                                        backgroundColor: '#22c55e',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                    }}
                                />
                            ),
                        },
                    }}
                />

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Space>
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={handleConfirmAndProceed}
                        >
                            Confirm & Proceed
                        </Button>
                    </Space>
                </div>
            </div>
        </Form>
    );
}