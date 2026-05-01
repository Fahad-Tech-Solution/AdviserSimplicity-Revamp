// Central registry for all /user/* routes used in the app.
// Fill in the `component` fields as you implement actual pages.

import { Spin } from "antd";
import { lazy, Suspense } from "react";
import HouseholdTable from "../Pages/User/Clients/HouseholdTable";
import MyClients from "../Pages/User/Clients/MyClients";
import DashboardPage from "../Pages/User/Dashboard/DashboardPage";
import CDFProspects from "../Pages/User/Prospects/CDFProspects";
import MyTeam from "../Pages/User/MyTeam/MyTeam";
import IncomeExpenses from "../Pages/User/Discovery/IncomeExpenses/IncomeExpenses.jsx";
import EmploymentModal from "../Pages/User/Discovery/IncomeExpenses/components/EmploymentSection/EmploymentModal.jsx";
import GeneralLiving from "../Pages/User/Discovery/IncomeExpenses/components/GeneralLiving/GeneralLiving.jsx";
import SoleTraderModal from "../Pages/User/Discovery/IncomeExpenses/components/SoleTraderSection/SoleTraderModal.jsx";
import PartnershipModal from "../Pages/User/Discovery/IncomeExpenses/components/PartnershipSection/PartnershipModal.jsx";
import CentrelinkModal from "../Pages/User/Discovery/IncomeExpenses/components/CentrelinkSection/CentrelinkModal.jsx";
import LifetimePensionModal from "../Pages/User/Discovery/IncomeExpenses/components/LifetimePensionSection/LifetimePensionModal.jsx";
import OverseasPensionModal from "../Pages/User/Discovery/IncomeExpenses/components/OverseasPensionSection/OverseasPensionModal.jsx";
import AssetAndDebt from "../Pages/User/Discovery/AssetsAndDebt/AssetAndDebt.jsx";
import FamilyHome from "../Pages/User/Discovery/AssetsAndDebt/components/FamilyHome/FamilyHome.jsx";
import AssetInfoModal from "../Pages/User/Discovery/AssetsAndDebt/components/AssetInfoSection/AssetInfoModal.jsx";
import PersonalLoanModal from "../Pages/User/Discovery/AssetsAndDebt/components/PersonalLoan/PersonalLoanModal.jsx";
import CreditCardModal from "../Pages/User/Discovery/AssetsAndDebt/components/CreditCard/CreditCardModal.jsx";
import FinancialInvestments from "../Pages/User/Discovery/FinancialInvestments/FinancialInvestments.jsx";
import MiddleWare from "../Pages/User/Discovery/MiddleWare/MiddleWare.jsx";
import InvestmentLoanModal from "../Pages/User/Discovery/FinancialInvestments/components/InvestmentLoanSection/InvestmentLoanModal.jsx";
import InvestmentLoanModalSMSF from "../Pages/User/Discovery/SMSF/components/InvestmentLoanSection/InvestmentLoanModal.jsx";
import BankTermDetailsModal from "../Pages/User/Discovery/FinancialInvestments/components/Bankandterm/BankTermDetailsModal.jsx";
import AustralianShare from "../Pages/User/Discovery/FinancialInvestments/components/AustralianShare/AustralianShare.jsx";
import PlatformInvestments from "../Pages/User/Discovery/FinancialInvestments/components/PlatformInvestment and Investment Bond/PlatformInvestments.jsx";
import SuperFunds from "../Pages/User/Discovery/FinancialInvestments/components/SuperFunds/SuperFunds.jsx";
import InvestmentPropertiesModal from "../Pages/User/Discovery/FinancialInvestments/components/InvestmentProperties/InvestmentPropertiesModal.jsx";
import AccountBasedPension from "../Pages/User/Discovery/FinancialInvestments/components/AccountBasedPension/AccountBasedPension.jsx";
import superFundsIcon from "../../assets/image/SectionImages/SuperFunds.jpeg";
import accumulationAccountIcon from "../../assets/image/SectionImages/piggy-bank-new.svg";
import Annuities from "../Pages/User/Discovery/FinancialInvestments/components/Annuities/Annuities.jsx";
import EstatePlanning from "../Pages/User/Discovery/EstatePlanning/EstatePlanning.jsx";
import EstatePlanningWill from "../Pages/User/Discovery/EstatePlanning/components/wills/EstatePlanningWill.jsx";
import BusinessEntities from "../Pages/User/Discovery/BusinessEntities/BusinessEntities.jsx";
import TradingCompanyModal from "../Pages/User/Discovery/BusinessEntities/coponents/TradingCompanySection/TradingCompanyModal.jsx";
import BusinessTrustModal from "../Pages/User/Discovery/BusinessEntities/coponents/BusinessTrustSection/BusinessTrustModal.jsx";
import OtherInvestmentsModalSMSF from "../Pages/User/Discovery/SMSF/components/OtherInvestmentsSection/OtherInvestmentsModal.jsx";
import PensionAccountModal from "../Pages/User/Discovery/SMSF/components/PensionAccountSection/PensionAccountModal.jsx";
import PowerOfAttorney from "../Pages/User/Discovery/EstatePlanning/components/PowerOfAttorney/PowerOfAttorney.jsx";
import ProfessionalAdvisers from "../Pages/User/Discovery/EstatePlanning/components/ProfessionalAdvisers/ProfessionalAdvisers.jsx";
import PersonalInsurance from "../Pages/User/Discovery/PersonalInsurance/PersonalInsurance.jsx";
import PersonalInsuranceModal from "../Pages/User/Discovery/PersonalInsurance/components/PersonalInsuranceModal.jsx";
import SMSF from "../Pages/User/Discovery/SMSF/SMSF.jsx";
import FamilyTrust from "../Pages/User/Discovery/FamilyTrust/FamilyTrust.jsx";
import FamilyInvestmentTrust from "../Pages/User/Discovery/FamilyTrust/components/FamilyInvestmentTrust.jsx";
import SMSFDetails from "../Pages/User/Discovery/SMSF/components/SMSFDetails/SMSFDetails.jsx";
import SMSFAccumulationAccount from "../Pages/User/Discovery/SMSF/components/SMSFAccumulationAccount/SMSFAccumulationAccount.jsx";
import GoalsObjectives from "../Pages/User/Discovery/GoalsObjectives/GoalsObjectives.jsx";
import RiskProfile from "../Pages/User/Discovery/RiskProfile/RiskProfile.jsx";
// import ClientSummary from "../Pages/User/Discovery/ClientSummary/ClientSummary.jsx";

/** Lazy so `PersonalDetails` can import route helpers from this file without a circular dependency. */
const PersonalDetailsLazy = lazy(() =>
  import("../Pages/User/Discovery/PersonalDetails/PersonalDetails.jsx").then(
    (m) => ({ default: m.PersonalDetails }),
  ),
);

const ClientSummaryLazy = lazy(
  () => import("../Pages/User/Discovery/ClientSummary/ClientSummary.jsx"),
);

function renderLazyRouteElement(LazyComponent) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 48, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
}

const personalDetailsElement = renderLazyRouteElement(PersonalDetailsLazy);
const clientSummaryElement = renderLazyRouteElement(ClientSummaryLazy);

const DISCOVERY_SECTION_METADATA_KEYS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "clientId",
  "userId",
]);

function hasMeaningfulValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (DISCOVERY_SECTION_METADATA_KEYS.has(key)) {
        return false;
      }
      return hasMeaningfulValue(nestedValue);
    });
  }
  return false;
}

function getDiscoverySectionValue(data, keys = []) {
  if (!data || typeof data !== "object") return null;

  for (const key of keys) {
    if (key in data) {
      return data[key];
    }
  }

  return null;
}

function createSectionCompletionCheck(...keys) {
  return ({ discoveryData }) =>
    hasMeaningfulValue(getDiscoverySectionValue(discoveryData, keys));
}

function createCardsCompletionCheck(cards = []) {
  return ({ discoveryData }) =>
    (cards || []).some((card) => {
      const keys =
        Array.isArray(card?.completionKeys) && card.completionKeys.length > 0
          ? card.completionKeys
          : [card?.key];

      return keys.some((key) =>
        hasMeaningfulValue(getDiscoverySectionValue(discoveryData, [key])),
      );
    });
}

const INCOME_EXPENSE_CARDS = [
  {
    title: "Employment",
    key: "incomeFromOwnBusiness",
    icon: "👔",
    component: <EmploymentModal />,
    modalWidth: "1200px",
  },
  {
    title: "Sole Trader",
    key: "incomeFromSoleTrader",
    icon: "💼",
    component: <SoleTraderModal />,
    modalWidth: "1100px",
  },
  {
    title: "Partnership",
    key: "incomeFromPartnership",
    icon: "🤝",
    component: <PartnershipModal />,
    modalWidth: "1200px",
  },
  {
    title: "Centerlink",
    key: "incomeFromCentrelink",
    icon: "⚙️",
    component: <CentrelinkModal />,
    info: "This includes Family Tax Benefit (A&B) Payments and any Centrelink Cards.",
    modalWidth: "1100px",
  },
  {
    title: "Lifetime Pension",
    key: "incomeFromSuperPayment",
    icon: "💵",
    component: <LifetimePensionModal />,
    modalWidth: "800px",
  },
  {
    title: "Overseas Pension",
    key: "incomeFromOverseasPension",
    icon: "🌍",
    component: <OverseasPensionModal />,
    modalWidth: "800px",
  },
  {
    title: "Living Expenses",
    key: "incomeFromRegularLivingExpenses",
    completionKeys: ["generalLivingExpenses", "retirementLivingExpenses"],
    icon: "💰",
    component: <GeneralLiving />,
    modalWidth: "600px",
    variant: "case3",
    firstTotalKey: "generalLivingExpensesTotal",
    secondTotalKey: "retirementLivingExpense",
    firstNameKey: "General Living",
    secondNameKey: "Retirement Living",
    alwaysShow: true,
    showSecondTotal: true,
    secondisFormInput: true,
  },
];

const ASSETS_DEBT_CARDS = [
  {
    title: "Family Home",
    key: "familyHome",
    icon: "🏠",
    component: <FamilyHome />,
    modalWidth: "1200px",
    firstNameKey: "Value",
    secondNameKey: "Loan",
    secondTotalKey: "loanAmount",
    showSecondTotal: true,
  },
  {
    title: "Car",
    key: "car",
    icon: "🚗",
    component: <AssetInfoModal />,
    modalWidth: "700px",
  },
  {
    title: "Contents",
    key: "houseHold",
    icon: "🏪",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Boat",
    key: "boat",
    icon: "⛵",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Caravan",
    key: "caravan",
    icon: "🚌",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Other Assets",
    key: "otherAssets",
    icon: "⚙️",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Personal Loan",
    key: "personalLoans",
    icon: "🤝",
    component: <PersonalLoanModal />,
    modalWidth: "1200px",
    firstNameKey: "Joint",
    showSecondTotal: false,
  },
  {
    title: "Credit Card",
    key: "creditCards",
    icon: "💳",
    component: <CreditCardModal />,
    modalWidth: "1200px",
    firstNameKey: "Joint",
    showSecondTotal: false,
  },
];

const FINANCIAL_INVESTMENTS_CARDS = [
  {
    title: "Bank Accounts",
    key: "bankAccountFinance",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Term Deposits",
    key: "termDepositsFinance",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Australian Shares/ETFs",
    key: "australianShareMarket",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
  },
  {
    title: "Platform Investments",
    key: "managedFund",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
  },
  {
    title: "Investment Bond",
    key: "investmentBondFinance",
    icon: "🏅",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
  },
  //SuperAndRetirement
  {
    title: "Super Funds",
    key: "superAnnuationIssues",
    icon: (
      <img
        src={superFundsIcon}
        alt="Super Funds"
        width={30}
        height={32}
        style={{ mixBlendMode: "multiply" }}
      />
    ),
    component: <MiddleWare />,
    innerComponent: <SuperFunds />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Account Based Pension",
    key: "accountBasedPensionIssues",
    icon: "🐷",
    component: <MiddleWare />,
    innerComponent: <AccountBasedPension />,
    modalWidth: "620px",
    tableRows: 3,
  },
  {
    title: "Annuities",
    key: "annuitiesIssues",
    icon: "📅",
    component: <MiddleWare />,
    innerComponent: <Annuities />,
    modalWidth: "620px",
    tableRows: 3,
  },
  // Investment
  {
    title: "Investment Properties",
    key: "investmentPropertyDetails",
    icon: "🏘️",
    component: <InvestmentPropertiesModal />,
    modalWidth: "1500px",
    tableRows: 10,
    firstNameKey: "Property Portfolio",
    secondNameKey: "Total Debt",
    firstTotalKey: "propertyPortfolio",
    secondTotalKey: "totalDebt",
    showSecondTotal: true,
  },
  {
    title: "Investment Loan",
    key: "managedFundsLOC",
    icon: "📋",
    component: <InvestmentLoanModal />,
    modalWidth: "1300px",
    showSecondTotal: false,
  },
  {
    title: "Margin Loan",
    key: "managedFundsMarginLoan",
    icon: "📉",
    component: <InvestmentLoanModal />,
    modalWidth: "1200px",
    showSecondTotal: false,
  },
];

const BUSINESS_ENTITIES_CARDS = [
  {
    title: "Trading Company",
    key: "BusinessAsCompanyStructure",
    icon: "🏢",
    component: <MiddleWare />,
    innerComponent: <TradingCompanyModal />,
    modalWidth: "620px",
    tableRows: 3,
  },
  {
    title: "Business Trust",
    key: "BusinessAsTrusts",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <BusinessTrustModal />,
    modalWidth: "620px",
    tableRows: 3,
  },
];

const ESTATE_PLANNING_CARDS = [
  {
    title: "Wills",
    key: "will",
    icon: "📄",
    component: <EstatePlanningWill />,
    modalWidth: "1000px",
  },
  {
    title: "Power of Attorneys",
    key: "POA",
    icon: "🤝",
    component: <PowerOfAttorney />,
    modalWidth: "700px",
  },
  {
    title: "Professional Advisers",
    key: "professionalAdviser",
    icon: "👔",
    component: <ProfessionalAdvisers />,
    modalWidth: "1000px",
  },
];

const PERSONAL_INSURANCE_CARDS = [
  {
    title: "Life",
    key: "lifeInsurance",
    icon: "📋",
    component: <PersonalInsuranceModal />,
    modalWidth: "1800px",
    firstTotalKey: "clientLifeInsuranceTotal",
    secondTotalKey: "partnerLifeInsuranceTotal",
  },
  {
    title: "TPD",
    key: "TPDInsurance",
    icon: "♿",
    modalWidth: "1800px",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientTPDTotal",
    secondTotalKey: "partnerTPDTotal",
  },
  {
    title: "Trauma",
    key: "TraumaInsurance",
    modalWidth: "1800px",
    icon: "⬜",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientTraumaTotal",
    secondTotalKey: "partnerTraumaTotal",
  },
  {
    title: "Income Protection",
    key: "IncomeProtection",
    modalWidth: "1800px",
    icon: "☂️",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientIncomeProtectionTotal",
    secondTotalKey: "partnerIncomeProtectionTotal",
  },
];

const SMSF_CARDS = [
  {
    title: "Details",
    key: "SMSFDetails",
    icon: "📄",
    component: <SMSFDetails />,
    modalWidth: "1500px",
    firstNameKey: "SMSF",
    showSecondTotal: false,
  },
  {
    title: "Accumulation Account",
    key: "SMSFAccumulationDetails",
    icon: (
      <img
        src={accumulationAccountIcon}
        alt="Accumulation Account"
        width={40}
        height={42}
        style={{ mixBlendMode: "multiply" }}
      />
    ),
    component: <SMSFAccumulationAccount />,
    modalWidth: "800px",
  },
  {
    title: "Pension Account",
    key: "SMSFPensionPhase",
    icon: "🐷",
    component: <PensionAccountModal />,
    modalWidth: "600px",
    firstTotalKey: "clientTotal",
    secondTotalKey: "partnerTotal",
  },
  {
    title: "Bank Accounts",
    key: "SMSFBank",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 3,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Term Deposits",
    key: "SMSFTermDeposits",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Australian Shares/ETFs",
    key: "SMSFAustralianShares",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Platform Investments",
    key: "SMSFManagedFunds",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Loan",
    key: "SMSFInvestmentLoan",
    icon: "📉",
    component: <InvestmentLoanModalSMSF />,
    modalWidth: "1500px",
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Properties",
    key: "SMSFInvestmentProperties",
    icon: "🏘️",
    component: <InvestmentPropertiesModal />,
    modalWidth: "1500px",
    tableRows: 10,
    firstNameKey: "Property Portfolio",
    secondNameKey: "Total Debt",
    firstTotalKey: "propertyPortfolio",
    secondTotalKey: "totalDebt",
    showSecondTotal: true,
  },
  {
    title: "Other Investments",
    key: "SMSFOtherInvestment",
    icon: "📈",
    component: <OtherInvestmentsModalSMSF />,
    modalWidth: "900px",
  },
];

const FAMILY_TRUST_CARDS = [
  {
    title: "Details",
    key: "familyDetails",
    icon: "📄",
    component: <FamilyInvestmentTrust />,
    modalWidth: "1500px",
    tableRows: 3,
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Bank Accounts",
    key: "familyBank",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 3,
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Term Deposits",
    key: "familyTermDeposit",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Australian Shares/ETFs",
    key: "familyAustralianShare",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Platform Investments",
    key: "familyMangedFunds",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Loan",
    key: "familyInvestmentHomeLoan",
    icon: "📉",
    component: <InvestmentLoanModalSMSF />,
    modalWidth: "1200px",
    firstNameKey: "Trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Property",
    key: "familyInvestmentProperties",
    icon: "🏘️",
    component: <InvestmentPropertiesModal />,
    modalWidth: "1500px",
    tableRows: 10,
    firstNameKey: "Property Portfolio",
    secondNameKey: "Total Debt",
    firstTotalKey: "propertyPortfolio",
    secondTotalKey: "totalDebt",
    showSecondTotal: true,
  },
  {
    title: "Other Investments",
    key: "familyOtherInvestment",
    icon: "📈",
    component: <OtherInvestmentsModalSMSF />,
    modalWidth: "900px",
    firstNameKey: "Trust",
    showSecondTotal: false,
  },
];

const GOALS_OBJECTIVES_CARDS = [
  {
    title: "Age Care",
    key: "AgeCare",
    sections: [
      {
        title: "Care for Ageing Family Member",
        key: "careGoal",
        icon: "👴",
        whenScopeIs: "Age Care",
        scopeOfAdvice: "Age Care",
        descriptionArray: [
          "<span>I/We</span> would like to know what to do with the leftover funds now sitting in <span>our/my mum/dads</span> bank account from the sale of their home, as they have now moved into aged care. They currently have around <span>$X,000</span> in cash, and <span>we/I</span> are looking to invest approximately <span>$X,000</span> to help generate a steady income stream. Ideally, <span>we/I</span> are seeking an option that offers a reliable or guaranteed return, if possible, to assist with funding <span>Mum's/Dad's</span> ongoing aged care fees. Given the purpose is to support care costs over the long term, <span>we/I</span> would prefer a low-risk investment that provides stability and certainty around both income and capital.",
        ],
      },
    ],
  },
  {
    title: "Cashflow",
    key: "Cashflow",
    sections: [
      {
        title: "Set up a Budget",
        key: "budgetGoal",
        icon: "🧾",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to set up a budget to help manage <span>our/my</span> income and expenses more effectively. <span>I/We</span> want to understand where <span>our/my</span> money is going each week/fortnight/month and find ways to save more without impacting <span>our/my</span> lifestyle. <span>I/We</span> would like guidance on creating a simple, realistic plan that helps <span>us/me</span> stay on track with bills, manage surplus cashflow, and work towards <span>our/my</span> financial goals with confidence.",
        ],
      },
      {
        title: "Accumulate Emergency Fund",
        key: "emergencyFundGoal",
        icon: "🏥",
        scopeOfAdvice: "Cashflow",
        whenScopeIs: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to build an emergency fund to provide a financial safety net for unexpected expenses. <span>I/We</span> want to gradually save enough to cover at least three to six months of living expenses, ensuring <span>we/I</span> have peace of mind knowing funds are available if needed. <span>I/We</span> would like guidance on how much to aim for and the best place to keep these savings while still earning a reasonable return.",
        ],
      },
      {
        title: "Advice on Surplus Income",
        key: "adviceOnSurplusIncomeGoal",
        icon: "💰",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like advice on how to make the most of <span>our/my</span> surplus income. <span>I/We</span> want to understand the best way to use this extra money whether to <span>save, invest, contribute more to super, or reduce debt</span> in a way that aligns with <span>our/my</span> short and long-term goals. <span>I/We</span> would like guidance on creating a clear strategy that helps improve <span>our/my</span> overall financial position while maintaining flexibility for lifestyle needs. <span>I/We</span> currently have around <span>$X,000</span> of surplus funds each <span>week/fortnight/month</span> to work with. ",
        ],
      },
      {
        title: "Save for a Wedding",
        key: "weddingGoal",
        icon: "💍",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to start saving for <span>our/my</span> upcoming wedding to make sure <span>we/I</span> can cover the costs without financial stress. <span>I/We</span> want to set aside regular savings to pay for expenses such as the venue, catering, and travel, while keeping <span>our/my</span> other financial goals on track. <span>I/We</span> would like guidance on how much to save each month and the best way to manage these funds to reach our/my target amount in time for the wedding. <span>I/We</span> estimate this will cost us/me approximately <span>$xx,000</span>. ",
        ],
      },
      {
        title: "Take a Holiday",
        key: "holidayGoal",
        icon: "✈️",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>We/I</span> would like to take a holiday to <span>XXXXXX</span> and want to allow an amount of <span>$XX.000</span> to do this comfortable so <span>I/we</span> can enjoy ourselves like <span>I/we</span> e want to.    <span>We/I</span> will use the funds <span>I/we have sitting in cash/in super/from  the inheritance/other</span>",
        ],
      },
      {
        title: "Buy a Car",
        key: "carGoal",
        icon: "🚗",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>We/I</span> would like to <span>upgrade our car/buy</span> a new car  and want to get <span>car make/model</span>. <span>We/I</span> want to allow an amount of <span>$XX.000</span> to do this.  <span>We/I</span> will use the funds <span>I/we have sitting in cash/in super/from the inheritance/other</span>",
        ],
      },
      {
        title: "Buy a Boat",
        key: "boatGoal",
        icon: "⛵",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>We/I</span> would like to buy a boat and want to allow an amount of <span>$XX.000</span> to do this. <span>We/I</span> will use the funds <span>I/we have sitting in cash/in super/from the inheritance/other</span>",
        ],
      },
      {
        title: "Buy a Carvan",
        key: "caravanGoal",
        icon: "🚌",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>We/I</span> would like to buy a caravan so we can take more road trips around <span>Australia/name of State</span> and want to allow an amount of <span>$XX.000</span> to do this. <span>We/I</span> will use the funds <span>I/we have sitting in cash/in super/from the inheritance/other</span>",
        ],
      },
      {
        title: "Buy a House",
        key: "houseGoal",
        icon: "🏠",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to buy <span>our/my</span> first home to provide stability and security for <span>our/my</span> future. <span>I/We</span> would like guidance on how much <span>we/I</span> can afford to spend; how much deposit is needed and if <span>we/I</span> can afford to do this. <span>I/We</span> also want to make sure the purchase fits within <span>our/my</span> broader financial goals while maintaining enough savings for lifestyle and other commitments. ",
        ],
      },
      {
        title: "Upgrade Family Home",
        key: "upgradeFamilyHomeGoal",
        icon: "🏡",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to upgrade our/my current family home to better suit <span>our/my</span> lifestyle and future needs. <span>I/We</span> are looking for a property that offers more space, comfort, or improved location for <span>our/my</span> family. I/We would like guidance on how much <span>we/I</span> can afford to spend and how this will affect our cashflow. <span>We/I also want to know if we/I can also afford to keep our/my current home and rent it out.</span> ",
        ],
      },
      {
        title: "Renovate Family Home",
        key: "renovateFamilyHomeGoal",
        icon: "🔧",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>We/I</span> would like to renovate <span>my/our</span> home and want to allow an amount of <span>$XX.000</span> to do this. <span>We/I</span> will use the funds <span>I/we have sitting in cash/in super/from the inheritance/other</span>. ",
        ],
      },
      {
        title: "Downsize Family Home",
        key: "downSizeFamilyHomeGoal",
        icon: "📦",
        scopeOfAdvice: "Cashflow",
        whenScopeIs: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to downsize <span>our/my</span> current family home to a smaller and more manageable property that better suits <span>our/my</span> lifestyle and retirement plans. <span>I/We</span> are looking to simplify living arrangements, reduce ongoing costs, and potentially free up some of the home’s value to support <span>our/my</span> future goals or retirement income. <span>I/We would also like to explore whether some of the leftover sale proceeds can be contributed into our/my super to help boost retirement our/my savings.</span>",
        ],
      },
      {
        title: "Buy an Investment Property",
        key: "investmentPropertyGoal",
        icon: "🏘️",
        whenScopeIs: "Cashflow",
        scopeOfAdvice: "Cashflow",
        descriptionArray: [
          "<span>I/We</span> would like to buy an investment property to help build <span>our/my</span> long-term wealth and create an additional source of income. <span>I/We</span> want to understand how much <span>we/I</span> can afford to borrow, what deposit is needed, and how the property purchase will fit within <span>our/my</span> overall financial plan. <span>I/We</span> would also like to know how this decision will affect <span>our/my</span> overall cashflow and tax position, and whether there are other investment options worth considering if <span>we/I</span> decide not to proceed with this purchase.",
        ],
      },
    ],
  },
  {
    title: "Centrelink",
    key: "Centrelink",
    sections: [
      {
        title: "Eligibility to Centrelink",
        key: "centreLinkEligibilityGoal",
        whenScopeIs: "Centrelink",
        icon: "⚙️",
        scopeOfAdvice: "Centrelink",
        descriptionArray: [
          "<span>We/I</span>  would like to know if <span>We/I</span> will get any Age pension entitlements now that <span>We/I</span> had reached age pension age. It would be great if <span>We/I</span> could get a small amount of age pension and this would give <span>us/me</span> the Pension Card. <span>We/I</span> really want the benefits that come with the cards such as cheaper medicine, and other discounts on <span>our/my</span> bills such as Council and Water rates, utilities (Gas and Electricity) and <span>our/my</span> Car registration.",
          "<span>We/I</span> like to know if <span>we/I am/are</span> entitled to any health care cards from Centrelink because <span>I/we are/am</span> paying too much on <span>our/my</span> regular medication on a monthly basis.",
          "<span>I/We/Client Name</span> would like to know if <span>we/I/he/she</span> will get any Age Pension entitlements now that <span>we/I/he/she</span> have reached Age Pension age. It would be great if <span>we/I/he/she</span> could get a small amount of Age Pension, as this would give <span>us/me/him/her</span> the Pension Card. <span>I/We/Client Name</span> really want the benefits that come with the card, such as cheaper medicines and other discounts on <span>our/my/his/her</span> bills, including council and water rates, utilities (gas and electricity), and <span>our/my/his/her</span> car registration.",
          "<span>I/We/Client Name</span> to know if <span>we/I/he/she</span> am/are/is entitled to any health care cards from Centrelink because <span>we/I/he/she</span> am/are/is paying too much on <span>our/my/his/her</span> regular medication on a monthly basis.",
        ],
      },
    ],
  },
  {
    title: "Debt Management",
    key: "DebtManagement",
    sections: [
      {
        title: "Pay off Home Loan",
        key: "homeLoanGoal",
        icon: "🔑",
        scopeOfAdvice: "Debt Management",
        whenScopeIs: "Debt Management",
        descriptionArray: [
          "<span>I/We</span> would like Reduce <span>our/my</span> current home loan <span>as soon as possible /ahead of retirement.</span>",
          "<span>I/We</span> want to know how much <span>I/We</span> need  to pay off <span>our/my</span> home loan  each <span>week/fortnight/month</span> so <span>I/we can be debt free in retirement/pay it off in the next XX Years</span>",
        ],
      },
      {
        title: "Pay off Credit Card/Debt",
        key: "creditCardGoal",
        icon: "💳",
        scopeOfAdvice: "Debt Management",
        whenScopeIs: "Debt Management",
        descriptionArray: [
          "<span>I/We</span> would like Reduce <span>our/my</span> current <span>personal loan/credit cards as soon as possible /ahead of retirement.</span>",
          "<span>I/We</span> want to know how much <span>I/We</span> need  to pay off <span>our/my personal loan/credit cards</span> each month so <span>I/we can be debt free in retirement/pay it off in the next XX Years</span>",
        ],
      },
    ],
  },
  {
    title: "Estate Planning",
    key: "EstatePlanning",
    sections: [
      {
        title: "Estate Planning",
        key: "estatePlanningGoal",
        icon: "📄",
        whenScopeIs: "",
        scopeOfAdvice: "Estate Planning",
        descriptionArray: [],
      },
      {
        title: "Leave an Inheritance",
        icon: "🎁",
        key: "leaveInheritanceGoal",
        whenScopeIs: "",
        scopeOfAdvice: "Estate Planning",
        descriptionArray: [],
      },
      {
        title: "Reduce Tax to my Beneficiaries",
        key: "reduceTaxBeneficiaries",
        icon: "🌱",
        whenScopeIs: "Estate Planning",
        scopeOfAdvice: "Estate Planning",
        descriptionArray: [
          "<span>I/We</span> would like to make sure that <span>our/my</span> superannuation money is structured in a way that reduces the amount of tax payable by <span>our/my</span> beneficiaries/<span>my</span> kids when <span>we/I</span> pass away. <span>I/We</span> want to understand what can be done to ensure more of <span>our/my</span> super money is passed to them, rather than being lost to unnecessary tax.",
        ],
      },
    ],
  },
  {
    title: "Investment",
    key: "Investment",
    sections: [
      {
        title: "Set up an Investment Portfolio",
        key: "investmentPortfolioGoal",
        whenScopeIs: "Investments",
        icon: "📊",
        descriptionArray: [
          "<span>I/We</span> like to  Invest an amount of <span>$XXX,000</span> from <span>our/my</span> cash sitting in <span>my/our</span> bank account into managed investments where <span>our/my</span> money will  grow in value over time. <span>I/We</span> want to start slow and <span>are/am</span> happy to invest a regular amount of <span>$XXX</span> per month as <span>I/we</span> can  afford to spare this amount of money each month <span>I/we</span> would like to keep building up this investment.",
        ],
        scopeOfAdvice: "Investment",
      },
      {
        title: "Review Investment Portfolio",
        key: "reviewInvestmentPortfolioGoal",
        whenScopeIs: "Investment",
        icon: "🔍",
        descriptionArray: [
          "<span>I/We/Client Name</span> would like to review <span>our/my/his/her</span> current investment portfolio to ensure it remains aligned with <span>our/my/his/her</span> goals, timeframes, and comfort with risk. <span>I/We/Client Name</span> want to make sure <span>our/my/his/her</span> investments are well diversified and positioned to achieve long-term growth while balancing risk appropriately. <span>I/We/Client Name</span> would also like guidance on whether any changes are needed to help <span>us/me/him/her</span> reduce <span>our/my/his/her</span> goals.",
        ],
        scopeOfAdvice: "Investment",
      },
      {
        title: "Receive an Inheritance",
        key: "inheritanceGoal",
        whenScopeIs: "Investment",
        scopeOfAdvice: "Investment",
        icon: "🏺",
        descriptionArray: [
          "<span>I/We</span> expect to receive an inheritance in the near future and would like guidance on how best to manage and invest these funds. <span>I/We</span> want to make sure the money is used wisely to support <span>our/my</span> long-term goals. <span>I/We</span> would like advice on the most effective and tax-efficient way to use this inheritance to strengthen <span>our/my</span> overall financial position.",
          "<span>I/We</span> would like to understand how receiving an inheritance will affect <span>our/my</span> Centrelink entitlements. <span>I/We</span> want to know whether this money will impact any current Centrelink payments. <span>I/We</span> would like advice on the best way to manage the inheritance to minimise any reduction in payments if possible.",
        ],
      },
      {
        title: "Pay Less Tax",
        key: "payLessTaxGoal",
        whenScopeIs: "Investment",
        scopeOfAdvice: "Investment",
        icon: "💲",
        descriptionArray: [
          "<span>I/We</span> would like to find ways to reduce <span>our/my</span> overall tax liability and make <span>our/my</span> money work more effectively. <span>I/We</span> want to understand what strategies or structures could help minimise tax — such as making super contributions, using investments more efficiently, or reviewing ownership structures while still aligning with <span>our/my</span> broader financial goals.",
        ],
      },
      {
        title: "Save for Children’s Education",
        key: "childrenEducationGoal",
        whenScopeIs: "Investment",
        scopeOfAdvice: "Investment",
        icon: "🎓",
        descriptionArray: [
          "<span>I/We</span> would like to start saving for <span>our/my</span> children's education to help cover future/current school or university costs. <span>I/We</span> want to build a dedicated fund that can be used to support their studies and provide them with more opportunities as they grow. <span>I/We</span> are looking for a simple and effective savings or investment strategy that helps grow these funds over time, while keeping the money accessible when it's needed for education expenses.",
        ],
      },
      {
        title: "Regular Savings Plan",
        key: "regularSavingsGoal",
        whenScopeIs: "Investment",
        scopeOfAdvice: "Investment",
        icon: "📅",
        descriptionArray: [
          "<span>I/We</span> would like to set up a regular savings plan to help build <span>our/my</span> savings over time. <span>I/We</span> want to put aside a set amount each week/fortnight/month to create a habit of saving and work towards future goals such as travel, a new home, or general financial security. <span>I/We</span> are looking for a simple and consistent approach that helps grow <span>our/my</span> savings while keeping the funds flexible and accessible if needed.",
        ],
      },
      {
        title: "Set up a Family Trust",
        key: "familyTrustGoal",
        icon: "⚖️",
        whenScopeIs: "",
        descriptionArray: [],
        scopeOfAdvice: "Investment",
      },
    ],
  },
  {
    title: "Other",
    key: "Other",
    sections: [
      {
        title: "Ongoing Financial Advice",
        key: "financialAdviceGoal",
        whenScopeIs: "Other",
        scopeOfAdvice: "Other",
        icon: "💬",
        descriptionArray: [
          "<span>I/We</span> would like to have someone help <span>us/me</span> manage <span>our/my</span> money in <span>our/my</span> retirement to make sure that <span>our/my</span>  money will last <span>us/me</span> and that <span>I/We are/am</span> adjusting our strategy every year so we continue to meet <span>our/my</span> goals.",
        ],
      },
      {
        title: "Start a Family",
        key: "startFamilyGoal",
        whenScopeIs: "",
        icon: "👨‍👩‍👧‍👦",
        descriptionArray: [],
        scopeOfAdvice: "Other",
      },
      {
        title: "Start a Business",
        key: "businessGoal",
        icon: "🏢",
        whenScopeIs: "",
        descriptionArray: [],
        scopeOfAdvice: "Other",
      },
    ],
  },
  {
    title: "Personal Insurance",
    key: "PersonalInsurance",
    sections: [
      {
        title: "Protect my Lifestyle & Family",
        key: "familyLifeStyleGoal",
        whenScopeIs: "Personal Insurance",
        scopeOfAdvice: "Personal Insurance",
        icon: "🛡️",
        descriptionArray: [
          "<span>I/We</span> want  to make sure in  the event <span>we/I were/was</span>  to  die prematurely or <span>are/am</span> unable to work due to sickness, injury or every again that <span>our/my</span> family will be protected financially. <span>I/We</span> would like to consider all types of personal insurance cover. <span>I/We are  able/happy to  spend up to $XX0 per month from our/my  own  personal cashflow and were possible we would like to have any insurance cover funded an paid through our/my super.</span> <strong>(Full Insurance review)</strong>.",
          "<span>I/We</span> would specifically like to take out <span>Life cover of $XXX,XXX and TPD of $XXX,XXX</span> to make sure <span>that our/my</span> family is protected if <span>I/we to</span> die or become total and permanently disabled. <span>This would also us/me to pay off our /my current home loan/debts and be debt free. Where possible I/we would like to have these premiums funded via super.</span> <strong>(Life and TPD cover)</strong>",
          "<span>I/We</span> want to make sure <span>if I/we</span> suffered a medical event such as a cancer or a heart attack  that <span>we/I</span> could receive a lumpsum payout of <span>$XXX,XXX</span> to help out financially while <span>I/we</span> focus on <span>my/our  recovery/so my  spouse could take time off work if needed to look after me  so this wouldn’t affect us  financially while I recovered</span><strong>(Trauma cover)</strong>",
          "<span>I/We</span> want to make sure that <span>my/our</span> income is protected in the event <span>I/we am/are</span> unable to work due to an injury or became sick so <span>we/I</span> can receive a regular income during this period to help <span>us/me</span> pay <span>my/our  home loan repayments and all other bills. Where possible I/we would like to have these premiums funded via super</span>  <strong>(Income protection only)</strong>",
        ],
      },
      {
        title: "Review your Current Personal Insurance Cover",
        key: "reviewPersonalInsuranceCoverGoal",
        whenScopeIs: "Personal Insurance",
        scopeOfAdvice: "Personal Insurance",
        icon: "☂️",
        descriptionArray: [
          "<span>We/I</span> would like to Review <span>my/our</span> current levels of personal insurance cover <span>I/we</span> have in place and consider what would be the right levels and types of cover for <span>us/me</span>.",
        ],
      },
      {
        title: "Analysis of your Personal Insurance needs",
        key: "analysisOfPersonalInsuranceGoal",
        whenScopeIs: "Personal Insurance",
        scopeOfAdvice: "Personal Insurance",
        icon: "🩺",
        descriptionArray: [
          "<span>I/We</span> want  to make sure in  the event <span>we/I were/was</span> to die prematurely or <span>are/am</span> unable to work due to sickness, injury or every again that <span>our/my</span> family will be protected financially. <span>I/We</span> would like to consider all types of personal insurance cover. <span>I/We are able/happy to spend up to $XX0 per month from our/my own personal cashflow and were possible we would like to have any insurance cover funded an paid through our/my  super.</span> <strong>(Full Insurance review)</strong>.",
        ],
      },
      {
        title: "Retain Current Personal Insurances as is",
        key: "retainCurrentPersonalInsurancesGoal",
        whenScopeIs: "Personal Insurance",
        scopeOfAdvice: "Personal Insurance",
        icon: "🤲",
        descriptionArray: [
          "<span>We/I</span> would like to retain our current personal insurances  with <span>XXXX</span> as they are for now and not have these reviewed. We would like you to take over the servicing rights of <span>our/my</span> polices so <span>we/I</span> can obtain all relevant policy details as required.",
        ],
      },
      {
        title: "Reduce my Current Personal Insurance Cover",
        key: "reducePersonalInsuranceCoverGoal",
        whenScopeIs: "Personal Insurance",
        scopeOfAdvice: "Personal Insurance",
        icon: "⬇️",
        descriptionArray: [
          "<span>We/I</span> would like to Reduce <span>our/my Life cover down to $XXX, XXX and   TPD to $XXX,XXX</span> so <span>we/I can</span> reduce the premiums down as they are now starting to get costly. <span>Given our/my current</span> financial situation now <span>I/we don’t</span>  need this level of cover anymore <span>as this was taken out a long time ago when our/my situation was different and the kids were younger.</span>  <strong>(Reduce Life and TPD)</strong>",
          "<span>We/I</span> would like to Reduce <span>our/my</span> Trauma cover down to <span>$XXX,XXX</span> so <span>we/I</span> can reduce the premiums down as they are now starting to get costly. <strong>( Reduce Trauma cover)</strong>",
          "<span>We/I</span> would like to change the the waiting period on  <span>my/our</span>  income protection policy with <span>Name of Provider</span> to a <span>XX</span> Day waiting period to help reduce the cost of these premiums.<span> We/I currently have over XX days in Sick/Annual Leave/Long Service Leave available that I/we  could use  if  I/we wasn’t/weren’t  able to work during this period.</span> <strong>(Reduce Waiting Period on Income protection)</strong>.",
        ],
      },
    ],
  },
  {
    title: "Retirement Planning",
    key: "RetirementPlanning",
    sections: [
      {
        title: "Generate a Retirement Income Stream",
        key: "retirementIncomeStreamGoal",
        whenScopeIs: "Retirement Planning",
        scopeOfAdvice: "Retirement Planning",
        icon: "📋",
        descriptionArray: [
          "<span>I/We</span> like to use be able to receive an amount of <span>$X,000</span> per <span>week/fortnight/month</span> for <span>us/me</span> to be comfortable in <span>my/our</span> retirement and live the way <span>I/We</span> want to.",
          "<span>I/We</span> would like to be able to receive an amount of <span>$X,000 per week/fortnight/month</span> for <span>us/me</span> to be comfortable in <span>our/my</span> retirement and live the way <span>I/we</span> want to. This amount will allow <span>us/me</span> to maintain <span>our/my</span> current lifestyle, cover regular living costs, <span>and have the freedom to enjoy activities such as travel, dining out, or spending time with family and friends</span>. The goal is to create a steady and reliable income that provides peace of mind and supports the lifestyle <span>we/I</span> value most throughout retirement. As part of this <span>I/we</span> want to know how long our money will last us.",
          "<span>I/We</span> would like to plan for <span>our/my</span> retirement to ensure <span>we/I</span> have enough income to live comfortably and enjoy the lifestyle <span>we/I</span> want. <span>I/We</span> would like to be able to receive an income of <span>$X,000 per week/fortnight/month</span> for <span>us/me</span> to be comfortable in <span>our/my</span> retirement and live the way <span>I/we</span> want to. This amount will allow <span>us/me</span> to maintain <span>our/my</span> current lifestyle, cover regular living costs, and have the freedom to enjoy activities such as travel, dining out, or spending time with family and friends. <span>I/We</span> want to understand how much will be needed to retire, how long <span>our/my</span> money will last, and what steps can be taken now to achieve this.",
        ],
      },
      {
        title: "Set up a Super Income Stream",
        key: "setSuperIncomeStreamGoal",
        whenScopeIs: "Retirement Planning",
        scopeOfAdvice: "Retirement Planning",
        icon: "🐷",
        descriptionArray: [
          "<span>I/We</span> like to use my super to draw an income from it like a regular wage to help <span>us/me meet our/my</span> living expenses. <span>I/We</span> feel that we need an amount of <span>$X,000</span> per <span>week/fortnight/month</span> for <span>us/me</span> to be comfortable in <span>my/our</span> retirement and live the way <span>I/We</span> want to.",
        ],
      },
      {
        title: "Plan for Retirement",
        key: "planForRetirementGoal",
        scopeOfAdvice: "Retirement Planning",
        whenScopeIs: "Retirement Planning",
        icon: "🕐",
        descriptionArray: [
          "<span>I/We</span> would like to plan for <span>our/my</span> retirement to ensure <span>we/I</span> have enough income to live comfortably and enjoy the lifestyle <span>we/I</span> want. <span>I/We</span> would like to be able to receive an income of <span>$X,000 per week/fortnight/month</span> for <span>us/me</span> to be comfortable in <span>our/my</span> retirement and live the way <span>I/we</span> want to. This amount will allow <span>us/me</span> to maintain <span>our/my</span> current lifestyle, cover regular living costs, and have the freedom to enjoy activities such as travel, dining out, or spending time with family and friends. <span>I/We</span> want to understand how much will be needed to retire, how long <span>our/my</span> money will last, and what steps can be taken now to achieve this.",
        ],
      },
    ],
  },
  {
    title: "Superannuation",
    key: "Superannuation",
    sections: [
      {
        title: "Set up an SMSF",
        key: "SMSFGoal",
        whenScopeIs: "Superannuation",
        icon: "🦊",
        descriptionArray: [
          "We would like set up our own Self-Managed Super Fund (SMSF) and combine our superannuation money and have it invested together as a <span>couple/family. I/We</span> feel this will provide <span>us/me</span> with more flexibility and control of <span>our/my</span> retirement savings. <span>I/We</span> would like to retain the insurances <span>I/we</span> have attached to <span>our/my</span> current fund/s.",
          "<span>I/We</span> would like set up our own Self-Managed Super Fund (SMSF) and use <span>our/my</span> superannuation money to buy a <span>business premises/factory</span> so <span>I/we</span> can use it to run <span>our/my</span> business from. <span>I/We</span> feel this will provide <span>us/me</span> with more flexibility and control of <span>our/my</span> retirement savings. <span>I/We</span> would like to retain the insurances <span>I/we</span> have attached to <span>our/my</span> current fund/s.",
        ],
        scopeOfAdvice: "Superannuation",
      },
      {
        title: "Review my Super",
        key: "reviewSuperGoal",
        whenScopeIs: "Superannuation",
        icon: "🔎",
        descriptionArray: [
          "<span>I/We</span> would like to review <span>our/my</span> current super fund/s and considering other products that are more suitable for <span>us/me</span> and give <span>us/me</span> more flexibility and ease of use when <span>I/We</span> are dealing with the product. <span>I/We</span> would like to retain the insurances <span>I/we</span> have attached to <span>our/my</span> current fund/s. <strong>(Consider a better product)</strong>",
          "<span>I/We</span> would like to review <span>our/my</span> current super fund/s and considering other products that are more suitable for <span>us/me</span> and help <span>us/me</span> reduce the overall fees if possible. <span>I/We</span> would like to retain the insurances <span>I/we</span> have attached to <span>our/my</span> current fund/s. <strong>(Consider a more cost effective product)</strong>",
          "<span>I/We/Client Name</span> would like to review <span>our/my/his/her</span> current super to make sure it remains suitable for <span>our/my/his/her</span> needs. <span>I/We/Client Name</span> are looking for a product that offers better features, ease of use, and flexibility in managing <span>our/my/his/her</span> super. <span>I/We/Client Name</span> want to ensure <span>our/my/his/her</span> super is invested in a way that matches <span>our/my/his/her</span> goals and comfort with risk. Although cost is a consideration, it is not the underlying factor in this review.",
          "<span>I/We/Client Name</span> would like to review <span>our/my/his/her</span> super to make sure it still suits <span>our/my/his/her</span> needs and is on track to support <span>our/my/his/her</span> retirement plans. <span>I/We/Client Name</span> are looking for a super fund that is easy to use, flexible, and offers the right options to help <span>us/me/him/her</span> prepare for retirement. <span>I/We/Client Name</span> want to ensure <span>our/my/his/her</span> super is invested in a way that matches <span>our/my/his/her</span> goals and comfort with risk. Although cost is a consideration, it is not the underlying factor in this review.",
        ],
        scopeOfAdvice: "Superannuation",
      },
      {
        title: "Combine my Super into One",
        key: "combinedSuperIntoOneGoal",
        whenScopeIs: "Superannuation",
        icon: "🔄",
        descriptionArray: [
          "I would like to consider rolling my <span>X super funds</span> into the one if possible to help me reduce the fees and statements that I currently receive so it can help me track my super better.",
        ],
        scopeOfAdvice: "Superannuation",
      },
      {
        title: "Contribute Money into Super",
        key: "contributeMoneyIntoSuperGoal",
        whenScopeIs: "Superannuation",
        icon: "➕",
        descriptionArray: [
          "<span>I/We</span> would like to build up <span>our/my</span> super as much as <span>I/we</span> can before <span>I/we</span> retire so <span>I/we</span> can have more for <span>our/my</span> retirement and if possible, allow us to reduce the amount to tax <span>I/we</span> currently pay. <strong>(concessional contributions)</strong>",
          "<span>I/We</span> would like to start contributing some money into <span>our/my</span> super so <span>I/we</span> can start building it up. For now we are happy to contribute an net amount of <span>$X,000</span> per <span>week/fortnight/month</span> as this is how much <span>I/We</span> are <span>able/comfortable</span> to contribute based upon <span>my/our</span> own cashflow perspective. <strong>(regular contributions concessional or non-concessional)</strong>",
          "<span>I/We</span> like to know what <span>I/We</span> should do with the money <span>I/we</span> have sitting in <span>my/our</span> bank account <span>from the sale of an investment property/from the inheritance we have/will receive from Client/Partners mum/dad’s estate. I/We</span> currently had an amount of approximately <span>$XXX,000</span> in cash and wanted to invest an amount of <span>$XXX,000</span> and retain an amount of <span>$XXX,000 as buffer for emergencies/for home renovations/purchase of a new car/to take a holiday to XXXX.  I/We</span> wanted to know <span>if I/We</span> could invest this money into superannuation if possible so <span>I/We</span> can build up this investment. <strong>(Investing money into super as NCC)</strong>.",
          "<span>I/We/Client Name</span> would like to build up <span>our/my/his/her</span> super as much as <span>I/We/Client Name</span> can before <span>I/We/Client Name</span> retire so <span>we/I/he/she</span> can have more for <span>our/my/his/her</span> retirement and, if possible, reduce the amount of tax <span>we/I/he/she</span> currently pay. (Concessional contributions) ",
          " <span>I/We/Client Name</span> would like to build up <span>our/my/his/her</span> super as much as possible before <span>I/We/Client Name</span> retire so that <span>we/I/he/she</span> have more money for retirement. <span>I/We/Client Name</span> plan to make regular after-tax contributions of around <span>$X,000</span> per month to help grow <span>our/my/his/her</span> super balance over time. (Regular Non-Concessional)",
        ],
        scopeOfAdvice: "Superannuation",
      },
      {
        title: "Lump Sum Contribution to Super",
        key: "lumpSumContributionSuper",
        whenScopeIs: "Superannuation",
        icon: "💎",
        descriptionArray: [
          "<span>I/We/Client Name </span>would like to add extra money into <span>our/my/his/her </span> super from <span>our/my/his/her </span> current cash reserves or from the sale of  <span>our/my/his/her </span>property.  <span>I/We/Client Name </span> feel this will help grow our/my/his/her savings for the future and make the most of<span>our/my/his/her</span> money before in <span>our/my/his/her </span> retirement.",
        ],
        scopeOfAdvice: "Superannuation",
      },
    ],
  },
];

export const withSpacing = ({
  icon,
  label,
  marginLeft = 0,
  fontSize = "12px",
  color = "inherit",
  fontWeight = "400",
}) => ({
  label: (
    <span
      style={{
        marginLeft: marginLeft + "px",
        fontWeight: fontWeight,
        fontSize: fontSize,
        color: color,
      }}
    >
      <span>{icon}</span> {label}
    </span>
  ),
});

export const userRoutes = [
  {
    key: "/user",
    path: "/",
    ...withSpacing({ icon: "🏠", label: "Dashboard", fontSize: "13px" }),
    component: <DashboardPage />,
    condition: () => true,
  },
  {
    key: "/user/clients",
    path: "/clients",
    ...withSpacing({ icon: "👥", label: "My Clients", fontSize: "13px" }),
    component: <MyClients />,
    condition: () => true,
  },
  {
    key: "/user/prospects",
    path: "/prospects",
    ...withSpacing({ icon: "📊", label: "Prospects", fontSize: "13px" }),
    component: <CDFProspects />,
    condition: () => true,
  },
  {
    key: "/user/my-team",
    path: "/my-team",
    ...withSpacing({ icon: "👤", label: "My Team", fontSize: "13px" }),
    component: <MyTeam />,
    condition: () => true,
  },
];

/**
 * Discovery section: `relativePath` is the segment under `/user/discovery/:segment`.
 * `stepTitle` / `stepIcon` drive DiscoveryFlowLayout heading + stepper (keep in sync with labels).
 * `showInDiscoveryStepper: false` — show in sidebar only, not in the horizontal stepper.
 */
export const discoveryRoutes = [
  {
    key: "/user/discovery/client-summary",
    relativePath: "client-summary",
    stepTitle: "Client Summary",
    stepIcon: "📄",
    path: "/user/discovery/client-summary",
    showInDiscoveryStepper: false,
    noDiscoveryLayout: true,
    ...withSpacing({
      icon: "📄",
      label: "Client Summary",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: clientSummaryElement,
    condition: () => true,
  },
  {
    key: "/user/discovery/personal-details",
    relativePath: "personal-details",
    stepTitle: "Personal Details",
    stepIcon: "👤",
    path: "/user/discovery/personal-details",
    ...withSpacing({
      icon: "👤",
      label: "Personal Details",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: personalDetailsElement,
    condition: () => true,
    showNavigationButtons: false,
    isCompleted: createSectionCompletionCheck(
      "personaldetails",
      "personalDetails",
    ),
  },
  {
    key: "/user/discovery/income-expenses",
    relativePath: "income-expenses",
    stepTitle: "Income & Expenses",
    cardsSelectionTitle: "Income & Expenses",
    stepIcon: "💲",
    showDiscoveryAddButton: true,
    path: "/user/discovery/income-expenses",
    showNavigationButtons: true,
    ...withSpacing({
      icon: "💲",
      label: "Income & Expenses",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <IncomeExpenses />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(INCOME_EXPENSE_CARDS),
    Cards: INCOME_EXPENSE_CARDS,
  },
  {
    key: "/user/discovery/assets-debt",
    relativePath: "assets-debt",
    stepTitle: "Assets & Debt",
    cardsSelectionTitle: "Personal Assets & Liabilities",
    stepIcon: "🏡",
    showDiscoveryAddButton: true,
    showNavigationButtons: true,
    path: "/user/discovery/assets-debt",
    ...withSpacing({
      icon: "🏡",
      label: "Assets & Debt",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <AssetAndDebt />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(ASSETS_DEBT_CARDS),
    Cards: ASSETS_DEBT_CARDS,
  },
  {
    key: "/user/discovery/financial-investments",
    relativePath: "financial-investments",
    stepTitle: "Financial Investments",
    cardsSelectionTitle: "Financial Investments",
    stepIcon: "📈",
    showNavigationButtons: true,
    showDiscoveryAddButton: true,
    path: "/user/discovery/financial-investments",
    ...withSpacing({
      icon: "📈",
      label: "Financial Investments",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <FinancialInvestments />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(FINANCIAL_INVESTMENTS_CARDS),
    Cards: FINANCIAL_INVESTMENTS_CARDS,
  },
  {
    key: "/user/discovery/estate-planning",
    relativePath: "estate-planning",
    stepTitle: "Estate Planning",
    cardsSelectionTitle: "Estate Planning & Professional Adviser",
    stepIcon: "📋",
    showNavigationButtons: true,
    showDiscoveryAddButton: true,
    path: "/user/discovery/estate-planning",
    ...withSpacing({
      icon: "📋",
      label: "Estate Planning",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <EstatePlanning />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(ESTATE_PLANNING_CARDS),
    Cards: ESTATE_PLANNING_CARDS,
  },
  {
    key: "/user/discovery/personal-insurance",
    relativePath: "personal-insurance",
    stepTitle: "Personal Insurance",
    cardsSelectionTitle: "Personal Insurance",
    stepIcon: "🛡️",
    showNavigationButtons: true,
    showDiscoveryAddButton: true,
    path: "/user/discovery/personal-insurance",
    ...withSpacing({
      icon: "🛡️",
      label: " Personal Insurance",
      fontSize: "12px",
      color: "#6b7280",
    }),
    condition: (q) =>
      String(q?.personalInsuranceTab ?? "").toLowerCase() === "yes",
    component: <PersonalInsurance />,
    isCompleted: createSectionCompletionCheck(
      "personalInsuranceTab",
      "personalInsurance",
    ),
    Cards: PERSONAL_INSURANCE_CARDS,
  },
  {
    key: "/user/discovery/business-entities",
    relativePath: "business-entities",
    stepTitle: "Business Entities",
    cardsSelectionTitle: "Business Entities",
    stepIcon: "🏢",
    showNavigationButtons: true,
    showDiscoveryAddButton: true,
    path: "/user/discovery/business-entities",
    ...withSpacing({
      icon: "🏢",
      label: "Business Entities",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <BusinessEntities />,
    condition: (q) => {
      return (
        String(q?.BusinessAsCompanyStructure ?? "").toLowerCase() === "yes" ||
        String(q?.BusinessAsTrusts ?? "").toLowerCase() === "yes"
      );
    },
    isCompleted: createCardsCompletionCheck(BUSINESS_ENTITIES_CARDS),
    Cards: BUSINESS_ENTITIES_CARDS,
  },
  {
    key: "/user/discovery/smsf",
    relativePath: "smsf",
    stepTitle: "SMSF",
    stepIcon: "🔐",
    cardsSelectionTitle: "Self Manged Super Fund",
    showDiscoveryAddButton: true,
    showNavigationButtons: true,
    path: "/user/discovery/smsf",
    ...withSpacing({
      icon: "🔐",
      label: " SMSF",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <SMSF />,
    condition: (q) =>
      String(q?.SMSFManagedFundsTab ?? "").toLowerCase() === "yes",
    isCompleted: createCardsCompletionCheck(SMSF_CARDS),
    Cards: SMSF_CARDS,
  },
  {
    key: "/user/discovery/investment-trust",
    relativePath: "investment-trust",
    stepTitle: "Investment Trust",
    cardsSelectionTitle: "Family Trust",
    stepIcon: "📊",
    showDiscoveryAddButton: true,
    showNavigationButtons: true,
    path: "/user/discovery/investment-trust",
    ...withSpacing({
      icon: "📊",
      label: " Investment Trust",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <FamilyTrust />,
    condition: (q) =>
      String(q?.businessAsInvestmentTab ?? "").toLowerCase() === "yes",
    isCompleted: createCardsCompletionCheck(FAMILY_TRUST_CARDS),
    Cards: FAMILY_TRUST_CARDS,
  },
  {
    key: "/user/discovery/goals-objectives",
    relativePath: "goals-objectives",
    stepTitle: "Goals & Objectives",
    stepIcon: "🎯",
    showNavigationButtons: true,
    showDiscoveryAddButton: false,
    path: "/user/discovery/goals-objectives",
    ...withSpacing({
      icon: "🎯",
      label: "Goals & Objectives",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <GoalsObjectives />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(GOALS_OBJECTIVES_CARDS),
    Cards: GOALS_OBJECTIVES_CARDS,
  },
  {
    key: "/user/discovery/risk-profile",
    relativePath: "risk-profile",
    routePath: "risk-profile/*",
    stepTitle: "Risk Profile",
    showInDiscoveryStepper: false,
    noDiscoveryLayout: true,
    stepIcon: "🌐",
    path: "/user/discovery/risk-profile",
    ...withSpacing({
      icon: "🌐",
      label: "Risk Profile",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <RiskProfile />,
    condition: () => true,
    isCompleted: createSectionCompletionCheck("riskprofile", "riskProfile"),
  },
  {
    key: "/user/discovery/add-section",
    relativePath: "add-section",
    stepTitle: "Add Section",
    stepIcon: "＋",
    path: "/user/discovery/add-section",
    /** No page route — opens `AddDiscoverySectionsModal` via Jotai (see UserLayout / DiscoveryFlowLayout). */
    modalOnly: true,
    ...withSpacing({
      icon: "＋",
      label: "Add Section",
      fontSize: "12px",
      color: "rgb(34, 197, 94)",
      fontWeight: "700",
    }),
    component: null,
    condition: () => true,
  },
];

/** Menu / stepper key for Add Section (opens modal instead of navigating). */
export const DISCOVERY_ADD_SECTION_KEY = "/user/discovery/add-section";

/** Routes shown in nav + stepper for the current discovery questionnaire state. */
export function getVisibleDiscoveryRoutes(questions = {}) {
  return discoveryRoutes.filter((r) => r.condition?.(questions) !== false);
}

/** Routes that appear in DiscoveryFlowLayout’s horizontal stepper (sidebar can list more). */
export function getDiscoveryStepperRoutes(questions = {}) {
  return getVisibleDiscoveryRoutes(questions).filter(
    (r) => r.showInDiscoveryStepper !== false,
  );
}

export function pathMatchesDiscoveryRoute(pathname, route) {
  if (!route?.relativePath) return false;
  const p = pathname.replace(/\/$/, "");
  return (
    p === route.key ||
    p.endsWith(`/user/discovery/${route.relativePath}`) ||
    p.endsWith(`/${route.relativePath}`)
  );
}

export function matchDiscoveryRoute(pathname, questions) {
  return getVisibleDiscoveryRoutes(questions).find((r) =>
    pathMatchesDiscoveryRoute(pathname, r),
  );
}

export function isDiscoveryRouteCompleted(route, context = {}) {
  if (!route || typeof route.isCompleted !== "function") {
    return false;
  }

  try {
    return Boolean(route.isCompleted({ route, ...context }));
  } catch {
    return false;
  }
}

export function getNextDiscoveryNavKey(pathname, questions) {
  const visible = getVisibleDiscoveryRoutes(questions).filter(
    (r) => !r.modalOnly,
  );
  const idx = visible.findIndex((r) => pathMatchesDiscoveryRoute(pathname, r));
  if (idx >= 0 && idx < visible.length - 1) return visible[idx + 1].key;
  return null;
}

export const strategyRoutes = [
  {
    key: "/strategy/denaro-deck",
    path: "/strategy/denaro-deck",
    ...withSpacing({
      icon: "🃏",
      label: "Denaro Deck",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/scenarios",
    path: "/strategy/scenarios",
    ...withSpacing({
      icon: "📍",
      label: "Scenarios",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/inputs",
    path: "/strategy/inputs",
    ...withSpacing({
      icon: "⬛",
      label: "Inputs",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/cashflow",
    path: "/strategy/cashflow",
    ...withSpacing({
      icon: "$",
      label: "Cashflow",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/networth",
    path: "/strategy/networth",
    ...withSpacing({
      icon: "↗",
      label: "Networth",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/reports",
    path: "/strategy/reports",
    ...withSpacing({
      icon: "📄",
      label: "Reports",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/compare",
    path: "/strategy/compare",
    ...withSpacing({
      icon: "⚖️",
      label: "Compare",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/advice",
    path: "/strategy/advice",
    ...withSpacing({
      icon: "✍️",
      label: "Advice",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
];

/** Flat routes rendered inside UserLayout (Discovery uses nested routes + DiscoveryFlowLayout). */
export const allUserRoutes = [...userRoutes, ...strategyRoutes];
