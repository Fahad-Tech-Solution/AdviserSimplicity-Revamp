import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, DatePicker, Form, message, Row, Select, Segmented, Space, Typography } from "antd";
import { useAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import dayjs from "dayjs";
import { SelectedReviewAllData } from "../../../../../../../../store/authState.js";
import useApi from "../../../../../../../../hooks/useApi.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import { useReviewOptions } from "../../../../../../../../hooks/useUserDashboardData.js";

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
    { label: "Cash", value: "Cash" },
    { label: "Conservative", value: "Conservative" },
    { label: "Moderately Conservative", value: "Moderately Conservative" },
    { label: "Balanced", value: "Balanced" },
    { label: "Growth", value: "Growth" },
    { label: "High Growth", value: "High Growth" },
];

const HOME_OWNERSHIP_OPTIONS = [
    { label: "Homeowner", value: "Homeowner" },
    { label: "Non-Homeowner", value: "Non-Homeowner" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
    { label: "Auto (from owners)", value: "Auto" },
    { label: "Single", value: "Single" },
    { label: "Couple", value: "Couple" },
];

const WITHDRAWAL_FREQUENCY_OPTIONS = [
    { label: "None", value: "None" },
    { label: "Year 1 only", value: "Year 1 only" },
    { label: "Every year", value: "Every year" },
    { label: "Every 2 years", value: "Every 2 years" },
    { label: "Every 3 years", value: "Every 3 years" },
    { label: "Every 5 years", value: "Every 5 years" },
    { label: "Random (occasional)", value: "Random (occasional)" },
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

function formatPercentValue(value) {
    const rawValue = String(getChangedValue(value) ?? "").replace(/[^0-9.-]/g, "");
    if (!rawValue || rawValue === "." || rawValue === "-") return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return "";
    const limited = Math.min(Math.max(numeric, 0), 100);
    return `${limited}%`;
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

function buildInitialPerson(person = {}) {
    return {
        preferredName: person?.preferredName || "",
        DOB: person?.DOB ? dayjs(person.DOB) : null,
        accountBasedPensionTotal: formatCurrencyValue(person?.accountBasedPensionTotal),
        nccTopUp: formatCurrencyValue(person?.nccTopUp),
        nccTopUpYear: person?.nccTopUpYear || "Year 1",
        withdrawalAmount: formatCurrencyValue(person?.withdrawalAmount),
        riskGoal: person?.riskGoal || "Balanced",
        investmentReturn: person?.investmentReturn ?? "",
    };
}

function buildInitialValues(sectionData) {
    const rawOwner = Array.isArray(sectionData?.owner) && sectionData.owner.length > 0
        ? sectionData.owner
        : ["client", "partner"];

    const agePension = sectionData?.agePensionProjection || {};

    return {
        owner: rawOwner,
        pensionStartDate: sectionData?.pensionStartDate ? dayjs(sectionData.pensionStartDate) : null,
        includeAgePension: sectionData?.includeAgePension ? "Yes" : "No",
        client: buildInitialPerson(sectionData?.client),
        partner: buildInitialPerson(sectionData?.partner),
        agePensionProjection: {
            relationshipStatus: agePension?.relationshipStatus || "Auto (from owners)",
            homeOwnership: agePension?.homeOwnership || "Non-Homeowner",
            personalAssets: agePension?.personalAssets || "$0",
            otherFinancialInvestments: (agePension?.otherFinancialInvestments || "$0"),
            thresholdIndexation: agePension?.thresholdIndexation ?? "2.5%",
            annualLivingExpenses: (agePension?.annualLivingExpenses || "$0"),
            expensesIndexation: agePension?.expensesIndexation ?? "2.5%",
            extraWithdrawal: (agePension?.extraWithdrawal || "$0"),
            withdrawalFrequency: agePension?.withdrawalFrequency || "None",
        },
    };
}

export default function RetirementAdequacyForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useReviewOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();

    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const initialData = selectedReviewAllData?.retirementAdequacyDetails || {};

    const initialValues = useMemo(
        () => buildInitialValues(initialData),
        [initialData]
    );

    const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;
    const includeAgePension = Form.useWatch("includeAgePension", form) || initialValues.includeAgePension;
    const agePensionProjection =
        Form.useWatch("agePensionProjection", form) || initialValues.agePensionProjection;

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!initialData?._id);
    }, [form, initialValues, initialData?._id]);

    // Account Details Table Columns
    const ACCOUNT_DETAILS_COLUMNS = [
        {
            title: "Owner",
            key: "ownerRole",
            dataIndex: "ownerRole",
            editable: false,
            width: 80,
            renderView: ({ record }) => (
                <span style={{ fontWeight: 600 }}>{record?.preferredName}</span>
            ),
        },
        {
            title: "Balance ($)",
            dataIndex: "accountBasedPensionTotal",
            key: "accountBasedPensionTotal",
            field: "accountBasedPensionTotal",
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
            title: "NCC Top Up ($)",
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
            title: "NCC Top Up Year",
            dataIndex: "nccTopUpYear",
            key: "nccTopUpYear",
            field: "nccTopUpYear",
            type: "select",
            options: Array.from({ length: 30 }, (_, i) => ({ label: `Year ${i + 1}`, value: `Year ${i + 1}` })),
        },
        {
            title: "Withdrawal Amount ($)",
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
            title: "Risk Goal",
            dataIndex: "riskGoal",
            key: "riskGoal",
            field: "riskGoal",
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
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value, { currency: false }),
                );
            }
        },
    ];

    // Centrelink / Age Pension Table Columns
    const CENTRELINK_COLUMNS = [
        {
            title: "Relationship Status",
            dataIndex: "relationshipStatus",
            key: "relationshipStatus",
            field: "relationshipStatus",
            placeholder: "Auto (from owners)",
            type: "select",
            options: RELATIONSHIP_STATUS_OPTIONS,
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
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Other Financial Investments ($)",
            dataIndex: "otherFinancialInvestments",
            key: "otherFinancialInvestments",
            field: "otherFinancialInvestments",
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
            title: "Threshold Indexation (%)",
            dataIndex: "thresholdIndexation",
            key: "thresholdIndexation",
            field: "thresholdIndexation",
            type: "text",
            placeholder: "2.5%",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value, { currency: false }),
                );
            }
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
                    [record.formPath, column.field],
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
            placeholder: "2.5%",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value, { currency: false }),
                );
            },
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
                    [record.formPath, column.field],
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
            (selectedOwners || []).map((ownerKey) => {
                const isClient = ownerKey.toLowerCase() === "client";
                const personData = isClient ? initialData?.client : initialData?.partner;

                return {
                    key: ownerKey,
                    formPath: ownerKey,
                    ownerRole: isClient ? "Client" : "Partner",
                    ownerLabel:
                        ownerOptions.find((option) => option.value === ownerKey)?.label ||
                        (isClient ? "Client" : "Partner"),
                    preferredName:
                        form.getFieldValue([ownerKey, "preferredName"]) ??
                        personData?.preferredName ??
                        "",
                    DOB:
                        form.getFieldValue([ownerKey, "DOB"]) ??
                        (personData?.DOB ? dayjs(personData.DOB) : null),
                    accountBasedPensionTotal:
                        form.getFieldValue([ownerKey, "accountBasedPensionTotal"]) ??
                        formatCurrencyValue(personData?.accountBasedPensionTotal),
                    nccTopUp:
                        form.getFieldValue([ownerKey, "nccTopUp"]) ??
                        formatCurrencyValue(personData?.nccTopUp),
                    nccTopUpYear:
                        form.getFieldValue([ownerKey, "nccTopUpYear"]) ??
                        personData?.nccTopUpYear ??
                        "Year 1",
                    withdrawalAmount:
                        form.getFieldValue([ownerKey, "withdrawalAmount"]) ??
                        formatCurrencyValue(personData?.withdrawalAmount),
                    riskGoal:
                        form.getFieldValue([ownerKey, "riskGoal"]) ??
                        personData?.riskGoal ??
                        "Balanced",
                    investmentReturn:
                        form.getFieldValue([ownerKey, "investmentReturn"]) ??
                        personData?.investmentReturn ??
                        "",
                };
            }),
        [form, initialData, ownerOptions, selectedOwners]
    );

    // Single row mapping for Centrelink table
    const centrelinkRow = useMemo(
        () => [
            {
                key: "agePensionProjection",
                formPath: "agePensionProjection",
                ...agePensionProjection,
            },
        ],
        [agePensionProjection]
    );

    const handleFinish = async (values) => {
        try {
            setSaving(true);
            const activeOwners = values?.owner || [];

            const buildPayloadForOwner = (ownerKey) => {
                const ownerInput = values?.[ownerKey] || {};
                const ownerOldInput = initialData?.[ownerKey] || {};
                return {
                    preferredName: ownerInput.preferredName || ownerOldInput.preferredName || "",
                    DOB: ownerInput.DOB ? dayjs(ownerInput.DOB).toISOString() : ownerOldInput.DOB || "",
                    accountBasedPensionTotal: ownerInput.accountBasedPensionTotal || ownerOldInput.accountBasedPensionTotal || "",
                    nccTopUp: ownerInput.nccTopUp || ownerOldInput.nccTopUp || "",
                    nccTopUpYear: ownerInput.nccTopUpYear || ownerOldInput.nccTopUpYear || "Year 1",
                    withdrawalAmount: ownerInput.withdrawalAmount || ownerOldInput.withdrawalAmount || "",
                    riskGoal: ownerInput.riskGoal || ownerOldInput.riskGoal || "",
                    investmentReturn: ownerInput.investmentReturn || ownerOldInput.investmentReturn || "",
                };
            };

            const clientSelected = activeOwners.includes("client");
            const partnerSelected = activeOwners.includes("partner");
            const isAgePensionIncluded = values?.includeAgePension === "Yes";

            const agePensionInput = values?.agePensionProjection || {};
            const agePensionOldInput = initialData?.agePensionProjection || {};

            const payload = {
                ...initialData,
                pensionStartDate: values?.pensionStartDate ? dayjs(values.pensionStartDate).toISOString() : initialData?.pensionStartDate || "",
                includeAgePension: isAgePensionIncluded,
                owner: activeOwners,
                client: clientSelected ? buildPayloadForOwner("client") : initialData?.client,
                partner: partnerSelected ? buildPayloadForOwner("partner") : initialData?.partner,
                agePensionProjection: {
                    includeAgePension: isAgePensionIncluded,
                    relationshipStatus: agePensionInput.relationshipStatus || agePensionOldInput.relationshipStatus || "Auto (from owners)",
                    homeOwnership: agePensionInput.homeOwnership || agePensionOldInput.homeOwnership || "Non-Homeowner",
                    personalAssets: agePensionInput.personalAssets || agePensionOldInput.personalAssets || "$0",
                    otherFinancialInvestments: agePensionInput.otherFinancialInvestments || agePensionOldInput.otherFinancialInvestments || "$0",
                    thresholdIndexation: agePensionInput.thresholdIndexation || agePensionOldInput.thresholdIndexation || "2.5%",
                    annualLivingExpenses: agePensionInput.annualLivingExpenses || agePensionOldInput.annualLivingExpenses || "",
                    expensesIndexation: agePensionInput.expensesIndexation || agePensionOldInput.expensesIndexation || "2.5%",
                    extraWithdrawal: agePensionInput.extraWithdrawal || agePensionOldInput.extraWithdrawal || "",
                    withdrawalFrequency: agePensionInput.withdrawalFrequency || agePensionOldInput.withdrawalFrequency || "None",
                },
            };

            const res = await patch("/review/retirementAdequacy/Update", payload);

            setSelectedReviewAllData((prev) => ({
                ...prev,
                retirementAdequacyDetails: res?.data || payload,
            }));

            message.success("Retirement adequacy details updated successfully");
            setEditing(false);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to update retirement adequacy details");
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
                                options={ownerOptions}
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
                            style={{ marginBottom: 12, width: 350 }}
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
                                        key="edit"
                                        style={{ backgroundColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill style={{ marginLeft: 4 }} />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        key="submit"
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