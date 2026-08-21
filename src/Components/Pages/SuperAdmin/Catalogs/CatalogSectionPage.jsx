import { useCallback, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, FilterFilled } from "@ant-design/icons";
import { useAtom } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";
import { catalogChildRouteConfigs } from "../../../Routes/catalogRouteConfig";
import { BiSearch } from "react-icons/bi";
import { MdAdd } from "react-icons/md";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { confirmRemoveData } from "../../../Common/confirmationModal";
import useApi from "../../../../hooks/useApi";
import { getInitials } from "../../../../hooks/helpers";
import { catalogsDataAtom } from "../../../../store/authState";
import {
  getCatalogItemName,
  getCatalogSectionList,
  matchCatalogChildRoute,
  normalizeCatalogsData,
} from "./catalogHelpers";
import AddSectionModal from "./AddSectionModal";

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
    border: "1px solid var(--primary-green)",
  },
  "Building Society": {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  "Mutual Bank": {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid rgba(255, 229, 204, 0.97)",
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

const DEFAULT_CONFIG = {
  catalogDataKey: "",
  catalogTitle: "Catalog",
  addButtonLabel: "Add Item",
  paginationItemLabel: "items",
  deleteSuccessLabel: "Item",
  defaultType: "Bank",
  showTypeColumn: true,
};

export default function CatalogSectionPage() {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const [catalogsData, setCatalogsData] = useAtom(catalogsDataAtom);
  const [searchText, setSearchText] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Added Table Filter and Sort States
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setEditingRecord(null);
  }, []);

  const navigate = useNavigate();

  const activeCatalogRoute = useMemo(
    () => matchCatalogChildRoute(location.pathname, catalogChildRouteConfigs),
    [location.pathname],
  );

  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...activeCatalogRoute,
    }),
    [activeCatalogRoute],
  );

  const {
    catalogDataKey,
    catalogTitle,
    addButtonLabel,
    paginationItemLabel,
    deleteSuccessLabel,
    defaultType,
    showTypeColumn,
    showTypeInvestmentSection,
  } = config;

  const items = useMemo(
    () => getCatalogSectionList(catalogsData, catalogDataKey),
    [catalogsData, catalogDataKey],
  );

  const removeItem = useCallback(
    (rowId) => {
      if (!catalogDataKey) return;
      setCatalogsData((prev) => {
        const normalized = normalizeCatalogsData(prev);
        const currentList = getCatalogSectionList(prev, catalogDataKey);
        return {
          ...normalized,
          [catalogDataKey]: currentList.filter(
            (item) => (item.id ?? item._id) !== rowId,
          ),
        };
      });
    },
    [catalogDataKey, setCatalogsData],
  );

  const deleteItem = useCallback(
    (row) => {
      const rowId = row?._id ?? row?.id;
      if (!rowId) return;

      confirmRemoveData(
        async () => {
          try {
            await api.patch("/platform/Delete", { _id: rowId });
            removeItem(rowId);
            message.success(`${deleteSuccessLabel} removed.`);
          } catch (error) {
            message.error(
              error?.response?.data?.error ||
              error?.response?.data?.message ||
              error?.message ||
              "Failed to delete item.",
            );
            throw error;
          }
        },
        {
          title: `Remove ${deleteSuccessLabel}?`,
          content: `This will permanently remove "${getCatalogItemName(row)}" from the catalog.`,
        },
      );
    },
    [api, deleteSuccessLabel, message, removeItem],
  );

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const name = getCatalogItemName(item).toLowerCase();
      const type = String(item.type ?? defaultType).toLowerCase();
      return name.includes(query) || type.includes(query);
    });
  }, [items, searchText, defaultType]);

  const tableData = useMemo(
    () =>
      [...filteredItems]
        .sort((a, b) => {
          const nameA = getCatalogItemName(a).toLowerCase();
          const nameB = getCatalogItemName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        })
        .map((row, index) => ({
          ...row,
          key: row.id ?? row._id ?? String(index),
          index: index + 1,
          displayName: getCatalogItemName(row),
        })),
    [filteredItems],
  );

  // Extract unique platformType values dynamically for filters
  const platformTypeFilters = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(tableData.map((item) => item.platformType || defaultType).filter(Boolean))
    );
    return uniqueTypes.map((type) => ({ text: type, value: type }));
  }, [tableData, defaultType]);

  const columns = useMemo(() => {
    const baseColumns = [
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
        key: "name",
        width: 200,
        sorter: (a, b) => (a.displayName || "").localeCompare(b.displayName || ""),
        sortOrder: sortedInfo.columnKey === "name" ? sortedInfo.order : null,
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
    ];

    if (showTypeColumn) {
      baseColumns.push({
        title: catalogDataKey === "PersonalInsurances" ? "Product Name" : "TYPE",
        dataIndex: "platformType",
        key: "platformType",
        width: 140,

        filters: platformTypeFilters,
        filteredValue: filteredInfo.platformType || null,

        // ✅ Match against row.platformType with defaultType fallback
        onFilter: (value, record) => {
          const actualType = record.platformType || defaultType;
          return actualType === value;
        },

        sorter: (a, b) => {
          const typeA = a.platformType || defaultType;
          const typeB = b.platformType || defaultType;
          return typeA.localeCompare(typeB);
        },
        sortOrder: sortedInfo.columnKey === "platformType" ? sortedInfo.order : null,
        ellipsis: true,
        render: (_, row) => (
          <TypeBadge type={row.platformType} fallback={defaultType} />
        ),

        // 🎨 Custom active filter icon styling
        filterIcon: (filtered) => (
          <FilterFilled
            style={{
              color: filtered ? "#ffffff" : "rgba(255, 255, 255, 0.65)", // Bright white when active, soft white when inactive
              fontSize: 14,
            }}
          />
        ),
      });
    }

    baseColumns.push(
      {
        title: "ADDED",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 110,
        render: (createdAt) => (
          <span style={{ color: "#374151", fontSize: 13 }}>
            {formatAddedDate(createdAt)}
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
            {showTypeInvestmentSection && (
              <Tooltip title="Upload CSV">
                <Button
                  type="text"
                  size="small"
                  icon={<span style={{ fontSize: 14 }}>📂</span>}
                  onClick={() => {
                    navigate(`/super-admin/catalog/investment-sections`, {
                      state: {
                        row: row,
                        config: config,
                        numberOfItems: tableData.length,
                      },
                    });
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: "#6b7280", fontSize: 14 }} />
                }
                onClick={() => {
                  setEditingRecord(row);
                  setAddModalOpen(true);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                icon={
                  <DeleteOutlined style={{ color: "#d1d5db", fontSize: 14 }} />
                }
                onClick={() => deleteItem(row)}
              />
            </Tooltip>
          </Space>
        ),
      },
    );

    return baseColumns;
  }, [
    catalogDataKey,
    config,
    defaultType,
    deleteItem,
    filteredInfo,
    navigate,
    platformTypeFilters,
    showTypeColumn,
    showTypeInvestmentSection,
    sortedInfo,
    tableData.length,
  ]);

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
      <AddSectionModal
        open={addModalOpen}
        onClose={closeAddModal}
        sectionConfig={config}
        editingRecord={editingRecord}
      />

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
            {catalogTitle}
          </Text>
          <span style={{ color: "#d1d5db" }}>|</span>
          <Text style={{ fontSize: 13, color: "#9ca3af" }}>
            {filteredItems.length} item
            {filteredItems.length === 1 ? "" : "s"}
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
            onClick={() => {
              setEditingRecord(null);
              setAddModalOpen(true);
            }}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
            }}
          >
            <MdAdd size={15} /> {addButtonLabel}
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
          onChange={handleTableChange}
          bordered
          size="small"
          tableStyle={{ borderRadius: 8, overflow: "hidden" }}
          pagination={{
            showTotal: (total, range) =>
              `Showing ${range[0]}–${range[1]} of ${total} ${paginationItemLabel}`,
          }}
        />
      </div>
    </div>
  );
}