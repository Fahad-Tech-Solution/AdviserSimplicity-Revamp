import { useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Dropdown,
  Input,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  InfoCircleFilled,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import AppModal from "../../../Common/AppModal";
import ViewProspects from "./components/ViewProspects";
import { SlReload } from "react-icons/sl";
import { CDFProspectsData } from "../../../../Store/authState";
import { useAtom } from "jotai";
import useApi from "../../../../hooks/useApi";
import { normalizeCDFProspect } from "../../../../hooks/useUserDashboardData";

const { Title, Text } = Typography;

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
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [prospects, setProspects] = useAtom(CDFProspectsData);
  const [activeTab, setActiveTab] = useState("new");
  const [searchText, setSearchText] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const filteredData = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return prospects.filter((item) => {
      const normalizedStatus = item.status?.toLowerCase();
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "new"
            ? normalizedStatus === "pending"
            : normalizedStatus === activeTab;

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
  }, [prospects, activeTab, searchText]);

  const statusChange = async (status, row) => {
    try {
      const payload = {
        ...(row.raw || {}),
        status,
      };

      const response = await api.patch("/api/CDF/Update", payload);

      setProspects((prev) =>
        prev.map((item) =>
          item.key === row.key
            ? {
                ...item,
                status:
                  status.charAt(0).toUpperCase() +
                  status.slice(1).toLowerCase(),
                raw: {
                  ...(item.raw || {}),
                  ...(response || {}),
                  status,
                },
              }
            : item,
        ),
      );

      const notifications = {
        successful: {
          head: "Client marked as Successful",
          note: "You can now find this client in Adviser Simplicity's Discovery Form.",
        },
        unsuccessful: {
          head: "Client marked as Unsuccessful",
          note: "The client is now marked as unsuccessful until they submit their data again.",
        },
      };

      const { head, note } = notifications[status] || {
        head: "Client Status Updated",
        note: "The status of the client has been updated successfully.",
      };

      message.success(`${head}. ${note}`);
    } catch (error) {
      console.error("CDF status update error", error);
      message.error("Something went wrong. Please try later.");
    }
  };

  const reloadProspects = async () => {
    try {
      setSearchText("");
      setActiveTab("new");

      const response = await api.get("/api/CDF/");
      const normalizedCDFData = Array.isArray(response)
        ? response.map(normalizeCDFProspect)
        : [];

      setProspects(normalizedCDFData);
      message.success("Prospects refreshed successfully.");
    } catch (error) {
      console.error("CDF prospects refresh error", error);
      message.error("Failed to refresh prospects. Please try later.");
    }
  };

  const handleProspectAction = (actionKey, record) => {
    if (actionKey === "view") {
      setSelectedProspect(record);
      setIsViewOpen(true);
      return;
    }

    if (record.status?.toLowerCase() !== "pending") {
      return;
    }

    void statusChange(actionKey, record);
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center", width: "100%" }}>#</div>,
      dataIndex: "number",
      key: "number",
      width: 50,
      onCell: (record) => ({
        style: {
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          color: "#7ea897",
        },
      }),
      render: (_, __, index) => index + 1,
    },
    {
      title: "HouseHold",
      dataIndex: "household",
      key: "household",
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
      render: (ages) => stackText(ages),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Contact",
      dataIndex: "contacts",
      key: "contacts",
      render: (contacts) => stackText(contacts),
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Email",
      dataIndex: "emails",
      key: "emails",

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
      title: "updated at",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          bordered
          style={{
            borderRadius: 5,
            paddingInline: 12,
            paddingBlock: 3,
            background:
              status === "Successful"
                ? "#f0fdf4"
                : status === "Unsuccessful"
                  ? "#fef2f2"
                  : "#fffaf0",
            borderColor:
              status === "Successful"
                ? "#86efac"
                : status === "Unsuccessful"
                  ? "#fca5a5"
                  : "#f7d587",
            color:
              status === "Successful"
                ? "#166534"
                : status === "Unsuccessful"
                  ? "#b91c1c"
                  : "#b7791f",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color:
                status === "Successful"
                  ? "#22c55e"
                  : status === "Unsuccessful"
                    ? "#ef4444"
                    : "#f4b400",
              marginRight: 6,
            }}
          >
            •
          </span>
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
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "📄 View" },
              {
                key: "successful",
                label: "✅ Successful",
                disabled: record.status?.toLowerCase() !== "pending",
              },
              {
                key: "unsuccessful",
                label: "❌ Unsuccessful",
                disabled: record.status?.toLowerCase() !== "pending",
              },
            ],
            onClick: ({ key }) => handleProspectAction(key, record),
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
      <AppModal
        width={760}
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedProspect(null);
        }}
        title="CDF View Details"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              color="default"
              variant="filled"
              onClick={() => {
                setIsViewOpen(false);
                setSelectedProspect(null);
              }}
            >
              Close
            </Button>
          </div>
        }
      >
        <ViewProspects record={selectedProspect} />
      </AppModal>

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
          overflow: "hidden",
          maxHeight: "calc(100vh - 150px)",
          overflowY: "auto",
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
            <Button
              icon={<SlReload />}
              onClick={() => void reloadProspects()}
            />
          </Space>
        </div>

        <DynamicDataTable
          columns={columns}
          data={filteredData}
          total={filteredData.length}
          pageSize={12}
          showCount={false}
          bordered={true}
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
