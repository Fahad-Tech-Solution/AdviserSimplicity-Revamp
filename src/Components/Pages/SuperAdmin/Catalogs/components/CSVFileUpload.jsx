import { useState } from "react";
import { App as AntdApp, Button, Tag, Typography, Upload } from "antd";
import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import useApi from "../../../../../hooks/useApi";
import { getCatalogItemName } from "../catalogHelpers";

const { Dragger } = Upload;
const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

const ACCEPTED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function isValidUploadFile(file) {
  const name = String(file?.name ?? "").toLowerCase();
  return (
    ACCEPTED_TYPES.includes(file?.type) ||
    name.endsWith(".csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  );
}

function downloadCsvTemplate() {
  const headers = "investmentName,investmentCode\n";
  const sample = "Balanced,AUS0100AU\n";
  const blob = new Blob([headers + sample], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "investment-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function CSVFileUpload({ data = {}, onClose, onSuccess }) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const platform = data?.row ?? {};
  const platformFK = platform._id ?? platform.id;
  const platformName =
    data?.platformName ??
    data?.config?.InvestmentSectionHeading ??
    getCatalogItemName(platform) ??
    "this platform";

  const handleBeforeUpload = (file) => {
    if (!isValidUploadFile(file)) {
      message.error("You can only upload CSV or Excel files.");
      return Upload.LIST_IGNORE;
    }

    setFileList([file]);
    return false;
  };

  const handleRemove = () => {
    setFileList([]);
  };

  const handleImport = async () => {
    if (!fileList.length) {
      message.warning("Please select a file to import.");
      return;
    }

    if (!platformFK) {
      message.error("Platform reference is missing. Go back and try again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileList[0]);
    formData.append("platformFK", platformFK);

    setSubmitting(true);
    try {
      const res = await api.post("/investmentCSV/upload", formData);
      message.success("Investments imported successfully.");
      setFileList([]);
      onSuccess?.(res);
      onClose?.();
    } catch (error) {
      message.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Failed to import investments.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="csv-file-upload-modal" style={{ padding: "4px 0 8px" }}>
      <style>
        {`
          .csv-file-upload-modal .ant-upload-wrapper .ant-upload-drag {
            border: 1.5px dashed #d1d5db;
            border-radius: 12px;
            background: #fafafa;
            transition: all 0.15s ease;
          }
          .csv-file-upload-modal .ant-upload-wrapper .ant-upload-drag:hover,
          .csv-file-upload-modal .ant-upload-wrapper .ant-upload-drag.ant-upload-drag-hover {
            border-color: ${PRIMARY_GREEN};
            background: #f0fdf4;
          }
        `}
      </style>

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
        IMPORT
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
        Import Investments
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
        Upload a CSV or Excel file to add multiple investments to{" "}
        <strong style={{ color: "#374151" }}>{platformName}</strong> at once.
      </Text>

      <div
        style={{
          height: 1,
          background: "#e5e7eb",
          marginBottom: 20,
        }}
      />

      <Dragger
        accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        multiple={false}
        fileList={fileList}
        beforeUpload={handleBeforeUpload}
        onRemove={handleRemove}
        listType="text"
        disabled={submitting}
      >
        <p
          className="ant-upload-drag-icon"
          style={{ fontSize: 40, color: PRIMARY_GREEN }}
        >
          📥
        </p>
        <p
          className="ant-upload-text"
          style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}
        >
          Click or drag file to this area to upload
        </p>
        <p
          className="ant-upload-hint"
          style={{ color: "#9ca3af", fontSize: 12 }}
        >
          Support for single or bulk upload of investment records.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          {[".csv", ".xlsx", ".xls"].map((ext) => (
            <Tag
              key={ext}
              style={{
                margin: 0,
                borderRadius: 6,
                color: "#6b7280",
                background: "#fff",
                border: "1px solid #e5e7eb",
              }}
            >
              {ext}
            </Tag>
          ))}
        </div>
      </Dragger>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Text style={{ fontSize: 12, color: "#9ca3af" }}>
          Need a starting template?{" "}
        </Text>
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={downloadCsvTemplate}
          style={{
            padding: 0,
            height: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: PRIMARY_GREEN,
          }}
        >
          Download CSV template
        </Button>
      </div>

      <div
        style={{
          height: 1,
          background: "#e5e7eb",
          marginTop: 20,
          marginBottom: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleImport}
          loading={submitting}
          disabled={!fileList.length}
          style={{
            background: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          Import
        </Button>
      </div>
    </div>
  );
}
