import { useMemo, useState } from "react";
import { Button, Dropdown, Input, Space, Tag, Tooltip, Typography } from "antd";
import {
  InfoCircleFilled,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { SlReload } from "react-icons/sl";

const { Title, Text } = Typography;

const prospectData = [
  {
    key: "1",
    number: 1,
    household: "Hartley",
    clients: [
      { name: "Marcus", role: "Primary" },
      { name: "Susan", role: "Partner" },
    ],
    ages: [52, 49],
    contacts: ["0412 884 231", "0418 223 567"],
    emails: ["marcus.hartley@gmail.com", "susan.hartley@outlook.com"],
    addresses: [
      "14 Riverside Drive, Templestowe VIC 3106",
      "14 Riverside Drive, Templestowe VIC 3106",
    ],
    lastUpdated: "13/03/2026",
    status: "Pending",
    category: "new",
  },
];

const tabs = [
  { key: "new", label: "New Prospects" },
  { key: "successful", label: "Successful" },
  { key: "unsuccessful", label: "Unsuccessful" },
  { key: "all", label: "All" },
];

const stackText = (lines, valueStyle = {}) => (
  <div style={{ display: "grid", gap: 4 }}>
    {lines.map((line, index) => (
      <div key={`${line}-${index}`} style={valueStyle}>
        {line}
      </div>
    ))}
  </div>
);

export default function CDFProspects() {
  const [activeTab, setActiveTab] = useState("new");
  const [searchText, setSearchText] = useState("");

  const filteredData = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return prospectData.filter((item) => {
      const matchesTab =
        activeTab === "all" ? true : item.category === activeTab;

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.household,
        ...item.clients.map((client) => client.name),
        ...item.contacts,
        ...item.emails,
        ...item.addresses,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeTab, searchText]);

  const columns = [
    {
      title: <div style={{ textAlign: "center", width: "100%" }}>#</div>,
      dataIndex: "number",
      key: "number",
      width: 40,
      onCell: (record) => ({
        style: {
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          color: "#7ea897",
        },
      }),
    },
    {
      title: "HouseHold",
      dataIndex: "household",
      key: "household",
      width: 100,
      render: (value) => (
        <Space size={8}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{value}</span>
          <InfoCircleFilled style={{ color: "#374151", fontSize: 14 }} />
        </Space>
      ),
    },
    {
      title: "Clients",
      dataIndex: "clients",
      key: "clients",
      width: 120,
      render: (clients) => {
        return (
          <div>
            {clients.map((client) => (
              <div key={client.name} style={{ fontSize: 12, fontWeight: 700 }}>
                {client.name}{" "}
                <span
                  style={{
                    fontSize: 11,
                    color: "rgb(156, 163, 175)",
                    fontWeight: 400,
                  }}
                >
                  ({client.role})
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Age",
      dataIndex: "ages",
      key: "ages",
      width: 50,
      render: (ages) => stackText(ages),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Contact",
      dataIndex: "contacts",
      key: "contacts",
      width: 90,
      render: (contacts) => stackText(contacts),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Email",
      dataIndex: "emails",
      key: "emails",
      width: 160,
      ellipsis: true,
      render: (emails) =>
        stackText(emails, {
          lineBreak: "anywhere",
          color: "#4b5563",
        }),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Address",
      dataIndex: "addresses",
      key: "addresses",
      width: 230,
      ellipsis: true,
      render: (addresses) =>
        stackText(addresses, {
          lineBreak: "anywhere",
          color: "#4b5563",
        }),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Last updated at",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 120,
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => (
        <Tag
          bordered
          style={{
            borderRadius: 5,
            paddingInline: 12,
            paddingBlock: 3,
            background: "#fffaf0",
            borderColor: "#f7d587",
            color: "#b7791f",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#f4b400", marginRight: 6 }}>•</span>
          {status}
        </Tag>
      ),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Operation",
      key: "operation",
      width: 90,
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "📄 View" },
              { key: "successful", label: "✅ Successful" },
              { key: "unsuccessful", label: "❌ Unsuccessful" },
            ],
            onClick: ({ key }) => {},
          }}
        >
          <Tooltip title="Settings">
            <Button
              type="text"
              shape="circle"
              icon={
                <SettingOutlined style={{ color: "#374151", fontSize: 18 }} />
              }
            />
          </Tooltip>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          marginTop: 18,
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
              marginBottom: 6,
              fontWeight: 400,
            }}
          >
            Admin / CDF Prospects
          </Text>
          <Title
            style={{
              margin: 0,
              fontFamily: "Georgia,serif",
              fontWeight: 500,
              fontSize: 28,
            }}
          >
            Cdf Prospects
          </Title>
        </div>
        <div className="">
          <Button
            type="primary"
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
              boxShadow: "0 8px 20px rgba(34,197,94,0.18)",
            }}
          >
            + New Prospect
          </Button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #ebedf0",
          boxShadow: "0 10px 35px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "12px 20px 2px",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "0 0 12px",
                    cursor: "pointer",
                    color: isActive ? "#22c55e" : "#6b7280",
                    fontWeight: isActive ? 700 : 500,
                    borderBottom: isActive
                      ? "3px solid #22c55e"
                      : "3px solid transparent",
                    fontSize: 14,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Space size={10}>
            <Input
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              style={{ width: 210, borderRadius: 7 }}
            />
            <Button icon={<SlReload />} onClick={() => setSearchText("")} />
          </Space>
        </div>

        <DynamicDataTable
          columns={columns}
          data={filteredData}
          total={filteredData.length}
          pageSize={12}
          showCount={false}
          bordered={false}
          size="small"
          tableStyle={{ borderRadius: 0, overflow: "hidden" }}
          tableProps={{
            pagination: false,
          }}
        />
      </div>
    </div>
  );
}
