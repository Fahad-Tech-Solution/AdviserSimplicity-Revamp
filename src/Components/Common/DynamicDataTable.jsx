import { Card, Table, Typography } from "antd";
import { useMemo, useState } from "react";

const { Text } = Typography;
const PRIMARY_GREEN = "#22c55e";

export default function DynamicDataTable({
  columns = [],
  data = [],
  title,
  pageSize = 10,
  total,
  bordered = true,
  size = "small",
  primaryColor = PRIMARY_GREEN,
  className = "",
  cardStyle = {},
  cardBodyStyle = {},
  tableStyle = {},
  tableProps = {},
  pagination = {},
  showCount = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const computedTotal = Number.isFinite(total) ? total : data.length;
  const totalPages = Math.max(1, Math.ceil(computedTotal / pageSize));

  const resolvedColumns = useMemo(
    () =>
      (columns || []).map((col) => {
        const userOnCell = col.onCell;
        const userOnHeaderCell = col.onHeaderCell;
        const shouldEllipsis = Boolean(col.ellipsis);

        return {
          ...col,
          ellipsis: shouldEllipsis,
          onCell: (record, rowIndex) => {
            const userCellProps = userOnCell?.(record, rowIndex) || {};

            return {
              ...userCellProps,
              style: {
                wordBreak: shouldEllipsis ? "normal" : "break-word",
                overflowWrap: shouldEllipsis ? "normal" : "anywhere",
                whiteSpace: shouldEllipsis ? "nowrap" : "normal",
                ...userCellProps.style,
              },
            };
          },
          onHeaderCell: (column) => {
            const userHeaderProps = userOnHeaderCell?.(column) || {};

            return {
              ...userHeaderProps,
              style: {
                background: primaryColor,
                color: "#fff",
                fontWeight: 600,
                borderInlineColor: "#ffffff",
                ...userHeaderProps.style,
              },
            };
          },
        };
      }),
    [columns, primaryColor],
  );

  return (
    <>
      {showCount && (
        <div style={{ padding: "12px 20px" }}>
          <Text strong>{title || `Showing ${data.length} records`}</Text>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table
          columns={resolvedColumns}
          dataSource={data}
          className={className}
          rowClassName={() => "dynamic-table-row"}
          tableLayout="fixed"
          scroll={{ x: true }}
          size={size}
          bordered={bordered}
          style={{ ...tableStyle }}
          pagination={{
            current: currentPage,
            total: computedTotal,
            pageSize,
            showSizeChanger: false,
            showQuickJumper: false,
            placement: ["bottomRight"],
            showTotal: () => `Page ${currentPage} of ${totalPages}`,
            onChange: (page) => setCurrentPage(page),
            ...pagination,
          }}
          styles={{
            content: {
              border: "1px solid #e0e0e0",
              borderRadius: 0,
            },
            header: {
              wrapper: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
              },
              row: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
              },
              cell: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
                borderInlineColor: "#fff",
                borderRadius: 0,
                fontSize: 12,
              },
            },
            body: {
              row: {
                border: "none",
                borderBottom: "0.5px solid #f3f3f3",
              },
              cell: {
                border: "none",
                borderBottom: "0.5px solid #f3f3f3",
              },
            },
            section: {
              border: "none",
            },
          }}
          {...tableProps}
        />
      </div>
    </>
  );
}
