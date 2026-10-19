import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Col, Form, Input, message, Row, Space, Tabs, Typography } from "antd";
import { useAtom, useAtomValue } from "jotai";
import EditableDynamicTable from "../../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import {
    RateReferenceObject,
    SelectedClient,
    SelectedReviewAllData,
} from "../../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../../hooks/useApi.js";
import { useGetReviewName } from "../../../../../../../../hooks/useUserDashboardData.js";
import {
    calculateInsuranceNeeds,
    DEFAULT_LUMP_SUM_NEEDS,
    formatInsuranceMoney,
    getAgeFromDob,
} from "./insuranceNeedsCalculations.js";

const { Text } = Typography;

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const COVER_TYPES = [
    { key: "life", label: "Life" },
    { key: "tpd", label: "TPD" },
    { key: "trauma", label: "Trauma" },
];

const YEARS_OPTIONS = [
    ...Array.from({ length: 40 }, (_, index) => {
        const value = String(index + 1);
        return { label: value, value };
    }),
];

const WAITING_PERIOD_OPTIONS = [
    "14 days",
    "30 days",
    "60 days",
    "90 days",
    "180 days",
    "1 year",
].map((value) => ({ label: value, value }));

const BENEFIT_PERIOD_OPTIONS = [
    "2 years",
    "5 years",
    "To age 60",
    "To age 65",
    "To age 70",
].map((value) => ({ label: value, value }));

function parseDigitsValue(value) {
    return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
    return value?.target?.value ?? value;
}

function formatPercentValue(value) {
    const rawValue = String(getChangedValue(value) ?? "").replace(/[^0-9.-]/g, "");
    if (!rawValue || rawValue === "." || rawValue === "-") return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return "";
    return `${Math.min(Math.max(numeric, 0), 100)}%`;
}

function formatNumericInput(value, { currency = false } = {}) {
    const digits = parseDigitsValue(getChangedValue(value));
    if (!digits) return "";
    return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function formatCurrencyField(value, record, column, currentForm) {
    currentForm.setFieldValue(
        [...record.formPath, column.field],
        formatNumericInput(value, { currency: true }),
    );
}

function formatPercentField(value, record, column, currentForm) {
    currentForm.setFieldValue(
        [...record.formPath, column.field],
        formatPercentValue(value),
    );
}

function formatAssumptionPercent(value, form, fieldName) {
    form.setFieldValue(fieldName, formatPercentValue(value));
}

function formatCurrencyValues(record, fields) {
    fields.forEach((field) => {
        if (record[field] !== "" && record[field] !== null && record[field] !== undefined) {
            record[field] = formatNumericInput(record[field], { currency: true });
        }
    });
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

function buildInitialProfile(profile = {}) {
    const initialProfile = {
        assumptions: {
            investmentReturn: profile?.assumptions?.investmentReturn ?? "5",
            inflation: profile?.assumptions?.inflation ?? "2.5",
        },
        existingCover: {
            name: "",
            lifeCover: "",
            lifePremium: "",
            tpdCover: "",
            tpdPremium: "",
            traumaCover: "",
            traumaPremium: "",
            ipMonthlyCover: "",
            ipPremium: "",
            totalPremium: "",
            ...profile?.existingCover,
        },
        lumpSumNeeds: Object.fromEntries(
            COVER_TYPES.map(({ key }) => [
                key,
                {
                    homeMortgage: "",
                    investmentLoans: "",
                    personalLoans: "",
                    creditCards: "",
                    funeral: "",
                    medical: "",
                    emergencyFunds: "",
                    capitalNeeds: "",
                    other: "",
                    ...DEFAULT_LUMP_SUM_NEEDS[key],
                    ...profile?.lumpSumNeeds?.[key],
                },
            ]),
        ),
        incomeReplacement: {
            grossIncome: "",
            currentNetIncomeAfterTax: "",
            lifeAmount: "",
            lifeYears: "",
            tpdAmount: "",
            tpdYears: "",
            taxTpdInSuper: true,
            traumaAmount: "",
            traumaYears: "",
            ...profile?.incomeReplacement,
        },
        incomeProtectionDetails: {
            annualIncome: "",
            percentIncome: "70",
            percentSuper: "12",
            waitingPeriod: "30 days",
            benefitPeriod: "To age 65",
            incomeBenefitCovered: "",
            ipIncomeBenefitAnnual: "",
            superContributionsCover: "",
            netMonthlyAfterTax: "",
            ...profile?.incomeProtectionDetails,
        },
        realisableAssets: Object.fromEntries(
            COVER_TYPES.map(({ key }) => [
                key,
                {
                    superannuation: "",
                    cash: "",
                    investmentProperties: "",
                    sharePortfolio: "",
                    otherRealisableAssets: "",
                    ...profile?.realisableAssets?.[key],
                },
            ]),
        ),
    };

    initialProfile.assumptions.investmentReturn = formatPercentValue(
        initialProfile.assumptions.investmentReturn,
    );
    initialProfile.assumptions.inflation = formatPercentValue(
        initialProfile.assumptions.inflation,
    );
    formatCurrencyValues(initialProfile.existingCover, [
        "lifeCover",
        "lifePremium",
        "tpdCover",
        "tpdPremium",
        "traumaCover",
        "traumaPremium",
        "ipMonthlyCover",
        "ipPremium",
        "totalPremium",
    ]);
    formatCurrencyValues(initialProfile.incomeReplacement, [
        "grossIncome",
        "currentNetIncomeAfterTax",
        "lifeAmount",
        "tpdAmount",
        "traumaAmount",
    ]);
    formatCurrencyValues(initialProfile.incomeProtectionDetails, [
        "annualIncome",
        "incomeBenefitCovered",
        "ipIncomeBenefitAnnual",
        "superContributionsCover",
        "netMonthlyAfterTax",
    ]);
    COVER_TYPES.forEach(({ key }) => {
        formatCurrencyValues(initialProfile.lumpSumNeeds[key], [
            "homeMortgage",
            "investmentLoans",
            "personalLoans",
            "creditCards",
            "funeral",
            "medical",
            "emergencyFunds",
            "capitalNeeds",
            "other",
        ]);
        formatCurrencyValues(initialProfile.realisableAssets[key], [
            "superannuation",
            "cash",
            "investmentProperties",
            "sharePortfolio",
            "otherRealisableAssets",
        ]);
    });
    initialProfile.incomeProtectionDetails.percentIncome = formatPercentValue(
        initialProfile.incomeProtectionDetails.percentIncome,
    );
    initialProfile.incomeProtectionDetails.percentSuper = formatPercentValue(
        initialProfile.incomeProtectionDetails.percentSuper,
    );

    return initialProfile;
}

export default function InsuranceNeedsForm({ modalData }) {
    const getReviewName = useGetReviewName();
    const [form] = Form.useForm();
    const [activeProfileTab, setActiveProfileTab] = useState("client");
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();
    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const selectedClient = useAtomValue(SelectedClient);
    const rateReference = useAtomValue(RateReferenceObject);
    const taxRatesSchema = rateReference?.taxRatesSchema;
    const sectionData = useMemo(
        () =>
            selectedReviewAllData?.insuranceNeedsDetails ??
            (typeof selectedReviewAllData?.insuranceNeeds === "object"
                ? selectedReviewAllData.insuranceNeeds
                : {}),
        [selectedReviewAllData],
    );
    const editing = !sectionData?._id || isEditingEnabled;
    const maritalStatus =
        selectedReviewAllData?.personalDetails?.client?.clientMaritalStatus ||
        selectedClient?.client?.clientMaritalStatus ||
        "";
    const allowPartner = !["single", "widowed"].includes(
        String(maritalStatus).toLowerCase(),
    );

    const initialValues = useMemo(() => {
        return {
            client: buildInitialProfile(sectionData?.client),
            partner: buildInitialProfile(sectionData?.partner),
        };
    }, [sectionData]);

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    const watchedProfileData = Form.useWatch(activeProfileTab, {
        form,
        preserve: true,
    });
    const currentProfileData = editing
        ? watchedProfileData ?? initialValues[activeProfileTab]
        : initialValues[activeProfileTab];
    const currentProfileAge = getAgeFromDob(
        selectedReviewAllData?.personalDetails?.[activeProfileTab]?.DOB,
    );
    const mortgageAmount =
        selectedReviewAllData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal;
    const currentCalculation = useMemo(
        () => calculateInsuranceNeeds(
            currentProfileData,
            currentProfileAge,
            taxRatesSchema,
            { mortgageAmount },
        ),
        [currentProfileData, currentProfileAge, taxRatesSchema, mortgageAmount],
    );

    // Section 1: Existing Cover & Premiums
    const EXISTING_COVER_COLUMNS = [
        {
            title: "Name",
            key: "name",
            dataIndex: "name",
            editable: false,
            width: 90,
            renderView: () => (
                <span style={{ fontWeight: 600 }}>{getReviewName(activeProfileTab)}</span>
            ),
        },
        {
            title: "Life",
            key: "life",
            children: [
                { title: "Cover ($)", dataIndex: "lifeCover", key: "lifeCover", field: "lifeCover", type: "text", onChange: formatCurrencyField },
                { title: "Premium ($/yr)", dataIndex: "lifePremium", key: "lifePremium", field: "lifePremium", type: "text", onChange: formatCurrencyField },
            ],
        },
        {
            title: "TPD",
            key: "tpd",
            children: [
                { title: "Cover ($)", dataIndex: "tpdCover", key: "tpdCover", field: "tpdCover", type: "text", onChange: formatCurrencyField },
                { title: "Premium ($/yr)", dataIndex: "tpdPremium", key: "tpdPremium", field: "tpdPremium", type: "text", onChange: formatCurrencyField },
            ],
        },
        {
            title: "Trauma",
            key: "trauma",
            children: [
                { title: "Cover ($)", dataIndex: "traumaCover", key: "traumaCover", field: "traumaCover", type: "text", onChange: formatCurrencyField },
                { title: "Premium ($/yr)", dataIndex: "traumaPremium", key: "traumaPremium", field: "traumaPremium", type: "text", onChange: formatCurrencyField },
            ],
        },
        {
            title: "IP",
            key: "ip",
            children: [
                { title: "$/mo", dataIndex: "ipMonthlyCover", key: "ipMonthlyCover", field: "ipMonthlyCover", type: "text", onChange: formatCurrencyField },
                { title: "Premium ($/yr)", dataIndex: "ipPremium", key: "ipPremium", field: "ipPremium", type: "text", onChange: formatCurrencyField },
            ],
        },
        {
            title: "Total Premium ($/yr)",
            key: "totalPremium",
            dataIndex: "totalPremium",
            type: "text",
            disabled: true,
            renderEdit: () => (
                <Text>{formatInsuranceMoney(
                    ["lifePremium", "tpdPremium", "traumaPremium", "ipPremium"]
                        .reduce((total, field) => total + Number(
                            String(currentProfileData?.existingCover?.[field] ?? "")
                                .replace(/[^0-9.-]/g, ""),
                        ) || 0, 0),
                )}</Text>
            ),
        },
    ];

    // Section 2: Lumpsum Needs
    const LUMPSUM_NEEDS_COLUMNS = [
        { title: "Cover Type", dataIndex: "coverType", key: "coverType", editable: false, width: 100 },
        { title: "Home Mortgage", dataIndex: "homeMortgage", key: "homeMortgage", field: "homeMortgage", type: "text", onChange: formatCurrencyField },
        { title: "Investment Loans", dataIndex: "investmentLoans", key: "investmentLoans", field: "investmentLoans", type: "text", onChange: formatCurrencyField },
        { title: "Personal Loans", dataIndex: "personalLoans", key: "personalLoans", field: "personalLoans", type: "text", onChange: formatCurrencyField },
        { title: "Credit Cards", dataIndex: "creditCards", key: "creditCards", field: "creditCards", type: "text", onChange: formatCurrencyField },
        { title: "Funeral", dataIndex: "funeral", key: "funeral", field: "funeral", type: "text", onChange: formatCurrencyField },
        { title: "Medical", dataIndex: "medical", key: "medical", field: "medical", type: "text", onChange: formatCurrencyField },
        { title: "Emergency Funds", dataIndex: "emergencyFunds", key: "emergencyFunds", field: "emergencyFunds", type: "text", onChange: formatCurrencyField },
        { title: "Capital Needs", dataIndex: "capitalNeeds", key: "capitalNeeds", field: "capitalNeeds", type: "text", onChange: formatCurrencyField },
        { title: "Other", dataIndex: "other", key: "other", field: "other", type: "text", onChange: formatCurrencyField },
    ];

    // Section 3: Income Replacement
    const INCOME_REPLACEMENT_COLUMNS = [
        { title: "Gross Income (p.a.)", dataIndex: "grossIncome", key: "grossIncome", field: "grossIncome", type: "text", onChange: formatCurrencyField },
        {
            title: "Current Net Income After Tax (p.a.) (computed)", dataIndex: "currentNetIncomeAfterTax", key: "currentNetIncomeAfterTax", type: "text",
            disabled: true,
            renderEdit: () => <Text>{currentCalculation.computedFields.currentNetIncomeAfterTax}</Text>,
        },
        { title: "Life", dataIndex: "lifeAmount", key: "lifeAmount", field: "lifeAmount", type: "text", onChange: formatCurrencyField },
        { title: "Years", dataIndex: "lifeYears", key: "lifeYears", field: "lifeYears", type: "select", options: YEARS_OPTIONS },
        { title: "TPD", dataIndex: "tpdAmount", key: "tpdAmount", field: "tpdAmount", type: "text", onChange: formatCurrencyField },
        { title: "Years", dataIndex: "tpdYears", key: "tpdYears", field: "tpdYears", type: "select", options: YEARS_OPTIONS },
        {
            title: "Tax TPD in Super",
            dataIndex: "taxTpdInSuper",
            key: "taxTpdInSuper",
            type: "checkbox",
            renderEdit: ({ record }) => (
                <Form.Item
                    name={[...record.formPath, "taxTpdInSuper"]}
                    valuePropName="checked"
                    style={{ margin: 0 }}
                >
                    <Checkbox disabled={!editing} />
                </Form.Item>
            ),
        },
        { title: "Trauma", dataIndex: "traumaAmount", key: "traumaAmount", field: "traumaAmount", type: "text", onChange: formatCurrencyField },
        { title: "Years", dataIndex: "traumaYears", key: "traumaYears", field: "traumaYears", type: "select", options: YEARS_OPTIONS },
    ];

    // Section 4: Income Protection Details
    const INCOME_PROTECTION_COLUMNS = [
        { title: "Annual Income ($)", dataIndex: "annualIncome", key: "annualIncome", field: "annualIncome", type: "text", onChange: formatCurrencyField },
        { title: "% Income", dataIndex: "percentIncome", key: "percentIncome", field: "percentIncome", type: "text", onChange: formatPercentField },
        { title: "% Super", dataIndex: "percentSuper", key: "percentSuper", field: "percentSuper", type: "text", onChange: formatPercentField },
        { title: "Waiting Period", dataIndex: "waitingPeriod", key: "waitingPeriod", field: "waitingPeriod", type: "select", options: WAITING_PERIOD_OPTIONS },
        { title: "Benefit Period", dataIndex: "benefitPeriod", key: "benefitPeriod", field: "benefitPeriod", type: "select", options: BENEFIT_PERIOD_OPTIONS },

        {
            title: "Income Benefit Covered ($/mo) (computed)", dataIndex: "incomeBenefitCovered", key: "incomeBenefitCovered", type: "text",
            disabled: true,
            renderEdit: () => <Text>{currentCalculation.computedFields.incomeBenefitCovered}</Text>,
        },
        {
            title: "IP Income Benefit (p.a.) (annual gross)", dataIndex: "ipIncomeBenefitAnnual", key: "ipIncomeBenefitAnnual", type: "text",
            disabled: true,
            renderEdit: () => <Text>{currentCalculation.computedFields.ipIncomeBenefitAnnual}</Text>,
        },
        {
            title: "Super Contributions Cover ($/mo) (computed)", dataIndex: "superContributionsCover", key: "superContributionsCover", type: "text",
            disabled: true,
            renderEdit: () => <Text>{currentCalculation.computedFields.superContributionsCover}</Text>,
        },
        {
            title: "Net Monthly After Tax (IP income net)", dataIndex: "netMonthlyAfterTax", key: "netMonthlyAfterTax", type: "text",
            disabled: true,
            renderEdit: () => <Text>{currentCalculation.computedFields.netMonthlyAfterTax}</Text>,
        },
    ];

    // Section 5: Realisable Assets
    const REALISABLE_ASSETS_COLUMNS = [
        { title: "Cover Type", dataIndex: "coverType", key: "coverType", editable: false, width: 100 },
        { title: "Superannuation", dataIndex: "superannuation", key: "superannuation", field: "superannuation", type: "text", onChange: formatCurrencyField },
        { title: "Cash", dataIndex: "cash", key: "cash", field: "cash", type: "text", onChange: formatCurrencyField },
        { title: "Investment Properties (equity)", dataIndex: "investmentProperties", key: "investmentProperties", field: "investmentProperties", type: "text", onChange: formatCurrencyField },
        { title: "Share Portfolio / Managed Funds", dataIndex: "sharePortfolio", key: "sharePortfolio", field: "sharePortfolio", type: "text", onChange: formatCurrencyField },
        { title: "Other Realisable Assets", dataIndex: "otherRealisableAssets", key: "otherRealisableAssets", field: "otherRealisableAssets", type: "text", onChange: formatCurrencyField },
    ];

    const toNumericValue = (value) => {
        if (value === "" || value === null || value === undefined) return "";
        const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
        return Number.isFinite(numeric) ? numeric : "";
    };

    const toPayloadProfile = (profile, personKey) => {
        const normalized = buildInitialProfile(profile);
        const profileAge = getAgeFromDob(
            selectedReviewAllData?.personalDetails?.[personKey]?.DOB,
        );
        const calculated = calculateInsuranceNeeds(
            profile,
            profileAge,
            taxRatesSchema,
            { mortgageAmount },
        );
        const premiums = normalized.existingCover;
        return {
            ...normalized,
            existingCover: {
                ...premiums,
                totalPremium: formatInsuranceMoney(
                    ["lifePremium", "tpdPremium", "traumaPremium", "ipPremium"]
                        .reduce(
                            (total, field) =>
                                total +
                                Number(
                                    String(premiums[field] ?? "").replace(/[^0-9.-]/g, ""),
                                ),
                            0,
                        ),
                ),
            },
            incomeReplacement: {
                ...normalized.incomeReplacement,
                currentNetIncomeAfterTax:
                    calculated.computedFields.currentNetIncomeAfterTax,
            },
            assumptions: {
                ...normalized.assumptions,
                investmentReturn: toNumericValue(normalized.assumptions.investmentReturn),
                inflation: toNumericValue(normalized.assumptions.inflation),
            },
            incomeProtectionDetails: {
                ...normalized.incomeProtectionDetails,
                percentIncome: toNumericValue(normalized.incomeProtectionDetails.percentIncome),
                percentSuper: toNumericValue(normalized.incomeProtectionDetails.percentSuper),
                incomeBenefitCovered: calculated.computedFields.incomeBenefitCovered,
                ipIncomeBenefitAnnual: calculated.computedFields.ipIncomeBenefitAnnual,
                superContributionsCover: calculated.computedFields.superContributionsCover,
                netMonthlyAfterTax: calculated.computedFields.netMonthlyAfterTax,
            },
        };
    };

    const handleFinish = async (values) => {
        try {
            setSaving(true);
            const allValues = form.getFieldsValue(true);
            const scenarioFK =
                selectedReviewAllData?.scenario?._id ||
                sectionData?.scenarioFK ||
                "";
            if (!scenarioFK) {
                message.error("Load a review scenario before saving insurance details.");
                return;
            }

            const payload = {
                ...(sectionData?._id ? { _id: sectionData._id } : {}),
                scenarioFK,
                client: toPayloadProfile(
                    allValues.client ?? values.client ?? initialValues.client,
                    "client",
                ),
                partner: allowPartner
                    ? toPayloadProfile(
                        allValues.partner ?? values.partner ?? initialValues.partner,
                        "partner",
                    )
                    : {},
            };
            const saved = await patch("/review/insuranceNeeds/Update", payload);
            const savedData = saved?.data?.data || saved?.data || saved || payload;

            setSelectedReviewAllData((previous) => ({
                ...(previous && typeof previous === "object" ? previous : {}),
                insuranceNeedsDetails: savedData,
            }));

            message.success("Insurance details updated successfully");
            setIsEditingEnabled(false);
            modalData?.closeModal?.();
        } catch (error) {
            console.error("Error updating insurance details:", error);
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save insurance details",
            );
        } finally {
            setSaving(false);
        }
    };

    const tabItems = [
        { key: "client", label: getReviewName("client") },
        ...(allowPartner ? [{ key: "partner", label: getReviewName("partner") }] : []),
    ];

    return (
        <div style={{ padding: "8px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                preserve
                onFinish={handleFinish}
                colon={false}
                requiredMark={false}
            >
                <Tabs
                    activeKey={activeProfileTab}
                    onChange={setActiveProfileTab}
                    items={tabItems}
                    style={{ marginBottom: 12 }}
                />

                <Row gutter={[16, 8]}>
                    {/* ASSUMPTIONS */}
                    <Col xs={24}>
                        <SectionTitle>ASSUMPTIONS</SectionTitle>
                        <div
                            style={{
                                backgroundColor: "#fafafa",
                                border: "1px solid #f0f0f0",
                                borderRadius: 8,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 24,
                            }}
                        >
                            <Space align="center">
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>Investment Return:</Text>
                                <Form.Item
                                    name={[activeProfileTab, "assumptions", "investmentReturn"]}
                                    style={{ margin: 0 }}
                                >
                                    <Input
                                        disabled={!editing}
                                        onChange={(value) =>
                                            formatAssumptionPercent(
                                                value,
                                                form,
                                                [activeProfileTab, "assumptions", "investmentReturn"],
                                            )
                                        }
                                        style={{ width: 70, textAlign: "center" }}
                                    />
                                </Form.Item>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>% p.a.</Text>
                            </Space>

                            <Space align="center">
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>Inflation:</Text>
                                <Form.Item
                                    name={[activeProfileTab, "assumptions", "inflation"]}
                                    style={{ margin: 0 }}
                                >
                                    <Input
                                        disabled={!editing}
                                        onChange={(value) =>
                                            formatAssumptionPercent(
                                                value,
                                                form,
                                                [activeProfileTab, "assumptions", "inflation"],
                                            )
                                        }
                                        style={{ width: 70, textAlign: "center" }}
                                    />
                                </Form.Item>
                                <Text style={{ fontSize: 13, color: "#6b7280" }}>% p.a.</Text>
                            </Space>
                        </div>
                    </Col>

                    {/* EXISTING COVER & PREMIUMS (ANNUAL) */}
                    <Col xs={24}>
                        <SectionTitle>EXISTING COVER & PREMIUMS (ANNUAL)</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={EXISTING_COVER_COLUMNS}
                            data={[{
                                ...currentProfileData?.existingCover,
                                key: "existingCover",
                                totalPremium: formatInsuranceMoney(
                                    ["lifePremium", "tpdPremium", "traumaPremium", "ipPremium"]
                                        .reduce(
                                            (total, field) =>
                                                total +
                                                Number(
                                                    String(currentProfileData?.existingCover?.[field] ?? "")
                                                        .replace(/[^0-9.-]/g, ""),
                                                ),
                                            0,
                                        ),
                                ),
                                formPath: [activeProfileTab, "existingCover"],
                            }]}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* LUMPSUM NEEDS */}
                    <Col xs={24}>
                        <SectionTitle>LUMPSUM NEEDS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={LUMPSUM_NEEDS_COLUMNS}
                            data={COVER_TYPES.map(({ key, label }) => ({
                                ...currentProfileData?.lumpSumNeeds?.[key],
                                key,
                                coverType: label,
                                formPath: [activeProfileTab, "lumpSumNeeds", key],
                            }))}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* INCOME REPLACEMENT */}
                    <Col xs={24}>
                        <SectionTitle>INCOME REPLACEMENT</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_REPLACEMENT_COLUMNS}
                            data={[{
                                ...currentProfileData?.incomeReplacement,
                                currentNetIncomeAfterTax:
                                    currentCalculation.computedFields.currentNetIncomeAfterTax,
                                key: "incomeReplacement",
                                formPath: [activeProfileTab, "incomeReplacement"],
                            }]}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* INCOME PROTECTION DETAILS */}
                    <Col xs={24}>
                        <SectionTitle>INCOME PROTECTION DETAILS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={INCOME_PROTECTION_COLUMNS}
                            data={[{
                                ...currentProfileData?.incomeProtectionDetails,
                                ...currentCalculation.computedFields,
                                key: "incomeProtectionDetails",
                                formPath: [activeProfileTab, "incomeProtectionDetails"],
                            }]}
                            tableProps={TABLE_PROPS}
                        />
                    </Col>

                    {/* REALISABLE ASSETS */}
                    <Col xs={24}>
                        <SectionTitle>REALISABLE ASSETS</SectionTitle>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={REALISABLE_ASSETS_COLUMNS}
                            data={COVER_TYPES.map(({ key, label }) => ({
                                ...currentProfileData?.realisableAssets?.[key],
                                key,
                                coverType: label,
                                formPath: [activeProfileTab, "realisableAssets", key],
                            }))}
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
                                <Button onClick={() => modalData?.closeModal?.()}>Close</Button>
                                {!editing ? (
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        key="button"
                                        style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
                                        onClick={() => setIsEditingEnabled(true)}
                                    >
                                        Edit <RiEdit2Fill />
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        key="submit"
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