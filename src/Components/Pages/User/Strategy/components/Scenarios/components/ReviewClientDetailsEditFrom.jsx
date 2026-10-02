import React, { useMemo, useEffect, useState } from 'react';
import { Form, Select, DatePicker, Row, Col, Typography, Button, Space, message, Input } from 'antd';
import { RiEdit2Fill } from 'react-icons/ri';
import dayjs from 'dayjs';
import EditableDynamicTable from '../../../../../../Common/EditableDynamicTable';
import { formatAustralianDate, formatNumber, toCommaAndDollar } from '../../../../../../../hooks/helpers';
import useApi from '../../../../../../../hooks/useApi';
import { useOwnerOptions, useReviewOptions } from '../../../../../../../hooks/useUserDashboardData';
import { SelectedReviewAllData } from '../../../../../../../store/authState';
import { useAtom, useAtomValue } from 'jotai';

const { Text } = Typography;
const PRIMARY_GREEN = '#22c55e';

const RISK_PROFILE_OPTIONS = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Conservative', label: 'Conservative' },
    { value: 'Moderately Conservative', label: 'Moderately Conservative' },
    { value: 'Balanced', label: 'Balanced' },
    { value: 'Growth', label: 'Growth' },
    { value: 'High Growth', label: 'High Growth' },
];

const YRS_TO_RETIRE_OPTIONS = Array.from({ length: 51 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'Now' : `${i} Yrs`,
}));

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: '0 0 12px 12px', overflow: 'hidden' },
    headerFontSize: 12,
    bodyFontSize: 13,
};

function toDayjsValue(value) {
    if (!value) return undefined;
    const date = dayjs(value);
    return date.isValid() ? date : undefined;
}

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
    return numeric !== undefined ? toCommaAndDollar(numeric) : '';
}

function calculateYrsToRetire(dob, plannedRetirementAge) {
    if (!dob || !plannedRetirementAge) return undefined;
    const currentAge = dayjs().diff(dayjs(dob), 'year');
    const remaining = Number(plannedRetirementAge) - currentAge;
    return remaining > 0 ? String(remaining) : '0';
}

function buildInitialPerson(person = {}) {
    return {
        name: person?.preferredName || '',
        dob: toDayjsValue(person?.DOB),
        salary: formatCurrencyValue(person?.incomeFromBusinessTotal),
        yrsToRetire: calculateYrsToRetire(person?.DOB, person?.plannedRetirementAge),
        superBalance: formatCurrencyValue(person?.superAnnuationTotal),
        abpBalance: formatCurrencyValue(person?.accountBasedPensionTotal),
        riskProfile: person?.riskGoal || 'Balanced',
    };
}

export default function ReviewClientDetailsEditFrom({ modalData, initialData }) {
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(() => !initialData?._id);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();
    const ownerOptions = useReviewOptions();
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);


    const initialValues = useMemo(() => {
        const rawOwner = Array.isArray(initialData?.owner) && initialData.owner.length > 0
            ? initialData.owner
            : ['client', 'partner'];

        return {
            owner: rawOwner,
            client: buildInitialPerson(initialData?.client),
            partner: buildInitialPerson(initialData?.partner),
            sharedHomeLoan: formatCurrencyValue(initialData?.homeLoanTotal),
        };
    }, [initialData]);

    const selectedOwners = Form.useWatch('owner', form) || initialValues.owner;

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!initialData?._id);
    }, [form, initialValues, initialData]);

    const rows = useMemo(() => {
        return (selectedOwners || []).map((ownerKey) => {
            const isClient = ownerKey.toLowerCase() === 'client';
            const personData = isClient ? initialData?.client : initialData?.partner;

            return {
                key: ownerKey,
                formPath: ownerKey,
                ownerRole: isClient ? 'Client' : 'Partner',
                ownerLabel: ownerOptions.find((opt) => opt.value === ownerKey)?.label || (isClient ? 'Client' : 'Partner'),
                name: form.getFieldValue([ownerKey, 'name']) ?? personData?.preferredName ?? '',
                dob: form.getFieldValue([ownerKey, 'dob']) ?? (personData?.DOB ? formatAustralianDate(personData.DOB) : undefined),
                salary: form.getFieldValue([ownerKey, 'salary']) ?? formatCurrencyValue(personData?.incomeFromBusinessTotal),
                yrsToRetire: form.getFieldValue([ownerKey, 'yrsToRetire']) ?? calculateYrsToRetire(personData?.DOB, personData?.plannedRetirementAge),
                superBalance: form.getFieldValue([ownerKey, 'superBalance']) ?? formatCurrencyValue(personData?.superAnnuationTotal),
                abpBalance: form.getFieldValue([ownerKey, 'abpBalance']) ?? formatCurrencyValue(personData?.accountBasedPensionTotal),
                riskProfile: form.getFieldValue([ownerKey, 'riskProfile']) ?? personData?.riskGoal ?? 'Balanced',
            };
        });
    }, [selectedOwners, initialData, form, ownerOptions]);

    const columns = useMemo(
        () => [
            {
                title: 'Owner',
                dataIndex: 'ownerRole',
                key: 'ownerRole',
                width: 90,
                editable: false,
                renderView: ({ record }) => (
                    <span style={{ fontWeight: 600 }}>{record?.ownerRole}</span>
                ),
            },
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                field: 'name',
                type: 'text',
                placeholder: 'e.g. Name',
            },
            {
                title: 'Date of Birth',
                dataIndex: 'dob',
                key: 'dob',
                field: 'dob',
                type: 'date',
                renderView: ({ value, record }) => {
                    const rawDob = form.getFieldValue([record.formPath, 'dob']) || (record.ownerRole === 'Client' ? initialData?.client?.DOB : initialData?.partner?.DOB);
                    return rawDob ? formatAustralianDate(rawDob) : '--';
                }
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
                        [record.formPath, column.field],
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
                        [record.formPath, column.field],
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
                        [record.formPath, column.field],
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
                            return { rowSpan: totalRows };
                        }
                        return { rowSpan: 0 };
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
                    const value = form.getFieldValue('sharedHomeLoan') || formatCurrencyValue(initialData?.homeLoanTotal) || '--';
                    return <span>{value}</span>;
                },
            },
        ],
        [rows.length, initialData, form]
    );

    const handleFinish = async (values) => {
        try {
            setSaving(true);

            const activeOwners = values?.owner || [];

            const buildPayloadForOwner = (ownerKey) => {
                const isClient = ownerKey.toLowerCase() === 'client';
                const ownerInput = values?.[ownerKey] || {};

                let plannedRetirementAge = isClient
                    ? initialData?.client?.plannedRetirementAge
                    : initialData?.partner?.plannedRetirementAge;

                if (ownerInput?.dob && ownerInput?.yrsToRetire) {
                    const currentAge = dayjs().diff(dayjs(ownerInput.dob), 'year');
                    plannedRetirementAge = currentAge + Number(ownerInput.yrsToRetire);
                }

                return {
                    preferredName: ownerInput.name || '',
                    DOB: ownerInput.dob ? dayjs(ownerInput.dob).toISOString() : null,
                    plannedRetirementAge: plannedRetirementAge || 65,
                    incomeFromBusinessTotal: (ownerInput.salary) ?? '',
                    superAnnuationTotal: (ownerInput.superBalance) ?? '',
                    accountBasedPensionTotal: (ownerInput.abpBalance) ?? '',
                    riskGoal: ownerInput.riskProfile || '',
                };
            };

            const clientSelected = activeOwners.includes('client');
            const partnerSelected = activeOwners.includes('partner');

            const payload = {
                ...initialData,
                homeLoanTotal: (values?.sharedHomeLoan) ?? '',
                owner: activeOwners,
                client: clientSelected ? buildPayloadForOwner('client') : initialData?.client,
                partner: partnerSelected ? buildPayloadForOwner('partner') : initialData?.partner,
            };
            payload.client.image = undefined
            payload.partner.image =
                undefined


            let res;
            if (initialData?._id) {
                res = await patch('/reviewPersonalDetails/Update', payload);
            } else {
                res = await post('/reviewPersonalDetails/Add', payload);
            }

            setSelectedReviewAllData(prev => {
                return {
                    ...prev,
                    ...res.data
                }
            })

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
            <Form form={form} initialValues={initialValues} onFinish={handleFinish} layout="vertical">
                <Row style={{ marginBottom: 24 }}>
                    <Col xs={6}>
                        <Form.Item label="Owner" name="owner" style={{ marginBottom: 0 }}>
                            <Select
                                mode="multiple"
                                allowClear
                                placeholder="Select owner"
                                options={ownerOptions}
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

                {/* Action Controls */}
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