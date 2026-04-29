import {
  DownloadOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useAtomValue } from "jotai";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  goalsDataAtom,
  goalsSectionQuestionsAtom,
  riskProfileDataAtom,
  SelectedClient,
} from "../../../../../store/authState.js";
import { capitalizeFirst } from "../../../../../hooks/helpers.js";
import { CgArrowTopRight } from "react-icons/cg";

const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const CARD_BORDER = "1px solid #edf0f3";
const CARD_SHADOW = "0 10px 28px rgba(17, 24, 39, 0.06)";
const QUESTION_KEYS = [
  "question1",
  "question2",
  "question3",
  "question4",
  "question5",
  "question6",
  "question7",
  "question8",
];

const GOAL_SCOPE_ICONS = {
  "Age Care": "👴",
  Cashflow: "💸",
  Centrelink: "🎯",
  "Debt Management": "🔑",
  "Estate Planning": "📄",
  Investment: "📈",
  Investments: "📈",
  Other: "💬",
  "Personal Insurance": "🛡️",
  "Retirement Planning": "🏖️",
  Superannuation: "🐷",
};

const RISK_BREAKDOWNS = {
  "Cash Management": { growth: 0, defensive: 100, color: "#84cc16" },
  Conservative: { growth: 30, defensive: 70, color: "#84cc16" },
  "Moderately Conservative": { growth: 50, defensive: 50, color: "#f59e0b" },
  Balanced: { growth: 70, defensive: 30, color: "#3b82f6" },
  Growth: { growth: 85, defensive: 15, color: "#f97316" },
  "High Growth": { growth: 98, defensive: 2, color: "#ef4444" },
};

const ADDITIONAL_DISCOVERY_SECTIONS = [
  {
    title: "Personal Insurance",
    icon: "🛡️",
    key: "personalInsuranceTab",
    routePath: "personal-insurance",
  },
  {
    title: "Business Entities",
    icon: "🏢",
    key: "BusinessAsTrusts",
    routePath: "business-entities",
  },
  {
    title: "SMSF",
    icon: "🔐",
    key: "SMSFManagedFundsTab",
    routePath: "smsf",
  },
  {
    title: "Investment Trust",
    icon: "📊",
    key: "businessAsInvestmentTab",
    routePath: "investment-trust",
  },
];

function getPersonalDetailsFromDiscovery(data) {
  if (!data || typeof data !== "object") return null;
  if (data.personaldetails && typeof data.personaldetails === "object") {
    return data.personaldetails;
  }
  if (data.personalDetails && typeof data.personalDetails === "object") {
    return data.personalDetails;
  }
  if (
    data.client != null &&
    (data._id || data.client?.clientGivenName != null)
  ) {
    return data;
  }
  return null;
}

function hasPartnerDetails(partner = {}) {
  return Boolean(
    partner?.partnerPreferredName ||
    partner?.partnerGivenName ||
    partner?.partnerLastName ||
    partner?.partnerEmail ||
    partner?.partnerPhone ||
    partner?.partnerMobile ||
    partner?.partnerHomeAddress,
  );
}

function parseAmount(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^0-9.-]+/g, "")) || 0;
}

function formatAmount(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function sumValues(...values) {
  return values.reduce((total, value) => total + parseAmount(value), 0);
}

function pickFirstValue(source, keys = []) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const next = source?.[key];
    if (next !== undefined && next !== null && String(next).trim() !== "") {
      return next;
    }
  }
  return "";
}

function getPersonName(person = {}, role = "client") {
  const preferred =
    role === "client"
      ? person?.clientPreferredName
      : person?.partnerPreferredName;

  const first =
    role === "client" ? person?.clientGivenName : person?.partnerGivenName;

  const last =
    role === "client" ? person?.clientLastName : person?.partnerLastName;

  return [preferred, first, last].filter(Boolean).join(" ").trim() || "—";
}

function getRoleLabel(role) {
  return role === "client" ? "Client" : "Partner";
}

function getNickname(person = {}, role = "client") {
  const preferred =
    role === "client"
      ? person?.clientPreferredName
      : person?.partnerPreferredName;
  return preferred ? `(${capitalizeFirst(preferred)})` : "";
}

function formatAuDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU");
}

function getPhone(person = {}, role = "client") {
  return (
    pickFirstValue(person, [
      role === "client" ? "clientMobile" : "partnerMobile",
      role === "client" ? "clientWorkPhone" : "partnerWorkPhone",
      role === "client" ? "clientPhone" : "partnerPhone",
      role === "client" ? "clientHomePhone" : "partnerHomePhone",
      "phone",
    ]) || "—"
  );
}

function getEmail(person = {}, role = "client") {
  return (
    pickFirstValue(person, [
      role === "client" ? "Email" : "partnerEmail",
      "email",
    ]) || "—"
  );
}

function getAddress(person = {}, role = "client") {
  const address =
    pickFirstValue(person, [
      role === "client" ? "clientHomeAddress" : "partnerHomeAddress",
      role === "client" ? "clientAddress" : "partnerAddress",
      "address",
    ]) || "—";
  const postcode = pickFirstValue(person, [
    role === "client" ? "clientPostcode" : "partnerPostcode",
  ]);
  if (address === "—") return address;
  return postcode ? `${address}` : address;
}

function buildBadges(person = {}, client = {}) {
  return [
    {
      label: "Employment",
      value: pickFirstValue(person, [
        person?.clientPreferredName
          ? "clientEmploymentStatus"
          : "partnerEmploymentStatus",
      ]),
      color: "22, 163, 74",
    },
    {
      label: "Marital Status",
      value: client?.clientMaritalStatus,
      color: "29, 78, 216",
    },
    {
      label: "Smoker",
      value:
        pickFirstValue(person, [
          person?.clientPreferredName ? "clientSmoker" : "partnerSmoker",
        ]) === "Yes"
          ? "Smoker"
          : "Non-Smoker",
      color: "22, 163, 74",
    },
  ].filter(Boolean);
}

function yesNoTag(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  const isYes =
    normalized === "yes" || normalized === "true" || normalized === "1";
  return {
    label: isYes ? "YES" : "NO",
    color: isYes ? "#16a34a" : "#ef4444",
    bg: isYes ? "#ecfdf3" : "#fef2f2",
    border: isYes ? "#bbf7d0" : "#fecaca",
  };
}

function humanizeGoalKey(key) {
  return String(key ?? "")
    .replace(/Goal$/, "")
    .replace(/POA/g, "POA")
    .replace(/SMSF/g, "SMSF")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function hasGoalData(value) {
  if (!value || typeof value !== "object") return false;
  return ["scopeOfAdvice", "when", "estimatedValue", "description", "_id"].some(
    (key) => String(value?.[key] ?? "").trim() !== "",
  );
}

function calculateRiskScore(participant = {}) {
  return QUESTION_KEYS.reduce((total, key, index) => {
    const value = Number.isInteger(participant?.[key]) ? participant[key] : 0;
    return total + (index === 7 ? (value + 1) * 2 : value + 1);
  }, 0);
}

function getRiskBreakdown(goal) {
  return RISK_BREAKDOWNS[goal] || { growth: 0, defensive: 0, color: "#9ca3af" };
}

function SummaryLine({ label, value, muted = false, strong = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "7px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: muted ? "rgb(107, 114, 128)" : "#6b7280",
          fontWeight: 500,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: muted ? "rgb(209, 213, 219)" : "#111827",
          fontWeight: strong ? 700 : 600,
        }}
      >
        {value}
      </Text>
    </div>
  );
}

function SectionCard({ icon, title, children, footer }) {
  return (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 22,
        border: CARD_BORDER,
        boxShadow: CARD_SHADOW,
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {icon && (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0fdf4",
              fontSize: 14,
            }}
          >
            {icon}
          </div>
        )}
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#9ca3af",
            fontWeight: 800,
          }}
        >
          {title}
        </Text>
      </div>
      <div>{children}</div>
      {footer ? <div style={{ marginTop: 14 }}>{footer}</div> : null}
    </Card>
  );
}

function PersonSummaryCard({ person, role, client }) {
  const isClient = role === "client";

  const dob = isClient ? person?.clientDOB : person?.partnerDOB;
  const age = isClient ? person?.clientAge : person?.partnerAge;
  const gender = isClient ? person?.clientGender : person?.partnerGender;
  const health = isClient ? person?.clientHealth : person?.partnerHealth;
  const imageUrl = person?.image?.url;
  const name = getPersonName(person, role);
  const nickname = getNickname(person, role);
  const badges = buildBadges(person, client);

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 22,
        border: CARD_BORDER,
        boxShadow: CARD_SHADOW,
        height: "100%",
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        <Avatar
          size={50}
          src={imageUrl || undefined}
          style={{
            background: isClient
              ? "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))"
              : "linear-gradient(135deg, rgb(2, 132, 199), rgb(3, 105, 161))",
            fontSize: 22,
            border: `3px solid #f0fdf4`,
            boxShadow: `rgba(0, 0, 0, 0.12) 0px 4px 10px`,
          }}
        >
          {imageUrl === "" || imageUrl === null || imageUrl === undefined
            ? null
            : isClient
              ? "👨"
              : "👩"}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title
            level={4}
            style={{
              margin: 0,
              fontFamily: "Georgia, serif",
              fontWeight: 600,
              fontSize: 17,
              color: "#111827",
            }}
          >
            {name}
          </Title>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>
            {nickname} · {getRoleLabel(role)}
          </Text>
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}
          >
            {badges.map((badge) => (
              <Tag
                key={badge.label}
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  border: `1px solid rgb(${badge.color}, 0.25)`,
                  background: `rgb(${badge.color}, 0.1)`,
                  color: `rgb(${badge.color})`,
                  fontSize: 10,
                  fontWeight: 600,
                  paddingInline: 8,
                  paddingBlock: 0,
                }}
              >
                {badge.value}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <Descriptions
        column={2}
        colon={false}
        size="small"
        style={{ marginTop: 16 }}
        styles={{
          label: {
            fontSize: 11,
            color: "#9ca3af",
            paddingBottom: 2,
            // borderBottom: "0.5px solid rgb(243, 243, 243)",
            width: "75px",
          },
          content: {
            fontSize: 12,
            fontWeight: 700,
            color: "#111827",
            paddingBottom: 0,
            // borderBottom: "0.5px solid rgb(243, 243, 243)",
          },
        }}
        items={[
          {
            key: "dob",
            label: "Date of Birth",
            children: formatAuDate(dob),
          },
          {
            key: "age",
            label: "Age",
            children: `${age} yrs`,
          },
          {
            key: "gender",
            label: "Gender",
            children: gender || "—",
          },
          {
            key: "health",
            label: "Health",
            children: health || "—",
          },
          {
            key: "phone",
            label: <span>📞 Phone</span>,
            children: getPhone(person, role),
          },
          {
            key: "email",
            label: <span>✉️ Email</span>,
            children: (
              <span style={{ wordBreak: "break-word" }}>
                {getEmail(person, role)}
              </span>
            ),
          },
          {
            key: "address",
            label: "📍 Address",
            span: 2,
            children: (
              <span style={{ wordBreak: "break-word" }}>
                {getAddress(person, role)}
              </span>
            ),
          },
        ]}
      />
    </Card>
  );
}

function RiskParticipantSummary({ name, participant }) {
  const score = calculateRiskScore(participant);
  const goal = participant?.riskGoal || "Not Calculated";
  const breakdown = getRiskBreakdown(goal);

  return (
    <div
      style={{
        border: "1px solid #eef2f7",
        borderRadius: 14,
        padding: 12,
        background: "#fff",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {name}
        </Text>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: breakdown.color,
            background: `${breakdown.color}14`,
            border: `1px solid ${breakdown.color}33`,
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {goal}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: "#6b7280" }}>
          Score: {score}/38
        </Text>
        <Text style={{ fontSize: 11, color: "#6b7280" }}>
          {breakdown.growth}% Growth - {breakdown.defensive}% Defensive
        </Text>
      </div>
      <Progress
        percent={breakdown.growth}
        showInfo={false}
        strokeColor={breakdown.color}
        trailColor="#e5e7eb"
        size={["100%", 8]}
      />
    </div>
  );
}

export default function ClientSummary() {
  const navigate = useNavigate();
  const selected = useAtomValue(SelectedClient);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const discoveryQuestions = useAtomValue(discoverySectionQuestionsAtom);
  const goalsData = useAtomValue(goalsDataAtom);
  const goalsQuestions = useAtomValue(goalsSectionQuestionsAtom);
  const riskProfileData = useAtomValue(riskProfileDataAtom);

  const personalDetails = getPersonalDetailsFromDiscovery(discoveryData);
  const client = personalDetails?.client ?? selected?.client ?? {};
  const partner = personalDetails?.partner ?? selected?.partner ?? {};
  const showPartner = hasPartnerDetails(partner);

  const incomeSummary = useMemo(() => {
    const rows = [
      {
        label: `Employment — ${client?.clientPreferredName || "Client"}`,
        amount: parseAmount(discoveryData?.incomeFromOwnBusiness?.clientTotal),
      },
      ...(showPartner
        ? [
            {
              label: `Employment — ${partner?.partnerPreferredName || "Partner"}`,
              amount: parseAmount(
                discoveryData?.incomeFromOwnBusiness?.partnerTotal,
              ),
            },
          ]
        : []),
      {
        label: "Centrelink",
        amount: sumValues(
          discoveryData?.incomeFromCentrelink?.clientTotal,
          discoveryData?.incomeFromCentrelink?.partnerTotal,
        ),
      },
      {
        label: "Overseas Pension",
        amount: sumValues(
          discoveryData?.incomeFromOverseasPension?.clientTotal,
          discoveryData?.incomeFromOverseasPension?.partnerTotal,
        ),
      },
      {
        label: "Living Expenses",
        amount: parseAmount(
          discoveryData?.generalLivingExpenses?.generalLivingExpensesTotal,
        ),
      },
      {
        label: "Retirement Living",
        amount: parseAmount(
          discoveryData?.retirementLivingExpenses?.retirementLivingExpense,
        ),
      },
    ];

    const positiveIncome = rows
      .slice(0, 4)
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = rows.slice(4).reduce((sum, item) => sum + item.amount, 0);

    return {
      rows,
      total: positiveIncome - expenses,
    };
  }, [
    client?.clientPreferredName,
    discoveryData,
    partner?.partnerPreferredName,
    showPartner,
  ]);

  const assetDebtSummary = useMemo(() => {
    const rows = [
      {
        label: "Family Home",
        amount: parseAmount(
          pickFirstValue(discoveryData?.familyHome, [
            "currentValue",
            "clientTotal",
          ]),
        ),
      },
      {
        label: "Home Loan",
        amount: parseAmount(
          pickFirstValue(discoveryData?.familyHome, [
            "loanAmount",
            "partnerTotal",
          ]),
        ),
      },
      {
        label: "Cars",
        amount: sumValues(
          discoveryData?.car?.clientTotal,
          discoveryData?.car?.partnerTotal,
          discoveryData?.car?.jointTotal,
        ),
      },
      {
        label: "Contents",
        amount: parseAmount(discoveryData?.houseHold?.jointTotal),
      },
      {
        label: "Caravan",
        amount: parseAmount(discoveryData?.caravan?.jointTotal),
      },
      {
        label: "Other Assets",
        amount: parseAmount(discoveryData?.otherAssets?.jointTotal),
      },
      {
        label: "Credit Card",
        amount: sumValues(
          discoveryData?.creditCards?.clientTotal,
          discoveryData?.creditCards?.partnerTotal,
          discoveryData?.creditCards?.jointTotal,
        ),
      },
      {
        label: "Personal Loan",
        amount: sumValues(
          discoveryData?.personalLoans?.clientTotal,
          discoveryData?.personalLoans?.partnerTotal,
          discoveryData?.personalLoans?.jointTotal,
        ),
      },
    ];

    const assets = rows
      .filter((item) =>
        ["Family Home", "Cars", "Contents", "Caravan", "Other Assets"].includes(
          item.label,
        ),
      )
      .reduce((sum, item) => sum + item.amount, 0);
    const debt = rows
      .filter((item) =>
        ["Home Loan", "Credit Card", "Personal Loan"].includes(item.label),
      )
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      rows,
      assets,
      debt,
      net: assets - debt,
    };
  }, [discoveryData]);

  const investmentsSummary = useMemo(() => {
    const superannuationTotal = sumValues(
      discoveryData?.superAnnuationIssues?.clientTotal,
      discoveryData?.superAnnuationIssues?.partnerTotal,
      discoveryData?.accountBasedPensionIssues?.clientTotal,
      discoveryData?.accountBasedPensionIssues?.partnerTotal,
      discoveryData?.annuitiesIssues?.clientTotal,
      discoveryData?.annuitiesIssues?.partnerTotal,
    );

    const investmentLoansTotal = sumValues(
      discoveryData?.managedFundsLOC?.clientTotal,
      discoveryData?.managedFundsLOC?.partnerTotal,
      discoveryData?.managedFundsLOC?.jointTotal,
      discoveryData?.managedFundsMarginLoan?.clientTotal,
      discoveryData?.managedFundsMarginLoan?.partnerTotal,
      discoveryData?.managedFundsMarginLoan?.jointTotal,
    );

    const rows = [
      {
        label: "Bank Accounts",
        amount: sumValues(
          discoveryData?.bankAccountFinance?.clientTotal,
          discoveryData?.bankAccountFinance?.partnerTotal,
        ),
      },
      {
        label: "Term Deposits",
        amount: sumValues(
          discoveryData?.termDepositsFinance?.clientTotal,
          discoveryData?.termDepositsFinance?.partnerTotal,
        ),
      },
      {
        label: "Aus Shares / ETFs",
        amount: sumValues(
          discoveryData?.australianShareMarket?.clientTotal,
          discoveryData?.australianShareMarket?.partnerTotal,
        ),
      },
      {
        label: "Platform Investments",
        amount: sumValues(
          discoveryData?.managedFund?.clientTotal,
          discoveryData?.managedFund?.partnerTotal,
        ),
      },
      {
        label: "Investment Bonds",
        amount: sumValues(
          discoveryData?.investmentBondFinance?.clientTotal,
          discoveryData?.investmentBondFinance?.partnerTotal,
        ),
      },
      { label: "Superannuation", amount: superannuationTotal },
      {
        label: "Inv. Properties",
        amount: parseAmount(
          discoveryData?.investmentPropertyDetails?.propertyPortfolio,
        ),
      },
      { label: "Investment Loans", amount: investmentLoansTotal },
    ];

    return {
      rows,
      total: rows.reduce((sum, item) => sum + item.amount, 0),
    };
  }, [discoveryData]);

  const estateSummary = useMemo(() => {
    const willData = discoveryData?.will || {};
    const poaData = discoveryData?.POA || {};

    const personValues = [
      willData?.client,
      willData?.partner,
      poaData?.client,
      poaData?.partner,
    ].filter(Boolean);

    const hasExecutor = [
      willData?.client?.executor,
      willData?.partner?.executor,
    ].some((value) => Array.isArray(value) && value.length > 0);
    const hasPOA = [poaData?.client?.POAName, poaData?.partner?.POAName].some(
      (value) => Array.isArray(value) && value.length > 0,
    );

    return [
      {
        label: "Wills Current",
        value: [
          willData?.client?.willsCurrent,
          willData?.partner?.willsCurrent,
        ].some((value) => String(value).toLowerCase() === "yes")
          ? "Yes"
          : "No",
      },
      { label: "POA Appointed", value: hasPOA ? "Yes" : "No" },
      {
        label: "Enduring Guardian",
        value: [
          willData?.client?.enduringGuardianship,
          willData?.partner?.enduringGuardianship,
        ].some((value) => String(value).toLowerCase() === "yes")
          ? "Yes"
          : "No",
      },
      {
        label: "Testamentary Trust",
        value: [
          willData?.client?.testamentaryTrust,
          willData?.partner?.testamentaryTrust,
        ].some((value) => String(value).toLowerCase() === "yes")
          ? "Yes"
          : "No",
      },
      {
        label: "Estate Plan Reqd",
        value: [
          willData?.client?.estatePlanningRadio,
          willData?.partner?.estatePlanningRadio,
        ].some((value) => String(value).toLowerCase() === "yes")
          ? "Yes"
          : "No",
      },
      { label: "Executor Appointed", value: hasExecutor ? "Yes" : "No" },
      { label: "_count", value: personValues.length },
    ];
  }, [discoveryData]);

  const goalsSummary = useMemo(() => {
    return Object.entries(goalsData || {})
      .filter(
        ([key, value]) => goalsQuestions?.[key] === "Yes" && hasGoalData(value),
      )
      .map(([key, value]) => ({
        key,
        title: humanizeGoalKey(key),
        scope: value?.scopeOfAdvice || "",
        when: value?.when || "Planned",
        icon: GOAL_SCOPE_ICONS[value?.scopeOfAdvice] || "🎯",
      }));
  }, [goalsData, goalsQuestions]);

  const riskSummary = useMemo(() => {
    const participants = [
      {
        key: "client",
        name: client?.clientPreferredName || "Client",
        data: riskProfileData?.client,
      },
      ...(showPartner
        ? [
            {
              key: "partner",
              name: partner?.partnerPreferredName || "Partner",
              data: riskProfileData?.partner,
            },
          ]
        : []),
    ].filter((item) => item?.data);

    const completed =
      Array.isArray(participants) && participants.length > 0
        ? participants.every((item) => item?.data?.happyWithResult)
        : false;

    const inconsistencyCount = Array.isArray(riskProfileData?.conflicts)
      ? riskProfileData.conflicts.length
      : 0;

    return { participants, completed, inconsistencyCount };
  }, [
    client?.clientPreferredName,
    partner?.partnerPreferredName,
    riskProfileData,
    showPartner,
  ]);

  const additionalDiscoverySections = useMemo(() => {
    return ADDITIONAL_DISCOVERY_SECTIONS.map((item) => {
      if (discoveryQuestions?.[item.key] === "Yes") {
        return {
          ...item,
          value: "Yes",
        };
      }
      return null;
    }).filter(Boolean);
  }, [discoveryQuestions]);

  const totalNetWorth = investmentsSummary.total + assetDebtSummary.net;
  const hasSelection = Boolean(selected?._id || personalDetails?._id);

  if (!hasSelection) {
    return (
      <Card style={{ borderRadius: 16 }}>
        <Text type="secondary">
          Select a client from `My Clients` to view the client summary.
        </Text>
      </Card>
    );
  }

  return (
    <div style={{ paddingTop: 12, maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Text
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: 3,
                color: PRIMARY_GREEN,
                textTransform: "uppercase",
                marginBottom: 8,
                fontWeight: 400,
                fontFamily: "Arial, sans-serif",
              }}
            >
              Discovery
            </Text>
            <Title
              level={2}
              style={{
                marginTop: 18,
                marginBottom: 10,
                fontFamily: "Georgia, serif",
                fontWeight: 400,
                fontSize: 28,
                color: "#111827",
              }}
            >
              Client Summary
            </Title>
          </div>
          <Space size={10} wrap>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate("/user/discovery/personal-details")}
              style={{
                borderRadius: 10,
                height: 40,
                paddingInline: 18,
                borderColor: "#d1d5db",
                color: "#374151",
                fontWeight: 600,
              }}
            >
              Edit Discovery
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{
                borderRadius: 10,
                height: 40,
                paddingInline: 18,
                background: PRIMARY_GREEN,
                borderColor: PRIMARY_GREEN,
                boxShadow: "0 6px 18px rgba(34, 197, 94, 0.25)",
                fontWeight: 700,
              }}
            >
              DownLoad PDF
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={showPartner ? 12 : 24}>
          <PersonSummaryCard person={client} role="client" client={client} />
        </Col>
        {showPartner ? (
          <Col xs={24} lg={12}>
            <PersonSummaryCard
              person={partner}
              role="partner"
              client={client}
            />
          </Col>
        ) : null}

        <Col xs={24} md={8} xl={8}>
          <SectionCard
            icon="💵"
            title="Income & Expenses"
            footer={
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}
                >
                  Net Annual Income
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: PRIMARY_GREEN,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {formatAmount(incomeSummary.total)}
                </Text>
              </div>
            }
          >
            {incomeSummary.rows.map((item) => (
              <SummaryLine
                key={item.label}
                label={item.label}
                value={formatAmount(item.amount)}
                muted={item.amount === 0}
                strong={item.amount > 0}
              />
            ))}
          </SectionCard>
        </Col>

        <Col xs={24} md={8} xl={8}>
          <SectionCard
            icon="🏡"
            title="Assets & Debt"
            footer={
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}
                >
                  Net Personal Assets
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: PRIMARY_GREEN,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {formatAmount(assetDebtSummary.net)}
                </Text>
              </div>
            }
          >
            {assetDebtSummary.rows.map((item) => (
              <SummaryLine
                key={item.label}
                label={item.label}
                value={formatAmount(item.amount)}
                muted={item.amount === 0}
                strong={item.amount > 0}
              />
            ))}
          </SectionCard>
        </Col>

        <Col xs={24} md={8} xl={8}>
          <SectionCard
            icon="📈"
            title="Financial Investments"
            footer={
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}
                >
                  Total Investments
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: PRIMARY_GREEN,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {formatAmount(investmentsSummary.total)}
                </Text>
              </div>
            }
          >
            {investmentsSummary.rows.map((item) => (
              <SummaryLine
                key={item.label}
                label={item.label}
                value={formatAmount(item.amount)}
                muted={item.amount === 0}
                strong={item.amount > 0}
              />
            ))}
          </SectionCard>
        </Col>

        <Col xs={24} md={8} xl={8}>
          <SectionCard icon="📋" title="Estate Planning">
            {estateSummary
              .filter((item) => item.label !== "_count")
              .map((item) => {
                const status = yesNoTag(item.value);
                return (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "7px 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Text>
                    <span
                      style={{
                        minWidth: 38,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: status.color,
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        borderRadius: 999,
                        padding: "3px 5px",
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
          </SectionCard>
        </Col>

        <Col xs={24} md={8} xl={8}>
          <SectionCard icon="🎯" title="Goals & Objectives">
            {goalsSummary.length === 0 ? (
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                No goals selected yet.
              </Text>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {goalsSummary.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #f3f4f6",
                      background: "#f9fafb",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#111827",
                          fontWeight: 700,
                        }}
                      >
                        {item.title}
                      </Text>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        color: "#6b7280",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      {item.when}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </Col>

        <Col xs={24} md={8} xl={8}>
          <SectionCard icon="🌐" title="Risk Profile">
            {riskSummary.participants.length === 0 ? (
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                Risk profile has not been completed yet.
              </Text>
            ) : (
              riskSummary.participants.map((item) => (
                <RiskParticipantSummary
                  key={item.key}
                  name={item.name}
                  participant={item.data}
                />
              ))
            )}
            <div style={{ marginTop: 6 }}>
              <SummaryLine
                label="Profile Completed"
                value={riskSummary?.completed ? "Yes" : "No"}
                strong={riskSummary?.completed}
              />
              <SummaryLine
                label="Inconsistencies"
                value={
                  riskSummary.inconsistencyCount > 0
                    ? String(riskSummary.inconsistencyCount)
                    : "None"
                }
                strong={riskSummary.inconsistencyCount === 0}
              />
            </div>
          </SectionCard>
        </Col>

        <Col xs={24}>
          <SectionCard icon="" title="Additional Discovery Sections">
            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "row",
                gap: 10,
              }}
            >
              {additionalDiscoverySections.map((item) => (
                <div
                  key={item.key}
                  className="client-summary-additional-discovery-section"
                  onClick={() => navigate(`/user/discovery/${item.routePath}`)}
                >
                  <Text
                    style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}
                  >
                    {item.icon} &nbsp;
                    {item.title} &nbsp; <CgArrowTopRight />
                  </Text>
                </div>
              ))}
            </div>
          </SectionCard>
        </Col>

        <Col xs={24}>
          <Card
            bordered={false}
            style={{
              borderRadius: 18,
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 14px 28px rgba(34, 197, 94, 0.25)",
            }}
            styles={{ body: { padding: "18px 22px" } }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={9}>
                <Text
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  Estimated Total Net Worth
                </Text>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 23,
                    lineHeight: 1.1,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {formatAmount(totalNetWorth)}
                </div>
              </Col>
              <Col xs={24} md={9}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: "Investments",
                      value: formatAmount(investmentsSummary.total),
                    },
                    {
                      label: "Personal Assets",
                      value: formatAmount(assetDebtSummary.assets),
                    },
                    {
                      label: "Total Debt",
                      value: formatAmount(assetDebtSummary.debt),
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <Text
                        style={{
                          display: "block",
                          color: "rgba(255,255,255,0.75)",
                          fontSize: 10,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.label}
                      </Text>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: 700,
                          marginTop: 4,
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col
                xs={24}
                md={6}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  onClick={() => navigate("/user/discovery/risk-profile")}
                  style={{
                    minWidth: 170,
                    height: 44,
                    borderRadius: 12,
                    borderColor: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Open Strategy Module <RightOutlined />
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
