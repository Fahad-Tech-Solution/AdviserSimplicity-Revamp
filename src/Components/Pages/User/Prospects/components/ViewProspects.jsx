import { Col, Row, Typography } from "antd";

const { Text, Title } = Typography;

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function SectionTitle({ children }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 12 }}>
      <Title
        level={4}
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
        }}
      >
        {children}
      </Title>
      <div
        style={{
          marginTop: 10,
          borderBottom: "1px solid #e5e7eb",
        }}
      />
    </div>
  );
}

function DetailCell({ label, value, valueColor }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr",
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: "1px solid #eef2f7",
        minHeight: 42,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 400,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: valueColor || "#111827",
          fontWeight: 700,
        }}
      >
        {getDisplayValue(value)}
      </Text>
    </div>
  );
}

function DetailGrid({ rows }) {
  return (
    <div
      style={{
        border: "1px solid #dbe3ec",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {rows.map((row, index) => (
        <Row key={index} gutter={0}>
          <Col xs={24} md={12} style={{ borderRight: "1px solid #eef2f7" }}>
            <DetailCell
              label={row.left.label}
              value={row.left.value}
              valueColor={row.left.valueColor}
            />
          </Col>
          <Col xs={24} md={12}>
            <DetailCell
              label={row.right.label}
              value={row.right.value}
              valueColor={row.right.valueColor}
            />
          </Col>
        </Row>
      ))}
    </div>
  );
}

export default function ViewProspects({ record }) {
  if (!record) return null;

  const raw = record.raw || {};
  const client = raw.client || {};
  const partner = raw.partner || {};

  const personalRows = [
    {
      left: { label: "First Name", value: client.firstName },
      right: { label: "Middle Name", value: client.middleName },
    },
    {
      left: { label: "Last Name", value: client.lastName || record.household },
      right: {
        label: "Preferred Name",
        value:
          client.preferredName ||
          record.clients?.find((item) => item.role === "Primary")?.name,
      },
    },
    {
      left: { label: "Date of Birth", value: client.dateOfBirth || client.dob },
      right: {
        label: "Email",
        value: client.email || record.emails?.[0],
      },
    },
    {
      left: {
        label: "Phone Number",
        value: client.phoneNumber || client.phone || record.contacts?.[0],
      },
      right: {
        label: "Relationship Status",
        value: client.relationshipStatus,
      },
    },
  ];

  const employmentRows = [
    {
      left: {
        label: "Employment Income",
        value:
          client.employmentIncome ||
          client.income ||
          raw.employmentIncome ||
          "$0",
        valueColor: "#22c55e",
      },
      right: {
        label: "Business Income",
        value: client.businessIncome || raw.businessIncome || "$0",
        valueColor: "#9ca3af",
      },
    },
    {
      left: {
        label: "Centrelink Payments",
        value: client.centrelinkPayments || raw.centrelinkPayments || "$0",
        valueColor: "#22c55e",
      },
      right: {
        label: "Super Payments",
        value: client.superPayments || raw.superPayments || "$0",
        valueColor: "#9ca3af",
      },
    },
  ];

  return (
    <div style={{ paddingTop: 4 }}>
      <Title
        level={3}
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Personal Details
      </Title>

      <SectionTitle>Client Data</SectionTitle>
      <DetailGrid rows={personalRows} />

      <SectionTitle>Client Employment & Income</SectionTitle>
      <DetailGrid rows={employmentRows} />
    </div>
  );
}
