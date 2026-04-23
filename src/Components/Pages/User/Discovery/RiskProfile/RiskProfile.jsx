import { useAtomValue, useSetAtom } from "jotai";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import useApi from "../../../../../hooks/useApi.js";
import { discoveryDataAtom } from "../../../../../store/authState.js";
import Text from "antd/es/typography/Text.js";
import Title from "antd/es/typography/Title.js";
import RiskProfileSteps from "./RiskProfileSteps.jsx";
import IntroStep from "./IntroStep.jsx";
import QuestionStep from "./QuestionStep.jsx";
import DetectionMatrixStep from "./DetectionMatrixStep.jsx";

const { TextArea } = Input;

const RISK_GOALS = [
  {
    title: "Cash Management",
    value: "Cash Management",
    range: { lowest: 9, highest: 13 },
    description:
      "Your responses indicate an extremely low tolerance to investment risk or a short investment time frame. The only appropriate investment for this profile or time frame is a cash-based investment such as bank accounts, cash management trusts and term deposits.",
    chart: [90, 10, 0, 0],
  },
  {
    title: "Conservative",
    value: "Conservative",
    range: { lowest: 14, highest: 18 },
    description:
      "As a Conservative investor, you are primarily focused on preserving capital and are prepared to accept lower returns to reduce the chance of losses. A defensive mix with more cash and fixed interest and a smaller allocation to growth assets would generally suit this profile. Minimum investment term: 2 years.",
    chart: [70, 20, 10, 0],
  },
  {
    title: "Moderately Conservative",
    value: "Moderately Conservative",
    range: { lowest: 19, highest: 23 },
    description:
      "As a Moderately Conservative investor, you seek steady growth with a preference for smaller short-term fluctuations. A diversified portfolio with a balance of defensive assets and growth assets would generally suit this profile. Minimum investment term: 3 years.",
    chart: [55, 25, 20, 0],
  },
  {
    title: "Balanced",
    value: "Balanced",
    range: { lowest: 24, highest: 28 },
    description:
      "As a Balanced investor, you are prepared to accept moderate short-term fluctuations for the opportunity of better medium to long-term returns. A diversified portfolio with a bias toward growth assets would generally suit this profile. Minimum investment term: 5 years.",
    chart: [35, 25, 30, 10],
  },
  {
    title: "Growth",
    value: "Growth",
    range: { lowest: 29, highest: 33 },
    description:
      "As a Growth investor, you focus on assets with stronger long-term growth potential and accept higher short-term volatility to pursue stronger returns. A diversified portfolio with a strong bias to growth investments would generally suit this profile. Minimum investment term: 5 years.",
    chart: [20, 15, 45, 20],
  },
  {
    title: "High Growth",
    value: "High Growth",
    range: { lowest: 34, highest: 100 },
    description:
      "As a High Growth investor, you are comfortable with significant short-term fluctuations in performance in pursuit of stronger long-term gains. A portfolio dominated by growth assets such as shares and property would generally suit this profile. Minimum investment term: 7 years.",
    chart: [5, 10, 55, 30],
  },
];

const QUESTION_STEPS = [
  {
    route: "",
    icon: "",
    key: "intro",
    title: "Risk Profile Questionnaire",
    question:
      "Would you like to answer this questionnaire individually or as a couple?",
    choices: [],
    showInSteps: false,
  },
  {
    route: "q1",
    key: "question1",
    icon: "🏦",
    title: "Desired Liquidity",
    question:
      "Question 1: Accessibility of your Funds - Desired Liquidity. Based on your stated goals, how long do you envisage these funds can be invested before you require access to them?",
    choices: [
      "Less than one year",
      "1 – 3 years",
      "3 – 5 years",
      "More than 5 years",
    ],
  },
  {
    route: "q2",
    icon: "💲",
    key: "question2",
    title: "Rate of return",
    question:
      "Question 2: Your desired rate of return. What annual rate of return do you expect your investments to achieve in order to satisfy your previously stated goals?",
    choices: ["Less than 5%", "5% - 10%", "More than 10%"],
  },
  {
    route: "q3",
    icon: "📉",
    key: "question3",
    title: "Capital Risk",
    question:
      "Question 3: Your attitude to Capital Risk. Which response best describes your attitude toward investing?",
    choices: [
      "The safety of my capital is of primary importance to me. I am happier to achieve a lower rate of return rather than risk any significant loss of my capital.",
      "I would like the value of my capital to remain relatively stable but it is important that my investments meet my income requirements.",
      "I am comfortable with the value of my investment going up and down in value over time to try and achieve higher returns over the long term.",
      "I'm comfortable and prepared to take on high risk for the chance of getting higher returns on my money over the long term.",
    ],
  },
  {
    route: "q4",
    icon: "🛒",
    key: "question4",
    title: "Inflation",
    question:
      "Question 4: Your concerns about inflation. How concerned are you with your savings being eroded due to inflation and the rising costs of necessities such as groceries, utilities, and healthcare.",
    choices: [
      "Not concerned",
      "Slightly concerned",
      "Moderately concerned",
      "Very concerned",
      "Highly concerned",
    ],
  },
  {
    route: "q5",
    icon: "📋",
    key: "question5",
    title: "Legislative Risk",
    question:
      "Question 5: Your concerns about Legislative Risk. Investors often arrange their finances in order to qualify for government benefits and / or tax advantages. However, potential changes in the law risk leaving them worse off after those rearrangements have been made. Would you still rearrange your investments to qualify for these benefits, despite the risks of being worse off?",
    choices: [
      "No, I wouldn't do it if there's a risk, I'd be worse off.",
      "I would only do it if there is a slight risk I would be worse off.",
      "If there are potential changes in the law, I am willing to adjust my finances to protect my financial situation.",
      "If it improves my situation now, I'm willing to rearrange my investments and finances, regardless of future changes in the law.",
    ],
  },
  {
    route: "q6",
    icon: "💡",
    key: "question6",
    title: "Investment knowledge",
    question:
      "Question 6: Your investment knowledge & experience. How familiar are you with Investment Markets?",
    choices: [
      "I don’t understand anything about investment markets.",
      "I have a basic understanding of investment markets. I know they go up and down but I'm not sure about the reasons behind these fluctuations.",
      "I understand that markets like the Australian ASX 200 and US S&P 500 and others can go up and down, each with different income, growth, and tax characteristics. I understand the importance of diversification to help me reduce risk and avoid putting all my eggs in the one basket.",
      "I am experienced with all investment sectors and understand the various factors that can impact investment performance. In the past, I have invested in some or all of the following assets: shares, ETFs, and managed funds.",
    ],
  },
  {
    route: "q7",
    icon: "📊",
    key: "question7",
    title: "Volatility",
    question:
      "Question 7: Your concern about volatility - The changes in how much money your investments make, and the chance of losing money. If you invested $100,000 a year ago and you find out today it's worth $80,000 how would you feel?",
    choices: [
      "I would panic and sell my investment and then put the remaining amount in cash.",
      "I would feel nervous, and I might consider moving some or all of my money to a safer option.",
      "I would be confident in my investment strategy and keep my money where it is and stick to my long-term plan.",
      "I would see this as an opportunity and if I had more money, invest into more growth assets such as Australian and international shares. ",
    ],
  },
  {
    route: "q8",
    icon: "🥧",
    key: "question8",
    title: "Asset allocation",
    question:
      "Question 8: Your investment preferences – Asset allocation. What level of investment risk are you comfortable with?",
    choices: [
      "No risk and I don’t want my capital to go down at all even if I get a 0% return on my money.",
      "I prefer low risk and am comfortable allocating a small portion (up to 40%) of my money to the share market aiming for better returns than the cash rate.",
      "I am comfortable with a medium level of risk and have my money allocated with similar amounts between the share market and cash and fixed interest/term deposits.",
      "I would prefer to have my money invested in a well diversified portfolio which includes more than 600% to Australian and international shares and property with the balance to cash and fixed interest/term deposits.",
      "I would prefer to have a minimum of  80% of my money invested in   Australian and international shares, possibly up to 100% if needed, aiming for higher returns even if there are significant ups and downs and wild swings like recent market events such as  COVID (2020), or the Global Financial Crises (2008)  because I won't need the money for a long time (10 years minimum).",
    ],
  },
  {
    route: "detection-matrix",
    key: "detectionMatrix",
    title: "Detection Matrix",
    icon: "🔲",
  },
  { route: "cards", key: "cards", title: "Risk Result", icon: "✅" },
];

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

const CONFIRMATION_LABELS = [
  {
    key: "confirmRiskProfileCheck1",
    label:
      "I understand that investment returns and capital values can rise and fall over time.",
  },
  {
    key: "confirmRiskProfileCheck2",
    label:
      "I understand that inflation, taxation, legislation, and market conditions can affect outcomes.",
  },
  {
    key: "confirmRiskProfileCheck3",
    label:
      "I understand that my selected risk profile should align with my goals, timeframe, and ability to accept volatility.",
  },
];

function buildParticipantDefaults() {
  return {
    question1: 1,
    question2: 1,
    question3: 1,
    question4: 1,
    question5: 1,
    question6: 1,
    question7: 1,
    question8: 1,
    riskGoal: "",
    riskDescription: "",
    happyWithResult: false,
    confirmRiskProfileCheck1: false,
    confirmRiskProfileCheck2: false,
    confirmRiskProfileCheck3: false,
    addNoteDescription: "",
  };
}

function getInitialFormValues(showPartner) {
  return {
    client: buildParticipantDefaults(),
    partner: buildParticipantDefaults(),
    joinedProfile: showPartner ? "No" : "Yes",
    currentQuestion: "question1",
  };
}

function getRiskGoalByScore(score) {
  return (
    RISK_GOALS.find(
      (goal) => score >= goal.range.lowest && score <= goal.range.highest,
    ) || RISK_GOALS[0]
  );
}

function getRiskGoalByValue(value) {
  return RISK_GOALS.find((goal) => goal.value === value) || null;
}

function calculateScore(participant) {
  return QUESTION_KEYS.reduce((total, key, index) => {
    const value = Number.isInteger(participant?.[key]) ? participant[key] : 0;
    return total + (index === 7 ? (value + 1) * 2 : value + 1);
  }, 0);
}

function syncComputedGoal(participant) {
  const score = calculateScore(participant);
  const computedGoal = getRiskGoalByScore(score);
  const selectedGoal =
    getRiskGoalByValue(participant?.riskGoal) || computedGoal;

  return {
    ...participant,
    riskGoal: selectedGoal?.value || "",
    riskDescription: selectedGoal?.description || "",
  };
}

function buildValuesFromApi(data, showPartner) {
  const defaults = getInitialFormValues(showPartner);
  const nextValues = {
    ...defaults,
    ...data,
    client: {
      ...defaults.client,
      ...(data?.client || {}),
    },
    partner: {
      ...defaults.partner,
      ...(data?.partner || {}),
    },
    joinedProfile:
      data?.joinedProfile === "Yes" || data?.joinedProfile === "No"
        ? data.joinedProfile
        : defaults.joinedProfile,
  };

  return {
    ...nextValues,
    client: syncComputedGoal(nextValues.client),
    partner: syncComputedGoal(nextValues.partner),
  };
}

function getQuestionChoice(stepKey, selectedIndex) {
  const step = QUESTION_STEPS.find((item) => item.key === stepKey);
  return step?.choices?.[selectedIndex] || "";
}

function buildConflictRows(values, includePartner) {
  const conflictRules = [
    {
      affectedSteps: ["question2", "question3"],
      relationship: "Q2 Desired Return ↔ Q3 Capital Risk",
      check: (profile) =>
        getQuestionChoice("question2", profile.question2) === "More than 10%" &&
        getQuestionChoice("question3", profile.question3)
          .toLowerCase()
          .includes("safety of my capital"),
      message:
        "The client expects a high return but also prioritises capital safety.",
      explanation:
        "Higher returns generally require accepting more volatility. Confirm whether preserving capital or pursuing growth is the real priority.",
    },
    {
      affectedSteps: ["question2", "question8"],
      relationship: "Q2 Desired Return ↔ Q8 Asset Allocation",
      check: (profile) =>
        getQuestionChoice("question2", profile.question2) === "More than 10%" &&
        ["no risk", "low risk"].some((text) =>
          getQuestionChoice("question8", profile.question8)
            .toLowerCase()
            .includes(text),
        ),
      message:
        "The client wants high returns but selected a conservative allocation.",
      explanation:
        "Cash and low-risk investments rarely deliver high returns. Confirm whether growth assets and their higher volatility are acceptable.",
    },
    {
      affectedSteps: ["question1", "question8"],
      relationship: "Q1 Timeframe ↔ Q8 Asset Allocation",
      check: (profile) =>
        getQuestionChoice("question1", profile.question1) ===
          "Less than one year" &&
        ["medium risk", "60%", "80%"].some((text) =>
          getQuestionChoice("question8", profile.question8)
            .toLowerCase()
            .includes(text),
        ),
      message:
        "The client needs short-term access but chose a higher-risk allocation.",
      explanation:
        "Money needed in the short term is generally better suited to lower-risk and more liquid assets.",
    },
    {
      affectedSteps: ["question3", "question7"],
      relationship: "Q3 Capital Risk ↔ Q7 Reaction to Volatility",
      check: (profile) =>
        ["comfortable", "high risk"].some((text) =>
          getQuestionChoice("question3", profile.question3)
            .toLowerCase()
            .includes(text),
        ) &&
        ["panic", "nervous"].some((text) =>
          getQuestionChoice("question7", profile.question7)
            .toLowerCase()
            .includes(text),
        ),
      message:
        "The client says they accept risk but also suggests they may panic during volatility.",
      explanation:
        "Confirm emotional tolerance for market falls. A lower-risk profile may be more suitable if likely reactions do not match stated tolerance.",
    },
    {
      affectedSteps: ["question6", "question8"],
      relationship: "Q6 Knowledge ↔ Q8 Asset Allocation",
      check: (profile) =>
        getQuestionChoice("question6", profile.question6)
          .toLowerCase()
          .includes("do not understand") &&
        getQuestionChoice("question8", profile.question8)
          .toLowerCase()
          .includes("80%"),
      message:
        "The client reports limited investment knowledge but selected a high-growth allocation.",
      explanation:
        "Confirm they understand what higher exposure to growth assets means, including short-term volatility and longer recovery periods.",
    },
  ];

  const subjects = [
    { key: "client", labelKey: "client" },
    ...(includePartner ? [{ key: "partner", labelKey: "partner" }] : []),
  ];

  return subjects.flatMap((subject) =>
    conflictRules
      .filter((rule) => rule.check(values?.[subject.key] || {}))
      .map((rule, index) => ({
        key: `${subject.key}-${index}`,
        profile: subject.labelKey,
        relationship: rule.relationship,
        inconsistency: rule.message,
        explanation: rule.explanation,
        affectedSteps: rule.affectedSteps || [],
      })),
  );
}

function ResultCard({
  title,
  participantKey,
  participantName,
  participant,
  onGoalChange,
  onTextChange,
  onCheckboxChange,
}) {
  const goalOptions = RISK_GOALS.map((goal) => ({
    label: goal.value,
    value: goal.value,
  }));

  const selectedGoal = getRiskGoalByValue(participant?.riskGoal);
  const chart = selectedGoal?.chart || [25, 25, 25, 25];
  const chartLabels = ["Cash", "Fixed Interest", "Shares", "Property"];

  return (
    <Card bordered style={{ borderRadius: 16, height: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h3 style={{ marginBottom: 4 }}>{participantName}</h3>
        <Tag color="green">{participant?.riskGoal || "Not Calculated"}</Tag>
      </div>

      <div style={{ marginBottom: 16 }}>
        {chart.map((value, index) => (
          <div
            key={`${participantKey}-chart-${index}`}
            style={{ marginBottom: 8 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              <span>{chartLabels[index]}</span>
              <span>{value}%</span>
            </div>
            <Progress percent={value} showInfo={false} strokeColor="#22c55e" />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Risk Goal</div>
        <Select
          style={{ width: "100%" }}
          options={goalOptions}
          value={participant?.riskGoal || undefined}
          onChange={(value) => onGoalChange(participantKey, value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Description</div>
        <Alert
          type="success"
          showIcon
          message={participant?.riskDescription || "No description available"}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Adviser Note</div>
        <TextArea
          rows={4}
          value={participant?.addNoteDescription || ""}
          onChange={(event) =>
            onTextChange(
              participantKey,
              "addNoteDescription",
              event.target.value,
            )
          }
          placeholder="Add note"
        />
      </div>

      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Checkbox
          checked={participant?.happyWithResult}
          onChange={(event) =>
            onCheckboxChange(
              participantKey,
              "happyWithResult",
              event.target.checked,
            )
          }
        >
          I confirm that I am happy with this risk result.
        </Checkbox>
        {CONFIRMATION_LABELS.map((item) => (
          <Checkbox
            key={`${participantKey}-${item.key}`}
            checked={participant?.[item.key]}
            onChange={(event) =>
              onCheckboxChange(participantKey, item.key, event.target.checked)
            }
          >
            {item.label}
          </Checkbox>
        ))}
      </Space>
    </Card>
  );
}

function ResultsStep({
  values,
  includePartner,
  clientName,
  partnerName,
  onGoalChange,
  onTextChange,
  onCheckboxChange,
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={includePartner ? 12 : 24}>
        <ResultCard
          title="Client"
          participantKey="client"
          participantName={clientName}
          participant={values.client}
          onGoalChange={onGoalChange}
          onTextChange={onTextChange}
          onCheckboxChange={onCheckboxChange}
        />
      </Col>
      {includePartner ? (
        <Col xs={24} lg={12}>
          <ResultCard
            title="Partner"
            participantKey="partner"
            participantName={partnerName}
            participant={values.partner}
            onGoalChange={onGoalChange}
            onTextChange={onTextChange}
            onCheckboxChange={onCheckboxChange}
          />
        </Col>
      ) : null}
    </Row>
  );
}

export default function RiskProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { get, post, patch } = useApi();

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName || "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName || "Partner";

  const [values, setValues] = useState(() => getInitialFormValues(showPartner));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordId, setRecordId] = useState("");

  useEffect(() => {
    const loadRiskProfile = async () => {
      const userId = localStorage.getItem("UserID");
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const result = await get(`/api/riskProfile/${userId}`);
        if (result && result._id) {
          setRecordId(result._id);
          setValues(buildValuesFromApi(result, showPartner));
          if (
            location.pathname === "/user/discovery/risk-profile" ||
            location.pathname === "/user/discovery/risk-profile/"
          ) {
            navigate("detection-matrix", { replace: true });
          }
          setDiscoveryData((prev) => ({
            ...(prev && typeof prev === "object" ? prev : {}),
            riskProfile: result,
            riskprofile: result,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch risk profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRiskProfile();
  }, [get, location.pathname, navigate, setDiscoveryData, showPartner]);

  useEffect(() => {
    if (!showPartner && values.joinedProfile !== "Yes") {
      setValues((prev) => ({ ...prev, joinedProfile: "Yes" }));
    }
  }, [showPartner, values.joinedProfile]);

  const includePartner = showPartner && values.joinedProfile === "No";
  const currentSubPath = location.pathname
    .replace("/user/discovery/risk-profile", "")
    .replace(/^\/+/, "");
  const currentStepIndex = QUESTION_STEPS.findIndex((step) => {
    if (step.route === "") return currentSubPath === "";
    return step.route === currentSubPath;
  });
  const normalizedStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const currentStep = QUESTION_STEPS[normalizedStepIndex];
  const progressPercent =
    QUESTION_STEPS.length > 1
      ? Math.round((normalizedStepIndex / (QUESTION_STEPS.length - 1)) * 100)
      : 0;

  const conflicts = useMemo(
    () => buildConflictRows(values, includePartner),
    [includePartner, values],
  );
  const lockedStepKeys = useMemo(
    () => [
      ...new Set(conflicts.flatMap((conflict) => conflict.affectedSteps || [])),
    ],
    [conflicts],
  );

  const handleJoinedProfileChange = (nextValue) => {
    setValues((prev) => ({
      ...prev,
      joinedProfile: nextValue,
    }));
  };

  const handleAnswerChange = (participantKey, questionKey, nextValue) => {
    setValues((prev) => ({
      ...prev,
      [participantKey]: {
        ...prev[participantKey],
        [questionKey]: nextValue,
      },
    }));
  };

  const handleGoalChange = (participantKey, goalValue) => {
    const goal = getRiskGoalByValue(goalValue);
    setValues((prev) => ({
      ...prev,
      [participantKey]: {
        ...prev[participantKey],
        riskGoal: goal?.value || "",
        riskDescription: goal?.description || "",
      },
    }));
  };

  const handleTextChange = (participantKey, fieldKey, nextValue) => {
    setValues((prev) => ({
      ...prev,
      [participantKey]: {
        ...prev[participantKey],
        [fieldKey]: nextValue,
      },
    }));
  };

  const handleCheckboxChange = (participantKey, fieldKey, checked) => {
    setValues((prev) => ({
      ...prev,
      [participantKey]: {
        ...prev[participantKey],
        [fieldKey]: checked,
      },
    }));
  };

  const validateQuestionStep = () => {
    if (!currentStep?.key?.startsWith("question")) {
      return true;
    }

    if (!Number.isInteger(values?.client?.[currentStep.key])) {
      message.warning(`Please answer ${currentStep.title} for ${clientName}.`);
      return false;
    }

    if (
      includePartner &&
      !Number.isInteger(values?.partner?.[currentStep.key])
    ) {
      message.warning(`Please answer ${currentStep.title} for ${partnerName}.`);
      return false;
    }

    return true;
  };

  const moveToStep = (stepIndex) => {
    const nextStep = QUESTION_STEPS[stepIndex];
    if (!nextStep) return;
    navigate(`/user/discovery/risk-profile/${nextStep.route || "."}`, {
      replace: false,
    });
  };

  const handleBack = () => {
    if (normalizedStepIndex > 0) {
      moveToStep(normalizedStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (!validateQuestionStep()) {
      return;
    }

    const nextIndex = normalizedStepIndex + 1;
    if (QUESTION_STEPS[nextIndex]?.route === "cards") {
      setValues((prev) => ({
        ...prev,
        client: syncComputedGoal(prev.client),
        partner: syncComputedGoal(prev.partner),
      }));
    }
    moveToStep(nextIndex);
  };

  const validateForSubmit = () => {
    const participants = [
      { key: "client", label: clientName, data: values.client },
      ...(includePartner
        ? [{ key: "partner", label: partnerName, data: values.partner }]
        : []),
    ];

    for (const participant of participants) {
      if (!participant.data?.happyWithResult) {
        message.warning(
          `${participant.label} must confirm they are happy with the result.`,
        );
        return false;
      }

      for (const item of CONFIRMATION_LABELS) {
        if (!participant.data?.[item.key]) {
          message.warning(
            `${participant.label} must complete all confirmations.`,
          );
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForSubmit()) {
      return;
    }

    const nextValues = {
      ...values,
      client: syncComputedGoal(values.client),
      partner: syncComputedGoal(values.partner),
    };

    const payload = {
      ...nextValues,
      _id: recordId || undefined,
      clientFK: localStorage.getItem("UserID") || undefined,
    };

    try {
      setSubmitting(true);
      const response = recordId
        ? await patch("/api/riskProfile/Update", payload)
        : await post("/api/riskProfile/Add", payload);

      const saved =
        response && typeof response === "object" ? response : payload;
      setValues(buildValuesFromApi(saved, showPartner));
      setRecordId(saved?._id || recordId);
      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        riskProfile: saved,
        riskprofile: saved,
      }));
      message.success("Risk Profile saved successfully.");
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save Risk Profile.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (normalizedStepIndex === 0) {
    return (
      <IntroStep
        joinedProfile={values.joinedProfile}
        onJoinedProfileChange={handleJoinedProfileChange}
        showPartner={showPartner}
        onClick={handleNext}
      />
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
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
                color: "#22c55e",
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
                marginBottom: 24,
                fontFamily: "Georgia, serif",
                fontWeight: 400,
                fontSize: 28,
                color: "#111827",
              }}
            >
              Risk Profile
            </Title>
          </div>
        </div>
        <RiskProfileSteps
          currentStep={currentStep}
          steps={QUESTION_STEPS}
          lockedStepKeys={lockedStepKeys}
        />
      </div>

      <Routes>
        {QUESTION_STEPS.filter((step) => step.key.startsWith("question")).map(
          (step) => (
            <Route
              key={step.key}
              path={step.route}
              element={
                <QuestionStep
                  step={step}
                  values={values}
                  includePartner={includePartner}
                  clientName={clientName}
                  partnerName={partnerName}
                  onAnswerChange={handleAnswerChange}
                />
              }
            />
          ),
        )}
        <Route
          path="detection-matrix"
          element={
            <DetectionMatrixStep
              conflicts={conflicts}
              clientName={clientName}
              partnerName={partnerName}
            />
          }
        />
        <Route
          path="cards"
          element={
            <ResultsStep
              values={values}
              includePartner={includePartner}
              clientName={clientName}
              partnerName={partnerName}
              onGoalChange={handleGoalChange}
              onTextChange={handleTextChange}
              onCheckboxChange={handleCheckboxChange}
            />
          }
        />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>

      <div
        style={{
          display: "flex",
          justifyContent:
            normalizedStepIndex === 0 ? "flex-end" : "space-between",
          marginTop: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {normalizedStepIndex > 0 ? (
          <Button
            onClick={handleBack}
            style={{
              padding: "20px 32px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "Arial",
              color: "rgb(55, 65, 81)",
              background: "rgb(255, 255, 255)",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            <Space>
              <FaArrowLeftLong />
              Back
            </Space>
          </Button>
        ) : null}

        {currentStep?.route === "cards" ? (
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            Save Risk Profile
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleNext}
            style={{
              padding: "20px 32px",
              borderRadius: 8,
              background: "rgb(34, 197, 94)",
              color: "rgb(255, 255, 255)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "rgba(34, 197, 94, 0.3) 0px 2px 8px",
              transition: "0.2s",
            }}
          >
            <Space>
              {normalizedStepIndex === 0 ? "Start" : "Next"}
              <FaArrowRightLong />
            </Space>
          </Button>
        )}
      </div>
    </div>
  );
}
