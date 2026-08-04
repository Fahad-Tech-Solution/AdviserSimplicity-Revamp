// utils/pdfParsers.js

export const collapseSpaces = (s) => (s || "").replace(/\s+/g, " ").trim();

function parseDateToISO(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.match(
    /(\d{1,2})\s*([A-Za-z]+|\d{1,2})[\s\/\-\.]*(\d{2,4})/,
  );
  if (!parts) return "";

  let [, day, month, year] = parts;
  if (year.length === 2) year = `20${year}`;

  const pad = (n) => String(n).padStart(2, "0");

  if (isNaN(month)) {
    const monthIndex = new Date(Date.parse(`${month} 1, 2000`)).getMonth() + 1;
    if (!isNaN(monthIndex)) month = pad(monthIndex);
  } else {
    month = pad(month);
  }

  return `${year}-${month}-${pad(day)}T07:00:00.000Z`;
}

export function extractCurrency(text) {
  if (!text) return "";
  const match = text.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})|\$\d+/);
  if (!match) return "";
  const cleanNum = match[0].replace(/[^0-9.]/g, "");
  const numeric = parseFloat(cleanNum);
  return Number.isFinite(numeric)
    ? `$${numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : match[0];
}

// Super Funds Parser
export function parseSuperStatement(pdfText) {
  const normalizedText = pdfText
    .replace(/\x00/g, "")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl");

  const extractedData = {
    platformName: "",
    memberNumber: "",
    balanceBenefit: "",
    balanceBenefitDetails: {
      fundType: "Accumulation",
      portfolioArray: [],
      portfolioValueArray: [],
      portfolioValue: "",
      commencementDate: "",
      eligibleServiceDate: "",
      taxFreeComponent: "",
      taxableComponent: "",
      preservedAmount: "",
      restrictedNonPreserved: "",
      unrestrictedNonPreserved: "",
    },
    groupInsurance: "No",
    groupInsuranceDetails: {
      lifeCover: "",
      TPDCover: "",
      coverType: "Unitised",
      cost: "",
      monthlyIncome: "",
      waitingPeriod: null,
      BenefitPeriod: "",
      coverType2: "",
      cost2: "",
    },
    contributions: "No",
    contributionsArray: [],
    contributionsStartYear: null,
    nominatedBeneficiaries: "No",
    nominatedBeneficiariesDetails: {
      nominatedBeneficiariesArray: [],
      nominationType: "",
      NumberOfMap: 0,
    },
    annualAdvice: "",
    annualAdviceArray: {
      serviceFee: "",
      frequency: "",
      annualAdviserServiceFee: "",
    },
  };

  // Platform & Member Number
  const platformMatch = normalizedText.match(
    /(FirstChoice\s+Personal\s+Super|AustralianSuper|REST\s+Super|Cbus|Hostplus|Aware\s*Super|HESTA|Colonial\s*First\s*State|CFS\s*Edge|HUB24|Expand\s+Essential|IOOF)/i,
  );
  if (platformMatch) extractedData.platformName = platformMatch[1];

  const memberMatch = normalizedText.match(
    /(?:Account\s*number|Member\s*number|Policy\s*number)[:\s|]+([a-z0-9\s\-]{4,20})/i,
  );
  if (memberMatch) extractedData.memberNumber = collapseSpaces(memberMatch[1]);

  // Balance & Benefit
  const balanceMatch = normalizedText.match(
    /(?:Your\s*balance\s*as\s*at|Total\s*account\s*balance|Current\s*estimated\s*balance|Total\s*Benefit\s*Value|Closing\s*balance)[^\$\n]*\n?[\s|]*\$?([\d,]+\.?\d*)/i,
  );
  if (balanceMatch) {
    const balVal = extractCurrency(balanceMatch[0]);
    extractedData.balanceBenefit = balVal;
    extractedData.balanceBenefitDetails.portfolioValue = balVal;
  }

  // Reset arrays before parsing
  extractedData.balanceBenefitDetails.portfolioArray = [];
  extractedData.balanceBenefitDetails.portfolioValueArray = [];

  // Split text into individual lines to prevent cross-line regex swallowing
  const lines = normalizedText.split("\n");

  // Line Regex Match Groups:
  // 1: Option Name
  // 2: Option Code / APIR Code (Optional - flexible 2-4 chars + 7-9 chars)
  // 3: Units
  // 4: Unit Price
  // 5: Total Value
  // 6: Allocation % (Optional)
  const lineInvestmentRegex =
    /^([A-Za-z0-9\s&\-\/\.\(\)]+?)\s+(?:([\w\d]{2,4}\s+[\w\d]{7,9})\s+)?([\d,]+\.\d{4})\s+\$?([\d,]+\.\d{4})\s+\$?([\d,]+\.\d{2})(?:\s+([\d\.]+%))?$/i;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const match = trimmedLine.match(lineInvestmentRegex);

    if (match) {
      const optionName = collapseSpaces(match[1]);
      const optionCode = match[2] ? collapseSpaces(match[2]) : "";
      const units = match[3];
      const unitPrice = `$${match[4]}`;
      const value = `$${match[5]}`;
      const allocation = match[6] || "";

      // Filter out headers, footers, or subtotal lines
      if (
        optionName &&
        !/Account valuation|Your account valuation|Investments|Option code|APIR code|Total/i.test(
          optionName,
        )
      ) {
        const item = {
          key: `${optionName}-${units}`, // Unique key
          investmentOption: optionName,
          investmentCode: optionCode,
          units: units,
          investmentValue: unitPrice,
          value: value,
          allocation: allocation,
        };

        extractedData.balanceBenefitDetails.portfolioArray.push(item);
        extractedData.balanceBenefitDetails.portfolioValueArray.push(item);
      }
    }
  });

  // Tax Components
  const taxFreeMatch = normalizedText.match(
    /(?:Tax\s*Free|Tax[- ]?free\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (taxFreeMatch)
    extractedData.balanceBenefitDetails.taxFreeComponent = extractCurrency(
      taxFreeMatch[0],
    );

  const taxableMatch = normalizedText.match(
    /(?:Taxable|Taxable\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (taxableMatch)
    extractedData.balanceBenefitDetails.taxableComponent = extractCurrency(
      taxableMatch[0],
    );

  // Preserved Components
  const preservedMatch = normalizedText.match(
    /(?:Preserved\s*amount|Preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (preservedMatch)
    extractedData.balanceBenefitDetails.preservedAmount = extractCurrency(
      preservedMatch[0],
    );

  const restrictedMatch = normalizedText.match(
    /(?:Restricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (restrictedMatch)
    extractedData.balanceBenefitDetails.restrictedNonPreserved =
      extractCurrency(restrictedMatch[0]);

  const unrestrictedMatch = normalizedText.match(
    /(?:Unrestricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (unrestrictedMatch)
    extractedData.balanceBenefitDetails.unrestrictedNonPreserved =
      extractCurrency(unrestrictedMatch[0]);

  // Dates
  const commDateMatch = normalizedText.match(
    /(?:Commencement\s*date|Date\s*joined\s*fund|Account\s*start\s*date)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i,
  );
  if (commDateMatch)
    extractedData.balanceBenefitDetails.commencementDate = parseDateToISO(
      commDateMatch[1],
    );

  const eligibleDateMatch = normalizedText.match(
    /(?:Eligible\s*Service\s*Date|ETP\s*eligible\s*service\s*date)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i,
  );
  if (eligibleDateMatch)
    extractedData.balanceBenefitDetails.eligibleServiceDate = parseDateToISO(
      eligibleDateMatch[1],
    );

  // Fund Type
  if (/Pension|TTR|TRIS/i.test(normalizedText)) {
    extractedData.balanceBenefitDetails.fundType = "Pension";
  } else if (
    /Accumulation|Super|FirstChoice\s+Personal\s+Super/i.test(normalizedText)
  ) {
    extractedData.balanceBenefitDetails.fundType = "Accumulation";
  }

  return extractedData;
}

// Insurance Parser (Example for another section)
export function parseInsuranceStatement(pdfText) {
  // Your logic for insurance statements
  return {
    policyNumber: "",
    sumInsured: "",
    premium: "",
  };
}

/**
 * Platform Investments PDF Statement Parser
 */
export function parsePlatformInvestmentStatement(pdfText) {
  const normalizedText = pdfText
    .replace(/\x00/g, "")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl");

  const extractedData = {
    platformName: "",
    accountNumber: "",
    portfolioValue: "",
    portfolioValueArray: [],
    totalPortfolioCost: "",
    serviceFee: "",
    serviceFeeType: "Annually",
    serviceFeeArray: {
      serviceFee: "",
      frequency: "Annually",
      annualAdviserServiceFee: "",
    },
  };

  // 1. Platform Name Matching (Extend regex list with relevant platform names)
  const platformMatch = normalizedText.match(
    /(HUB24|Netwealth|CFS\s*Edge|Colonial\s*First\s*State|BT\s*Panorama|Macquarie\s*Wrap|Mason\s*Stevens|Expand\s+Extra|Praemium|AMP\s*MyNorth)/i,
  );
  if (platformMatch) {
    extractedData.platformName = platformMatch[1];
  }

  // 2. Account Number Matching
  const accountMatch = normalizedText.match(
    /(?:Account\s*number|Account\s*No|Portfolio\s*No|Investor\s*number)[:\s|]+([a-z0-9\s\-]{4,20})/i,
  );
  if (accountMatch) {
    extractedData.accountNumber = collapseSpaces(accountMatch[1]);
  }

  // 3. Total Portfolio Value Matching
  const totalValueMatch = normalizedText.match(
    /(?:Total\s*Portfolio\s*Value|Total\040Value|Account\s*Value|Total\s*Account\s*Balance|Portfolio\s*Balance)[^\$\n]*\n?[\s|]*\$?([\d,]+\.?\d*)/i,
  );
  if (totalValueMatch) {
    const val = extractCurrency(totalValueMatch[0]);
    extractedData.portfolioValue = val;
  }

  // 4. Total Portfolio Cost Matching (Optional acquisition cost / total cost)
  const totalCostMatch = normalizedText.match(
    /(?:Total\s*(?:Portfolio\s*)?Cost|Cost\s*Base|Total\040Purchase\040Cost)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (totalCostMatch) {
    extractedData.totalPortfolioCost = extractCurrency(totalCostMatch[0]);
  }

  // 5. Portfolio Value Array (Line-by-line Investment Option Matching)
  const lines = normalizedText.split("\n");

  // Line Match Groups:
  // 1: Option / Asset Name
  // 2: Option Code / APIR / Ticker (Optional)
  // 3: Investment Value / Market Value
  const lineInvestmentRegex =
    /^([A-Za-z0-9\s&\-\/\.\(\)]+?)\s+(?:([\w\d]{2,4}\s+[\w\d]{7,9}|[\w\d]{3,8})\s+)?(?:[\d,]+\.\d{4}\s+\$?[\d,]+\.\d{4}\s+)?\$?([\d,]+\.\d{2})/i;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const match = trimmedLine.match(lineInvestmentRegex);

    if (match) {
      const optionName = collapseSpaces(match[1]);
      const optionCode = match[2] ? collapseSpaces(match[2]) : "";
      const value = extractCurrency(match[3]);

      // Filter out non-investment header/footer lines
      if (
        optionName &&
        !/Account valuation|Portfolio Summary|Asset Name|Security Code|APIR|Total/i.test(
          optionName,
        )
      ) {
        extractedData.portfolioValueArray.push({
          key: `${optionName}-${optionCode || extractedData.portfolioValueArray.length}`,
          investmentOption: optionName,
          investmentCode: optionCode,
          investmentValue: value,
        });
      }
    }
  });

  // Fallback: If total portfolioValue was missed in step 3, calculate sum from holdings
  if (
    !extractedData.portfolioValue &&
    extractedData.portfolioValueArray.length > 0
  ) {
    const totalSum = extractedData.portfolioValueArray.reduce((sum, item) => {
      const rawNum =
        parseFloat(item.investmentValue.replace(/[^0-9.]/g, "")) || 0;
      return sum + rawNum;
    }, 0);

    if (totalSum > 0) {
      extractedData.portfolioValue = `$${totalSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  // 6. Service Fee Matching
  const feeMatch = normalizedText.match(
    /(?:Adviser\s*Service\s*Fee|Advice\s*Fee|Ongoing\s*Fee|Service\s*Fee)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (feeMatch) {
    const feeVal = extractCurrency(feeMatch[0]);
    extractedData.serviceFee = feeVal;
    extractedData.serviceFeeType = "Annually"; // Default frequency
    extractedData.serviceFeeArray = {
      serviceFee: feeVal,
      frequency: "Annually",
      annualAdviserServiceFee: feeVal,
    };
  }

  return extractedData;
}

// utils/pdfParsers.js

/**
 * Account-Based Pension PDF Statement Parser
 */
export function parseAccountBasedPensionStatement(pdfText) {
  const normalizedText = pdfText
    .replace(/\x00/g, "")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl");

  const extractedData = {
    platformName: "",
    memberNumber: "",
    balanceBenefit: "",
    balanceBenefitDetails: {
      fundType: "Account Based",
      portfolioArray: [],
      portfolioValueArray: [],
      portfolioValue: "",
      commencementDate: "",
      eligibleServiceDate: "",
      purchasePrice: "",
      taxFreeComponent: "",
      taxableComponent: "",
      unrestrictedNonPreserved: "",
      taxFree: "",
      restrictedNonPreserved: "",
      preservedAmount: "",
    },
    pensionPayment: "",
    pensionPaymentArray: {
      serviceFee: "",
      frequency: "Annually",
      annualAdviserServiceFee: "",
    },
    nominatedBeneficiaries: "No",
    nominatedBeneficiariesDetails: {
      nominatedBeneficiariesArray: [],
      nominationType: "",
      NumberOfMap: 0,
    },
    annualAdvice: "",
    annualAdviceArray: {
      serviceFee: "",
      frequency: "",
      annualAdviserServiceFee: "",
    },
  };

  // 1. Platform Name
  const platformMatch = normalizedText.match(
    /(FirstChoice\s+Pension|AustralianSuper|REST\s+Pension|Hostplus|Aware\s*Super|HESTA|Colonial\s*First\s*State|CFS\s*Edge|HUB24|AMP\s*MyNorth|Challenger|ClearView)/i,
  );
  if (platformMatch) extractedData.platformName = platformMatch[1];

  // 2. Member / Account Number
  const memberMatch = normalizedText.match(
    /(?:Pension\s*account\s*number|Account\s*number|Member\s*number|Policy\s*number)[:\s|]+([a-z0-9\s\-]{4,20})/i,
  );
  if (memberMatch) extractedData.memberNumber = collapseSpaces(memberMatch[1]);

  // 3. Balance & Benefit
  const balanceMatch = normalizedText.match(
    /(?:Your\s*pension\s*balance|Total\s*account\s*balance|Closing\s*balance|Total\s*Benefit\s*Value|Current\s*balance)[^\$\n]*\n?[\s|]*\$?([\d,]+\.?\d*)/i,
  );
  if (balanceMatch) {
    const balVal = extractCurrency(balanceMatch[0]);
    extractedData.balanceBenefit = balVal;
    extractedData.balanceBenefitDetails.portfolioValue = balVal;
  }

  // 4. Dates & Purchase Price
  const commDateMatch = normalizedText.match(
    /(?:Commencement\s*date|Pension\s*start\s*date|Date\s*commenced)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i,
  );
  if (commDateMatch) {
    extractedData.balanceBenefitDetails.commencementDate = parseDateToISO(
      commDateMatch[1],
    );
  }

  const eligibleDateMatch = normalizedText.match(
    /(?:Eligible\s*Service\s*Date|ETP\s*eligible\s*date)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i,
  );
  if (eligibleDateMatch) {
    extractedData.balanceBenefitDetails.eligibleServiceDate = parseDateToISO(
      eligibleDateMatch[1],
    );
  }

  const purchasePriceMatch = normalizedText.match(
    /(?:Purchase\s*price|Initial\s*purchase\s*price|Purchase\s*amount)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (purchasePriceMatch) {
    extractedData.balanceBenefitDetails.purchasePrice = extractCurrency(
      purchasePriceMatch[0],
    );
  }

  // 5. Tax Components
  const taxFreeMatch = normalizedText.match(
    /(?:Tax\s*Free|Tax[- ]?free\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (taxFreeMatch) {
    extractedData.balanceBenefitDetails.taxFreeComponent = extractCurrency(
      taxFreeMatch[0],
    );
  }

  const taxableMatch = normalizedText.match(
    /(?:Taxable|Taxable\s*component)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (taxableMatch) {
    extractedData.balanceBenefitDetails.taxableComponent = extractCurrency(
      taxableMatch[0],
    );
  }

  const taxFreePctMatch = normalizedText.match(
    /(?:Tax\s*free\s*percentage|Tax\s*free\040%)[:\s|]*([\d\.]+%)/i,
  );
  if (taxFreePctMatch) {
    extractedData.balanceBenefitDetails.taxFree = taxFreePctMatch[1];
  }

  // Preservation Components
  const unrestrictedMatch = normalizedText.match(
    /(?:Unrestricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (unrestrictedMatch) {
    extractedData.balanceBenefitDetails.unrestrictedNonPreserved =
      extractCurrency(unrestrictedMatch[0]);
  }

  const restrictedMatch = normalizedText.match(
    /(?:Restricted\s*non[- ]?preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (restrictedMatch) {
    extractedData.balanceBenefitDetails.restrictedNonPreserved =
      extractCurrency(restrictedMatch[0]);
  }

  const preservedMatch = normalizedText.match(
    /(?:Preserved\s*amount|Preserved)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (preservedMatch) {
    extractedData.balanceBenefitDetails.preservedAmount = extractCurrency(
      preservedMatch[0],
    );
  }

  // 6. Investment Holdings (Portfolio)
  const lines = normalizedText.split("\n");
  const lineInvestmentRegex =
    /^([A-Za-z0-9\s&\-\/\.\(\)]+?)\s+(?:([\w\d]{2,4}\s+[\w\d]{7,9}|[\w\d]{3,8})\s+)?(?:[\d,]+\.\d{4}\s+\$?[\d,]+\.\d{4}\s+)?\$?([\d,]+\.\d{2})/i;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const match = trimmedLine.match(lineInvestmentRegex);

    if (match) {
      const optionName = collapseSpaces(match[1]);
      const optionCode = match[2] ? collapseSpaces(match[2]) : "";
      const value = extractCurrency(match[3]);

      if (
        optionName &&
        !/Account valuation|Investment details|Asset Name|APIR|Total/i.test(
          optionName,
        )
      ) {
        const item = {
          key: `${optionName}-${optionCode || extractedData.balanceBenefitDetails.portfolioArray.length}`,
          investmentOption: optionName,
          investmentCode: optionCode,
          investmentValue: value,
        };

        extractedData.balanceBenefitDetails.portfolioArray.push(item);
        extractedData.balanceBenefitDetails.portfolioValueArray.push(item);
      }
    }
  });

  // 7. Pension Payment Details
  const paymentMatch = normalizedText.match(
    /(?:Gross\s*pension\s*payment|Annual\s*pension\s*amount|Pension\s*payment)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (paymentMatch) {
    const pVal = extractCurrency(paymentMatch[0]);
    extractedData.pensionPayment = pVal;

    const freqMatch = normalizedText.match(
      /(?:Payment\s*frequency)[:\s|]+(Monthly|Fortnightly|Quarterly|Annually|Half-yearly)/i,
    );
    const freq = freqMatch ? freqMatch[1] : "Annually";

    extractedData.pensionPaymentArray = {
      serviceFee: pVal,
      frequency: freq,
      annualAdviserServiceFee: pVal,
    };
  }

  // 8. Beneficiaries
  const beneMatch = normalizedText.match(
    /(?:Beneficiary|Nominated\s*beneficiaries|Nomination)[:\s|]+([^\n]+)/i,
  );
  if (beneMatch) {
    extractedData.nominatedBeneficiaries = "Yes";

    const typeMatch = normalizedText.match(
      /(Binding\s*\([^\)]+\)|Non-Binding|Reversionary)/i,
    );
    const nomType = typeMatch ? typeMatch[1] : "Binding (Lapsing)";

    extractedData.nominatedBeneficiariesDetails = {
      nominatedBeneficiariesArray: [
        {
          relationshipStatus: "Legal Personal Representative (Your Estate)",
          beneficiaryName: collapseSpaces(beneMatch[1]),
          DOB: "",
          shareBenefit: "100%",
        },
      ],
      nominationType: nomType,
      NumberOfMap: 1,
    };
  }

  // 9. Ongoing Adviser Service Fees
  const feeMatch = normalizedText.match(
    /(?:Adviser\s*Service\s*Fee|Advice\s*Fee|Ongoing\s*Fee)[:\s|]*\$?([\d,]+\.\d{2})/i,
  );
  if (feeMatch) {
    const feeVal = extractCurrency(feeMatch[0]);
    extractedData.annualAdvice = feeVal;
    extractedData.annualAdviceArray = {
      serviceFee: feeVal,
      frequency: "Monthly",
      annualAdviserServiceFee: feeVal,
    };
  }

  return extractedData;
}

// utils/pdfParsers.js

/**
 * Annuities PDF Statement Parser
 */
export function parseAnnuityStatement(pdfText) {
    const normalizedText = pdfText
        .replace(/\x00/g, "")
        .replace(/\uFB01/g, "fi")
        .replace(/\uFB02/g, "fl");

    const extractedData = {
        productProvider: "",
        accountNumber: "",
        sourceFunds: "Super", // Default fallback: Super / Non-Super
        originalInvestmentAmount: "",
        returnCapitalValue: "",
        annualAnnuityPayment: "",
        annualAnnuityPaymentArray: {
            serviceFee: "",
            frequency: "Annually",
            annualAdviserServiceFee: "",
        },
        annuityType: "Fixed Term", // Default fallback: Fixed Term / Lifetime
        term: "",
        yearsMaturity: "",
        nominatedBeneficiaries: "No",
        nominatedBeneficiariesDetails: {
            nominatedBeneficiariesArray: [],
            nominationType: "",
            NumberOfMap: 0,
        },
        annualAdvice: "",
        annualAdviceArray: {
            serviceFee: "",
            frequency: "Annually",
            annualAdviserServiceFee: "",
        },
    };

    // 1. Product Provider Matching
    const providerMatch = normalizedText.match(
        /(Challenger|CommInsure|Generation\s*Life|AMP|Colonial\s*First\s*State|ClearView|Resolution\s*Life|TAL)/i
    );
    if (providerMatch) {
        extractedData.productProvider = providerMatch[1];
    }

    // 2. Account / Policy Number Matching
    const accountMatch = normalizedText.match(
        /(?:Policy\s*number|Account\s*number|Annuity\s*number|Policy\s*No)[:\s|]+([a-z0-9\s\-]{4,20})/i
    );
    if (accountMatch) {
        extractedData.accountNumber = collapseSpaces(accountMatch[1]);
    }

    // 3. Source of Funds (Super vs Non-Super/Ordinary)
    if (/Ordinary|Non-Super|Personal\s*Savings|Cash/i.test(normalizedText)) {
        extractedData.sourceFunds = "Non-Super";
    } else if (/Super|Superannuation|Rollover/i.test(normalizedText)) {
        extractedData.sourceFunds = "Super";
    }

    // 4. Financial Amounts (Investment Amount, Return Capital Value)
    const investmentMatch = normalizedText.match(
        /(?:Original\s*Investment|Purchase\s*Price|Initial\s*Investment|Investment\s*Amount)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (investmentMatch) {
        extractedData.originalInvestmentAmount = extractCurrency(investmentMatch[0]);
    }

    const returnCapMatch = normalizedText.match(
        /(?:Return\s*of\s*Capital|Capital\s*Value|Current\s*Capital\s*Value|Withdrawal\s*Value)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (returnCapMatch) {
        extractedData.returnCapitalValue = extractCurrency(returnCapMatch[0]);
    }

    // 5. Annuity Type, Term, and Years to Maturity
    if (/Lifetime|Life\040Annuity/i.test(normalizedText)) {
        extractedData.annuityType = "Lifetime";
    } else if (/Fixed\s*Term|Term\040Annuity/i.test(normalizedText)) {
        extractedData.annuityType = "Fixed Term";
    }

    const termMatch = normalizedText.match(/(?:Annuity\s*Term|Term)[:\s|]+(\d{1,2})\s*(?:Years|Yrs)?/i);
    if (termMatch) {
        extractedData.term = termMatch[1];
    }

    const maturityMatch = normalizedText.match(
        /(?:Years\s*to\s*Maturity|Remaining\s*Term|Maturity\s*in)[:\s|]+(\d{1,2})\s*(?:Years|Yrs)?/i
    );
    if (maturityMatch) {
        extractedData.yearsMaturity = maturityMatch[1];
    }

    // 6. Annual Annuity Payment Details
    const paymentMatch = normalizedText.match(
        /(?:Annual\s*Annuity\s*Payment|Annuity\s*Payment|Regular\s*Payment|Gross\s*Payment)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (paymentMatch) {
        const pVal = extractCurrency(paymentMatch[0]);
        extractedData.annualAnnuityPayment = pVal;

        const freqMatch = normalizedText.match(/(?:Payment\s*frequency)[:\s|]+(Monthly|Quarterly|Half-yearly|Annually)/i);
        const freq = freqMatch ? freqMatch[1] : "Annually";

        extractedData.annualAnnuityPaymentArray = {
            serviceFee: pVal,
            frequency: freq,
            annualAdviserServiceFee: pVal,
        };
    }

    // 7. Nominated Beneficiaries
    const beneMatch = normalizedText.match(/(?:Beneficiary|Nominated\s*Beneficiaries|Reversionary)[:\s|]+([^\n]+)/i);
    if (beneMatch) {
        extractedData.nominatedBeneficiaries = "Yes";

        const typeMatch = normalizedText.match(/(Binding\s*\([^\)]+\)|Non-Binding|Reversionary)/i);
        const nomType = typeMatch ? typeMatch[1] : "Binding (Lapsing)";

        extractedData.nominatedBeneficiariesDetails = {
            nominatedBeneficiariesArray: [
                {
                    relationshipStatus: "Spouse/De-facto",
                    beneficiaryName: collapseSpaces(beneMatch[1]),
                    DOB: "",
                    shareBenefit: "100%",
                },
            ],
            nominationType: nomType,
            NumberOfMap: 1,
        };
    }

    // 8. Ongoing Adviser Service Fees
    const feeMatch = normalizedText.match(
        /(?:Adviser\s*Service\s*Fee|Advice\s*Fee|Annual\s*Advice\s*Fee)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (feeMatch) {
        const feeVal = extractCurrency(feeMatch[0]);
        extractedData.annualAdvice = feeVal;

        const feeFreqMatch = normalizedText.match(/(?:Fee\s*frequency)[:\s|]+(Monthly|Quarterly|Annually)/i);
        const feeFreq = feeFreqMatch ? feeFreqMatch[1] : "Annually";

        extractedData.annualAdviceArray = {
            serviceFee: feeVal,
            frequency: feeFreq,
            annualAdviserServiceFee: feeVal,
        };
    }

    return extractedData;
}


// utils/pdfParsers.js

/**
 * Personal Insurance PDF Statement Parser
 */
export function parsePersonalInsuranceStatement(pdfText) {
    const normalizedText = pdfText
        .replace(/\x00/g, "")
        .replace(/\uFB01/g, "fi")
        .replace(/\uFB02/g, "fl");

    const extractedData = {
        provider: "",
        policyNo: "",
        Owner: "Self", // Default: Self / Super Trustees / Partner
        startDate: "",
        smoker: "No",
        life: "",
        TPD: "",
        trauma: "",
        LifeTPDTraumaDetails: {
            life: "",
            TPD: "",
            trauma: "",
            premiumType: "Stepped",
            TPDDefinition: "Any",
            traumaPlus: "No",
            CPI: "Yes",
            superlinked: "No",
        },
        IPDetails: {
            monthlyAmount: "",
            waitingPeriod: "30 Days",
            benefitPeriod: "2 Years",
            ownOccPeriod: "2 Years",
            premiumType: "Stepped",
            benefitType: "Indemnity",
            CPI: "Yes",
            increasingClaims: "No",
            accidentOption: "No",
            superlinked: "No",
        },
        IP: "",
        premiumsDetails: {
            life: "",
            tpd: "",
            trauma: "",
            ip: "",
            frequency: "Annualy",
            payeeOfPremiums: "Direct Debit",
            paymentMethod: "Bank Account",
            commissionRate: "0.00%",
            totalCost: "",
            commissionPayable: "$0",
        },
        premiums: "",
        loadingExclusion: "No",
        loadingExclusiondescription: "",
        beneficiary: "No",
        beneficiaryDetails: {
            beneficiaryArray: [],
            nominationType: "",
            NumberOfMap: 0,
        },
    };

    // 1. Provider Matching
    const providerMatch = normalizedText.match(
        /(TAL|AIA|Zurich|MLC|ClearView|OnePath|NEOS|Encompass|CommInsure|Resolution\s*Life|MetLife)/i
    );
    if (providerMatch) {
        extractedData.provider = providerMatch[1];
    }

    // 2. Policy Number & Dates
    const policyMatch = normalizedText.match(
        /(?:Policy\s*Number|Policy\s*No|Plan\s*Number)[:\s|]+([a-z0-9\s\-]{4,20})/i
    );
    if (policyMatch) {
        extractedData.policyNo = collapseSpaces(policyMatch[1]);
    }

    const startDateMatch = normalizedText.match(
        /(?:Policy\s*Start\s*Date|Commencement\s*Date|Date\s*of\s*Issue)[:\s|]*(\d{1,2}[\s\/\-\.][A-Za-z0-9]+[\s\/\-\.]\d{2,4})/i
    );
    if (startDateMatch) {
        extractedData.startDate = parseDateToISO(startDateMatch[1]);
    }

    // 3. Ownership & Smoker Status
    if (/Super\s*Trustee|Owned\s*by\s*Super/i.test(normalizedText)) {
        extractedData.Owner = "Super Trustees";
    }

    if (/Smoker\s*Status[:\s|]*Yes|Smoker[:\s|]*Yes/i.test(normalizedText)) {
        extractedData.smoker = "Yes";
    }

    // 4. Life / TPD / Trauma Cover Sums
    const lifeMatch = normalizedText.match(
        /(?:Life\s*Cover|Death\s*Cover|Sum\s*Insured\s*-\s*Life)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (lifeMatch) {
        const val = extractCurrency(lifeMatch[0]);
        extractedData.life = val;
        extractedData.LifeTPDTraumaDetails.life = val;
    }

    const tpdMatch = normalizedText.match(
        /(?:TPD\s*Cover|Total\s*&\040Permanent\s*Disability)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (tpdMatch) {
        const val = extractCurrency(tpdMatch[0]);
        extractedData.TPD = val;
        extractedData.LifeTPDTraumaDetails.TPD = val;
    }

    const traumaMatch = normalizedText.match(
        /(?:Trauma\s*Cover|Critical\s*Illness)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (traumaMatch) {
        const val = extractCurrency(traumaMatch[0]);
        extractedData.trauma = val;
        extractedData.LifeTPDTraumaDetails.trauma = val;
    }

    // Life/TPD/Trauma Definitions
    if (/Level\s*Premium/i.test(normalizedText)) {
        extractedData.LifeTPDTraumaDetails.premiumType = "Level";
    }
    if (/Own\s*Occupation/i.test(normalizedText)) {
        extractedData.LifeTPDTraumaDetails.TPDDefinition = "Own";
    }
    if (/Superlinked[:\s|]*Yes|Superlink[:\s|]*Yes/i.test(normalizedText)) {
        extractedData.LifeTPDTraumaDetails.superlinked = "Yes";
        extractedData.IPDetails.superlinked = "Yes";
    }

    // 5. Income Protection (IP) Details
    const ipMatch = normalizedText.match(
        /(?:Income\s*Protection|Monthly\040Benefit|IP\s*Cover)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (ipMatch) {
        const val = extractCurrency(ipMatch[0]);
        extractedData.IP = val;
        extractedData.IPDetails.monthlyAmount = val;

        const waitMatch = normalizedText.match(/(?:Waiting\s*Period)[:\s|]+(\d+\s*(?:Days|Weeks|Months))/i);
        if (waitMatch) extractedData.IPDetails.waitingPeriod = waitMatch[1];

        const benefitPeriodMatch = normalizedText.match(/(?:Benefit\s*Period)[:\s|]+(\d+\s*(?:Years|Yrs)|To\s*Age\s*\d+)/i);
        if (benefitPeriodMatch) extractedData.IPDetails.benefitPeriod = benefitPeriodMatch[1];

        if (/Agreed\s*Value/i.test(normalizedText)) {
            extractedData.IPDetails.benefitType = "Agreed Value";
        }
    }

    // 6. Premiums & Breakdown
    const totalPremiumMatch = normalizedText.match(
        /(?:Total\s*Premium|Total\s*Cost|Annual\s*Premium)[:\s|]*\$?([\d,]+\.\d{2})/i
    );
    if (totalPremiumMatch) {
        const val = extractCurrency(totalPremiumMatch[0]);
        extractedData.premiums = val;
        extractedData.premiumsDetails.totalCost = val;
    }

    const lifePremMatch = normalizedText.match(/(?:Life\s*Premium)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (lifePremMatch) extractedData.premiumsDetails.life = extractCurrency(lifePremMatch[0]);

    const tpdPremMatch = normalizedText.match(/(?:TPD\s*Premium)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (tpdPremMatch) extractedData.premiumsDetails.tpd = extractCurrency(tpdPremMatch[0]);

    const traumaPremMatch = normalizedText.match(/(?:Trauma\s*Premium)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (traumaPremMatch) extractedData.premiumsDetails.trauma = extractCurrency(traumaPremMatch[0]);

    const ipPremMatch = normalizedText.match(/(?:Income\s*Protection\s*Premium|IP\s*Premium)[:\s|]*\$?([\d,]+\.\d{2})/i);
    if (ipPremMatch) extractedData.premiumsDetails.ip = extractCurrency(ipPremMatch[0]);

    // 7. Loadings & Exclusions
    const exclusionMatch = normalizedText.match(/(?:Exclusion|Loading|Special\s*Condition)[:\s|]+([^\n]+)/i);
    if (exclusionMatch) {
        extractedData.loadingExclusion = "Yes";
        extractedData.loadingExclusiondescription = collapseSpaces(exclusionMatch[1]);
    }

    // 8. Beneficiaries
    const beneMatch = normalizedText.match(/(?:Beneficiary|Nominated\s*Beneficiaries)[:\s|]+([^\n]+)/i);
    if (beneMatch) {
        extractedData.beneficiary = "Yes";

        const typeMatch = normalizedText.match(/(Binding\s*\([^\)]+\)|Non-Binding)/i);
        const nomType = typeMatch ? typeMatch[1] : "Binding (Lapsing)";

        extractedData.beneficiaryDetails = {
            beneficiaryArray: [
                {
                    relationshipStatus: "Child",
                    beneficiaryName: collapseSpaces(beneMatch[1]),
                    DOB: "",
                    shareBenefit: "100%",
                },
            ],
            nominationType: nomType,
            NumberOfMap: 1,
        };
    }

    return extractedData;
}