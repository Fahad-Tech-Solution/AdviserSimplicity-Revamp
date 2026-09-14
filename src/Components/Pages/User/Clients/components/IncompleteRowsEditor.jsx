import React, { useState, useMemo, useEffect } from 'react';
import { Form, Table, Button, Space, Typography, Tag, Popconfirm, Alert } from 'antd';
import { CheckOutlined, WarningOutlined, DeleteOutlined } from '@ant-design/icons';
import { RiEdit2Fill, RiArrowTurnBackFill } from 'react-icons/ri';
import { MdOutlineSync } from 'react-icons/md';
import { useAtomValue } from 'jotai';
import { MyClientsData } from '../../../../../store/authState';
import DynamicFormField from '../../../../Common/DynamicFormField';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Text } = Typography;

// Configuration matching your target field schemas
const TARGET_FIELDS_CONFIG = [
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
];

const AU_PHONE_REGEX = /^(?:\+61|0)[2-478](?:[ ]?\d){8}$/;

const TITLE_OPTIONS = ["Dr.", "Miss", "Mr.", "Mrs.", "Ms.", "Prof."];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const MARITAL_OPTIONS = ["De Facto", "Married", "Partnered", "Single", "Widowed"];
const WORK_STATUS_OPTIONS = [
    "Centrelink Recipient", "Centrelink Retiree", "Employee", "Homemaker",
    "Not Working", "Self Employed", "Self-funded Retiree", "Student", "Unemployed"
];
const HEALTH_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];

export const FIELD_CONFIGS = {
    "Title": { type: "select", options: TITLE_OPTIONS, rules: [{ required: true, message: "Title is required" }] },
    "First Name": { type: "text", rules: [{ required: true, message: "First Name is required" }] },
    "Middle Name": { type: "text" },
    "Last Name": { type: "text", rules: [{ required: true, message: "Last Name is required" }] },
    "Preferred Name": { type: "text" },
    "Date of Birth": { type: "date", rules: [{ required: true, message: "Date of Birth is required" }] },
    "Gender": { type: "select", options: GENDER_OPTIONS, rules: [{ required: true, message: "Gender is required" }] },
    "Email": { type: "text", rules: [{ required: true, message: "Email is required" }, { type: "email", message: "Please enter a valid email address" }] },
    "Mobile Phone": { type: "text", rules: [{ required: true, message: "Mobile Phone is required" }, { pattern: AU_PHONE_REGEX, message: "Valid Australian Mobile Phone number Format: 0X XXXX XXXX" }] },
    "Work Phone": { type: "text", rules: [{ pattern: AU_PHONE_REGEX, message: "Valid Australian Mobile Phone number Format: 0X XXXX XXXX" }] },
    "Home Phone": { type: "text", rules: [{ pattern: AU_PHONE_REGEX, message: "Valid Australian Mobile Phone number Format: 0X XXXX XXXX" }] },
    "Home Address": { type: "text", rules: [{ required: true, message: "Home Address is required" }] },
    "Home Postcode": { type: "postalcode-search" },
    "Postal Address": { type: "text" },
    "Postal Postcode": { type: "postalcode-search", rules: [{ required: true, message: "Postal Postcode is required" }] },
    "Marital Status": { type: "select", options: MARITAL_OPTIONS },
    "Work Status": { type: "select", options: WORK_STATUS_OPTIONS },
    "Occupation": { type: "text" },
    "Retirement Age": { type: "number", rules: [{ type: "number", min: 40, max: 100, message: "Age must be between 40 and 100" }] },
    "Tax Resident": { type: "yesNoSwitch" },
    "HELP Debt": { type: "yesNoSwitch" },
    "Health": { type: "select", options: HEALTH_OPTIONS },
    "Smoker": { type: "yesNoSwitch" },
    "Private Health Cover": { type: "yesNoSwitch" }
};

export default function IncompleteRowsEditor({ data = [], onProceed, handleReset }) {
    const [form] = Form.useForm();
    const existingClients = useAtomValue(MyClientsData) || [];

    // Single global edit toggle state
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [apiErrorMessage, setApiErrorMessage] = useState("");

    const normalize = (val) => String(val || '').trim().toLowerCase();

    // Process and flag problematic data rows
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

        return data
            .map((row, index) => {
                const rowEmail = normalize(row.email || row.Email || row['EMAIL']);
                const rowPhone = normalize(row.phone || row.Phone || row['PHONE'] || row['MOBILE PHONE'] || row['CLIENT WORK PHONE']);

                const isSystemDuplicate = (rowEmail && existingEmails.has(rowEmail)) || (rowPhone && existingPhones.has(rowPhone));
                const isFileDuplicate = (rowEmail && emailCounts[rowEmail] > 1) || (rowPhone && phoneCounts[rowPhone] > 1);

                const missingFields = [];

                // 1. Normalize and parse dates directly into row keys
                const normalizedRow = { ...row };
                Object.keys(normalizedRow).forEach((key) => {
                    const lowerKey = key.toLowerCase();
                    const rawVal = normalizedRow[key];

                    if (lowerKey.includes('date') || lowerKey.includes('dob')) {
                        if (rawVal && typeof rawVal === 'string') {
                            // Parse string into DayJS object
                            const parsedDate = dayjs(rawVal, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
                            normalizedRow[key] = parsedDate.isValid() ? parsedDate : null;
                        }
                    }
                });

                // 2. Validate missing fields against normalized row values
                TARGET_FIELDS_CONFIG.forEach((fieldCfg) => {
                    const normalizedAliases = fieldCfg.aliases.map((alias) => alias.toLowerCase().trim());
                    const matchingKey = Object.keys(normalizedRow).find((col) => {
                        const normalizedCol = col.toLowerCase().trim();
                        return normalizedAliases.some((alias) => normalizedCol === alias);
                    });

                    if (!matchingKey) {
                        missingFields.push(fieldCfg.key);
                    } else {
                        const val = normalizedRow[matchingKey];
                        // Check for null/empty string/invalid DayJS object
                        if (val === undefined || val === null || val === '' || (dayjs.isDayjs(val) && !val.isValid())) {
                            missingFields.push(matchingKey);
                        }
                    }
                });

                return {
                    ...normalizedRow,
                    key: row.id || `row_${index}`,
                    _isSystemDuplicate: isSystemDuplicate,
                    _isFileDuplicate: isFileDuplicate,
                    _missingFields: missingFields,
                };
            })
            .filter((row) => row._isSystemDuplicate || row._isFileDuplicate || row._missingFields.length > 0);
    }, [data, existingClients]);

    const [tableRows, setTableRows] = useState(flaggedData);

    useEffect(() => {
        setTableRows(flaggedData);
    }, [flaggedData]);

    // Populate Ant Design Form initial/current values
    useEffect(() => {
        const formValues = {};
        tableRows.forEach((row) => {
            formValues[row.key] = { ...row };
        });
        form.setFieldsValue(formValues);
    }, [tableRows, form]);

    const handleSkipRow = (rowKey) => {
        const currentRowValues = form.getFieldValue(rowKey) || {};
        const newSkippedStatus = !currentRowValues._isSkipped;

        // 1. If skipping, reset validation errors for this row
        if (newSkippedStatus) {
            const fieldsToReset = Object.keys(currentRowValues).map((field) => [rowKey, field]);
            form.setFields(
                fieldsToReset.map((namePath) => ({
                    name: namePath,
                    errors: [], // Clear red error messages
                }))
            );
        }

        // 2. Update Form values
        form.setFieldsValue({
            [rowKey]: {
                ...currentRowValues,
                _isSkipped: newSkippedStatus,
            },
        });

        // 3. Update Table state
        setTableRows((prev) =>
            prev.map((item) => {
                if (item.key === rowKey) {
                    return {
                        ...item,
                        ...currentRowValues,
                        _isSkipped: newSkippedStatus,
                    };
                }
                return item;
            })
        );
    };

    // Columns declaration controlled by single `editing` state
    // 1. Un-fixed/Problematic Columns list ko initial dataset base par lock karein
    const initialProblematicKeys = useMemo(() => {
        if (!flaggedData.length) return [];

        const keysSet = new Set();

        flaggedData.forEach((row) => {
            // Missing fields add karein
            row._missingFields?.forEach((field) => keysSet.add(field));

            // Duplicate fields add karein
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
                    keysSet.add(k);
                }
            });
        });

        // Filtering active columns based strictly on initial dataset state
        return Array.from(keysSet).filter((key) => {
            if (key === 'Email') return true;
            return flaggedData.some(
                (row) => row?.[key] === undefined || row?.[key] === null || row?.[key] === ''
            );
        });
    }, [flaggedData]);

    // 2. Updated Columns Memo
    const columns = useMemo(() => {
        if (!data.length) return [];

        const dynamicCols = [
            {
                title: '# Index',
                dataIndex: 'key',
                key: 'key',
                width: 80,
                render: (text) => <Text type="secondary">{parseFloat(text?.replace(/[^0-9]/g, "")) + 1}</Text>,
            },
            {
                title: 'Issue Status',
                key: 'status_warning',
                width: 150,
                render: (_, record) => (
                    <Space direction="vertical" size={2}>
                        {record._isSkipped ? (
                            <Tag color="blue">Skipped</Tag>
                        ) : (
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
                        )}
                    </Space>
                ),
            },
        ];

        // Locked active columns iterate hongey (Editing fill hone par hide nahi hongey)
        initialProblematicKeys.forEach((key) => {
            const config = FIELD_CONFIGS[key] || { type: "text" };
            const lowerKey = key.toLowerCase();
            const isDateField = lowerKey.includes('date') || lowerKey.includes('dob');



            dynamicCols.push({
                title: key,
                dataIndex: key,
                key: key,
                render: (text, record) => {
                    // READ-ONLY MODE (When not editing)
                    if (!editing) {
                        if (!text) return <Tag color="red">Empty</Tag>;

                        // Format Dayjs or Date object to DD/MM/YYYY for Australian format
                        if (isDateField) {
                            const parsed = dayjs(text);
                            return parsed.isValid() ? parsed.format('DD/MM/YYYY') : String(text);
                        }

                        return String(text);
                    }

                    // 1. If row is skipped, do NOT enforce validation rules
                    const activeRules = record._isSkipped ? [] : (config.rules || []);

                    // EDIT MODE
                    return (
                        <DynamicFormField
                            form={form}
                            name={[record.key, key]}
                            type={config.type}
                            placeholder={`Enter ${key}`}
                            options={config.options || []}
                            rules={activeRules} // <-- Pass empty array if skipped
                            disabled={!editing}
                            formItemProps={{
                                style: { margin: 0 }
                            }}
                        />
                    );
                },
            });
        });

        // Action Column
        dynamicCols.push({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Popconfirm
                    title="Skip this row?"
                    onConfirm={() => handleSkipRow(record.key)}
                    okText="Yes"
                    cancelText="No"
                    disabled={!editing}
                >
                    {record._isSkipped ? (
                        <Button type="text" size="small" icon={<RiArrowTurnBackFill />} disabled={!editing}>
                            Undo
                        </Button>
                    ) : (
                        <Button type="text" danger size="small" icon={<RiArrowTurnBackFill />} disabled={!editing}>
                            Skip
                        </Button>
                    )}
                </Popconfirm>
            ),
        });

        return dynamicCols;
    }, [data, editing, initialProblematicKeys, form]);

    const handleConfirmAndProceed = async () => {
        setLoading(true);
        try {
            const formValues = await form.validateFields();

            const finalAllRows = data
                .filter((origRow) => {
                    const match = tableRows.find(
                        (r) => (r._key || r.key) === (origRow._key || origRow.key)
                    );
                    return match ? !match._isSkipped : true;
                })
                .map((origRow) => {
                    const rowKey = origRow._key || origRow.key;
                    const rowFormEdits = formValues[rowKey] || {};
                    const tableRowMatch = tableRows.find(
                        (r) => (r._key || r.key) === rowKey
                    );

                    return {
                        ...origRow,
                        ...(tableRowMatch || {}),
                        ...rowFormEdits,
                    };
                });

            if (onProceed) {
                let res = await onProceed(finalAllRows);

                if (res?.success === false) {
                    // Set global message or detailed row messages
                    setApiErrorMessage(res?.message || "Some rows contain validation errors.");

                    if (Array.isArray(res.errors)) {
                        const duplicateEmails = new Set(
                            res.errors.map((err) => normalize(err.email)).filter(Boolean)
                        );
                        const errorRowIndices = new Set(
                            res.errors.map((err) => err.row - 1).filter((idx) => idx >= 0)
                        );

                        const flaggedKeys = new Set();
                        finalAllRows.forEach((row, index) => {
                            const rowEmail = normalize(row.email || row.Email || row.EMAIL);
                            const key = row.key || row._key;

                            if (duplicateEmails.has(rowEmail) || errorRowIndices.has(index)) {
                                if (key) flaggedKeys.add(key);
                            }
                        });

                        setTableRows((previousRows) =>
                            previousRows.map((row) => {
                                const rowKey = row.key || row._key;
                                if (flaggedKeys.has(rowKey)) {
                                    return { ...row, _isSystemDuplicate: true };
                                }
                                return row;
                            })
                        );
                    }
                    setEditing(true);
                } else {
                    setApiErrorMessage("");
                    setEditing(false);
                }
            }
        } catch (error) {
            console.error("Validation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const ErrorStatus = useMemo(() => {
        const systemDuplicates = tableRows.filter((row) => row._isSystemDuplicate).length;
        const fileDuplicates = tableRows.filter((row) => row._isFileDuplicate).length;
        const missingDataRows = tableRows.filter((row) => row._missingFields?.length > 0).length;
        return systemDuplicates > 0 || fileDuplicates > 0 || missingDataRows > 0;
    }, [tableRows]);

    return (
        <div>
            <Alert
                message={
                    ErrorStatus
                        ? "File Processed - Action Required"
                        : "File Processed Successfully"
                }
                description={
                    ErrorStatus
                        ? apiErrorMessage || "Please review and fix the flagged issues below before proceeding."
                        : null
                }
                type={ErrorStatus ? "error" : "success"}
                showIcon
                action={
                    <Button
                        type="primary"
                        icon={<MdOutlineSync />}
                        onClick={() => {
                            setApiErrorMessage("");
                            handleReset();
                        }}
                    >
                        Reset
                    </Button>
                }
            />

            {ErrorStatus && (
                <Form form={form} component={false}>
                    <div style={{ marginTop: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <Text type="secondary">
                                Displaying flagged records. Click <strong>Edit</strong> to modify all row values at once.
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

                        {/* Single Action Bar matching CreditCardModal styling */}
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <Space>
                                <Button onClick={handleReset}>
                                    Cancel
                                </Button>
                                {!editing ? (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
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
                        </div>
                    </div>
                </Form>
            )}
        </div>
    );
}