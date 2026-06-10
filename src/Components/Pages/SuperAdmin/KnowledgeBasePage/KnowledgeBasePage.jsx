import { useCallback, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { BiSearch } from "react-icons/bi";
import { MdAdd } from "react-icons/md";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { confirmRemoveData } from "../../../Common/confirmationModal";
import ReferenceMaterialModal, { TAB_KEYS } from "./ReferenceMaterialModal";
import {
  CATEGORY_ICONS,
  CATEGORY_STYLES,
  INITIAL_KNOWLEDGE_ENTRIES,
} from "./knowledgeBaseData";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

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

export default function KnowledgeBasePage() {
  const { message } = AntdApp.useApp();
  const [entries, setEntries] = useState(INITIAL_KNOWLEDGE_ENTRIES);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState(TAB_KEYS.PDF);

  const openModal = useCallback((tab) => {
    setModalTab(tab);
    setModalOpen(true);
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchText.trim().toLowerCase();
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
  }, [entries, searchText]);

  const tableData = useMemo(
    () =>
      filteredEntries.map((entry, index) => ({
        ...entry,
        key: entry._id,
        index: index + 1,
      })),
    [filteredEntries],
  );

  const handleAddEntry = useCallback((payload) => {
    setEntries((prev) => [
      {
        _id: `kb-${Date.now()}`,
        ...payload,
      },
      ...prev,
    ]);
  }, []);

  const handleDeleteEntry = useCallback(
    (entry) => {
      confirmRemoveData(
        () => {
          setEntries((prev) => prev.filter((item) => item._id !== entry._id));
          message.success("Entry removed.");
        },
        {
          title: "Remove entry?",
          content: `This will permanently remove "${entry.title}" from the knowledge base.`,
        },
      );
    },
    [message],
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
        title: "TITLE",
        key: "title",
        render: (_, row) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#f0fdf4",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {CATEGORY_ICONS[row.category] ?? "📋"}
            </span>
            <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
              {row.title}
            </span>
          </div>
        ),
      },
      {
        title: "CATEGORY",
        dataIndex: "category",
        key: "category",
        width: 140,
        render: (category) => <CategoryBadge category={category} />,
      },
      {
        title: "SOURCE",
        dataIndex: "source",
        key: "source",
        width: 180,
        render: (source) => (
          <span style={{ color: "#6b7280", fontSize: 13 }}>{source || "—"}</span>
        ),
      },
      {
        title: "LAST UPDATED",
        dataIndex: "lastUpdated",
        key: "lastUpdated",
        width: 120,
        render: (value) => (
          <span style={{ color: "#6b7280", fontSize: 13 }}>
            {formatDisplayDate(value)}
          </span>
        ),
      },
      {
        title: "ACTIONS",
        key: "actions",
        width: 90,
        align: "center",
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: "#6b7280", fontSize: 14 }} />
                }
                onClick={() =>
                  message.info(`Edit "${row.title}" — coming soon`)
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
                onClick={() => handleDeleteEntry(row)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleDeleteEntry, message],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 32px)",
        padding: "12px 4px 24px",
      }}
    >
      <Text
        style={{
          fontFamily: "Arial, serif",
          fontWeight: 700,
          letterSpacing: "3px",
          fontSize: "11px",
          color: PRIMARY_GREEN,
          marginBottom: 6,
        }}
      >
        ADMIN
      </Text>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ maxWidth: 580 }}>
          <Title
            level={3}
            style={{
              ...headingStyle,
              margin: 0,
              fontWeight: 500,
              fontSize: 28,
            }}
          >
            Knowledge Base
          </Title>
          <Text
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 12,
              color: "#6b7280",
              fontFamily: "Arial, sans-serif",
              lineHeight: 1.6,
            }}
          >
            Upload PDFs to extract rates automatically, add manual reference
            entries, and manage the knowledge advisers see in their calculations.
          </Text>
        </div>

        <Space wrap>
          <Button
            icon={<span style={{ fontSize: 14 }}>📋</span>}
            onClick={() => openModal(TAB_KEYS.MANAGE)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              height: 38,
              paddingInline: 16,
            }}
          >
            Manage Entries
          </Button>
          <Button
            type="primary"
            icon={<MdAdd size={15} />}
            onClick={() => openModal(TAB_KEYS.PDF)}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              height: 38,
              paddingInline: 18,
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
            }}
          >
            Update Reference Material
          </Button>
        </Space>
      </div>

      <ReferenceMaterialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        entries={entries}
        onAddEntry={handleAddEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      <div
        style={{
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
              Current Reference Library
            </Text>
            <span style={{ color: "#d1d5db" }}>|</span>
            <Text style={{ fontSize: 13, color: "#9ca3af" }}>
              {filteredEntries.length} entr
              {filteredEntries.length === 1 ? "y" : "ies"}
            </Text>
          </div>

          <Input
            placeholder="Search knowledge..."
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
                `Showing ${range[0]}–${range[1]} of ${total} entries`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
