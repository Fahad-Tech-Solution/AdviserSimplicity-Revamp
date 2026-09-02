import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Col,
  Input,
  Row,
  Segmented,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { BiSearch } from "react-icons/bi";
import AppModal from "../../../Common/AppModal";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import useApi from "../../../../hooks/useApi";
import { catalogsDataAtom } from "../../../../store/authState";
import CSVFileUpload from "./components/CSVFileUpload";
import AddIndividualInvestment from "./components/AddIndividualInvestment";
import {
  getUnderlyingInvestments,
  normalizeCatalogsData,
} from "./catalogHelpers";
import { confirmRemoveData } from "../../../Common/confirmationModal";
import { FaRegCircleCheck } from "react-icons/fa6";
import { MdOutlineDoDisturb } from "react-icons/md";

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

function getInvestmentName(item = {}) {
  return (
    item.investmentName ?? item.name ?? item.platformName ?? item.fundName ?? ""
  );
}

function getInvestmentCode(item = {}) {
  return item.code ?? item.investmentCode ?? item.fundCode ?? item.apir ?? "";
}

function CsvImportButton({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        minHeight: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "20px 24px",
        borderRadius: 15,
        border: `2px dashed ${isHovered ? PRIMARY_GREEN : "#d1d5db"}`,
        background: isHovered ? "#f0fdf4" : "#f9fafb",
        cursor: "pointer",
        transition: "all 0.15s ease",
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
    </button>
  );
}

export default function InvestmentSectionsPage() {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { row, config } = location.state ?? {};
  const [searchText, setSearchText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [investments, setInvestments] = useState([]
  );
  const [StatusFlag, setStatusFlag] = useState(false);


  const setCatalogsData = useSetAtom(catalogsDataAtom);

  const platformId = row?._id ?? row?.id;

  useEffect(() => {

    refreshInvestments()
  }, [row]);

  const refreshInvestments = useCallback(async () => {
    setLoading(true)
    if (!config?.catalogDataKey || !platformId) return;

    try {
      const res = await api.get("/investmentoffer");
      const normalized = normalizeCatalogsData(res);
      setCatalogsData(normalized);

      const sectionList = normalized[config.catalogDataKey];
      const platforms = Array.isArray(sectionList) ? sectionList : [];
      const updatedPlatform = platforms.find(
        (item) => (item._id ?? item.id) === platformId,
      );
      setInvestments(getUnderlyingInvestments(updatedPlatform ?? row));
    } catch {
      // Keep current list if refresh fails.
    }
    finally {
      setLoading(false)
    }
  }, [api, config?.catalogDataKey, platformId, row, setCatalogsData]);

  const filteredInvestments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return investments;

    return investments.filter((item) => {
      const name = getInvestmentName(item).toLowerCase();
      const code = getInvestmentCode(item).toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [investments, searchText]);

  const deleteInvestment = useCallback(
    (row) => {
      const rowId = typeof row === "object" ? (row?._id ?? row?.id) : row;
      if (!rowId) return;

      const currentSoftDelete = Boolean(typeof row === "object" ? row?.softDelete : false);
      const nextSoftDelete = !currentSoftDelete;
      const itemName = typeof row === "object" ? (row?.investmentName || row?.title || "this investment") : "this investment";

      confirmRemoveData(
        async () => {
          try {
            await api.patch("/investmentoffer/Delete", {
              _id: rowId,
              softDelete: nextSoftDelete,
            });

            setInvestments((prev) =>
              prev.map((item) => {
                const id = item?._id ?? item?.id;
                return id === rowId ? { ...item, softDelete: nextSoftDelete } : item;
              }),
            );
            message.success(`Investment ${nextSoftDelete ? "disabled" : "activated"} successfully.`);
          } catch (error) {
            message.error(
              error?.response?.data?.error ||
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update investment.",
            );
            throw error;
          }
        },
        {
          title: nextSoftDelete ? "Disable Investment?" : "Activate Investment?",
          content: `This will ${nextSoftDelete ? "disable" : "activate"} the "${itemName}" from the platform`,
        },
      );
    },
    [api, message, confirmRemoveData, StatusFlag],
  );

  const tableData = useMemo(
    () =>
      [...filteredInvestments]
        .sort((a, b) => {
          const nameA = getInvestmentName(a).toLowerCase();
          const nameB = getInvestmentName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        })
        .map((item, index) => ({
          ...item,
          key: item._id ?? item.id ?? String(index),
          index: index + 1,
          displayName: getInvestmentName(item),
          displayCode: getInvestmentCode(item),
          softDelete: Boolean(item.softDelete),
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

        sorter: (a, b) => (a.displayName || "").localeCompare(b.displayName || ""),
        sortDirections: ["descend", "ascend", "descend"],

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
        sorter: (a, b) => (a.displayCode || "").localeCompare(b.displayCode || ""),
        sortDirections: ["descend", "ascend", "descend"],
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
        title: "ADDED",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 110,
        // Controlled sort order from your state
        // sortOrder: sortedInfo.columnKey === "createdAt" ? sortedInfo.order : null,
        // Safe comparison handling null/undefined values
        sorter: (a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        },
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
        render: (_, record) => (
          <Space size={4}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={
                  <EditOutlined style={{ color: "#6b7280", fontSize: 14 }} />
                }
                onClick={() => {
                  setOpenModal(true);
                  setModalData({
                    type: "manual",
                    record: record,
                    editing: true,
                  });
                }}
              />
            </Tooltip>
            <Tooltip title={StatusFlag !== true ? "Disable" : "Active"}>
              <Button
                type="text"
                size="small"
                danger={StatusFlag !== true}
                icon={
                  StatusFlag === true ? (
                    <FaRegCircleCheck style={{ color: '#52c41a', fontSize: 14 }} />
                  ) : (
                    <MdOutlineDoDisturb style={{ fontSize: 14 }} />
                  )
                }
                onClick={() => deleteInvestment(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [message, deleteInvestment, StatusFlag],
  );


  // Inside your component:
  const filteredData = useMemo(() => {
    return tableData.filter((item) => item.softDelete === StatusFlag).map((item, index) => ({
      ...item,
      index: index + 1, // Pre-calculate 1, 2, 3... 30
    }));;
  }, [tableData, StatusFlag]);

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
        {row?.displayName ?? "Investment"}
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
        <TypeBadge type={row?.type} fallback={config?.defaultType} />{" "} &nbsp;&nbsp;
        {investments.length} underlying investment
        {investments.length === 1 ? "" : "s"}
      </Text>

      <AppModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setModalData(null);
        }}
        title=""
        width={modalData?.type === "csv" ? 560 : 520}
        footer={null}
      >
        {modalData?.type === "csv" ? (
          <CSVFileUpload
            data={{ ...modalData, row, config }}
            onClose={() => {
              setOpenModal(false);
              setModalData(null);
            }}
            onSuccess={refreshInvestments}
          />
        ) : (
          <AddIndividualInvestment
            data={{ ...modalData, row, config }}
            onClose={() => {
              setOpenModal(false);
              setModalData(null);
            }}
            onSuccess={refreshInvestments}
          />
        )}
      </AppModal>

      <Row gutter={16}>
        <Col md={12} xs={24} style={{ marginTop: 28 }}>
          <CsvImportButton
            onClick={() => {
              setOpenModal(true);
              setModalData({ type: "csv" });
            }}
          />
        </Col>
        <Col md={12} xs={24} style={{ marginTop: 28 }}>
          <button
            type="button"
            onClick={() => {
              setOpenModal(true);
              setModalData({ type: "manual" });
            }}
            style={{
              flex: 1,
              minHeight: 88,
              minWidth: 220,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 24px",
              borderRadius: 15,
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
          <Segmented
            value={StatusFlag}
            onChange={(value) =>
              setStatusFlag(value)}
            options={[
              {
                label: <span style={{ color: StatusFlag === false ? '#52c41a' : 'inherit' }}>Active</span>,
                value: false,
                icon: <FaRegCircleCheck style={{ color: '#52c41a' }} />
              },
              {
                label: <span style={{ color: StatusFlag === true ? '#ff4d4f' : 'inherit' }}>Disabled</span>,
                value: true,
                icon: <MdOutlineDoDisturb style={{ color: '#ff4d4f' }} />
              },
            ]}
          />
        </div>


        <div style={{ padding: "0 12px 12px" }}>
          <DynamicDataTable
            loading={loading}
            columns={columns}
            data={filteredData}
            total={filteredData.length}
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
