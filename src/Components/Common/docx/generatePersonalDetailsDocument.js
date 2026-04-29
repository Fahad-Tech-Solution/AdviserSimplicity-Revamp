import { object } from "framer-motion/client";
import { generateDocumentFromTemplate } from "./generateDocumentFromTemplate.js";

function toSentenceCase(value = "") {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatAuDate(date = new Date()) {
  try {
    return date.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function normalizeDateForDoc(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatAuDate(date);
}

function sanitizeHtmlToText(text = "") {
  return String(text || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCurrencyNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function toCommaAndDollar(value) {
  const numeric = parseCurrencyNumber(value);
  return `$${Math.ceil(numeric)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function readFirstNumber(...candidates) {
  for (const candidate of candidates) {
    const n = parseCurrencyNumber(candidate);
    if (n !== 0) return n;
  }
  return 0;
}

function prettifyKeyName(value = "") {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasMeaningfulGoalValues(goal = {}) {
  if (!goal || typeof goal !== "object") return false;
  const fieldsToCheck = [
    "title",
    "scopeOfAdvice",
    "description",
    "when",
    "whenScopeIs",
    "estimatedValue",
  ];

  return fieldsToCheck.some((field) => {
    const value = goal?.[field];
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    return Boolean(value);
  });
}

function buildPersonalDetailSection(personalDetails, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const p = personalDetails?.[user] || {};

  return {
    [`${user}Title`]: p?.[`${user}Title`] || "",
    [`${user}FirstName`]: p?.[`${user}GivenName`] || "",
    [`${user}MiddleName`]: p?.[`${user}MiddleName`] || "",
    [`${user}LastName`]: p?.[`${user}LastName`] || "",
    [`${user}Preferred`]: p?.[`${user}PreferredName`] || "",
    [`${user}Gender`]: p?.[`${user}Gender`] || "",
    [`${user}Dob`]: p?.[`${user}DOB`] ? normalizeDateForDoc(p[`${user}DOB`]) : "",
    [`${user}Age`]: p?.[`${user}Age`] || "",

    [`${user}Marital`]: p?.[`${user}MaritalStatus`] || "",
    [`${user}Employment`]: p?.[`${user}EmploymentStatus`] || "",
    [`${user}RetAge`]: p?.[`${user}PlannedRetirementAge`] || "",
    [`${user}Health`]: p?.[`${user}Health`] || "",
    [`${user}Smoker`]: p?.[`${user}Smoker`] || "",
    [`${user}TaxRes`]: p?.[`${user}TaxResidentRadio`] || "",
    [`${user}HealthCover`]: p?.[`${user}PrivateHealthCoverRadio`] || "",
    [`${user}HelpDebt`]: p?.[`${user}HELPSDebtRadio`] || "",

    [`${user}HomeAddress`]: p?.[`${user}HomeAddress`] || "",
    [`${user}PostalAddress`]: p?.[`${user}PostalAddress`] || "",
    [`${user}Mobile`]: p?.[`${user}Mobile`] || "",
    [`${user}HomePhone`]: p?.[`${user}HomePhone`] || "",
    [`${user}WorkPhone`]: p?.[`${user}WorkPhone`] || "",
    [`${user}Email`]:
      user === "client"
        ? p?.Email || p?.clientEmail || ""
        : p?.partnerEmail || p?.Email || "",

    ...(user === "client"
      ? {
          SingleClient: ["Single", "Widowed", ""].includes(
            p?.[`${user}MaritalStatus`] || "",
          ),
        }
      : {}),
  };
}

function buildChildren(personalDetails) {
  const arr = personalDetails?.children?.arrayOfChildren;
  if (!Array.isArray(arr)) return [];
  return arr.map((child) => ({
    childFirstName: splitFullName(child?.name)?.firstName || "",
    childLastName: splitFullName(child?.name)?.lastName || "",
    childDob: child?.dob ? normalizeDateForDoc(child?.dob) : "",
    childAge: child?.age || "",
    childGender: child?.gender || "",
    childRelationship: child?.relationship || "",
    childDepenantChild: child?.depenantChild || "",
  }));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildEmploymentDetailSection(discoveryData, personalDetails, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const source =
    discoveryData?.incomeFromOwnBusiness?.[user] ||
    discoveryData?.incomeFromBusiness?.[user] ||
    {};

  const leave = source?.LeaveEntitlementsModal || {};
  const salary = source?.SalaryPackageModal || {};
  const packaging = source?.SalaryPackagingModal || {};

  const maritalStatus = personalDetails?.[user]?.[`${user}MaritalStatus`] || "";
  const owners = asArray(discoveryData?.incomeFromOwnBusiness?.owner);

  return {
    [`${user}Occupation`]: source?.occupation || "",
    [`${user}EmploymentStatus`]: source?.employmentStatus || "",
    [`${user}NameOfCompany`]: source?.nameOfCompany || "",
    [`${user}StartDate`]: source?.startDate ? normalizeDateForDoc(source.startDate) : "",
    [`${user}HoursWorked`]: source?.hoursWorked || "",
    [`${user}GrossSalary`]: salary?.grossSalary || "",
    [`${user}SGC`]: salary?.SGC || "",
    [`${user}SalarySacrificeContributions`]: salary?.salarySacrificeContributions || "",
    [`${user}AfterTaxContributions`]: salary?.afterTaxContributions || "",
    [`${user}ChoiceOfFund`]: source?.choiceOfFund || "",
    [`${user}EmployerFBTStatus`]: packaging?.employerFBTStatus || "",
    [`${user}CreditCardMortgageRepayments`]: packaging?.creditCardMortgageRepayments || "",
    [`${user}CostBaseOfCar`]: packaging?.costBaseOfCar || "",
    [`${user}FBTPaidByEmployer`]: packaging?.FBTPaidByEmployer || "",
    [`${user}RunningCostsOfCar`]: packaging?.runningCostsOfCar || "",
    [`${user}Annual`]: `${leave?.annualLeaveAmount || ""}${leave?.annualLeaveTime || ""}`,
    [`${user}Sick`]: `${leave?.sickLeaveAmount || ""}${leave?.sickLeaveTime || ""}`,
    [`${user}LongService`]: `${leave?.longServiceLeaveAmount || ""}${leave?.longServiceLeaveTime || ""}`,
    coupleEmployment: !["Single", "Widowed", ""].includes(maritalStatus)
      ? owners.includes("client") && owners.includes("partner")
      : false,
  };
}

function buildCenterlinkSection(discoveryData, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const source = discoveryData?.incomeFromCentrelink?.[user] || {};
  const owners = asArray(discoveryData?.incomeFromCentrelink?.owner);

  return {
    [`${user}CRN`]: source?.CRN || "",
    [`${user}PaymentType`]: asArray(source?.paymentType).join(", "),
    [`${user}FortnightlyPayment`]: source?.fortnightlyPayment || "",
    [`${user}AnnualPaymentAmount`]: source?.annualPaymentAmount || "",
    [`${user}CentrelinkCardsHeld`]: asArray(source?.centrelinkCardsHeld).join(", "),
    coupleCenterlink: owners.includes("client") && owners.includes("partner"),
  };
}



function buildGoalsAndObjectivesSection(goalsData, goalsQuestions, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const source = goalsData?.goalsAndObjectives?.[user] || {};
  const questionState =
    goalsQuestions && typeof goalsQuestions === "object" ? goalsQuestions : {};
  const goalState = goalsData && typeof goalsData === "object" ? goalsData : {};

  const items = Object.keys(questionState)
    .filter((key) => {
      if (questionState?.[key] !== "Yes") return false;
      const goal = goalState?.[key] || {};
      return hasMeaningfulGoalValues(goal);
    })
    .map((key) => {
      const goal = goalState?.[key] || {};
      return {
        goalName: goal?.title || prettifyKeyName(key),
        scopeOfAdvice: goal?.scopeOfAdvice || "",
        description: sanitizeHtmlToText(goal?.description || ""),
        when: goal?.when || goal?.whenScopeIs || "",
        estimatedValue: goal?.estimatedValue || "",
      };
    });

  return {
    [`${user}GoalsAndObjectives`]: source?.goalsAndObjectives || "",
    items,
  };
}

function buildWillSection(discoveryData, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const source = discoveryData?.will?.[user] || {};
  // console.log("source: ", source,discoveryData?.will,userKey);
  return {
    [`${user}Will`]: discoveryData?.will?.owner && discoveryData?.will?.owner.includes(user) ? "Yes" : "No",
    [`${user}WillYearSetUp`]: source?.yearSetUp || "",
    [`${user}WillsCurrent`]: source?.willsCurrent || "No",

    [`${user}ExecutorItems`]: source?.executor.map((item, index) => {
        return {
          executorName: item?.name || "",
          executerRelationship: item?.relationshipStatus || "",
        };
      }) || [],

    [`${user}EnduringGuardianship`]: source?.enduringGuardianship || "No",
    [`${user}EstatePlanningRadio`]: source?.estatePlanningRadio || "No",
    [`${user}description`]: source?.estatePlanningdescription || "",
  };
}

function buildPoaSection(discoveryData, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const source = discoveryData?.POA?.[user] || {};
  const names = asArray(source?.POAName);
  return {
    [`${user}POAType`]: source?.POAType || "",
    [`${user}POAYearSetUp`]: source?.yearSetUp || "",
    [`${user}POANameItems`]: names.map((item) => ({
      executorName: item?.name || "",
      executerRelationship: item?.relationshipStatus || "",
    })),
  };
}

function buildProfessionalAdviserSection(discoveryData, userKey) {
  const user = userKey === "partner" ? "partner" : "client";
  const rows = asArray(discoveryData?.professionalAdviser?.[user]);
  return {
    [`${user}ProfessionalAdviseritems`]: rows.map((item) => ({
      POAType: item?.POAType || "",
      adviserName: item?.adviserName || "",
      company: item?.company || "",
      phone: item?.phone || "",
      email: item?.email || "",
    })),
  };
}

// Legacy-style Income & Expenses summary block used by docx template.
function buildIncomeAndExpensesSection(discoveryData, userKey) {
  const user = userKey === "partner" ? "partner" : "client";

  const ownBusiness = discoveryData?.incomeFromOwnBusiness?.[user] || {};
  const incomeFromSoleTrader = discoveryData?.incomeFromSoleTrader?.[user] || {};
 
  const lifetimePension = discoveryData?.incomeFromLifetimePension?.[user] || {};
  const overseasPension = discoveryData?.incomeFromOverseasPension?.[user] || {};
  const centrelink = discoveryData?.incomeFromCentrelink?.[user] || {};
  const superFunds = discoveryData?.superDetails?.[user] || {};
  const annuities = discoveryData?.annuities?.[user] || {};





  console.log("ownBusiness: ", ownBusiness);
  const EmploymentIncome = readFirstNumber(
    ownBusiness?.SalaryPackageModal?.grossSalary,
    ownBusiness?.grossSalary,
    ownBusiness?.employmentIncome,
  );
  const NetBusinessIncome = readFirstNumber(
    incomeFromSoleTrader?.netBusinessIncome,
    incomeFromSoleTrader?.clientTotal,
    incomeFromSoleTrader?.partnerTotal,
  );

  // const SuperPensionPayment =
  // (CRState.accountBasedPensionIssues === "Yes" &&
  // Array.isArray(allQuestions?.accountBasedPensionIssues?.[user])
  //   ? allQuestions.accountBasedPensionIssues[user].reduce(
  //       (t, e) =>
  //         t +
  //         parseFloat((e?.pensionPayment || "$0").replace(/[^0-9.-]+/g, "")),
  //       0,
  //     )
  //   : 0)

  // object
  // accountBasedPensionIssues
  // : 
  // client
  // : 
  // Array(1)
  // 0
  // : 
  // {platformName: '68b90ec7dd9aaadd027ab06e', memberNumber: '48644', balanceBenefit: '$128,956', balanceBenefitDetails: {…}, pensionPayment: '$123,123', …}
  // length
  // : 
  // 1
  // [[Prototype]]
  // : 
  // Array(0)
  // clientCurrentBalance
  // : 
  // "$128,956"
  // clientFK
  // : 
  // "68a83e7699ec7ff4128600a2"
  // clientTotal
  // : 
  // "$128,956"
  // partner
  // : 
  // [{…}]
  // partnerCurrentBalance
  // : 
  // "$16,689"
  // partnerTotal
  // : 
  // "$16,689"
  // _id
  // : 
  // "68ff27051f510bb3ce23ef5e"
  

  const SuperPensionPayment = readFirstNumber(
    
    discoveryData?.accountBasedPensionIssues?.[user]?.reduce(
      (t, e) =>
        t +
        parseFloat((e?.pensionPayment || "$0").replace(/[^0-9.-]+/g, "")),
      0,
    ),

    // const LifeTimePensionPayment =
    // CRState.incomeFromSuperPayment == "Yes"
    //   ? parseMoney(
    //       allQuestions?.incomeFromSuperPayment?.[user + "Total"] || "$0",
    //     )
    //   : 0;

   
  );
  const LifeTimePensionPayment = readFirstNumber(

    discoveryData?.incomeFromSuperPayment?.[user + "Total"],
  );


  // const OverseasPensionPayment =
  // CRState.incomeFromOverseasPension == "Yes"
  //   ? parseMoney(
  //       allQuestions?.incomeFromOverseasPension?.[user + "Total"] || "$0",
  //     )
  //   : 0;

  const OverseasPensionPayment = readFirstNumber(

    discoveryData?.incomeFromOverseasPension?.[user + "Total"],
  );
  const CenterlinkPension = readFirstNumber(
    centrelink?.annualPaymentAmount,
    centrelink?.fortnightlyPayment
      ? parseCurrencyNumber(centrelink.fortnightlyPayment) * 26
      : 0,
  );
  const RentalIncome = readFirstNumber(
    discoveryData?.investmentPropertyDetails?.[`${user}Total`],
    discoveryData?.investmentPropertyDetails?.[user]?.rentalIncome,
  );

  // const Interest =
  // ((CRState.bankAccountFinance == "Yes"
  //   ? parseMoney(allQuestions?.bankAccountFinance?.[user + "Total"] || "$0")
  //   : 0) +
  //   (CRState.termDepositsFinance == "Yes"
  //     ? parseMoney(
  //         allQuestions?.termDepositsFinance?.[user + "Total"] || "$0",
  //       )
  //     : 0)) *
  // 0.03;
  const Interest = readFirstNumber(
    discoveryData?.bankAccountFinance?.[user + "Total"],
    discoveryData?.termDepositsFinance?.[user + "Total"],
   
  );
  // const DividendIncome =
  // ((CRState.australianShareMarket == "Yes"
  //   ? parseMoney(
  //       allQuestions?.australianShareMarket?.[user + "Total"] || "$0",
  //     )
  //   : 0) +
  //   (CRState.managedFund == "Yes"
  //     ? parseMoney(allQuestions?.managedFund?.[user + "Total"] || "$0")
  //     : 0)) *
  // 0.035;

  const DividendIncome = readFirstNumber(

    discoveryData?.australianShareMarket?.[user + "Total"],
    discoveryData?.managedFund?.[user + "Total"],
   
  );

  // const AnnutiesIncome =
  // CRState.annuitiesIssues == "Yes"
  //   ? allQuestions?.annuitiesIssues?.[user]?.reduce(
  //       (t, e) => t + parseMoney(e.annualAnnuityPayment || "$0"),
  //       0,
  //     )
  //   : 0;
  const AnnutiesIncome = readFirstNumber(
    discoveryData?.annuitiesIssues?.[user]?.reduce(
      (t, e) => t + parseFloat((e?.annualAnnuityPayment || "$0").replace(/[^0-9.-]+/g, "")),
      0,
    ),
   


  );

  const GeneralLivingExpensesTotal = readFirstNumber(
    discoveryData?.generalLivingExpenses?.total,
  );
  const FamilyHome = readFirstNumber(discoveryData?.FamilyHome?.currentValue);
  const InvestmentProperty = readFirstNumber(
    discoveryData?.investmentPropertyDetails?.propertyPortfolio,
  );
  const InvestmentPropertyLoan = readFirstNumber(
    discoveryData?.investmentPropertyDetails?.totalDebt,
  );
  const PersonalLoan = readFirstNumber(
    discoveryData?.personalLoanDetails?.clientTotal,
  );
  const CreditCards = readFirstNumber(discoveryData?.creditCardDetails?.clientTotal);
  const InvestmentLoan = readFirstNumber(
    discoveryData?.investmentLoanDetails?.clientTotal,
  );
  const SuperContributions = readFirstNumber(
    ownBusiness?.SalaryPackageModal?.salarySacrificeContributions,
    ownBusiness?.SalaryPackageModal?.afterTaxContributions,
  );

  return {
    [`${user}EmploymentIncome`]: toCommaAndDollar(EmploymentIncome),
    [`${user}NetBusinessIncome`]: toCommaAndDollar(NetBusinessIncome),
    [`${user}SuperPensionPayment`]: toCommaAndDollar(SuperPensionPayment),
    [`${user}LifeTimePensionPayment`]: toCommaAndDollar(LifeTimePensionPayment),
    [`${user}OverseasPensionPayment`]: toCommaAndDollar(OverseasPensionPayment),
    [`${user}CenterlinkPension`]: toCommaAndDollar(CenterlinkPension),
    [`${user}RentalIncome`]: toCommaAndDollar(RentalIncome),
    [`${user}Interest`]: toCommaAndDollar(Interest),
    [`${user}DividendIncome`]: toCommaAndDollar(DividendIncome),
    [`${user}AnnutiesIncome`]: toCommaAndDollar(AnnutiesIncome),

    ...(user === "client" && {
      [`${user}GeneralLivingExpensesTotal`]: toCommaAndDollar(
        GeneralLivingExpensesTotal,
      ),
      [`${user}FamilyHome`]: toCommaAndDollar(FamilyHome),
      [`${user}InvestmentProperty`]: toCommaAndDollar(InvestmentProperty),
      [`${user}InvestmentPropertyLoan`]: toCommaAndDollar(InvestmentPropertyLoan),
      [`${user}PersonalLoan`]: toCommaAndDollar(PersonalLoan),
      [`${user}CreditCards`]: toCommaAndDollar(CreditCards),
      [`${user}InvestmentLoan`]: toCommaAndDollar(InvestmentLoan),
      [`${user}SuperContributions`]: toCommaAndDollar(SuperContributions),
    }),

    [`${user}LessEstimatedTax`]: "$0",
  };
}

export function splitFullName(name) {
  if (!name || typeof name !== "string") {
    return { firstName: "", lastName: "" };
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function generatePersonalDetailsDocument({
  personalDetails,
  discoveryData,
  discoveryQuestions,
  goalsData,
  goalsQuestions,
  riskProfileData,
  sessionUser,
  templateFileName = "template.docx",
  downloadFileName,
} = {}) {
  const adviserName = sessionUser
    ? `${toSentenceCase(sessionUser?.firstName)} ${toSentenceCase(
        sessionUser?.lastName,
      )}`.trim()
    : "Guest";

  const adviserEmail = sessionUser?.email || "";
  const clientName =
    personalDetails?.client?.clientGivenName ||
    personalDetails?.client?.clientPreferredName ||
    "Client";

  const payload = {
    clientName,
    adviserName,
    adviserEmail,
    downloadDate: formatAuDate(),
    childitem: buildChildren(personalDetails),


    
    // Personal Details
    ...buildPersonalDetailSection(personalDetails, "client"),
    ...buildPersonalDetailSection(personalDetails, "partner"),
    // Employment Details
    ...buildEmploymentDetailSection(discoveryData, personalDetails, "client"),
    ...buildEmploymentDetailSection(discoveryData, personalDetails, "partner"),
    // Centrelink Details
    ...buildCenterlinkSection(discoveryData, "client"),
    ...buildCenterlinkSection(discoveryData, "partner"),
    // Wills
    ...buildWillSection(discoveryData, "client"),
    ...buildWillSection(discoveryData, "partner"),
    // POA
    ...buildPoaSection(discoveryData, "client"),
    ...buildPoaSection(discoveryData, "partner"),
    // Professional Advisers
    ...buildProfessionalAdviserSection(discoveryData, "client"),
    ...buildProfessionalAdviserSection(discoveryData, "partner"),
    // Income and Expenses
    ...buildIncomeAndExpensesSection(discoveryData, "client"),
    ...buildIncomeAndExpensesSection(discoveryData, "partner"),
    // Goals and Objectives (legacy-style `items` + user notes)
    ...buildGoalsAndObjectivesSection(goalsData, goalsQuestions, "client"),
    ...buildGoalsAndObjectivesSection(goalsData, goalsQuestions, "partner"),
    // Rich text / optional notes commonly used in templates
    scopeOfAdviceText: sanitizeHtmlToText(goalsData?.scopeOfAdvice || ""),
    goalsDescriptionText: sanitizeHtmlToText(goalsData?.description || ""),

    // Keep full stored data available for templates that use nested tags.
    // (These are populated when selecting a client in `HouseholdTable.jsx`.)
    discoveryData: discoveryData && typeof discoveryData === "object" ? discoveryData : {},
    discoveryQuestions:
      discoveryQuestions && typeof discoveryQuestions === "object"
        ? discoveryQuestions
        : {},
    goalsData: goalsData && typeof goalsData === "object" ? goalsData : {},
    goalsQuestions:
      goalsQuestions && typeof goalsQuestions === "object" ? goalsQuestions : {},
    riskProfileData:
      riskProfileData && typeof riskProfileData === "object"
        ? riskProfileData
        : {},
  };

  const resolvedName =
    downloadFileName || `Adviser Simplicity Fact Find of ${clientName}.docx`;

  return generateDocumentFromTemplate(payload, templateFileName, resolvedName);
}

