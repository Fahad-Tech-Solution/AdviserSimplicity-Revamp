import { useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Tabs,
  Typography,
  Upload,
} from "antd";
import { DeleteOutlined, EditOutlined, FileTextOutlined } from "@ant-design/icons";
import { MdAdd } from "react-icons/md";
import dayjs from "dayjs";
import AppModal from "../../../Common/AppModal";
import {
  CATEGORY_ICONS,
  CATEGORY_STYLES,
  KNOWLEDGE_CATEGORIES,
} from "./knowledgeBaseData";
import KnowledgeEntryFrom from "./KnowledgeEntryFrom";
import useApi from "../../../../hooks/useApi";

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { TextArea } = Input;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };
const ADD_FORM_ID = "knowledge-add-entry-form";

const TAB_KEYS = {
  PDF: "pdf",
  ADD: "add",
  MANAGE: "manage",
};

function FieldLabel({ children, required = false }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
      {children}
      {required ? (
        <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
      ) : null}
    </span>
  );
}

function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.General;
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
      {category}
    </span>
  );
}

function formatDisplayDate(value) {
  if (!value) return "—";
  const date = dayjs(value);
  if (!date.isValid()) return "—";
  return date.format("DD/MM/YYYY");
}

function ManageEntryCard({ entry, onEdit, onDelete }) {
  const icon = CATEGORY_ICONS[entry.subcategory] ?? "📋";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "#f0fdf4",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            display: "block",
            fontWeight: 600,
            color: "#111827",
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          {entry.title}
        </Text>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <CategoryBadge category={entry.topic} />
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>
            {entry.subcategory} · {formatDisplayDate(entry.updatedAt)}
          </Text>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined style={{ color: "#6b7280", fontSize: 14 }} />}
          onClick={() => onEdit?.(entry)}
        />
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined style={{ color: "#d1d5db", fontSize: 14 }} />}
          onClick={() => onDelete?.(entry)}
        />
      </div>
    </div>
  );
}

export default function ReferenceMaterialModal({
  open,
  onClose,
  initialTab = TAB_KEYS.PDF,
  entries = [],
  onAddEntry,
  onDeleteEntry,
  entry = null,
  isEdit = false,
}) {
  const { message } = AntdApp.useApp();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [manageSearch, setManageSearch] = useState("");
  const [pdfFileList, setPdfFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const { post, patch } = useApi()

  useEffect(() => {
    if (!open) return;
    console.log("Filtered Entries:", entry, isEdit);
    setActiveTab(initialTab);
    setManageSearch("");
    setPdfFileList([]);
    form.resetFields();
  }, [open, initialTab, form]);

  const filteredManageEntries = useMemo(() => {
    const query = manageSearch.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => {
      const haystack = [
        entry.title,
        entry.category,
        entry.source,
        formatDisplayDate(entry.lastUpdated),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [entries, manageSearch]);

  const handlePdfBeforeUpload = (file) => {
    const name = String(file?.name ?? "").toLowerCase();
    const isPdfOrTxt =
      file.type === "application/pdf" ||
      file.type === "text/plain" ||
      name.endsWith(".pdf") ||
      name.endsWith(".txt");

    if (!isPdfOrTxt) {
      message.error("Only PDF or TXT files are supported.");
      return Upload.LIST_IGNORE;
    }

    setPdfFileList([file]);
    return false;
  };

  const handleUploadAndParse = async () => {
    if (!pdfFileList.length) {
      message.warning("Please select a PDF or TXT file first.");
      return;
    }

    setSubmitting(true);
    try {
      message.info(
        `Upload & parse for "${pdfFileList[0].name}" — API coming soon.`,
      );
      setPdfFileList([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEntry = async (values) => {
    console.log("Submitting knowledge entry with values:", values);
    setSubmitting(true);

    // 1. Map values directly to match your required API payload structure
    const payload = {
      title: values.title,
      topic: values.topic,
      subcategory: values.subcategory,
      slugId: values.slugId,
      tag: values.tag,
      boost: Number(values.boost || 0),
      keywords: values.keywords,
      snippet: values.snippet,
      explanation: values.explanation, // Maps to Plain-English explanation
      note: values.note,
      example: values.example,
      relatedEntries: values.relatedEntries,
      statBoxes: values.statBoxes || [], // Array of { key, value } from dynamic fields
    };

    // 2. Determine action endpoint based on whether we are editing an existing record
    // Assumes you pass down or manage an editing ID (e.g., values._id or a state variable)
    const isUpdate = isEdit || entry._id; // Adjust this condition based on your actual edit state management

    const url = isUpdate
      ? `/knowledgeBase/update` // If your update route appends the ID param
      : "/knowledgeBase/add";

    try {
      const response = await (isUpdate ?
        patch(url, { ...payload, _id: entry._id })
        :
        post(url, payload));

      // 3. Trigger parent lift up if necessary to refresh the list locally
      onAddEntry?.(response);

      message.success(isUpdate ? "Knowledge entry updated." : "Knowledge entry added.");
      form.resetFields();
      setActiveTab(TAB_KEYS.MANAGE);
    } catch (error) {
      console.error("API Submission Error:", error);
      message.error(error.message || "Failed to save the knowledge entry.");
    } finally {
      setSubmitting(false);
    }
  };


  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      {activeTab === TAB_KEYS.PDF ? (
        <Button
          type="primary"
          onClick={handleUploadAndParse}
          loading={submitting}
          disabled={!pdfFileList.length}
          style={{
            background: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          Upload &amp; Paste
        </Button>
      ) : null}
      {activeTab === TAB_KEYS.ADD ? (
        <Button
          type="primary"
          htmlType="submit"
          form={ADD_FORM_ID}
          loading={submitting}
          icon={<MdAdd size={16} />}
          style={{
            background: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            fontWeight: 700,
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Add Entry
        </Button>
      ) : null}
      {activeTab === TAB_KEYS.MANAGE ? (
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
          Done
        </Button>
      ) : null}
    </div>
  );

  const tabItems = [
    {
      key: TAB_KEYS.PDF,
      label: "Update rates from PDF",
      children: (
        <div>
          <Dragger
            accept=".pdf,.txt,application/pdf,text/plain"
            multiple={false}
            fileList={pdfFileList}
            beforeUpload={handlePdfBeforeUpload}
            onRemove={() => setPdfFileList([])}
            listType="text"
            disabled={submitting}
            style={{ borderRadius: 12, background: "#fafafa" }}
          >
            <p className="ant-upload-drag-icon">
              <FileTextOutlined style={{ fontSize: 36, color: PRIMARY_GREEN }} />
            </p>
            <p style={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}>
              Click to choose a PDF or drop one here
            </p>
            <p style={{ color: "#9ca3af", fontSize: 12 }}>
              Also accepts .txt — scanned images not supported (needs selectable
              text).
            </p>
          </Dragger>
          <Text
            style={{
              display: "block",
              marginTop: 14,
              fontSize: 12,
              color: "#9ca3af",
              lineHeight: 1.5,
            }}
          >
            Tip: Upload Treasury / ATO / Services Australia rate PDFs to
            auto-extract values. The extracted rates appear under Manage for
            review before they&apos;re published to advisers.
          </Text>
        </div>
      ),
    },
    {
      key: TAB_KEYS.ADD,
      label: "Add knowledge entry",
      children: (
        <KnowledgeEntryFrom
          ADD_FORM_ID={ADD_FORM_ID} form={form}
          handleAddEntry={handleAddEntry} FieldLabel={FieldLabel}
          KNOWLEDGE_CATEGORIES={KNOWLEDGE_CATEGORIES}
          entry={entry}
          isEdit={isEdit}

        />
      ),
    },
    {
      key: TAB_KEYS.MANAGE,
      label: "Manage",
      children: (
        <div>
          <Input
            placeholder="Filter entries"
            allowClear
            value={manageSearch}
            onChange={(e) => setManageSearch(e.target.value)}
            style={{ marginBottom: 14, borderRadius: 8 }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxHeight: 360,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {filteredManageEntries.length ? (
              filteredManageEntries.map((entry) => (
                <ManageEntryCard
                  key={entry._id}
                  entry={entry}
                  onEdit={() =>
                    message.info(`Edit "${entry.title}" — coming soon`)
                  }
                  onDelete={() => onDeleteEntry?.(entry)}
                />
              ))
            ) : (
              <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                No entries match your filter.
              </Text>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title=""
      width={800}
      footer={footer}
      destroyOnClose
    >
      <div style={{ padding: "4px 0 8px" }}>
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
          KNOWLEDGE
        </Text>
        <Title
          level={3}
          style={{
            ...headingStyle,
            margin: 0,
            fontWeight: 500,
            fontSize: 24,
          }}
        >
          Reference material &amp; knowledge
        </Title>
        <Text
          style={{
            display: "block",
            marginTop: 6,
            marginBottom: 16,
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          Upload rate PDFs, add manual knowledge entries, or manage the reference
          library.
        </Text>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="reference-material-tabs"
        />
        <style>
          {`
            .reference-material-tabs .ant-tabs-tab-btn {
              font-size: 13px;
            }
            .reference-material-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
              color: #111827;
              font-weight: 600;
            }
            .reference-material-tabs .ant-tabs-ink-bar {
              background: ${PRIMARY_GREEN};
            }
          `}
        </style>
      </div>
    </AppModal>
  );
}

export { TAB_KEYS };
