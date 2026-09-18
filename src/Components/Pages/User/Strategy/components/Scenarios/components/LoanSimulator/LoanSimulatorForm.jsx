import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Select, Space, Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../../hooks/useApi.js";

const { Text } = Typography;

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const PAYMENT_FREQUENCY_OPTIONS = [
    { label: "Weekly", value: "Weekly" },
    { label: "Fortnightly", value: "Fortnightly" },
    { label: "Monthly", value: "Monthly" },
];

const LOAN_TYPE_OPTIONS = [
    { label: "Principal & Interest", value: "Principal & Interest" },
    { label: "Interest Only", value: "Interest Only" },
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
        loanAmount: formatCurrencyValue(person?.loanAmount ?? 500),
        interestRate: person?.interestRate ?? "10.00",
        termYears: person?.termYears ?? "25",
        paymentFrequency: person?.paymentFrequency || "Weekly",
        loanType: person?.loanType || "Principal & Interest",

        extraRepayments: formatCurrencyValue(person?.extraRepayments ?? 1000),
        offsetBalance: formatCurrencyValue(person?.offsetBalance ?? 1000),
        surplusCash: formatCurrencyValue(person?.surplusCash ?? 1000),
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

export default function LoanSimulatorForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useOwnerOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "loanSimulator"] || {};
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

    // Section 1: Loan Setup Table Columns
    const LOAN_SETUP_COLUMNS = [
        {
            title: "Owner",
            key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 90,
        },
        {
            title: "Loan Amount ($)",
            dataIndex: "loanAmount",
            key: "loanAmount",
            field: "loanAmount",
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
            title: "Interest Rate (% p.a.)",
            dataIndex: "interestRate",
            key: "interestRate",
            field: "interestRate",
            type: "text",
            placeholder: "0.00",
        },
        {
            title: "Term (years)",
            dataIndex: "termYears",
            key: "termYears",
            field: "termYears",
            type: "text",
            placeholder: "0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: false }),
                );
            },
        },
        {
            title: "Payment Frequency",
            dataIndex: "paymentFrequency",
            key: "paymentFrequency",
            field: "paymentFrequency",
            type: "select",
            options: PAYMENT_FREQUENCY_OPTIONS,
            width: 160,
        },
        {
            title: "Loan Type",
            dataIndex: "loanType",
            key: "loanType",
            field: "loanType",
            type: "select",
            options: LOAN_TYPE_OPTIONS,
            width: 180,
        },
    ];

    // Section 2: Extras & Offsets Table Columns
    const EXTRAS_OFFSETS_COLUMNS = [
        {
            title: "Owner",
            key: "ownerLabel",
            dataIndex: "ownerLabel",
            editable: false,
            width: 90,
        },
        {
            title: "Extra Repayments ($ per period)",
            dataIndex: "extraRepayments",
            key: "extraRepayments",
            field: "extraRepayments",
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
            title: "Offset Account Balance ($)",
            dataIndex: "offsetBalance",
            key: "offsetBalance",
            field: "offsetBalance",
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
            title: "Surplus Cash ($ per period)",
            dataIndex: "surplusCash",
            key: "surplusCash",
            field: "surplusCash",
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

    // Prepare row mapping for dynamic form binding
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
                    loanAmount: form.getFieldValue([owner, "loanAmount"]),
                    interestRate: form.getFieldValue([owner, "interestRate"]),
                    termYears: form.getFieldValue([owner, "termYears"]),
                    paymentFrequency: form.getFieldValue([owner, "paymentFrequency"]),
                    loanType: form.getFieldValue([owner, "loanType"]),

                    extraRepayments: form.getFieldValue([owner, "extraRepayments"]),
                    offsetBalance: form.getFieldValue([owner, "offsetBalance"]),
                    surplusCash: form.getFieldValue([owner, "surplusCash"]),
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
                ? await patch("/loanSimulator/Update", payload)
                : await post("/loanSimulator/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "loanSimulator"]: saved || payload,
            }));

            message.success(`Loan details ${sectionData?._id ? "updated" : "saved"} successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save loan details");
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

                    {/* Section 1: LOAN SETUP */}
                    <Col xs={24}>
                        <SectionTitle>LOAN SETUP</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={LOAN_SETUP_COLUMNS}
                            data={rows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 2: EXTRAS & OFFSETS */}
                    <Col xs={24}>
                        <SectionTitle>EXTRAS & OFFSETS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={EXTRAS_OFFSETS_COLUMNS}
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
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
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