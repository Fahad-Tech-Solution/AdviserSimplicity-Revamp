import { useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Col,
  Input,
  Row,
  Space,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { BiSearch } from "react-icons/bi";
import DynamicDataTable from "../../../Common/DynamicDataTable";

const { Dragger } = Upload;
const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };
const TYPE_STYLES = {
  Bank: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
  "Credit Union": {
    background: "#f3e8ff",
    color: "#7c3aed",
    border: "1px solid #e9d5ff",
  },
  Platform: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  Bond: {
    background: "#fff7ed",
    color: "#ea580c",
    border: "1px solid #fed7aa",
  },
};

function TypeBadge({ type, fallback = "Bank" }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES[fallback] || TYPE_STYLES.Bank;
  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "20px",
      }}
    >
      {type || fallback}
    </span>
  );
}

function getUnderlyingInvestments(row = {}) {
  let investments = row.arrayOfOffers;

  return Array.isArray(investments) ? investments : [];
}

function getInvestmentName(item = {}) {
  return (
    item.investmentName ?? item.name ?? item.platformName ?? item.fundName ?? ""
  );
}

function getInvestmentCode(item = {}) {
  return item.code ?? item.investmentCode ?? item.fundCode ?? item.apir ?? "";
}

function CsvUploadZone({ onFileSelect }) {
  const handleBeforeUpload = (file) => {
    onFileSelect?.(file);
    return Upload.LIST_IGNORE;
  };

  return (
    <Dragger
      accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
      multiple={false}
      showUploadList={false}
      beforeUpload={handleBeforeUpload}
      className="investment-sections-upload"
      style={{
        flex: 1,
        minHeight: 88,
        borderRadius: 10,
        background: "#f9fafb",
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            color: "#7c3aed",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          📄
        </span>
        <div style={{ textAlign: "left" }}>
          <Text
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 700,
              color: "#1e3a5f",
              lineHeight: 1.35,
            }}
          >
            + Add From CSV / Excel File
          </Text>
          <Text
            style={{
              display: "block",
              marginTop: 2,
              fontSize: 12,
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            Drag and drop or click to browse
          </Text>
        </div>
      </div>
    </Dragger>
  );
}

export default function InvestmentSectionsPage() {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { row, config } = location.state ?? {};
  const [searchText, setSearchText] = useState("");

  const investments = useMemo(() => getUnderlyingInvestments(row), [row]);

  const filteredInvestments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return investments;

    return investments.filter((item) => {
      const name = getInvestmentName(item).toLowerCase();
      const code = getInvestmentCode(item).toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [investments, searchText]);

  const tableData = useMemo(
    () =>
      filteredInvestments.map((item, index) => ({
        ...item,
        key: item._id ?? item.id ?? String(index),
        index: index + 1,
        displayName: getInvestmentName(item),
        displayCode: getInvestmentCode(item),
      })),
    [filteredInvestments],
  );

  const columns = useMemo(
    () => [
      {
        title: "#",
        dataIndex: "index",
        key: "index",
        width: 48,
        align: "center",
        onCell: () => ({
          style: { color: "#9ca3af", fontWeight: 700, fontSize: 12 },
        }),
      },
      {
        title: "INVESTMENT NAME",
        dataIndex: "displayName",
        key: "displayName",
        render: (name) => (
          <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
            {name || "—"}
          </span>
        ),
      },
      {
        title: "CODE",
        dataIndex: "displayCode",
        key: "displayCode",
        width: 160,
        render: (code) => (
          <span
            style={{
              color: "#6b7280",
              fontSize: 13,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {code || "—"}
          </span>
        ),
      },
      {
        title: "ACTIONS",
        key: "actions",
        width: 90,
        align: "center",
        render: (_, record) => (
          <Space size={4}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: "#6b7280", fontSize: 14 }} />
                }
                onClick={() =>
                  message.info(`Edit ${record.displayName} — coming soon`)
                }
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={
                  <DeleteOutlined style={{ color: "#d1d5db", fontSize: 14 }} />
                }
                onClick={() =>
                  message.info(`Delete ${record.displayName} — coming soon`)
                }
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [message],
  );

  return (
    <div
      style={{
        padding: "32px 28px 48px",
      }}
    >
      <Text
        role="button"
        onClick={() => navigate(-1)}
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "#22c55e",
          marginBottom: 8,
          letterSpacing: "0.3px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        ← Back to Catalogs
      </Text>
      <Text
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "#22c55e",
          marginBottom: 8,
          fontFamily: "Arial, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "2.5px",
        }}
      >
        {config?.deleteSuccessLabel ?? "Platform"}
      </Text>
      <Title
        level={4}
        style={{
          ...headingStyle,
          margin: 0,
          fontWeight: 400,
          fontSize: "28px",
          color: "#111827",
          lineHeight: "1.2",
        }}
      >
        {config?.InvestmentSectionHeading ?? row?.displayName ?? "Investment"}
      </Title>
      <Text
        style={{
          display: "block",
          marginTop: 8,
          color: "#6b7280",
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "20px",
        }}
      >
        <TypeBadge type={row?.type} fallback={config?.defaultType} />{" "}
        {investments.length} underlying investment
        {investments.length === 1 ? "" : "s"}
      </Text>

      <style>
        {`
          .investment-sections-upload.ant-upload-wrapper .ant-upload-drag {
            border: 1.5px dashed #d1d5db;
            background: #f9fafb;
            transition: all 0.15s ease;
          }
          .investment-sections-upload.ant-upload-wrapper .ant-upload-drag:hover,
          .investment-sections-upload.ant-upload-wrapper .ant-upload-drag.ant-upload-drag-hover {
            border-color: ${PRIMARY_GREEN};
            background: #f0fdf4;
          }
          .investment-sections-upload.ant-upload-wrapper .ant-upload-drag .ant-upload-btn {
            padding: 0;
          }
        `}
      </style>

      <Row gutter={16} >
        <Col md={12} xs={24} style={{ marginTop: 28 }}>
          <CsvUploadZone
            onFileSelect={(file) => {
              message.info(`Import from "${file.name}" — coming soon`);
            }}
          />
        </Col>
        <Col md={12} xs={24} style={{ marginTop: 28 }}>
          <button
            type="button"
            onClick={() =>
              message.info("Add investment manually — coming soon")
            }
            style={{
              flex: 1,
              minHeight: 88,
              minWidth: 220,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 24px",
              borderRadius: 10,
              border: "none",
              background: PRIMARY_GREEN,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(34, 197, 94, 0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#16a34a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = PRIMARY_GREEN;
            }}
          >
            + Add Investment Manually
          </button>
        </Col>
      </Row>

      <div
        style={{
          marginTop: 28,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #ebedf0",
          boxShadow: "0 10px 35px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 20px 12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "2px",
                color: PRIMARY_GREEN,
                textTransform: "uppercase",
              }}
            >
              Underlying Investments
            </Text>
            <span style={{ color: "#d1d5db" }}>|</span>
            <Text style={{ fontSize: 13, color: "#9ca3af" }}>
              {filteredInvestments.length} item
              {filteredInvestments.length === 1 ? "" : "s"}
            </Text>
          </div>

          <Input
            placeholder="Filter investments..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 240,
              height: 35,
              borderRadius: 8,
              fontSize: 13,
            }}
            prefix={<BiSearch style={{ color: "#9ca3af" }} />}
          />
        </div>

        <div style={{ padding: "0 12px 12px" }}>
          <DynamicDataTable
            columns={columns}
            data={tableData}
            total={tableData.length}
            pageSize={10}
            showCount={false}
            bordered
            size="small"
            tableStyle={{ borderRadius: 8, overflow: "hidden" }}
            pagination={{
              showTotal: (total, range) =>
                `Showing ${range[0]}–${range[1]} of ${total} investments`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
