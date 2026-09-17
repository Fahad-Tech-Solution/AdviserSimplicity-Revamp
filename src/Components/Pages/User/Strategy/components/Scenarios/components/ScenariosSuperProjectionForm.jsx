import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Select, Space, Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import DynamicDataTable from "../../../../../../Common/DynamicDataTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../hooks/useUserDashboardData.js";
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
    { label: "Conservative", value: "Conservative" },
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
        name: person?.name || "",
        salary: formatCurrencyValue(person?.salary ?? 1000),
        superBalance: formatCurrencyValue(person?.superBalance ?? 1000),
        riskProfile: person?.riskProfile || "Balanced",

        contributionType: person?.contributionType || "Salary Sacrifice",
        sgcPercent: person?.sgcPercent ?? "12",
        sgcAmount: formatCurrencyValue(person?.sgcAmount ?? 120),
        maxConcessional: formatCurrencyValue(person?.maxConcessional ?? 32380),
        ssPersonalConcessional: formatCurrencyValue(person?.ssPersonalConcessional ?? 100),
        nonConcessional: formatCurrencyValue(person?.nonConcessional ?? 100),
        lumpSumNcc: formatCurrencyValue(person?.lumpSumNcc ?? 100),

        investmentReturn: person?.investmentReturn ?? "100",
        salaryGrowth: person?.salaryGrowth ?? "100",
        projectionPeriod: person?.projectionPeriod ?? "14",
        insurancePremium: formatCurrencyValue(person?.insurancePremium ?? 100),
        premiumIndexation: person?.premiumIndexation ?? "3%",
        premiumYears: person?.premiumYears ?? "10",
        projectedBalance: formatCurrencyValue(person?.projectedBalance ?? 45074429),
    };
}

function buildInitialValues(sectionData, allowPartner) {
    const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : ["client", "partner"];
    const owner = allowPartner
        ? rawOwner
        : rawOwner.filter((value) => value === "client");

    return {
        owner,
        client: buildInitialPerson(sectionData?.client),
        partner: buildInitialPerson(sectionData?.partner),
    };
}

export default function ScenariosSuperProjectionForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useOwnerOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "scenariosSuperProjection"] || {};
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

    // Column definitions for Table 1: Balances & Income
    const BALANCES_COLUMNS = [
        {
            title: "Owner", key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 90
        },
        {
            title: "Salary (p.a.)",
            dataIndex: "salary",
            key: "salary",
            field: "salary",
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
            dataIndex: "superBalance",
            key: "superBalance",
            field: "superBalance",
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
            width: 160
        },
    ];

    // Column definitions for Table 2: Contributions
    const CONTRIBUTIONS_COLUMNS = [
        {
            title: "Owner", key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 90
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
            title: "Owner", key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 90
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
            disabled: true,
            editable: true,
        },
    ];

    // Prepare table row data mapping
    const rows = useMemo(
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
                    salary: form.getFieldValue([owner, "salary"]),
                    superBalance: form.getFieldValue([owner, "superBalance"]),
                    riskProfile: form.getFieldValue([owner, "riskProfile"]),

                    contributionType: form.getFieldValue([owner, "contributionType"]),
                    sgcPercent: form.getFieldValue([owner, "sgcPercent"]),
                    sgcAmount: form.getFieldValue([owner, "sgcAmount"]),
                    maxConcessional: form.getFieldValue([owner, "maxConcessional"]),
                    ssPersonalConcessional: form.getFieldValue([owner, "ssPersonalConcessional"]),
                    nonConcessional: form.getFieldValue([owner, "nonConcessional"]),
                    lumpSumNcc: form.getFieldValue([owner, "lumpSumNcc"]),

                    investmentReturn: form.getFieldValue([owner, "investmentReturn"]),
                    salaryGrowth: form.getFieldValue([owner, "salaryGrowth"]),
                    projectionPeriod: form.getFieldValue([owner, "projectionPeriod"]),
                    insurancePremium: form.getFieldValue([owner, "insurancePremium"]),
                    premiumIndexation: form.getFieldValue([owner, "premiumIndexation"]),
                    premiumYears: form.getFieldValue([owner, "premiumYears"]),
                    projectedBalance: form.getFieldValue([owner, "projectedBalance"]),
                })),
        [allowPartner, availableOwnerOptions, form, selectedOwners],
    );

    const handleFinish = async (values) => {
        const formValues = form.getFieldsValue(true);
        const payload = {
            ...sectionData,
            owner: formValues.owner,
            client: formValues.client,
            partner: allowPartner ? formValues.partner : {},
        };

        try {
            setSaving(true);
            const saved = sectionData?._id
                ? await patch("/scenariosSuperProjection/Update", payload)
                : await post("/scenariosSuperProjection/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "scenariosSuperProjection"]: saved || payload,
            }));

            message.success(`Super projections  ${sectionData?._id ? "updated" : "saved"}  successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save super projection settings");
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