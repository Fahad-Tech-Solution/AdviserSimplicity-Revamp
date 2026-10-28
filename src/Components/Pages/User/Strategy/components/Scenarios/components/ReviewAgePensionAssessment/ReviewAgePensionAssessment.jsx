import React, { useMemo, useState } from 'react';
import { Card, Button, Segmented, Row, Col, Typography, Space, Tag, Alert } from 'antd';
import { CheckCircleOutlined, CreditCardOutlined, CheckCircleFilled, WarningOutlined } from '@ant-design/icons';
import DynamicDataTable from '../../../../../../../Common/DynamicDataTable';
import AppModal from '../../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../../hooks/useTitleBlock';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ReviewAgePensionAssessmentForm from './ReviewAgePensionAssessmentForm';
import { useAtom, useAtomValue } from 'jotai';
import {
    RateReferenceObject,
    SelectedReviewAllData,
} from '../../../../../../../../store/authState';
import { FaXmark } from 'react-icons/fa6';
import { useGetReviewName } from '../../../../../../../../hooks/useUserDashboardData';
import AnalysisModal from '../AnalysisModal/AnalysisModal';

const { Text, Title, Paragraph } = Typography;

const AGE_PENSION_RATES = {
    singleBaseFn: 1100.3,
    singlePharmFn: 86.5,
    singleCleanFn: 14.1,
    coupleBaseFn: 829.4,
    couplePharmFn: 65.2,
    coupleCleanFn: 10.6,
    singleHomeLower: 333000,
    singleHomeUpper: 733500,
    coupleHomeLower: 499000,
    coupleHomeUpper: 1102500,
    singleRentLower: 600000,
    singleRentUpper: 1000500,
    coupleRentLower: 766000,
    coupleRentUpper: 1369500,
    incomeFreeSingleFn: 226,
    incomeFreeCoupleFn: 396,
    deemSingleThreshold: 66800,
    deemCoupleThreshold: 110600,
    deemLowerRate: 0.0125,
    deemUpperRate: 0.0325,
    assetsTaperPerThousandFn: 3,
    // LIHCC defaults — matched to HTML Rate Reference table ($811 single, $1,385 couple)
    lihccSingleWeekly: 811,
    lihccCoupleWeekly: 1385,
    lihccPerChildWeekly: 43,
};

const AGE_PENSION_AGE = 67;

const amount = (value) => {
    const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
};

function ageFromDateOfBirth(value) {
    if (!value) return 0;
    const dateOfBirth = new Date(value);
    if (Number.isNaN(dateOfBirth.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    if (
        today.getMonth() < dateOfBirth.getMonth() ||
        (today.getMonth() === dateOfBirth.getMonth() &&
            today.getDate() < dateOfBirth.getDate())
    ) {
        age -= 1;
    }
    return age > 0 ? age : 0;
}

function resolveAge(assessmentAge, profileAge, dateOfBirth) {
    return amount(assessmentAge) || amount(profileAge) || ageFromDateOfBirth(dateOfBirth);
}

const formatCurrency = (value) => `$${Math.round(value || 0).toLocaleString('en-AU')}`;
const formatSpeechCurrency = (value) => {
    const rounded = Math.round(Number(value) || 0);
    if (rounded === 0) return 'zero dollars';
    const sign = rounded < 0 ? 'negative ' : '';
    const absolute = Math.abs(rounded);
    if (absolute >= 1000000) {
        const millions = Math.round((absolute / 1000000) * 10) / 10;
        return `${sign}${Number.isInteger(millions) ? millions : millions.toFixed(1)} million dollars`;
    }
    if (absolute >= 100000) return `${sign}${Math.round(absolute / 1000)} thousand dollars`;
    if (absolute >= 10000) {
        const thousands = Math.round(absolute / 500) * 500 / 1000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    if (absolute >= 1000) {
        const thousands = Math.round(absolute / 100) * 100 / 1000;
        return `${sign}${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)} thousand dollars`;
    }
    return `${sign}${absolute} dollars`;
};
const formatTableAmount = (value) => {
    if (!value) return '—';
    return value < 0 ? `(${formatCurrency(-value)})` : formatCurrency(value);
};

// eslint-disable-next-line react-refresh/only-export-components
export function calculateAgePensionAssessment(data = {}, reviewPersonalDetails = {}) {
    const personal = data.personalDetails || data;
    const clientPersonalDetails = reviewPersonalDetails?.client || reviewPersonalDetails;
    const partnerPersonalDetails = reviewPersonalDetails?.partner || {};
    const lifestyle = data.lifestyleAssets || data.lifestyle || {};
    const property = data.investmentPropertyAndOtherAssets || data.investmentProperty || {};
    const financial = data.financialAssets || {};
    const income = data.income || {};
    const clientFinancial = financial.client || data.client || {};
    const partnerFinancial = financial.partner || data.partner || {};
    const clientIncome = income.client || data.client || {};
    const partnerIncome = income.partner || data.partner || {};
    const situation = String(personal.situation || 'couple').toLowerCase();
    const illnessSeparated = situation.includes('illness');
    const isCouple = situation.includes('couple') || illnessSeparated;
    const homeowner = String(personal.homeOwnership || 'homeowner').toLowerCase() === 'homeowner';
    const clientAge = resolveAge(
        personal.clientAge,
        clientPersonalDetails?.clientAge,
        clientPersonalDetails?.clientDOB,
    );
    const partnerAge = resolveAge(
        personal.partnerAge,
        partnerPersonalDetails?.partnerAge,
        partnerPersonalDetails?.partnerDOB,
    );
    const clientEligible = clientAge >= AGE_PENSION_AGE;
    const partnerEligible = isCouple && partnerAge >= AGE_PENSION_AGE;

    const vehicleClient = amount(lifestyle.vehiclesClient);
    const vehiclePartner = amount(lifestyle.vehiclesPartner);
    const contents = amount(lifestyle.homeContents);
    const lifestyleOther = amount(lifestyle.otherLifestyle);
    const savingsClient = amount(clientFinancial.savingsAndCash ?? clientFinancial.savingsCash);
    const savingsPartner = amount(partnerFinancial.savingsAndCash ?? partnerFinancial.savingsCash);
    const termDepositsClient = amount(clientFinancial.termDeposits);
    const termDepositsPartner = amount(partnerFinancial.termDeposits);
    const sharesClient = amount(clientFinancial.sharesAndManagedFunds ?? clientFinancial.sharesManagedFunds);
    const sharesPartner = amount(partnerFinancial.sharesAndManagedFunds ?? partnerFinancial.sharesManagedFunds);
    const superClient = amount(clientFinancial.superAnnuationTotal ?? clientFinancial.superBalance);
    const superPartner = amount(partnerFinancial.superAnnuationTotal ?? partnerFinancial.superBalance);
    const abpClient = amount(clientFinancial.accountBasedPensionTotal ?? clientFinancial.abpBalance);
    const abpPartner = amount(partnerFinancial.accountBasedPensionTotal ?? partnerFinancial.abpBalance);
    const otherInvestments = amount(property.otherInvestments);
    const investmentLoans = amount(property.investmentLoans);
    const propertyValue = amount(property.propertyValue);
    const propertyLoan = amount(property.propertyLoan);
    const otherAssets = amount(property.otherAssets);
    const salaryClient = amount(clientIncome.employmentSalary);
    const salaryPartner = amount(partnerIncome.employmentSalary);
    const rentalIncome = amount(property.rentalIncome);
    const rentalExpenses = amount(property.rentalExpenses);
    const otherIncomeClient = amount(clientIncome.otherIncome);
    const otherIncomePartner = amount(partnerIncome.otherIncome);
    const abpPaymentClient = amount(clientIncome.abpPensionPayment);
    const abpPaymentPartner = amount(partnerIncome.abpPensionPayment);
    const abpDeductibleClient = amount(clientIncome.abpDeductibleAmount);
    const abpDeductiblePartner = amount(partnerIncome.abpDeductibleAmount);

    const superClientAssessed = clientEligible ? superClient : 0;
    const superPartnerAssessed = partnerEligible ? superPartner : 0;
    const financialTotal = savingsClient + savingsPartner + termDepositsClient + termDepositsPartner
        + sharesClient + sharesPartner + otherInvestments - investmentLoans;
    const abpAssetsTotal = abpClient + (isCouple ? abpPartner : 0);
    const superAssetsTotal = superClientAssessed + superPartnerAssessed;
    const propertyNet = Math.max(0, propertyValue - propertyLoan);
    const personalAssets = vehicleClient + vehiclePartner + contents + lifestyleOther;
    const totalAssets = personalAssets + financialTotal + abpAssetsTotal + superAssetsTotal
        + propertyNet + otherAssets;

    const lowerThreshold = homeowner
        ? (isCouple ? AGE_PENSION_RATES.coupleHomeLower : AGE_PENSION_RATES.singleHomeLower)
        : (isCouple ? AGE_PENSION_RATES.coupleRentLower : AGE_PENSION_RATES.singleRentLower);
    const upperThreshold = homeowner
        ? (isCouple ? AGE_PENSION_RATES.coupleHomeUpper : AGE_PENSION_RATES.singleHomeUpper)
        : (isCouple ? AGE_PENSION_RATES.coupleRentUpper : AGE_PENSION_RATES.singleRentUpper);
    const fullSingleBasis = AGE_PENSION_RATES.singleBaseFn * 26;
    const fullCoupleEachBasis = AGE_PENSION_RATES.coupleBaseFn * 26;
    const fullBasis = illnessSeparated
        ? fullSingleBasis * 2
        : (isCouple ? fullCoupleEachBasis * 2 : fullSingleBasis);
    const excessAssets = Math.max(0, totalAssets - lowerThreshold);
    const assetsReduction = Math.min(
        excessAssets / 1000 * AGE_PENSION_RATES.assetsTaperPerThousandFn * 26,
        fullBasis,
    );
    const underAssets = Math.max(0, fullBasis - assetsReduction);

    const clientSuperAndAbp = superClientAssessed + abpClient;
    const partnerSuperAndAbp = superPartnerAssessed + (isCouple ? abpPartner : 0);
    const financialForDeeming = financialTotal + clientSuperAndAbp + partnerSuperAndAbp;
    const deemingThreshold = isCouple
        ? AGE_PENSION_RATES.deemCoupleThreshold
        : AGE_PENSION_RATES.deemSingleThreshold;
    const deemedIncome = Math.min(financialForDeeming, deemingThreshold) * AGE_PENSION_RATES.deemLowerRate
        + Math.max(0, financialForDeeming - deemingThreshold) * AGE_PENSION_RATES.deemUpperRate;
    const workBonusClient = clientEligible ? Math.min(salaryClient, 7800) : 0;
    const workBonusPartner = partnerEligible ? Math.min(salaryPartner, 7800) : 0;
    const assessableSalary = Math.max(0, salaryClient - (clientEligible ? 7800 : 0))
        + Math.max(0, salaryPartner - (partnerEligible ? 7800 : 0));
    const netRental = Math.max(0, rentalIncome - rentalExpenses);
    const netAbpClient = Math.max(0, abpPaymentClient - abpDeductibleClient);
    const netAbpPartner = Math.max(0, abpPaymentPartner - abpDeductiblePartner);
    const assessableIncome = deemedIncome + netRental + assessableSalary + otherIncomeClient
        + otherIncomePartner + netAbpClient + netAbpPartner;
    const incomeFreeArea = (isCouple
        ? AGE_PENSION_RATES.incomeFreeCoupleFn
        : AGE_PENSION_RATES.incomeFreeSingleFn) * 26;
    const excessIncome = Math.max(0, assessableIncome - incomeFreeArea);
    const incomeReduction = Math.min(excessIncome * 0.5, fullBasis);
    const underIncome = Math.max(0, fullBasis - incomeReduction);
    const actualBasis = Math.min(underAssets, underIncome);
    const fullSingleSupplements = (AGE_PENSION_RATES.singlePharmFn + AGE_PENSION_RATES.singleCleanFn) * 26;
    const fullCoupleSupplements = (AGE_PENSION_RATES.couplePharmFn + AGE_PENSION_RATES.coupleCleanFn) * 26;
    const personSupplement = (illnessSeparated || !isCouple)
        ? fullSingleSupplements
        : fullCoupleSupplements;
    const personBasis = isCouple ? actualBasis / 2 : actualBasis;
    const personActual = personBasis > 0 ? personBasis + personSupplement : 0;
    const clientPension = clientEligible ? personActual : 0;
    const partnerPension = partnerEligible ? personActual : 0;
    const combinedPension = clientPension + partnerPension;
    const eligibleCount = Number(clientEligible) + Number(partnerEligible);
    const fullPersonBasis = illnessSeparated || !isCouple ? fullSingleBasis : fullCoupleEachBasis;
    const maxPension = eligibleCount * (fullPersonBasis + personSupplement);
    const pensionLost = Math.max(0, maxPension - combinedPension);

    const split = (value) => isCouple ? value / 2 : value;
    const splitPartner = (value) => isCouple ? value / 2 : 0;
    const clientAssetTotal = vehicleClient + split(contents) + split(lifestyleOther)
        + savingsClient + termDepositsClient + sharesClient + split(otherInvestments)
        - split(investmentLoans) + superClientAssessed + abpClient + split(propertyNet) + split(otherAssets);
    const partnerAssetTotal = isCouple
        ? vehiclePartner + splitPartner(contents) + splitPartner(lifestyleOther)
        + savingsPartner + termDepositsPartner + sharesPartner + splitPartner(otherInvestments)
        - splitPartner(investmentLoans) + superPartnerAssessed + abpPartner
        + splitPartner(propertyNet) + splitPartner(otherAssets)
        : 0;
    const row = (key, item, client, partner, total, flags = {}) => ({
        key,
        item,
        client,
        partner,
        total,
        ...flags,
    });
    const assetRows = [
        ['Motor Vehicle', vehicleClient, vehiclePartner, vehicleClient + vehiclePartner],
        ['Contents', split(contents), splitPartner(contents), contents],
        ['Other Lifestyle (Boats/Caravan)', split(lifestyleOther), splitPartner(lifestyleOther), lifestyleOther],
        ['Savings / Bank Accounts', savingsClient, savingsPartner, savingsClient + savingsPartner],
        ['Term Deposits', termDepositsClient, termDepositsPartner, termDepositsClient + termDepositsPartner],
        ['Shares / Managed Funds', sharesClient, sharesPartner, sharesClient + sharesPartner],
        ['Other Investments', split(otherInvestments), splitPartner(otherInvestments), otherInvestments],
        [`Superannuation${!clientEligible || (isCouple && !partnerEligible) ? ' (excluded if age < 67)' : ''}`, superClientAssessed, superPartnerAssessed, superAssetsTotal],
        ['Account Based Pension (Balance)', abpClient, isCouple ? abpPartner : 0, abpAssetsTotal],
        ['Investment Property (Net)', split(propertyNet), splitPartner(propertyNet), propertyNet],
        ['Other Assets', split(otherAssets), splitPartner(otherAssets), otherAssets],
    ].map(([item, client, partner, total], index) =>
        row(String(index + 1), item, formatTableAmount(client), isCouple ? formatTableAmount(partner) : '—', formatTableAmount(total)));
    assetRows.push(
        row('assets-total', 'Total Assessable Assets', formatCurrency(clientAssetTotal), isCouple ? formatCurrency(partnerAssetTotal) : '—', formatCurrency(totalAssets), { isHighlighted: true, isTotal: true }),
        row('assets-lower', 'Lower Threshold', '', '', formatCurrency(lowerThreshold)),
        row('assets-upper', 'Upper Threshold', '', '', formatCurrency(upperThreshold)),
        row('assets-excess', 'Excess Assets', '', '', formatCurrency(excessAssets), { isHighlighted: true }),
        row('assets-reduction', 'Assets Test Reduction', '', '', assetsReduction > 0 ? `(${formatCurrency(assetsReduction)})` : '—'),
        row('assets-under', 'Under Assets Test (p.a.)', '', '', formatCurrency(underAssets), { isHighlighted: true, isFinal: true }),
    );

    const incomeRows = [
        ['Deemed Income (Financial Assets)', isCouple ? deemedIncome / 2 : deemedIncome, isCouple ? deemedIncome / 2 : 0, deemedIncome],
        ['Net Rental Income', isCouple ? netRental / 2 : netRental, isCouple ? netRental / 2 : 0, netRental],
        ['Salary / Business Income (gross)', salaryClient, isCouple ? salaryPartner : 0, salaryClient + salaryPartner],
        ['Work Bonus (−)', -workBonusClient, isCouple ? -workBonusPartner : 0, -(workBonusClient + workBonusPartner)],
        ['Other Income', otherIncomeClient, isCouple ? otherIncomePartner : 0, otherIncomeClient + otherIncomePartner],
        [
            'Other Income Streams (less deductible)',
            netAbpClient,
            isCouple ? netAbpPartner : 0,
            Math.max(0, abpPaymentClient + abpPaymentPartner - abpDeductibleClient - abpDeductiblePartner),
        ],
    ].map(([item, client, partner, total], index) =>
        row(String(index + 1), item, formatTableAmount(client), isCouple ? formatTableAmount(partner) : '—', formatTableAmount(total)));
    incomeRows.push(
        row('income-total', 'Total Assessable Income', isCouple ? formatCurrency(assessableIncome / 2) : formatCurrency(assessableIncome), isCouple ? formatCurrency(assessableIncome / 2) : '—', formatCurrency(assessableIncome), { isHighlighted: true, isTotal: true }),
        row('income-free', 'Free Area (p.a.)', '', '', formatCurrency(incomeFreeArea)),
        row('income-excess', 'Excess Income', '', '', formatCurrency(excessIncome), { isHighlighted: true }),
        row('income-reduction', 'Income Test Reduction', '', '', incomeReduction > 0 ? `(${formatCurrency(incomeReduction)})` : '—'),
        row('income-under', 'Under Income Test (p.a.)', '', '', formatCurrency(underIncome), { isHighlighted: true, isFinal: true }),
    );

    const testPensionPerPerson = (testBasis, eligible) =>
    (eligible && testBasis > 0
        ? testBasis / (isCouple ? 2 : 1) + personSupplement
        : 0);
    const graphData = [
        ...(clientEligible ? [{
            person: 'Client',
            actualPension: clientPension,
            assetsTestPension: testPensionPerPerson(underAssets, clientEligible),
            incomeTestPension: testPensionPerPerson(underIncome, clientEligible),
            maxPension: fullPersonBasis + personSupplement,
        }] : []),
        ...(partnerEligible ? [{
            person: 'Partner',
            actualPension: partnerPension,
            assetsTestPension: testPensionPerPerson(underAssets, partnerEligible),
            incomeTestPension: testPensionPerPerson(underIncome, partnerEligible),
            maxPension: fullPersonBasis + personSupplement,
        }] : []),
    ];

    return {
        clientAge,
        partnerAge,
        lihccExistingHolder: Boolean(personal.lihccExistingHolder),
        isCouple,
        clientEligible,
        partnerEligible,
        eligibleCount,
        isNoPension: combinedPension <= 0,
        isFullPension: combinedPension > 0 && actualBasis >= fullBasis - 1,
        determiningTest: underAssets === 0 && underIncome === 0
            ? 'none'
            : underAssets <= underIncome ? 'assets' : 'income',
        status: combinedPension <= 0
            ? eligibleCount === 0 ? 'Not eligible' : 'No pension entitlement'
            : (actualBasis >= fullBasis - 1 ? 'Full pension' : 'Part pension'),
        clientPension,
        partnerPension,
        clientSuperExcluded: !clientEligible && superClient > 0,
        partnerSuperExcluded: isCouple && !partnerEligible && superPartner > 0,
        combinedPension,
        maxPension,
        pensionLost,
        totalAssets,
        totalAssessableIncome: assessableIncome,
        assetRows,
        incomeRows,
        graphData,
    };
}

const ReviewAgePensionAssessment = () => {
    const [viewMode, setViewMode] = useState('Table');
    const [meansTestTab, setMeansTestTab] = useState('Assets Test');
    const [selectedReviewAllData] = useAtom(SelectedReviewAllData);
    const rateReference = useAtomValue(RateReferenceObject);
    const agePensionData =
        selectedReviewAllData?.agePensionAssessmentDetails
        || selectedReviewAllData?.agePensionDetails
        || {};
    const assessment = useMemo(
        () => calculateAgePensionAssessment(
            agePensionData,
            selectedReviewAllData?.personalDetails,
        ),
        [agePensionData, selectedReviewAllData?.personalDetails],
    );
    const { clientAge, partnerAge } = assessment;
    const [openModal, setOpenModal] = useState(false);
    const [openAnalysisModal, setOpenAnalysisModal] = useState(false);
    const getReviewName = useGetReviewName();
    const [seriesVisibility, setSeriesVisibility] = useState({
        actualPension: true,
        maxPension: true,
    });

    // const analysisContent = useMemo(() => {
    //     const reviewData = selectedReviewAllData || {};
    //     const firstName = (role) => {
    //         const preferredName = reviewData.personalDetails?.[role]?.preferredName || getReviewName(role);
    //         const name = String(preferredName || '').trim();
    //         if (!name || ['client', 'partner'].includes(name.toLowerCase())) {
    //             return role === 'partner' ? 'your partner' : 'you';
    //         }
    //         return name.split(/\s+/)[0];
    //     };
    //     const clientName = firstName('client');
    //     const partnerName = firstName('partner');
    //     const who = assessment.isCouple ? `${clientName} and ${partnerName}` : clientName;
    //     const pronoun = assessment.isCouple ? 'you both' : 'you';
    //     const status = assessment.isNoPension
    //         ? 'No pension entitlement'
    //         : assessment.isFullPension ? 'Full Age Pension' : 'Part Age Pension';
    //     const testName = assessment.determiningTest === 'none'
    //         ? 'means tests'
    //         : `${assessment.determiningTest} test`;
    //     const analysis = [];
    //     const speech = [`${who}, based on the Age Pension assessment:`];

    //     if (assessment.isNoPension) {
    //         const ageIneligible = assessment.eligibleCount === 0;
    //         analysis.push(
    //             `<strong>${who}</strong> — <strong>${status}</strong>${ageIneligible
    //                 ? ' because the Age Pension age requirement has not been met.'
    //                 : ` based on the ${testName}.`}`,
    //         );
    //         speech.push(ageIneligible
    //             ? `The Age Pension age requirement has not been met, so ${pronoun} are not currently entitled to the Age Pension.`
    //             : `Unfortunately, based on the ${testName}, ${pronoun} are not currently entitled to the Age Pension.`);
    //     } else {
    //         analysis.push(
    //             `<strong>${who}</strong> — <strong>${status}</strong>${assessment.isFullPension
    //                 ? '.'
    //                 : `, limited by the ${testName}.`}`,
    //         );
    //         speech.push(assessment.isFullPension
    //             ? `Good news — ${pronoun} qualify for the full Age Pension.`
    //             : `${pronoun.charAt(0).toUpperCase()}${pronoun.slice(1)} qualify for a part Age Pension, limited by the ${testName}.`);
    //         analysis.push(
    //             `Total pension: <strong>${formatCurrency(assessment.combinedPension)} per year</strong> (<strong>${formatCurrency(assessment.combinedPension / 26)} per fortnight</strong>).`,
    //         );
    //         speech.push(
    //             `Your total pension is ${formatSpeechCurrency(assessment.combinedPension)} per year, or ${formatSpeechCurrency(assessment.combinedPension / 26)} per fortnight.`,
    //         );
    //     }

    //     analysis.push(`Your total assessable assets: <strong>${formatCurrency(assessment.totalAssets)}</strong>.`);
    //     analysis.push(`Your assessable income: <strong>${formatCurrency(assessment.totalAssessableIncome)}</strong> per year.`);

    //     if (!assessment.isNoPension && assessment.pensionLost > 0) {
    //         analysis.push(
    //             `Reduced from the full rate by <strong>${formatCurrency(assessment.pensionLost)} per year</strong> due to the ${testName}.`,
    //         );
    //         speech.push(
    //             `This is ${formatSpeechCurrency(assessment.pensionLost)} less than the full rate, due to the ${testName}.`,
    //         );
    //     }

    //     // --- NEW LIHCC LOGIC ADDED HERE ---
    //     const rateReference = RateReferenceObject; // Assuming this is imported or available
    //     const lihccRates = rateReference?.lowIncomeHealthCareCard;

    //     const baseWeeklyIncomeLimit = amount(
    //         assessment.isCouple
    //             ? (lihccRates?.partnerCombinedPerWeek ?? AGE_PENSION_RATES.lihccCoupleWeekly)
    //             : (lihccRates?.clientPerWeek ?? AGE_PENSION_RATES.lihccSingleWeekly),
    //     );
    //     const hasConfiguredLihccLimit = baseWeeklyIncomeLimit > 0;
    //     const dependentChildren = (
    //         reviewData?.personalDetails?.children?.arrayOfChildren || []
    //     ).filter((child) =>
    //         ["yes", "true"].includes(String(child?.depenantChild).toLowerCase()),
    //     ).length;
    //     const dependentAllowancePerWeek = amount(
    //         lihccRates?.perDependentChildPerWeek ?? AGE_PENSION_RATES.lihccPerChildWeekly
    //     );
    //     const holderUplift = assessment.lihccExistingHolder ? 1.25 : 1;
    //     const weeklyIncomeLimit =
    //         (baseWeeklyIncomeLimit + dependentChildren * dependentAllowancePerWeek) *
    //         holderUplift;
    //     const eightWeekIncomeLimit = weeklyIncomeLimit * 8;
    //     const estimatedEightWeekIncome = assessment.totalAssessableIncome * (8 / 52);
    //     const lihccEligible =
    //         hasConfiguredLihccLimit && estimatedEightWeekIncome <= eightWeekIncomeLimit;

    //     if (hasConfiguredLihccLimit && !lihccEligible) {
    //         analysis.push(
    //             `<span style="color: #dc2626;">❌ Income is also above the Low-Income Health Care Card threshold</span>`
    //         );
    //         speech.push("Additionally, your income is above the Low-Income Health Care Card threshold.");
    //     }
    //     // ----------------------------------

    //     speech.push('This is an estimate based on the information provided, not a Centrelink determination.');

    //     return {
    //         subtitle: `🏛️ Age Pension Results for ${who}`,
    //         metrics: [
    //             {
    //                 label: 'Entitlement',
    //                 value: status,
    //                 color: assessment.isNoPension
    //                     ? '#dc2626'
    //                     : assessment.isFullPension ? '#16a34a' : '#d97706',
    //             },
    //             ...(!assessment.isNoPension
    //                 ? [
    //                     { label: 'Per year', value: formatCurrency(assessment.combinedPension) },
    //                     { label: 'Per fortnight', value: formatCurrency(assessment.combinedPension / 26) },
    //                 ]
    //                 : []),
    //         ],
    //         analysis,
    //         readAloud: speech.join(' '),
    //     };
    // }, [assessment, getReviewName, selectedReviewAllData]);

    const analysisContent = useMemo(() => {
        const reviewData = selectedReviewAllData || {};
        const firstName = (role) => {
            const preferredName = reviewData.personalDetails?.[role]?.preferredName || getReviewName(role);
            const name = String(preferredName || '').trim();
            if (!name || ['client', 'partner'].includes(name.toLowerCase())) {
                return role === 'partner' ? 'Partner' : 'Client';
            }
            return name.split(/\s+/)[0];
        };
        const clientName = firstName('client');
        const partnerName = firstName('partner');
        const hasPartner = assessment.isCouple;

        const clientPension = assessment.clientPension;
        const partnerPension = assessment.partnerPension;
        const combinedPension = assessment.combinedPension;

        const analysis = [
            `<strong>${clientName}</strong>: Pension entitlement is <strong>${formatCurrency(clientPension)}/yr</strong> (${formatCurrency(clientPension / 26)}/fn)`,
        ];
        const speech = [
            `${clientName}, your Age Pension entitlement is ${formatSpeechCurrency(clientPension)} per year.`,
        ];

        if (hasPartner) {
            analysis.push(
                `<strong>${partnerName}</strong>: Pension entitlement is <strong>${formatCurrency(partnerPension)}/yr</strong> (${formatCurrency(partnerPension / 26)}/fn)`
            );
            speech.push(
                `${partnerName}, your Age Pension entitlement is ${formatSpeechCurrency(partnerPension)} per year.`
            );
        }

        analysis.push(
            `Combined Total: <strong>${formatCurrency(combinedPension)}/yr</strong> · Total Assessable Assets: <strong>${formatCurrency(assessment.totalAssets)}</strong> · Assessable Income: <strong>${formatCurrency(assessment.totalAssessableIncome)}/yr</strong>`
        );

        const metrics = [
            { label: `${clientName} Pension`, value: formatCurrency(clientPension) },
            { label: `${clientName} Fortnightly`, value: formatCurrency(clientPension / 26) },
            ...(hasPartner ? [
                { label: `${partnerName} Pension`, value: formatCurrency(partnerPension) },
                { label: `${partnerName} Fortnightly`, value: formatCurrency(partnerPension / 26) },
            ] : []),
        ];

        return {
            subtitle: `🏛️ Combined Age Pension Analysis`,
            metrics,
            analysis,
            readAloud: `${speech.join(' ')} This is an estimate based on the information provided, not a Centrelink determination.`,
        };
    }, [assessment, getReviewName, selectedReviewAllData]);

    const headingStyle = { fontFamily: 'Georgia, serif' };
    const renderTitleBlock = useTitleBlock({
        titleStyle: headingStyle,
    });

    const columns = [
        {
            title: 'Item',
            dataIndex: 'item',
            key: 'item',
            render: (text, record) => (
                <Text style={{ fontWeight: record.isHighlighted || record.isTotal ? 700 : 400 }}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Client',
            dataIndex: 'client',
            key: 'client',
            align: 'right',
            render: (text, record) => (
                <Text style={{ fontWeight: record.isTotal ? 700 : 400 }}>{text}</Text>
            ),
        },
        {
            title: 'Partner',
            dataIndex: 'partner',
            key: 'partner',
            align: 'right',
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (text, record) => {
                let color = '#1f2937';
                if (record.isTotal) color = '#16a34a';
                if (record.isFinal) color = '#16a34a';
                return <Text style={{ fontWeight: record.isHighlighted ? 700 : 400, color }}>{text}</Text>;
            },
        },
    ];

    const currentTableData = meansTestTab === 'Assets Test'
        ? assessment.assetRows
        : assessment.incomeRows;

    // 2. Define the toggleSeries function
    const toggleSeries = (key) => {
        setSeriesVisibility((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const lihccRates = rateReference?.lowIncomeHealthCareCard;

    // ── FIXED: Use HTML's $811 / $1385 fallbacks when rateReference is missing ──
    const baseWeeklyIncomeLimit = amount(
        assessment.isCouple
            ? (lihccRates?.partnerCombinedPerWeek ?? AGE_PENSION_RATES.lihccCoupleWeekly)
            : (lihccRates?.clientPerWeek ?? AGE_PENSION_RATES.lihccSingleWeekly),
    );
    const hasConfiguredLihccLimit = baseWeeklyIncomeLimit > 0;
    const dependentChildren = (
        selectedReviewAllData?.personalDetails?.children?.arrayOfChildren || []
    ).filter((child) =>
        ["yes", "true"].includes(String(child?.depenantChild).toLowerCase()),
    ).length;
    const dependentAllowancePerWeek = amount(
        lihccRates?.perDependentChildPerWeek ?? AGE_PENSION_RATES.lihccPerChildWeekly
    );
    const holderUplift = assessment.lihccExistingHolder ? 1.25 : 1;
    const weeklyIncomeLimit =
        (baseWeeklyIncomeLimit + dependentChildren * dependentAllowancePerWeek) *
        holderUplift;
    const eightWeekIncomeLimit = weeklyIncomeLimit * 8;
    const baseLimit8wk = baseWeeklyIncomeLimit * 8;
    const estimatedEightWeekIncome = assessment.totalAssessableIncome * (8 / 52);
    const lihccEligible =
        hasConfiguredLihccLimit && estimatedEightWeekIncome <= eightWeekIncomeLimit;
    const lihccStatusMessage = !hasConfiguredLihccLimit
        ? 'Income limit is unavailable. Configure the Low-Income Health Care Card rate reference to assess eligibility.'
        : lihccEligible
            ? `${assessment.lihccExistingHolder ? 'Continues to be eligible' : 'Likely eligible'} — ${formatCurrency(eightWeekIncomeLimit - estimatedEightWeekIncome)} below the ${assessment.lihccExistingHolder ? 'renewal (125%)' : '8-week'} threshold.`
            : `${assessment.lihccExistingHolder ? 'Card may not be renewed' : 'Over the income limit'} — ${formatCurrency(estimatedEightWeekIncome - eightWeekIncomeLimit)} above the ${assessment.lihccExistingHolder ? 'renewal (125%)' : '8-week'} threshold.`;
    const lihccLimitNote = hasConfiguredLihccLimit
        ? `${assessment.isCouple ? 'Couple combined' : 'Single'}: ${formatCurrency(baseWeeklyIncomeLimit)} per week × 8${dependentChildren ? `, plus ${dependentChildren} dependent-child allowance(s)` : ''}${assessment.lihccExistingHolder ? ' × 1.25 renewal uplift' : ''}.`
        : 'No configured income limit is available.';
    const estimatedWeeklyIncome = estimatedEightWeekIncome / 8;
    const excludedSuperOwners = [
        assessment.clientSuperExcluded ? 'Client' : null,
        assessment.partnerSuperExcluded ? 'Partner' : null,
    ].filter(Boolean);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            {/* Top Toolbar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {assessment.combinedPension <= 0 ? (
                    <Tag
                        icon={<FaXmark />}
                        style={{
                            padding: '4px 16px',
                            backgroundColor: '#fdf0f0',
                            borderColor: '#a31616',
                            color: '#a31616',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {assessment.status}
                    </Tag>
                ) : (
                    <Tag
                        icon={<CheckCircleOutlined />}
                        style={{
                            padding: '4px 16px',
                            borderRadius: 20,
                            backgroundColor: '#f0fdf4',
                            borderColor: '#22c55e',
                            color: '#16a34a',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {assessment.status}
                    </Tag>
                )}

                <Space size={12}>
                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { label: 'Graph', value: 'Graph', icon: "📈" },
                            { label: 'Table', value: 'Table', icon: "📋" },
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
                        onClick={() => { setOpenModal(true) }}
                    >
                        Edit Inputs
                    </Button>


                </Space>
            </div>

            {/* Top Summary Metric Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex' }}>
                {/* Combined Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ flex: 1, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Combined Pension</Text>
                            {assessment.combinedPension <= 0 ? (
                                <Title level={2} style={{ margin: '4px 0', fontWeight: 700, color: '#a31616' }}>
                                    $0
                                </Title>
                            ) : (
                                <Title level={2} style={{ margin: '4px 0', fontWeight: 700, color: '#16a34a' }}>
                                    {formatCurrency(assessment.combinedPension)}
                                </Title>
                            )}
                        </div>
                        {assessment.combinedPension <= 0 ? (
                            <Tag
                                icon={<FaXmark />}
                                style={{
                                    padding: '2px 12px',
                                    borderRadius: 8,
                                    backgroundColor: '#fdf0f0',
                                    borderColor: '#a31616',
                                    color: '#a31616',
                                    fontSize: 9,
                                    fontWeight: 600,
                                    width: 'fit-content',
                                }}
                            >
                                {assessment.status}
                            </Tag>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Annual · {formatCurrency(assessment.combinedPension / 26)} / fn
                            </Text>)}
                    </Card>
                </Col>

                {/* Client Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ flex: 1, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Client Pension</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {formatCurrency(assessment.clientPension)}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Fortnightly: {formatCurrency(assessment.clientPension / 26)}
                        </Text>
                    </Card>
                </Col>

                {/* Partner Pension */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ flex: 1, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Partner Pension</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {assessment.isCouple ? formatCurrency(assessment.partnerPension) : '—'}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Fortnightly: {assessment.isCouple ? formatCurrency(assessment.partnerPension / 26) : '—'}
                        </Text>
                    </Card>
                </Col>

                {/* Max Possible */}
                <Col xs={24} sm={12} md={6} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Card
                        bodyStyle={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        style={{ borderRadius: 12, borderColor: '#e8e8e8' }}
                    >
                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Max Possible</Text>
                            <Title level={3} style={{ margin: '4px 0', fontWeight: 600, color: '#1f2937' }}>
                                {formatCurrency(assessment.maxPension)}
                            </Title>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Pension lost: {formatCurrency(assessment.pensionLost)} · {formatCurrency(assessment.pensionLost / 26)} / fn
                        </Text>
                    </Card>
                </Col>
            </Row>

            {/* Main Section: Dynamic View (Graph vs Table) */}
            {!assessment.clientEligible && !assessment.partnerEligible ? (
                <Card
                    style={{
                        borderRadius: 16,
                        borderColor: '#e8e8e8',
                        backgroundColor: '#ffffff',
                    }}
                    bodyStyle={{ padding: '20px 28px 24px' }}
                >
                    <Title level={4} style={{ marginBottom: 16, fontWeight: 700 }}>
                        Centrelink Entitlement Detail
                    </Title>

                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {excludedSuperOwners.length > 0 && (
                            <Alert
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                style={{
                                    borderRadius: 10,
                                    backgroundColor: '#fffbeb',
                                    borderColor: '#f59e0b',
                                }}
                                message={
                                    <Text style={{ color: '#92400e', fontSize: 13 }}>
                                        <strong>Super excluded:</strong>{' '}
                                        {excludedSuperOwners.join(' & ')}’s accumulation super balance is not assessed (Age Pension age is {AGE_PENSION_AGE}).
                                    </Text>
                                }
                            />
                        )}

                        {/* LOW-INCOME HEALTH CARE CARD ELIGIBILITY PANEL */}
                        <Card
                            bordered
                            style={{
                                borderRadius: 10,
                                backgroundColor: '#fafafa',
                                borderColor: 'rgba(0, 0, 0, 0.06)',
                            }}
                            bodyStyle={{ padding: '14px 16px' }}
                        >
                            {/* Header Row */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        backgroundColor: '#22c55e',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        flexShrink: 0,
                                    }}
                                >
                                    <CreditCardOutlined />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Text strong style={{ fontSize: '0.95rem', color: '#111827' }}>
                                            Low-Income Health Care Card Eligibility
                                        </Text>
                                        <Tag
                                            color={
                                                !hasConfiguredLihccLimit
                                                    ? "default"
                                                    : lihccEligible
                                                        ? "#22c55e"
                                                        : "error"
                                            }
                                            style={{
                                                borderRadius: 9,
                                                fontSize: '0.62rem',
                                                fontWeight: 700,
                                                marginRight: 0,
                                                padding: '1px 7px',
                                                lineHeight: '1.4',
                                            }}
                                        >
                                            {assessment.lihccExistingHolder
                                                ? "RENEWAL · 125%"
                                                : "NEW CLAIM"}
                                        </Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '0.74rem', display: 'block', marginTop: 2, lineHeight: 1.4 }}>
                                        Income-tested only (no assets test). Provides cheaper PBS prescriptions, bulk-billed GP visits, and state concessions on utilities, transport, etc.
                                    </Text>
                                </div>
                            </div>

                            {/* Grid section for limits and income */}
                            <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
                                <Col span={12}>
                                    <div
                                        style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            borderRadius: 9,
                                            padding: '8px 12px',
                                        }}
                                    >
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '0.66rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px',
                                                display: 'block',
                                            }}
                                        >
                                            8-week Income Limit
                                        </Text>
                                        <Text strong style={{ fontSize: '1.05rem', color: '#111827', display: 'block', marginTop: 2 }}>
                                            {hasConfiguredLihccLimit
                                                ? formatCurrency(eightWeekIncomeLimit)
                                                : "Not configured"}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '0.7rem', display: 'block', marginTop: 2, color: '#9ca3af' }}>
                                            {lihccLimitNote}
                                        </Text>
                                    </div>
                                </Col>

                                <Col span={12}>
                                    <div
                                        style={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            borderRadius: 9,
                                            padding: '8px 12px',
                                        }}
                                    >
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '0.66rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px',
                                                display: 'block',
                                            }}
                                        >
                                            Their 8-week Income
                                        </Text>
                                        <Text strong style={{ fontSize: '1.05rem', color: '#111827', display: 'block', marginTop: 2 }}>
                                            {formatCurrency(estimatedEightWeekIncome)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '0.7rem', display: 'block', marginTop: 2, color: '#9ca3af' }}>
                                            Estimated from annual assessable income · {formatCurrency(estimatedWeeklyIncome)}/week
                                        </Text>
                                    </div>
                                </Col>
                            </Row>

                            {/* Status Box */}
                            <Alert
                                type={
                                    !hasConfiguredLihccLimit
                                        ? "warning"
                                        : lihccEligible
                                            ? "success"
                                            : "error"
                                }
                                showIcon
                                icon={
                                    lihccEligible
                                        ? <CheckCircleFilled style={{ color: '#15803d', fontSize: 18 }} />
                                        : <WarningOutlined style={{ fontSize: 18 }} />
                                }
                                style={{
                                    backgroundColor: !hasConfiguredLihccLimit
                                        ? '#fffbeb'
                                        : lihccEligible
                                            ? '#dcfce7'
                                            : '#fef2f2',
                                    borderColor: !hasConfiguredLihccLimit
                                        ? '#f59e0b'
                                        : lihccEligible
                                            ? '#86efac'
                                            : '#fecaca',
                                    borderRadius: 9,
                                    padding: '8px 12px',
                                }}
                                message={
                                    <Text
                                        style={{
                                            color: !hasConfiguredLihccLimit
                                                ? '#92400e'
                                                : lihccEligible
                                                    ? '#15803d'
                                                    : '#b91c1c',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {lihccStatusMessage}
                                    </Text>
                                }
                            />

                            {/* Benefits Detail */}
                            <Paragraph
                                type="secondary"
                                style={{
                                    fontSize: '0.74rem',
                                    marginTop: 10,
                                    marginBottom: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                <strong>Benefits include:</strong> cheaper PBS prescriptions, bulk-billed GP visits where available, lower co-payments, plus state-based concessions on utilities, public transport, and council rates.
                                {assessment.lihccExistingHolder && hasConfiguredLihccLimit ? (
                                    <>
                                        <br />
                                        <br />
                                        <strong>Renewal status:</strong>{' '}
                                        {lihccEligible
                                            ? `The threshold includes the 25% existing-holder uplift (${formatCurrency(baseLimit8wk)} × 1.25 = ${formatCurrency(eightWeekIncomeLimit)} over 8 weeks).`
                                            : `Even with the 25% holder uplift, income is over the renewal threshold. The card may not be renewed at the next review unless income falls. Consider whether the Commonwealth Seniors Health Card applies (separate test for self-funded retirees 67+).`}
                                    </>
                                ) : null}
                            </Paragraph>
                        </Card>
                    </Space>
                </Card>
            ) : (
                <Card bodyStyle={{ padding: '24px' }} style={{ borderRadius: 16, borderColor: '#e8e8e8' }}>
                    {viewMode === 'Graph' ? (
                        <>
                            <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
                                Age Pension Entitlement Assessment
                            </Title>

                            <div style={{ width: '100%', height: 360 }}>
                                <ResponsiveContainer>
                                    <BarChart data={assessment.graphData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="person" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `$${val / 1000}K`} />
                                        <Tooltip formatter={(val) => [formatCurrency(Number(val)), '']} />

                                        {seriesVisibility.actualPension && (
                                            <Bar dataKey="actualPension" name="Current Entitlement" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
                                        )}
                                        {seriesVisibility.maxPension && (
                                            <Bar dataKey="maxPension" name="Maximum Pension" fill="#1e293b" radius={[3, 3, 0, 0]} maxBarSize={24} />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                                <Button
                                    size="small"
                                    onClick={() => toggleSeries('actualPension')}
                                    style={{ borderRadius: 16, borderColor: '#22c55e', color: seriesVisibility.actualPension ? '#16a34a' : '#94a3b8' }}
                                >
                                    ● Current Entitlement
                                </Button>

                                <Button
                                    size="small"
                                    onClick={() => toggleSeries('maxPension')}
                                    style={{ borderRadius: 16, borderColor: '#1e293b', color: seriesVisibility.maxPension ? '#0f172a' : '#94a3b8' }}
                                >
                                    ● Maximum Pension
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Title level={5} style={{ color: '#16a34a', letterSpacing: '0.5px', marginBottom: 16, textTransform: 'uppercase', fontSize: 12 }}>
                                MEANS TEST BREAKDOWN
                            </Title>

                            {/* Means Test Toggle */}
                            <div style={{ marginBottom: 20 }}>
                                <Segmented
                                    value={meansTestTab}
                                    onChange={setMeansTestTab}
                                    options={[
                                        { label: 'Assets Test', value: 'Assets Test', icon: '🏝️' },
                                        { label: 'Income Test', value: 'Income Test', icon: '💰' },
                                    ]}
                                    style={{ backgroundColor: '#f0f0f0', borderRadius: 8 }}
                                />
                            </div>

                            {/* Table Breakdown Container */}
                            <DynamicDataTable
                                columns={columns}
                                data={currentTableData}
                                headerFontSize={13}
                                bodyFontSize={13}
                                showCount={false}
                                size="middle"
                                tableProps={{
                                    pagination: false,
                                    scroll: { x: 'max-content' },
                                }}
                                tableStyle={{ borderRadius: 12 }}
                            />
                        </>
                    )}

                    <div style={{ marginTop: 20, textAlign: 'left' }}>
                        <Text type="secondary" style={{ fontSize: 11, letterSpacing: '0.5px' }}>
                            CALCULATED · ANNUAL VALUES IN AUD · FY 2025–26 RATES · CLIENT {clientAge} · PARTNER {partnerAge || '—'}
                        </Text>
                    </div>
                </Card>
            )}


            {/* Edit Modal Context */}
            <AppModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                width={'70vw'}
                title={renderTitleBlock({
                    title: 'Age Pension Assessment Inputs',
                    icon: '🏛️',
                })}
            >
                <ReviewAgePensionAssessmentForm
                    modalData={{ closeModal: () => setOpenModal(false) }}
                />
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

export default ReviewAgePensionAssessment;