const COVER_TYPES = [
    { key: "life", label: "Life" },
    { key: "tpd", label: "TPD" },
    { key: "trauma", label: "Trauma" },
];

const LUMP_SUM_FIELDS = [
    ["homeMortgage", "Home mortgage"],
    ["investmentLoans", "Investment loans"],
    ["personalLoans", "Personal loans"],
    ["creditCards", "Credit cards"],
    ["funeral", "Funeral"],
    ["medical", "Medical"],
    ["emergencyFunds", "Emergency funds"],
    ["capitalNeeds", "Capital needs"],
    ["other", "Other"],
];

const ASSET_FIELDS = [
    ["superannuation", "Superannuation"],
    ["cash", "Cash"],
    ["investmentProperties", "Investment properties (equity)"],
    ["sharePortfolio", "Share portfolio / managed funds"],
    ["otherRealisableAssets", "Other realisable assets"],
];

const DEFAULT_TAX_RATES = {
    brackets: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18201, max: 45000, rate: 0.16 },
        { min: 45001, max: 135000, rate: 0.3 },
        { min: 135001, max: 190000, rate: 0.37 },
        { min: 190001, max: Infinity, rate: 0.45 },
    ],
    medicareLow: 23365,
    medicareFull: 29206,
    medicareReducedRate: 0.1,
    medicareFullRate: 0.02,
    litoMax: 700,
    litoFullThreshold: 37500,
    litoBandOneEnd: 45000,
    litoBandOneRate: 0.05,
    litoTaperEnd: 66667,
    litoBandTwoRate: 0.015,
};

export function toInsuranceNumber(value) {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function resolveTaxRates(schema) {
    const defaults = DEFAULT_TAX_RATES;
    const sourceBrackets = schema?.incomeTaxBrackets;
    const brackets = Array.isArray(sourceBrackets) && sourceBrackets.length
        ? sourceBrackets
            .map((bracket) => ({
                min: toInsuranceNumber(bracket?.min),
                max:
                    bracket?.max === "∞" ||
                    bracket?.max === null ||
                    bracket?.max === undefined
                        ? Infinity
                        : toInsuranceNumber(bracket.max),
                rate: toInsuranceNumber(bracket?.rate),
            }))
            .sort((first, second) => first.min - second.min)
        : defaults.brackets;
    const medicare = schema?.medicareLevy || {};
    const lito = schema?.lowIncomeTaxOffset || {};
    const rateOrDefault = (value, fallback) =>
        value === "" || value === null || value === undefined
            ? fallback
            : toInsuranceNumber(value);

    return {
        brackets,
        medicareLow: rateOrDefault(medicare.exemptBelow, defaults.medicareLow),
        medicareFull: rateOrDefault(medicare.fullRateAbove, defaults.medicareFull),
        medicareReducedRate: rateOrDefault(
            medicare.shadeInRate,
            defaults.medicareReducedRate,
        ),
        medicareFullRate: rateOrDefault(
            medicare.fullRate,
            defaults.medicareFullRate,
        ),
        litoMax: rateOrDefault(lito.maxOffset, defaults.litoMax),
        litoFullThreshold: rateOrDefault(
            lito.fullAtOrBelow,
            defaults.litoFullThreshold,
        ),
        litoBandOneEnd: rateOrDefault(
            lito.band1EndsAt,
            defaults.litoBandOneEnd,
        ),
        litoBandOneRate: rateOrDefault(
            lito.band1Taper,
            defaults.litoBandOneRate,
        ),
        litoTaperEnd: rateOrDefault(
            lito.phasesOutAt,
            defaults.litoTaperEnd,
        ),
        litoBandTwoRate: rateOrDefault(
            lito.band2Taper,
            defaults.litoBandTwoRate,
        ),
    };
}

export function formatInsuranceMoney(value, suffix = "") {
    const rounded = Math.round(Number(value) || 0);
    return `${rounded < 0 ? "-$" : "$"}${Math.abs(rounded).toLocaleString("en-AU")}${suffix}`;
}

export function getAgeFromDob(dob) {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
    ) {
        age -= 1;
    }
    return age > 0 && age < 110 ? age : 0;
}

function estimateNetFromGross(grossIncome, taxRatesSchema) {
    const gross = Math.max(0, toInsuranceNumber(grossIncome));
    if (!gross) return { net: 0, tax: 0, effectiveRate: 0 };

    const rates = resolveTaxRates(taxRatesSchema);
    let incomeTax = 0;
    for (const bracket of rates.brackets) {
        if (gross < bracket.min) break;
        const lower = Math.max(0, bracket.min - 1);
        const taxableAtRate = Math.min(gross, bracket.max) - lower;
        if (taxableAtRate > 0) incomeTax += taxableAtRate * bracket.rate;
        if (gross <= bracket.max) break;
    }

    const medicare = gross <= rates.medicareLow
        ? 0
        : gross <= rates.medicareFull
            ? (gross - rates.medicareLow) * rates.medicareReducedRate
            : gross * rates.medicareFullRate;
    const bandTwoStart =
        rates.litoMax -
        (rates.litoBandOneEnd - rates.litoFullThreshold) *
            rates.litoBandOneRate;
    const lito = gross <= rates.litoFullThreshold
        ? rates.litoMax
        : gross <= rates.litoBandOneEnd
            ? Math.max(
                0,
                rates.litoMax -
                    (gross - rates.litoFullThreshold) * rates.litoBandOneRate,
            )
            : gross <= rates.litoTaperEnd
                ? Math.max(
                    0,
                    bandTwoStart -
                        (gross - rates.litoBandOneEnd) * rates.litoBandTwoRate,
                )
                : 0;
    const tax = Math.max(0, incomeTax + medicare - lito);
    return {
        net: Math.max(0, Math.round(gross - tax)),
        tax: Math.round(tax),
        effectiveRate: tax / gross,
    };
}

function presentValueOfAnnuityDue(rate, years, payment) {
    if (years <= 0 || payment <= 0) return 0;
    if (Math.abs(rate) < 1e-10) return payment * years;
    return payment * ((1 - Math.pow(1 + rate, -years)) / rate) * (1 + rate);
}

function calculatePersonAgeBasedYears(age) {
    return age > 0
        ? { life: Math.max(0, 65 - age), tpd: Math.max(0, 65 - age - 5), trauma: 2 }
        : { life: 0, tpd: 0, trauma: 2 };
}

export function calculateInsuranceNeeds(profile = {}, age = 0, taxRatesSchema) {
    const assumptions = profile.assumptions || {};
    const income = profile.incomeReplacement || {};
    const existing = profile.existingCover || {};
    const ipDetails = profile.incomeProtectionDetails || {};
    const realisableAssets = profile.realisableAssets || {};
    const grossIncome = toInsuranceNumber(income.grossIncome);
    const netEstimate = estimateNetFromGross(grossIncome, taxRatesSchema);
    const investmentReturn = (
        assumptions.investmentReturn === "" ||
        assumptions.investmentReturn === null ||
        assumptions.investmentReturn === undefined
            ? 5
            : toInsuranceNumber(assumptions.investmentReturn)
    ) / 100;
    const inflation = (
        assumptions.inflation === "" ||
        assumptions.inflation === null ||
        assumptions.inflation === undefined
            ? 2.5
            : toInsuranceNumber(assumptions.inflation)
    ) / 100;
    const realReturn = (1 + investmentReturn) / (1 + inflation) - 1;
    const defaultYears = calculatePersonAgeBasedYears(age);

    const lumpSumByType = {};
    const incomeByType = {};
    const yearsByType = {};
    const assetsByType = {};
    const existingByType = {
        life: toInsuranceNumber(existing.lifeCover),
        tpd: toInsuranceNumber(existing.tpdCover),
        trauma: toInsuranceNumber(existing.traumaCover),
    };
    const totalNeedsByType = {};
    const otherAssetsByType = {};
    const coverRequiredByType = {};
    const shortfallByType = {};
    const recommendedByType = {};
    const rows = LUMP_SUM_FIELDS.map(([field, label]) => {
        const row = { label };
        COVER_TYPES.forEach(({ key }) => {
            row[key] = toInsuranceNumber(profile.lumpSumNeeds?.[key]?.[field]);
        });
        return row;
    });

    COVER_TYPES.forEach(({ key }) => {
        lumpSumByType[key] = LUMP_SUM_FIELDS.reduce(
            (total, [field]) =>
                total + toInsuranceNumber(profile.lumpSumNeeds?.[key]?.[field]),
            0,
        );
        const annualNetNeed =
            toInsuranceNumber(income[`${key}Amount`]) || netEstimate.net;
        const years =
            toInsuranceNumber(income[`${key}Years`]) || defaultYears[key];
        incomeByType[key] = presentValueOfAnnuityDue(
            realReturn,
            years,
            annualNetNeed,
        );
        yearsByType[key] = years;
        assetsByType[key] = ASSET_FIELDS.reduce(
            (total, [field]) =>
                total +
                toInsuranceNumber(realisableAssets[key]?.[field]),
            0,
        );
        otherAssetsByType[key] = assetsByType[key];
    });

    const tpdTax = income.taxTpdInSuper
        ? (lumpSumByType.tpd + incomeByType.tpd) * 0.22
        : 0;
    const ongoingByType = {
        life: incomeByType.life,
        tpd: incomeByType.tpd + tpdTax,
        trauma: incomeByType.trauma,
    };
    const coverRows = COVER_TYPES.map(({ key, label }) => {
        totalNeedsByType[key] = lumpSumByType[key] + ongoingByType[key];
        coverRequiredByType[key] = Math.max(
            0,
            totalNeedsByType[key] - otherAssetsByType[key],
        );
        shortfallByType[key] =
            coverRequiredByType[key] - existingByType[key];
        recommendedByType[key] = Math.max(
            0,
            Math.round(shortfallByType[key] / 100000) * 100000,
        );
        return {
            key,
            coverType: label,
            required: coverRequiredByType[key],
            existing: existingByType[key],
            shortfall: shortfallByType[key],
            status:
                shortfallByType[key] > 1000
                    ? "Shortfall"
                    : shortfallByType[key] < -1000
                        ? "Surplus"
                        : "Fully covered",
        };
    });

    recommendedByType.life = Math.max(
        recommendedByType.life,
        recommendedByType.tpd,
    );

    const ipAnnualIncome =
        toInsuranceNumber(ipDetails.annualIncome) || grossIncome;
    const incomePercent =
        ipDetails.percentIncome === "" ||
        ipDetails.percentIncome === null ||
        ipDetails.percentIncome === undefined
            ? 70
            : toInsuranceNumber(ipDetails.percentIncome);
    const superPercent =
        ipDetails.percentSuper === "" ||
        ipDetails.percentSuper === null ||
        ipDetails.percentSuper === undefined
            ? 12
            : toInsuranceNumber(ipDetails.percentSuper);
    const ipAnnualBenefit = ipAnnualIncome * incomePercent / 100;
    const ipAnnualSuper = ipAnnualIncome * superPercent / 100;
    const ipMonthlyBenefit = ipAnnualBenefit / 12;
    const ipMonthlySuper = ipAnnualSuper / 12;
    const existingIpMonthly = toInsuranceNumber(existing.ipMonthlyCover);
    const ipShortfall =
        ipMonthlyBenefit + ipMonthlySuper - existingIpMonthly;
    const ipTaxEstimate = estimateNetFromGross(ipAnnualBenefit, taxRatesSchema);
    const ip = {
        annualIncome: ipAnnualIncome,
        annualBenefit: ipAnnualBenefit,
        annualSuper: ipAnnualSuper,
        monthlyBenefit: ipMonthlyBenefit,
        monthlySuper: ipMonthlySuper,
        existingMonthly: existingIpMonthly,
        shortfall: ipShortfall,
        netMonthlyAfterTax: ipTaxEstimate.net / 12,
        taxAnnual: ipTaxEstimate.tax,
        effectiveTaxRate: ipTaxEstimate.effectiveRate,
    };

    const detailedRows = [
        ...rows,
        { label: "Total lump-sum needs", ...lumpSumByType },
        { label: "Net income required (p.a.)", ...Object.fromEntries(COVER_TYPES.map(({ key }) => [key, toInsuranceNumber(income[`${key}Amount`]) || netEstimate.net])) },
        { label: "Years required", ...yearsByType },
        { label: "Income required (present value)", ...incomeByType },
        { label: "Tax on TPD claim held in super", life: 0, tpd: tpdTax, trauma: 0 },
        { label: "Total ongoing needs", ...ongoingByType },
        { label: "Total needs", ...totalNeedsByType },
        ...ASSET_FIELDS.map(([field, label]) => ({
            label: `Realisable asset: ${label}`,
            ...Object.fromEntries(
                COVER_TYPES.map(({ key }) => [
                    key,
                    toInsuranceNumber(realisableAssets[key]?.[field]),
                ]),
            ),
        })),
        { label: "Total realisable assets", ...assetsByType },
        { label: "Cover required before existing insurance", ...coverRequiredByType },
        { label: "Existing insurance cover", ...existingByType },
        { label: "Shortfall / surplus", ...shortfallByType },
        { label: "Recommended cover (nearest $100,000)", ...recommendedByType },
    ];

    const computedFields = {
        currentNetIncomeAfterTax: formatInsuranceMoney(netEstimate.net),
        incomeBenefitCovered: formatInsuranceMoney(ipMonthlyBenefit, "/mo"),
        ipIncomeBenefitAnnual: formatInsuranceMoney(ipAnnualBenefit),
        superContributionsCover: formatInsuranceMoney(ipMonthlySuper, "/mo"),
        netMonthlyAfterTax: formatInsuranceMoney(ip.netMonthlyAfterTax, "/mo"),
    };

    return {
        realReturn,
        netIncome: netEstimate,
        lumpSumByType,
        incomeByType,
        yearsByType,
        ongoingByType,
        totalNeedsByType,
        assetsByType,
        otherAssetsByType,
        existingByType,
        coverRequiredByType,
        shortfallByType,
        recommendedByType,
        coverRows,
        detailedRows,
        ip,
        computedFields,
    };
}

const premiumAgeRates = (age) => {
    if (age < 30) return { life: 0.06, tpd: 0.08, trauma: 0.1, ip: 0.07 };
    if (age < 40) return { life: 0.09, tpd: 0.12, trauma: 0.14, ip: 0.1 };
    if (age < 50) return { life: 0.15, tpd: 0.18, trauma: 0.18, ip: 0.13 };
    if (age < 60) return { life: 0.19, tpd: 0.22, trauma: 0.22, ip: 0.17 };
    if (age < 65) return { life: 0.21, tpd: 0.25, trauma: 0.25, ip: 0.21 };
    return { life: 0.25, tpd: 0.28, trauma: 0.29, ip: 0 };
};

export function projectInsurancePremiums(profile = {}, age = 0, horizon = "10y") {
    const cover = profile.existingCover || {};
    const start = {
        life: toInsuranceNumber(cover.lifePremium),
        tpd: toInsuranceNumber(cover.tpdPremium),
        trauma: toInsuranceNumber(cover.traumaPremium),
        ip: toInsuranceNumber(cover.ipPremium),
    };
    if (!age || age >= 110) return { rows: [], reason: "dob" };
    if (!Object.values(start).some((premium) => premium > 0)) {
        return { rows: [], reason: "premiums" };
    }

    const coverIndexation = 0.03;
    const projectedRows = [];
    let premiums = { ...start, ...(age >= 65 ? { ip: 0 } : {}) };
    let cumulative = Object.values(premiums).reduce((total, value) => total + value, 0);
    projectedRows.push({ age, ...premiums, total: cumulative, cumulative, isCurrent: true });

    for (let nextAge = age + 1; nextAge <= 65; nextAge += 1) {
        const rates = premiumAgeRates(nextAge);
        premiums = {
            life: premiums.life * (1 + rates.life) * (1 + coverIndexation),
            tpd: premiums.tpd * (1 + rates.tpd) * (1 + coverIndexation),
            trauma: premiums.trauma * (1 + rates.trauma) * (1 + coverIndexation),
            ip: nextAge < 65
                ? premiums.ip * (1 + rates.ip) * (1 + coverIndexation)
                : 0,
        };
        const total = Object.values(premiums).reduce((sum, value) => sum + value, 0);
        cumulative += total;
        projectedRows.push({ age: nextAge, ...premiums, total, cumulative });
    }

    const rows = projectedRows.filter((row, index) => {
        if (index === 0 || index <= 10) return true;
        if (horizon !== "65") return false;
        return (index - 10) % 5 === 0 || index === projectedRows.length - 1;
    });
    return { rows, reason: "" };
}
