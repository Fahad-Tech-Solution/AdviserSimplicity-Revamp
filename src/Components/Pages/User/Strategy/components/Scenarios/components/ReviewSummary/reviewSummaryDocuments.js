import { calculateInsuranceNeeds, getAgeFromDob } from "../InsuranceNeeds/insuranceNeedsCalculations.js";
import { calculateLoanResults } from "../LoanSimulator/LoanSimulator.jsx";
import { calculateTaxPlanningProfile } from "../ReviewsTaxPlanning/taxPlanningCalculations.js";
import { calculateProjections } from "../ScenariosSuperProjection.jsx";
import { calculateAgePensionAssessment } from "../ReviewAgePensionAssessment/ReviewAgePensionAssessment.jsx";

const REVIEW_QUESTION_LABELS = {
    income: "Has income changed?",
    employment: "Has employment changed?",
    health: "Has health changed?",
    dependants: "Have dependants changed?",
    goals: "Have goals or objectives changed?",
    incomeNeed: "Do you need more income from investments?",
    happyWithInvestments: "Are you happy with your current investments?",
    insurance: "Has insurance changed?",
    address: "Has your address changed?",
    inheritance: "Are you expecting an inheritance?",
    lifestyleSpending: "Do you expect major lifestyle spending?",
    homeLoan: "Do you still have a home loan?",
    extraSuper: "Do you wish to contribute more to super?",
};

const MONEY_FORMATTER = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
});

function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const negative = raw.startsWith("(") && raw.endsWith(")");
    const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : 0;
}

function formatMoney(value) {
    return MONEY_FORMATTER.format(Number(value) || 0);
}

function hasNumericData(value) {
    if (!value || typeof value !== "object") return false;
    return Object.values(value).some((item) => {
        if (item && typeof item === "object") return hasNumericData(item);
        return toNumber(item) !== 0;
    });
}

function getPersonName(reviewData, selectedClient, role) {
    const details = reviewData?.personalDetails?.[role] || {};
    const clientRecord = selectedClient?.[role] || {};
    const name = details.preferredName ||
        details.name ||
        (role === "client"
            ? clientRecord.clientPreferredName || clientRecord.clientName || clientRecord.name
            : clientRecord.partnerPreferredName || clientRecord.partnerName || clientRecord.name);
    return String(name || (role === "client" ? "Client" : "Partner")).trim();
}

function getReviewQuestions(reviewData) {
    const answers = reviewData?.whatChanges || {};
    return Object.entries(REVIEW_QUESTION_LABELS)
        .filter(([key]) => answers[key] !== undefined && answers[key] !== "")
        .map(([key, question]) => ({
            question,
            answer: String(answers[key]),
            notes: String(answers[`${key}_notes`] || ""),
        }));
}

function buildInsuranceResults(reviewData, selectedClient, taxRatesSchema, people) {
    const section =
        reviewData?.insuranceNeedsDetails ||
        (reviewData?.insuranceNeeds && typeof reviewData.insuranceNeeds === "object"
            ? reviewData.insuranceNeeds
            : {});
    const mortgageAmount = reviewData?.loanSimulatorDetails?.loanSetup?.homeLoanTotal;

    return people.flatMap((person) => {
        const profile = section?.[person.key];
        if (!profile || !hasNumericData(profile)) return [];
        const age = getAgeFromDob(
            reviewData?.personalDetails?.[person.key]?.DOB ||
                selectedClient?.[person.key]?.DOB ||
                selectedClient?.[person.key]?.dob,
        );
        const calculated = calculateInsuranceNeeds(
            profile,
            age,
            taxRatesSchema,
            { mortgageAmount },
        );
        return [{
            person: person.name,
            calculationRows: calculated.detailedRows.map((row) => ({
                label: row.label,
                value: ["life", "tpd", "trauma"]
                    .filter((type) => row[type] !== "" && row[type] !== undefined)
                    .map((type) => {
                        const amount = row[type];
                        const formatted = Number.isFinite(Number(amount))
                            ? formatMoney(amount)
                            : String(amount);
                        return `${type.toUpperCase()}: ${formatted}`;
                    })
                    .join(" · ") || "—",
            })),
            cover: ["life", "tpd", "trauma"].map((key) => ({
                type: key.toUpperCase() === "TPD" ? "TPD" : key[0].toUpperCase() + key.slice(1),
                existing: calculated.existingByType[key],
                required: Math.max(0, calculated.coverRequiredByType[key]),
                gap: Math.max(0, calculated.coverRequiredByType[key]) - calculated.existingByType[key],
            })),
            ip: {
                existing: calculated.ip.existingMonthly,
                required: calculated.ip.monthlyBenefit + calculated.ip.monthlySuper,
                gap: calculated.ip.shortfall,
            },
        }];
    });
}

function buildSummarySections(reviewData, selectedClient, taxRatesSchema, people) {
    const sections = [];
    const personal = reviewData?.personalDetails || {};
    const clientDetails = people.map(({ key, name }) => {
        const person = personal[key] || {};
        const personalRows = Object.entries(person)
            .filter(([field, value]) =>
                !field.startsWith("_") &&
                !["preferredName", "firstName", "lastName", "fullName", "name"].includes(field) &&
                !/(createdAt|updatedAt)$/i.test(field) &&
                ["string", "number", "boolean"].includes(typeof value) &&
                String(value).trim() !== "",
            )
            .map(([field, value]) => ({
                label: `${name} — ${field === "DOB" ? "Date of birth" : field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}`,
                value: field === "DOB" && !Number.isNaN(new Date(value).getTime())
                    ? new Date(value).toLocaleDateString("en-AU")
                    : String(value),
            }));
        return [{ label: "Review participant", value: name }, ...personalRows];
    });
    if (clientDetails.length) {
        sections.push({ title: "Client Details", rows: clientDetails.flat() });
    }

    const superData = reviewData?.superannuationDetails || {};
    const superRows = people.flatMap(({ key, name }) => {
        const profile = superData[key];
        if (!profile || !hasNumericData(profile)) return [];
        const projection = calculateProjections(
            profile,
            getAgeFromDob(personal?.[key]?.DOB || selectedClient?.[key]?.DOB),
        );
        const finalRow = projection.chart.at(-1);
        if (!finalRow) return [];
        return [
            { label: `${name} — current super balance`, value: formatMoney(toNumber(profile.superAnnuationTotal)) },
            { label: `${name} — annual income`, value: formatMoney(toNumber(profile.incomeFromBusinessTotal)) },
            { label: `${name} — salary sacrifice`, value: formatMoney(toNumber(profile.ssPersonalConcessional)) },
            { label: `${name} — projected years`, value: String(projection.chart.length) },
            { label: `${name} — assumed investment return`, value: `${toNumber(profile.investmentReturn) || 5}% p.a.` },
            { label: `${name} — projected balance`, value: formatMoney(finalRow.withStrategy) },
            { label: `${name} — without additional strategy`, value: formatMoney(finalRow.minimumSG) },
            { label: `${name} — strategy difference`, value: formatMoney(finalRow.withStrategy - finalRow.minimumSG) },
        ];
    });
    if (superRows.length) sections.push({ title: "Superannuation Projection", rows: superRows });

    const loan = calculateLoanResults(reviewData?.loanSimulatorDetails);
    if (loan) {
        const setup = reviewData.loanSimulatorDetails.loanSetup || {};
        const extras = reviewData.loanSimulatorDetails.extrasAndOffsets || {};
        sections.push({
            title: "Home Loan Strategy",
            rows: [
                { label: "Current loan balance", value: formatMoney(toNumber(setup.homeLoanTotal)) },
                { label: "Interest rate", value: `${toNumber(setup.interestRate)}% p.a.` },
                { label: "Loan term", value: `${toNumber(setup.termYears)} years` },
                { label: "Repayment frequency", value: loan.frequencyLabel },
                { label: "Additional repayments and surplus cash", value: formatMoney(toNumber(extras.extraRepayments) + toNumber(extras.surplusCash)) },
                { label: "Offset balance", value: formatMoney(toNumber(extras.offsetAccountBalance)) },
                { label: "Interest saved", value: formatMoney(loan.interestSaved) },
                { label: "Term saved", value: `${loan.termSaved} years` },
            ],
        });
    }

    const retirement = reviewData?.retirementAdequacyDetails || {};
    const retirementRows = people.flatMap(({ key, name }) => {
        const person = retirement[key];
        if (!person || !hasNumericData(person)) return [];
        return [
            { label: `${name} — account-based pension balance`, value: formatMoney(toNumber(person.accountBasedPensionTotal)) },
            { label: `${name} — non-concessional top-up`, value: formatMoney(toNumber(person.nccTopUp)) },
            { label: `${name} — top-up timing`, value: String(person.nccTopUpYear || "—") },
            { label: `${name} — annual pension withdrawal`, value: formatMoney(toNumber(person.withdrawalAmount)) },
            { label: `${name} — investment return`, value: `${toNumber(person.investmentReturn)}% p.a.` },
            { label: `${name} — risk profile`, value: String(person.riskGoal || "—") },
        ];
    });
    if (retirementRows.length) {
        sections.push({
            title: "Retirement Adequacy",
            rows: [
                { label: "Pension start date", value: retirement.pensionStartDate ? new Date(retirement.pensionStartDate).toLocaleDateString("en-AU") : "—" },
                { label: "Include Age Pension projection", value: String(retirement.includeAgePension || "—") },
                ...retirementRows,
            ],
        });
    }

    const agePensionData = reviewData?.agePensionAssessmentDetails || reviewData?.agePensionDetails;
    if (agePensionData && hasNumericData(agePensionData)) {
        const assessment = calculateAgePensionAssessment(agePensionData);
        sections.push({
            title: "Age Pension Assessment",
            rows: [
                { label: "Assessment result", value: assessment.status },
                { label: "Combined annual pension", value: formatMoney(assessment.combinedPension) },
                { label: "Fortnightly pension", value: formatMoney(assessment.combinedPension / 26) },
                { label: "Maximum annual pension", value: formatMoney(assessment.maxPension) },
                { label: "Pension reduction", value: formatMoney(assessment.pensionLost) },
                { label: "Assessable assets", value: formatMoney(assessment.totalAssets) },
                { label: "Assessable income", value: formatMoney(assessment.totalAssessableIncome) },
                { label: "Determining test", value: assessment.determiningTest || "—" },
            ],
        });
    }

    const insurance = buildInsuranceResults(reviewData, selectedClient, taxRatesSchema, people);
    insurance.forEach((insurancePerson) => {
        sections.push({
            title: `Insurance Needs — ${insurancePerson.person}`,
            rows: [
                ...(Array.isArray(insurancePerson.calculationRows)
                    ? insurancePerson.calculationRows
                    : []),
                ...insurancePerson.cover.map(({ type, existing, required, gap }) => ({
                    label: `${type} — existing / required / shortfall`,
                    value: `${formatMoney(existing)} / ${formatMoney(required)} / ${formatMoney(gap)}`,
                })),
                {
                    label: "Income protection — existing / required / shortfall (monthly)",
                    value: `${formatMoney(insurancePerson.ip.existing)} / ${formatMoney(insurancePerson.ip.required)} / ${formatMoney(insurancePerson.ip.gap)}`,
                },
            ],
        });
    });

    const taxData = reviewData?.taxPlanningDetails || {};
    const taxRows = people.flatMap(({ key, name }) => {
        const profile = taxData[key];
        if (!profile || !hasNumericData(profile)) return [];
        const calculation = calculateTaxPlanningProfile(profile, taxRatesSchema);
        if (!calculation.current || !calculation.proposed) return [];
        return [
            ...calculation.tableRows
                .filter((row) => row.type !== "section")
                .map((row) => ({
                    label: `${name} — ${row.label}`,
                    value: `Current: ${formatMoney(row.currentValue)} · Proposed: ${formatMoney(row.proposedValue)} · Difference: ${formatMoney(toNumber(row.currentValue) - toNumber(row.proposedValue))}`,
                })),
        ];
    });
    if (taxRows.length) sections.push({ title: "Tax Planning", rows: taxRows });

    const questions = getReviewQuestions(reviewData);
    if (questions.length) {
        sections.push({
            title: "Annual Review Questions",
            rows: questions.map(({ question, answer, notes }) => ({
                label: question,
                value: notes ? `${answer} — ${notes}` : answer,
            })),
        });
    }
    return { sections, insurance, loan, questions };
}

export function buildReviewSummaryData(reviewData = {}, selectedClient = {}, taxRatesSchema) {
    const ownerValues = reviewData?.personalDetails?.owner;
    const hasPartner = String(ownerValues ?? "").toLowerCase().includes("partner");
    const people = [
        { key: "client", name: getPersonName(reviewData, selectedClient, "client") },
        ...(hasPartner
            ? [{ key: "partner", name: getPersonName(reviewData, selectedClient, "partner") }]
            : []),
    ];
    const { sections, insurance, loan, questions } = buildSummarySections(
        reviewData,
        selectedClient,
        taxRatesSchema,
        people,
    );
    const totalInsuranceShortfall = insurance.reduce(
        (total, person) => total + person.cover.reduce(
            (coverTotal, cover) => coverTotal + Math.max(0, cover.gap),
            0,
        ),
        0,
    );
    const superProjection = sections.find((section) => section.title === "Superannuation Projection");
    const superStrategyDifference = superProjection?.rows
        ?.filter((row) => row.label.endsWith("strategy difference"))
        .reduce((total, row) => total + toNumber(row.value), 0);
    const pensionSection = sections.find((section) => section.title === "Age Pension Assessment");
    const clientName = people[0].name;
    const partnerName = people[1]?.name || "";
    const dateValue =
        reviewData?.scenario?.reviewDate ||
        reviewData?.scenario?.meetingDate ||
        reviewData?.scenario?.createdAt ||
        new Date().toISOString();
    const date = new Date(dateValue);

    return {
        clientName,
        partnerName,
        householdName: partnerName ? `${clientName} & ${partnerName}` : clientName,
        date: Number.isNaN(date.getTime())
            ? new Date().toLocaleDateString("en-AU")
            : date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
        people,
        sections,
        insurance,
        loan,
        questions,
        highlights: [
            ...(loan ? [{ label: "Interest saved", value: formatMoney(loan.interestSaved) }] : []),
            ...(superProjection?.rows?.length
                ? [{ label: "Super strategy difference", value: formatMoney(superStrategyDifference) }]
                : []),
            ...(pensionSection
                ? [{ label: "Annual Age Pension", value: pensionSection.rows[1]?.value || "—" }]
                : []),
            ...(insurance.length
                ? [{ label: "Life, TPD & trauma shortfall", value: formatMoney(totalInsuranceShortfall) }]
                : []),
        ].slice(0, 4),
        nextSteps: [
            ...(String(reviewData?.whatChanges?.extraSuper || "").toLowerCase() === "yes"
                ? ["Review additional super contributions."]
                : []),
            ...(String(reviewData?.whatChanges?.insurance || "").toLowerCase() === "yes" || insurance.length
                ? ["Review insurance recommendations and cover gaps."]
                : []),
            ...(pensionSection ? ["Review Age Pension eligibility and means-test outcomes."] : []),
            ...(loan ? ["Discuss the home loan strategy with the lender."] : []),
            "Prepare and issue the Record of Advice for client review and signature.",
        ].slice(0, 5),
    };
}

export { formatMoney };
