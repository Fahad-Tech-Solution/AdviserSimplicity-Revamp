import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Select, Space, Typography } from "antd";
import { useAtom } from "jotai";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { SelectedReviewAllData } from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import { useReviewOptions } from "../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../hooks/useApi.js";

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

const CONTRIBUTION_TYPE_OPTIONS = [
    { label: "Salary Sacrifice", value: "Salary Sacrifice" },
    { label: "Personal Concessional", value: "Personal Concessional" },
    { label: "Non Concessional", value: "Non Concessional" },
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

function SectionTitle({ children }) {
    return (
        <Text
            style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                color: "#6b7280",
                textTransform: "uppercase",
                marginBottom: 8,
                marginTop: 12,
            }}
        >
            {children}
        </Text>
    );
}

function buildInitialPerson(person = {}) {
    return {
        preferredName: person?.preferredName || "",
        incomeFromBusinessTotal: formatCurrencyValue(person?.incomeFromBusinessTotal),
        superAnnuationTotal: formatCurrencyValue(person?.superAnnuationTotal),
        riskGoal: person?.riskGoal || "Balanced",

        contributionType: person?.contributionType || "",
        sgcPercent: person?.sgcPercent ?? "",
        sgcAmount: formatCurrencyValue(person?.sgcAmount),
        maxConcessional: formatCurrencyValue(person?.maxConcessional),
        ssPersonalConcessional: formatCurrencyValue(person?.ssPersonalConcessional),
        nonConcessional: formatCurrencyValue(person?.nonConcessional),
        lumpSumNcc: formatCurrencyValue(person?.lumpSumNcc),

        investmentReturn: person?.investmentReturn ?? "",
        salaryGrowth: person?.salaryGrowth ?? "",
        projectionPeriod: person?.projectionPeriod ?? "",
        insurancePremium: formatCurrencyValue(person?.insurancePremium),
        premiumIndexation: person?.premiumIndexation ?? "",
        premiumYears: person?.premiumYears ?? "",
        projectedBalance: formatCurrencyValue(person?.projectedBalance),
    };
}

function buildInitialValues(sectionData) {
    const rawOwner = Array.isArray(sectionData?.owner) && sectionData.owner.length > 0
        ? sectionData.owner
        : ["client", "partner"];

    return {
        owner: rawOwner,
        client: buildInitialPerson(sectionData?.client),
        partner: buildInitialPerson(sectionData?.partner),
    };
}

export default function ScenariosSuperProjectionForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useReviewOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();

    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const initialData = selectedReviewAllData?.superannuationDetails || {};

    const initialValues = useMemo(
        () => buildInitialValues(initialData),
        [initialData]
    );

    const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!initialData?._id);
    }, [form, initialValues, initialData?._id]);

    // Column definitions for Table 1: Balances & Income
    const BALANCES_COLUMNS = [
        {
            title: "Owner",
            key: "ownerRole",
            dataIndex: "ownerRole",
            editable: false,
            width: 90,
            renderView: ({ record }) => (
                <span style={{ fontWeight: 600 }}>{record?.preferredName}</span>
            ),
        },
        {
            title: "Salary (p.a.)",
            dataIndex: "incomeFromBusinessTotal",
            key: "incomeFromBusinessTotal",
            field: "incomeFromBusinessTotal",
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
            title: "Super Balance",
            dataIndex: "superAnnuationTotal",
            key: "superAnnuationTotal",
            field: "superAnnuationTotal",
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
            dataIndex: "riskGoal",
            key: "riskGoal",
            field: "riskGoal",
            type: "select",
            options: RISK_PROFILE_OPTIONS,
            width: 160,
        },
    ];

    // Column definitions for Table 2: Contributions
    const CONTRIBUTIONS_COLUMNS = [
        {
            title: "Owner",
            key: "ownerRole",
            dataIndex: "ownerRole",
            editable: false,
            width: 90,
            renderView: ({ record }) => (
                <span style={{ fontWeight: 600 }}>{record?.preferredName}</span>
            ),
        },
        {
            title: "Contribution Type",
            dataIndex: "contributionType",
            key: "contributionType",
            field: "contributionType",
            type: "select",
            options: CONTRIBUTION_TYPE_OPTIONS,
        },
        {
            title: "SGC %",
            dataIndex: "sgcPercent",
            key: "sgcPercent",
            field: "sgcPercent",
            type: "text",
            placeholder: "12",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: false }),
                );
            },
        },
        {
            title: "SGC Amount",
            dataIndex: "sgcAmount",
            key: "sgcAmount",
            field: "sgcAmount",
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
            title: "Max Concessional",
            dataIndex: "maxConcessional",
            key: "maxConcessional",
            field: "maxConcessional",
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
            title: "SS / Personal Concessional",
            dataIndex: "ssPersonalConcessional",
            key: "ssPersonalConcessional",
            field: "ssPersonalConcessional",
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
            title: "Non Concessional",
            dataIndex: "nonConcessional",
            key: "nonConcessional",
            field: "nonConcessional",
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
            title: "Lump Sum NCC (final yr)",
            dataIndex: "lumpSumNcc",
            key: "lumpSumNcc",
            field: "lumpSumNcc",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
    ];

    // Column definitions for Table 3: Assumptions
    const ASSUMPTIONS_COLUMNS = [
        {
            title: "Owner",
            key: "ownerRole",
            dataIndex: "ownerRole",
            editable: false,
            width: 90,
            renderView: ({ record }) => (
                <span style={{ fontWeight: 600 }}>{record?.preferredName}</span>
            ),
        },
        {
            title: "Investment Return (%)",
            dataIndex: "investmentReturn",
            key: "investmentReturn",
            field: "investmentReturn",
            type: "text",
            placeholder: "0",
        },
        {
            title: "Salary Growth (%)",
            dataIndex: "salaryGrowth",
            key: "salaryGrowth",
            field: "salaryGrowth",
            type: "text",
            placeholder: "0",
        },
        {
            title: "Projection Period (yrs)",
            dataIndex: "projectionPeriod",
            key: "projectionPeriod",
            field: "projectionPeriod",
            type: "text",
            placeholder: "0",
        },
        {
            title: "Insurance Premium",
            dataIndex: "insurancePremium",
            key: "insurancePremium",
            field: "insurancePremium",
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
            title: "Premium Indexation (%)",
            dataIndex: "premiumIndexation",
            key: "premiumIndexation",
            field: "premiumIndexation",
            type: "text",
            placeholder: "0%",
        },
        {
            title: "Premium Years",
            dataIndex: "premiumYears",
            key: "premiumYears",
            field: "premiumYears",
            type: "text",
            placeholder: "0",
        },
        {
            title: "Projected Balance (end)",
            dataIndex: "projectedBalance",
            key: "projectedBalance",
            field: "projectedBalance",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
    ];

    // Prepare table row data mapping
    const rows = useMemo(
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
                    incomeFromBusinessTotal:
                        form.getFieldValue([ownerKey, "incomeFromBusinessTotal"]) ??
                        formatCurrencyValue(personData?.incomeFromBusinessTotal),
                    superAnnuationTotal:
                        form.getFieldValue([ownerKey, "superAnnuationTotal"]) ??
                        formatCurrencyValue(personData?.superAnnuationTotal),
                    riskGoal:
                        form.getFieldValue([ownerKey, "riskGoal"]) ??
                        personData?.riskGoal ??
                        "Balanced",

                    contributionType:
                        form.getFieldValue([ownerKey, "contributionType"]) ??
                        personData?.contributionType ??
                        "",
                    sgcPercent:
                        form.getFieldValue([ownerKey, "sgcPercent"]) ??
                        personData?.sgcPercent ??
                        "",
                    sgcAmount:
                        form.getFieldValue([ownerKey, "sgcAmount"]) ??
                        formatCurrencyValue(personData?.sgcAmount),
                    maxConcessional:
                        form.getFieldValue([ownerKey, "maxConcessional"]) ??
                        formatCurrencyValue(personData?.maxConcessional),
                    ssPersonalConcessional:
                        form.getFieldValue([ownerKey, "ssPersonalConcessional"]) ??
                        formatCurrencyValue(personData?.ssPersonalConcessional),
                    nonConcessional:
                        form.getFieldValue([ownerKey, "nonConcessional"]) ??
                        formatCurrencyValue(personData?.nonConcessional),
                    lumpSumNcc:
                        form.getFieldValue([ownerKey, "lumpSumNcc"]) ??
                        formatCurrencyValue(personData?.lumpSumNcc),

                    investmentReturn:
                        form.getFieldValue([ownerKey, "investmentReturn"]) ??
                        personData?.investmentReturn ??
                        "",
                    salaryGrowth:
                        form.getFieldValue([ownerKey, "salaryGrowth"]) ??
                        personData?.salaryGrowth ??
                        "",
                    projectionPeriod:
                        form.getFieldValue([ownerKey, "projectionPeriod"]) ??
                        personData?.projectionPeriod ??
                        "",
                    insurancePremium:
                        form.getFieldValue([ownerKey, "insurancePremium"]) ??
                        formatCurrencyValue(personData?.insurancePremium),
                    premiumIndexation:
                        form.getFieldValue([ownerKey, "premiumIndexation"]) ??
                        personData?.premiumIndexation ??
                        "",
                    premiumYears:
                        form.getFieldValue([ownerKey, "premiumYears"]) ??
                        personData?.premiumYears ??
                        "",
                    projectedBalance:
                        form.getFieldValue([ownerKey, "projectedBalance"]) ??
                        formatCurrencyValue(personData?.projectedBalance),
                };
            }),
        [form, initialData, ownerOptions, selectedOwners]
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
                    incomeFromBusinessTotal: ownerInput.incomeFromBusinessTotal || ownerOldInput.incomeFromBusinessTotal || "",
                    superAnnuationTotal: ownerInput.superAnnuationTotal || ownerOldInput.superAnnuationTotal || "",
                    riskGoal: ownerInput.riskGoal || ownerOldInput.riskGoal || "",
                    contributionType: ownerInput.contributionType || ownerOldInput.contributionType || "",
                    sgcPercent: ownerInput.sgcPercent || ownerOldInput.sgcPercent || "",
                    sgcAmount: ownerInput.sgcAmount || ownerOldInput.sgcAmount || "",
                    maxConcessional: ownerInput.maxConcessional || ownerOldInput.maxConcessional || "",
                    ssPersonalConcessional: ownerInput.ssPersonalConcessional || ownerOldInput.ssPersonalConcessional || "",
                    nonConcessional: ownerInput.nonConcessional || ownerOldInput.nonConcessional || "",
                    lumpSumNcc: ownerInput.lumpSumNcc || ownerOldInput.lumpSumNcc || "",
                    investmentReturn: ownerInput.investmentReturn || ownerOldInput.investmentReturn || "",
                    salaryGrowth: ownerInput.salaryGrowth || ownerOldInput.salaryGrowth || "",
                    projectionPeriod: ownerInput.projectionPeriod || ownerOldInput.projectionPeriod || "",
                    insurancePremium: ownerInput.insurancePremium || ownerOldInput.insurancePremium || "",
                    premiumIndexation: ownerInput.premiumIndexation || ownerOldInput.premiumIndexation || "",
                    premiumYears: ownerInput.premiumYears || ownerOldInput.premiumYears || "",
                    projectedBalance: ownerInput.projectedBalance || ownerOldInput.projectedBalance || "",
                };
            };

            const clientSelected = activeOwners.includes("client");
            const partnerSelected = activeOwners.includes("partner");

            const payload = {
                ...initialData,
                owner: activeOwners,
                client: clientSelected ? buildPayloadForOwner("client") : initialData?.client,
                partner: partnerSelected ? buildPayloadForOwner("partner") : initialData?.partner,
            };

            const res = await patch("/review/superannuation/Update", payload);

            setSelectedReviewAllData((prev) => ({
                ...prev,
                superannuationDetails: res?.data || payload,
            }));

            message.success("Superannuation details updated successfully");
            setEditing(false);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to update superannuation details");
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

                    {/* Section 1: Balances & Income */}
                    <Col xs={24}>
                        <SectionTitle>BALANCES & INCOME</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={BALANCES_COLUMNS}
                            data={rows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 2: Contributions */}
                    <Col xs={24}>
                        <SectionTitle>CONTRIBUTIONS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={CONTRIBUTIONS_COLUMNS}
                            data={rows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 3: Assumptions */}
                    <Col xs={24}>
                        <SectionTitle>ASSUMPTIONS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={ASSUMPTIONS_COLUMNS}
                            data={rows}
                            tableProps={TABLE_PROPS}
                        />
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
                                        key={"edit"}
                                        style={{ backgroundColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill style={{ marginLeft: 4 }} />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        key={"submit"}
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