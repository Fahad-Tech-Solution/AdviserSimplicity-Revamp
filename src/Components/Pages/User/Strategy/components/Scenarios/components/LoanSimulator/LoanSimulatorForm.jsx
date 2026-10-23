import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Space, Typography } from "antd";
import { useAtom } from "jotai";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { SelectedReviewAllData } from "../../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
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
    { label: "Annually", value: "Annually" },
];

const LOAN_TYPE_OPTIONS = [
    { label: "Principal & Interest", value: "Principal & Interest" },
    { label: "Interest Only", value: "Interest Only" },
];

const EMPTY_SECTION_DATA = {};

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

function formatPercentValue(value) {
    const rawValue = String(getChangedValue(value) ?? "").replace(/[^0-9.-]/g, "");
    if (!rawValue || rawValue === "." || rawValue === "-") return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return "";
    return `${Math.min(Math.max(numeric, 0), 100)}%`;
}

function normalizePaymentFrequency(value) {
    const normalizedValue = String(value ?? "").trim().toLowerCase();
    const frequenciesByNumber = {
        "52": "Weekly",
        "26": "Fortnightly",
        "12": "Monthly",
        "1": "Annually",
    };
    const frequenciesByName = {
        weekly: "Weekly",
        fortnightly: "Fortnightly",
        monthly: "Monthly",
        annual: "Annually",
        annually: "Annually",
        yearly: "Annually",
        year: "Annually",
    };

    return frequenciesByNumber[normalizedValue] ||
        frequenciesByName[normalizedValue] ||
        (normalizedValue ? value : "Monthly");
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

function buildInitialValues(sectionData) {
    const loanSetup = sectionData?.loanSetup || {};
    const extrasAndOffsets = sectionData?.extrasAndOffsets || {};



    return {
        loanSetup: {
            homeLoanTotal: formatCurrencyValue(loanSetup?.homeLoanTotal ?? ""),
            interestRate: loanSetup?.interestRate === "" || loanSetup?.interestRate == null
                ? ""
                : formatPercentValue(loanSetup.interestRate),
            termYears: loanSetup?.termYears ?? "",
            paymentFrequency: normalizePaymentFrequency(loanSetup?.paymentFrequency),
            loanType: loanSetup?.loanType || "Principal & Interest",
        },
        extrasAndOffsets: {
            extraRepayments: formatCurrencyValue(extrasAndOffsets?.extraRepayments ?? ""),
            offsetAccountBalance: formatCurrencyValue(extrasAndOffsets?.offsetAccountBalance ?? ""),
            surplusCash: formatCurrencyValue(extrasAndOffsets?.surplusCash ?? ""),
        },
    };
}

export default function LoanSimulatorForm({ modalData }) {
    const [form] = Form.useForm();
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);

    const sectionData = selectedReviewAllData?.[modalData?.key || "loanSimulatorDetails"] || EMPTY_SECTION_DATA;
    const editing = !sectionData?._id || isEditingEnabled;

    const initialValues = useMemo(
        () => buildInitialValues(sectionData),
        [sectionData],
    );

    const loanSetupValues = Form.useWatch("loanSetup", form) || initialValues.loanSetup;
    const extrasValues = Form.useWatch("extrasAndOffsets", form) || initialValues.extrasAndOffsets;

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    // Section 1: Loan Setup Table Columns
    const LOAN_SETUP_COLUMNS = [
        {
            title: "Home Loan Total ($)",
            dataIndex: "homeLoanTotal",
            key: "homeLoanTotal",
            field: "homeLoanTotal",
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
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value),
                );
            },
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
            dataIndex: "offsetAccountBalance",
            key: "offsetAccountBalance",
            field: "offsetAccountBalance",
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

    // Row definitions for dynamic table binding
    const loanSetupRows = useMemo(() => [{
        key: "loanSetup",
        formPath: "loanSetup",
        ...loanSetupValues,
    }], [loanSetupValues]);

    const extrasRows = useMemo(() => [{
        key: "extrasAndOffsets",
        formPath: "extrasAndOffsets",
        ...extrasValues,
    }], [extrasValues]);

    const handleFinish = async (values) => {
        try {
            setSaving(true);
            const payload = {
                ...(sectionData?._id ? { _id: sectionData._id } : {}),
                scenarioFK: selectedReviewAllData?.scenario?._id || sectionData?.scenarioFK || "",
                loanSetup: {
                    homeLoanTotal: values.loanSetup?.homeLoanTotal ?? "",
                    interestRate: values.loanSetup?.interestRate?.replace("%", "").trim() ?? "",
                    termYears: values.loanSetup?.termYears
                        ? Number(parseDigitsValue(values.loanSetup.termYears))
                        : 0,
                    paymentFrequency: values.loanSetup?.paymentFrequency ?? "",
                    loanType: values.loanSetup?.loanType ?? "",
                },
                extrasAndOffsets: {
                    extraRepayments: values.extrasAndOffsets?.extraRepayments ?? "",
                    offsetAccountBalance: values.extrasAndOffsets?.offsetAccountBalance ?? "",
                    surplusCash: values.extrasAndOffsets?.surplusCash ?? "",
                },
            };


            const saved = sectionData?._id
                ? await patch("/review/loanSimulator/Update", payload)
                : await post("/review/loanSimulator/Add", payload);

            const savedData = saved?.data?.data || saved?.data || saved || payload;

            setSelectedReviewAllData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "loanSimulatorDetails"]: savedData,
            }));

            message.success(`Loan details ${sectionData?._id ? "updated" : "saved"} successfully`);
            setIsEditingEnabled(false);
            modalData?.closeModal?.();
        } catch (error) {
            console.error("Error saving loan details:", error);
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
                    {/* Section 1: LOAN SETUP */}
                    <Col xs={24}>
                        <SectionTitle>LOAN SETUP</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={LOAN_SETUP_COLUMNS}
                            data={loanSetupRows}
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
                            data={extrasRows}
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
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                                        onClick={() => setIsEditingEnabled(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        key={"submit"}
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