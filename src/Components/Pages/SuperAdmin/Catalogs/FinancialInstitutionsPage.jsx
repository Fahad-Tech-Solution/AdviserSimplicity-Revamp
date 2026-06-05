import { useMemo, useState, useCallback } from "react";
import {
  App as AntdApp,
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { BiSearch } from "react-icons/bi";
import { MdAdd } from "react-icons/md";
import { getInitials } from "../../../../hooks/helpers";
import { catalogsDataAtom } from "../../../../store/authState";
import { useAtom } from "jotai";
import {
  getCatalogSectionList,
  getInstitutionName,
  normalizeCatalogsData,
} from "./catalogHelpers";

const { Text } = Typography;
const PRIMARY_GREEN = "#22c55e";

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
};

const AVATAR_COLORS = [
  "#f97316",
  "#ef4444",
  "#3b82f6",
  "#111827",
  "#22c55e",
  "#a855f7",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
];

const CATALOG_SECTION_KEY = "FinancialInstitutions";

function formatAddedDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.Bank;
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
      {type}
    </span>
  );
}

export default function FinancialInstitutionsPage() {
  const { message } = AntdApp.useApp();
  const [catalogsData, setCatalogsData] = useAtom(catalogsDataAtom);
  const [searchText, setSearchText] = useState("");

  const institutions = useMemo(
    () => getCatalogSectionList(catalogsData, CATALOG_SECTION_KEY),
    [catalogsData],
  );

  const removeInstitution = useCallback(
    (rowId) => {
      setCatalogsData((prev) => {
        const normalized = normalizeCatalogsData(prev);
        const currentList = getCatalogSectionList(prev, CATALOG_SECTION_KEY);
        return {
          ...normalized,
          [CATALOG_SECTION_KEY]: currentList.filter(
            (item) => (item.id ?? item._id) !== rowId,
          ),
        };
      });
    },
    [setCatalogsData],
  );

  const filteredInstitutions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return institutions;

    return institutions.filter((item) => {
      const name = getInstitutionName(item).toLowerCase();
      const type = String(item.type ?? "Bank").toLowerCase();
      return name.includes(query) || type.includes(query);
    });
  }, [institutions, searchText]);

  const tableData = useMemo(
    () =>
      filteredInstitutions.map((row, index) => ({
        ...row,
        key: row.id ?? row._id ?? String(index),
        index: index + 1,
        displayName: getInstitutionName(row),
      })),
    [filteredInstitutions],
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
        title: "NAME",
        key: "platformName",
        render: (_, row, index) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: AVATAR_COLORS[index % AVATAR_COLORS.length],
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {getInitials(row.displayName).charAt(0) || "?"}
            </span>
            <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>
              {row.displayName || "—"}
            </span>
          </div>
        ),
      },
      {
        title: "TYPE",
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (_, row) => <TypeBadge type={row.type ?? "Bank"} />,
      },
      {
        title: "ADDED",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 110,
        render: (createdAt) => (
          <span style={{ color: "#374151", fontSize: 13 }}>
            {/* {formatAddedDate(createdAt)} */}
            {formatAddedDate(new Date())}
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
                  message.info(`Edit ${row.displayName} — coming soon`)
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
                onClick={() => {
                  removeInstitution(row.id ?? row._id);
                  message.success("Institution removed.");
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [message, removeInstitution],
  );

  return (
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
            Financial Institutions
          </Text>
          <span style={{ color: "#d1d5db" }}>|</span>
          <Text style={{ fontSize: 13, color: "#9ca3af" }}>
            {filteredInstitutions.length} item
            {filteredInstitutions.length === 1 ? "" : "s"}
          </Text>
        </div>

        <Space wrap>
          <Input
            placeholder="Search..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 220,
              height: 35,
              borderRadius: 8,
              fontSize: 13,
            }}
            prefix={<BiSearch style={{ color: "#9ca3af" }} />}
          />
          <Button
            type="primary"
            icon={<MdAdd size={15} />}
            onClick={() => message.info("Add institution — coming soon")}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
            }}
          >
            Add Institution
          </Button>
        </Space>
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
              `Showing ${range[0]}–${range[1]} of ${total} institutions`,
          }}
        />
      </div>
    </div>
  );
}
