import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Col, Form, message, Row, Space, Typography } from "antd";
import { useAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import { SelectedReviewAllData } from "../../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../../hooks/useApi.js";

const { Text } = Typography;
const EMPTY_SECTION_DATA = {};

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const SITUATION_OPTIONS = [
    { label: "Single", value: "single" },
    { label: "Couple", value: "couple" },
    { label: "Couple - Separated by Illness", value: "couple - separated by illness" },
];

const HOME_OWNERSHIP_OPTIONS = [
    { label: "Homeowner", value: "homeowner" },
    { label: "Non-Homeowner", value: "non-homeowner" },
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

function resolveFieldPath(record, column) {
    const rowPath = Array.isArray(record?.formPath)
        ? record.formPath
        : record?.formPath
            ? [record.formPath]
            : [];
    return [...rowPath, column.field || column.dataIndex || column.key];
}

function setFormattedField(value, record, column, currentForm, options = {}) {
    currentForm.setFieldValue(
        resolveFieldPath(record, column),
        formatNumericInput(value, options),
    );
}

function toAge(value) {
    const digits = String(value ?? "").replace(/[^0-9]/g, "");
    return digits ? Number(digits) : "";
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

function buildInitialFinancialPerson(financialAssets = {}, legacyPerson = {}) {
    return {
        savingsAndCash: formatCurrencyValue(
            financialAssets?.savingsAndCash ??
            legacyPerson?.savingsAndCash ??
            legacyPerson?.savingsCash,
        ),
        termDeposits: formatCurrencyValue(
            financialAssets?.termDeposits ?? legacyPerson?.termDeposits,
        ),
        sharesAndManagedFunds: formatCurrencyValue(
            financialAssets?.sharesAndManagedFunds ??
            legacyPerson?.sharesAndManagedFunds ??
            legacyPerson?.sharesManagedFunds,
        ),
        superAnnuationTotal: formatCurrencyValue(
            financialAssets?.superAnnuationTotal ??
            legacyPerson?.superAnnuationTotal ??
            legacyPerson?.superBalance,
        ),
        accountBasedPensionTotal: formatCurrencyValue(
            financialAssets?.accountBasedPensionTotal ??
            legacyPerson?.accountBasedPensionTotal ??
            legacyPerson?.abpBalance,
        ),
    };
}

function buildInitialIncomePerson(income = {}, legacyPerson = {}) {
    return {
        employmentSalary: formatCurrencyValue(income?.employmentSalary ?? legacyPerson?.employmentSalary),
        otherIncome: formatCurrencyValue(income?.otherIncome ?? legacyPerson?.otherIncome),
        abpPensionPayment: formatCurrencyValue(income?.abpPensionPayment ?? legacyPerson?.abpPensionPayment),
        abpDeductibleAmount: formatCurrencyValue(income?.abpDeductibleAmount ?? legacyPerson?.abpDeductibleAmount),
    };
}

function buildInitialValues(sectionData) {
    const personalDetails = sectionData?.personalDetails || sectionData || {};
    const lifestyleAssets = sectionData?.lifestyleAssets || sectionData?.lifestyle || {};
    const propertyAssets =
        sectionData?.investmentPropertyAndOtherAssets || sectionData?.investmentProperty || {};

    return {
        personalDetails: {
            situation: String(personalDetails?.situation || "single").toLowerCase(),
            homeOwnership: String(personalDetails?.homeOwnership || "homeowner").toLowerCase(),
            clientAge: personalDetails?.clientAge ?? "",
            partnerAge: personalDetails?.partnerAge ?? "",
            lihccExistingHolder:
                personalDetails?.lihccExistingHolder ?? sectionData?.lihccHolder ?? false,
        },
        lifestyleAssets: {
            vehiclesClient: formatCurrencyValue(lifestyleAssets?.vehiclesClient),
            vehiclesPartner: formatCurrencyValue(lifestyleAssets?.vehiclesPartner),
            homeContents: formatCurrencyValue(lifestyleAssets?.homeContents),
            otherLifestyle: formatCurrencyValue(lifestyleAssets?.otherLifestyle),
        },
        financialAssets: {
            client: buildInitialFinancialPerson(
                sectionData?.financialAssets?.client,
                sectionData?.client,
            ),
            partner: buildInitialFinancialPerson(
                sectionData?.financialAssets?.partner,
                sectionData?.partner,
            ),
        },
        investmentPropertyAndOtherAssets: {
            propertyValue: formatCurrencyValue(propertyAssets?.propertyValue),
            propertyLoan: formatCurrencyValue(propertyAssets?.propertyLoan),
            rentalIncome: formatCurrencyValue(propertyAssets?.rentalIncome),
            rentalExpenses: formatCurrencyValue(propertyAssets?.rentalExpenses),
            otherAssets: formatCurrencyValue(propertyAssets?.otherAssets),
            investmentLoans: formatCurrencyValue(propertyAssets?.investmentLoans),
            otherInvestments: formatCurrencyValue(propertyAssets?.otherInvestments),
        },
        income: {
            client: buildInitialIncomePerson(sectionData?.income?.client, sectionData?.client),
            partner: buildInitialIncomePerson(sectionData?.income?.partner, sectionData?.partner),
        },
    };
}

export default function ReviewAgePensionAssessmentForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useOwnerOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const sectionData =
        selectedReviewAllData?.agePensionAssessmentDetails ||
        selectedReviewAllData?.agePensionAssessment ||
        EMPTY_SECTION_DATA;
    const initialValues = useMemo(
        () => buildInitialValues(sectionData),
        [sectionData],
    );
    const personalDetails = Form.useWatch("personalDetails", form) || initialValues.personalDetails;
    const lifestyleAssets = Form.useWatch("lifestyleAssets", form) || initialValues.lifestyleAssets;
    const financialAssets = Form.useWatch("financialAssets", form) || initialValues.financialAssets;
    const investmentPropertyAndOtherAssets =
        Form.useWatch("investmentPropertyAndOtherAssets", form) ||
        initialValues.investmentPropertyAndOtherAssets;
    const income = Form.useWatch("income", form) || initialValues.income;

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

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
                setFormattedField(value, record, column, currentForm, { currency: false });
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
                setFormattedField(value, record, column, currentForm, { currency: false });
            },
        },
        {
            title: "LIHCC existing holder?",
            dataIndex: "lihccExistingHolder",
            key: "lihccExistingHolder",
            field: "lihccExistingHolder",
            type: "checkbox",
            valuePropName: "checked",
            renderView: ({ value }) => <Checkbox checked={Boolean(value)} disabled />,
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
            dataIndex: "savingsAndCash",
            key: "savingsAndCash",
            field: "savingsAndCash",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
            },
        },
        {
            title: "Shares & Managed Funds",
            dataIndex: "sharesAndManagedFunds",
            key: "sharesAndManagedFunds",
            field: "sharesAndManagedFunds",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
            },
        },
        {
            title: "ABP Balance",
            dataIndex: "accountBasedPensionTotal",
            key: "accountBasedPensionTotal",
            field: "accountBasedPensionTotal",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
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
                setFormattedField(value, record, column, currentForm, { currency: true });
            },
        },
    ];

    // Rows Data Definitions
    const personalDetailsRows = useMemo(() => [{
        key: "personalDetails",
        formPath: ["personalDetails"],
        ...personalDetails,
    }], [personalDetails]);

    const lifestyleRows = useMemo(() => [{
        key: "lifestyleAssets",
        formPath: ["lifestyleAssets"],
        ...lifestyleAssets,
    }], [lifestyleAssets]);

    const propertyRows = useMemo(() => [{
        key: "investmentPropertyAndOtherAssets",
        formPath: ["investmentPropertyAndOtherAssets"],
        ...investmentPropertyAndOtherAssets,
    }], [investmentPropertyAndOtherAssets]);

    const financialAssetRows = useMemo(
        () => ["client", "partner"].map((owner) => ({
            key: owner,
            formPath: ["financialAssets", owner],
            ownerLabel:
                ownerOptions.find((option) => option.value === owner)?.label ||
                (owner === "client" ? "Client" : "Partner"),
            ...financialAssets[owner],
        })),
        [financialAssets, ownerOptions],
    );

    const incomeRows = useMemo(
        () => ["client", "partner"].map((owner) => ({
            key: `income-${owner}`,
            formPath: ["income", owner],
            ownerLabel:
                ownerOptions.find((option) => option.value === owner)?.label ||
                (owner === "client" ? "Client" : "Partner"),
            ...income[owner],
        })),
        [income, ownerOptions],
    );

    const handleFinish = async (values) => {
        try {
            setSaving(true);
            const payload = {
                ...(sectionData?._id ? { _id: sectionData._id } : {}),
                scenarioFK:
                    selectedReviewAllData?.scenario?._id ||
                    sectionData?.scenarioFK ||
                    "",
                personalDetails: {
                    situation: values.personalDetails.situation,
                    homeOwnership: values.personalDetails.homeOwnership,
                    clientAge: toAge(values.personalDetails.clientAge),
                    partnerAge: toAge(values.personalDetails.partnerAge),
                    lihccExistingHolder: Boolean(values.personalDetails.lihccExistingHolder),
                },
                lifestyleAssets: {
                    vehiclesClient: values.lifestyleAssets.vehiclesClient,
                    vehiclesPartner: values.lifestyleAssets.vehiclesPartner,
                    homeContents: values.lifestyleAssets.homeContents,
                    otherLifestyle: values.lifestyleAssets.otherLifestyle,
                },
                financialAssets: {
                    client: values.financialAssets.client,
                    partner: values.financialAssets.partner,
                },
                investmentPropertyAndOtherAssets: {
                    ...values.investmentPropertyAndOtherAssets,
                },
                income: {
                    client: values.income.client,
                    partner: values.income.partner,
                },
            };

            const res = await patch("/review/AgePension/Update", payload);
            const savedData = res?.data?.data || res?.data || payload;

            setSelectedReviewAllData((previous) => ({
                ...previous,
                agePensionAssessmentDetails: savedData,
            }));

            message.success("Age pension assessment details updated successfully");
            setEditing(false);
            modalData?.closeModal?.();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update age pension assessment details",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        form.setFieldsValue(initialValues);
        setEditing(false);
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
                            data={financialAssetRows}
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
                            data={incomeRows}
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
                                {editing ? (
                                    <>
                                        <Button
                                            htmlType="button"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            style={{ backgroundColor: "#22c55e" }}
                                            loading={saving}
                                            disabled={saving}
                                        >
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        style={{ backgroundColor: "#22c55e" }}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit <RiEdit2Fill />
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