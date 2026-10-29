import React, { useMemo, useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space } from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    ComposedChart,
    Line,
} from 'recharts';
import { useAtom } from 'jotai';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import RetirementAdequacyForm from './RetirementAdequacyForm.jsx';
import { SelectedReviewAllData } from '../../../../../../../../store/authState';
import { useGetReviewName } from '../../../../../../../../hooks/useUserDashboardData';
import AnalysisModal from '../AnalysisModal/AnalysisModal.jsx';

const { Text, Title } = Typography;

const ABP_MIN_RATES = [
    { maxAge: 65, rate: 0.04 },
    { maxAge: 75, rate: 0.05 },
    { maxAge: 80, rate: 0.06 },
    { maxAge: 85, rate: 0.07 },
    { maxAge: 90, rate: 0.09 },
    { maxAge: 95, rate: 0.11 },
    { maxAge: 999, rate: 0.14 },
];

const DEFAULT_RISK_RETURNS = {
    Cash: 3,
    Conservative: 3.8,
    'Moderately Conservative': 4.5,
    Balanced: 5,
    Growth: 6,
    'High Growth': 6.5,
};

const AGE_PENSION_AGE = 67;
const AGE_PENSION_RATES = {
    singleBaseFn: 1100.3,
    singlePharmFn: 86.5,
    singleCleanFn: 14.1,
    coupleBaseFn: 829.4,
    couplePharmFn: 65.2,
    coupleCleanFn: 10.6,
    singleHomeLower: 333000,
    coupleHomeLower: 499000,
    singleRentLower: 600000,
    coupleRentLower: 766000,
    incomeFreeSingleFn: 226,
    incomeFreeCoupleFn: 396,
    deemSingleThreshold: 66800,
    deemCoupleThreshold: 110600,
    deemLowerRate: 0.0125,
    deemUpperRate: 0.0325,
    assetsTaperPerThousandFn: 3,
};

const parseNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === '') return fallback;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
    `$${Math.round(value || 0).toLocaleString('en-AU')}`;

function getDate(value) {
    if (!value) return null;
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getAgeAtDate(dateOfBirth, projectionDate) {
    const dob = getDate(dateOfBirth);
    if (!dob || !projectionDate) return null;

    let age = projectionDate.getFullYear() - dob.getFullYear();
    if (
        projectionDate.getMonth() < dob.getMonth() ||
        (projectionDate.getMonth() === dob.getMonth() && projectionDate.getDate() < dob.getDate())
    ) {
        age -= 1;
    }
    return age >= 0 ? age : null;
}

function getFinancialYearStart() {
    const today = new Date();
    const year = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
    return new Date(year, 6, 1);
}

function getProjectionFinancialYearStart(value) {
    const date = getDate(value) || getFinancialYearStart();
    const year = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
    return new Date(year, 6, 1);
}

function getMinimumDrawdownRate(age) {
    return ABP_MIN_RATES.find(({ maxAge }) => age < maxAge)?.rate ?? 0.14;
}

function calculatePersonProjection(person = {}, pensionStartDate, { applyAdjustments = true } = {}) {
    const startingBalance = Math.max(0, parseNumber(person.accountBasedPensionTotal));
    const nccTopUp = applyAdjustments ? Math.max(0, parseNumber(person.nccTopUp)) : 0;
    const topUpYearValue = parseInt(String(person.nccTopUpYear || '').replace(/\D/g, ''), 10);
    const topUpYear = Math.min(40, Math.max(1, topUpYearValue || 1));
    const withdrawal = applyAdjustments ? Math.max(0, parseNumber(person.withdrawalAmount)) : 0;
    const explicitReturn = parseNumber(person.investmentReturn, NaN);
    const returnRate = (Number.isFinite(explicitReturn)
        ? explicitReturn
        : DEFAULT_RISK_RETURNS[person.riskGoal] ?? DEFAULT_RISK_RETURNS.Balanced) / 100;
    const firstYearDate = getProjectionFinancialYearStart(pensionStartDate);
    const dateOfBirth = person.DOB;
    const ageAtStart = getAgeAtDate(dateOfBirth, firstYearDate);
    const initialBalance = Math.max(
        0,
        startingBalance - withdrawal + (topUpYear === 1 ? nccTopUp : 0),
    );

    if (initialBalance <= 0 || ageAtStart === null) {
        return { rows: [], startingBalance, nccTopUp, withdrawal, hasAdjustments: nccTopUp > 0 || withdrawal > 0 };
    }

    const firstFinancialYear = firstYearDate.getFullYear();
    const rows = [];
    let balance = startingBalance;

    for (let yearIndex = 0; yearIndex < 40 && balance > 0; yearIndex += 1) {
        const year = yearIndex + 1;
        const topUp = year === topUpYear ? nccTopUp : 0;
        const oneOffWithdrawal = year === 1 ? withdrawal : 0;
        const openingBalance = balance;
        const adjustedOpening = Math.max(0, openingBalance + topUp - oneOffWithdrawal);
        const age = ageAtStart + yearIndex;
        const minimumRate = getMinimumDrawdownRate(age);
        const earnings = adjustedOpening * returnRate;
        const annualPayment = Math.min(adjustedOpening + earnings, adjustedOpening * minimumRate);
        const closingBalance = Math.max(0, adjustedOpening + earnings - annualPayment);

        rows.push({
            key: String(year),
            year,
            financialYear: firstFinancialYear + year,
            age,
            openingBalance,
            calculatedOpeningBalance: adjustedOpening,
            topUp,
            oneOffWithdrawal,
            earnings,
            minimumRate,
            annualPayment,
            closingBalance,
        });

        balance = closingBalance;
        if (balance <= 0) break;
    }

    return {
        rows,
        startingBalance,
        nccTopUp,
        withdrawal,
        hasAdjustments: nccTopUp > 0 || withdrawal > 0,
    };
}

function buildMetrics(rows, startingBalance, nccTopUp, withdrawal, sustainedText = 'until depleted') {
    const firstRow = rows[0];
    const totalDrawn = rows.reduce((total, row) => total + row.annualPayment, 0);
    const effectiveStartingBalance = firstRow
        ? Math.max(0, firstRow.openingBalance + firstRow.topUp - firstRow.oneOffWithdrawal)
        : 0;

    let startingSubtext = `${formatCurrency(startingBalance)} starting balance`;
    if (nccTopUp > 0 && withdrawal > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} + ${formatCurrency(nccTopUp)} top-up − ${formatCurrency(withdrawal)} withdrawal`;
    } else if (nccTopUp > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} + ${formatCurrency(nccTopUp)} top-up`;
    } else if (withdrawal > 0) {
        startingSubtext = `${formatCurrency(startingBalance)} − ${formatCurrency(withdrawal)} withdrawal`;
    }

    return {
        startingBalance: formatCurrency(effectiveStartingBalance),
        startingSubtext,
        annualDrawdown: formatCurrency(firstRow?.annualPayment || 0),
        drawdownSubtext: 'first-year minimum payment',
        yearsSustained: rows.length ? String(rows.length) : '—',
        sustainedSubtext: rows.at(-1)?.closingBalance > 100 ? 'still has a balance' : sustainedText,
        totalDrawn: formatCurrency(totalDrawn),
        drawnSubtext: 'total minimum payments',
    };
}

function calculateProjection(person, pensionStartDate, baselinePerson = person, expenseProjection = null) {
    const adjusted = expenseProjection || calculatePersonProjection(person, pensionStartDate);
    const baseline = !expenseProjection && adjusted.hasAdjustments
        ? calculatePersonProjection(baselinePerson, pensionStartDate, { applyAdjustments: false })
        : null;
    const rows = adjusted.rows.map((row, index) => ({
        ...row,
        balance: row.calculatedOpeningBalance,
        currentBalance: baseline
            ? baseline.rows[index]?.calculatedOpeningBalance ?? 0
            : row.calculatedOpeningBalance,
        yearLabel: `Yr ${row.year}`,
    }));
    const chartData = rows.map((row, index) => ({
        ...row,
        year: row.yearLabel || `Yr ${row.year}`,
        minimumBalance: expenseProjection
            ? expenseProjection.minimumRows[index]?.openingBalance ?? 0
            : row.balance,
        calculatedBalance: row.balance,
    }));

    return {
        rows,
        chartData,
        chartMode: expenseProjection ? 'expenses' : 'standard',
        metrics: buildMetrics(
            adjusted.rows,
            adjusted.startingBalance,
            adjusted.nccTopUp,
            adjusted.withdrawal,
        ),
        hasAdjustments: adjusted.hasAdjustments,
    };
}

function calculateAgePension(assessableAssets, financialAssets, isCouple, homeowner, indexation, eligibleCount) {
    const rates = AGE_PENSION_RATES;
    const fullSingle = rates.singleBaseFn * 26 * indexation;
    const fullCoupleEach = rates.coupleBaseFn * 26 * indexation;
    const fullPension = isCouple ? fullCoupleEach * 2 : fullSingle;
    const lowerThreshold = homeowner
        ? (isCouple ? rates.coupleHomeLower : rates.singleHomeLower)
        : (isCouple ? rates.coupleRentLower : rates.singleRentLower);
    const assetsReduction = Math.min(
        Math.max(0, assessableAssets - lowerThreshold * indexation) / 1000
        * rates.assetsTaperPerThousandFn * 26,
        fullPension,
    );
    const deemingThreshold = (isCouple ? rates.deemCoupleThreshold : rates.deemSingleThreshold) * indexation;
    const deemedIncome = Math.min(financialAssets, deemingThreshold) * rates.deemLowerRate
        + Math.max(0, financialAssets - deemingThreshold) * rates.deemUpperRate;
    const incomeFreeArea = (isCouple ? rates.incomeFreeCoupleFn : rates.incomeFreeSingleFn) * 26 * indexation;
    const incomeReduction = Math.min(Math.max(0, deemedIncome - incomeFreeArea) * 0.5, fullPension);
    const basis = Math.max(0, Math.min(fullPension - assetsReduction, fullPension - incomeReduction));
    const supplements = basis > 0
        ? (isCouple
            ? (rates.couplePharmFn + rates.coupleCleanFn) * 26 * 2
            : (rates.singlePharmFn + rates.singleCleanFn) * 26) * indexation
        : 0;
    const eligibleScale = isCouple ? Math.min(2, eligibleCount) / 2 : Number(eligibleCount > 0);

    return {
        deemedIncome,
        pension: (basis + supplements) * eligibleScale,
    };
}

function getExtraWithdrawalFrequency(value) {
    const frequency = String(value || '').trim().toLowerCase();
    if (frequency === 'once' || frequency === 'one-off' || frequency === 'year 1 only') return 1;
    if (frequency.includes('random')) return -1;
    const everyYears = frequency.match(/every\s+(\d+)\s+years?/);
    if (everyYears) return Math.max(1, Number(everyYears[1]));
    const numericFrequency = Number(frequency);
    return Number.isInteger(numericFrequency) && numericFrequency > 0 ? numericFrequency : 0;
}

function calculateExpensesDrivenProjections(people, pensionStartDate, projection = {}) {
    const years = 30;
    const firstYearDate = getProjectionFinancialYearStart(pensionStartDate);
    const firstFinancialYear = firstYearDate.getFullYear();
    const currentFinancialYear = getFinancialYearStart().getFullYear();
    const projectionLeadYears = Math.max(0, firstFinancialYear - currentFinancialYear);
    const withdrawalFrequency = getExtraWithdrawalFrequency(projection.withdrawalFrequency);
    const extraWithdrawal = Math.max(0, parseNumber(projection.extraWithdrawal));
    const expenses = Math.max(0, parseNumber(projection.annualLivingExpenses));
    const expensesIndexation = Math.max(0, parseNumber(projection.expensesIndexation, 2.5)) / 100;
    const thresholdIndexation = Math.max(0, parseNumber(projection.thresholdIndexation, 2.5)) / 100;
    const includeAgePension = projection.includeAgePension;
    const homeowner = String(projection.homeOwnership || '').toLowerCase() === 'homeowner';
    const otherFinancialInvestments = Math.max(0, parseNumber(projection.otherFinancialInvestments));
    const personalAssets = Math.max(0, parseNumber(projection.personalAssets));
    const peopleStates = people.map((person) => {
        const startingBalance = Math.max(0, parseNumber(person.accountBasedPensionTotal));
        const nccTopUp = Math.max(0, parseNumber(person.nccTopUp));
        const topUpYearValue = parseInt(String(person.nccTopUpYear || '').replace(/\D/g, ''), 10);
        const topUpYear = Math.min(40, Math.max(1, topUpYearValue || 1));
        const withdrawal = Math.max(0, parseNumber(person.withdrawalAmount));
        const explicitReturn = parseNumber(person.investmentReturn, NaN);
        const returnRate = (Number.isFinite(explicitReturn)
            ? explicitReturn
            : DEFAULT_RISK_RETURNS[person.riskGoal] ?? DEFAULT_RISK_RETURNS.Balanced) / 100;
        const ageAtStart = getAgeAtDate(person.DOB, firstYearDate);
        const openingBalance = Math.max(
            0,
            startingBalance - withdrawal + (topUpYear === 1 ? nccTopUp : 0),
        );

        return {
            person,
            startingBalance,
            nccTopUp,
            topUpYear,
            withdrawal,
            returnRate,
            ageAtStart,
            balance: ageAtStart === null ? 0 : openingBalance,
            initialOpening: ageAtStart === null ? 0 : openingBalance,
            rows: [],
        };
    });
    const isCouple = peopleStates.length > 1;
    let otherFinancialBalance = otherFinancialInvestments;
    let withdrawalRandomSeed = 987654321;

    for (let yearIndex = 0; yearIndex < years; yearIndex += 1) {
        const year = yearIndex + 1;
        peopleStates.forEach((state) => {
            if (year > 1 && year === state.topUpYear) state.balance += state.nccTopUp;
        });
        const activeStates = peopleStates.filter((state) => state.balance > 0);

        const periodData = activeStates.map((state) => {
            const age = state.ageAtStart === null ? null : state.ageAtStart + yearIndex;
            const opening = state.balance;
            const earnings = opening * state.returnRate;
            const minimumRate = age === null ? 0 : getMinimumDrawdownRate(age);
            const minimumPayment = opening * minimumRate;
            return {
                state,
                age,
                opening,
                earnings,
                minimumRate,
                minimumPayment,
                closingMinimum: Math.max(0, opening + earnings - minimumPayment),
            };
        });
        const minimumAssets = periodData.reduce((total, row) => total + row.closingMinimum, 0);
        const indexation = (1 + thresholdIndexation) ** yearIndex;
        otherFinancialBalance *= 1 + AGE_PENSION_RATES.deemUpperRate;
        const agePensionEligibleCount = periodData.reduce(
            (total, row) => total + Number(row.age !== null && row.age >= AGE_PENSION_AGE),
            0,
        );
        const agePension = calculateAgePension(
            minimumAssets + personalAssets + otherFinancialBalance,
            minimumAssets + otherFinancialBalance,
            isCouple,
            homeowner,
            indexation,
            agePensionEligibleCount,
        );
        const pensionIncome = includeAgePension ? agePension.pension : 0;
        const expenseForYear = expenses * (1 + expensesIndexation) ** (projectionLeadYears + yearIndex);
        const minimumDrawdown = periodData.reduce((total, row) => total + row.minimumPayment, 0);
        const shortfall = Math.max(0, expenseForYear - minimumDrawdown - pensionIncome);
        const availableForTopUp = periodData.reduce((total, row) => total + row.closingMinimum, 0);
        const additionalDrawdown = Math.min(shortfall, availableForTopUp);
        const openingTotal = periodData.reduce((total, row) => total + row.opening, 0);
        let remainingAdditional = additionalDrawdown;

        periodData.forEach((row, index) => {
            const share = openingTotal > 0 ? row.opening / openingTotal : (index === 0 ? 1 : 0);
            row.additionalPayment = Math.min(additionalDrawdown * share, row.closingMinimum);
            remainingAdditional -= row.additionalPayment;
        });
        if (remainingAdditional > 0.005 && periodData.length) {
            for (const row of periodData) {
                const available = row.closingMinimum - row.additionalPayment;
                const extra = Math.min(remainingAdditional, available);
                row.additionalPayment += extra;
                remainingAdditional -= extra;
                if (remainingAdditional <= 0.005) break;
            }
        }

        const closingAfterExpenses = periodData.map((row) => Math.max(
            0,
            row.closingMinimum - row.additionalPayment,
        ));
        let extraWithdrawalApplies = withdrawalFrequency > 0
            && yearIndex % withdrawalFrequency === 0;
        if (withdrawalFrequency === -1) {
            withdrawalRandomSeed = (withdrawalRandomSeed * 1103515245 + 12345) & 0x7fffffff;
            extraWithdrawalApplies = withdrawalRandomSeed / 0x7fffffff < 0.34;
        }
        const availableAfterExpenses = closingAfterExpenses.reduce((total, balance) => total + balance, 0);
        const withdrawalTotal = extraWithdrawalApplies
            ? Math.min(extraWithdrawal, availableAfterExpenses)
            : 0;
        let remainingWithdrawal = withdrawalTotal;

        periodData.forEach((row, index) => {
            const closing = closingAfterExpenses[index];
            const share = availableAfterExpenses > 0
                ? closing / availableAfterExpenses
                : (index === 0 ? 1 : 0);
            row.extraWithdrawal = Math.min(withdrawalTotal * share, closing);
            remainingWithdrawal -= row.extraWithdrawal;
        });
        if (remainingWithdrawal > 0.005 && periodData.length) {
            for (let index = 0; index < periodData.length; index += 1) {
                const available = closingAfterExpenses[index] - periodData[index].extraWithdrawal;
                const extra = Math.min(remainingWithdrawal, available);
                periodData[index].extraWithdrawal += extra;
                remainingWithdrawal -= extra;
                if (remainingWithdrawal <= 0.005) break;
            }
        }

        periodData.forEach((row) => {
            const topUp = year === row.state.topUpYear ? row.state.nccTopUp : 0;
            const oneOffWithdrawal = year === 1 ? row.state.withdrawal : 0;
            const annualPayment = row.minimumPayment
                + row.additionalPayment
                + row.extraWithdrawal;
            const closingBalance = Math.max(
                0,
                row.closingMinimum - row.additionalPayment - row.extraWithdrawal,
            );
            row.state.rows.push({
                key: String(year),
                year,
                financialYear: firstFinancialYear + year,
                age: row.age,
                openingBalance: year === 1
                    ? row.state.startingBalance
                    : row.opening - topUp,
                calculatedOpeningBalance: row.opening,
                topUp,
                oneOffWithdrawal,
                earnings: row.earnings,
                minimumRate: row.minimumRate,
                annualPayment,
                closingBalance,
            });
            row.state.balance = closingBalance;
        });

        const surplus = Math.max(
            0,
            minimumDrawdown + additionalDrawdown + withdrawalTotal + pensionIncome - expenseForYear,
        );
        otherFinancialBalance += surplus;
    }

    return peopleStates.map((state) => {
        const minimumRows = [];
        let balance = state.initialOpening;
        for (let yearIndex = 0; yearIndex < years && balance > 0; yearIndex += 1) {
            const age = state.ageAtStart === null ? null : state.ageAtStart + yearIndex;
            const opening = balance;
            const earnings = opening * state.returnRate;
            const minimumRate = age === null ? 0 : getMinimumDrawdownRate(age);
            const annualPayment = opening * minimumRate;
            balance = Math.max(0, opening + earnings - annualPayment);
            minimumRows.push({ openingBalance: opening, closingBalance: balance });
        }

        return {
            rows: state.rows,
            minimumRows,
            startingBalance: state.startingBalance,
            nccTopUp: state.nccTopUp,
            withdrawal: state.withdrawal,
            hasAdjustments: state.nccTopUp > 0 || state.withdrawal > 0,
        };
    });
}

function calculateCashflowProjection(people, pensionStartDate, projection = {}) {
    const maxYears = Math.max(0, ...people.map(({ rows }) => rows.length));
    const firstYearDate = getProjectionFinancialYearStart(pensionStartDate);
    const startingAges = people.map(({ DOB }) => getAgeAtDate(DOB, firstYearDate));
    const isCouple = projection.isCouple;
    const homeowner = String(projection.homeOwnership || 'homeowner').toLowerCase() === 'homeowner';
    const personalAssets = Math.max(0, parseNumber(projection.personalAssets, 100));
    const initialOtherFinancialInvestments = Math.max(0, parseNumber(projection.otherFinancialInvestments, 100));
    const thresholdIndexation = Math.max(0, parseNumber(projection.thresholdIndexation, 2.5)) / 100;
    const expenses = Math.max(0, parseNumber(projection.annualLivingExpenses, 100));
    const expensesIndexation = Math.max(0, parseNumber(projection.expensesIndexation, 2.5)) / 100;
    const includeAgePension = projection.includeAgePension;
    let otherFinancialInvestments = initialOtherFinancialInvestments;

    let totalPensionSum = 0;
    let firstYearPension = null;

    const rows = Array.from({ length: maxYears }, (_, index) => {
        const client = people[0]?.rows[index];
        const partner = people[1]?.rows[index];
        const combined = (field) => (client?.[field] || 0) + (partner?.[field] || 0);
        const age = (startingAge) => startingAge === null ? '—' : startingAge + index;
        const clientAge = startingAges[0] === null ? null : startingAges[0] + index;
        const partnerAge = startingAges[1] === null ? null : startingAges[1] + index;
        const closingBalance = combined('closingBalance');
        const indexation = (1 + thresholdIndexation) ** index;
        const expenseForYear = expenses * (1 + expensesIndexation) ** index;
        otherFinancialInvestments *= 1 + AGE_PENSION_RATES.deemUpperRate;
        const assessableAssets = closingBalance + personalAssets + otherFinancialInvestments;
        const financialAssets = closingBalance + otherFinancialInvestments;
        const eligibleCount = Number(clientAge !== null && clientAge >= AGE_PENSION_AGE)
            + Number(isCouple && partnerAge !== null && partnerAge >= AGE_PENSION_AGE);
        const agePension = calculateAgePension(
            assessableAssets,
            financialAssets,
            isCouple,
            homeowner,
            indexation,
            eligibleCount,
        );
        const pension = includeAgePension ? agePension.pension : 0;
        const annualDrawdown = combined('annualPayment');
        const totalIncome = annualDrawdown + pension;
        const surplus = expenses > 0 ? totalIncome - expenseForYear : null;

        totalPensionSum += pension;
        if (firstYearPension === null && eligibleCount > 0) {
            firstYearPension = pension;
        }

        return {
            key: String(index + 1),
            year: index + 1,
            financialYear: client?.financialYear ?? partner?.financialYear,
            age: `${age(startingAges[0])} / ${age(startingAges[1])}`,
            closingBalance,
            assessableAssets,
            deemedIncome: agePension.deemedIncome,
            agePension: eligibleCount ? pension : null,
            annualPayment: annualDrawdown,
            totalIncome,
            surplus,
            balance: closingBalance,
            yearLabel: client?.financialYear ?? `Yr ${index + 1}`,
            livingExpenses: expenseForYear,
        };
    });

    const total = (field) => people.reduce((sum, person) => sum + (person[field] || 0), 0);
    const totalTopUp = people.reduce((sum, person) => sum + (person.nccTopUp || 0), 0);
    const totalWithdrawal = people.reduce((sum, person) => sum + (person.withdrawal || 0), 0);
    const totalStarting = total('startingBalance');
    const totalAdjustedStarting = people.reduce((sum, person) => {
        const row = person.rows[0];
        return sum + (row ? Math.max(0, row.openingBalance + row.topUp - row.oneOffWithdrawal) : 0);
    }, 0);

    const firstRowPosition = rows[0]?.surplus ?? 0;

    return {
        rows,
        metrics: {
            ...buildMetrics(rows, totalStarting, totalTopUp, totalWithdrawal, 'projection complete'),
            firstYearPension: firstYearPension !== null ? formatCurrency(firstYearPension) : '—',
            firstYearPensionSubtext: 'once Age Pension age',
            totalPension: formatCurrency(totalPensionSum),
            totalPensionSubtext: 'across projection',
            expensesMet: 'full projection',
            expensesMetSubtext: 'income covers expenses',
            firstYearPosition: formatCurrency(firstRowPosition),
            positionSubtext: 'surplus / (shortfall)',
            isCouple,
            homeowner,
            personalAssets,
            otherFinancialInvestments: initialOtherFinancialInvestments,
            expenses,
            thresholdIndexation: thresholdIndexation * 100,
            expensesIndexation: expensesIndexation * 100,
        },
        hasAdjustments: people.some((person) => person.hasAdjustments),
    };
}

const columns = [
    { title: 'Financial Year', dataIndex: 'financialYear', key: 'financialYear', align: 'center' },
    { title: 'Age', dataIndex: 'age', key: 'age', align: 'center' },
    { title: 'Opening Balance', dataIndex: 'openingBalance', key: 'openingBalance', align: 'right', render: formatCurrency },
    { title: 'Top-Up', dataIndex: 'topUp', key: 'topUp', align: 'right', render: formatCurrency },
    { title: 'One-Off Withdrawal', dataIndex: 'oneOffWithdrawal', key: 'oneOffWithdrawal', align: 'right', render: (value) => <span style={{ color: '#dc2626' }}>{formatCurrency(value)}</span> },
    { title: 'Earnings', dataIndex: 'earnings', key: 'earnings', align: 'right', render: (value) => <span style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(value)}</span> },
    { title: 'Min %', dataIndex: 'minimumRate', key: 'minimumRate', align: 'right', render: (value) => value === null ? '—' : `${(value * 100).toFixed(1)}%` },
    { title: 'Annual Payment', dataIndex: 'annualPayment', key: 'annualPayment', align: 'right', render: (value) => <span style={{ color: '#b45309' }}>{formatCurrency(value)}</span> },
    { title: 'Closing Balance', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (value) => <span style={{ color: '#2563eb', fontWeight: 700 }}>{formatCurrency(value)}</span> },
];

const cashflowColumns = [
    { title: 'Year', dataIndex: 'financialYear', key: 'financialYear', align: 'center' },
    { title: 'Age', dataIndex: 'age', key: 'age', align: 'center' },
    { title: 'Closing ABP', dataIndex: 'closingBalance', key: 'closingBalance', align: 'right', render: (value) => value > 0 ? formatCurrency(value) : '—' },
    { title: 'Assessable Assets', dataIndex: 'assessableAssets', key: 'assessableAssets', align: 'right', render: formatCurrency },
    { title: 'Deemed Income', dataIndex: 'deemedIncome', key: 'deemedIncome', align: 'right', render: formatCurrency },
    { title: 'Age Pension (p.a.)', dataIndex: 'agePension', key: 'agePension', align: 'right', render: (value) => value === null ? <Text type="secondary">— pre-{AGE_PENSION_AGE}</Text> : value > 0 ? formatCurrency(value) : '—' },
    { title: 'ABP Drawdown', dataIndex: 'annualPayment', key: 'annualPayment', align: 'right', render: formatCurrency },
    { title: 'Total Income (p.a.)', dataIndex: 'totalIncome', key: 'totalIncome', align: 'right', render: formatCurrency },
    { title: 'Surplus / (Shortfall)', dataIndex: 'surplus', key: 'surplus', align: 'right', render: (value) => value === null ? '—' : <span style={{ color: value < 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>{value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}</span> },
];

const RetirementAdequacy = () => {
    const [selectedProfile, setSelectedProfile] = useState('client');
    const [viewMode, setViewMode] = useState('Graph');
    const [visibleChartSeries, setVisibleChartSeries] = useState({
        minimumBalance: true,
        calculatedBalance: true,
    });
    const [cashflowChartSeries, setCashflowChartSeries] = useState({
        abpDrawdown: true,
        agePension: true,
        livingExpenses: true,
    });
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
    const [selectedReviewAllData] = useAtom(SelectedReviewAllData);
    const getReviewName = useGetReviewName();

    const headingStyle = { fontFamily: "Georgia, serif" };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const calculatedData = useMemo(() => {
        const section = selectedReviewAllData?.retirementAdequacyDetails || {};
        const startDate = section.pensionStartDate;
        const agePensionProjection = section.agePensionProjection || {};
        const client = {
            ...section.client,
            DOB: section.client?.DOB || selectedReviewAllData?.personalDetails?.client?.DOB,
        };
        const partner = {
            ...section.partner,
            DOB: section.partner?.DOB || selectedReviewAllData?.personalDetails?.partner?.DOB,
        };
        const withdrawalFrequency = getExtraWithdrawalFrequency(agePensionProjection.withdrawalFrequency);
        const extraWithdrawal = parseNumber(agePensionProjection.extraWithdrawal);
        const expensesDriven = parseNumber(agePensionProjection.annualLivingExpenses) > 0
            || (extraWithdrawal > 0 && withdrawalFrequency !== 0);
        const relationshipStatus = String(agePensionProjection.relationshipStatus || 'Auto').toLowerCase();
        const owners = section.owner || selectedReviewAllData?.personalDetails?.owner || [];
        const isCouple = relationshipStatus.includes('couple')
            || (relationshipStatus.includes('auto') && owners.includes('partner'));
        const expenseOptions = {
            ...agePensionProjection,
            includeAgePension: section.includeAgePension
                ?? agePensionProjection.includeAgePension
                ?? false,
        };
        let clientExpenseProjection = null;
        let partnerExpenseProjection = null;
        if (expensesDriven) {
            if (isCouple) {
                [clientExpenseProjection, partnerExpenseProjection] = calculateExpensesDrivenProjections(
                    [client, partner],
                    startDate,
                    expenseOptions,
                );
            } else {
                [clientExpenseProjection] = calculateExpensesDrivenProjections(
                    [client],
                    startDate,
                    expenseOptions,
                );
                [partnerExpenseProjection] = calculateExpensesDrivenProjections(
                    [partner],
                    startDate,
                    expenseOptions,
                );
            }
        }
        const clientProjection = calculateProjection(client, startDate, client, clientExpenseProjection);
        const partnerProjection = calculateProjection(partner, startDate, partner, partnerExpenseProjection);

        if (selectedProfile === 'partner') return partnerProjection;
        if (selectedProfile === 'cashflow') {
            return calculateCashflowProjection([
                { ...clientProjection, DOB: client.DOB, startingBalance: parseNumber(client.accountBasedPensionTotal), nccTopUp: parseNumber(client.nccTopUp), withdrawal: parseNumber(client.withdrawalAmount) },
                { ...partnerProjection, DOB: partner.DOB, startingBalance: parseNumber(partner.accountBasedPensionTotal), nccTopUp: parseNumber(partner.nccTopUp), withdrawal: parseNumber(partner.withdrawalAmount) },
            ], startDate, {
                ...agePensionProjection,
                isCouple,
                includeAgePension: expenseOptions.includeAgePension,
            });
        }
        return clientProjection;
    }, [selectedProfile, selectedReviewAllData]);

    const currentMetrics = calculatedData.metrics;
    const currentChartData = calculatedData.rows;
    const graphData = calculatedData.chartData || currentChartData;
    const currentTableData = calculatedData.rows;
    const currentColumns = selectedProfile === 'cashflow' ? cashflowColumns : columns;
    const hasData = currentChartData.length > 0;

    // Standard Client/Partner status note evaluation
    const standardStatusNote = useMemo(() => {
        if (!currentChartData.length) return '';
        const lastRow = currentChartData.at(-1);
        const exhausted = (lastRow?.closingBalance ?? lastRow?.balance ?? 0) <= 0;
        const age = lastRow?.age ?? '—';
        const closingAmt = formatCurrency(lastRow?.closingBalance ?? lastRow?.balance ?? 0);
        return exhausted ? `⚠️ Exhausted at age ${age}` : `Remaining ${closingAmt} at age ${age}`;
    }, [currentChartData]);

    const analysisContent = useMemo(() => {
        const section = selectedReviewAllData?.retirementAdequacyDetails || {};
        const startDate = section.pensionStartDate;
        const owners = section.owner || selectedReviewAllData?.personalDetails?.owner || [];
        const hasPartner = owners.includes("partner") || Boolean(section.partner);

        const clientData = {
            ...section.client,
            DOB: section.client?.DOB || selectedReviewAllData?.personalDetails?.client?.DOB,
        };
        const partnerData = {
            ...section.partner,
            DOB: section.partner?.DOB || selectedReviewAllData?.personalDetails?.partner?.DOB,
        };

        const clientProjection = calculateProjection(clientData, startDate, clientData, null);
        const partnerProjection = hasPartner ? calculateProjection(partnerData, startDate, partnerData, null) : null;

        const getPreferredName = (profileKey) => {
            const person = section[profileKey] || {};
            const name = String(person.preferredName || getReviewName(profileKey) || '').trim();
            return name && !['client', 'partner'].includes(name.toLowerCase())
                ? name.split(/\s+/)[0]
                : profileKey === 'partner' ? 'Partner' : 'Client';
        };

        const clientName = getPreferredName('client');
        const partnerName = getPreferredName('partner');

        const clientYears = clientProjection.rows.length;
        const clientFinalBal = clientProjection.rows.at(-1)?.closingBalance ?? parseNumber(clientData.accountBasedPensionTotal);
        const clientStartBal = parseNumber(clientData.accountBasedPensionTotal);
        const clientFirstDrawdown = parseNumber(clientProjection.rows[0]?.annualPayment);

        const partnerYears = partnerProjection ? partnerProjection.rows.length : 0;
        const partnerFinalBal = partnerProjection ? (partnerProjection.rows.at(-1)?.closingBalance ?? parseNumber(partnerData.accountBasedPensionTotal)) : 0;
        const partnerStartBal = parseNumber(partnerData.accountBasedPensionTotal);
        const partnerFirstDrawdown = partnerProjection ? parseNumber(partnerProjection.rows[0]?.annualPayment) : 0;

        const analysis = [
            `<strong>${clientName}</strong>: Starting balance <strong>${formatCurrency(clientStartBal)}</strong> · First-year pension <strong>${formatCurrency(clientFirstDrawdown)}</strong> · Projected to last <strong>${clientYears} yrs</strong> (Final: <strong>${formatCurrency(clientFinalBal)}</strong>)`,
        ];
        const speech = [
            `${clientName}, your account-based pension starts at ${formatCurrency(clientStartBal)} with a first-year payment of ${formatCurrency(clientFirstDrawdown)}, projected to last ${clientYears} years.`,
        ];

        if (hasPartner) {
            analysis.push(
                `<strong>${partnerName}</strong>: Starting balance <strong>${formatCurrency(partnerStartBal)}</strong> · First-year pension <strong>${formatCurrency(partnerFirstDrawdown)}</strong> · Projected to last <strong>${partnerYears} yrs</strong> (Final: <strong>${formatCurrency(partnerFinalBal)}</strong>)`
            );
            speech.push(
                `${partnerName}, your account-based pension starts at ${formatCurrency(partnerStartBal)} with a first-year payment of ${formatCurrency(partnerFirstDrawdown)}, projected to last ${partnerYears} years.`
            );
        }

        const metrics = [
            { label: `${clientName} Balance`, value: formatCurrency(clientStartBal) },
            { label: `${clientName} Drawdown`, value: formatCurrency(clientFirstDrawdown) },
            ...(hasPartner ? [
                { label: `${partnerName} Balance`, value: formatCurrency(partnerStartBal) },
                { label: `${partnerName} Drawdown`, value: formatCurrency(partnerFirstDrawdown) },
            ] : []),
        ];

        return {
            subtitle: `🏦 Combined Retirement Adequacy Analysis`,
            metrics,
            analysis,
            readAloud: speech.join(' '),
        };
    }, [selectedReviewAllData, getReviewName]);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {/* Profile Selector */}
                <Segmented
                    value={selectedProfile}
                    onChange={(val) => setSelectedProfile(val)}
                    options={[
                        { label: getReviewName('client'), value: 'client', icon: '👤' },
                        ...(selectedReviewAllData?.personalDetails?.owner?.includes("partner")
                            ? [{ label: getReviewName("partner"), value: 'partner', icon: "👥" }]
                            : []),
                        { label: 'Cashflow', value: 'cashflow', icon: '🏛️' },
                    ]}
                    style={{ padding: 3, backgroundColor: '#f3f4f6', borderRadius: 8 }}
                />

                <Space size={12}>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: 'Graph', value: 'Graph', icon: '📈' },
                            { label: 'Table', value: 'Table', icon: '📋' },
                        ]}
                        style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                    />

                    <Button
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff', borderRadius: 8, fontWeight: 600 }}
                        icon={"🧠"}
                        onClick={() => setOpenAnalysisModal(true)}
                    >
                        Analyse
                    </Button>

                    <Button
                        type="primary"
                        icon={"✏️"}
                        style={{ backgroundColor: '#22c55e', borderColor: '#22c55e', borderRadius: 8, fontWeight: 600 }}
                        onClick={() => setOpenModal(true)}
                    >
                        Edit Inputs
                    </Button>
                </Space>
            </div>

            {/* KPI Cards Grid */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {selectedProfile === 'cashflow' ? (
                    <>
                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>First-Year Pension</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.firstYearPension}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.firstYearPensionSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Total Pension</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.totalPension}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.totalPensionSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', height: '100%' }}
                            >
                                <div>
                                    <Text style={{ fontSize: 13, color: '#2563eb' }}>Expenses Met</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#2563eb' }}>
                                        {currentMetrics.expensesMet}
                                    </Title>
                                </div>
                                <Text style={{ fontSize: 11, color: '#3b82f6' }}>{currentMetrics.expensesMetSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>First-Year Position</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.firstYearPosition}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.positionSubtext}</Text>
                            </Card>
                        </Col>
                    </>
                ) : (
                    <>
                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Starting Balance</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.startingBalance}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.startingSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Annual Drawdown</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.annualDrawdown}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.drawdownSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#e8e8e8', height: '100%' }}
                            >
                                <div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Years Sustained</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                        {currentMetrics.yearsSustained}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>{currentMetrics.sustainedSubtext}</Text>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Card
                                bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                                style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', height: '100%' }}
                            >
                                <div>
                                    <Text style={{ fontSize: 13, color: '#16a34a' }}>Total Drawn</Text>
                                    <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#16a34a' }}>
                                        {currentMetrics.totalDrawn}
                                    </Title>
                                </div>
                                <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>{currentMetrics.drawnSubtext}</Text>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>

            {/* Graph vs Table Main Container */}
            <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8', minHeight: 380 }}>
                {viewMode === 'Graph' ? (
                    <>
                        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                            Pension Balance Projection
                        </Title>

                        {hasData ? (
                            <div>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        {selectedProfile === 'cashflow' ? (
                                            <ComposedChart data={graphData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="yearLabel" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => formatCurrency(val)} />
                                                <Tooltip formatter={(val, name) => [formatCurrency(val), name]} />
                                                <Bar dataKey="annualPayment" name="ABP Drawdown" fill="#2563eb" stackId="a" hide={!cashflowChartSeries.abpDrawdown} radius={[0, 0, 0, 0]} maxBarSize={24} />
                                                <Bar dataKey="agePension" name="Age Pension" fill="#22c55e" stackId="a" hide={!cashflowChartSeries.agePension} radius={[3, 3, 0, 0]} maxBarSize={24} />
                                                <Line type="monotone" dataKey="livingExpenses" name="Living Expenses" stroke="#dc2626" strokeDasharray="4 4" strokeWidth={2} hide={!cashflowChartSeries.livingExpenses} dot={false} />
                                            </ComposedChart>
                                        ) : (
                                            <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => formatCurrency(val)} />
                                                <Tooltip formatter={(val, name) => [formatCurrency(val), name]} />
                                                {calculatedData.chartMode === 'expenses' ? (
                                                    <>
                                                        <Bar
                                                            dataKey="minimumBalance"
                                                            name="Minimum"
                                                            fill="#22c55e"
                                                            hide={!visibleChartSeries.minimumBalance}
                                                            radius={[3, 3, 0, 0]}
                                                            maxBarSize={24}
                                                        />
                                                        <Bar
                                                            dataKey="calculatedBalance"
                                                            name="Calculated Drawdown"
                                                            fill="#2b3a5e"
                                                            hide={!visibleChartSeries.calculatedBalance}
                                                            radius={[3, 3, 0, 0]}
                                                            maxBarSize={24}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        {calculatedData.hasAdjustments && <Legend />}
                                                        {calculatedData.hasAdjustments && (
                                                            <Bar dataKey="currentBalance" name="Current Balance" fill="#2b3a5e" radius={[3, 3, 0, 0]} maxBarSize={24} />
                                                        )}
                                                        <Bar
                                                            dataKey="balance"
                                                            name={calculatedData.hasAdjustments ? 'Adjusted Balance' : 'Pension Balance'}
                                                            fill="#22c55e"
                                                            radius={[3, 3, 0, 0]}
                                                            maxBarSize={24}
                                                        />
                                                    </>
                                                )}
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>

                                {/* Clickable Legend Toggle Buttons for Cashflow */}
                                {selectedProfile === 'cashflow' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
                                            <Button
                                                size="small"
                                                aria-pressed={cashflowChartSeries.abpDrawdown}
                                                onClick={() => setCashflowChartSeries((current) => ({
                                                    ...current,
                                                    abpDrawdown: !current.abpDrawdown,
                                                }))}
                                                style={{
                                                    height: 34,
                                                    padding: '0 14px',
                                                    borderRadius: 999,
                                                    borderColor: cashflowChartSeries.abpDrawdown ? '#2563eb' : '#cbd5e1',
                                                    backgroundColor: cashflowChartSeries.abpDrawdown ? '#eff6ff' : '#fff',
                                                    color: cashflowChartSeries.abpDrawdown ? '#1d4ed8' : '#aeb6c4',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 7,
                                                    borderRadius: 3,
                                                    backgroundColor: cashflowChartSeries.abpDrawdown ? '#2563eb' : '#cbd5e1',
                                                }} />
                                                ABP Drawdown
                                            </Button>
                                            <Button
                                                size="small"
                                                aria-pressed={cashflowChartSeries.agePension}
                                                onClick={() => setCashflowChartSeries((current) => ({
                                                    ...current,
                                                    agePension: !current.agePension,
                                                }))}
                                                style={{
                                                    height: 34,
                                                    padding: '0 14px',
                                                    borderRadius: 999,
                                                    borderColor: cashflowChartSeries.agePension ? '#22c55e' : '#cbd5e1',
                                                    backgroundColor: cashflowChartSeries.agePension ? '#f0fdf4' : '#fff',
                                                    color: cashflowChartSeries.agePension ? '#15803d' : '#aeb6c4',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 7,
                                                    borderRadius: 3,
                                                    backgroundColor: cashflowChartSeries.agePension ? '#22c55e' : '#cbd5e1',
                                                }} />
                                                Age Pension
                                            </Button>
                                            <Button
                                                size="small"
                                                aria-pressed={cashflowChartSeries.livingExpenses}
                                                onClick={() => setCashflowChartSeries((current) => ({
                                                    ...current,
                                                    livingExpenses: !current.livingExpenses,
                                                }))}
                                                style={{
                                                    height: 34,
                                                    padding: '0 14px',
                                                    borderRadius: 999,
                                                    borderColor: cashflowChartSeries.livingExpenses ? '#dc2626' : '#cbd5e1',
                                                    backgroundColor: cashflowChartSeries.livingExpenses ? '#fef2f2' : '#fff',
                                                    color: cashflowChartSeries.livingExpenses ? '#b91c1c' : '#aeb6c4',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 7,
                                                    borderRadius: 3,
                                                    backgroundColor: cashflowChartSeries.livingExpenses ? '#dc2626' : '#cbd5e1',
                                                }} />
                                                Living Expenses
                                            </Button>
                                        </div>
                                        <Text type="secondary" style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                                            Click legend items to toggle series visibility
                                        </Text>
                                    </div>
                                )}

                                {/* Standard Client/Partner Status Note & Toggle Buttons */}
                                {calculatedData.chartMode === 'expenses' && selectedProfile !== 'cashflow' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        {standardStatusNote && (
                                            <Text style={{ fontSize: 12, fontWeight: 600, color: standardStatusNote.includes('⚠️') ? '#dc2626' : '#15803d', marginBottom: 2 }}>
                                                {standardStatusNote}
                                            </Text>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
                                            <Button
                                                size="small"
                                                aria-pressed={visibleChartSeries.minimumBalance}
                                                onClick={() => setVisibleChartSeries((current) => ({
                                                    ...current,
                                                    minimumBalance: !current.minimumBalance,
                                                }))}
                                                style={{
                                                    height: 34,
                                                    padding: '0 14px',
                                                    borderRadius: 999,
                                                    borderColor: visibleChartSeries.minimumBalance ? '#22c55e' : '#cbd5e1',
                                                    backgroundColor: visibleChartSeries.minimumBalance ? '#f0fdf4' : '#fff',
                                                    color: visibleChartSeries.minimumBalance ? '#15803d' : '#aeb6c4',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 7,
                                                    borderRadius: 3,
                                                    backgroundColor: visibleChartSeries.minimumBalance ? '#22c55e' : '#cbd5e1',
                                                }} />
                                                Minimum
                                            </Button>
                                            <Button
                                                size="small"
                                                aria-pressed={visibleChartSeries.calculatedBalance}
                                                onClick={() => setVisibleChartSeries((current) => ({
                                                    ...current,
                                                    calculatedBalance: !current.calculatedBalance,
                                                }))}
                                                style={{
                                                    height: 34,
                                                    padding: '0 14px',
                                                    borderRadius: 999,
                                                    borderColor: visibleChartSeries.calculatedBalance ? '#cbd5e1' : '#e2e8f0',
                                                    backgroundColor: visibleChartSeries.calculatedBalance ? '#f8fafc' : '#fff',
                                                    color: visibleChartSeries.calculatedBalance ? '#aeb6c4' : '#cbd5e1',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: 10,
                                                    height: 10,
                                                    marginRight: 7,
                                                    borderRadius: 3,
                                                    backgroundColor: visibleChartSeries.calculatedBalance ? '#bfc5d2' : '#e2e8f0',
                                                }} />
                                                Calculated Drawdown
                                            </Button>
                                        </div>
                                        <Text type="secondary" style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                                            Comparing minimum vs nominated drawdown balance
                                        </Text>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: 600 }}>
                                    Enter pension details to see projection
                                </Text>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Title level={5} style={{ color: '#22c55e', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase' }}>
                            {selectedProfile === 'cashflow' ? 'CASHFLOW PROJECTION BREAKDOWN' : 'PENSION PROJECTION BREAKDOWN'}
                        </Title>

                        <DynamicDataTable
                            columns={currentColumns}
                            data={currentTableData}
                            headerFontSize={12}
                            bodyFontSize={12}
                            showCount={false}
                            size="small"
                            tableProps={{
                                scroll: { x: 'max-content' },
                                locale: {
                                    emptyText: 'Enter pension balance and date of birth to see projection',
                                },
                            }}
                            tableStyle={{ borderRadius: 12 }}
                        />
                    </>
                )}

                {/* Cashflow Footer Note */}
                {selectedProfile === 'cashflow' && (
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <Text type="secondary" style={{ fontSize: 11, color: '#94a3b8', lineHeight: '1.5', display: 'block' }}>
                            Assessed as a <strong>{currentMetrics.isCouple ? 'couple' : 'single'}</strong>, <strong>{currentMetrics.homeowner ? 'homeowner' : 'non-homeowner'}</strong>. Payment rates & means-test thresholds from the 2025/26 Rate Reference, indexed {currentMetrics.thresholdIndexation || 2.5}% p.a. Assessable assets = closing ABP + personal assets ({formatCurrency(currentMetrics.personalAssets)}) + other financial investments ({formatCurrency(currentMetrics.otherFinancialInvestments)}). Other financial investments grow at the upper deeming rate and, once the ABP is exhausted, are drawn down to help meet the shortfall (counted in total income). The income test deems the ABP and other financial investments only. Indicative estimate — not a Centrelink determination. ABP payments start at the minimum, then top up (highlighted, allocated by ABP balance) to meet living expenses of {formatCurrency(currentMetrics.expenses)} p.a. in today's dollars, indexed {currentMetrics.expensesIndexation || 2.5}%. Age Pension is assessed on the balance under minimum drawdown; top-ups reduce the closing balance shown. Expenses are met across the projection.
                        </Text>
                    </div>
                )}
            </Card>

            {/* Inputs Modal */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={"70vw"}
                title={renderTitleBlock({
                    title: "Retirement & Pension Inputs",
                    icon: "💸",
                })}
            >
                <RetirementAdequacyForm modalData={{ closeModal: () => { setOpenModal(false) } }} />
            </AppModal>
            <AnalysisModal
                content={analysisContent}
                subtitle={analysisContent.subtitle}
                openAnalysisModal={openAnalysisModal}
                onClose={() => { setOpenAnalysisModal(false) }}
            />
        </div>
    );
};

export default RetirementAdequacy;