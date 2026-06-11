import { Button, Col, Row, Typography } from "antd";
import ActiveDot from "../../../Common/ActiveDot";
import AppModal from "../../../Common/AppModal";
import { capitalizeWords } from "../../../../hooks/helpers";

const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#9ca3af",
  marginBottom: 6,
};

const valueStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

function formatMemberSince(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function getRoleLabel(adviser = {}) {
  const role = adviser.roleID ?? adviser.role;
  if (typeof role === "object") {
    return role.roleName ?? role.name ?? "Adviser";
  }
  return adviser.roleName ?? role ?? "Adviser";
}

function getSubscriptionDetails(adviser = {}) {
  const sub = adviser.subscription ?? adviser.subscriptionDetails ?? {};

  const paymentMethod = "Credit Card/Debit Card";

  const daysLeft = (() => {
    const start = sub.createdAt ? new Date(sub.createdAt) : null;
    const end = sub.subscriptionPeriodEnd ? new Date(sub.subscriptionPeriodEnd) : null;
    if (!start || !end || isNaN(start) || isNaN(end)) return "—";
    const diff = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return diff;
  })();
    

  return {
    plan: sub.productName ?? adviser.plan ?? adviser.planName ?? "—",
    status: adviser.isActive === false ? "Disabled" : "Active",
    daysLeft,
    nextRenewal: sub.subscriptionPeriodEnd ? new Date(sub.subscriptionPeriodEnd).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) : "—",
    paymentMethod,
  };
}

function ViewSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: PRIMARY_GREEN,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Text>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      </div>
      {children}
    </div>
  );
}

function DetailField({ label, value, children, md = 8 }) {
  return (
    <Col xs={24} md={md}>
      <Text style={labelStyle}>{label}</Text>
      {children ?? <Text style={valueStyle}>{formatDisplayValue(value)}</Text>}
    </Col>
  );
}

function PlanAccessBadge({ label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 999,
        background: "#f0fdf4",
        border: "1px solid rgb(187, 247, 208)",
        color: "rgb(22, 163, 74)",
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      <ActiveDot size={6} marginRight={0} />
      {label}
    </span>
  );
}

export default function ViewAdviserModal({ open, onClose, adviser, onEdit }) {
  if (!adviser) return null;

  const subscription = getSubscriptionDetails(adviser);
  const adviserName = capitalizeWords(
    `${adviser.firstName || ""} ${adviser.lastName || ""}`.trim(),
  );

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title=""
      width={720}
      destroyOnClose
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
          }}
        >
          {onEdit ? (
            <Button
              onClick={() => onEdit(adviser)}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Edit adviser
            </Button>
          ) : null}
          <Button
            type="primary"
            onClick={onClose}
            style={{
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            Close
          </Button>
        </div>
      }
    >
      <div style={{ paddingTop: 4, paddingBottom: 8 }}>
        <Text
          style={{
            display: "block",
            color: PRIMARY_GREEN,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "2.5px",
            marginBottom: 6,
          }}
        >
          VIEW
        </Text>

        <Title
          level={3}
          style={{
            ...headingStyle,
            margin: 0,
            fontWeight: 500,
            fontSize: 26,
          }}
        >
          View Adviser
        </Title>
        <Text
          style={{
            display: "block",
            marginTop: 6,
            marginBottom: 20,
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {adviserName
            ? `Account overview for ${adviserName}.`
            : "Account overview and subscription details."}
        </Text>

        <div
          style={{
            height: 1,
            background: "#e5e7eb",
            marginBottom: 24,
          }}
        />

        <ViewSection title="Personal details">
          <Row gutter={[24, 20]}>
            <DetailField label="First Name" value={adviser.firstName} />
            <DetailField label="Last Name" value={adviser.lastName} />
            <DetailField label="Email" value={adviser.email} />
            <DetailField label="Phone Number" value={adviser.phoneNumber} />
            <DetailField label="User ID" value={adviser.referralID} />
            <DetailField
              label="Member Since"
              value={formatMemberSince(adviser.createdAt)}
            />
          </Row>
        </ViewSection>

        <ViewSection title="Business details">
          <Row gutter={[24, 20]}>
            <DetailField label="Company Name" value={adviser.companyName} />
            <DetailField label="Licensee Name" value={adviser.LicenseeName} />
            <DetailField label="Role" value={getRoleLabel(adviser)} />
            <DetailField
              label="Company Address"
              value={adviser.companyAddress}
              md={16}
            />
            <DetailField label="State" value={adviser.state} md={8} />
            <DetailField label="AFS Name" value={adviser.AFSName} />
            <DetailField label="AFS Number" value={adviser.AFSNumber} />
            <DetailField label="ABN" value={adviser.ABN} />
            {adviser.ASIC ? (
              <DetailField label="ASIC" value={adviser.ASIC} />
            ) : null}
          </Row>
        </ViewSection>

        <ViewSection title="Subscription">
          <Row gutter={[24, 20]}>
            <DetailField label="Plan">
              <PlanAccessBadge label={subscription?.plan || ""} />
            </DetailField>
            <DetailField label="Status" value={subscription.status} />
            <DetailField label="Days Left">
              <Text
                style={{
                  ...valueStyle,
                  fontStyle:
                    subscription.daysLeft === "Unlimited" ? "italic" : "normal",
                  color:
                    subscription.daysLeft === "Unlimited"
                      ? "#6b7280"
                      : valueStyle.color,
                }}
              >
                {formatDisplayValue(subscription.daysLeft)}
              </Text>
            </DetailField>
            <DetailField
              label="Next Renewal"
              value={subscription.nextRenewal}
            />
            <DetailField
              label="Payment Method"
              value={subscription.paymentMethod}
            />
          </Row>
        </ViewSection>
      </div>
    </AppModal>
  );
}
