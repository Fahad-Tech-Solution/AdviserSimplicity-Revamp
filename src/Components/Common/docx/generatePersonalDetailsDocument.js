import { appStore } from "../../../store/jotaiStore";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  goalsDataAtom,
  goalsSectionQuestionsAtom,
  InvestmentOffersData,
  loggedInUser,
  riskProfileDataAtom,
} from "../../../store/authState";
import {
  convertDateAUWithDayJS,
  RemoveSpan,
  toCommaAndDollar,
  toSentenceCase,
} from "../../../hooks/helpers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { generateDocumentFromTemplate } from "./generateDocumentFromTemplate";
import { discoveryRoutes } from "../../Routes/User.Routes";
import { message } from "antd";
dayjs.extend(utc);

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

const FREQUENCY_OPTIONS = [
  { value: "52", label: "Weekly" },
  { value: "26", label: "Fortnightly" },
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "2", label: "Half Yearly" },
  { value: "1", label: "Annually" },
];

function RenderName(name) {
  const discoveryData = appStore.get(discoveryDataAtom);

  if (name === "client") {
    return (
      discoveryData?.personalDetails?.client?.clientPreferredName ||
      discoveryData?.personalDetails?.client?.clientFirstName ||
      ""
    );
  } else if (name === "partner") {
    return (
      discoveryData?.personalDetails?.partner?.partnerPreferredName ||
      discoveryData?.personalDetails?.partner?.partnerFirstName ||
      ""
    );
  } else if (name === "joint") {
    return RenderName("client") + " & " + RenderName("partner") || "";
  }
}

const parseMoney = (value = "$0") =>
  Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;

function toIdNameMap(arr = []) {
  return arr.reduce((acc, { _id, platformName }) => {
    acc[_id] = platformName;
    return acc;
  }, {});
}

function DataVariationVerification(
  id,
  discoveryData,
  discoveryQuestions,
  goalsData,
  goalsQuestions,
  riskProfileData,
) {
  let result = true;

  if (id !== discoveryQuestions?.clientFK) {
    result = false;
  }
  if (id !== goalsData?.clientFK) {
    result = false;
  }
  if (id !== goalsQuestions?.clientFK) {
    result = false;
  }
  if (id !== riskProfileData?.clientFK) {
    result = false;
  }
  if (id !== discoveryData?.personalDetails?._id) {
    result = false;
  }
  return result;
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

function childAgeFromDob(dob) {
  if (!dob) return "";
  const date = dayjs.isDayjs(dob) ? dob : dayjs(dob);
  if (!date.isValid()) return "";
  return String(dayjs().diff(date, "year"));
}

function ChildrenSectionArrayData(children = []) {
  return children?.map((child) => ({
    childFirstName: splitFullName(child?.name)?.firstName || "",
    childLastName: splitFullName(child?.name)?.lastName || "",
    childDob: child?.dob ? convertDateAUWithDayJS(child?.dob) : "",
    childAge: childAgeFromDob(child?.dob) || "",
    childGender: child?.gender || "",
    childRelationship: child?.relationship || "",
    childDepenantChild: child?.depenantChild || "",
  }));
}

function PersonalDetailsMapper(personalDetails, user) {
  return {
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
      "", // for Partner its partnerEmail;

    ...(user === "client" && {
      SingleClient: ["Single", "Widowed", ""].includes(
        personalDetails?.[user]?.[user + "MaritalStatus"] || "",
      ),
    }),
  };
}

function EmploymentDetailsMapper(incomeFromOwnBusiness, isSingleClient, user) {
  let employmentDetails = {
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

  employmentDetails.coupleEmployment = !isSingleClient
    ? incomeFromOwnBusiness?.owner?.includes("client") &&
      incomeFromOwnBusiness?.owner?.includes("partner")
      ? true
      : false
    : false;

  return employmentDetails;
}

function CentrelinkDetailsMapper(incomeFromCentrelink, isSingleClient, user) {
  let centrelinkDetails = {
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

  centrelinkDetails.coupleCentrelink = !isSingleClient
    ? incomeFromCentrelink?.owner?.includes("client") &&
      incomeFromCentrelink?.owner?.includes("partner")
      ? true
      : false
    : false;

  return centrelinkDetails;
}

function WillDetailsMapper(will, user) {
  let willDetails = {
    [user + "Will"]: will?.owner && will?.owner.includes(user) ? "Yes" : "No",
    [user + "WillYearSetUp"]: will?.[user]?.yearSetUp || "",
    [user + "WillsCurrent"]: will?.[user]?.willsCurrent || "",
    [user + "ExecutorItems"]:
      Array.isArray(will?.[user]?.executor) &&
      will?.[user]?.executor?.length > 0
        ? will?.[user]?.executor?.map((item, index) => {
            return {
              executorName: item?.name || "",
              executerRelationship: item?.relationshipStatus || "",
            };
          })
        : [],
    [user + "EnduringGuardianship"]: will?.[user]?.enduringGuardianship || "",
    [user + "EstatePlanningRadio"]: will?.[user]?.estatePlanningRadio || "",
    [user + "description"]: will?.[user]?.estatePlanningdescription || "",
  };
  return willDetails;
}

function POADetailsMapper(POA, user) {
  let POADetails = {
    [user + "POAType"]: POA?.[user]?.POAType || "",
    [user + "POAYearSetUp"]: POA?.[user]?.yearSetUp || "",
    [user + "POANameItems"]:
      Array.isArray(POA?.[user]?.POAName) && POA?.[user]?.POAName?.length > 0
        ? POA?.[user]?.POAName?.map((item, index) => {
            return {
              executorName: item?.name || "",
              executerRelationship: item?.relationshipStatus || "",
            };
          })
        : [],
  };
  return POADetails;
}

function ProfessionalAdviserDetailsMapper(professionalAdviser, user) {
  let ProfessionalAdviserDetails = {
    [user + "ProfessionalAdviseritems"]:
      Array.isArray(professionalAdviser?.[user]) &&
      professionalAdviser?.[user]?.length > 0
        ? professionalAdviser?.[user]?.map((item, index) => {
            return {
              POAType: item?.POAType || "",
              adviserName: item?.adviserName || "",
              company: item?.company || "",
              phone: item?.phone || "",
              email: item?.email || "",
            };
          })
        : [],
  };
  return ProfessionalAdviserDetails;
}

function incomeAndExpensesMapper(discoveryData, discoveryQuestions, user) {
  const EmploymentIncome =
    discoveryQuestions.incomeFromOwnBusiness == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromOwnBusiness?.[user + "Total"] || "$0",
        )
      : 0;

  const NetBusinessIncome =
    (discoveryQuestions.incomeFromSoleTrader == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromSoleTrader?.[user + "Total"] || "$0",
        )
      : 0) +
    (discoveryQuestions.incomeFromPartnership == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromPartnership?.[user + "Total"] || "$0",
        )
      : 0);

  const SuperPensionPayment =
    (discoveryQuestions.accountBasedPensionIssues === "Yes" &&
    Array.isArray(discoveryData?.accountBasedPensionIssues?.[user])
      ? discoveryData.accountBasedPensionIssues[user].reduce(
          (t, e) =>
            t +
            parseFloat((e?.pensionPayment || "$0").replace(/[^0-9.-]+/g, "")),
          0,
        )
      : 0) +
    (discoveryQuestions.SMSFPensionPhase === "Yes" &&
    Array.isArray(discoveryData?.SMSFPensionPhase?.[user])
      ? discoveryData.SMSFPensionPhase[user].reduce((Total, e) => {
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
    discoveryQuestions.incomeFromSuperPayment == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromSuperPayment?.[user + "Total"] || "$0",
        )
      : 0;

  const OverseasPensionPayment =
    discoveryQuestions.incomeFromOverseasPension == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromOverseasPension?.[user + "Total"] || "$0",
        )
      : 0;

  const CenterlinkPension =
    discoveryQuestions.incomeFromCentrelink == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromCentrelink?.[user + "Total"] || "$0",
        )
      : 0;

  const RentalIncome =
    discoveryQuestions?.investmentPropertyDetails == "Yes" &&
    discoveryData?.investmentPropertyDetails?.client
      ? parseMoney(
          discoveryData?.investmentPropertyDetails?.client.reduce(
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
    ((discoveryQuestions.bankAccountFinance == "Yes"
      ? parseMoney(discoveryData?.bankAccountFinance?.[user + "Total"] || "$0")
      : 0) +
      (discoveryQuestions.termDepositsFinance == "Yes"
        ? parseMoney(
            discoveryData?.termDepositsFinance?.[user + "Total"] || "$0",
          )
        : 0)) *
    0.03;

  const DividendIncome =
    ((discoveryQuestions.australianShareMarket == "Yes"
      ? parseMoney(
          discoveryData?.australianShareMarket?.[user + "Total"] || "$0",
        )
      : 0) +
      (discoveryQuestions.managedFund == "Yes"
        ? parseMoney(discoveryData?.managedFund?.[user + "Total"] || "$0")
        : 0)) *
    0.035;

  const AnnutiesIncome =
    discoveryQuestions.annuitiesIssues == "Yes"
      ? discoveryData?.annuitiesIssues?.[user]?.reduce(
          (t, e) => t + parseMoney(e.annualAnnuityPayment || "$0"),
          0,
        )
      : 0;

  //following are just clientside expenses, partner side expenses are not included in document as of now
  const GeneralLivingExpensesTotal =
    discoveryQuestions.incomeFromRegularLivingExpenses == "Yes"
      ? parseMoney(
          discoveryData?.generalLivingExpenses?.generalLivingExpensesTotal ||
            "$0",
        )
      : 0;

  const FamilyHome =
    discoveryQuestions.familyHome == "Yes"
      ? parseMoney(
          discoveryData?.familyHome?.HomeLoanModal?.annualRepayments || "$0",
        )
      : 0;

  const InvestmentProperty =
    discoveryQuestions.investmentPropertyDetails == "Yes"
      ? discoveryData?.investmentPropertyDetails?.[user]?.reduce(
          (t, e) => t + parseMoney(e.incomeExpenses || "$0"),
          0,
        )
      : 0;

  const InvestmentPropertyLoan =
    discoveryQuestions.investmentPropertyDetails == "Yes"
      ? discoveryData?.investmentPropertyDetails?.[user]?.reduce(
          (t, e) =>
            t +
            parseMoney(
              e?.propertyLoanDetailsArray[0]?.AnnualRepayments || "$0",
            ),
          0,
        )
      : 0;

  const PersonalLoan =
    discoveryQuestions.personalLoans == "Yes"
      ? discoveryData?.personalLoans?.[user]?.reduce(
          (t, e) => t + parseMoney(e.AnnualRepayments || "$0"),
          0,
        )
      : 0;

  const CreditCards =
    discoveryQuestions.creditCards == "Yes"
      ? discoveryData?.creditCards?.[user]?.reduce(
          (t, e) => t + parseMoney(e.AnnualRepayments || "$0"),
          0,
        )
      : 0;

  const InvestmentLoan =
    (discoveryQuestions.managedFundsLOC == "Yes"
      ? parseMoney(
          discoveryData?.managedFundsLOC?.client?.repaymentsAmount || "$0",
        ) +
        parseMoney(
          discoveryData?.managedFundsLOC?.partner?.repaymentsAmount || "$0",
        ) +
        parseMoney(
          discoveryData?.managedFundsLOC?.joint?.repaymentsAmount || "$0",
        )
      : 0) +
    (discoveryQuestions.managedFundsMarginLoan == "Yes"
      ? parseMoney(
          discoveryData?.managedFundsMarginLoan?.client?.annualLoan || "$0",
        ) +
        parseMoney(
          discoveryData?.managedFundsMarginLoan?.partner?.annualLoan || "$0",
        ) +
        parseMoney(
          discoveryData?.managedFundsMarginLoan?.joint?.annualLoan || "$0",
        )
      : 0);

  const SuperContributions =
    discoveryQuestions.incomeFromOwnBusiness == "Yes"
      ? parseMoney(
          discoveryData?.incomeFromOwnBusiness?.client?.SalaryPackageModal
            ?.salarySacrificeContributions || "$0",
        ) +
        parseMoney(
          discoveryData?.incomeFromOwnBusiness?.client?.SalaryPackageModal
            ?.afterTaxContributions || "$0",
        ) +
        parseMoney(
          discoveryData?.incomeFromOwnBusiness?.partner?.SalaryPackageModal
            ?.salarySacrificeContributions || "$0",
        ) +
        parseMoney(
          discoveryData?.incomeFromOwnBusiness?.partner?.SalaryPackageModal
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

const SMSFCurrentBalance = (discoveryData, discoveryQuestions) => {
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
        acc +
        pickTotal(
          discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
        )
      );
    }, 0);

    // -----------------------------
    // SUM ALL LIABILITIES
    // -----------------------------
    const liabilitiesSum = liabilityKeys.reduce((acc, key) => {
      return (
        acc +
        pickTotal(
          discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
          ["totalDebt", "SMSFTotal", "propertyPortfolio"],
        )
      );
    }, 0);

    const netTotal = assetsSum - liabilitiesSum;

    return toCommaAndDollar(netTotal);
  } catch (error) {
    console.error("Error calculating SMSF totals:", error);
    return "$0";
  }
};

const FamilyInvestmentTrustCurrentBalance = (
  discoveryData,
  discoveryQuestions,
) => {
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
          pickTotal(
            discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
          )
        );
      }, 0);

      // sum liabilities
      const liabilitiesSum = liabilityKeys.reduce((acc, key) => {
        return (
          acc +
          pickTotal(
            discoveryQuestions?.[key] === "Yes" ? discoveryData?.[key] : "$0",
            ["totalDebt", "trustTotal", "propertyPortfolio"],
          )
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

function Summary_of_Networth(
  discoveryData,
  discoveryQuestions,
  isSingleClient,
  user,
) {
  const get = (path, fallback = "$0") => path ?? fallback;

  const money = (val) => parseMoney(val || "$0");

  const sumKeys = (obj, keys) =>
    toCommaAndDollar(keys.reduce((acc, key) => acc + money(obj[key]), 0));

  const data = {};

  const isSingle = isSingleClient;

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
    user == "client" ? get(discoveryData?.familyHome?.currentValue) : "$0";
  data[user + "FamilyHomeLoanBalance"] =
    user == "client"
      ? get(discoveryData?.familyHome?.HomeLoanModal?.loanBalance)
      : "$0";

  data[user + "FamilyHomeAddress"] =
    (discoveryData?.personalDetails?.client?.clientHomeAddress || "") +
    " (" +
    (discoveryData?.familyHome?.postCode || "") +
    ")";

  data[user + "CarCurrentValue"] = get(
    discoveryData?.car?.[user]?.currentValue,
  );

  if (user == "client" && isSingle) {
    data[user + "ContentsCurrentValue"] = get(
      discoveryData?.houseHold?.joint?.currentValue,
    );

    data[user + "BoatCurrentValue"] = get(
      discoveryData?.boat?.joint?.currentValue,
    );

    data[user + "CaravanCurrentValue"] = get(
      discoveryData?.caravan?.joint?.currentValue,
    );
  } else {
    data[user + "ContentsCurrentValue"] = get(
      discoveryData?.houseHold?.[user]?.currentValue,
    );

    data[user + "BoatCurrentValue"] = get(
      discoveryData?.boat?.[user]?.currentValue,
    );

    data[user + "CaravanCurrentValue"] = get(
      discoveryData?.caravan?.[user]?.currentValue,
    );
  }

  data[user + "OtherAssetsCurrentValue"] = get(
    discoveryData?.otherAssets?.[user]?.currentValue,
  );

  data[user + "LifestyleTotal"] = sumKeys(
    data,
    lifestyleKeys.map((k) => user + k),
  );

  /* -------------------- Investment Assets -------------------- */

  const investmentStaticKeys = {
    BankAccountCurrentBalance:
      discoveryQuestions?.bankAccountFinance == "Yes"
        ? discoveryData?.bankAccountFinance?.[user + "CurrentBalance"]
        : "$0",
    TermDepositsCurrentBalance:
      discoveryQuestions?.termDepositsFinance == "Yes"
        ? discoveryData?.termDepositsFinance?.[user + "CurrentBalance"]
        : "$0",
    AustralianSharesCurrentBalance:
      discoveryQuestions?.australianShareMarket == "Yes"
        ? discoveryData?.australianShareMarket?.[user + "CurrentBalance"]
        : "$0",
    PlatformInvestmentsCurrentBalance:
      discoveryQuestions?.managedFund == "Yes"
        ? discoveryData?.managedFund?.[user + "CurrentBalance"]
        : "$0",
    InvestmentBondsCurrentBalance:
      discoveryQuestions?.investmentBondFinance == "Yes"
        ? discoveryData?.investmentBondFinance?.[user + "CurrentBalance"]
        : "$0",
    SuperannuationCurrentBalance:
      discoveryQuestions?.superAnnuationIssues == "Yes"
        ? discoveryData?.superAnnuationIssues?.[user + "CurrentBalance"]
        : "$0",
    AccountBasedPensionsCurrentBalance:
      discoveryQuestions?.accountBasedPensionIssues == "Yes"
        ? discoveryData?.accountBasedPensionIssues?.[user + "CurrentBalance"]
        : "$0",
    AnnuitiesCurrentBalance:
      discoveryQuestions?.annuitiesIssues == "Yes"
        ? discoveryData?.annuitiesIssues?.[user + "CurrentBalance"]
        : "$0",
  };

  Object.entries(investmentStaticKeys).forEach(([key, value]) => {
    data[user + key] = get(value);
  });

  /* ---- Investment Properties (Dynamic Loop instead of 10 manual lines) ---- */

  const propertyBalances = [];

  for (let i = 0; i < 10; i++) {
    const property = discoveryData?.investmentPropertyDetails?.client?.[i];

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
    discoveryData?.BusinessAsCompanyStructure?.[user + "CurrentBalance"],
  );

  data[user + "BusinessTrustCurrentBalance"] = get(
    discoveryData?.BusinessAsTrusts?.[user + "CurrentBalance"],
  );

  if (user === "client") {
    data[user + "SMSFCurrentBalance"] = SMSFCurrentBalance(
      discoveryData,
      discoveryQuestions,
    );

    data[user + "InvestmentTrustCurrentBalance"] =
      FamilyInvestmentTrustCurrentBalance(discoveryData, discoveryQuestions);

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
      discoveryData?.creditCards?.[user + "Total"],
    );
    data[user + "PersonalLoans"] = get(
      discoveryData?.personalLoans?.[user + "Total"],
    );

    data["jointLiabilityCreditCards"] = "$0";
    data["jointPersonalLoans"] = "$0";
  } else if (user === "joint" && !isSingle) {
    data["clientLiabilityCreditCards"] = "$0";
    data["clientPersonalLoans"] = "$0";
    data[user + "LiabilityCreditCards"] = get(
      discoveryData?.creditCards?.["clientTotal"],
    );
    data[user + "PersonalLoans"] = get(
      discoveryData?.personalLoans?.["clientTotal"],
    );
  }

  liabilityKeys.push(user + "LiabilityCreditCards", user + "PersonalLoans");

  for (let i = 1; i <= 10; i++) {
    liabilityKeys.push(`${user}InvestmentPropertyLoanBalance${i}`);
  }

  data[user + "InvestmentLoanBalance"] =
    get(discoveryData?.managedFundsLOC?.[user]?.loanBalance) || "$0";

  data[user + "MarginLoanBalance"] =
    get(discoveryData?.managedFundsMarginLoan?.[user]?.loanBalance) || "$0";

  liabilityKeys.push(
    user + "InvestmentLoanBalance",
    user + "MarginLoanBalance",
    user + "FamilyHomeLoanBalance",
  );

  data[user + "LiabilitiesTotal"] = sumKeys(data, liabilityKeys);

  return data;
}

function generateUserFinancialPortfolioData(
  discoveryData,
  discoveryQuestions,
  isSingleClient,
  user,
  investments,
) {
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
    banks: toIdNameMap(investments.FinancialInstitutions),
    platforms: toIdNameMap(investments.InvestmentPlatforms),
    bonds: toIdNameMap(investments.InvestmentBonds),
    superFunds: toIdNameMap(investments.SuperannuationFunds),
    pensions: toIdNameMap(investments.AccountBasedPensions),
    annuities: toIdNameMap(investments.Annuities),
  };

  /* ------------------ Data Builder ------------------ */

  const data = {};

  if (user === "SMSF") {
    /* ------------------ SMSF Builder ------------------ */

    /* ---- Bank Accounts ---- */

    data[user + "BankAccounts"] =
      discoveryQuestions?.SMSFBank == "Yes"
        ? mapArray(discoveryData?.SMSFBank?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "TermDeposits"] =
      discoveryQuestions?.SMSFTermDeposits == "Yes"
        ? mapArray(discoveryData?.SMSFTermDeposits?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "AustralianShare"] =
      discoveryQuestions?.SMSFAustralianShares == "Yes"
        ? discoveryData?.SMSFAustralianShares?.[user] || []
        : [];

    /* ---- Platform Investments ---- */

    data[user + "PlatFromInvestment"] =
      discoveryQuestions?.SMSFManagedFunds == "Yes"
        ? mapArray(discoveryData?.SMSFManagedFunds?.[user], (item) => ({
            ...item,
            platformName: resolvePlatformName(
              bankMaps.platforms,
              item.platformName,
            ),
            owner:
              discoveryData?.personalDetails?.client?.["clientPreferredName"] ||
              "",
            portfolioValueArray: mapArray(
              item.portfolioValueArray,
              (element) => ({
                ...element,
                investmentOption: resolveInvestmentOption(
                  investments.InvestmentPlatforms,
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
      discoveryQuestions?.familyBank == "Yes"
        ? mapArray(discoveryData?.familyBank?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "TermDeposits"] =
      discoveryQuestions?.familyTermDeposit == "Yes"
        ? mapArray(discoveryData?.familyTermDeposit?.[user], (item) => ({
            ...item,
            Institution: bankMaps.banks[item.Institution],
          }))
        : [];

    data[user + "AustralianShare"] =
      discoveryQuestions?.familyAustralianShare == "Yes"
        ? discoveryData?.familyAustralianShare?.[user] || []
        : [];

    /* ---- Platform Investments ---- */

    data[user + "PlatFromInvestment"] =
      discoveryQuestions?.familyMangedFunds == "Yes"
        ? mapArray(discoveryData?.familyMangedFunds?.[user], (item) => ({
            ...item,
            platformName: resolvePlatformName(
              bankMaps.platforms,
              item.platformName,
            ),
            owner:
              discoveryData?.personalDetails?.client?.["clientPreferredName"] ||
              "",
            portfolioValueArray: mapArray(
              item.portfolioValueArray,
              (element) => ({
                ...element,
                investmentOption: resolveInvestmentOption(
                  investments.InvestmentPlatforms,
                  item.platformName,
                  element.investmentOption,
                ),
              }),
            ),
          }))
        : [];

    return data;
  }

  const ownerName =
    discoveryData?.personalDetails?.[user]?.[user + "PreferredName"] || "";

  /* ---- Bank Accounts ---- */

  data[user + "BankAccounts"] =
    discoveryQuestions?.bankAccountFinance == "Yes"
      ? mapArray(discoveryData?.bankAccountFinance?.[user], (item) => ({
          ...item,
          Institution: bankMaps.banks[item.Institution],
        }))
      : [];

  data[user + "TermDeposits"] =
    discoveryQuestions?.bankAccountFinance == "Yes"
      ? mapArray(discoveryData?.termDepositsFinance?.[user], (item) => ({
          ...item,
          Institution: bankMaps.banks[item.Institution],
        }))
      : [];

  data[user + "AustralianShare"] =
    discoveryQuestions?.australianShareMarket == "Yes"
      ? discoveryData?.australianShareMarket?.[user] || []
      : [];

  /* ---- Platform Investments ---- */

  data[user + "PlatFromInvestment"] =
    discoveryQuestions?.managedFund == "Yes"
      ? mapArray(discoveryData?.managedFund?.[user], (item) => ({
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
                investments.InvestmentPlatforms,
                item.platformName,
                element.investmentOption,
              ),
            }),
          ),
        }))
      : [];

  /* ---- Investment Bonds ---- */

  data[user + "InvestmentBond"] =
    discoveryQuestions?.investmentBondFinance == "Yes"
      ? mapArray(discoveryData?.investmentBondFinance?.[user], (item) => ({
          ...item,
          platformName: resolvePlatformName(bankMaps.bonds, item.platformName),
          owner: ownerName,
          portfolioValueArray: mapArray(
            item.portfolioValueArray,
            (element) => ({
              ...element,
              investmentOption: resolveInvestmentOption(
                investments.InvestmentBonds,
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
      discoveryQuestions?.superAnnuationIssues == "Yes"
        ? mapArray(discoveryData?.superAnnuationIssues?.[user], (item) => {
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
                    investments.SuperannuationFunds,
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
      discoveryQuestions?.accountBasedPensionIssues == "Yes"
        ? mapArray(discoveryData?.accountBasedPensionIssues?.[user], (item) => {
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
                    investments.AccountBasedPensions,
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
      discoveryQuestions?.annuitiesIssues == "Yes"
        ? mapArray(discoveryData?.annuitiesIssues?.[user], (item) => ({
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
      discoveryQuestions?.BusinessAsCompanyStructure == "Yes"
        ? mapArray(
            discoveryData?.BusinessAsCompanyStructure?.[user],
            (item) => ({
              ...item,
              owner: ownerName,
            }),
          )
        : [];

    /* ---- BUSINESS TRUST ---- */

    data[user + "BusinessTrust"] =
      discoveryQuestions?.BusinessAsTrusts == "Yes"
        ? mapArray(discoveryData?.BusinessAsTrusts?.[user], (item) => ({
            ...item,
            owner: ownerName,
            isTrusteeTypeCorporate: item?.trusteeType === "Corporate",
          }))
        : [];
  }

  return data;
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

function buildLifeTPDTraumaAuthArray(discoveryData, investments, type) {
  const providerMap = toIdNameMap(investments?.PersonalInsurances || []);
  const policies = Array.isArray(
    discoveryData?.personalInsurance?.[type]?.PersonalInsurance,
  )
    ? discoveryData.personalInsurance[type].PersonalInsurance
    : [];

  return policies.map((item) => ({
    ...item,
    provider: providerMap?.[item?.provider] || "",
  }));
}

function getAccumulationBenefitsEntry(discoveryData, type) {
  const memberRows = Array.isArray(
    discoveryData?.SMSFAccumulationDetails?.[type],
  )
    ? discoveryData.SMSFAccumulationDetails[type]
    : [];
  const firstRow = memberRows[0] || {};
  const benefits = firstRow?.accumulationBenefitsArray;

  if (Array.isArray(benefits)) {
    return benefits[0] || {};
  }

  if (benefits && typeof benefits === "object") {
    return benefits;
  }

  return {};
}

function getFrequencyLabel(value) {
  return (
    FREQUENCY_OPTIONS.find(
      (frequency) => String(frequency.value) === String(value ?? ""),
    )?.label || ""
  );
}

function buildExpenseSummaryEntries(
  sectionData = {},
  definitions = [],
  prefix = "",
) {
  return definitions.reduce((acc, expense, index) => {
    const amount = sectionData?.[expense.id] || "0";
    const frequency = sectionData?.[`${expense.id}Type`] || "";
    const total = parseMoney(amount) * (parseFloat(frequency) || 0);

    acc[`${prefix}Amount${index + 1}`] = amount;
    acc[`${prefix}Frequency${index + 1}`] = getFrequencyLabel(frequency);
    acc[`${prefix}Total${index + 1}`] = toCommaAndDollar(total);

    return acc;
  }, {});
}

function getGoalField(goalsQuestions, goalsData, goalKey, field) {
  return goalsQuestions?.[goalKey] === "Yes"
    ? goalsData?.[goalKey]?.[field] || ""
    : "";
}

function getGoalTitleFromDiscoveryRoutes(goalKey) {
  const goalsRoute = (discoveryRoutes || []).find(
    (route) =>
      route?.relativePath === "goals-objectives" ||
      route?.stepTitle === "Goals & Objectives",
  );

  const matchedSection = (goalsRoute?.Cards || [])
    .flatMap((card) => card?.sections || [])
    .find((section) => section?.key === goalKey);

  return matchedSection?.title || "";
}

function getFirstSMSFPensionEntry(discoveryData) {
  const ownerKeys = ["client", "partner", "joint"];

  for (const ownerKey of ownerKeys) {
    const rows = Array.isArray(discoveryData?.SMSFPensionPhase?.[ownerKey])
      ? discoveryData.SMSFPensionPhase[ownerKey]
      : [];

    for (const row of rows) {
      const entries = Array.isArray(row?.pensionBenefitsTotalArray)
        ? row.pensionBenefitsTotalArray
        : [];
      const firstEntry = entries.find(
        (item) =>
          item && typeof item === "object" && Object.keys(item).length > 0,
      );

      if (firstEntry) return firstEntry;
    }
  }

  return {};
}

function buildSMSFAccumulationDocumentData(discoveryData) {
  const clientRow = Array.isArray(
    discoveryData?.SMSFAccumulationDetails?.client,
  )
    ? discoveryData.SMSFAccumulationDetails.client[0] || {}
    : {};
  const partnerRow = Array.isArray(
    discoveryData?.SMSFAccumulationDetails?.partner,
  )
    ? discoveryData.SMSFAccumulationDetails.partner[0] || {}
    : {};

  const clientAccumulation = getAccumulationBenefitsEntry(
    discoveryData,
    "client",
  );
  const partnerAccumulation = getAccumulationBenefitsEntry(
    discoveryData,
    "partner",
  );

  const buildContributionMap = (memberRow = {}) => {
    const startYear = Number(memberRow?.contributionsStartYear) || 0;
    const entries = Array.isArray(memberRow?.contributionsArray)
      ? memberRow.contributionsArray
      : [];
    const yearMap = {};

    entries.forEach((entry, index) => {
      const year = startYear ? startYear + index + 1 : 0;
      if (year) {
        yearMap[year] = entry || {};
      }
    });

    return yearMap;
  };

  const clientMap = buildContributionMap(clientRow);
  const partnerMap = buildContributionMap(partnerRow);

  const allYears = [
    ...new Set([...Object.keys(clientMap), ...Object.keys(partnerMap)]),
  ]
    .map(Number)
    .filter(Boolean)
    .sort((a, b) => a - b);

  const nonConcessionalArray = allYears.map((year) => ({
    year,
    clientNonConcessionalContributions:
      clientMap[year]?.nonConcessionalContributions || "$0",
    partnerNonConcessionalContributions:
      partnerMap[year]?.nonConcessionalContributions || "$0",
  }));

  const concessionalArray = allYears.map((year) => ({
    year,
    clientConcessionalContributions: clientMap[year]?.totalConcessional || "$0",
    partnerConcessionalContributions:
      partnerMap[year]?.totalConcessional || "$0",
  }));

  if (nonConcessionalArray.length > 0 && nonConcessionalArray.length < 3) {
    for (let i = nonConcessionalArray.length; i < 3; i += 1) {
      nonConcessionalArray.unshift({
        clientNonConcessionalContributions: "$0",
        partnerNonConcessionalContributions: "$0",
        year:
          nonConcessionalArray[0]?.year - 1 ||
          new Date().getFullYear() - (3 - i),
      });
    }
  }

  if (concessionalArray.length > 0 && concessionalArray.length < 6) {
    for (let i = concessionalArray.length; i < 6; i += 1) {
      concessionalArray.unshift({
        clientConcessionalContributions: "$0",
        partnerConcessionalContributions: "$0",
        year:
          concessionalArray[0]?.year - 1 || new Date().getFullYear() - (6 - i),
      });
    }
  }

  return {
    SMSFAccumulation_nonConcessionalArray: nonConcessionalArray,
    SMSFAccumulation_ConcessionalArray: concessionalArray,

    SMSFAccumulation_client_currentBalance:
      clientAccumulation?.currentBalance || "",
    SMSFAccumulation_client_eligibleServiceDate:
      convertDateAUWithDayJS(clientAccumulation?.eligibleServiceDate) || "",
    SMSFAccumulation_client_commencementDate:
      convertDateAUWithDayJS(clientAccumulation?.commencementDate) || "",
    SMSFAccumulation_client_taxFreeComponent:
      clientAccumulation?.taxFreeComponent || "",
    SMSFAccumulation_client_taxableComponent:
      clientAccumulation?.taxableComponent || "",
    SMSFAccumulation_client_restrictedNonPreserved:
      clientAccumulation?.restrictedNonPreserved || "",
    SMSFAccumulation_client_unRestrictedNonPreserved:
      clientAccumulation?.unrestrictedNonPreserved ||
      clientAccumulation?.unRestrictedNonPreserved ||
      "",
    SMSFAccumulation_client_preservedAmount:
      clientAccumulation?.preservedAmount || "",

    SMSFAccumulation_partner_currentBalance:
      partnerAccumulation?.currentBalance || "",
    SMSFAccumulation_partner_eligibleServiceDate:
      convertDateAUWithDayJS(partnerAccumulation?.eligibleServiceDate) || "",
    SMSFAccumulation_partner_commencementDate:
      convertDateAUWithDayJS(partnerAccumulation?.commencementDate) || "",
    SMSFAccumulation_partner_taxFreeComponent:
      partnerAccumulation?.taxFreeComponent || "",
    SMSFAccumulation_partner_taxableComponent:
      partnerAccumulation?.taxableComponent || "",
    SMSFAccumulation_partner_restrictedNonPreserved:
      partnerAccumulation?.restrictedNonPreserved || "",
    SMSFAccumulation_partner_unRestrictedNonPreserved:
      partnerAccumulation?.unrestrictedNonPreserved ||
      partnerAccumulation?.unRestrictedNonPreserved ||
      "",
    SMSFAccumulation_partner_preservedAmount:
      partnerAccumulation?.preservedAmount || "",
  };
}

function padContributionArray(arr, minLength, templateFactory) {
  if (!Array.isArray(arr)) return [];

  const next = [...arr];
  while (next.length < minLength) {
    next.unshift(templateFactory(next[0]));
  }

  return next;
}

function sumContributionByIndex(funds, key, index) {
  return (funds || []).reduce((sum, fund) => {
    const fieldName =
      key === "contributionsArrayConcessional"
        ? "totalConcessional"
        : "nonConcessionalContributions";

    return sum + parseMoney(fund?.[key]?.[index]?.[fieldName] || "$0");
  }, 0);
}

function getContributionEntries(memberRow = {}) {
  if (Array.isArray(memberRow?.contributionsArray)) {
    return memberRow.contributionsArray;
  }

  if (Array.isArray(memberRow?.contributionsArray?.newEntries)) {
    return memberRow.contributionsArray.newEntries;
  }

  return [];
}

function calculateSuperAndSMSFSums({
  payload,
  discoveryData,
  minNCC = 3,
  minCC = 6,
}) {
  if (Array.isArray(payload?.clientSuperFund)) {
    payload.clientSuperFund.forEach((fund) => {
      fund.contributionsArrayNonConcessional = padContributionArray(
        fund?.contributionsArrayNonConcessional,
        minNCC,
        (first) => ({
          nonConcessionalContributions: "$0",
          year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
        }),
      );

      fund.contributionsArrayConcessional = padContributionArray(
        fund?.contributionsArrayConcessional,
        minCC,
        (first) => ({
          totalConcessional: "$0",
          year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
        }),
      );
    });
  }

  let smsfContributions = getContributionEntries(
    discoveryData?.SMSFAccumulationDetails?.client?.[0],
  );

  smsfContributions = padContributionArray(smsfContributions, minCC, () => ({
    totalConcessional: "$0",
    nonConcessionalContributions: "$0",
  }));

  for (let i = 0; i < minNCC; i += 1) {
    payload[`clientSumOfNCCSuperAndSMSF${i + 1}`] = toCommaAndDollar(
      sumContributionByIndex(
        payload.clientSuperFund,
        "contributionsArrayNonConcessional",
        i,
      ) +
        parseMoney(
          smsfContributions.at(-(minNCC - i))?.nonConcessionalContributions ||
            "$0",
        ),
    );
  }

  for (let i = 0; i < minCC; i += 1) {
    payload[`clientSumOfCCSuperAndSMSF${i + 1}`] = toCommaAndDollar(
      sumContributionByIndex(
        payload.clientSuperFund,
        "contributionsArrayConcessional",
        i,
      ) +
        parseMoney(
          smsfContributions.at(-(minCC - i))?.totalConcessional || "$0",
        ),
    );
  }

  return payload;
}

function buildDiscoveryData(
  discoveryData,
  type,
  discoveryQuestions,
  isSingleClient,
  investments,
) {
  const personalDetails = discoveryData?.personalDetails || {};
  let preData = {
    ...PersonalDetailsMapper(personalDetails, type),
    ...EmploymentDetailsMapper(
      discoveryData?.incomeFromOwnBusiness,
      isSingleClient,
      type,
    ),
    ...CentrelinkDetailsMapper(
      discoveryData?.incomeFromCentrelink,
      isSingleClient,
      type,
    ),
    ...WillDetailsMapper(discoveryData?.will, type),
    ...POADetailsMapper(discoveryData?.POA, type),
    ...ProfessionalAdviserDetailsMapper(
      discoveryData?.professionalAdviser,
      type,
    ),

    //INCOME AND EXPENSES Table
    ...incomeAndExpensesMapper(discoveryData, discoveryQuestions, type),

    //Summary of Networth
    ...Summary_of_Networth(
      discoveryData,
      discoveryQuestions,
      isSingleClient,
      type,
    ),

    //Bank Details, Term Deposits, Australian Shares, platform Investment Bonds, Investment Bonds, Super Annuation, Account Based Pension, Annuities
    ...generateUserFinancialPortfolioData(
      discoveryData,
      discoveryQuestions,
      isSingleClient,
      type,
      investments,
    ),

    //Life,TPD, Trauma, Income Protection Insurance policies
    [type + "LifeTPDTraumaArray"]: [
      ...buildLifeTPDTraumaArray(
        discoveryData?.personalInsurance?.[type]?.PersonalInsurance,
        toIdNameMap(investments?.PersonalInsurances || []),
        type,
      ),
    ],
    [type + "LifeTPDTraumaAuthArray"]: buildLifeTPDTraumaAuthArray(
      discoveryData,
      investments,
      type,
    ),
    [type + "AccumulationBalanceCurrentBalance"]:
      getAccumulationBenefitsEntry(discoveryData, type)?.currentBalance || "",
    [type + "AccumulationBalanceEligibleServiceDate"]:
      getAccumulationBenefitsEntry(discoveryData, type)?.eligibleServiceDate
        ? convertDateAUWithDayJS(
            getAccumulationBenefitsEntry(discoveryData, type)
              ?.eligibleServiceDate,
          )
        : "",
    [type + "AccumulationBalanceCommencementDate"]:
      getAccumulationBenefitsEntry(discoveryData, type)?.commencementDate
        ? convertDateAUWithDayJS(
            getAccumulationBenefitsEntry(discoveryData, type)?.commencementDate,
          )
        : "",
  };

  return preData;
}

export async function generatePersonalDetailsDocument(
  id,
  templateFileName = "personalDetails.docx",
  downloadFileName = "personalDetails.docx",
) {
  try {
    const session = appStore.get(loggedInUser);
    const discoveryData = appStore.get(discoveryDataAtom);
    const discoveryQuestions = appStore.get(discoverySectionQuestionsAtom);
    const goalsData = appStore.get(goalsDataAtom);
    const goalsQuestions = appStore.get(goalsSectionQuestionsAtom);
    const riskProfileData = appStore.get(riskProfileDataAtom);
    const investments = appStore.get(InvestmentOffersData);

    let isSingleClient = ["Single", "Widowed", ""].includes(
      discoveryData?.personalDetails?.client?.clientMaritalStatus || "",
    );

    //Function to check props id and _id in atoms are same

    const dataVariation = DataVariationVerification(
      id,
      discoveryData,
      discoveryQuestions,
      goalsData,
      goalsQuestions,
      riskProfileData,
    );
    if (dataVariation) {
      message.error("Data variation verification failed in the atoms");
      throw new Error("Data variation verification failed in the atoms");
    }

    const adviserName =
      session &&
      typeof session?.user === "object" &&
      Object.keys(session?.user || {}).length > 0
        ? `${toSentenceCase(session?.user?.firstName || "")} ${toSentenceCase(
            session?.user?.lastName || "",
          )}`.trim()
        : "Guest";

    let adviserEmail = session.email;
    const personalDetails = discoveryData?.personalDetails || {};
    const generalLivingExpenses = discoveryData?.generalLivingExpenses || {};
    const smsfOwner = discoveryData?.SMSFDetails?.SMSFOwner || {};
    const smsfBareTrust = smsfOwner?.directorsOfBareTrust || {};
    const firstSMSFPensionEntry = getFirstSMSFPensionEntry(discoveryData);
    const firstSMSFPensionDetails =
      firstSMSFPensionEntry?.pensionBenefitsDetails || {};
    const familyTrustOwner =
      discoveryData?.familyDetails?.familyTrustOwner || {};

    let payload = {
      clientName: discoveryData?.personalDetails?.client?.clientGivenName || "",
      adviserName: adviserName || "",
      adviserEmail: adviserEmail || "",

      downloadDate: new Date().toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      PageBreak: `<w:br w:type="page"/>`,

      items: Object.keys(goalsQuestions || {})
        .filter(
          (key) =>
            goalsQuestions[key] === "Yes" &&
            goalsData[key] &&
            Object.keys(goalsData[key]).length > 0,
        )
        .map((key) => {
          const item = goalsData[key];
          return {
            goalName: getGoalTitleFromDiscoveryRoutes(key) || item?.title || "",
            scopeOfAdvice: item?.scopeOfAdvice || "",
            description: RemoveSpan(item?.description || ""),
            when: item?.when || item?.whenScopeIs || "",
            estimatedValue: item?.estimatedValue || "",
          };
        }),

      childitem: ChildrenSectionArrayData(
        discoveryData?.personalDetails?.children?.arrayOfChildren || [],
      ),

      ...buildDiscoveryData(
        discoveryData,
        "client",
        discoveryQuestions,
        isSingleClient,
        investments,
      ),
      ...(isSingleClient
        ? []
        : buildDiscoveryData(
            discoveryData,
            "partner",
            discoveryQuestions,
            isSingleClient,
            investments,
          )),

      //Bank Details, Term Deposits, Australian Shares, platform Investment Bonds, Investment Bonds, Super Annuation, Account Based Pension, Annuities
      ...(isSingleClient
        ? []
        : generateUserFinancialPortfolioData(
            discoveryData,
            discoveryQuestions,
            isSingleClient,
            "joint",
            investments,
          )),

      ...(isSingleClient
        ? []
        : Summary_of_Networth(
            discoveryData,
            discoveryQuestions,
            isSingleClient,
            "joint",
          )),

      TotalLivingExpenses:
        generalLivingExpenses?.generalLivingExpensesTotal || "",
      ...buildExpenseSummaryEntries(
        generalLivingExpenses,
        expenseTypes,
        "houseHold",
      ),
      ...buildExpenseSummaryEntries(
        generalLivingExpenses,
        personalExpenses,
        "lifeStyle",
      ),
      ...buildExpenseSummaryEntries(
        generalLivingExpenses,
        transportExpenses,
        "transport",
      ),
      ...buildExpenseSummaryEntries(
        generalLivingExpenses,
        insuranceExpenses,
        "Insurance",
      ),

      motorVahicleYear: getGoalField(
        goalsQuestions,
        goalsData,
        "carGoal",
        "when",
      ),
      motorVahicleAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "carGoal",
        "estimatedValue",
      ),
      boatYear: getGoalField(goalsQuestions, goalsData, "boatGoal", "when"),
      boatAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "boatGoal",
        "estimatedValue",
      ),
      caravanYear: getGoalField(
        goalsQuestions,
        goalsData,
        "caravanGoal",
        "when",
      ),
      caravanAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "caravanGoal",
        "estimatedValue",
      ),
      otherYear: getGoalField(
        goalsQuestions,
        goalsData,
        "familyLifeStyleGoal",
        "when",
      ),
      otherAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "familyLifeStyleGoal",
        "estimatedValue",
      ),
      homeRenovationsYear: getGoalField(
        goalsQuestions,
        goalsData,
        "renovateFamilyHomeGoal",
        "when",
      ),
      homeRenovationsAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "renovateFamilyHomeGoal",
        "estimatedValue",
      ),
      holidayYear: getGoalField(
        goalsQuestions,
        goalsData,
        "holidayGoal",
        "when",
      ),
      holidayAmount: getGoalField(
        goalsQuestions,
        goalsData,
        "holidayGoal",
        "estimatedValue",
      ),

      // SMSF
      SMSFfundName: smsfOwner?.fundName || "",
      SMSFABN: smsfOwner?.ABN || "",
      SMSFRegisterOffice: smsfOwner?.registeredOffice || "",
      SMSFBusinessPlace: smsfOwner?.placeOfBusiness || "",
      SMSFEstablishmentdate: smsfOwner?.establishmentDate
        ? convertDateAUWithDayJS(smsfOwner.establishmentDate)
        : "",
      SMSFTrusteeType: smsfOwner?.trusteeType || "",
      SMSFTrusteeName: smsfOwner?.trusteeName || "",
      SMSFACN: smsfOwner?.ACN || "",
      isSMSFTrusteeTypeIsCorporateTrustee:
        smsfOwner?.trusteeType === "Corporate",
      directorNamesList: smsfOwner?.directorsOfCorporateTrustee || [],
      isBareTrustYes: smsfOwner?.bareTrust === "Yes",
      SMSFbareTrusteeName: smsfBareTrust?.bareTrusteeName || "",
      SMSFCAN: smsfBareTrust?.ACN || "",
      SMSFdirectorNameArray: (Array.isArray(smsfBareTrust?.directorNameArray)
        ? smsfBareTrust.directorNameArray
        : []
      ).map((item) => ({
        SMSFBareTrustName: item,
      })),
      SMSFNameOfAccountant: smsfOwner?.nameOfAccountant || "",

      SMSFPensionDetailsPensionType: firstSMSFPensionEntry?.pensionType || "",
      SMSFPensionDetailsAccountBalance:
        firstSMSFPensionDetails?.portfolioValue ||
        firstSMSFPensionDetails?.accountBalance ||
        "",
      SMSFPensionDetailsCommencementDate:
        convertDateAUWithDayJS(firstSMSFPensionDetails?.commencementDate) || "",
      SMSFPensionDetailsEligibleServiceDate:
        convertDateAUWithDayJS(firstSMSFPensionDetails?.eligibleServiceDate) ||
        "",
      SMSFPensionDetailsPurchasePrice:
        firstSMSFPensionDetails?.purchasePrice || "",
      SMSFPensionDetailsTaxFreeComponent:
        firstSMSFPensionDetails?.taxFreeComponent || "",
      SMSFPensionDetailsTaxableComponent:
        firstSMSFPensionDetails?.taxableComponent || "",
      SMSFPensionDetailsUnrestrictedNonPreserved:
        firstSMSFPensionDetails?.unrestrictedNonPreserved || "",
      SMSFPensionDetailsRestrictedNonPreserved:
        firstSMSFPensionDetails?.restrictedNonPreserved || "",
      SMSFPensionDetailsPreservedAmount:
        firstSMSFPensionDetails?.preservedAmount || "",
      SMSFPensionDetailsAnnualPensionPayment:
        firstSMSFPensionEntry?.pensionPayment || "",

      SMSFBankCurrentBalance:
        discoveryData?.SMSFBank?.SMSFTotal ||
        discoveryData?.SMSFBank?.SMSFCurrentBalance ||
        "$0",
      SMSFTermCurrentBalance:
        discoveryData?.SMSFTermDeposits?.SMSFTotal ||
        discoveryData?.SMSFTermDeposits?.SMSFCurrentBalance ||
        "$0",
      SMSFAustralianCurrentBalance:
        discoveryData?.SMSFAustralianShares?.SMSFTotal ||
        discoveryData?.SMSFAustralianShares?.SMSFCurrentBalance ||
        "$0",
      SMSFPlatfromCurrentBalance:
        discoveryData?.SMSFManagedFunds?.SMSFTotal ||
        discoveryData?.SMSFManagedFunds?.SMSFCurrentBalance ||
        "$0",
      SMSFOtherCurrentBalance:
        discoveryData?.SMSFOtherInvestment?.SMSFTotal ||
        discoveryData?.SMSFOtherInvestment?.clientTotal ||
        "$0",

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `SMSFInvestmentCurrentBalance${i + 1}`,
          discoveryData?.SMSFInvestmentProperties?.SMSF?.[i]?.CurrentValue ||
            "$0",
        ]),
      ),
      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `SMSFInvestmentpropertyloan${i + 1}`,
          discoveryData?.SMSFInvestmentProperties?.SMSF?.[i]
            ?.propertyLoanDetailsArray?.[0]?.LoanBalance || "$0",
        ]),
      ),
      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => {
          const property =
            discoveryData?.SMSFInvestmentProperties?.SMSF?.[i] || {};
          const address = property?.PropertyAddress || "";
          const suburb = property?.postcodeSuburb || "";
          return [
            `SMSFInvestmentAddress${i + 1}`,
            address ? `${address} (${suburb})` : "",
          ];
        }),
      ),
      SMSFInvestmentloan:
        discoveryData?.SMSFInvestmentLoan?.SMSFTotal ||
        discoveryData?.SMSFInvestmentLoan?.SMSF?.loanBalance ||
        "$0",
      ...buildSMSFAccumulationDocumentData(discoveryData),
      ...generateUserFinancialPortfolioData(
        discoveryData,
        discoveryQuestions,
        isSingleClient,
        "SMSF",
        investments,
      ),

      // Family Trust
      FamilyTrustTrustName: familyTrustOwner?.trustName || "",
      FamilyTrustABN: familyTrustOwner?.ABN || "",
      FamilyTrustRegisteredOffice: familyTrustOwner?.registeredOffice || "",
      FamilyTrustPlaceOfBusiness: familyTrustOwner?.placeOfBusiness || "",
      FamilyTrustEstablishmentDate: familyTrustOwner?.establishmentDate
        ? convertDateAUWithDayJS(familyTrustOwner.establishmentDate)
        : "",
      FamilyTrustTrusteeType: familyTrustOwner?.trusteeType || "",
      FamilyTrustDirectorNamesList:
        familyTrustOwner?.directorsOfCorporateTrustee || [],
      FamilyTrustACN: familyTrustOwner?.ACN || "",
      FamilyTrustTrusteeName: familyTrustOwner?.trusteeName || "",
      isFamilyTrustTrusteeTypeCorporate:
        familyTrustOwner?.trusteeType === "Corporate",
      FamilyTrustNameOfAccountant: familyTrustOwner?.nameOfAccountant || "",
      FamilyTrustBankCurrentBalance:
        discoveryData?.familyBank?.trustTotal ||
        discoveryData?.familyBank?.trustCurrentBalance ||
        "",
      FamilyTrustTermCurrentBalance:
        discoveryData?.familyTermDeposit?.trustTotal ||
        discoveryData?.familyTermDeposit?.trustCurrentBalance ||
        "",
      FamilyTrustAustralianCurrentBalance:
        discoveryData?.familyAustralianShare?.trustTotal ||
        discoveryData?.familyAustralianShare?.trustCurrentBalance ||
        "",
      FamilyTrustPlatfromCurrentBalance:
        discoveryData?.familyMangedFunds?.trustTotal ||
        discoveryData?.familyMangedFunds?.trustCurrentBalance ||
        "",
      FamilyTrustOtherCurrentBalance:
        discoveryData?.familyOtherInvestment?.trustTotal ||
        discoveryData?.familyOtherInvestment?.clientTotal ||
        "",
      FamilyTrustInvestmentCurrentBalance:
        discoveryData?.familyInvestmentProperties?.propertyPortfolio ||
        discoveryData?.familyDetails?.clientTotal ||
        "",

      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `FamilyTrustInvestmentCurrentBalance${i + 1}`,
          discoveryData?.familyInvestmentProperties?.trust?.[i]?.CurrentValue ||
            "$0",
        ]),
      ),
      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `FamilyTrustInvestmentpropertyloan${i + 1}`,
          discoveryData?.familyInvestmentProperties?.trust?.[i]
            ?.propertyLoanDetailsArray?.[0]?.LoanBalance || "$0",
        ]),
      ),
      ...Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => {
          const property =
            discoveryData?.familyInvestmentProperties?.trust?.[i] || {};
          const address = property?.PropertyAddress || "";
          const suburb = property?.postcodeSuburb || "";
          return [
            `FamilyTrustInvestmentAddress${i + 1}`,
            address ? `${address} (${suburb})` : "",
          ];
        }),
      ),
      FamilyTrustInvestmentloan:
        discoveryData?.familyInvestmentHomeLoan?.trustTotal ||
        discoveryData?.familyInvestmentHomeLoan?.trust?.loanBalance ||
        "",
      ...generateUserFinancialPortfolioData(
        discoveryData,
        discoveryQuestions,
        isSingleClient,
        "trust",
        investments,
      ),
    };

    const sumByPrefix = (prefix) =>
      Object.keys(payload)
        .filter((key) => key.startsWith(prefix))
        .reduce((total, key) => total + (parseMoney(payload[key]) || 0), 0);

    payload.houseHoldTotal = toCommaAndDollar(sumByPrefix("houseHoldTotal"));
    payload.lifeStyleTotal = toCommaAndDollar(sumByPrefix("lifeStyleTotal"));
    payload.transportTotal = toCommaAndDollar(sumByPrefix("transportTotal"));
    payload.InsuranceTotal = toCommaAndDollar(sumByPrefix("InsuranceTotal"));

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
      parseMoney(payload?.partnerLiabilitiesTotal || "$0") +
        parseMoney(payload?.jointLiabilitiesTotal || "$0") +
        parseMoney(payload?.clientLiabilitiesTotal || "$0"),
    );

    payload.netWorth = toCommaAndDollar(
      parseMoney(payload?.totalCombinedAssets || "$0") -
        parseMoney(payload?.totalCombinedLiabilities || "$0"),
    );

    payload.SMSFAssetsTotal = toCommaAndDollar(
      parseMoney(payload?.SMSFBankCurrentBalance || "$0") +
        parseMoney(payload?.SMSFTermCurrentBalance || "$0") +
        parseMoney(payload?.SMSFAustralianCurrentBalance || "$0") +
        parseMoney(payload?.SMSFPlatfromCurrentBalance || "$0") +
        parseMoney(payload?.SMSFOtherCurrentBalance || "$0") +
        parseMoney(payload?.SMSFInvestmentCurrentBalance1 || "$0") +
        parseMoney(payload?.SMSFInvestmentCurrentBalance2 || "$0") +
        parseMoney(payload?.SMSFInvestmentCurrentBalance3 || "$0") +
        parseMoney(payload?.SMSFInvestmentCurrentBalance4 || "$0") +
        parseMoney(payload?.SMSFInvestmentCurrentBalance5 || "$0"),
    );

    payload.SMSFLiabilitiesTotal = toCommaAndDollar(
      parseMoney(payload?.SMSFInvestmentloan || "$0") +
        parseMoney(payload?.SMSFInvestmentpropertyloan1 || "$0") +
        parseMoney(payload?.SMSFInvestmentpropertyloan2 || "$0") +
        parseMoney(payload?.SMSFInvestmentpropertyloan3 || "$0") +
        parseMoney(payload?.SMSFInvestmentpropertyloan4 || "$0") +
        parseMoney(payload?.SMSFInvestmentpropertyloan5 || "$0"),
    );

    payload.SMSFNetWorth = toCommaAndDollar(
      parseMoney(payload?.SMSFAssetsTotal || "$0") -
        parseMoney(payload?.SMSFLiabilitiesTotal || "$0"),
    );

    payload.FamilyTrustAssetTotal = toCommaAndDollar(
      parseMoney(payload?.FamilyTrustBankCurrentBalance || "$0") +
        parseMoney(payload?.FamilyTrustTermCurrentBalance || "$0") +
        parseMoney(payload?.FamilyTrustAustralianCurrentBalance || "$0") +
        parseMoney(payload?.FamilyTrustPlatfromCurrentBalance || "$0") +
        parseMoney(payload?.FamilyTrustOtherCurrentBalance || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentCurrentBalance1 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentCurrentBalance2 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentCurrentBalance3 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentCurrentBalance4 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentCurrentBalance5 || "$0"),
    );

    payload.FamilyTrustLibilities = toCommaAndDollar(
      parseMoney(payload?.FamilyTrustInvestmentloan || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentpropertyloan1 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentpropertyloan2 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentpropertyloan3 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentpropertyloan4 || "$0") +
        parseMoney(payload?.FamilyTrustInvestmentpropertyloan5 || "$0"),
    );

    payload.FamilyTrustNetWorth = toCommaAndDollar(
      parseMoney(payload?.FamilyTrustAssetTotal || "$0") -
        parseMoney(payload?.FamilyTrustLibilities || "$0"),
    );

    payload = calculateSuperAndSMSFSums({
      payload,
      discoveryData,
    });

    if (!isSingleClient) {
      if (Array.isArray(payload?.partnerSuperFund)) {
        payload.partnerSuperFund.forEach((fund) => {
          fund.contributionsArrayNonConcessional = padContributionArray(
            fund?.contributionsArrayNonConcessional,
            3,
            (first) => ({
              nonConcessionalContributions: "$0",
              year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
            }),
          );

          fund.contributionsArrayConcessional = padContributionArray(
            fund?.contributionsArrayConcessional,
            6,
            (first) => ({
              totalConcessional: "$0",
              year: first?.year ? first.year - 1 : new Date().getFullYear() - 1,
            }),
          );
        });
      }

      let partnerSMSFContributions = getContributionEntries(
        discoveryData?.SMSFAccumulationDetails?.partner?.[0],
      );

      partnerSMSFContributions = padContributionArray(
        partnerSMSFContributions,
        6,
        () => ({
          totalConcessional: "$0",
          nonConcessionalContributions: "$0",
        }),
      );

      payload.partnerSumOfNCCSuperAndSMSF1 = toCommaAndDollar(
        sumContributionByIndex(
          payload?.partnerSuperFund,
          "contributionsArrayNonConcessional",
          0,
        ) +
          parseMoney(
            partnerSMSFContributions.at(-3)?.nonConcessionalContributions ||
              "$0",
          ),
      );

      payload.partnerSumOfNCCSuperAndSMSF2 = toCommaAndDollar(
        sumContributionByIndex(
          payload?.partnerSuperFund,
          "contributionsArrayNonConcessional",
          1,
        ) +
          parseMoney(
            partnerSMSFContributions.at(-2)?.nonConcessionalContributions ||
              "$0",
          ),
      );

      payload.partnerSumOfNCCSuperAndSMSF3 = toCommaAndDollar(
        sumContributionByIndex(
          payload?.partnerSuperFund,
          "contributionsArrayNonConcessional",
          2,
        ) +
          parseMoney(
            partnerSMSFContributions.at(-1)?.nonConcessionalContributions ||
              "$0",
          ),
      );

      for (let i = 0; i < 6; i += 1) {
        payload[`partnerSumOfCCSuperAndSMSF${i + 1}`] = toCommaAndDollar(
          sumContributionByIndex(
            payload?.partnerSuperFund,
            "contributionsArrayConcessional",
            i,
          ) +
            parseMoney(
              partnerSMSFContributions.at(-(6 - i))?.totalConcessional || "$0",
            ),
        );
      }
    }

    payload.jointTotalIncome = toCommaAndDollar(
      parseMoney(payload?.clientTotalIncome || "$0") +
        parseMoney(payload?.partnerTotalIncome || "$0"),
    );

    const salarySacrificeClient = parseMoney(
      payload?.clientSalarySacrificeContributions || "$0",
    );
    const salarySacrificePartner = parseMoney(
      payload?.partnerSalarySacrificeContributions || "$0",
    );

    const propertyRows = Array.isArray(
      discoveryData?.investmentPropertyDetails?.client,
    )
      ? discoveryData.investmentPropertyDetails.client
      : [];

    const clientPropertyExpenses = propertyRows.reduce(
      (total, item) =>
        total +
        parseMoney(item?.incomeExpenses || "$0") *
          (parseMoney(item?.clientOwnership || "$0") / 100),
      0,
    );

    const partnerPropertyExpenses = propertyRows.reduce(
      (total, item) =>
        total +
        parseMoney(item?.incomeExpenses || "$0") *
          (parseMoney(item?.partnerOwnership || "$0") / 100),
      0,
    );

    const clientTotalDeductions =
      clientPropertyExpenses + salarySacrificeClient;
    const partnerTotalDeductions =
      partnerPropertyExpenses + salarySacrificePartner;

    const clientInterest = propertyRows.reduce(
      (total, item) =>
        total +
        parseMoney(item?.propertyLoanDetails || "$0") *
          (parseMoney(
            item?.propertyLoanDetailsArray?.[0]?.InterestRate || "0%",
          ) /
            100) *
          (parseMoney(item?.clientOwnership || "0%") / 100),
      0,
    );

    const partnerInterest = propertyRows.reduce(
      (total, item) =>
        total +
        parseMoney(item?.propertyLoanDetails || "$0") *
          (parseMoney(
            item?.propertyLoanDetailsArray?.[0]?.InterestRate || "0%",
          ) /
            100) *
          (parseMoney(item?.partnerOwnership || "0%") / 100),
      0,
    );

    const clientNetTaxableIncome =
      parseMoney(payload?.clientTotalIncome || "$0") -
      (clientTotalDeductions + clientInterest);
    const partnerNetTaxableIncome =
      parseMoney(payload?.partnerTotalIncome || "$0") -
      (partnerTotalDeductions + partnerInterest);

    const taxBrackets = [
      { minThreshold: 0, threshold: 18200, rate: 0 },
      { minThreshold: 18200, threshold: 45000, rate: 0.16 },
      { minThreshold: 45000, threshold: 135000, rate: 0.3 },
      { minThreshold: 135000, threshold: 190000, rate: 0.37 },
      { minThreshold: 190000, threshold: Infinity, rate: 0.45 },
    ];

    const calculateTax = (incomeValue) => {
      let tax = 0;
      let remainingIncome = incomeValue;

      for (let i = taxBrackets.length - 1; i >= 0; i -= 1) {
        const { minThreshold, threshold, rate } = taxBrackets[i];
        if (remainingIncome > minThreshold && remainingIncome <= threshold) {
          tax += (remainingIncome - minThreshold) * rate;
          remainingIncome = minThreshold;
        }
      }

      return tax;
    };

    const medicareLevyMatrix = [
      { minThreshold: 0, threshold: 23365, rate: 0 },
      { minThreshold: 23365, threshold: 29206, rate: 0.1 },
      { minThreshold: 29206, threshold: Infinity, rate: 0.02 },
    ];

    const calculateMedicareLevy = (incomeValue) => {
      let levy = 0;
      let remainingIncome = incomeValue;

      for (let i = medicareLevyMatrix.length - 1; i >= 0; i -= 1) {
        const { minThreshold, threshold, rate } = medicareLevyMatrix[i];
        if (remainingIncome > minThreshold && remainingIncome <= threshold) {
          levy += (remainingIncome - minThreshold) * rate;
          remainingIncome = minThreshold;
        }
      }

      return levy;
    };

    const lessEstimatedTax = toCommaAndDollar(
      calculateTax(clientNetTaxableIncome) +
        calculateTax(partnerNetTaxableIncome) +
        calculateMedicareLevy(clientNetTaxableIncome) +
        calculateMedicareLevy(partnerNetTaxableIncome),
    );

    payload.clientLessEstimatedTax = lessEstimatedTax;
    payload.clientTotalExpanse = toCommaAndDollar(
      parseMoney(payload?.clientTotalExpanse || "$0") +
        parseMoney(lessEstimatedTax || "$0"),
    );
    payload.AnnualEstimatedNetCashPosition = toCommaAndDollar(
      parseMoney(payload?.jointTotalIncome || "$0") -
        parseMoney(payload?.clientTotalExpanse || "$0"),
    );

    // console.log("payload", payload);

    await generateDocumentFromTemplate(
      payload,
      templateFileName,
      downloadFileName,
    );

    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : "";
    const serializedError =
      error && typeof error === "object"
        ? JSON.stringify(error, null, 2)
        : String(error);
    const detailedErrorMessage = [
      "Failed to generate personal details document.",
      `Issue: ${errorMessage}`,
      `Document ID: ${id || "N/A"}`,
      `Template: ${templateFileName || "N/A"}`,
      `Download file: ${downloadFileName || "N/A"}`,
    ].join("\n");

    console.error("generatePersonalDetailsDocument error", {
      id,
      templateFileName,
      downloadFileName,
      errorMessage,
      errorStack,
      error,
    });

    message.error(detailedErrorMessage);

    throw new Error(
      `${detailedErrorMessage}\nStack: ${errorStack || serializedError}`,
    );
  }
}
