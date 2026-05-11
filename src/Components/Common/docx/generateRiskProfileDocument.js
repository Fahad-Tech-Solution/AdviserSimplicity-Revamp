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

function buildSection(person = {}, calculateScore) {
  const section = {};

  // Question Option Mapping
  const questionOptions = {
    question1: 4,
    question2: 3,
    question3: 4,
    question4: 5,
    question5: 4,
    question6: 4,
    question7: 4,
    question8: 5,
  };

  Object.keys(questionOptions).forEach((questionKey, qIndex) => {
    const totalOptions = questionOptions[questionKey];

    for (let i = 0; i < totalOptions; i += 1) {
      section[`Q${qIndex + 1}Op${i + 1}`] = person?.[questionKey] === i;
    }
  });

  // Score
  section.score = typeof calculateScore === "function" ? calculateScore(person) : 0;

  // Risk Goals
  const riskGoals = [
    "Cash Management",
    "Conservative",
    "Moderately Conservative",
    "Balanced",
    "Growth",
    "High Growth",
  ];

  riskGoals.forEach((goal) => {
    const key = `riskGoal${goal.replace(/\s/g, "")}`;
    section[key] = person?.riskGoal === goal;
  });

  // Descriptions
  section.riskDescription = person?.riskDescription || "";
  section.addNoteDescription = person?.addNoteDescription || "";

  return [section]; // returning array to match your structure
}

export async function generateRiskProfileDocument({
  values,
  personalDetails,
  sessionUser,
  calculateScore,
  templateFileName = "riskprofiletemplate.docx",
  downloadFileName,
} = {}) {
  const clientPreferred =
    personalDetails?.client?.clientPreferredName ||
    personalDetails?.client?.clientFirstName ||
    "Client";
  const partnerPreferred =
    personalDetails?.partner?.partnerPreferredName ||
    personalDetails?.partner?.partnerFirstName ||
    "";

  const adviserName = sessionUser
    ? `${toSentenceCase(sessionUser?.firstName)} ${toSentenceCase(
        sessionUser?.lastName,
      )}`.trim()
    : "Guest";

  const maritalStatus = personalDetails?.client?.clientMaritalStatus || "";
  const isSingle =
    ["Single", "Widowed", ""].includes(maritalStatus) ||
    values?.joinedProfile === "Yes";

    console.log("isSingle", isSingle);
    console.log("values?.joinedProfile", values?.joinedProfile);
    console.log("maritalStatus", maritalStatus);

  const payload = {
    adviserName,
    downloadDate: formatAuDate(),
    clientPreferred,
    partnerPreferred,
    isSingle,
    PageBreak: `<w:br w:type="page"/>`,
    clientSection: buildSection(values?.client || {}, calculateScore),
    partnerSection: buildSection(values?.partner || {}, calculateScore),
  };

  const resolvedDownloadName =
    downloadFileName ||
    `Adviser Simplicity Fact Find of ${clientPreferred}.docx`;

  return generateDocumentFromTemplate(payload, templateFileName, resolvedDownloadName);
}

