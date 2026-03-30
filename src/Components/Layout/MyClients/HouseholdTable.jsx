import { Avatar, Button } from "antd";
import DynamicDataTable from "../../Common/DynamicDataTable";

const PRIMARY_GREEN = "#36b446";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const HouseholdTable = () => {
  const data = [
    {
      key: "1",
      no: 1,
      household: "ANKRAVS",
      status: "ACTIVE",
      members: "PETER - Primary, 71\nRhonda - Partner, 71",
      contact: "0427202033",
      email: "ankrav11@bigpond.com",
      address: "10 Federation Court",
      lastUpdated: "01/01/2026",
    },
    {
      key: "1",
      no: 1,
      household: "ANKRAVS",
      status: "",
      members:
        "PETER - Primary, 71\nRhonda - Partner",
      contact: "0427202033",
      email: "ankrav11@bigpond.com",
      address: "10 Federation Court",
      lastUpdated: "01/01/2026",
    },
    // You can add more rows here following the same shape
  ];

  const columns = [
    {
      title: "No#",
      dataIndex: "no",
      key: "no",
      width: 70,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Household",
      dataIndex: "household",
      key: "household",
      width: 150,
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Avatar
            size={36}
            style={{
              background:
                "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {getInitials(record.household)}
          </Avatar>

          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {record.household}
            </div>
            {record.status && (
              <div
                style={{
                  fontSize: 11,
                  color: PRIMARY_GREEN,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {record.status}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Members",
      dataIndex: "members",
      key: "members",
      width: 150,
      render: (text) => <div style={{ whiteSpace: "pre-line" }}>{text}</div>,
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 140,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: () => (
        <Button
          type="default"
          style={{
            padding: "0 10px",
            borderRadius: 5,
            borderColor: PRIMARY_GREEN,
            color: PRIMARY_GREEN,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          size="small"
        >
          <span>View</span>
          <span>→</span>
        </Button>
      ),
    },
  ];

  return (
    <DynamicDataTable
      columns={columns}
      data={data}
      title={`Showing ${data.length} households`}
      total={16}
      pageSize={10}
      className="household-table"
      bordered
      size="small"
    />
  );
};

export default HouseholdTable;
