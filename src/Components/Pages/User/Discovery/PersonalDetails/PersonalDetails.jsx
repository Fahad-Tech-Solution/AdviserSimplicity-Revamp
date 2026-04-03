import {
  CalendarOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Avatar,
  Button,
  Card,
  Col,
  Row,
  Typography,
} from "antd";
import { useAtomValue } from "jotai";
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SelectedClient } from "../../../../../Store/authState";

const { Text, Title } = Typography;

const PRIMARY_GREEN = "#22c55e";
const MUTED = "#9ca3af";
const LINE = "#e5e7eb";

/** Steps shown on Personal Details (navigate under `/user/*` like the sidebar keys). */
const DISCOVERY_STEPS = [
  {
    key: "personal-details",
    label: "Personal Details",
    path: "/user/discovery/personal-details",
    icon: "👤",
  },
  {
    key: "income-expenses",
    label: "Income & Expenses",
    path: "/user/discovery/income-expenses",
    icon: "💲",
  },
  {
    key: "assets-debt",
    label: "Assets & Debt",
    path: "/user/discovery/assets-debt",
    icon: "🏡",
  },
  {
    key: "financial-investments",
    label: "Financial Investments",
    path: "/user/discovery/financial-investments",
    icon: "📈",
  },
  {
    key: "estate-planning",
    label: "Estate Planning",
    path: "/user/discovery/estate-planning",
    icon: "📋",
  },
  {
    key: "goals-objectives",
    label: "Goals & Objectives",
    path: "/user/discovery/goals-objectives",
    icon: "🎯",
  },
  {
    key: "add-section",
    label: "Add Section",
    path: "/user/discovery/add-section",
    icon: "＋",
  },
];

function pathMatchesStep(pathname, stepPath) {
  const p = pathname.replace(/\/$/, "");
  const s = stepPath.replace(/\/$/, "");
  return p === s || p.endsWith(s.replace(/^\/user/, ""));
}

function formatAuDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU");
}

function calcAge(dob) {
  if (!dob) return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

/** Display name similar to reference: title + stylised given / middle / last. */
function buildFormalName(person = {}, role = "client") {
  const isClient = role === "client";
  const title = isClient
    ? person.clientTitle || person.title || ""
    : person.partnerTitle || person.title || "";
  const given = isClient
    ? person.clientGivenName || person.firstName || ""
    : person.partnerGivenName || person.firstName || "";
  const middle = isClient
    ? person.clientMiddleName || person.middleName || ""
    : person.partnerMiddleName || person.middleName || "";
  const last = isClient
    ? person.clientLastName || person.lastName || ""
    : person.partnerLastName || person.lastName || "";

  const parts = [
    title,
    given && given.toUpperCase(),
    middle && middle.toLowerCase(),
    last && last.toUpperCase(),
  ].filter(Boolean);
  return parts.join(" ").trim() || "—";
}

function nicknameLine(person = {}, role = "client") {
  const pref =
    role === "client"
      ? person.clientPreferredName || person.preferredName
      : person.partnerPreferredName || person.preferredName;
  if (!pref) return null;
  return `(${String(pref).toLowerCase()})`;
}

function phoneLine(person = {}, role = "client") {
  const p =
    role === "client"
      ? person.clientWorkPhone || person.clientPhone || person.phone
      : person.partnerWorkPhone || person.partnerPhone || person.phone;
  return p?.trim() || "N/A";
}

function emailLine(person = {}, role = "client") {
  const e =
    role === "client"
      ? person.Email || person.email
      : person.partnerEmail || person.email;
  return e?.trim() || "—";
}

function addressLine(person = {}, role = "client") {
  const a =
    role === "client"
      ? person.clientHomeAddress || person.clientAddress || person.address
      : person.partnerHomeAddress || person.partnerAddress || person.address;
  return a?.trim() || "—";
}

function dobAgeLine(person = {}, role = "client") {
  const raw =
    role === "client"
      ? person.clientDateOfBirth || person.dateOfBirth || person.dob
      : person.partnerDateOfBirth || person.dateOfBirth || person.dob;
  const ageStr = role === "client" ? person.clientAge : person.partnerAge;
  const dateStr = formatAuDate(raw);
  const ageNum =
    ageStr != null && ageStr !== ""
      ? parseInt(String(ageStr), 10)
      : calcAge(raw);
  if (!dateStr && ageNum == null) return "—";
  if (dateStr && ageNum != null && !Number.isNaN(ageNum))
    return `${dateStr} (${ageNum})`;
  return dateStr || (ageNum != null ? `(${ageNum})` : "—");
}

function hasPartnerDetails(partner = {}) {
  return Boolean(
    partner.partnerPreferredName ||
    partner.partnerGivenName ||
    partner.partnerLastName ||
    partner.partnerEmail ||
    partner.partnerWorkPhone ||
    partner.partnerPhone,
  );
}

function ProfileCard({ person, role, householdName }) {
  const formal = buildFormalName(person, role);
  const nick = nicknameLine(person, role);

  if (role === "partner" && !hasPartnerDetails(person)) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          No partner details for this household.
        </Text>
      </Card>
    );
  }

  const initials = (() => {
    const last =
      (role === "client"
        ? person.clientLastName || person.lastName
        : person.partnerLastName || person.lastName) ||
      householdName ||
      "?";
    return String(last).slice(0, 2).toUpperCase();
  })();

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        height: "100%",
      }}
      styles={{ body: { padding: "28px 24px" } }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            display: "inline-block",
            position: "relative",
            marginBottom: 16,
          }}
        >
          <Avatar
            size={88}
            style={{
              background: "#f3f4f6",
              border: "3px solid rgba(34,197,94,.2)",
              color: "#fff",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            {role === "client" ? "👨" : "👩"}
          </Avatar>
          <div
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: PRIMARY_GREEN,
              border: "2px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
            title="Primary"
          >
            📷
          </div>
        </div>

        <div
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 500,
            fontSize: 16,
            color: "#111827",
            lineHeight: 1.35,
            textTransform: "none",
          }}
        >
          {formal}
        </div>
        {nick ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#6b7280",
              fontFamily: "Georgia, serif",
            }}
          >
            {nick}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
          fontSize: 12,
          color: "#374151",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📅</span>
          <span>{dobAgeLine(person, role)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📞</span>
          <span>{phoneLine(person, role)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📧</span>
          <span style={{ wordBreak: "break-word" }}>
            {emailLine(person, role)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>🏠</span>
          <span style={{ wordBreak: "break-word" }}>
            {addressLine(person, role)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function DiscoveryStepper({ pathname }) {
  const activeIndex = DISCOVERY_STEPS.findIndex((s) =>
    pathMatchesStep(pathname, s.path),
  );
  const current = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div style={{ position: "relative", marginBottom: 32, paddingTop: 8 }}>
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          top: 30,
          height: 2,
          background: LINE,
          zIndex: 0,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 1,
          gap: 4,
        }}
      >
        {DISCOVERY_STEPS.map((step, index) => {
          const active = index === current;
          return (
            <div
              key={step.key}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: active ? PRIMARY_GREEN : "#fff",
                  border: active
                    ? `2px solid ${PRIMARY_GREEN}`
                    : `2px solid ${LINE}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  lineHeight: 1,
                  boxShadow: active ? "0 2px 8px rgba(34,197,94,0.35)" : "none",
                }}
              >
                <span style={{ opacity: active ? 1 : 0.75 }}>{step.icon}</span>
              </div>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  lineHeight: 1.25,
                  textAlign: "center",
                  color: active ? PRIMARY_GREEN : MUTED,
                  fontWeight: active ? 600 : 400,
                  display: "block",
                  padding: "0 2px",
                }}
              >
                {step.label}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PersonalDetails() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selected = useAtomValue(SelectedClient);

  const client = selected?.client ?? {};
  const partner = selected?.partner ?? {};
  const householdLast = client.clientLastName || client.lastName || "Household";

  const hasSelection = Boolean(selected?._id);

  const nextPath = useMemo(() => {
    const idx = DISCOVERY_STEPS.findIndex((s) =>
      pathMatchesStep(pathname, s.path),
    );
    if (idx >= 0 && idx < DISCOVERY_STEPS.length - 1) {
      return DISCOVERY_STEPS[idx + 1].path;
    }
    return "/user/discovery/income-expenses";
  }, [pathname]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 0 32px" }}>
      <Text
        style={{
          display: "block",
          fontSize: 11,
          letterSpacing: 3,
          color: PRIMARY_GREEN,
          textTransform: "uppercase",
          marginBottom: 8,
          fontWeight: 400,
        }}
      >
        Discovery
      </Text>
      <Title
        level={2}
        style={{
          marginTop: 0,
          marginBottom: 28,
          fontFamily: "Georgia, serif",
          fontWeight: 500,
          fontSize: 28,
          color: "#111827",
        }}
      >
        Personal Details
      </Title>

      <DiscoveryStepper pathname={pathname} onNavigate={(to) => navigate(to)} />

      {!hasSelection ? (
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Text type="secondary">
            Select a client from <strong>My Clients</strong> (gear menu →
            Select) to view personal details here.
          </Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <ProfileCard
              person={client}
              role="client"
              householdName={householdLast}
            />
          </Col>
          <Col xs={24} md={12}>
            <ProfileCard
              person={partner}
              role="partner"
              householdName={householdLast}
            />
          </Col>
        </Row>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button
            onClick={() =>
              message.info("View — connect when document viewer is ready.")
            }
            style={{ borderRadius: 8, minWidth: 96 }}
          >
            View
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              message.info("Download — connect when export API is ready.")
            }
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            Download Doc
          </Button>
        </div>
        <Button
          type="primary"
          onClick={() => navigate(nextPath)}
          style={{
            borderRadius: 8,
            background: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            fontWeight: 600,
            minWidth: 120,
          }}
        >
          Next <RightOutlined />
        </Button>
      </div>
    </div>
  );
}

export default PersonalDetails;
