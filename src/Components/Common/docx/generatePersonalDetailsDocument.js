import {
  getUserDetail,
  getQuestionDetail,
  getGoalsDetail,
  getDefaultUrl,
  getLoggedInUserData,
  getGQState,
  getCRState,
  getBankDetail,
} from "../../../Store/recoilUtils";
import { content } from "../../../Content/Content";
import {
  convertDateAUWithDayJS,
  generateDocumentFromTemplate,
  GetAxios,
  openNotificationSuccess,
  RenderName,
  toCommaAndDollar,
  toSentenceCase,
} from "./Api";
import dayjs from "dayjs";

const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

const parseMoney = (value = "$0") =>
  Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;

function toIdNameMap(arr = []) {
  return arr.reduce((acc, { _id, platformName }) => {
    acc[_id] = platformName;
    return acc;
  }, {});
}

const RemoveSpan = (text) => {
  if (!text) return "";

  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim(); // remove leading/trailing spaces
};

function PerosonalDetail(personalDetails, user) {
  let PersonalDetails = {
    [user + "Title"]: personalDetails?.[user]?.[user + "Title"] || "",
    [user + "FirstName"]: personalDetails?.[user]?.[user + "GivenName"] || "",
    [user + "MiddleName"]: personalDetails?.[user]?.[user + "MiddleName"] || "",
    [user + "LastName"]: personalDetails?.[user]?.[user + "LastName"] || "",
    [user + "Preferred"]:
      personalDetails?.[user]?.[user + "PreferredName"] || "",
    [user + "Gender"]: personalDetails?.[user]?.[user + "Gender"] || "",
    [user + "Dob"]: personalDetails?.[user]?.[user + "DOB"]
      ? convertDateAUWithDayJS(personalDetails?.[user]?.[user + "DOB"])
      : "",
    [user + "Age"]: personalDetails?.[user]?.[user + "Age"] || "",

    [user + "Marital"]: personalDetails?.[user]?.[user + "MaritalStatus"] || "",
    [user + "Employment"]:
      personalDetails?.[user]?.[user + "EmploymentStatus"] || "",
    [user + "RetAge"]:
      personalDetails?.[user]?.[user + "PlannedRetirementAge"] || "",
    [user + "Health"]: personalDetails?.[user]?.[user + "Health"] || "",
    [user + "Smoker"]: personalDetails?.[user]?.[user + "Smoker"] || "",
    [user + "TaxRes"]:
      personalDetails?.[user]?.[user + "TaxResidentRadio"] || "",
    [user + "HealthCover"]:
      personalDetails?.[user]?.[user + "PrivateHealthCoverRadio"] || "",
    [user + "HelpDebt"]:
      personalDetails?.[user]?.[user + "HELPSDebtRadio"] || "",

    //contect details
    [user + "HomeAddress"]:
      personalDetails?.[user]?.[user + "HomeAddress"] || "",
    [user + "PostalAddress"]:
      personalDetails?.[user]?.[user + "PostalAddress"] || "",
    [user + "Mobile"]: personalDetails?.[user]?.[user + "Mobile"] || "",
    [user + "HomePhone"]: personalDetails?.[user]?.[user + "HomePhone"] || "",
    [user + "WorkPhone"]: personalDetails?.[user]?.[user + "WorkPhone"] || "",
    [user + "Email"]:
      personalDetails?.[user]?.[user == "client" ? "Email" : user + "Email"] ||
      "", // for Partner its partnerEmail
  };

  if (user === "client") {
    PersonalDetails.SingleClient = ["Single", "Widowed", ""].includes(
      personalDetails?.[user]?.[user + "MaritalStatus"] || "",
    );
    // PersonalDetails.SingleClient = true
  }

  return PersonalDetails;
}

function EmpoymentDetal(incomeFromOwnBusiness, personalDetails, user) {
  let EmpoymentDetals = {
    [user + "Occupation"]: incomeFromOwnBusiness?.[user]?.occupation || "",
    [user + "EmploymentStatus"]:
      incomeFromOwnBusiness?.[user]?.employmentStatus || "",
    [user + "NameOfCompany"]:
      incomeFromOwnBusiness?.[user]?.nameOfCompany || "",
    [user + "StartDate"]: incomeFromOwnBusiness?.[user]?.startDate
      ? convertDateAUWithDayJS(incomeFromOwnBusiness?.[user]?.startDate)
      : "",

    [user + "HoursWorked"]: incomeFromOwnBusiness?.[user]?.hoursWorked || "",
    [user + "GrossSalary"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackageModal?.grossSalary || "",
    [user + "SGC"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackageModal?.SGC || "",
    [user + "SalarySacrificeContributions"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackageModal
        ?.salarySacrificeContributions || "",
    [user + "AfterTaxContributions"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackageModal
        ?.afterTaxContributions || "",
    [user + "ChoiceOfFund"]: incomeFromOwnBusiness?.[user]?.choiceOfFund || "",
    //Salary Packaging Details
    [user + "EmployerFBTStatus"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackagingModal?.employerFBTStatus ||
      "",
    [user + "CreditCardMortgageRepayments"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackagingModal
        ?.creditCardMortgageRepayments || "",
    [user + "CostBaseOfCar"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackagingModal?.costBaseOfCar || "",
    [user + "FBTPaidByEmployer"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackagingModal?.FBTPaidByEmployer ||
      "",
    [user + "RunningCostsOfCar"]:
      incomeFromOwnBusiness?.[user]?.SalaryPackagingModal?.runningCostsOfCar ||
      "",

    //Leave Entitlements
    [user + "Annual"]:
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal
        ?.annualLeaveAmount || "") +
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal?.annualLeaveTime ||
        ""),

    [user + "Sick"]:
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal?.sickLeaveAmount ||
        "") +
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal?.sickLeaveTime ||
        ""),
    [user + "LongService"]:
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal
        ?.longServiceLeaveAmount || "") +
      (incomeFromOwnBusiness?.[user]?.LeaveEntitlementsModal
        ?.longServiceLeaveTime || ""),
  };

  EmpoymentDetals.coupleEmployment = !["Single", "Widowed", ""].includes(
    personalDetails?.[user]?.[user + "MaritalStatus"] || "",
  )
    ? incomeFromOwnBusiness?.owner?.includes("client") &&
      incomeFromOwnBusiness?.owner?.includes("partner")
      ? true
      : false
    : false;

  return EmpoymentDetals;
}

function Centerlink(incomeFromCentrelink, user) {
  let CenterlinkData = {
    [user + "CRN"]: incomeFromCentrelink?.[user]?.CRN || "",
    [user + "PaymentType"]: (
      incomeFromCentrelink?.[user]?.paymentType || [""]
    ).join(", "),
    [user + "FortnightlyPayment"]:
      incomeFromCentrelink?.[user]?.fortnightlyPayment || "",
    [user + "AnnualPaymentAmount"]:
      incomeFromCentrelink?.[user]?.annualPaymentAmount || "",
    [user + "CentrelinkCardsHeld"]: (
      incomeFromCentrelink?.[user]?.centrelinkCardsHeld || [""]
    ).join(","),
  };

  CenterlinkData.coupleCenterlink =
    incomeFromCentrelink?.owner?.includes("client") &&
    incomeFromCentrelink?.owner?.includes("partner")
      ? true
      : false;

  return CenterlinkData;
}

function Will(will, user) {
  let CenterlinkData = {
    [user + "Will"]: will?.owner && will?.owner.includes(user) ? "Yes" : "No",
    [user + "WillYearSetUp"]: will?.[user]?.yearSetUp || "",
    [user + "WillsCurrent"]: will?.[user]?.willsCurrent || "",
    [user + "ExecutorItems"]:
      will?.[user]?.executor.map((item, index) => {
        return {
          executorName: item?.name || "",
          executerRelationship: item?.relationshipStatus || "",
        };
      }) || [],
    [user + "EnduringGuardianship"]: will?.[user]?.enduringGuardianship || "",
    [user + "EstatePlanningRadio"]: will?.[user]?.estatePlanningRadio || "",
    [user + "description"]: will?.[user]?.estatePlanningdescription || "",
  };
  return CenterlinkData;
}

function INCOME_AND_EXPENSES(allQuestions, CRState, user) {
  const EmploymentIncome =
    CRState.incomeFromOwnBusiness == "Yes"
      ? parseMoney(
          allQuestions?.incomeFromOwnBusiness?.[user + "Total"] || "$0",
        )
      : 0;

  const NetBusinessIncome =
    (CRState.incomeFromSoleTrader == "Yes"
      ? parseMoney(allQuestions?.incomeFromSoleTrader?.[user + "Total"] || "$0")
      : 0) +
    (CRState.incomeFromPartnership == "Yes"
      ? parseMoney(
          allQuestions?.incomeFromPartnership?.[user + "Total"] || "$0",
        )
      : 0);

  const SuperPensionPayment =
    (CRState.accountBasedPensionIssues === "Yes" &&
    Array.isArray(allQuestions?.accountBasedPensionIssues?.[user])
      ? allQuestions.accountBasedPensionIssues[user].reduce(
          (t, e) =>
            t +
            parseFloat((e?.pensionPayment || "$0").replace(/[^0-9.-]+/g, "")),
          0,
        )
      : 0) +
    (CRState.SMSFPensionPhase === "Yes" &&
    Array.isArray(allQuestions?.SMSFPensionPhase?.[user])
      ? allQuestions.SMSFPensionPhase[user].reduce((Total, e) => {
          const clientSum = Array.isArray(e?.pensionBenefitsTotalArray)
            ? e.pensionBenefitsTotalArray.reduce(
                (benefitTotal, benefit) =>
                  benefitTotal + parseMoney(benefit?.pensionPayment || "$0"),
                0,
              )
            : 0;

          return Total + clientSum;
        }, 0)
      : 0);

  const LifeTimePensionPayment =
    CRState.incomeFromSuperPayment == "Yes"
      ? parseMoney(
          allQuestions?.incomeFromSuperPayment?.[user + "Total"] || "$0",
        )
      : 0;

  const OverseasPensionPayment =
    CRState.incomeFromOverseasPension == "Yes"
      ? parseMoney(
          allQuestions?.incomeFromOverseasPension?.[user + "Total"] || "$0",
        )
      : 0;

  const CenterlinkPension =
    CRState.incomeFromCentrelink == "Yes"
      ? parseMoney(allQuestions?.incomeFromCentrelink?.[user + "Total"] || "$0")
      : 0;

  const RentalIncome =
    CRState?.investmentPropertyDetails == "Yes" &&
    allQuestions?.investmentPropertyDetails?.client
      ? parseMoney(
          allQuestions?.investmentPropertyDetails?.client.reduce(
            (t, e) =>
              t +
              parseMoney(e.weeklyRentalIncome || "$0") *
                52 *
                (parseMoney(e?.[user + "Ownership"] || "0%") / 100),
            0,
          ),
        )
      : 0;

  const Interest =
    ((CRState.bankAccountFinance == "Yes"
      ? parseMoney(allQuestions?.bankAccountFinance?.[user + "Total"] || "$0")
      : 0) +
      (CRState.termDepositsFinance == "Yes"
        ? parseMoney(
            allQuestions?.termDepositsFinance?.[user + "Total"] || "$0",
          )
        : 0)) *
    0.03;

  const DividendIncome =
    ((CRState.australianShareMarket == "Yes"
      ? parseMoney(
          allQuestions?.australianShareMarket?.[user + "Total"] || "$0",
        )
      : 0) +
      (CRState.managedFund == "Yes"
        ? parseMoney(allQuestions?.managedFund?.[user + "Total"] || "$0")
        : 0)) *
    0.035;

  const AnnutiesIncome =
    CRState.annuitiesIssues == "Yes"
      ? allQuestions?.annuitiesIssues?.[user]?.reduce(
          (t, e) => t + parseMoney(e.annualAnnuityPayment || "$0"),
          0,
        )
      : 0;

  //following are just clientside expenses, partner side expenses are not included in document as of now
  const GeneralLivingExpensesTotal =
    CRState.incomeFromRegularLivingExpenses == "Yes"
      ? parseMoney(
          allQuestions?.generalLivingExpenses?.generalLivingExpensesTotal ||
            "$0",
        )
      : 0;

  const FamilyHome =
    CRState.familyHome == "Yes"
      ? parseMoney(
          allQuestions?.familyHome?.HomeLoanModal?.annualRepayments || "$0",
        )
      : 0;

  const InvestmentProperty =
    CRState.investmentPropertyDetails == "Yes"
      ? allQuestions?.investmentPropertyDetails?.[user]?.reduce(
          (t, e) => t + parseMoney(e.incomeExpenses || "$0"),
          0,
        )
      : 0;

  const InvestmentPropertyLoan =
    CRState.investmentPropertyDetails == "Yes"
      ? allQuestions?.investmentPropertyDetails?.[user]?.reduce(
          (t, e) =>
            t +
            parseMoney(
              e?.propertyLoanDetailsArray[0]?.AnnualRepayments || "$0",
            ),
          0,
        )
      : 0;

  const PersonalLoan =
    CRState.personalLoans == "Yes"
      ? allQuestions?.personalLoans?.[user]?.reduce(
          (t, e) => t + parseMoney(e.AnnualRepayments || "$0"),
          0,
        )
      : 0;

  const CreditCards =
    CRState.creditCards == "Yes"
      ? allQuestions?.creditCards?.[user]?.reduce(
          (t, e) => t + parseMoney(e.AnnualRepayments || "$0"),
          0,
        )
      : 0;

  const InvestmentLoan =
    (CRState.managedFundsLOC == "Yes"
      ? parseMoney(
          allQuestions?.managedFundsLOC?.client?.repaymentsAmount || "$0",
        ) +
        parseMoney(
          allQuestions?.managedFundsLOC?.partner?.repaymentsAmount || "$0",
        ) +
        parseMoney(
          allQuestions?.managedFundsLOC?.joint?.repaymentsAmount || "$0",
        )
      : 0) +
    (CRState.managedFundsMarginLoan == "Yes"
      ? parseMoney(
          allQuestions?.managedFundsMarginLoan?.client?.annualLoan || "$0",
        ) +
        parseMoney(
          allQuestions?.managedFundsMarginLoan?.partner?.annualLoan || "$0",
        ) +
        parseMoney(
          allQuestions?.managedFundsMarginLoan?.joint?.annualLoan || "$0",
        )
      : 0);

  const SuperContributions =
    CRState.incomeFromOwnBusiness == "Yes"
      ? parseMoney(
          allQuestions?.incomeFromOwnBusiness?.client?.SalaryPackageModal
            ?.salarySacrificeContributions || "$0",
        ) +
        parseMoney(
          allQuestions?.incomeFromOwnBusiness?.client?.SalaryPackageModal
            ?.afterTaxContributions || "$0",
        ) +
        parseMoney(
          allQuestions?.incomeFromOwnBusiness?.partner?.SalaryPackageModal
            ?.salarySacrificeContributions || "$0",
        ) +
        parseMoney(
          allQuestions?.incomeFromOwnBusiness?.partner?.SalaryPackageModal
            ?.afterTaxContributions || "$0",
        )
      : 0;

  let INCOME_AND_EXPENSES_Data = {
    [user + "EmploymentIncome"]: toCommaAndDollar(EmploymentIncome),
    [user + "NetBusinessIncome"]: toCommaAndDollar(NetBusinessIncome),
    [user + "SuperPensionPayment"]: toCommaAndDollar(SuperPensionPayment),
    [user + "LifeTimePensionPayment"]: toCommaAndDollar(LifeTimePensionPayment),
    [user + "OverseasPensionPayment"]: toCommaAndDollar(OverseasPensionPayment),
    [user + "CenterlinkPension"]: toCommaAndDollar(CenterlinkPension),
    [user + "RentalIncome"]: toCommaAndDollar(RentalIncome),
    [user + "Interest"]: toCommaAndDollar(Interest),
    [user + "DividendIncome"]: toCommaAndDollar(DividendIncome),
    [user + "AnnutiesIncome"]: toCommaAndDollar(AnnutiesIncome),

    // these are just for client's
    ...(user === "client" && {
      [user + "GeneralLivingExpensesTotal"]: toCommaAndDollar(
        GeneralLivingExpensesTotal,
      ),
      [user + "FamilyHome"]: toCommaAndDollar(FamilyHome),
      [user + "InvestmentProperty"]: toCommaAndDollar(InvestmentProperty),
      [user + "InvestmentPropertyLoan"]: toCommaAndDollar(
        InvestmentPropertyLoan,
      ),
      [user + "PersonalLoan"]: toCommaAndDollar(PersonalLoan),
      [user + "CreditCards"]: toCommaAndDollar(CreditCards),
      [user + "InvestmentLoan"]: toCommaAndDollar(InvestmentLoan),
      [user + "SuperContributions"]: toCommaAndDollar(SuperContributions),
    }), // if user is client then only include these expenses

    [user + "LessEstimatedTax"]: "$0", // need Varification
  };

  INCOME_AND_EXPENSES_Data[user + "TotalIncome"] = toCommaAndDollar(
    parseMoney(INCOME_AND_EXPENSES_Data[user + "EmploymentIncome"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "NetBusinessIncome"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "SuperPensionPayment"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "LifeTimePensionPayment"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "OverseasPensionPayment"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "CenterlinkPension"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "RentalIncome"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "Interest"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "DividendIncome"]) +
      parseMoney(INCOME_AND_EXPENSES_Data[user + "AnnutiesIncome"]),
  );
  if (user === "client") {
    INCOME_AND_EXPENSES_Data[user + "TotalExpanse"] = toCommaAndDollar(
      parseMoney(
        INCOME_AND_EXPENSES_Data[user + "GeneralLivingExpensesTotal"],
      ) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "FamilyHome"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "InvestmentProperty"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "InvestmentPropertyLoan"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "PersonalLoan"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "CreditCards"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "InvestmentLoan"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "SuperContributions"]) +
        parseMoney(INCOME_AND_EXPENSES_Data[user + "LessEstimatedTax"]),
    );
  }

  return INCOME_AND_EXPENSES_Data;
}

const SMSFCurrentBalance = (allQuestions, CRState) => {
  try {
    const parseNum = (val) =>
      val && typeof val === "string"
        ? parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0
        : typeof val === "number"
          ? val
          : 0;

    // Generic extractor: SMSFTotal → propertyPortfolio → totalDebt → client/partner/joint totals
    const pickTotal = (
      obj,
      prefer = [
        "SMSFTotal",
        "propertyPortfolio",
        "totalDebt",
        "clientTotal",
        "partnerTotal",
        "jointTotal",
      ],
    ) => {
      if (!obj) return 0;
      for (const field of prefer) {
        if (obj[field] !== undefined && obj[field] !== null) {
          return parseNum(obj[field]);
        }
      }
      return 0;
    };

    // -----------------------------
    // ✔ ASSET SECTIONS
    // -----------------------------
    const assetKeys = [
      // "SMSFAccumulationDetails",
      // "SMSFPensionPhase",
      "SMSFBank",
      "SMSFTermDeposits",
      "SMSFAustralianShares",
      "SMSFManagedFunds",
      "SMSFInvestmentProperties", // propertyPortfolio (asset)
      "SMSFOtherInvestment",
    ];

    // -----------------------------
    // ✔ LIABILITY SECTIONS
    // -----------------------------
    const liabilityKeys = [
      "SMSFInvestmentLoan",
      "SMSFInvestmentProperties", // totalDebt (liability)
    ];

    // -----------------------------
    // SUM ALL ASSETS
    // -----------------------------
    const assetsSum = assetKeys.reduce((acc, key) => {
      return (
        acc + pickTotal(CRState?.[key] === "Yes" ? allQuestions?.[key] : "$0")
      );
    }, 0);

    // -----------------------------
    // SUM ALL LIABILITIES
    // -----------------------------
    const liabilitiesSum = liabilityKeys.reduce((acc, key) => {
      return (
        acc +
        pickTotal(CRState?.[key] === "Yes" ? allQuestions?.[key] : "$0", [
          "totalDebt",
          "SMSFTotal",
          "propertyPortfolio",
        ])
      );
    }, 0);

    const netTotal = assetsSum - liabilitiesSum;

    return toCommaAndDollar(netTotal);
  } catch (error) {
    console.error("Error calculating SMSF totals:", error);
    return "$0";
  }
};

const FamilyInvestmentTrustCurrentBalance = (questionDetail, CRObject) => {
  {
    try {
      const parseNum = (val) =>
        val && typeof val === "string"
          ? parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0
          : typeof val === "number"
            ? val
            : 0;

      // helper: picks trustTotal → propertyPortfolio → totalDebt → clientTotal → partnerTotal → jointTotal
      const pickTotal = (
        obj,
        prefer = [
          "trustTotal",
          "propertyPortfolio",
          "totalDebt",
          "clientTotal",
          "partnerTotal",
          "jointTotal",
        ],
      ) => {
        if (!obj) return 0;
        for (const field of prefer) {
          if (obj[field] !== undefined && obj[field] !== null) {
            return parseNum(obj[field]);
          }
        }
        return 0;
      };

      // assets sections
      const assetKeys = [
        "familyBank",
        "familyTermDeposit",
        "familyAustralianShare",
        "familyMangedFunds",
        "familyInvestmentProperties", // propertyPortfolio is asset
        "familyOtherInvestment",
      ];

      // liability sections
      const liabilityKeys = [
        "familyInvestmentHomeLoan",
        "familyInvestmentProperties", // totalDebt is liability
      ];

      // sum assets
      const assetsSum = assetKeys.reduce((acc, key) => {
        return (
          acc +
          pickTotal(CRObject?.[key] === "Yes" ? questionDetail?.[key] : "$0")
        );
      }, 0);

      // sum liabilities
      const liabilitiesSum = liabilityKeys.reduce((acc, key) => {
        return (
          acc +
          pickTotal(CRObject?.[key] === "Yes" ? questionDetail?.[key] : "$0", [
            "totalDebt",
            "trustTotal",
            "propertyPortfolio",
          ])
        );
      }, 0);

      const netTotal = assetsSum - liabilitiesSum;
      return toCommaAndDollar(netTotal);
    } catch (error) {
      console.error("Error calculating Family total:", error);
      return "$0";
    }
  }
};

function Summary_of_Networth(allQuestions, CRState, personalDetails, user) {
  const get = (path, fallback = "$0") => path ?? fallback;

  const money = (val) => parseMoney(val || "$0");

  const sumKeys = (obj, keys) =>
    toCommaAndDollar(keys.reduce((acc, key) => acc + money(obj[key]), 0));

  const data = {};

  const maritalStatus = personalDetails?.client?.clientMaritalStatus || "";

  const isSingle = ["Single", "Widowed", ""].includes(maritalStatus);

  /* -------------------- Lifestyle Assets -------------------- */

  const lifestyleKeys = [
    "FamilyHomeCurrentValue",
    "CarCurrentValue",
    "ContentsCurrentValue",
    "BoatCurrentValue",
    "CaravanCurrentValue",
    "OtherAssetsCurrentValue",
  ];

  data[user + "FamilyHomeCurrentValue"] =
    user == "client" ? get(allQuestions?.familyHome?.currentValue) : "$0";
  data[user + "FamilyHomeLoanBalance"] =
    user == "client"
      ? get(allQuestions?.familyHome?.HomeLoanModal?.loanBalance)
      : "$0";

  data[user + "FamilyHomeAddress"] =
    (personalDetails?.client?.clientHomeAddress || "") +
    " (" +
    (allQuestions?.familyHome?.postCode || "") +
    ")";

  data[user + "CarCurrentValue"] = get(allQuestions?.car?.[user]?.currentValue);

  if (user == "client" && isSingle) {
    data[user + "ContentsCurrentValue"] = get(
      allQuestions?.houseHold?.joint?.currentValue,
    );

    data[user + "BoatCurrentValue"] = get(
      allQuestions?.boat?.joint?.currentValue,
    );

    data[user + "CaravanCurrentValue"] = get(
      allQuestions?.caravan?.joint?.currentValue,
    );
  } else {
    data[user + "ContentsCurrentValue"] = get(
      allQuestions?.houseHold?.[user]?.currentValue,
    );

    data[user + "BoatCurrentValue"] = get(
      allQuestions?.boat?.[user]?.currentValue,
    );

    data[user + "CaravanCurrentValue"] = get(
      allQuestions?.caravan?.[user]?.currentValue,
    );
  }

  data[user + "OtherAssetsCurrentValue"] = get(
    allQuestions?.otherAssets?.[user]?.currentValue,
  );

  data[user + "LifestyleTotal"] = sumKeys(
    data,
    lifestyleKeys.map((k) => user + k),
  );

  /* -------------------- Investment Assets -------------------- */

  const investmentStaticKeys = {
    BankAccountCurrentBalance:
      CRState?.bankAccountFinance == "Yes"
        ? allQuestions?.bankAccountFinance?.[user + "CurrentBalance"]
        : "$0",
    TermDepositsCurrentBalance:
      CRState?.termDepositsFinance == "Yes"
        ? allQuestions?.termDepositsFinance?.[user + "CurrentBalance"]
        : "$0",
    AustralianSharesCurrentBalance:
      CRState?.australianShareMarket == "Yes"
        ? allQuestions?.australianShareMarket?.[user + "CurrentBalance"]
        : "$0",
    PlatformInvestmentsCurrentBalance:
      CRState?.managedFund == "Yes"
        ? allQuestions?.managedFund?.[user + "CurrentBalance"]
        : "$0",
    InvestmentBondsCurrentBalance:
      CRState?.investmentBondFinance == "Yes"
        ? allQuestions?.investmentBondFinance?.[user + "CurrentBalance"]
        : "$0",
    SuperannuationCurrentBalance:
      CRState?.superAnnuationIssues == "Yes"
        ? allQuestions?.superAnnuationIssues?.[user + "CurrentBalance"]
        : "$0",
    AccountBasedPensionsCurrentBalance:
      CRState?.accountBasedPensionIssues == "Yes"
        ? allQuestions?.accountBasedPensionIssues?.[user + "CurrentBalance"]
        : "$0",
    AnnuitiesCurrentBalance:
      CRState?.annuitiesIssues == "Yes"
        ? allQuestions?.annuitiesIssues?.[user + "CurrentBalance"]
        : "$0",
  };

  Object.entries(investmentStaticKeys).forEach(([key, value]) => {
    data[user + key] = get(value);
  });

  /* ---- Investment Properties (Dynamic Loop instead of 10 manual lines) ---- */

  const propertyBalances = [];

  for (let i = 0; i < 10; i++) {
    const property = allQuestions?.investmentPropertyDetails?.client?.[i];

    const isFullOwnership = property?.[`${user}Ownership`] === "100.00%";

    let value = "$0";

    if (user !== "joint") {
      value = isFullOwnership ? (property?.CurrentValue ?? "$0") : "$0";
    } else {
      value =
        property?.[`clientOwnership`] !== "100.00%" &&
        property?.[`partnerOwnership`] !== "100.00%"
          ? (property?.CurrentValue ?? "$0")
          : "$0";
    }

    const key = `${user}InvestmentPropertyCurrentBalance${i + 1}`;

    data[key] = get(value);
    propertyBalances.push(key);

    // Loan Balance
    const loanKey = `${user}InvestmentPropertyLoanBalance${i + 1}`;

    if (user !== "joint") {
      data[loanKey] = isFullOwnership
        ? get(property?.propertyLoanDetails)
        : "$0";
    } else {
      data[loanKey] =
        property?.[`clientOwnership`] !== "100.00%" &&
        property?.[`partnerOwnership`] !== "100.00%"
          ? get(property?.propertyLoanDetails)
          : "$0";
    }

    if (user === "client") {
      // Address
      const addressKey = `${user}InvestmentPropertyaddress${i + 1}`;
      data[addressKey] = property?.PropertyAddress
        ? `${property.PropertyAddress} (${property?.postcodeSuburb || ""})`
        : "";
    }
  }

  const investmentKeys = [
    ...Object.keys(investmentStaticKeys).map((k) => user + k),
    ...propertyBalances,
  ];

  data[user + "InvestmentAssetsTotal"] = sumKeys(data, investmentKeys);

  /* -------------------- Business Assets -------------------- */

  data[user + "TradingCompanyCurrentBalance"] = get(
    allQuestions?.BusinessAsCompanyStructure?.[user + "CurrentBalance"],
  );

  data[user + "BusinessTrustCurrentBalance"] = get(
    allQuestions?.BusinessAsTrusts?.[user + "CurrentBalance"],
  );

  if (user === "client") {
    data[user + "SMSFCurrentBalance"] = SMSFCurrentBalance(
      allQuestions,
      CRState,
    );

    data[user + "InvestmentTrustCurrentBalance"] =
      FamilyInvestmentTrustCurrentBalance(allQuestions, CRState);

    data[user + "BusinessAssetsCurrentBalance"] = sumKeys(data, [
      user + "TradingCompanyCurrentBalance",
      user + "BusinessTrustCurrentBalance",
      user + "SMSFCurrentBalance",
      user + "InvestmentTrustCurrentBalance",
    ]);
  } else {
    data[user + "BusinessAssetsCurrentBalance"] = sumKeys(data, [
      user + "TradingCompanyCurrentBalance",
      user + "BusinessTrustCurrentBalance",
    ]);
  }

  /* -------------------- Liabilities -------------------- */

  const liabilityKeys = [];

  if (user === "client" && isSingle) {
    data[user + "LiabilityCreditCards"] = get(
      allQuestions?.creditCards?.[user + "Total"],
    );
    data[user + "PersonalLoans"] = get(
      allQuestions?.personalLoans?.[user + "Total"],
    );

    data["jointLiabilityCreditCards"] = "$0";
    data["jointPersonalLoans"] = "$0";
  } else if (user === "joint" && !isSingle) {
    data["clientLiabilityCreditCards"] = "$0";
    data["clientPersonalLoans"] = "$0";
    data[user + "LiabilityCreditCards"] = get(
      allQuestions?.creditCards?.["clientTotal"],
    );
    data[user + "PersonalLoans"] = get(
      allQuestions?.personalLoans?.["clientTotal"],
    );
  }

  liabilityKeys.push(user + "LiabilityCreditCards", user + "PersonalLoans");

  for (let i = 1; i <= 10; i++) {
    liabilityKeys.push(`${user}InvestmentPropertyLoanBalance${i}`);
  }

  data[user + "InvestmentLoanBalance"] =
    get(allQuestions?.managedFundsLOC?.[user]?.loanBalance) || "$0";

  data[user + "MarginLoanBalance"] =
    get(allQuestions?.managedFundsMarginLoan?.[user]?.loanBalance) || "$0";

  liabilityKeys.push(
    user + "InvestmentLoanBalance",
    user + "MarginLoanBalance",
    user + "FamilyHomeLoanBalance",
  );

  data[user + "LiabilitiesTotal"] = sumKeys(data, liabilityKeys);

  return data;
}

function generateUserFinancialPortfolioData(
  allQuestions,
  CRState,
  personalDetails,
  user,
) {
  const bankDetailObj = getBankDetail();

  /* ------------------ Helpers ------------------ */

  const mapArray = (arr, mapper) =>
    Array.isArray(arr) && arr.length > 0 ? arr.map(mapper) : [];

  const resolvePlatformName = (map, id) => map?.[id] || "";

  const resolveInvestmentOption = (collection, platformId, optionId) => {
    const platform = collection.find((e) => e._id === platformId);
    const offer = platform?.arrayOfOffers?.find((e) => e._id === optionId);
    return offer?.investmentName || "";
  };

  const mapBeneficiaries = (item) =>
    mapArray(
      item?.nominatedBeneficiariesDetails?.nominatedBeneficiariesArray,
      (e) => ({
        relationshipStatus: e.relationshipStatus || "",
        shareBenefit: e.shareBenefit || "0.00%",
      }),
    );

  const calculateInsuranceTotal = (details = {}) =>
    toCommaAndDollar(
      parseMoney(details.lifeCover || "$0") +
        parseMoney(details.TPDCover || "$0") +
        parseMoney(details.monthlyIncome || "$0"),
    );

  /* ------------------ Bank Maps ------------------ */

  const bankMaps = {
    banks: toIdNameMap(bankDetailObj.FinancialInstitutions),
    platforms: toIdNameMap(bankDetailObj.InvestmentPlatforms),
    bonds: toIdNameMap(bankDetailObj.InvestmentBonds),
    superFunds: toIdNameMap(bankDetailObj.SuperannuationFunds),
    pensions: toIdNameMap(bankDetailObj.AccountBasedPensions),
    annuities: toIdNameMap(bankDetailObj.Annuities),
  };

  /* ------------------ Data Builder ------------------ */

  const data = {};

  if (user === "SMSF") {
    /* ------------------ SMSF Builder ------------------ */

    /* ---- Bank Accounts ---- */

    data[user + "BankAccounts"] =
      CRState?.SMSFBank == "Yes"
        ? mapArray(allQuestions?.SMSFBank?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "TermDeposits"] =
      CRState?.SMSFTermDeposits == "Yes"
        ? mapArray(allQuestions?.SMSFTermDeposits?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "AustralianShare"] =
      CRState?.SMSFAustralianShares == "Yes"
        ? allQuestions?.SMSFAustralianShares?.[user] || []
        : [];

    /* ---- Platform Investments ---- */

    data[user + "PlatFromInvestment"] =
      CRState?.SMSFManagedFunds == "Yes"
        ? mapArray(allQuestions?.SMSFManagedFunds?.[user], (item) => ({
            ...item,
            platformName: resolvePlatformName(
              bankMaps.platforms,
              item.platformName,
            ),
            owner: personalDetails?.client?.["clientPreferredName"] || "",
            portfolioValueArray: mapArray(
              item.portfolioValueArray,
              (element) => ({
                ...element,
                investmentOption: resolveInvestmentOption(
                  bankDetailObj.InvestmentPlatforms,
                  item.platformName,
                  element.investmentOption,
                ),
              }),
            ),
          }))
        : [];

    return data;
  }

  if (user === "trust") {
    /* ------------------ Trust Builder ------------------ */

    /* ---- Bank Accounts ---- */

    data[user + "BankAccounts"] =
      CRState?.familyBank == "Yes"
        ? mapArray(allQuestions?.familyBank?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "TermDeposits"] =
      CRState?.familyTermDeposit == "Yes"
        ? mapArray(allQuestions?.familyTermDeposit?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "AustralianShare"] =
      CRState?.familyAustralianShare == "Yes"
        ? allQuestions?.familyAustralianShare?.[user] || []
        : [];

    /* ---- Platform Investments ---- */

    data[user + "PlatFromInvestment"] =
      CRState?.familyMangedFunds == "Yes"
        ? mapArray(allQuestions?.familyMangedFunds?.[user], (item) => ({
            ...item,
            platformName: resolvePlatformName(
              bankMaps.platforms,
              item.platformName,
            ),
            owner: personalDetails?.client?.["clientPreferredName"] || "",
            portfolioValueArray: mapArray(
              item.portfolioValueArray,
              (element) => ({
                ...element,
                investmentOption: resolveInvestmentOption(
                  bankDetailObj.InvestmentPlatforms,
                  item.platformName,
                  element.investmentOption,
                ),
              }),
            ),
          }))
        : [];

    return data;
  }

  const ownerName = personalDetails?.[user]?.[user + "PreferredName"] || "";

  /* ---- Bank Accounts ---- */

  data[user + "BankAccounts"] =
    CRState?.bankAccountFinance == "Yes"
      ? mapArray(allQuestions?.bankAccountFinance?.[user], (item) => ({
          ...item,
          Institution: bankMaps.banks[item.Institution],
        }))
      : [];

  data[user + "TermDeposits"] =
    CRState?.bankAccountFinance == "Yes"
      ? mapArray(allQuestions?.termDepositsFinance?.[user], (item) => ({
          ...item,
          Institution: bankMaps.banks[item.Institution],
        }))
      : [];

  data[user + "AustralianShare"] =
    CRState?.australianShareMarket == "Yes"
      ? allQuestions?.australianShareMarket?.[user] || []
      : [];

  /* ---- Platform Investments ---- */

  data[user + "PlatFromInvestment"] =
    CRState?.managedFund == "Yes"
      ? mapArray(allQuestions?.managedFund?.[user], (item) => ({
          ...item,
          platformName: resolvePlatformName(
            bankMaps.platforms,
            item.platformName,
          ),
          owner: ownerName,
          portfolioValueArray: mapArray(
            item.portfolioValueArray,
            (element) => ({
              ...element,
              investmentOption: resolveInvestmentOption(
                bankDetailObj.InvestmentPlatforms,
                item.platformName,
                element.investmentOption,
              ),
            }),
          ),
        }))
      : [];

  /* ---- Investment Bonds ---- */

  data[user + "InvestmentBond"] =
    CRState?.investmentBondFinance == "Yes"
      ? mapArray(allQuestions?.investmentBondFinance?.[user], (item) => ({
          ...item,
          platformName: resolvePlatformName(bankMaps.bonds, item.platformName),
          owner: ownerName,
          portfolioValueArray: mapArray(
            item.portfolioValueArray,
            (element) => ({
              ...element,
              investmentOption: resolveInvestmentOption(
                bankDetailObj.InvestmentBonds,
                item.platformName,
                element.investmentOption,
              ),
            }),
          ),
        }))
      : [];

  if (user !== "joint") {
    /* ---- Super Funds ---- */

    data[user + "SuperFund"] =
      CRState?.superAnnuationIssues == "Yes"
        ? mapArray(allQuestions?.superAnnuationIssues?.[user], (item) => {
            const details = item?.balanceBenefitDetails || {};
            const groupInsuranceDetails = item?.groupInsuranceDetails || {};

            return {
              platformName: resolvePlatformName(
                bankMaps.superFunds,
                item.platformName,
              ),
              memberName: ownerName,
              memberNumber: item?.memberNumber || "",
              fundType: details.fundType || "",
              commencementDate:
                convertDateAUWithDayJS(details.commencementDate) || "",
              eligibleServiceDate:
                convertDateAUWithDayJS(details.eligibleServiceDate) || "",
              portfolioValue: details.portfolioValue || "",
              taxFreeComponent: details.taxFreeComponent || "",
              taxableComponent: details.taxableComponent || "",
              preservedAmount: details.preservedAmount || "",
              restrictedNonPreserved: details.restrictedNonPreserved || "",
              unrestrictedNonPreserved: details.unrestrictedNonPreserved || "",
              portfolioValueArray: mapArray(
                item?.balanceBenefitDetails?.portfolioValueArray,
                (element) => ({
                  ...element,
                  investmentOption: resolveInvestmentOption(
                    bankDetailObj.SuperannuationFunds,
                    item.platformName,
                    element.investmentOption,
                  ),
                }),
              ),
              annualAdvice: item?.annualAdvice || "",
              contributionsArrayNonConcessional:
                item?.contributionsArray && item?.contributionsArray.length > 0
                  ? item?.contributionsArray
                      ?.map((e, i) => {
                        return {
                          year: item?.contributionsStartYear + i + 1,
                          nonConcessionalContributions:
                            e.nonConcessionalContributions || "$0",
                        };
                      })
                      .slice(-3)
                  : [],

              contributionsArrayConcessional:
                item?.contributionsArray && item?.contributionsArray.length > 0
                  ? item?.contributionsArray
                      ?.map((e, i) => {
                        return {
                          year: item?.contributionsStartYear + i + 1,
                          totalConcessional: e.totalConcessional || "$0",
                        };
                      })
                      .slice(-6)
                  : [],
              coverType: groupInsuranceDetails?.coverType || "",
              coverType2: groupInsuranceDetails?.coverType2 || "",
              lifeCover: groupInsuranceDetails?.lifeCover || "",
              TPDCover: groupInsuranceDetails?.TPDCover || "",
              monthlyIncome: groupInsuranceDetails?.monthlyIncome || "",
              waitingPeriod: groupInsuranceDetails?.waitingPeriod || "",
              BenefitPeriod: groupInsuranceDetails?.BenefitPeriod || "",
              TotalInsuranceCost: calculateInsuranceTotal(
                groupInsuranceDetails,
              ),
              nominationType:
                item?.nominatedBeneficiariesDetails?.nominationType || "",
              nominatedBeneficiariesArray: mapBeneficiaries(item),
            };
          })
        : [];

    /* ---- Account Based Pensions ---- */

    data[user + "AccountBasedPensions"] =
      CRState?.accountBasedPensionIssues == "Yes"
        ? mapArray(allQuestions?.accountBasedPensionIssues?.[user], (item) => {
            const details = item?.balanceBenefitDetails || {};

            return {
              platformName: resolvePlatformName(
                bankMaps.pensions,
                item.platformName,
              ),
              memberName: ownerName,
              memberNumber: item?.memberNumber || "",
              fundType: details.fundType || "",
              commencementDate:
                convertDateAUWithDayJS(details.commencementDate) || "",
              eligibleServiceDate:
                convertDateAUWithDayJS(details.eligibleServiceDate) || "",
              portfolioValue: details?.portfolioValue || "",
              taxFreeComponent: details?.taxFreeComponent || "",
              taxableComponent: details?.taxableComponent || "",
              restrictedNonPreserved: details?.restrictedNonPreserved || "",
              unrestrictedNonPreserved: details?.unrestrictedNonPreserved || "",
              preservedAmount: details?.preservedAmount || "",
              purchasePrice: details?.purchasePrice || "",
              pensionPayment: item?.pensionPayment || "",
              annualAdvice: item?.annualAdvice || "",
              portfolioValueArray: mapArray(
                item?.balanceBenefitDetails?.portfolioValueArray,
                (element) => ({
                  ...element,
                  investmentOption: resolveInvestmentOption(
                    bankDetailObj.AccountBasedPensions,
                    item.platformName,
                    element.investmentOption,
                  ),
                }),
              ),
              nominationType:
                item?.nominatedBeneficiariesDetails?.nominationType || "",
              nominatedBeneficiariesArray: mapBeneficiaries(item),
            };
          })
        : [];

    /* ---- Annuities ---- */

    data[user + "Annuities"] =
      CRState?.annuitiesIssues == "Yes"
        ? mapArray(allQuestions?.annuitiesIssues?.[user], (item) => ({
            productProvider: resolvePlatformName(
              bankMaps.annuities,
              item.productProvider,
            ),
            memberName: ownerName,
            accountNumber: item?.accountNumber || "",
            sourceFunds: item?.sourceFunds || "",
            annuityType: item?.annuityType || "",
            term: item?.term || "",
            yearsMaturity: item?.yearsMaturity || "",
            originalInvestmentAmount: item?.originalInvestmentAmount || "",
            returnCapitalValue: item?.returnCapitalValue || "",
            annualAnnuityPayment: item?.annualAnnuityPayment || "",
            annualAdvice: item?.annualAdvice || "",
            nominationType:
              item?.nominatedBeneficiariesDetails?.nominationType || "",
            nominatedBeneficiariesArray: mapBeneficiaries(item),
          }))
        : [];

    /* ---- TRADING COMPANY ---- */

    data[user + "TradingCompany"] =
      CRState?.BusinessAsCompanyStructure == "Yes"
        ? mapArray(
            allQuestions?.BusinessAsCompanyStructure?.[user],
            (item) => ({
              ...item,
              owner: ownerName,
            }),
          )
        : [];

    /* ---- BUSINESS TRUST ---- */

    data[user + "BusinessTrust"] =
      CRState?.BusinessAsTrusts == "Yes"
        ? mapArray(allQuestions?.BusinessAsTrusts?.[user], (item) => ({
            ...item,
            owner: ownerName,
            isTrusteeTypeCorporate: item?.trusteeType === "Corporate",
          }))
        : [];
  }

  return data;
}

function calculateSuperAndSMSFSums({
  payload,
  allQuestions,
  minNCC = 3,
  minCC = 6,
}) {
  /* -------------------- Helpers -------------------- */

  const padArray = (arr, minLength, templateFn) => {
    if (!Array.isArray(arr)) return [];

    const result = [...arr];

    while (result.length < minLength) {
      result.unshift(templateFn(result[0]));
    }

    return result;
  };

  const sumByIndex = (funds, key, index) =>
    (funds || []).reduce((sum, fund) => {
      return (
        sum +
        parseMoney(
          fund?.[key]?.[index]?.[
            key === "contributionsArrayConcessional"
              ? "totalConcessional"
              : "nonConcessionalContributions"
          ] || "$0",
        )
      );
    }, 0);

  /* -------------------- Normalize Super Funds -------------------- */

  if (Array.isArray(payload?.clientSuperFund)) {
    payload.clientSuperFund.forEach((fund) => {
      fund.contributionsArrayNonConcessional = padArray(
        fund?.contributionsArrayNonConcessional,
        minNCC,
        (first) => ({
          nonConcessionalContributions: "$0",
          year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
        }),
      );

      fund.contributionsArrayConcessional = padArray(
        fund?.contributionsArrayConcessional,
        minCC,
        (first) => ({
          totalConcessional: "$0",
          year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
        }),
      );
    });
  }

  /* -------------------- Normalize SMSF -------------------- */

  let SMSFArray =
    allQuestions?.SMSFAccumulationDetails?.client?.[0]?.contributionsArray ||
    [];

  SMSFArray = padArray(SMSFArray, minCC, () => ({
    totalConcessional: "$0",
    nonConcessionalContributions: "$0",
  }));

  /* -------------------- Calculate NCC (3 years) -------------------- */

  for (let i = 0; i < minNCC; i++) {
    payload[`clientSumOfNCCSuperAndSMSF${i + 1}`] = toCommaAndDollar(
      sumByIndex(
        payload.clientSuperFund,
        "contributionsArrayNonConcessional",
        i,
      ) +
        parseMoney(
          SMSFArray.at(-(minNCC - i))?.nonConcessionalContributions || "$0",
        ),
    );
  }

  /* -------------------- Calculate CC (6 years) -------------------- */

  for (let i = 0; i < minCC; i++) {
    payload[`clientSumOfCCSuperAndSMSF${i + 1}`] = toCommaAndDollar(
      sumByIndex(payload.clientSuperFund, "contributionsArrayConcessional", i) +
        parseMoney(SMSFArray.at(-(minCC - i))?.totalConcessional || "$0"),
    );
  }

  return payload;
}

function buildLifeTPDTraumaArray(policies = [], providerMap = {}, owner) {
  if (!Array.isArray(policies) || policies.length === 0) return [];

  const chunkSize = 4;

  // Helper: split array into chunks of 4
  const chunkArray = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );

  const chunks = chunkArray(policies, chunkSize);

  return chunks.map((chunk, chunkIndex) => {
    const obj = {};

    chunk.forEach((policy, index) => {
      const position = index + 1;
      const globalPolicyNumber = chunkIndex * chunkSize + position;

      obj[`showPolicy${position}`] = true;
      obj[`policyCount${position}`] = globalPolicyNumber;

      obj[`policyOwner${position}`] = ["client", "partner"].includes(
        policy?.Owner,
      )
        ? RenderName(policy?.Owner) || ""
        : policy?.Owner;
      obj[`lifeInsured${position}`] = RenderName(owner) || "";
      obj[`provider${position}`] =
        providerMap?.[policy?.provider] || policy?.provider || "";

      obj[`policyNumber${position}`] = policy?.policyNo || "";
      obj[`startDate${position}`] =
        convertDateAUWithDayJS(policy?.startDate) || "";
      obj[`renewalMonth${position}`] = policy?.startDate
        ? dayjs(policy.startDate).format("MMMM")
        : "";
      obj[`smoker${position}`] = policy?.smoker || "";

      obj[`lifeCover${position}`] =
        policy?.LifeTPDTraumaDetails?.life || policy?.life || "$0";

      obj[`TPDCover${position}`] =
        policy?.LifeTPDTraumaDetails?.TPD || policy?.TPD || "$0";

      obj[`Trauma${position}`] =
        policy?.LifeTPDTraumaDetails?.trauma || policy?.trauma || "$0";

      obj[`premiumPa${position}`] = toCommaAndDollar(
        parseMoney(policy?.premiumsDetails?.life || "$0") +
          parseMoney(policy?.premiumsDetails?.tpd || "$0") +
          parseMoney(policy?.premiumsDetails?.trauma || "$0"),
      );

      obj[`payeeOfPremiums${position}`] =
        policy?.premiumsDetails?.payeeOfPremiums || "";
      obj[`premiumtype${position}`] =
        policy?.LifeTPDTraumaDetails?.premiumType || "";

      obj[`TPDDefinition${position}`] =
        policy?.LifeTPDTraumaDetails?.TPDDefinition || "";

      obj[`traumaPlus${position}`] =
        policy?.LifeTPDTraumaDetails?.traumaPlus || "";

      obj[`CPI${position}`] = policy?.LifeTPDTraumaDetails?.CPI || "";

      obj[`superLinked${position}`] =
        policy?.LifeTPDTraumaDetails?.superlinked || "";

      obj[`loadingOrExclusions${position}`] = policy?.loadingExclusion || "";

      obj[`beneficiaryType${position}`] = policy?.beneficiary || "";
    });

    // Fill empty slots (if less than 4 in last chunk)
    for (let i = chunk.length + 1; i <= chunkSize; i++) {
      obj[`showPolicy${i}`] = false;
    }

    return obj;
  });
}

function buildSMSFObject(clientData, partnerData) {
  const client = clientData || {};
  const partner = partnerData || {};

  const clientAccum = client?.accumulationBenefitsArray?.[0] || {};

  const partnerAccum = partner?.accumulationBenefitsArray?.[0] || {};

  // ---- Build Client Object ----
  const clientObj = {
    currentBalance: clientAccum?.currentBalance || "",

    eligibleServiceDate:
      convertDateAUWithDayJS(clientAccum?.eligibleServiceDate) || "",
    commencementDate:
      convertDateAUWithDayJS(clientAccum?.commencementDate) || "",

    taxFreeComponent: clientAccum?.taxFreeComponent || "",
    taxableComponent: clientAccum?.taxableComponent || "",
    restrictedNonPreserved: clientAccum?.restrictedNonPreserved || "",
    unRestrictedNonPreserved: clientAccum?.unRestrictedNonPreserved || "",
    preservedAmount: clientAccum?.preservedAmount || "",
  };

  // ---- Build Partner Object ----
  const partnerObj = {
    currentBalance: partnerAccum?.currentBalance || "",

    eligibleServiceDate:
      convertDateAUWithDayJS(partnerAccum?.eligibleServiceDate) || "",
    commencementDate:
      convertDateAUWithDayJS(partnerAccum?.commencementDate) || "",

    taxFreeComponent: partnerAccum?.taxFreeComponent || "",
    taxableComponent: partnerAccum?.taxableComponent || "",
    restrictedNonPreserved: partnerAccum?.restrictedNonPreserved || "",
    unRestrictedNonPreserved: partnerAccum?.unRestrictedNonPreserved || "",
    preservedAmount: partnerAccum?.preservedAmount || "",
  };

  // ---- Build Contribution Arrays ----
  const maxYears = Math.max(
    client?.contributionsArray?.length || 0,
    partner?.contributionsArray?.length || 0,
  );

  // ---- Build Contribution Arrays (Year-Based Merge) ----

  // Create maps by year
  const clientMap = {};
  const partnerMap = {};

  (client?.contributionsArray?.newEntries || []).forEach((item, index) => {
    const year = (client?.contributionsStartYear || 0) + index + 1;
    clientMap[year] = item;
  });

  (partner?.contributionsArray?.newEntries || []).forEach((item, index) => {
    const year = (partner?.contributionsStartYear || 0) + index + 1;
    partnerMap[year] = item;
  });

  // Collect all unique years
  const allYears = [
    ...new Set([...Object.keys(clientMap), ...Object.keys(partnerMap)]),
  ].sort((a, b) => a - b);

  const nonConcessionalArray = [];
  const ConcessionalArray = [];

  allYears.forEach((year) => {
    nonConcessionalArray.push({
      year: Number(year),
      clientNonConcessionalContributions:
        clientMap[year]?.nonConcessionalContributions || "$0",
      partnerNonConcessionalContributions:
        partnerMap[year]?.nonConcessionalContributions || "$0",
    });

    ConcessionalArray.push({
      year: Number(year),
      clientConcessionalContributions:
        clientMap[year]?.totalConcessional || "$0",
      partnerConcessionalContributions:
        partnerMap[year]?.totalConcessional || "$0",
    });
  });

  if (nonConcessionalArray.length > 0 && nonConcessionalArray.length < 3) {
    for (let i = nonConcessionalArray.length; i < 3; i++) {
      nonConcessionalArray.unshift({
        clientNonConcessionalContributions: "$0",
        partnerNonConcessionalContributions: "$0",
        year:
          nonConcessionalArray[0].year - 1 ||
          new Date().getFullYear() - (3 - i),
      });
    }
  }

  if (ConcessionalArray.length > 0 && ConcessionalArray.length < 6) {
    for (let i = ConcessionalArray.length; i < 6; i++) {
      ConcessionalArray.unshift({
        clientConcessionalContributions: "$0",
        partnerConcessionalContributions: "$0",
        year:
          ConcessionalArray[0].year - 1 || new Date().getFullYear() - (3 - i),
      });
    }
  }

  return {
    SMSFAccumulation_nonConcessionalArray: nonConcessionalArray,
    SMSFAccumulation_ConcessionalArray: ConcessionalArray,

    SMSFAccumulation_client_currentBalance: clientObj.currentBalance,
    SMSFAccumulation_client_eligibleServiceDate: clientObj.eligibleServiceDate,
    SMSFAccumulation_client_commencementDate: clientObj.commencementDate,
    SMSFAccumulation_client_taxFreeComponent: clientObj.taxFreeComponent,
    SMSFAccumulation_client_taxableComponent: clientObj.taxableComponent,
    SMSFAccumulation_client_restrictedNonPreserved:
      clientObj.restrictedNonPreserved,
    SMSFAccumulation_client_unRestrictedNonPreserved:
      clientObj.unRestrictedNonPreserved,
    SMSFAccumulation_client_preservedAmount: clientObj.preservedAmount,

    SMSFAccumulation_partner_currentBalance: partnerObj.currentBalance,
    SMSFAccumulation_partner_eligibleServiceDate:
      partnerObj.eligibleServiceDate,
    SMSFAccumulation_partner_commencementDate: partnerObj.commencementDate,
    SMSFAccumulation_partner_taxFreeComponent: partnerObj.taxFreeComponent,
    SMSFAccumulation_partner_taxableComponent: partnerObj.taxableComponent,
    SMSFAccumulation_partner_restrictedNonPreserved:
      partnerObj.restrictedNonPreserved,
    SMSFAccumulation_partner_unRestrictedNonPreserved:
      partnerObj.unRestrictedNonPreserved,
    SMSFAccumulation_partner_preservedAmount: partnerObj.preservedAmount,
  };
}

const generatePersonalDetailsDocument = async (id, FileName = "template.docx") => {
  try {
    console.log("Document generation started for ID:", id);

    const defaultUrl = getDefaultUrl();

    let personalDetails = getUserDetail();
    let allQuestions = getQuestionDetail();
    let goalsAndObjective = getGoalsDetail();
    let LoggedInUser = getLoggedInUserData();
    let GQState = getGQState();
    let CRState = getCRState();
    let bankDetailObj = getBankDetail();

    const requests = [];

    // Personal Details
    if (isEmptyObject(personalDetails) || personalDetails?._id !== id) {
      requests.push(
        GetAxios(`${defaultUrl}/api/personalDetails/getUserById/${id}`).then(
          (res) => {
            if (!isEmptyObject(res)) personalDetails = res;
          },
        ),
      );
    }

    // Questions Yes/No
    if (isEmptyObject(CRState) || CRState.clientFK !== id) {
      requests.push(
        GetAxios(`${defaultUrl}/api/questions/${id}`).then((res) => {
          if (!isEmptyObject(res)) CRState = res;
        }),
      );
    }

    // Questions
    if (
      isEmptyObject(allQuestions) ||
      Object.values(allQuestions).some(
        (q) => q && Object.keys(q).length > 0 && q.clientFK === id,
      )
    ) {
      requests.push(
        GetAxios(`${defaultUrl}/api/dataOfAllSection/${id}`).then((res) => {
          if (!isEmptyObject(res)) allQuestions = res;
        }),
      );
    }

    // Goals & Objectives
    if (
      isEmptyObject(goalsAndObjective) ||
      Object.values(goalsAndObjective).some(
        (q) => q && Object.keys(q).length > 0 && q.clientFK === id,
      )
    ) {
      requests.push(
        GetAxios(`${defaultUrl}/api/CombinedGoalsAndObjectives/${id}`).then(
          (res) => {
            if (!isEmptyObject(res)) goalsAndObjective = res;
          },
        ),
      );
    }

    // Goals & Objectives
    if (isEmptyObject(GQState) || GQState.clientFK !== id) {
      requests.push(
        GetAxios(`${defaultUrl}/api/goalsQuestions/getByClient/${id}`)
          .then((res) => {
            if (!isEmptyObject(res)) {
              GQState = res;
            }
          })
          .catch((error) => {
            console.log(error);
            GQState = {};
          }),
      );
    }

    // Run missing API calls in parallel
    await Promise.all(requests);

    console.log("Final Data →", {
      personalDetails,
      allQuestions,
      CRState,
      goalsAndObjective,
      GQState,
      contect: content.GoalsAndObjectives,
    });

    let adviserName =
      LoggedInUser &&
      typeof LoggedInUser === "object" &&
      Object.keys(LoggedInUser).length > 0
        ? `${toSentenceCase(LoggedInUser.firstName || "")} ${toSentenceCase(
            LoggedInUser.lastName || "",
          )}`.trim()
        : "Guest";

    let adviserEmail = LoggedInUser.email;

    const expenseTypes = [
      { name: "Rent", id: "houseHoldRent" },
      { name: "Gas", id: "houseHoldGas" },
      { name: "Electricity", id: "houseHoldElectricity" },
      { name: "Water Rates", id: "houseHoldWaterRates" },
      { name: "Council Rates", id: "houseHoldCouncilRates" },
      { name: "Phone", id: "houseHoldPhone" },
      { name: "Food", id: "houseHoldFood" },
      { name: "Internet", id: "houseHoldInternet" },
      { name: "Other", id: "houseHoldOthers" },
    ];

    const personalExpenses = [
      { name: "Clothing", id: "personalClothing" },
      { name: "Cigarettes", id: "personalCigarettes" },
      { name: "Alcohol", id: "personalAlcohol" },
      { name: "Subscription Fees", id: "personalSubscriptionFees" },
      { name: "Memberships & Clubs", id: "personalClubMemberships" },
      { name: "Holidays", id: "personalHolidays" },
      { name: "Dining Out", id: "personalDiningOut" },
      { name: "Mobile Phone", id: "personalMobilePhone" },
      { name: "Medical Expenses", id: "personalMedicalExpenses" },
      { name: "Other", id: "personalOthers" },
    ];

    const transportExpenses = [
      { name: "Petrol", id: "transportPetrol" },
      { name: "Car Maintenance", id: "transportCarRepair" },
      { name: "Car Registration", id: "transportCarRegistration" },
      { name: "Public Transport", id: "publicTransport" },
      { name: "Other", id: "transportOthers" },
    ];

    const insuranceExpenses = [
      { name: "Home And Contents", id: "insuranceHomeContents" },
      { name: "Car", id: "insuranceCar" },
      { name: "Private Health", id: "insurancePrivateHealth" },
      { name: "Life/TPD/Trauma", id: "insuranceLife" },
      { name: "Income Protection", id: "insuranceIncomeProtection" },
      { name: "Other", id: "insuranceOthers" },
    ];

    // 🔽 Continue document generation here
    let payload = {
      clientName: personalDetails?.client?.clientGivenName || "",
      adviserName: adviserName || "",
      adviserEmail: adviserEmail || "",

      downloadDate: new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),

      items: Object.values(content.GoalsAndObjectives)
        .flat()
        .filter((item) => GQState?.[item.key] === "Yes")
        .map((item) => ({
          goalName: item?.title || "",
          scopeOfAdvice:
            goalsAndObjective?.[item.key]?.scopeOfAdvice ||
            item?.scopeOfAdvice ||
            "",
          description: RemoveSpan(
            goalsAndObjective?.[item.key]?.description || "",
          ),
          when: goalsAndObjective?.[item.key]?.when || item?.whenScopeIs || "",
          estimatedValue: goalsAndObjective?.[item.key]?.estimatedValue || "",
        })),

      childitem:
        personalDetails?.children?.arrayOfChildren?.map((child) => ({
          childFirstName: child?.firstName || "",
          childLastName: child?.lastName || "",
          childDob: child?.dob ? convertDateAUWithDayJS(child?.dob) : "",
          childAge: child?.age || "",
          childGender: child?.gender || "",
          childRelationship: child?.relationship || "",
          childDepenantChild: child?.depenantChild || "",
        })) || [],

      //client Personal Details
      ...PerosonalDetail(personalDetails, "client"),

      //Employment Details
      ...EmpoymentDetal(
        allQuestions?.incomeFromOwnBusiness,
        personalDetails,
        "client",
      ),

      //Centerlink Details
      ...Centerlink(allQuestions?.incomeFromCentrelink, "client"),

      //Will
      ...Will(allQuestions?.will, "client"),

      // we might need it
      // "clientTestamentaryTrust": "",
      // "clientEstatePlanningRadio": "",

      //POA
      clientPOAType: allQuestions?.POA?.client?.POAType || "",
      clientPOAYearSetUp: allQuestions?.POA?.client?.yearSetUp || "",
      clientPOANameItems:
        allQuestions?.POA?.client?.POAName.map((item, index) => {
          return {
            executorName: item?.name || "",
            executerRelationship: item?.relationshipStatus || "",
          };
        }) || [],

      // ProFessional Adviser
      clientProfessionalAdviseritems:
        allQuestions?.professionalAdviser?.client?.map((item, index) => {
          return {
            POAType: item?.POAType || "",
            adviserName: item?.adviserName || "",
            company: item?.company || "",
            phone: item?.phone || "",
            email: item?.email || "",
          };
        }) || [],

      //INCOME AND EXPENSES Table
      ...INCOME_AND_EXPENSES(allQuestions, CRState, "client"),

      //Summary of Networth
      ...Summary_of_Networth(allQuestions, CRState, personalDetails, "client"),

      //Bank Details, Term Deposits, Australian Shares, platform Investment Bonds, Investment Bonds, Super Annuation, Account Based Pension, Annuities
      ...generateUserFinancialPortfolioData(
        allQuestions,
        CRState,
        personalDetails,
        "client",
      ),

      //Life,TPD, Trauma, Income Protection Insurance policies
      clientLifeTPDTraumaArray: [
        ...buildLifeTPDTraumaArray(
          (allQuestions?.personalInsurance?.client?.PersonalInsurance &&
            allQuestions?.personalInsurance?.client?.PersonalInsurance) ||
            [],
          toIdNameMap(bankDetailObj?.PersonalInsurances || []),
          "client",
        ),
      ],

      //Life,TPD, Trauma, Income Protection Insurance policies auth array
      clientLifeTPDTraumaAuthArray:
        allQuestions?.personalInsurance?.client?.PersonalInsurance.map(
          (item, _) => {
            let prodivers = toIdNameMap(
              bankDetailObj?.PersonalInsurances || [],
            );
            return {
              ...item,
              provider: prodivers?.[item.provider] || "",
            };
          },
        ),

      clientAccumulationBalanceCurrentBalance:
        allQuestions?.SMSFAccumulationDetails?.client?.[0]
          ?.accumulationBenefitsArray?.[0]?.currentBalance || "",

      clientAccumulationBalanceEligibleServiceDate: allQuestions
        ?.SMSFAccumulationDetails?.client?.[0]?.accumulationBenefitsArray?.[0]
        ?.eligibleServiceDate
        ? convertDateAUWithDayJS(
            allQuestions?.SMSFAccumulationDetails?.client?.[0]
              ?.accumulationBenefitsArray?.[0]?.eligibleServiceDate,
          )
        : "",
      clientAccumulationBalanceCommencementDate: allQuestions
        ?.SMSFAccumulationDetails?.client?.[0]?.accumulationBenefitsArray?.[0]
        ?.commencementDate
        ? convertDateAUWithDayJS(
            allQuestions?.SMSFAccumulationDetails?.client?.[0]
              ?.accumulationBenefitsArray?.[0]?.commencementDate,
          )
        : "",

      //partner
      ...(!["Single", "Widowed", ""].includes(
        personalDetails?.client?.clientMaritalStatus || "",
      )
        ? {
            //client Personal Details
            ...PerosonalDetail(personalDetails, "partner"),

            //Employment Details
            ...EmpoymentDetal(
              allQuestions?.incomeFromOwnBusiness,
              personalDetails,
              "partner",
            ),

            //Centerlink Details
            ...Centerlink(allQuestions?.incomeFromCentrelink, "partner"),

            //Will
            ...Will(allQuestions?.will, "partner"),

            // we might need it
            // "partnerTestamentaryTrust": "",
            // "partnerEstatePlanningRadio": "",

            //POA
            partnerPOAType: allQuestions?.POA?.partner?.POAType || "",
            partnerPOAYearSetUp: allQuestions?.POA?.partner?.yearSetUp || "",
            partnerPOANameItems:
              allQuestions?.POA?.partner?.POAName.map((item, index) => {
                return {
                  executorName: item?.name || "",
                  executerRelationship: item?.relationshipStatus || "",
                };
              }) || [],

            // ProFessional Adviser
            partnerProfessionalAdviseritems:
              allQuestions?.professionalAdviser?.partner?.map((item, index) => {
                return {
                  POAType: item?.POAType || "",
                  adviserName: item?.adviserName || "",
                  company: item?.company || "",
                  phone: item?.phone || "",
                  email: item?.email || "",
                };
              }) || [],

            //INCOME AND EXPENSES Table
            ...INCOME_AND_EXPENSES(allQuestions, CRState, "partner"),

            //Summary of Networth
            ...Summary_of_Networth(
              allQuestions,
              CRState,
              personalDetails,
              "partner",
            ),

            ...generateUserFinancialPortfolioData(
              allQuestions,
              CRState,
              personalDetails,
              "partner",
            ),

            //Life,TPD, Trauma, Income Protection Insurance policies
            partnerLifeTPDTraumaArray: [
              ...buildLifeTPDTraumaArray(
                allQuestions?.personalInsurance?.partner?.PersonalInsurance ||
                  [],
                toIdNameMap(bankDetailObj?.PersonalInsurances || []),
                "partner",
              ),
            ],
            partnerLifeTPDTraumaAuthArray:
              allQuestions?.personalInsurance?.partner?.PersonalInsurance.map(
                (item, _) => {
                  let prodivers = toIdNameMap(
                    bankDetailObj?.PersonalInsurances || [],
                  );
                  return {
                    ...item,
                    provider: prodivers?.[item.provider] || "",
                  };
                },
              ),
          }
        : {
            partnerAccumulationBalanceCurrentBalance: "",
            partnerAccumulationBalanceEligibleServiceDate: "",
            partnerAccumulationBalanceCommencementDate: "",
            partnerAccumulationBalanceTaxfreeComponent: "",
            partnerAccumulationBalanceTaxableComponent: "",
            partnerAccumulationBalanceRestrictedNonPreserved: "",
            partnerAccumulationBalanceUnrestrictedNonPreserved: "",
            partnerAccumulationBalancePreservedAmount: "",

            partnerBankAccounts: [],
            partnerTermDeposits: [],
            partnerAustralianShare: [],
            partnerLifeTPDTraumaAuthArray: [],

            // Partner Data
            partnerTitle: "",
            partnerFirstName: "",
            partnerMiddleName: "",
            partnerLastName: "",
            partnerPreferred: "",
            partnerGender: "",
            partnerDob: "",
            partnerAge: "",
            partnerMarital: "",
            partnerEmployment: "",
            partnerRetAge: "",
            partnerHealth: "",
            partnerSmoker: "",
            partnerTaxRes: "",
            partnerHealthCover: "",
            partnerHelpDebt: "",

            // Contact Details
            partnerHomeAddress: "",
            partnerPostalAddress: "",
            partnerMobile: "",
            partnerHomePhone: "",
            partnerWorkPhone: "",
            partnerEmail: "",

            // Employment Details
            partnerOccupation: "",
            partnerEmploymentStatus: "",
            partnerNameOfCompany: "",
            partnerStartDate: "",
            partnerHoursWorked: "",
            partnerGrossSalary: "",
            partnerSGC: "",
            partnerSalarySacrificeContributions: "",
            partnerAfterTaxContributions: "",
            partnerChoiceOfFund: "",

            // Salary Packaging Details
            partnerEmployerFBTStatus: "",
            partnerCreditCardMortgageRepayments: "",
            partnerCostBaseOfCar: "",
            partnerFBTPaidByEmployer: "",
            partnerRunningCostsOfCar: "",

            // Leave Entitlements
            partnerAnnual: "",
            partnerSick: "",
            partnerLongService: "",

            // Centrelink Details
            partnerCRN: "",
            partnerPaymentType: "",
            partnerFortnightlyPayment: "",
            partnerAnnualPaymentAmount: "",
            partnerCentrelinkCardsHeld: "",

            //Will
            partnerWill: "",
            partnerWillYearSetUp: "",
            partnerWillsCurrent: "",
            partnerExecutorItems: [],

            partnerEnduringGuardianship: "",

            partnerEstatePlanningRadio: "",
            partnerdescription: "",

            // we might need it
            // "partnerTestamentaryTrust": "",
            // "partnerEstatePlanningRadio": "",

            //POA
            partnerPOAType: "",
            partnerPOAYearSetUp: "",
            partnerPOANameItems: [],

            // ProFessional Adviser
            partnerProfessionalAdviseritems: [],

            partnerEmploymentIncome: "$0",
            partnerNetBusinessIncome: "$0",
            partnerSuperPensionPayment: "$0",
            partnerLifeTimePensionPayment: "$0",
            partnerOverseasPensionPayment: "$0",
            partnerCenterlinkPension: "$0",
            partnerRentalIncome: "$0",
            partnerInterest: "$0",
            partnerDividendIncome: "$0",
            partnerAnnutiesIncome: "$0",

            // Summary Of NetWorth
            partnerCarCurrentValue: "$0",
            partnerContentsCurrentValue: "$0",
            partnerBoatCurrentValue: "$0",
            partnerCaravanCurrentValue: "$0",
            partnerOtherAssetsCurrentValue: "$0",

            //investment Assets
            partnerBankAccountCurrentBalance: "$0",
            partnerTermDepositsCurrentBalance: "$0",
            partnerAustralianSharesCurrentBalance: "$0",
            partnerPlatformInvestmentsCurrentBalance: "$0",
            partnerInvestmentBondsCurrentBalance: "$0",

            partnerSuperannuationCurrentBalance: "$0",
            partnerAccountBasedPensionsCurrentBalance: "$0",
            partnerAnnuitiesCurrentBalance: "$0",

            ...Array.from({ length: 10 }, (_, i) => [
              `partnerInvestmentPropertyCurrentBalance${i + 1}`,
              "$0",
            ]),

            partnerTradingCompanyCurrentBalance: "$0",
            partnerBusinessTrustCurrentBalance: "$0",

            ...Object.fromEntries(
              Array.from({ length: 10 }, (_, i) => [
                `partnerInvestmentPropertyLoanBalance${i + 1}`,
                "$0",
              ]),
            ),

            partnerInvestmentLoanBalance: "$0",
            partnerMarginLoanBalance: "$0",
            partnerPlatFromInvestment: [],
            partnerInvestmentBond: [],
            partnerSuperFund: [],
            partnerAccountBasedPensions: [],
            partnerAnnuties: [],
          }),

      //joint
      ...(!["Single", "Widowed", ""].includes(
        personalDetails?.client?.clientMaritalStatus || "",
      )
        ? {
            ...generateUserFinancialPortfolioData(
              allQuestions,
              CRState,
              personalDetails,
              "joint",
            ),

            // Summary Of NetWorth
            ...Summary_of_Networth(
              allQuestions,
              CRState,
              personalDetails,
              "joint",
            ),
          }
        : {
            jointBankAccounts: [],
            jointTermDeposits: [],
            jointAustralianShare: [],
            jointPlatFromInvestment: [],
            jointInvestmentBond: [],

            jointCarCurrentValue: "$0",
            jointContentsCurrentValue: "$0",
            jointBoatCurrentValue: "$0",
            jointCaravanCurrentValue: "$0",
            jointOtherAssetsCurrentValue: "$0",

            //investment Assets
            jointBankAccountCurrentBalance: "$0",
            jointTermDepositsCurrentBalance: "$0",
            jointAustralianSharesCurrentBalance: "$0",
            jointPlatformInvestmentsCurrentBalance: "$0",
            jointInvestmentBondsCurrentBalance: "$0",

            jointSuperannuationCurrentBalance: "$0",
            jointAccountBasedPensionsCurrentBalance: "$0",
            jointAnnuitiesCurrentBalance: "$0",

            ...Object.fromEntries(
              Array.from({ length: 10 }, (_, i) => [
                `jointInvestmentPropertyCurrentBalance${i + 1}`,
                "$0",
              ]),
            ),

            jointTradingCompanyCurrentBalance: "$0",
            jointBusinessTrustCurrentBalance: "$0",

            jointLiabilityCreditCards: "$0",
            jointPersonalLoans: "$0",
          }),

      TotalLivingExpenses:
        allQuestions?.generalLivingExpenses?.generalLivingExpensesTotal || "",

      ...expenseTypes
        .map((expense, index) => {
          const id = expense.id;

          const amount = allQuestions?.generalLivingExpenses?.[id] || "0";

          const frequency =
            allQuestions?.generalLivingExpenses?.[`${id}Type`] || "";

          const numericAmount =
            parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;

          const total = numericAmount * parseFloat(frequency) || 0;

          let FrequencyText =
            [
              { value: 52, label: "Weekly" },
              { value: 26, label: "Fortnightly" },
              { value: 12, label: "Monthly" },
              { value: 4, label: "Quarterly" },
              { value: 2, label: "Half Yearly" },
              { value: 1, label: "Annually" },
            ].find((freq) => freq.value.toString() === frequency)?.label || "";

          return {
            [`houseHoldAmount${index + 1}`]: amount,
            [`houseHoldFrequency${index + 1}`]: FrequencyText,
            [`houseHoldTotal${index + 1}`]: toCommaAndDollar(total),
          };
        })
        .reduce((acc, obj) => ({ ...acc, ...obj }), {}),

      ...personalExpenses
        .map((expense, index) => {
          const id = expense.id;

          const amount = allQuestions?.generalLivingExpenses?.[id] || "0";

          const frequency =
            allQuestions?.generalLivingExpenses?.[`${id}Type`] || "";

          const numericAmount =
            parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;

          const total = numericAmount * parseFloat(frequency) || 0;

          let FrequencyText =
            [
              { value: 52, label: "Weekly" },
              { value: 26, label: "Fortnightly" },
              { value: 12, label: "Monthly" },
              { value: 4, label: "Quarterly" },
              { value: 2, label: "Half Yearly" },
              { value: 1, label: "Annually" },
            ].find((freq) => freq.value.toString() === frequency)?.label || "";

          return {
            [`lifeStyleAmount${index + 1}`]: amount,
            [`lifeStyleFrequency${index + 1}`]: FrequencyText,
            [`lifeStyleTotal${index + 1}`]: toCommaAndDollar(total),
          };
        })
        .reduce((acc, obj) => ({ ...acc, ...obj }), {}),

      ...transportExpenses
        .map((expense, index) => {
          const id = expense.id;

          const amount = allQuestions?.generalLivingExpenses?.[id] || "0";

          const frequency =
            allQuestions?.generalLivingExpenses?.[`${id}Type`] || "";

          const numericAmount =
            parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;

          const total = numericAmount * parseFloat(frequency) || 0;

          let FrequencyText =
            [
              { value: 52, label: "Weekly" },
              { value: 26, label: "Fortnightly" },
              { value: 12, label: "Monthly" },
              { value: 4, label: "Quarterly" },
              { value: 2, label: "Half Yearly" },
              { value: 1, label: "Annually" },
            ].find((freq) => freq.value.toString() === frequency)?.label || "";

          return {
            [`transportAmount${index + 1}`]: amount,
            [`transportFrequency${index + 1}`]: FrequencyText,
            [`transportTotal${index + 1}`]: toCommaAndDollar(total),
          };
        })
        .reduce((acc, obj) => ({ ...acc, ...obj }), {}),

      ...insuranceExpenses
        .map((expense, index) => {
          const id = expense.id;

          const amount = allQuestions?.generalLivingExpenses?.[id] || "0";

          const frequency =
            allQuestions?.generalLivingExpenses?.[`${id}Type`] || "";

          const numericAmount =
            parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;

          const total = numericAmount * parseFloat(frequency) || 0;

          let FrequencyText =
            [
              { value: 52, label: "Weekly" },
              { value: 26, label: "Fortnightly" },
              { value: 12, label: "Monthly" },
              { value: 4, label: "Quarterly" },
              { value: 2, label: "Half Yearly" },
              { value: 1, label: "Annually" },
            ].find((freq) => freq.value.toString() === frequency)?.label || "";

          return {
            [`InsuranceAmount${index + 1}`]: amount,
            [`InsuranceFrequency${index + 1}`]: FrequencyText,
            [`InsuranceTotal${index + 1}`]: toCommaAndDollar(total),
          };
        })
        .reduce((acc, obj) => ({ ...acc, ...obj }), {}),

      motorVahicleYear:
        GQState?.carGoal == "Yes" ? goalsAndObjective?.carGoal?.when || "" : "",
      motorVahicleAmount:
        GQState?.carGoal == "Yes"
          ? goalsAndObjective?.carGoal?.estimatedValue || ""
          : "",
      boatYear:
        GQState?.boatGoal == "Yes"
          ? goalsAndObjective?.boatGoal?.when || ""
          : "",
      boatAmount:
        GQState?.boatGoal == "Yes"
          ? goalsAndObjective?.boatGoal?.estimatedValue || ""
          : "",
      caravanYear:
        GQState?.caravanGoal == "Yes"
          ? goalsAndObjective?.caravanGoal?.when || ""
          : "",
      caravanAmount:
        GQState?.caravanGoal == "Yes"
          ? goalsAndObjective?.caravanGoal?.estimatedValue || ""
          : "",
      otherYear:
        GQState?.familyLifeStyleGoal == "Yes"
          ? goalsAndObjective?.familyLifeStyleGoal?.when || ""
          : "",
      otherAmount:
        GQState?.familyLifeStyleGoal == "Yes"
          ? goalsAndObjective?.familyLifeStyleGoal?.estimatedValue || ""
          : "",
      homeRenovationsYear:
        GQState?.renovateFamilyHomeGoal == "Yes"
          ? goalsAndObjective?.renovateFamilyHomeGoal?.when || ""
          : "",
      homeRenovationsAmount:
        GQState?.renovateFamilyHomeGoal == "Yes"
          ? goalsAndObjective?.renovateFamilyHomeGoal?.estimatedValue || ""
          : "",
      holidayYear:
        GQState?.holidayGoal == "Yes"
          ? goalsAndObjective?.holidayGoal?.when || ""
          : "",
      holidayAmount:
        GQState?.holidayGoal == "Yes"
          ? goalsAndObjective?.holidayGoal?.estimatedValue || ""
          : "",

      //SMSF
      SMSFfundName: allQuestions?.SMSFDetails?.SMSFOwner?.fundName || "",
      SMSFABN: allQuestions?.SMSFDetails?.SMSFOwner?.ABN || "",
      SMSFRegisterOffice:
        allQuestions?.SMSFDetails?.SMSFOwner?.registeredOffice || "",
      SMSFBusinessPlace:
        allQuestions?.SMSFDetails?.SMSFOwner?.placeOfBusiness || "",
      SMSFEstablishmentdate: allQuestions?.SMSFDetails?.SMSFOwner
        ?.establishmentDate
        ? convertDateAUWithDayJS(
            allQuestions?.SMSFDetails?.SMSFOwner?.establishmentDate,
          )
        : "",
      SMSFTrusteeType: allQuestions?.SMSFDetails?.SMSFOwner?.trusteeType || "",
      SMSFTrusteeName: allQuestions?.SMSFDetails?.SMSFOwner?.trusteeName || "",
      SMSFACN: allQuestions?.SMSFDetails?.SMSFOwner?.ACN || "",

      isSMSFTrusteeTypeIsCorporateTrustee:
        allQuestions?.SMSFDetails?.SMSFOwner?.trusteeType == "Corporate",

      directorNamesList:
        allQuestions?.SMSFDetails?.SMSFOwner?.directorsOfCorporateTrustee || [],
      isBareTrustYes: allQuestions?.SMSFDetails?.SMSFOwner?.bareTrust == "Yes",
      SMSFbareTrusteeName:
        allQuestions?.SMSFDetails?.SMSFOwner?.directorsOfBareTrust
          ?.bareTrusteeName || "",
      SMSFCAN:
        allQuestions?.SMSFDetails?.SMSFOwner?.directorsOfBareTrust?.ACN || "",

      SMSFdirectorNameArray:
        allQuestions?.SMSFDetails?.SMSFOwner?.directorsOfBareTrust?.directorNameArray.map(
          (item, index) => {
            return {
              SMSFBareTrustName: item,
            };
          },
        ) || [],

      SMSFNameOfAccountant:
        allQuestions?.SMSFDetails?.SMSFOwner?.nameOfAccountant || "",

      SMSFPensionDetailsPensionType:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsAccountBalance:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsCommencementDate:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsEligibleServiceDate:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsPurchasePrice:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsTaxFreeComponent:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsTaxableComponent:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsUnrestrictedNonPreserved:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsRestrictedNonPreserved:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsPreservedAmount:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFPensionDetailsAnnualPensionPayment:
        allQuestions?.SMSFPensionPhase?.SMSFOwner?.nameOfAccountant || "",
      SMSFBankCurrentBalance:
        allQuestions?.SMSFBank?.SMSFCurrentBalance || "$0",
      SMSFTermCurrentBalance:
        allQuestions?.SMSFTermDeposits?.SMSFCurrentBalance || "$0",
      SMSFAustralianCurrentBalance:
        allQuestions?.SMSFAustralianShares?.SMSFCurrentBalance || "$0",
      SMSFPlatfromCurrentBalance:
        allQuestions?.SMSFManagedFunds?.SMSFCurrentBalance || "$0",
      SMSFOtherCurrentBalance:
        allQuestions?.SMSFOtherInvestment?.clientTotal || "$0",

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `SMSFInvestmentCurrentBalance${i + 1}`,
          allQuestions?.SMSFInvestmentProperties.SMSF?.[i]?.CurrentValue ||
            "$0",
        ]),
      ),

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `SMSFInvestmentpropertyloan${i + 1}`,
          allQuestions?.SMSFInvestmentProperties.SMSF?.[i]
            ?.propertyLoanDetailsArray?.[0]?.LoanBalance || "$0",
        ]),
      ),

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `SMSFInvestmentAddress${i + 1}`,
          (allQuestions?.SMSFInvestmentProperties.SMSF?.[i]?.PropertyAddress ||
            "") +
            " (" +
            (allQuestions?.SMSFInvestmentProperties.SMSF?.[i]?.postcodeSuburb ||
              "") +
            ")",
        ]),
      ),

      SMSFInvestmentloan: allQuestions?.SMSFInvestmentLoan?.SMSFTotal || "$0",

      ...buildSMSFObject(
        allQuestions?.SMSFAccumulationDetails?.client?.[0],
        allQuestions?.SMSFAccumulationDetails?.partner?.[0],
      ),

      ...generateUserFinancialPortfolioData(
        allQuestions,
        CRState,
        personalDetails,
        "SMSF",
      ),

      //Family Trust
      FamilyTrustTrustName:
        allQuestions?.familyDetails?.familyTrustOwner?.trustName || "",
      FamilyTrustABN: allQuestions?.familyDetails?.familyTrustOwner?.ABN || "",
      FamilyTrustRegisteredOffice:
        allQuestions?.familyDetails?.familyTrustOwner?.registeredOffice || "",
      FamilyTrustPlaceOfBusiness:
        allQuestions?.familyDetails?.familyTrustOwner?.placeOfBusiness || "",
      FamilyTrustEstablishmentDate:
        convertDateAUWithDayJS(
          allQuestions?.familyDetails?.familyTrustOwner?.establishmentDate,
        ) || "",
      FamilyTrustTrusteeType:
        allQuestions?.familyDetails?.familyTrustOwner?.trusteeType || "",
      FamilyTrustDirectorNamesList:
        allQuestions?.familyDetails?.familyTrustOwner
          ?.directorsOfCorporateTrustee || [],
      FamilyTrustACN: allQuestions?.familyDetails?.familyTrustOwner?.ACN || "",
      FamilyTrustTrusteeName:
        allQuestions?.familyDetails?.familyTrustOwner?.trusteeName || "",

      isFamilyTrustTrusteeTypeCorporate:
        allQuestions?.familyDetails?.familyTrustOwner?.trusteeType ==
        "Corporate",

      FamilyTrustNameOfAccountant:
        allQuestions?.familyDetails?.familyTrustOwner?.nameOfAccountant || "",

      FamilyTrustBankCurrentBalance:
        allQuestions?.familyBank?.trustCurrentBalance || "",
      FamilyTrustTermCurrentBalance:
        allQuestions?.familyTermDeposit?.trustCurrentBalance || "",
      FamilyTrustAustralianCurrentBalance:
        allQuestions?.familyAustralianShare?.trustCurrentBalance || "",
      FamilyTrustPlatfromCurrentBalance:
        allQuestions?.familyMangedFunds?.trustCurrentBalance || "",
      FamilyTrustOtherCurrentBalance:
        allQuestions?.familyOtherInvestment?.clientTotal || "",

      FamilyTrustInvestmentCurrentBalance:
        allQuestions?.familyDetails?.clientTotal || "",

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `FamilyTrustInvestmentCurrentBalance${i + 1}`,
          allQuestions?.familyInvestmentProperties.trust?.[i]?.CurrentValue ||
            "$0",
        ]),
      ),

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `FamilyTrustInvestmentpropertyloan${i + 1}`,
          allQuestions?.familyInvestmentProperties.trust?.[i]
            ?.propertyLoanDetailsArray?.[0]?.LoanBalance || "$0",
        ]),
      ),

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `FamilyTrustInvestmentAddress${i + 1}`,
          (allQuestions?.familyInvestmentProperties.trust?.[i]
            ?.PropertyAddress || "") +
            " (" +
            (allQuestions?.familyInvestmentProperties.trust?.[i]
              ?.postcodeSuburb || "") +
            ")",
        ]),
      ),

      FamilyTrustInvestmentloan:
        allQuestions?.familyInvestmentHomeLoan?.trust?.loanBalance || "",

      ...generateUserFinancialPortfolioData(
        allQuestions,
        CRState,
        personalDetails,
        "trust",
      ),

      // PageBreak: `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`, // this is for full new Page
      PageBreak: `<w:br w:type="page"/>`, // this is simple Page Break
    };

    const sumByPrefix = (prefix) => {
      return Object.keys(payload)
        .filter((key) => key.startsWith(prefix))
        .reduce((total, key) => {
          const value = parseMoney(payload[key]) || 0;
          return total + value;
        }, 0);
    };

    payload.houseHoldTotal = toCommaAndDollar(sumByPrefix("houseHoldTotal"));
    payload.lifeStyleTotal = toCommaAndDollar(sumByPrefix("lifeStyleTotal"));
    payload.transportTotal = toCommaAndDollar(sumByPrefix("transportTotal"));
    payload.InsuranceTotal = toCommaAndDollar(sumByPrefix("InsuranceTotal"));

    //Summary of NetWorth Total

    payload.totalCombinedAssets = toCommaAndDollar(
      parseMoney(payload?.clientLifestyleTotal || "$0") +
        parseMoney(payload?.partnerLifestyleTotal || "$0") +
        parseMoney(payload?.jointLifestyleTotal || "$0") +
        parseMoney(payload?.clientInvestmentAssetsTotal || "$0") +
        parseMoney(payload?.partnerInvestmentAssetsTotal || "$0") +
        parseMoney(payload?.jointInvestmentAssetsTotal || "$0") +
        parseMoney(payload?.clientBusinessAssetsCurrentBalance || "$0") +
        parseMoney(payload?.partnerBusinessAssetsCurrentBalance || "$0") +
        parseMoney(payload?.jointBusinessAssetsCurrentBalance || "$0"),
    );

    payload.totalCombinedLiabilities = toCommaAndDollar(
      parseMoney(payload.partnerLiabilitiesTotal || "$0") +
        parseMoney(payload.jointLiabilitiesTotal || "$0") +
        parseMoney(payload.clientLiabilitiesTotal || "$0"),
    );

    payload.netWorth = toCommaAndDollar(
      parseMoney(payload.totalCombinedAssets || "$0") -
        parseMoney(payload.totalCombinedLiabilities || "$0"),
    );

    payload.SMSFAssetsTotal = toCommaAndDollar(
      parseMoney(payload.SMSFBankCurrentBalance || "$0") +
        parseMoney(payload.SMSFTermCurrentBalance || "$0") +
        parseMoney(payload.SMSFAustralianCurrentBalance || "$0") +
        parseMoney(payload.SMSFPlatfromCurrentBalance || "$0") +
        parseMoney(payload.SMSFOtherCurrentBalance || "$0") +
        parseMoney(payload.SMSFInvestmentCurrentBalance1 || "$0") +
        parseMoney(payload.SMSFInvestmentCurrentBalance2 || "$0") +
        parseMoney(payload.SMSFInvestmentCurrentBalance3 || "$0") +
        parseMoney(payload.SMSFInvestmentCurrentBalance4 || "$0") +
        parseMoney(payload.SMSFInvestmentCurrentBalance5 || "$0"),
    );

    payload.SMSFLiabilitiesTotal = toCommaAndDollar(
      parseMoney(payload.SMSFInvestmentloan || "$0") +
        parseMoney(payload.SMSFInvestmentpropertyloan1 || "$0") +
        parseMoney(payload.SMSFInvestmentpropertyloan2 || "$0") +
        parseMoney(payload.SMSFInvestmentpropertyloan3 || "$0") +
        parseMoney(payload.SMSFInvestmentpropertyloan4 || "$0") +
        parseMoney(payload.SMSFInvestmentpropertyloan5 || "$0"),
    );

    payload.SMSFNetWorth = toCommaAndDollar(
      parseMoney(payload.SMSFAssetsTotal || "$0") -
        parseMoney(payload.SMSFLiabilitiesTotal || "$0"),
    );

    payload.FamilyTrustAssetTotal = toCommaAndDollar(
      parseMoney(payload.FamilyTrustBankCurrentBalance || "$0") +
        parseMoney(payload.FamilyTrustTermCurrentBalance || "$0") +
        parseMoney(payload.FamilyTrustAustralianCurrentBalance || "$0") +
        parseMoney(payload.FamilyTrustPlatfromCurrentBalance || "$0") +
        parseMoney(payload.FamilyTrustOtherCurrentBalance || "$0") +
        parseMoney(payload.FamilyTrustInvestmentCurrentBalance1 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentCurrentBalance2 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentCurrentBalance3 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentCurrentBalance4 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentCurrentBalance5 || "$0"),
    );

    payload.FamilyTrustLibilities = toCommaAndDollar(
      parseMoney(payload.FamilyTrustInvestmentloan || "$0") +
        parseMoney(payload.FamilyTrustInvestmentpropertyloan1 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentpropertyloan2 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentpropertyloan3 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentpropertyloan4 || "$0") +
        parseMoney(payload.FamilyTrustInvestmentpropertyloan5 || "$0"),
    );

    payload.FamilyTrustNetWorth = toCommaAndDollar(
      parseMoney(payload.FamilyTrustAssetTotal || "$0") -
        parseMoney(payload.FamilyTrustLibilities || "$0"),
    );

    payload = calculateSuperAndSMSFSums({
      payload,
      allQuestions,
    });

    if (
      !["Single", "Widowed", ""].includes(
        personalDetails?.client?.clientMaritalStatus,
      )
    ) {
      if (Array.isArray(payload?.partnerSuperFund)) {
        payload.partnerSuperFund.forEach((fund) => {
          // Fix Non-Concessional (min 3)
          if (
            Array.isArray(fund?.contributionsArrayNonConcessional) &&
            fund.contributionsArrayNonConcessional.length < 3
          ) {
            const missing = 3 - fund.contributionsArrayNonConcessional.length;

            for (let i = 0; i < missing; i++) {
              fund.contributionsArrayNonConcessional.unshift({
                nonConcessionalContributions: "$0",
                year:
                  fund.contributionsArrayNonConcessional[0]?.year - 1 ||
                  new Date().getFullYear() - i,
              });
            }
          }

          // Fix Concessional (min 5)
          if (
            Array.isArray(fund?.contributionsArrayConcessional) &&
            fund.contributionsArrayConcessional.length < 6
          ) {
            const missing = 6 - fund.contributionsArrayConcessional.length;

            for (let i = 0; i < missing; i++) {
              fund.contributionsArrayConcessional.unshift({
                totalConcessional: "$0",
                year:
                  fund.contributionsArrayConcessional[0]?.year - 1 ||
                  new Date().getFullYear() - i,
              });
            }
          }
        });
      }

      let SMSFContributionsArray =
        allQuestions?.SMSFAccumulationDetails?.partner?.[0]?.contributionsArray
          ?.newEntries || [];

      if (
        SMSFContributionsArray.length > 0 &&
        SMSFContributionsArray.length < 6
      ) {
        for (let i = SMSFContributionsArray.length; i < 6; i++) {
          SMSFContributionsArray.unshift({
            totalConcessional: "$0",
            nonConcessionalContributions: "$0",
          });
        }
      }

      payload.partnerSumOfNCCSuperAndSMSF1 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayNonConcessional?.[0]
                ?.nonConcessionalContributions,
            ) || 0)
          );
        }, 0) +
          parseMoney(
            Array.isArray(SMSFContributionsArray)
              ? SMSFContributionsArray.at(-3)?.nonConcessionalContributions
              : "$0",
          ),
      );

      payload.partnerSumOfNCCSuperAndSMSF2 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayNonConcessional?.[1]
                ?.nonConcessionalContributions,
            ) || 0)
          );
        }, 0) +
          parseMoney(
            SMSFContributionsArray?.at(-2)?.nonConcessionalContributions ||
              "$0",
          ),
      );

      payload.partnerSumOfNCCSuperAndSMSF3 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayNonConcessional?.[2]
                ?.nonConcessionalContributions,
            ) || 0)
          );
        }, 0) +
          parseMoney(
            SMSFContributionsArray?.at(-1)?.nonConcessionalContributions ||
              "$0",
          ),
      );

      payload.partnerSumOfCCSuperAndSMSF1 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[0]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-6)?.totalConcessional || "$0"),
      );

      payload.partnerSumOfCCSuperAndSMSF2 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[1]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-5)?.totalConcessional || "$0"),
      );

      payload.partnerSumOfCCSuperAndSMSF3 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[2]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-4)?.totalConcessional || "$0"),
      );

      payload.partnerSumOfCCSuperAndSMSF4 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[3]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-3)?.totalConcessional || "$0"),
      );

      payload.partnerSumOfCCSuperAndSMSF5 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[4]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-2)?.totalConcessional || "$0"),
      );

      payload.partnerSumOfCCSuperAndSMSF6 = toCommaAndDollar(
        (payload?.partnerSuperFund || []).reduce((sum, item) => {
          return (
            sum +
            (parseMoney(
              item?.contributionsArrayConcessional?.[5]?.totalConcessional,
            ) || 0)
          );
        }, 0) +
          parseMoney(SMSFContributionsArray?.at(-1)?.totalConcessional || "$0"),
      );
    }

    payload.jointTotalIncome = toCommaAndDollar(
      parseMoney(payload.clientTotalIncome) +
        parseMoney(payload.partnerTotalIncome),
    );

    // less tax estimation
    let SalarySacrificeClient = parseMoney(
      payload.clientSalarySacrificeContributions || "$0",
    );
    let SalarySacrificePartner = parseMoney(
      payload.partnerSalarySacrificeContributions || "$0",
    );

    //total Property Expance

    let clientExpances = [];
    allQuestions?.investmentPropertyDetails.client &&
      allQuestions?.investmentPropertyDetails.client.map((item, index) => {
        clientExpances.push(
          parseMoney(item.incomeExpenses || "$0") *
            (parseMoney(item.clientOwnership || "$0") / 100),
        );
      });

    let partnerExpances = [];
    allQuestions?.investmentPropertyDetails.client &&
      allQuestions?.investmentPropertyDetails.client.map((item, index) => {
        partnerExpances.push(
          parseMoney(item.incomeExpenses || "$0") *
            (parseMoney(item.partnerOwnership || "$0") / 100),
        );
      });

    //now sum up all expances to get total expance for client and partner

    clientExpances = clientExpances.reduce((a, b) => a + b, 0);
    partnerExpances = partnerExpances.reduce((a, b) => a + b, 0);

    // now calculating total expance and Salary Sacrifice to get Total Deductions income for client and partner

    let clientTotalDeductions = clientExpances + SalarySacrificeClient;
    let partnerTotalDeductions = partnerExpances + SalarySacrificePartner;

    // now we calculate client and partner payed intrust on property loan

    let clientInterest = [];
    allQuestions?.investmentPropertyDetails.client &&
      allQuestions?.investmentPropertyDetails.client.map((item, index) => {
        clientInterest.push(
          parseMoney(item?.propertyLoanDetails || "$0") *
            (parseMoney(
              item?.propertyLoanDetailsArray[0]?.InterestRate || "0%",
            ) /
              100) *
            (parseMoney(item?.clientOwnership || "0%") / 100),
        );
      });

    let partnerInterest = [];
    allQuestions?.investmentPropertyDetails.client &&
      allQuestions?.investmentPropertyDetails.client.map((item, index) => {
        partnerInterest.push(
          parseMoney(item?.propertyLoanDetails || "$0") *
            (parseMoney(
              item?.propertyLoanDetailsArray[0]?.InterestRate || "0%",
            ) /
              100) *
            (parseMoney(item?.partnerOwnership || "0%") / 100),
        );
      });

    clientInterest = clientInterest.reduce((a, b) => a + b, 0);
    partnerInterest = partnerInterest.reduce((a, b) => a + b, 0);

    //now adding total interest payed with total Deductions to get total deductions for client and partner
    let totalDeductionsClient = clientTotalDeductions + clientInterest;
    let totalDeductionsPartner = partnerTotalDeductions + partnerInterest;

    //client Total Income
    let ClientNetTaxableIncome =
      parseMoney(payload.clientTotalIncome || "$0") - totalDeductionsClient;
    let PartnerNetTaxableIncome =
      parseMoney(payload.partnerTotalIncome || "$0") - totalDeductionsPartner;

    // the Tax Brackets in Australia

    const taxBrackets = [
      { minThreshold: 0, threshold: 18200, rate: 0 },
      { minThreshold: 18200, threshold: 45000, rate: 0.16 },
      { minThreshold: 45000, threshold: 135000, rate: 0.3 },
      { minThreshold: 135000, threshold: 190000, rate: 0.37 },
      { minThreshold: 190000, threshold: Infinity, rate: 0.45 },
    ];

    //senario 1: if income is 50,000 then tax will be 16% on (50,000-45,000) = 800 its tax will be 800 * 0.30 = 240 then tax will be 16% on (45,000-18,200) = 26,800 its tax will be 26,800 * 0.16 = 4,288 then total tax will be 4,528

    const calculateTax = (income) => {
      let tax = 0;

      for (let i = taxBrackets.length - 1; i >= 0; i--) {
        const { minThreshold, threshold, rate } = taxBrackets[i];
        if (income > minThreshold && income <= threshold) {
          const taxableAmount = income - minThreshold;
          tax += taxableAmount * rate;
          income = minThreshold; // Reduce income to next bracket
        }
      }

      return tax;
    };

    let clientTax = calculateTax(ClientNetTaxableIncome);
    let partnerTax = calculateTax(PartnerNetTaxableIncome);

    // we need to add medical levy in this
    let medicarelavyMatric = [
      {
        minThreshold: 0,
        threshold: 23365,
        rate: 0,
      },
      {
        minThreshold: 23365,
        threshold: 29206,
        rate: 0.1,
      },
      {
        minThreshold: 29206,
        threshold: Infinity,
        rate: 0.02,
      },
    ];

    const calculateMedicareLevy = (income) => {
      let levy = 0;
      for (let i = medicarelavyMatric.length - 1; i >= 0; i--) {
        const { minThreshold, threshold, rate } = medicarelavyMatric[i];
        if (income > minThreshold && income <= threshold) {
          const taxableAmount = income - minThreshold;
          levy += taxableAmount * rate;
          income = minThreshold; // Reduce income to next bracket
        }
      }
      return levy;
    };

    let clientMedicareLevy = calculateMedicareLevy(ClientNetTaxableIncome);
    let partnerMedicareLevy = calculateMedicareLevy(PartnerNetTaxableIncome);

    let LessEstimatedTax = toCommaAndDollar(
      clientTax + partnerTax + clientMedicareLevy + partnerMedicareLevy,
    );

    payload.clientLessEstimatedTax = LessEstimatedTax;

    payload.clientTotalExpanse = toCommaAndDollar(
      parseMoney(payload.clientTotalExpanse || "$0") +
        parseMoney(LessEstimatedTax || "$0"),
    );

    payload.AnnualEstimatedNetCashPosition = toCommaAndDollar(
      parseMoney(payload.jointTotalIncome) -
        parseMoney(payload.clientTotalExpanse),
    );

    console.log("Document Payload:", payload);

    await generateDocumentFromTemplate(
      payload,
      FileName,
      `Adviser Simplicity Fact Find of ${personalDetails?.client?.clientPreferredName || "Client"}.docx`,
    );
  } catch (error) {
    console.error("Document generation failed:", error);

    openNotificationSuccess(
      "error",
      "topRight",
      "Document Generation Error",
      error?.message || "Failed to generate document",
    );
  }
};

export { generatePersonalDetailsDocument };
