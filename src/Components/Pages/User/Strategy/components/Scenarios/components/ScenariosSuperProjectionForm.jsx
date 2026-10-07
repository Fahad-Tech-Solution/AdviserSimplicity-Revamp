import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Form, message, Row, Select, Space, Tooltip, Typography } from "antd";
import { useAtom } from "jotai";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill, RiErrorWarningLine } from "react-icons/ri";
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

// Following is the warning message for the user when they enter a lump-sum NCC amount that exceeds the 3-year bring-forward NCC cap of $390,000 (FY 2026-27). The message also provides information about the NCC contribution rules and suggests strategies to manage the excess amount.
// ⚠ Exceeds Bring-Forward NCC Cap
// The lump-sum amount of $45,465,465 exceeds the 3-year bring-forward NCC cap of $390,000 (FY 2026-27).

// NCC contribution rules (FY 2026-27):
// Annual NCC cap: $130,000 per financial year
// Bring-forward cap (over 3 FYs combined): $390,000
// Members aged 75 or over cannot make NCCs (except downsizer)
// Total Super Balance (TSB) must be under $2,100,000 at 30 June of the previous FY to use bring-forward

// Strategy — split across two financial years:
// Before 30 June this FY: up to $130,000 (uses current-year annual cap)
// From 1 July next FY: up to $390,000 (uses 3-year bring-forward)
// Total achievable across two FYs: $520,000

// Amount still in excess after splitting: $44,945,465. Consider deferring to a later FY, the downsizer contribution ($300k cap if eligible), spousal contribution, or splitting across both spouses.


function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === "") return undefined;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
    const numeric = parseCurrencyValue(value);
    return numeric !== undefined ? toCommaAndDollar(numeric) : "";
}

function formatPercentValue(value) {
    const rawValue = String(getChangedValue(value) ?? "").replace(/[^0-9.-]/g, "");
    if (!rawValue || rawValue === "." || rawValue === "-") return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return "";
    const limited = Math.min(Math.max(numeric, 0), 100);
    return `${limited}%`;
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

// Default return rate mapping by Risk Profile
const RISK_PROFILE_RETURNS = {
    "Cash": 3.0,
    "Conservative": 3.8,
    "Moderately Conservative": 4.5,
    "Balanced": 5.0,
    "Growth": 6.0,
    "High Growth": 6.5,
};

const CONCESSIONAL_CAP = 32500;
const CONTRIBUTION_TAX_RATE = 0.15;
const INSURANCE_TAX_REBATE_NET = 0.85;

function getAgeFromDob(dob) {
    if (!dob) return undefined;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return undefined;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }
    return age;
}

function getInsuranceIndexRateByAge(age) {
    if (!Number.isFinite(age) || age <= 0) return 8;
    if (age < 40) return 8;
    if (age < 60) return 12;
    return 18;
}

function getPremiumIndexationRate(value, age) {
    const selectedValue = Number(value);
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(selectedValue) ||
        selectedValue === 0
    ) {
        return getInsuranceIndexRateByAge(age);
    }
    return Math.max(0, selectedValue - 1);
}

/**
 * Calculates the final projected balance matching the exact guide HTML calculation model
 */
const calculateProjectedBalanceEnd = (data) => {
    const {
        superBalance = 0,
        riskProfile = "Balanced",
        investmentReturn,
        salary = 0,
        sgcPercent = 0,
        ssPersonalConcessional = 0,
        nonConcessional = 0,
        lumpSumNCCFinal = 0,
        salaryGrowthPercent = 0,
        projectionPeriodYears = 1,
        insurancePremium = 0,
        premiumIndexationPercent = 0,
        premiumYears = 0,
        currentAge,
    } = data;

    // Get return rate based on Risk Profile or custom input override
    const returnRatePct = (investmentReturn !== undefined && !isNaN(investmentReturn) && investmentReturn !== "")
        ? investmentReturn
        : (RISK_PROFILE_RETURNS[riskProfile] ?? 5.0);

    const returnRate = returnRatePct / 100;
    const salaryGrowthRate = salaryGrowthPercent / 100;
    const premiumIndexRate = premiumIndexationPercent / 100;

    let currentSalary = salary;
    let currentPremium = insurancePremium * INSURANCE_TAX_REBATE_NET;
    let currentBalance = superBalance;
    const nccAnnual = currentAge >= 75 ? 0 : nonConcessional;
    const lumpSumNcc = currentAge + projectionPeriodYears >= 75
        ? 0
        : lumpSumNCCFinal;
    const activePremiumYears = premiumYears > 0
        ? Math.min(premiumYears, projectionPeriodYears)
        : projectionPeriodYears;

    for (let yr = 1; yr <= projectionPeriodYears; yr++) {
        const sg = currentSalary * (sgcPercent / 100);
        const concessionalContributions = Math.min(
            sg + ssPersonalConcessional,
            CONCESSIONAL_CAP,
        );
        const actualSalarySacrifice = Math.max(0, concessionalContributions - sg);
        const nccLumpThisYear = yr === projectionPeriodYears ? lumpSumNcc : 0;
        const premiumThisYear = yr <= activePremiumYears ? currentPremium : 0;
        const earnings =
            (currentBalance + sg + actualSalarySacrifice) * returnRate;
        const contributionTax =
            (sg + actualSalarySacrifice) * CONTRIBUTION_TAX_RATE;

        currentBalance =
            currentBalance +
            sg +
            actualSalarySacrifice +
            earnings -
            contributionTax +
            nccAnnual +
            nccLumpThisYear -
            premiumThisYear;

        currentSalary *= (1 + salaryGrowthRate);
        if (yr < activePremiumYears) {
            currentPremium *= (1 + premiumIndexRate);
        }
    }

    return currentBalance;
};

export default function ScenariosSuperProjectionForm({ modalData }) {
    const [form] = Form.useForm();
    const ownerOptions = useReviewOptions();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const { patch } = useApi();

    const [selectedReviewAllData, setSelectedReviewAllData] = useAtom(SelectedReviewAllData);
    const initialData = useMemo(
        () => selectedReviewAllData?.superannuationDetails || {},
        [selectedReviewAllData?.superannuationDetails],
    );

    const initialValues = useMemo(
        () => buildInitialValues(initialData),
        [initialData]
    );

    const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!initialData?._id);
    }, [form, initialValues, initialData?._id]);

    // Calculate SGC Amount and Max Concessional based on SGC % and Salary (P.a)
    const calculateSgcAndMaxConcessional = ({ sgcPercent, salary }) => {
        const sgcAmount = (sgcPercent / 100) * salary;
        const maxConcessional = Math.max(0, CONCESSIONAL_CAP - sgcAmount);
        return { sgcAmount, maxConcessional };
    };

    const Calculator = (value, name, formPath, currentForm) => {
        let values = currentForm.getFieldsValue();

        // getting the salary and sgcPercent values for each owner
        let salary = parseCurrencyValue(values?.[formPath]?.incomeFromBusinessTotal);
        let sgcPercent = parseFloat(values?.[formPath]?.sgcPercent);

        switch (name) {
            case "incomeFromBusinessTotal":
                salary = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "sgcPercent":
                sgcPercent = parseFloat(formatPercentValue(value, { currency: false }).replace("%", ""));
                break;
        }

        if (isNaN(sgcPercent) || isNaN(salary)) {
            return;
        }

        if (name === "incomeFromBusinessTotal" || name === "sgcPercent") {

            const { sgcAmount, maxConcessional } = calculateSgcAndMaxConcessional({ sgcPercent, salary });
            currentForm.setFieldsValue({
                [formPath]: {
                    ...values[formPath],
                    sgcAmount: formatCurrencyValue(sgcAmount) || "",
                    maxConcessional: formatCurrencyValue(maxConcessional) || "",
                },
            });
        }

    };

    const calculateProjectedBalance = useCallback((value, name, formPath, currentForm) => {
        let values = currentForm.getFieldsValue();
        const pathValues = values?.[formPath] || {};

        // Map correct field names as defined in table columns
        let riskProfile = pathValues?.riskGoal; // mapped to riskGoal column
        let investmentReturn = parseFloat(pathValues?.investmentReturn);
        let superBalance = parseCurrencyValue(pathValues?.superAnnuationTotal); // Fix: superAnnuationTotal
        let salary = parseCurrencyValue(pathValues?.incomeFromBusinessTotal);
        let sgcPercent = parseFloat(pathValues?.sgcPercent);
        let ssPersonalConcessional = parseCurrencyValue(pathValues?.ssPersonalConcessional);
        let nonConcessional = parseCurrencyValue(pathValues?.nonConcessional);
        let lumpSumNCCFinal = parseCurrencyValue(pathValues?.lumpSumNcc); // Fix: lumpSumNcc
        let salaryGrowthPercent = parseFloat(pathValues?.salaryGrowth); // Fix: salaryGrowth
        let projectionPeriodYears = parseInt(pathValues?.projectionPeriod, 10); // Fix: projectionPeriod
        let insurancePremium = parseCurrencyValue(pathValues?.insurancePremium);
        const currentAge = getAgeFromDob(
            selectedReviewAllData?.personalDetails?.[formPath]?.DOB,
        );
        let premiumIndexationPercent = getPremiumIndexationRate(
            pathValues?.premiumIndexation,
            currentAge,
        );
        let premiumYears = parseInt(pathValues?.premiumYears, 10);

        // Update current changed field value dynamically
        switch (name) {
            case "riskGoal":
                riskProfile = value;
                if (RISK_PROFILE_RETURNS[value] !== undefined) {
                    investmentReturn = RISK_PROFILE_RETURNS[value] + "%";
                }
                break;
            case "investmentReturn":
                investmentReturn = parseFloat(formatPercentValue(value));
                break;
            case "superAnnuationTotal":
                superBalance = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "incomeFromBusinessTotal":
                salary = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "sgcPercent":
                sgcPercent = parseFloat(formatPercentValue(value).replace("%", ""));
                break;
            case "ssPersonalConcessional":
                ssPersonalConcessional = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "nonConcessional":
                nonConcessional = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "lumpSumNcc":
                lumpSumNCCFinal = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "salaryGrowth":
                salaryGrowthPercent = parseFloat(formatPercentValue(value).replace("%", ""));
                break;
            case "projectionPeriod":
                projectionPeriodYears = parseInt(value, 10);
                break;
            case "insurancePremium":
                insurancePremium = parseCurrencyValue(formatNumericInput(value, { currency: true }));
                break;
            case "premiumIndexation":
                premiumIndexationPercent = getPremiumIndexationRate(value, currentAge);
                break;
            case "premiumYears":
                premiumYears = parseInt(value, 10);
                break;
        }

        // Calculate projected balance
        const projectedBalanceEnd = calculateProjectedBalanceEnd({
            superBalance: isNaN(superBalance) ? 0 : superBalance,
            riskProfile,
            investmentReturn: isNaN(investmentReturn) ? undefined : investmentReturn,
            salary: isNaN(salary) ? 0 : salary,
            sgcPercent: isNaN(sgcPercent) ? 12 : sgcPercent,
            ssPersonalConcessional: isNaN(ssPersonalConcessional) ? 0 : ssPersonalConcessional,
            nonConcessional: isNaN(nonConcessional) ? 0 : nonConcessional,
            lumpSumNCCFinal: isNaN(lumpSumNCCFinal) ? 0 : lumpSumNCCFinal,
            salaryGrowthPercent: isNaN(salaryGrowthPercent) ? 2 : salaryGrowthPercent,
            projectionPeriodYears: isNaN(projectionPeriodYears) ? 10 : projectionPeriodYears,
            insurancePremium: isNaN(insurancePremium) ? 0 : insurancePremium,
            premiumIndexationPercent: isNaN(premiumIndexationPercent) ? 0 : premiumIndexationPercent,
            premiumYears: isNaN(premiumYears) ? 0 : premiumYears,
            currentAge: currentAge ?? 0,
        });

        // Update form fields with correct column keys
        currentForm.setFieldsValue({
            [formPath]: {
                ...values[formPath],
                investmentReturn: investmentReturn !== undefined ? investmentReturn : values?.[formPath]?.investmentReturn,
                projectedBalance: formatCurrencyValue(projectedBalanceEnd) || "", // Fix: key is projectedBalance
            },
        });
    }, [selectedReviewAllData]);

    useEffect(() => {
        (initialValues.owner || []).forEach((ownerKey) => {
            calculateProjectedBalance(undefined, undefined, ownerKey, form);
        });
    }, [
        form,
        initialValues,
        calculateProjectedBalance,
        selectedReviewAllData?.personalDetails?.client?.DOB,
        selectedReviewAllData?.personalDetails?.partner?.DOB,
    ]);

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
                Calculator(value, column.field, record.formPath, currentForm);
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
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
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
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
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    value,
                );
            },
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
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    value,
                );
            },
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
                    formatPercentValue(value, { currency: false }),
                );
                Calculator(value, column.field, record.formPath, currentForm);
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
            },
        },
        {
            title: "SGC Amount",
            dataIndex: "sgcAmount",
            key: "sgcAmount",
            field: "sgcAmount",
            type: "text",
            placeholder: "$0",
            disabled: true,
        },
        {
            title: "Max Concessional",
            dataIndex: "maxConcessional",
            key: "maxConcessional",
            field: "maxConcessional",
            type: "toComma",
            placeholder: "$0",
            disabled: true,
        },
        {
            title: "SS / Personal Concessional",
            dataIndex: "ssPersonalConcessional",
            key: "ssPersonalConcessional",
            field: "ssPersonalConcessional",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
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
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
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
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
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
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value, { currency: false }),
                );
            },
        },
        {
            title: "Salary Growth (%)",
            dataIndex: "salaryGrowth",
            key: "salaryGrowth",
            field: "salaryGrowth",
            type: "text",
            placeholder: "0",
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatPercentValue(value, { currency: false }),
                );
            },
        },
        {
            title: "Projection Period (yrs)",
            dataIndex: "projectionPeriod",
            key: "projectionPeriod",
            field: "projectionPeriod",
            placeholder: "0",
            type: "select",
            options: Array.from({ length: 31 }, (_, i) => ({ label: `${i == 0 ? 'Now' : i}`, value: i })),
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    value,
                );
            },
        },
        {
            title: "Insurance Premium",
            dataIndex: "insurancePremium",
            key: "insurancePremium",
            field: "insurancePremium",
            type: "text",
            placeholder: "$0",
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: <div>Premium Indexation (%)
                <Tooltip title={<div>
                    <div>STEPPED PREMIUM INDEXATION</div>
                    <div>(combined Life/TPD/IP - realistic rates)</div>
                    <div>• 20s-30s: 8%/yr</div>
                    <div>• 40s-50s: 12%/yr</div>
                    <div>• 60s+: 18%/yr</div>
                </div>}>
                    <RiErrorWarningLine /> </Tooltip></div>,
            dataIndex: "premiumIndexation",
            key: "premiumIndexation",
            field: "premiumIndexation",
            placeholder: "0%",
            type: "select",
            options: Array.from({ length: 17 }, (_, i) => ({ label: `${i === 0 ? '(Auto Based on age)' : `${i - 1}%`}`, value: i })),
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    value,
                );
            },
        },
        {
            title: <div>Premium Years
                <Tooltip title={`Number of years the insurance premium is deducted from super (1-30). Capped at the projection period. Set to a smaller number to model dropping cover earlier — e.g. at age 65.`}>
                    <RiErrorWarningLine style={{ marginLeft: "5px" }} /> </Tooltip></div>,
            dataIndex: "premiumYears",
            key: "premiumYears",
            field: "premiumYears",
            placeholder: "0",
            type: "select",
            options: Array.from({ length: 30 }, (_, i) => ({ label: i + 1, value: i + 1 })),
            onChange: (value, record, column, currentForm) => {
                calculateProjectedBalance(value, column.field, record.formPath, currentForm);
                currentForm.setFieldValue(
                    [record.formPath, column.field],
                    value,
                );
            },
        },
        {
            title: "Projected Balance (end)",
            dataIndex: "projectedBalance",
            key: "projectedBalance",
            field: "projectedBalance",
            type: "text",
            placeholder: "$0",
            disabled: true,
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
                    investmentReturn: ownerInput.investmentReturn?.toString() || ownerOldInput.investmentReturn?.toString() || "",
                    salaryGrowth: ownerInput.salaryGrowth || ownerOldInput.salaryGrowth || "",
                    projectionPeriod: (ownerInput.projectionPeriod)?.toString() || ownerOldInput.projectionPeriod?.toString() || "",
                    insurancePremium: ownerInput.insurancePremium || ownerOldInput.insurancePremium || "",
                    premiumIndexation: ownerInput.premiumIndexation ?? ownerOldInput.premiumIndexation ?? "",
                    premiumYears: ownerInput.premiumYears?.toString() ?? ownerOldInput.premiumYears?.toString() ?? "",
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