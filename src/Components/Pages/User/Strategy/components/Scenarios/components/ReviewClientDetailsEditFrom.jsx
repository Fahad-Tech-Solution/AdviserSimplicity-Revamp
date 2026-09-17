import React, { useMemo, useEffect, useState } from 'react';
import { Form, Select, DatePicker, Row, Col, Typography, Button, Space, message, Input } from 'antd';
import { RiEdit2Fill } from 'react-icons/ri';
import dayjs from 'dayjs';
import EditableDynamicTable from '../../../../../../Common/EditableDynamicTable';
import {
    formatNumber,
    toCommaAndDollar,
} from '../../../../../../../hooks/helpers';
import useApi from '../../../../../../../hooks/useApi';

const { Text } = Typography;
const PRIMARY_GREEN = '#22c55e';

const OWNER_OPTIONS = [
    { value: 'Client', label: 'Client' },
    { value: 'Partner', label: 'Partner' },
];

const RISK_PROFILE_OPTIONS = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Conservative', label: 'Conservative' },
    { value: 'Moderately Conservative', label: 'Moderately Conservative' },
    { value: 'Balanced', label: 'Balanced' },
    { value: 'Growth', label: 'Growth' },
    { value: 'High Growth', label: 'High Growth' },
];

const YRS_TO_RETIRE_OPTIONS = Array.from({ length: 51 }, (_, i) => {
    if (i == 0) {
        return (
            {
                value: String(i),
                label: `Now`,
            }
        )
    }
    return ({
        value: String(i),
        label: `${i} Yrs`,
    })
});

function parseDigitsValue(value) {
    return String(value ?? '').replace(/[^0-9]/g, '');
}

function getChangedValue(value) {
    return value?.target?.value ?? value;
}

function formatNumericInput(value, { currency = false } = {}) {
    const digits = parseDigitsValue(getChangedValue(value));
    if (!digits) return '';
    return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === '') return undefined;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
    const numeric = parseCurrencyValue(value);
    return numeric ? toCommaAndDollar(numeric) : '';
}

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: '0 0 12px 12px', overflow: 'hidden' },
    headerFontSize: 12,
    bodyFontSize: 13,
};

export default function ReviewClientDetailsEditFrom({ modalData, initialData }) {
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const selectedOwners = Form.useWatch('selectedOwners', form) || ['Client', 'Partner'];

    const rows = useMemo(() => {
        return selectedOwners.map((ownerKey, index) => {
            const isClient = ownerKey === 'Client';
            const rolePrefix = isClient ? 'client' : 'partner';

            return {
                key: `owner-row-${index}`,
                rowIndex: index,
                formPath: ['ownersData', index],
                ownerRole: ownerKey,
                name: isClient ? initialData?.clientName : initialData?.partnerName,
                dob: isClient && initialData?.clientDOB ? dayjs(initialData.clientDOB) : undefined,
                salary: formatCurrencyValue(initialData?.[`${rolePrefix}Salary`]),
                yrsToRetire: initialData?.[`${rolePrefix}YrsToRetire`],
                superBalance: formatCurrencyValue(initialData?.[`${rolePrefix}SuperBalance`]),
                abpBalance: formatCurrencyValue(initialData?.[`${rolePrefix}ABPBalance`]),
                riskProfile: initialData?.[`${rolePrefix}RiskProfile`] || 'Balanced',
                homeLoan: formatCurrencyValue(initialData?.[`${rolePrefix}HomeLoan`]),
            };
        });
    }, [selectedOwners, initialData]);

    useEffect(() => {
        form.setFieldsValue({
            selectedOwners: [],
            ownersData: rows,
            sharedHomeLoan: formatCurrencyValue(initialData?.homeLoan || initialData?.clientHomeLoan),
        });
        setEditing(!initialData?._id);
    }, [initialData]);

    const columns = useMemo(
        () => [
            {
                title: 'Owner',
                dataIndex: 'ownerRole',
                key: 'ownerRole',
                width: 90,
                editable: false,
                renderView: ({ record }) => (
                    <span style={{ fontWeight: 600 }}>{record.ownerRole}</span>
                ),
            },
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                field: 'name',
                type: 'text',
                placeholder: ({ record }) =>
                    record?.ownerRole === 'Client' ? 'e.g. Peter Smith' : 'e.g. Rhonda Smith',
            },
            {
                title: 'Date of Birth',
                dataIndex: 'dob',
                key: 'dob',
                field: 'dob',
                type: 'custom',
                renderEdit: ({ record }) => (
                    <Form.Item name={[...record.formPath, 'dob']} style={{ margin: 0 }}>
                        <DatePicker format="MM/DD/YYYY" placeholder="mm/dd/yyyy" style={{ width: '100%' }} />
                    </Form.Item>
                ),
            },
            {
                title: 'Salary ($ p.a.)',
                dataIndex: 'salary',
                key: 'salary',
                field: 'salary',
                type: 'text',
                placeholder: 'Salary ($ p.a.)',
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true })
                    );
                },
            },
            {
                title: 'Yrs to Retire',
                dataIndex: 'yrsToRetire',
                key: 'yrsToRetire',
                field: 'yrsToRetire',
                type: 'select',
                options: YRS_TO_RETIRE_OPTIONS,
                placeholder: '—',
            },
            {
                title: 'Super Balance',
                dataIndex: 'superBalance',
                key: 'superBalance',
                field: 'superBalance',
                type: 'text',
                placeholder: 'Super Balance',
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true })
                    );
                },
            },
            {
                title: 'ABP Balance',
                dataIndex: 'abpBalance',
                key: 'abpBalance',
                field: 'abpBalance',
                type: 'text',
                placeholder: 'ABP Balance',
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true })
                    );
                },
            },
            {
                title: 'Risk Profile',
                dataIndex: 'riskProfile',
                key: 'riskProfile',
                field: 'riskProfile',
                type: 'select',
                options: RISK_PROFILE_OPTIONS,
            },
            {
                title: 'Home Loan',
                dataIndex: 'homeLoan',
                key: 'homeLoan',
                width: 120,
                onCell: (record, rowIndex) => {
                    const totalRows = rows.length;
                    if (totalRows > 1) {
                        if (rowIndex === 0) {
                            return { rowSpan: totalRows }; // Span both rows
                        }
                        return { rowSpan: 0 }; // Hide second cell
                    }
                    return { rowSpan: 1 };
                },
                renderEdit: () => (
                    <Form.Item name="sharedHomeLoan" style={{ margin: 0 }}>
                        <Input
                            placeholder="Home Loan"
                            style={{ height: '26px', borderRadius: '7px' }}
                            onChange={(e) => {
                                const formatted = formatNumericInput(e.target.value, { currency: true });
                                form.setFieldValue('sharedHomeLoan', formatted);
                            }}
                        />
                    </Form.Item>
                ),
                renderView: () => {
                    const value = form.getFieldValue('sharedHomeLoan') || initialData?.homeLoan || '--';
                    return <span>{value}</span>;
                },
            }
        ],
        []
    );

    const handleFinish = async (values) => {
        try {
            setSaving(true);

            const sharedHomeLoan = parseCurrencyValue(values?.sharedHomeLoan);

            const payload = {
                ...initialData,
                homeLoan: sharedHomeLoan, // Single combined home loan value
                owners: values?.ownersData?.map((item) => ({
                    ...item,
                    salary: parseCurrencyValue(item.salary),
                    superBalance: parseCurrencyValue(item.superBalance),
                    abpBalance: parseCurrencyValue(item.abpBalance),
                })),
            };

         

            if (initialData?._id) {
                await patch('/clientDetails/Update', payload);
            } else {
                await post('/clientDetails/Add', payload);
            }

            message.success('Client details updated successfully');
            setEditing(false);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Failed to update details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '8px 0' }}>
            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Row style={{ marginBottom: 24 }}>
                    <Col xs={6}>
                        <Form.Item label="Owner" name="selectedOwners" style={{ marginBottom: 0 }}>
                            <Select
                                mode="multiple"
                                allowClear
                                placeholder="Select owners"
                                options={OWNER_OPTIONS}
                                style={{ width: '100%' }}
                                disabled={!editing}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ marginBottom: 12 }}>
                    <Text
                        strong
                        style={{
                            fontSize: 12,
                            letterSpacing: '0.05em',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                        }}
                    >
                        PERSONAL DETAILS
                    </Text>
                </div>

                <div
                    className="custom-table-container"
                    style={{
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                    }}
                >
                    <style>{`
            .custom-table-container .ant-table-thead > tr > th {
              background-color: ${PRIMARY_GREEN} !important;
              color: #ffffff !important;
              font-weight: 600 !important;
            }
          `}</style>
                    <EditableDynamicTable
                        form={form}
                        editing={editing}
                        columns={columns}
                        data={rows}
                        tableProps={TABLE_PROPS}
                    />
                </div>

                {/* Action Button Controls */}
                <Row justify="end" style={{ marginTop: 20 }}>
                    <Space>
                        <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
                        {!editing ? (
                            <Button
                                type="primary"
                                htmlType="button"
                                key="edit"
                                onClick={() => setEditing(true)}
                            >
                                Edit <RiEdit2Fill style={{ marginLeft: 4 }} />
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                htmlType="submit"
                                key="save"
                                loading={saving}
                                disabled={saving}
                            >
                                Save
                            </Button>
                        )}
                    </Space>
                </Row>
            </Form>
        </div>
    );
}