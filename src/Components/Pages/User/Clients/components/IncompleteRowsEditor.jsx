import React, { useState, useMemo, useEffect } from 'react';
import { Form, Table, Input, Button, Space, Typography, Tag, Popconfirm, Alert } from 'antd';
import { DeleteOutlined, EditOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons';
import { useAtomValue } from 'jotai';
import { MyClientsData } from '../../../../../store/authState';
import { RiArrowTurnBackFill } from 'react-icons/ri';
import { MdOutlineSync } from 'react-icons/md';


const { Text } = Typography;

// 1. Scalable Configuration: Add target field names and their potential aliases here
const TARGET_FIELDS_CONFIG = [
    // --- Main Client Fields ---
    { key: 'Title', aliases: ['title', 'salutation', 'mr', 'mrs', 'ms', 'dr'] },
    { key: 'Preferred Name', aliases: ['preferred name', 'preferred_name', 'preferredname', 'pname', 'nickname'] },
    { key: 'First Name', aliases: ['first name', 'first_name', 'firstname', 'fname', 'given name'] },
    { key: 'Middle Name', aliases: ['middle name', 'middle_name', 'middlename', 'mname'] },
    { key: 'Last Name', aliases: ['last name', 'last_name', 'lastname', 'lname', 'surname'] },
    { key: 'Gender', aliases: ['gender', 'sex'] },
    { key: 'Date of Birth', aliases: ['date of birth', 'date_of_birth', 'dateofbirth', 'dob', 'birth date'] },
    { key: 'Marital Status', aliases: ['marital status', 'marital_status', 'maritalstatus', 'civil status'] },
    { key: 'Work Status', aliases: ['work status', 'work_status', 'workstatus', 'employment status', 'employment_status'] },
    { key: 'Occupation', aliases: ['occupation', 'job title', 'job_title', 'profession', 'role'] },
    { key: 'Retirement Age', aliases: ['retirement age', 'retirement_age', 'retirementage', 'target retirement age'] },
    { key: 'Tax Resident', aliases: ['tax resident', 'tax_resident', 'taxresident', 'tax residency'] },
    { key: 'HELP Debt', aliases: ['help debt', 'help_debt', 'helpdebt', 'hecs', 'hecs debt', 'hecs_debt', 'student debt'] },
    { key: 'Health', aliases: ['health', 'health status', 'health_status'] },
    { key: 'Smoker', aliases: ['smoker', 'smoker status', 'tobacco'] },
    { key: 'Private Health Cover', aliases: ['private health cover', 'private_health_cover', 'privatehealthcover', 'health insurance', 'private health'] },
    { key: 'Home Address', aliases: ['home address', 'home_address', 'homeaddress', 'residential address', 'street address'] },
    { key: 'Home Postcode', aliases: ['home postcode', 'home_postcode', 'homepostcode', 'postcode', 'zip code', 'zip'] },
    { key: 'Postal Address', aliases: ['postal address', 'postal_address', 'postaladdress', 'mailing address'] },
    { key: 'Postal Postcode', aliases: ['postal postcode', 'postal_postcode', 'postalpostcode', 'mailing postcode', 'mailing zip'] },
    { key: 'Mobile Phone', aliases: ['mobile phone', 'mobile_phone', 'mobilephone', 'mobile', 'cell', 'cell phone'] },
    { key: 'Home Phone', aliases: ['home phone', 'home_phone', 'homephone', 'landline'] },
    { key: 'Work Phone', aliases: ['work phone', 'work_phone', 'workphone', 'wphone', 'office phone'] },
    { key: 'Email', aliases: ['email', 'e-mail', 'mail', 'email address'] },

    // --- Partner Fields ---
    { key: 'Partner Title', aliases: ['partner title', 'partner_title', 'partnertitle', 'partner salutation'] },
    { key: 'Partner Preferred Name', aliases: ['partner preferred name', 'partner_preferred_name', 'partnerpreferredname', 'partner pname'] },
    { key: 'Partner First Name', aliases: ['partner first name', 'partner_first_name', 'partnerfirstname', 'partner fname'] },
    { key: 'Partner Middle Name', aliases: ['partner middle name', 'partner_middle_name', 'partnermiddlename', 'partner mname'] },
    { key: 'Partner Last Name', aliases: ['partner last name', 'partner_last_name', 'partnerlastname', 'partner lname', 'partner surname'] },
    { key: 'Partner Gender', aliases: ['partner gender', 'partner_gender', 'partnergender', 'partner sex'] },
    { key: 'Partner Date of Birth', aliases: ['partner date of birth', 'partner_date_of_birth', 'partnerdateofbirth', 'partner dob', 'partner birth date'] },
    { key: 'Partner Marital Status', aliases: ['partner marital status', 'partner_marital_status', 'partnermaritalstatus'] },
    { key: 'Partner Work Status', aliases: ['partner work status', 'partner_work_status', 'partnerworkstatus', 'partner employment status'] },
    { key: 'Partner Occupation', aliases: ['partner occupation', 'partner_occupation', 'partneroccupation', 'partner job title', 'partner profession'] },
    { key: 'Partner Retirement Age', aliases: ['partner retirement age', 'partner_retirement_age', 'partnerretirementage'] },
    { key: 'Partner Tax Resident', aliases: ['partner tax resident', 'partner_tax_resident', 'partnertaxresident'] },
    { key: 'Partner HELP Debt', aliases: ['partner help debt', 'partner_help_debt', 'partnerhelpdebt', 'partner hecs'] },
    { key: 'Partner Health', aliases: ['partner health', 'partner_health', 'partnerhealth'] },
    { key: 'Partner Smoker', aliases: ['partner smoker', 'partner_smoker', 'partnersmoker'] },
    { key: 'Partner Private Health Cover', aliases: ['partner private health cover', 'partner_private_health_cover', 'partnerprivatehealthcover', 'partner health insurance'] },
    { key: 'Partner Home Address', aliases: ['partner home address', 'partner_home_address', 'partnerhomeaddress', 'partner residential address'] },
    { key: 'Partner Postcode', aliases: ['partner postcode', 'partner_postcode', 'partnerpostcode', 'partner home postcode', 'partner zip'] },
    { key: 'Partner Postal Address', aliases: ['partner postal address', 'partner_postal_address', 'partnerpostaladdress', 'partner mailing address'] },
    { key: 'Partner Postal Postcode', aliases: ['partner postal postcode', 'partner_postal_postcode', 'partnerpostalpostcode', 'partner mailing postcode'] },
    { key: 'Partner Mobile', aliases: ['partner mobile', 'partner_mobile', 'partnermobile', 'partner mobile phone', 'partner cell'] },
    { key: 'Partner Home Phone', aliases: ['partner home phone', 'partner_home_phone', 'partnerhomephone', 'partner landline'] },
    { key: 'Partner Work Phone', aliases: ['partner work phone', 'partner_work_phone', 'partnerworkphone', 'partner office phone'] },
    { key: 'Partner Email', aliases: ['partner email', 'partner_email', 'partneremail', 'partner e-mail', 'partner mail'] }
];

export default function IncompleteRowsEditor({ data = [], onProceed, handleReset }) {
    const [form] = Form.useForm();
    const existingClients = useAtomValue(MyClientsData) || [];
    const [editingRowKeys, setEditingRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);

    const normalize = (val) => String(val || '').trim().toLowerCase();

    // 1. Process and flag rows with missing data or duplicates
    const flaggedData = useMemo(() => {
        const clientsList = Array.isArray(existingClients)
            ? existingClients
            : existingClients?.clients || [];

        const existingEmails = new Set();
        const existingPhones = new Set();

        clientsList.forEach((c) => {
            if (c?.client?.Email) existingEmails.add(normalize(c.client.Email));
            if (c?.client?.clientWorkPhone) existingPhones.add(normalize(c.client.clientWorkPhone));
            if (c?.client?.clientMobilePhone) existingPhones.add(normalize(c.client.clientMobilePhone));

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

        let flaggedData = data
            .map((row, index) => {
                const rowEmail = normalize(row.email || row.Email || row['EMAIL']);
                const rowPhone = normalize(row.phone || row.Phone || row['PHONE'] || row['MOBILE PHONE'] || row['CLIENT WORK PHONE']);

                const isSystemDuplicate = (rowEmail && existingEmails.has(rowEmail)) || (rowPhone && existingPhones.has(rowPhone));
                const isFileDuplicate = (rowEmail && emailCounts[rowEmail] > 1) || (rowPhone && phoneCounts[rowPhone] > 1);

                const missingFields = [];

                // Fixed: Check configured TARGET_FIELDS explicitly against row keys & values
                TARGET_FIELDS_CONFIG.forEach((fieldCfg) => {
                    // Normalize aliases once
                    const normalizedAliases = fieldCfg.aliases.map((alias) => alias.toLowerCase().trim());

                    // Strict exact match against normalized column names
                    const matchingKey = Object.keys(row).find((col) => {
                        const normalizedCol = col.toLowerCase().trim();
                        return normalizedAliases.some((alias) => normalizedCol === alias);
                    });

                    if (!matchingKey) {
                        // Key missing entirely from row object
                        missingFields.push(fieldCfg.key);
                    } else if (!row[matchingKey] || String(row[matchingKey]).trim() === '') {
                        // Key exists but value is empty
                        missingFields.push(matchingKey);
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

        return flaggedData;

    }, [data, existingClients]);

    const [tableRows, setTableRows] = useState(flaggedData);

    // Sync flaggedData when props update
    useEffect(() => {
        setTableRows(flaggedData);
    }, [flaggedData]);

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
        //update table rows accordingly
        if (!enable) {
            const updatedRows = tableRows.map((row) => {
                if (row.key === rowKey) {
                    const formValues = form.getFieldValue(rowKey);
                    return { ...row, ...formValues };
                }
                return row;
            });
            setTableRows(updatedRows);
        }
    };

    const handleSkipRow = (rowKey) => {
        setTableRows((prev) =>
            prev.map((item) =>
                item.key === rowKey ? { ...item, _isSkipped: true } : item
            )
        );

        // Clear out active edit state for this row if necessary
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
                    (lower.includes('email') ||
                        lower.includes('last name') ||
                        lower.includes('preferred name') ||
                        lower.includes('date of birth') ||
                        lower.includes('home address') ||
                        lower.includes('work phone') ||
                        lower.includes('marital status'))
                ) {
                    problematicKeys.add(k);
                }
            });
        });

        const activeColumns = Array.from(problematicKeys).filter((key) => {
            // Always include 'Email' regardless of completeness
            if (key === 'Email') return true;

            // Keep the column if AT LEAST ONE row is missing a value (null, undefined, or empty string)
            const hasMissingData = tableRows.some(
                (row) => row?.[key] === undefined || row?.[key] === null || row?.[key] === ''
            );

            return hasMissingData;
        });


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
                        {record._isSkipped ? (
                            <Tag color="blue">Skipped</Tag>
                        ) :
                            <>
                                {record._isSystemDuplicate && (
                                    <Tag color="error" icon={<WarningOutlined />}>System Duplicate</Tag>
                                )}
                                {record._isFileDuplicate && (
                                    <Tag color="warning" icon={<WarningOutlined />}>File Duplicate</Tag>
                                )}
                                {record._missingFields?.length > 0 && (
                                    <Tag color="volcano">Missing Data</Tag>
                                )}
                            </>
                        }
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
                            <Button type="text" danger size="small" icon={<RiArrowTurnBackFill />}>
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
        setLoading(true);
        try {
            // Validate all form fields
            const formValues = await form.validateFields();

            // Map over all initial/raw dataset items
            const finalAllRows = data
                .filter((origRow) => {
                    // Find if this row exists in tableRows and check skipped status
                    const match = tableRows.find(
                        (r) => (r._key || r.key) === (origRow._key || origRow.key)
                    );
                    return match ? !match._isSkipped : true;
                })
                .map((origRow) => {
                    const rowKey = origRow._key || origRow.key;

                    // Get edited form fields specific to this row
                    const rowFormEdits = formValues[rowKey] || {};

                    // Find corresponding state from tableRows if modified
                    const tableRowMatch = tableRows.find(
                        (r) => (r._key || r.key) === rowKey
                    );

                    return {
                        ...origRow,
                        ...(tableRowMatch || {}),
                        ...rowFormEdits, // Overwrite with newly validated form values
                    };
                });

            if (onProceed) {
                let res = await onProceed(finalAllRows);
                if (res?.success === false && Array.isArray(res.errors)) {
                    const duplicateEmails = new Set(
                        res.errors
                            .map((error) => normalize(error.email))
                            .filter(Boolean)
                    );

                    setTableRows((previousRows) => {
                        const rowsByKey = new Map(
                            previousRows.map((row) => [row.key || row._key, row])
                        );

                        finalAllRows.forEach((row, index) => {
                            const rowEmail = normalize(row.email || row.Email || row.EMAIL);
                            const hasMatchingError = duplicateEmails.has(rowEmail) ||
                                res.errors.some((error) => error.row === index + 1);

                            if (hasMatchingError) {
                                const key = row.key || row._key || `row_${index}`;
                                rowsByKey.set(key, {
                                    ...(rowsByKey.get(key) || {}),
                                    ...row,
                                    key,
                                    _isSystemDuplicate: true,
                                }); }
                        });
                        return Array.from(rowsByKey.values());
                    });
                }
            }
        } catch (error) {
            console.error("Validation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const ErrorStatus = useMemo(() => {
        const totalRows = tableRows.length;
        const systemDuplicates = tableRows.filter((row) => row._isSystemDuplicate).length;
        const fileDuplicates = tableRows.filter((row) => row._isFileDuplicate).length;
        const missingDataRows = tableRows.filter((row) => row._missingFields?.length > 0).length;
        // return true false if any of the counts are greater than 0
        return systemDuplicates > 0 || fileDuplicates > 0 || missingDataRows > 0;
    }, [tableRows]);

    return (
        <div>
            <Alert
                message={`File Processed Successfully` + (ErrorStatus ? ` - but have following issues` : '')}
                type={ErrorStatus ? "error" : "success"}
                showIcon
                action={
                    <Space>
                        <Button
                            type="primary"
                            icon={<MdOutlineSync />}
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                        {!ErrorStatus && (

                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                loading={loading}
                                onClick={handleConfirmAndProceed}
                            >
                                Save Data
                            </Button>
                        )}
                    </Space>
                }
            />

            {ErrorStatus && (
                <Form form={form} component={false}>
                    <div style={{ marginTop: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <Text type="secondary">
                                Displaying only flagged rows and missing/duplicate fields. Click <strong>Edit</strong> to modify or <strong>Skip</strong> to drop.
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
                                showTotal: (total) => `Total ${total} items`,
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
                                    loading={loading}
                                    onClick={handleConfirmAndProceed}
                                >
                                    Confirm & Proceed
                                </Button>
                            </Space>
                        </div>
                    </div>
                </Form>
            )}

        </div>
    );
}