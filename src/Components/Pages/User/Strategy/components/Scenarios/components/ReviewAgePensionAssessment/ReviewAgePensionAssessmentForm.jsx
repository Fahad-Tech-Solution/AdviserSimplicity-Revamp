import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Col, Form, message, Row, Select, Space, Typography } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
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

const SITUATION_OPTIONS = [
    { label: "Single", value: "Single" },
    { label: "Couple", value: "Couple" },
    { label: "Illness Separated", value: "Illness Separated" },
];

const HOME_OWNERSHIP_OPTIONS = [
    { label: "Homeowner", value: "Homeowner" },
    { label: "Non-Homeowner", value: "Non-Homeowner" },
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
        // Financial Assets
        savingsCash: formatCurrencyValue(person?.savingsCash ?? 100),
        termDeposits: formatCurrencyValue(person?.termDeposits ?? 100),
        sharesManagedFunds: formatCurrencyValue(person?.sharesManagedFunds ?? 100),
        superBalance: formatCurrencyValue(person?.superBalance ?? 100),
        abpBalance: formatCurrencyValue(person?.abpBalance ?? 100),
        // Income
        employmentSalary: formatCurrencyValue(person?.employmentSalary ?? 100),
        otherIncome: formatCurrencyValue(person?.otherIncome ?? 0),
        abpPensionPayment: formatCurrencyValue(person?.abpPensionPayment ?? 0),
        abpDeductibleAmount: formatCurrencyValue(person?.abpDeductibleAmount ?? 0),
    };
}

function buildInitialValues(sectionData) {
    return {
        situation: sectionData?.situation || "Single",
        homeOwnership: sectionData?.homeOwnership || "Homeowner",
        clientAge: sectionData?.clientAge ?? "67",
        partnerAge: sectionData?.partnerAge ?? "67",
        lihccHolder: sectionData?.lihccHolder ?? true,

        // Lifestyle Assets
        vehiclesClient: formatCurrencyValue(sectionData?.lifestyle?.vehiclesClient ?? 2500),
        vehiclesPartner: formatCurrencyValue(sectionData?.lifestyle?.vehiclesPartner ?? 2500),
        homeContents: formatCurrencyValue(sectionData?.lifestyle?.homeContents ?? 10000),
        otherLifestyle: formatCurrencyValue(sectionData?.lifestyle?.otherLifestyle ?? 2500),

        // Investment Property & Other Assets
        propertyValue: formatCurrencyValue(sectionData?.investmentProperty?.propertyValue ?? 100),
        propertyLoan: formatCurrencyValue(sectionData?.investmentProperty?.propertyLoan ?? 100),
        rentalIncome: formatCurrencyValue(sectionData?.investmentProperty?.rentalIncome ?? 100),
        rentalExpenses: formatCurrencyValue(sectionData?.investmentProperty?.rentalExpenses ?? 100),
        otherAssets: formatCurrencyValue(sectionData?.investmentProperty?.otherAssets ?? 100),
        investmentLoans: formatCurrencyValue(sectionData?.investmentProperty?.investmentLoans ?? 100),
        otherInvestments: formatCurrencyValue(sectionData?.investmentProperty?.otherInvestments ?? 100),

        client: buildInitialPerson(sectionData?.client),
        partner: buildInitialPerson(sectionData?.partner),
    };
}

export default function ReviewAgePensionAssessmentForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useOwnerOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { post, patch } = useApi();

    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);

    const sectionData = discoveryData?.[modalData?.key || "agePensionAssessment"] || {};

    const initialValues = useMemo(
        () => buildInitialValues(sectionData),
        [sectionData],
    );

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!sectionData?._id);
    }, [form, initialValues, sectionData?._id]);

    // Table 1: Personal Details Columns
    const PERSONAL_DETAILS_COLUMNS = [
        {
            title: "Situation",
            dataIndex: "situation",
            key: "situation",
            field: "situation",
            type: "select",
            options: SITUATION_OPTIONS,
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
            title: "Client Age",
            dataIndex: "clientAge",
            key: "clientAge",
            field: "clientAge",
            type: "text",
            placeholder: "0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: false }),
                );
            },
        },
        {
            title: "Partner Age",
            dataIndex: "partnerAge",
            key: "partnerAge",
            field: "partnerAge",
            type: "text",
            placeholder: "0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: false }),
                );
            },
        },
        {
            title: "LIHCC existing holder?",
            dataIndex: "lihccHolder",
            key: "lihccHolder",
            render: () => (
                <Form.Item name="lihccHolder" valuePropName="checked" noStyle>
                    <Checkbox disabled={!editing} />
                </Form.Item>
            ),
        },
    ];

    // Table 2: Lifestyle & Personal Assets Columns
    const LIFESTYLE_COLUMNS = [
        {
            title: "Vehicles (Client)",
            dataIndex: "vehiclesClient",
            key: "vehiclesClient",
            field: "vehiclesClient",
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
            title: "Vehicles (Partner)",
            dataIndex: "vehiclesPartner",
            key: "vehiclesPartner",
            field: "vehiclesPartner",
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
            title: "Home Contents",
            dataIndex: "homeContents",
            key: "homeContents",
            field: "homeContents",
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
            title: "Other Lifestyle",
            dataIndex: "otherLifestyle",
            key: "otherLifestyle",
            field: "otherLifestyle",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    column.field,
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
    ];

    // Table 3: Financial Assets Columns
    const FINANCIAL_ASSETS_COLUMNS = [
        {
            title: "Owner",
            dataIndex: "ownerLabel",
            key: "ownerLabel",
            editable: false,
            width: 100,
        },
        {
            title: "Savings & Cash",
            dataIndex: "savingsCash",
            key: "savingsCash",
            field: "savingsCash",
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
            title: "Term Deposits",
            dataIndex: "termDeposits",
            key: "termDeposits",
            field: "termDeposits",
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
            title: "Shares & Managed Funds",
            dataIndex: "sharesManagedFunds",
            key: "sharesManagedFunds",
            field: "sharesManagedFunds",
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
            title: "ABP Balance",
            dataIndex: "abpBalance",
            key: "abpBalance",
            field: "abpBalance",
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

    // Table 4: Investment Property & Other Assets Columns
    const PROPERTY_ASSETS_COLUMNS = [
        {
            title: "Property Value",
            dataIndex: "propertyValue",
            key: "propertyValue",
            field: "propertyValue",
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
            title: "Property Loan",
            dataIndex: "propertyLoan",
            key: "propertyLoan",
            field: "propertyLoan",
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
            title: "Rental Income (p.a.)",
            dataIndex: "rentalIncome",
            key: "rentalIncome",
            field: "rentalIncome",
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
            title: "Rental Expenses (p.a.)",
            dataIndex: "rentalExpenses",
            key: "rentalExpenses",
            field: "rentalExpenses",
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
            title: "Other Assets",
            dataIndex: "otherAssets",
            key: "otherAssets",
            field: "otherAssets",
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
            title: "Investment Loans",
            dataIndex: "investmentLoans",
            key: "investmentLoans",
            field: "investmentLoans",
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
            title: "Other Investments",
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
    ];

    // Table 5: Income Columns
    const INCOME_COLUMNS = [
        {
            title: "Owner",
            dataIndex: "ownerLabel",
            key: "ownerLabel",
            editable: false,
            width: 100,
        },
        {
            title: "Employment Salary",
            dataIndex: "employmentSalary",
            key: "employmentSalary",
            field: "employmentSalary",
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
            title: "Other Income",
            dataIndex: "otherIncome",
            key: "otherIncome",
            field: "otherIncome",
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
            title: "ABP Pension Payment",
            dataIndex: "abpPensionPayment",
            key: "abpPensionPayment",
            field: "abpPensionPayment",
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
            title: "ABP Deductible Amount",
            dataIndex: "abpDeductibleAmount",
            key: "abpDeductibleAmount",
            field: "abpDeductibleAmount",
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

    // Rows Data Definitions
    const personalDetailsRows = useMemo(() => [{
        key: "personalDetails",
        situation: form.getFieldValue("situation"),
        homeOwnership: form.getFieldValue("homeOwnership"),
        clientAge: form.getFieldValue("clientAge"),
        partnerAge: form.getFieldValue("partnerAge"),
    }], [form]);

    const lifestyleRows = useMemo(() => [{
        key: "lifestyle",
        vehiclesClient: form.getFieldValue("vehiclesClient"),
        vehiclesPartner: form.getFieldValue("vehiclesPartner"),
        homeContents: form.getFieldValue("homeContents"),
        otherLifestyle: form.getFieldValue("otherLifestyle"),
    }], [form]);

    const propertyRows = useMemo(() => [{
        key: "investmentProperty",
        propertyValue: form.getFieldValue("propertyValue"),
        propertyLoan: form.getFieldValue("propertyLoan"),
        rentalIncome: form.getFieldValue("rentalIncome"),
        rentalExpenses: form.getFieldValue("rentalExpenses"),
        otherAssets: form.getFieldValue("otherAssets"),
        investmentLoans: form.getFieldValue("investmentLoans"),
        otherInvestments: form.getFieldValue("otherInvestments"),
    }], [form]);

    const ownerRows = useMemo(() => {
        const owners = ["client", "partner"];
        return owners.map((owner) => ({
            key: owner,
            formPath: owner,
            ownerLabel: ownerOptions.find((opt) => opt.value === owner)?.label || (owner === "client" ? "Client" : "Partner"),
            savingsCash: form.getFieldValue([owner, "savingsCash"]),
            termDeposits: form.getFieldValue([owner, "termDeposits"]),
            sharesManagedFunds: form.getFieldValue([owner, "sharesManagedFunds"]),
            superBalance: form.getFieldValue([owner, "superBalance"]),
            abpBalance: form.getFieldValue([owner, "abpBalance"]),
            employmentSalary: form.getFieldValue([owner, "employmentSalary"]),
            otherIncome: form.getFieldValue([owner, "otherIncome"]),
            abpPensionPayment: form.getFieldValue([owner, "abpPensionPayment"]),
            abpDeductibleAmount: form.getFieldValue([owner, "abpDeductibleAmount"]),
        }));
    }, [form, ownerOptions]);

    const handleFinish = async () => {
        const formValues = form.getFieldsValue(true);
        const payload = {
            ...sectionData,
            situation: formValues.situation,
            homeOwnership: formValues.homeOwnership,
            clientAge: formValues.clientAge,
            partnerAge: formValues.partnerAge,
            lihccHolder: formValues.lihccHolder,
            lifestyle: {
                vehiclesClient: formValues.vehiclesClient,
                vehiclesPartner: formValues.vehiclesPartner,
                homeContents: formValues.homeContents,
                otherLifestyle: formValues.otherLifestyle,
            },
            investmentProperty: {
                propertyValue: formValues.propertyValue,
                propertyLoan: formValues.propertyLoan,
                rentalIncome: formValues.rentalIncome,
                rentalExpenses: formValues.rentalExpenses,
                otherAssets: formValues.otherAssets,
                investmentLoans: formValues.investmentLoans,
                otherInvestments: formValues.otherInvestments,
            },
            client: formValues.client,
            partner: formValues.partner,
        };

        try {
            setSaving(true);
            const saved = sectionData?._id
                ? await patch("/agePensionAssessment/Update", payload)
                : await post("/agePensionAssessment/Add", payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData?.key || "agePensionAssessment"]: saved || payload,
            }));

            message.success(`Age pension assessment inputs ${sectionData?._id ? "updated" : "saved"} successfully`);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to save age pension assessment inputs");
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
                    {/* Section 1: Personal Details */}
                    <Col xs={24}>
                        <SectionTitle>PERSONAL DETAILS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={PERSONAL_DETAILS_COLUMNS}
                            data={personalDetailsRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 2: Lifestyle & Personal Assets */}
                    <Col xs={24}>
                        <SectionTitle>LIFESTYLE & PERSONAL ASSETS ($)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={LIFESTYLE_COLUMNS}
                            data={lifestyleRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 3: Financial Assets */}
                    <Col xs={24}>
                        <SectionTitle>FINANCIAL ASSETS ($)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={FINANCIAL_ASSETS_COLUMNS}
                            data={ownerRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 4: Investment Property & Other Assets */}
                    <Col xs={24}>
                        <SectionTitle>INVESTMENT PROPERTY & OTHER ASSETS ($)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={PROPERTY_ASSETS_COLUMNS}
                            data={propertyRows}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* Section 5: Income */}
                    <Col xs={24}>
                        <SectionTitle>INCOME ($ P.A.)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_COLUMNS}
                            data={ownerRows}
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