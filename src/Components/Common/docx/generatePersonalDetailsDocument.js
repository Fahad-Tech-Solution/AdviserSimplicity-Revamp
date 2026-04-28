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
    childFirstName: child?.firstName || "",
    childLastName: child?.lastName || "",
    childDob: child?.dob ? normalizeDateForDoc(child?.dob) : "",
    childAge: child?.age || "",
    childGender: child?.gender || "",
    childRelationship: child?.relationship || "",
    childDepenantChild: child?.depenantChild || "",
  }));
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
    ...buildPersonalDetailSection(personalDetails, "client"),
    ...buildPersonalDetailSection(personalDetails, "partner"),

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

