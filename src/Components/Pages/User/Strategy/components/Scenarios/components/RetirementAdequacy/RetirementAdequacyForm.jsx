import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, DatePicker, Form, message, Row, Select, Segmented, Space, Typography } from "antd";
import { useAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import dayjs from "dayjs";
import { discoveryDataAtom } from "../../../../../../../../store/authState.js";
import useApi from "../../../../../../../../hooks/useApi.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../../hooks/useUserDashboardData.js";

const { Text } = Typography;

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const RISK_PROFILE_OPTIONS = [
    { label: "Conservative", value: "Conservative" },
    { label: "Balanced", value: "Balanced" },
    { label: "Growth", value: "Growth" },
    { label: "High Growth", value: "High Growth" },
];

const HOME_OWNERSHIP_OPTIONS = [
    { label: "Homeowner", value: "Homeowner" },
    { label: "Non-Homeowner", value: "Non-Homeowner" },
];

const WITHDRAWAL_FREQUENCY_OPTIONS = [
    { label: "None", value: "None" },
    { label: "Monthly", value: "Monthly" },
    { label: "Quarterly", value: "Quarterly" },
    { label: "Annually", value: "Annually" },
];

function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === "") return undefined;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
    const numeric = parseCurrencyValue(value);
    return numeric !== undefined ? toCommaAndDollar(numeric) : "";
}

function parseDigitsValue(value) {
    return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
    return value?.target?.value ?? value;
}

function formatNumericInput(value, { currency = false } = {}) {
    const digits = parseDigitsValue(getChangedValue(value));
    if (!digits) return "";
    return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function SectionTitle({ children, extra }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 12 }}>
            <Text
                style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    color: "#6b7280",
                    textTransform: "uppercase",
                }}
            >
                {children}
            </Text>
            {extra}
        </div>
    );
}

function buildInitialPerson(person = {}, defaultName = "") {
    return {
        name: person?.name || defaultName,
        dob: person?.dob ? dayjs(person.dob) : null,
        balance: formatCurrencyValue(person?.balance ?? 0),
        nccTopUp: formatCurrencyValue(person?.nccTopUp ?? 0),
        nccTopUpYear: person?.nccTopUpYear || "Year 1",
        withdrawalAmount: formatCurrencyValue(person?.withdrawalAmount ?? 0),
        riskProfile: person?.riskProfile || "Balanced",
        investmentReturn: person?.investmentReturn ?? "5",
    };
}

function buildInitialValues(sectionData, allowPartner) {
    const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : ["client"];
    const owner = allowPartner ? rawOwner : rawOwner.filter((v) => v === "client");

    return {
        owner,
        pensionStartDate: sectionData?.pensionStartDate ? dayjs(sectionData.pensionStartDate) : dayjs("2026-07-01"),
        includeAgePension: sectionData?.includeAgePension ?? "Yes",
        relationshipStatus: sectionData?.relationshipStatus || "Auto (from own",
        homeOwnership: sectionData?.homeOwnership || "Homeowner",
        personalAssets: formatCurrencyValue(sectionData?.personalAssets ?? 0),
        otherInvestments: formatCurrencyValue(sectionData?.otherInvestments ?? 0),
        thresholdIndexation: sectionData?.thresholdIndexation ?? "2",
        annualLivingExpenses: formatCurrencyValue(sectionData?.annualLivingExpenses ?? 0),
        expensesIndexation: sectionData?.expensesIndexation ?? "2.5",
        extraWithdrawal: formatCurrencyValue(sectionData?.extraWithdrawal ?? 0),
        withdrawalFrequency: sectionData?.withdrawalFrequency || "None",
        client: buildInitialPerson(sectionData?.client, "Client name"),
        partner: buildInitialPerson(sectionData?.partner, "Partner name"),
    };
}

export default function RetirementAdequacyForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useOwnerOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const [discoveryData, setDiscoveryData] = useAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "retirementAdequacy"] || {};
    const allowPartner = !["Single", "Widowed"].includes(
        discoveryData?.personalDetails?.client?.clientMaritalStatus,
    );

    const availableOwnerOptions = useMemo(
        () =>
            allowPartner
                ? ownerOptions
                : ownerOptions.filter((option) => option.value === "client"),
        [allowPartner, ownerOptions],
    );

    const initialValues = useMemo(
        () => buildInitialValues(sectionData, allowPartner),
        [allowPartner, sectionData],
    );

    const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;
    const includeAgePension = Form.useWatch("includeAgePension", form) || initialValues.includeAgePension;

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!sectionData?._id);
    }, [form, initialValues, sectionData?._id]);

    useEffect(() => {
        if (!allowPartner && selectedOwners?.includes("partner")) {
            form.setFieldValue(
                "owner",
                selectedOwners.filter((owner) => owner === "client"),
            );
        }
    }, [allowPartner, form, selectedOwners]);

    // Account Details Table Columns
    const ACCOUNT_DETAILS_COLUMNS = [
        {
            title: "Owner",
            key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 80,
        },
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            field: "name",
            type: "text",
            placeholder: "Client name",
        },
        {
            title: "Date of Birth",
            dataIndex: "dob",
            key: "dob",
            field: "dob",
            type: "date",
            placeholder: "mm/dd/yyyy",
        },
        {
            title: "Balance ($)",
            dataIndex: "balance",
            key: "balance",
            field: "balance",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "NCC Top Up ($) (one-off)",
            dataIndex: "nccTopUp",
            key: "nccTopUp",
            field: "nccTopUp",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Withdrawal Amount ($) (one-off)",
            dataIndex: "withdrawalAmount",
            key: "withdrawalAmount",
            field: "withdrawalAmount",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Risk Profile",
            dataIndex: "riskProfile",
            key: "riskProfile",
            field: "riskProfile",
            type: "select",
            options: RISK_PROFILE_OPTIONS,
            width: 140,
        },
        {
            title: "Investment Return (%)",
            dataIndex: "investmentReturn",
            key: "investmentReturn",
            field: "investmentReturn",
            type: "text",
            placeholder: "0",
        },
    ];

    // Centrelink / Age Pension Table Columns
    const CENTRELINK_COLUMNS = [
        {
            title: "Relationship Status",
            dataIndex: "relationshipStatus",
            key: "relationshipStatus",
            field: "relationshipStatus",
            type: "text",
            placeholder: "Auto (from own",
        },
        {
            title: "Home Ownership",
            dataIndex: "homeOwnership",
            key: "homeOwnership",
            field: "homeOwnership",
            type: "select",
            options: HOME_OWNERSHIP_OPTIONS,
        },
        {
            title: "Personal Assets ($)",
            dataIndex: "personalAssets",
            key: "personalAssets",
            field: "personalAssets",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Other Financial Investments ($)",
            dataIndex: "otherInvestments",
            key: "otherInvestments",
            field: "otherInvestments",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Threshold Indexation (%)",
            dataIndex: "thresholdIndexation",
            key: "thresholdIndexation",
            field: "thresholdIndexation",
            type: "text",
            placeholder: "2",
        },
        {
            title: "Annual Living Expenses ($)",
            dataIndex: "annualLivingExpenses",
            key: "annualLivingExpenses",
            field: "annualLivingExpenses",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Expenses Indexation (%)",
            dataIndex: "expensesIndexation",
            key: "expensesIndexation",
            field: "expensesIndexation",
            type: "text",
            placeholder: "2.5",
        },
        {
            title: "Extra Withdrawal ($)",
            dataIndex: "extraWithdrawal",
            key: "extraWithdrawal",
            field: "extraWithdrawal",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Withdrawal Frequency",
            dataIndex: "withdrawalFrequency",
            key: "withdrawalFrequency",
            field: "withdrawalFrequency",
            type: "select",
            options: WITHDRAWAL_FREQUENCY_OPTIONS,
        },
    ];

    // Rows mapping for Account Details
    const accountRows = useMemo(
        () =>
            (selectedOwners || [])
                .filter((owner) => allowPartner || owner === "client")
                .map((owner) => ({
                    key: owner,
                    formPath: owner,
                    ownerLabel:
                        availableOwnerOptions.find((option) => option.value === owner)
                            ?.label || owner,
                    name: form.getFieldValue([owner, "name"]),
                    dob: form.getFieldValue([owner, "dob"]),
                    balance: form.getFieldValue([owner, "balance"]),
                    nccTopUp: form.getFieldValue([owner, "nccTopUp"]),
                    withdrawalAmount: form.getFieldValue([owner, "withdrawalAmount"]),
                    riskProfile: form.getFieldValue([owner, "riskProfile"]),
                    investmentReturn: form.getFieldValue([owner, "investmentReturn"]),
                })),
        [allowPartner, availableOwnerOptions, form, selectedOwners],
    );

    // Single row mapping for Centrelink table
    const centrelinkRow = useMemo(
        () => [
            {
                key: "centrelink",
                relationshipStatus: form.getFieldValue("relationshipStatus"),
                homeOwnership: form.getFieldValue("homeOwnership"),
                personalAssets: form.getFieldValue("personalAssets"),
                otherInvestments: form.getFieldValue("otherInvestments"),
                thresholdIndexation: form.getFieldValue("thresholdIndexation"),
                annualLivingExpenses: form.getFieldValue("annualLivingExpenses"),
                expensesIndexation: form.getFieldValue("expensesIndexation"),
                extraWithdrawal: form.getFieldValue("extraWithdrawal"),
                withdrawalFrequency: form.getFieldValue("withdrawalFrequency"),
            },
        ],
        [form],
    );

    const handleFinish = async (values) => {
        const formValues = form.getFieldsValue(true);
        const payload = {
            ...sectionData,
            ...formValues,
            pensionStartDate: formValues.pensionStartDate ? formValues.pensionStartDate.format("YYYY-MM-DD") : null,
            client: {
                ...formValues.client,
                dob: formValues.client?.dob ? formValues.client.dob.format("YYYY-MM-DD") : null,
            },
            partner: allowPartner
                ? {
                    ...formValues.partner,
                    dob: formValues.partner?.dob ? formValues.partner.dob.format("YYYY-MM-DD") : null,
                }
                : {},
        };

        try {
            setSaving(true);
            const saved = sectionData?._id
                ? await patch("/retirementAdequacy/Update", payload)
                : await post("/retirementAdequacy/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "retirementAdequacy"]: saved || payload,
            }));

            message.success(`Retirement adequacy inputs ${sectionData?._id ? "updated" : "saved"} successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save retirement adequacy settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: "16px 4px 0px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                onFinish={handleFinish}
                styles={{
                    label: {
                        fontWeight: "600",
                        fontSize: "13px",
                        fontFamily: "Arial, serif",
                    },
                }}
                colon={false}
                requiredMark={false}
            >
                <Row gutter={[16, 8]}>
                    {/* Owner Selector */}
                    <Col xs={24} md={8}>
                        <Form.Item
                            label="Owner"
                            name="owner"
                            style={{ marginBottom: 8 }}
                            rules={[{ required: true, message: "Owner is required" }]}
                        >
                            <Select
                                options={availableOwnerOptions}
                                mode="multiple"
                                placeholder="Select owner"
                                style={{ width: "100%" }}
                                disabled={!editing}
                            />
                        </Form.Item>
                    </Col>

                    {/* Section 1: Account Details */}
                    <Col xs={24}>
                        <SectionTitle>ACCOUNT DETAILS</SectionTitle>

                        <Form.Item
                            label="Pension Start Date"
                            name="pensionStartDate"
                            extra="applies to both Client & Partner"
                            style={{ marginBottom: 12, maxWidth: 300 }}
                        >
                            <DatePicker
                                format="MM/DD/YYYY"
                                style={{ width: "100%", backgroundColor: "#f0fdf4" }}
                                disabled={!editing}
                            />
                        </Form.Item>

                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={ACCOUNT_DETAILS_COLUMNS}
                            data={accountRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 2: Centrelink / Age Pension Projection */}
                    <Col xs={24} style={{ marginTop: 12 }}>
                        <SectionTitle
                            extra={
                                <Space align="center">
                                    <Text style={{ fontSize: 12, color: "#4b5563" }}>Include Age Pension</Text>
                                    <Form.Item name="includeAgePension" noStyle>
                                        <Segmented
                                            options={["Yes", "No"]}
                                            disabled={!editing}
                                            style={{
                                                backgroundColor: includeAgePension === "Yes" ? "#e6f4ea" : "#f3f4f6",
                                            }}
                                        />
                                    </Form.Item>
                                </Space>
                            }
                        >
                            CENTRELINK / AGE PENSION PROJECTION
                        </SectionTitle>

                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={CENTRELINK_COLUMNS}
                            data={centrelinkRow}
                            tableProps={TABLE_PROPS}
                        />

                        <Text type="secondary" style={{ display: "block", fontSize: 11, marginTop: 8 }}>
                            The Age Pension is assessed each year on the <b>closing account-based pension balance</b> (Client + Partner) plus the assets above. Payment rates & thresholds are taken from the <b>2025/26 Rate Reference</b> and indexed annually. Personal assets are assets-test only; other financial investments are also deemed for the income test. Living expenses (indexed) drive the <b>Surplus / (Shortfall)</b> column against total retirement income.
                        </Text>
                    </Col>

                    {/* Action Buttons */}
                    <Col xs={24}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 12,
                                marginTop: 16,
                            }}
                        >
                            <Space>
                                <Button onClick={() => modalData?.closeModal?.()}>
                                    Close
                                </Button>
                                {!editing ? (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        style={{ backgroundColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ backgroundColor: "#22c55e" }}
                                        loading={saving}
                                        disabled={saving}
                                    >
                                        Save
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}