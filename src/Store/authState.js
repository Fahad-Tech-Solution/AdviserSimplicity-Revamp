import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/** In-memory session only — auth cookie is HttpOnly and not stored in JS. */
export const loggedInUser = atom({
  email: "",
  user: null,
  permissions: [],
});

export const CDFProspectsData = atomWithStorage("CDFProspectsData", []);
export const MyClientsData = atomWithStorage("MyClientsData", { clients: [] });

/** Team / employees list from GET /user/Employees (bootstrap). */
export const MyTeamData = atomWithStorage("MyTeamData", []);

export const InvestmentOffersData = atomWithStorage("InvestmentOffersData", []);

/** Currently selected household row from My Clients (set when user chooses Select). */
export const SelectedClient = atomWithStorage(null);

export const userDashboardLoading = atom(false);
export const userDashboardError = atom(null);

export const discoveryDataAtom = atomWithStorage("discoveryDataAtom", {
  personalDetails: {},
  BusinessAsCompanyStructure: {},
  BusinessAsTrusts: {},
  POA: {},
  professionalAdviser: {},
  will: {},
  familyAustralianShare: {},
  familyBank: {},
  familyDetails: {},
  familyInvestmentHomeLoan: {},
  familyInvestmentProperties: {},
  familyMangedFunds: {},
  familyTermDeposit: {},
  familyOtherInvestment: {},
  australianShareMarket: {},
  bankAccountFinance: {},
  investmentBondFinance: {},
  managedFundsLOC: {},
  managedFundsMarginLoan: {},
  managedFund: {},
  termDepositsFinance: {},
  accountBasedPensionIssues: {},
  annuitiesIssues: {},
  superAnnuationIssues: {},
  investmentPropertyDetails: {},
  incomeExpenses: {},
  investmentPropertyLoan: {},
  familyHome: {},
  boat: {},
  car: {},
  caravan: {},
  houseHold: {},
  creditCards: {},
  otherAssets: {},
  personalLoans: {},
  generalLivingExpenses: {},
  incomeFromCentrelink: {},
  incomeFromOverseasPension: {},
  incomeFromOwnBusiness: {},
  incomeFromPartnership: {},
  incomeFromSoleTrader: {},
  incomeFromSuperPayment: {},
  retirementLivingExpenses: {},
  personalInsurance: {},
  incomeProtection: {},
  life: {},
  TPD: {},
  trauma: {},
  holidayHome: [],
  holidayHomeLoan: [],
  SMSFAccumulationDetails: {},
  SMSFAustralianShares: {},
  SMSFBank: {},
  SMSFDetails: {},
  SMSFInvestmentLoan: {},
  SMSFInvestmentProperties: {},
  SMSFManagedFunds: {},
  SMSFPensionPhase: {},
  SMSFTermDeposits: {},
  SMSFOtherInvestment: {},
});
export const discoverySectionQuestionsAtom = atomWithStorage(
  "discoverySectionQuestionsAtom",
  {},
);

export const goalsDataAtom = atomWithStorage("goalsDataAtom", {});
export const goalsSectionQuestionsAtom = atomWithStorage(
  "goalsSectionQuestionsAtom",
  {},
);

export const riskProfileDataAtom = atomWithStorage("riskProfileDataAtom", {});

/** True while adviser is adding a household via Personal Details (not persisted). */
export const creatingNewClientAtom = atom(false);

/** Opens Add Discovery Sections modal (no route change; sidebar + stepper only). */
export const addDiscoverySectionsModalOpen = atom(false);

/** Goals and Objectives Questions and Details */
export const advisersDataAtom = atomWithStorage("advisersDataAtom", []);

/** Catalogs Data — object keyed by section e.g. FinancialInstitutions. */
export const catalogsDataAtom = atomWithStorage("catalogsDataAtom", {});

/** Knowledge Base Entries — array of entries. */
export const KnowledgeBaseEntriesAtom = atomWithStorage(
  "KnowledgeBaseEntriesAtom",
  [],
);

export const ttsTextAtom = atom("");
export const ttsTopicAtom = atom(""); // Topic title to display when active
export const ttsStateAtom = atom("stopped"); // 'speaking' | 'paused' | 'stopped'
export const ttsSpeedAtom = atom(1.0); // Playback rate (0.5x - 2.0x)
export const ttsVoiceAtom = atom(null); // Selected SpeechSynthesisVoice URI or name
