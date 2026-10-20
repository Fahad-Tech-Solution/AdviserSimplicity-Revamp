const DEFAULT_TAX_RATES = {
    brackets: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18201, max: 45000, rate: 0.16 },
        { min: 45001, max: 135000, rate: 0.3 },
        { min: 135001, max: 190000, rate: 0.37 },
        { min: 190001, max: Infinity, rate: 0.45 },
    ],
    medicareThreshLow: 23365,
    medicareThreshFull: 29206,
    medicareReducedRate: 0.1,
    medicareFullRate: 0.02,
    litoMax: 700,
    litoFullThresh: 37500,
    litoBand1End: 45000,
    litoBand1Rate: 0.05,
    litoTaperEnd: 66667,
    litoBand2Rate: 0.015,
    saptoSingleMax: 2230,
    saptoSingleLower: 32279,
    saptoSingleUpper: 50119,
    saptoCoupleMax: 1602,
    saptoCoupleLower: 28974,
    saptoCoupleUpper: 41790,
    saptoTaperRate: 0.125,
};

function toTaxNumber(value, fallback = 0) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    const raw = String(value ?? "").trim();
    if (!raw) return fallback;
    const isParenthesized = raw.startsWith("(") && raw.endsWith(")");
    const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(parsed)) return fallback;
    return isParenthesized ? -Math.abs(parsed) : parsed;
}

function toTaxRate(value, fallback) {
    const parsed = toTaxNumber(value, fallback);
    return Math.abs(parsed) > 1 ? parsed / 100 : parsed;
}

function resolveTaxRates(schema) {
    const defaults = DEFAULT_TAX_RATES;
    const brackets = Array.isArray(schema?.incomeTaxBrackets) && schema.incomeTaxBrackets.length
        ? schema.incomeTaxBrackets
            .map((bracket) => ({
                min: toTaxNumber(bracket?.min),
                max:
                    bracket?.max === "∞" ||
                    bracket?.max === null ||
                    bracket?.max === undefined ||
                    bracket?.max === ""
                        ? Infinity
                        : toTaxNumber(bracket.max, Infinity),
                rate: toTaxRate(bracket?.rate, 0),
            }))
            .sort((first, second) => first.min - second.min)
        : defaults.brackets;
    const medicare = schema?.medicareLevy || {};
    const lito = schema?.lowIncomeTaxOffset || {};
    const saptoSingle = schema?.saptoSingle || {};
    const saptoCouple = schema?.saptoCouple || {};

    const numberOrDefault = (value, fallback) =>
        value === "" || value === null || value === undefined
            ? fallback
            : toTaxNumber(value, fallback);
    const rateOrDefault = (value, fallback) =>
        value === "" || value === null || value === undefined
            ? fallback
            : toTaxRate(value, fallback);

    return {
        brackets,
        medicareThreshLow: numberOrDefault(medicare.exemptBelow, defaults.medicareThreshLow),
        medicareThreshFull: numberOrDefault(medicare.fullRateAbove, defaults.medicareThreshFull),
        medicareReducedRate: rateOrDefault(medicare.shadeInRate, defaults.medicareReducedRate),
        medicareFullRate: rateOrDefault(medicare.fullRate, defaults.medicareFullRate),
        litoMax: numberOrDefault(lito.maxOffset, defaults.litoMax),
        litoFullThresh: numberOrDefault(lito.fullAtOrBelow, defaults.litoFullThresh),
        litoBand1End: numberOrDefault(lito.band1EndsAt, defaults.litoBand1End),
        litoBand1Rate: rateOrDefault(lito.band1Taper, defaults.litoBand1Rate),
        litoTaperEnd: numberOrDefault(lito.phasesOutAt, defaults.litoTaperEnd),
        litoBand2Rate: rateOrDefault(lito.band2Taper, defaults.litoBand2Rate),
        saptoSingleMax: numberOrDefault(saptoSingle.maxOffset, defaults.saptoSingleMax),
        saptoSingleLower: numberOrDefault(saptoSingle.fullBelow, defaults.saptoSingleLower),
        saptoSingleUpper: numberOrDefault(saptoSingle.nilAbove, defaults.saptoSingleUpper),
        saptoCoupleMax: numberOrDefault(saptoCouple.maxOffset, defaults.saptoCoupleMax),
        saptoCoupleLower: numberOrDefault(saptoCouple.fullBelow, defaults.saptoCoupleLower),
        saptoCoupleUpper: numberOrDefault(saptoCouple.nilAbove, defaults.saptoCoupleUpper),
        saptoTaperRate: rateOrDefault(saptoCouple.taperRate, defaults.saptoTaperRate),
    };
}

function calculateBaseTax(taxable, rates) {
    if (taxable <= 0) return 0;

    let tax = 0;
    for (const bracket of rates.brackets) {
        if (taxable < bracket.min) break;
        const lower = Math.max(0, bracket.min - 1);
        const taxableInBracket = Math.min(taxable, bracket.max) - lower;
        if (taxableInBracket > 0) tax += taxableInBracket * bracket.rate;
        if (taxable <= bracket.max) break;
    }
    return tax;
}

function calculateLito(taxable, rates) {
    if (taxable <= rates.litoFullThresh) return rates.litoMax;
    if (taxable <= rates.litoBand1End) {
        return Math.max(0, rates.litoMax - (taxable - rates.litoFullThresh) * rates.litoBand1Rate);
    }

    const bandTwoStart =
        rates.litoMax -
        (rates.litoBand1End - rates.litoFullThresh) * rates.litoBand1Rate;
    if (taxable <= rates.litoTaperEnd) {
        return Math.max(0, bandTwoStart - (taxable - rates.litoBand1End) * rates.litoBand2Rate);
    }
    return 0;
}

function calculateMedicare(taxable, rates) {
    if (taxable <= rates.medicareThreshLow) return 0;
    if (taxable <= rates.medicareThreshFull) {
        return (taxable - rates.medicareThreshLow) * rates.medicareReducedRate;
    }
    return taxable * rates.medicareFullRate;
}

function calculateSapto(taxable, saptoType, rates) {
    if (saptoType === "no") return 0;

    const sapto = saptoType === "single"
        ? { max: rates.saptoSingleMax, lower: rates.saptoSingleLower, upper: rates.saptoSingleUpper }
        : { max: rates.saptoCoupleMax, lower: rates.saptoCoupleLower, upper: rates.saptoCoupleUpper };
    if (taxable >= sapto.upper) return 0;
    if (taxable <= sapto.lower) return sapto.max;
    return Math.max(0, sapto.max - (taxable - sapto.lower) * rates.saptoTaperRate);
}

function calculateScenario(incomeInput = {}, deductionInput = {}, saptoType, rates) {
    const incomeBreakdown = {
        salary: toTaxNumber(incomeInput.salary),
        biz: toTaxNumber(incomeInput.business),
        centrelink: toTaxNumber(incomeInput.centrelink),
        rental: toTaxNumber(incomeInput.rental),
        interest: toTaxNumber(incomeInput.interest),
        div: toTaxNumber(incomeInput.dividends),
        other: toTaxNumber(incomeInput.otherInc),
        cgt: toTaxNumber(incomeInput.cgt),
        frank: toTaxNumber(incomeInput.franking),
    };
    const deductionBreakdown = {
        ss: toTaxNumber(deductionInput.salarySacrifice),
        rentExp: toTaxNumber(deductionInput.rentalExp),
        otherExp: toTaxNumber(deductionInput.otherExp),
        payg: toTaxNumber(deductionInput.paygPaid),
    };
    const inputs = [...Object.values(incomeBreakdown), ...Object.values(deductionBreakdown)];
    if (!inputs.some((value) => value !== 0)) return null;

    const totalIncome =
        incomeBreakdown.salary +
        incomeBreakdown.biz +
        incomeBreakdown.centrelink +
        incomeBreakdown.rental +
        incomeBreakdown.interest +
        incomeBreakdown.div +
        incomeBreakdown.other +
        incomeBreakdown.cgt;
    const assessable = totalIncome + incomeBreakdown.frank;
    const totalDeductions =
        deductionBreakdown.ss + deductionBreakdown.rentExp + deductionBreakdown.otherExp;
    const taxable = Math.max(0, assessable - totalDeductions);
    const baseTax = calculateBaseTax(taxable, rates);
    const medicare = calculateMedicare(taxable, rates);
    const lito = calculateLito(taxable, rates);
    const sapto = calculateSapto(taxable, saptoType, rates);
    const taxBasicPayable = baseTax + medicare;
    const taxBeforeCredits = Math.max(0, taxBasicPayable - lito - sapto);
    const totalTax = taxBeforeCredits - incomeBreakdown.frank;
    const superTax = deductionBreakdown.ss * 0.15;
    const totalTaxIncSuper = totalTax + superTax;
    const netPayable = totalTaxIncSuper - deductionBreakdown.payg;

    return {
        incomeBreakdown,
        deductionBreakdown,
        totalIncome,
        assessable,
        totalDeductions,
        taxable,
        baseTax,
        medicare,
        taxBasicPayable,
        lito,
        sapto,
        taxBeforeCredits,
        totalTax,
        superTax,
        totalTaxIncSuper,
        netPayable,
    };
}

export function calculateTaxPlanningProfile(profile, taxRatesSchema) {
    const rates = resolveTaxRates(taxRatesSchema);
    const saptoValue = String(profile?.applySAPTO ?? "No").toLowerCase();
    const saptoType = saptoValue.includes("single")
        ? "single"
        : saptoValue.includes("couple")
            ? "couple"
            : "no";

    const current = calculateScenario(
        profile?.incomeSources?.current,
        profile?.deductions?.current,
        saptoType,
        rates,
    );
    const proposed = calculateScenario(
        profile?.incomeSources?.proposed,
        profile?.deductions?.proposed,
        saptoType,
        rates,
    );

    return {
        current,
        proposed,
        tableRows: current && proposed ? buildTaxComparisonRows(current, proposed) : [],
    };
}

function buildTaxComparisonRows(current, proposed) {
    const rows = [];
    const section = (label) => rows.push({ key: `section-${rows.length}`, type: "section", label });
    const row = (label, currentValue, proposedValue, benefitSign = 0, type = "row") =>
        rows.push({
            key: `row-${rows.length}`,
            type,
            label,
            currentValue,
            proposedValue,
            benefitSign,
        });

    section("Income");
    row("Salary", current.incomeBreakdown.salary, proposed.incomeBreakdown.salary);
    row("Net Business Income", current.incomeBreakdown.biz, proposed.incomeBreakdown.biz);
    row("Centrelink", current.incomeBreakdown.centrelink, proposed.incomeBreakdown.centrelink);
    row("Rental Income", current.incomeBreakdown.rental, proposed.incomeBreakdown.rental);
    row("Interest", current.incomeBreakdown.interest, proposed.incomeBreakdown.interest);
    row("Dividends / Distributions", current.incomeBreakdown.div, proposed.incomeBreakdown.div);
    row("Other Taxable Income", current.incomeBreakdown.other, proposed.incomeBreakdown.other);
    row("Capital Gains", current.incomeBreakdown.cgt, proposed.incomeBreakdown.cgt);
    row("Total Income Received", current.totalIncome, proposed.totalIncome);
    row("Franking Credits", current.incomeBreakdown.frank, proposed.incomeBreakdown.frank);
    row("Total Assessable Income", current.assessable, proposed.assessable, 0, "total");

    section("Deductions");
    row("Salary Sacrifice / Concessional", current.deductionBreakdown.ss, proposed.deductionBreakdown.ss, 1);
    row("Rental Property Expenses", current.deductionBreakdown.rentExp, proposed.deductionBreakdown.rentExp, 1);
    row("Other Deductible Expenses", current.deductionBreakdown.otherExp, proposed.deductionBreakdown.otherExp, 1);
    row("Total Deductions", current.totalDeductions, proposed.totalDeductions, 1, "total");

    section("Tax Calculation");
    row("Total Taxable Income", current.taxable, proposed.taxable);
    row("Basic Tax", current.baseTax, proposed.baseTax);
    row("Medicare Levy", current.medicare, proposed.medicare);
    row("Tax Basic Payable", current.taxBasicPayable, proposed.taxBasicPayable);
    row("Less: Low Income Rebate", current.lito, proposed.lito, 1);
    row("SAPTO", current.sapto, proposed.sapto, 1);
    row("Tax Payable Before Credits", current.taxBeforeCredits, proposed.taxBeforeCredits);
    row("Less: Franking Credits", current.incomeBreakdown.frank, proposed.incomeBreakdown.frank, 1);
    row("Personal Tax Payable / (Refund)", current.totalTax, proposed.totalTax);
    row("Less: PAYG Tax Already Paid", current.deductionBreakdown.payg, proposed.deductionBreakdown.payg, 1);
    row(
        "Net Personal Tax Payable",
        current.totalTax - current.deductionBreakdown.payg,
        proposed.totalTax - proposed.deductionBreakdown.payg,
    );
    row("Tax on Super Contribution (15%)", current.superTax, proposed.superTax);
    row("Total Tax Payable / (Refund)", current.netPayable, proposed.netPayable, -1, "grand");
    return rows;
}
