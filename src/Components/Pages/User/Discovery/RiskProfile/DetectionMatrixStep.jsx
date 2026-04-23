import { Alert, Card, Tag } from "antd";
import React from "react";
import DynamicDataTable from "../../../../Common/DynamicDataTable.jsx";
import { FaExclamationTriangle } from "react-icons/fa";

const DetectionMatrixStep = ({ conflicts, clientName, partnerName }) => {
  const columns = [
    {
      title: "Profile",
      dataIndex: "profile",
      key: "profile",
      width: 140,
      render: (value) => (
        <div
          style={{ color: "gold", fontWeight: 700, color: "rgb(55, 65, 81)" }}
        >
          {value === "partner"
            ? `👥 ${partnerName}` || "Partner"
            : `🧑 ${clientName}` || "Client"}
        </div>
      ),
    },
    {
      title: "Question Relationship",
      dataIndex: "relationship",
      key: "relationship",
      width: 240,
      render: (value) => (
        <div
          style={{ color: "rgb(55, 65, 81)", fontWeight: 600, fontSize: 12 }}
        >
          {value}
        </div>
      ),
    },
    {
      title: "Inconsistency Detected",
      dataIndex: "inconsistency",
      key: "inconsistency",
    },
    {
      title: "Adviser Explanation",
      dataIndex: "explanation",
      key: "explanation",
    },
  ];

  return (
    <div>
      <div
        style={{
          background: "rgb(255, 251, 235)",
          border: "1.5px solid rgb(252, 211, 77)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 18,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 24, color: "#faad14" }}>⚠️</div>
        <div>
          <div
            style={{ fontSize: 14, color: "rgb(55, 65, 81)", fontWeight: 600 }}
          >
            <div
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "rgb(146, 64, 14)",
              }}
            >
              Adviser Review Alert: Potential Inconsistency Detected
            </div>
            <div
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 12,
                color: "rgb(180, 83, 9)",
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              One or more responses may be inconsistent with the client's stated
              objectives or tolerance for risk. Review each alert below and
              confirm with the client before finalising the risk profile.
            </div>
          </div>
        </div>
      </div>

      <DynamicDataTable
        columns={columns}
        data={conflicts}
        bordered={true}
        showCount={false}
        noPagination
        bodyFontSize={13}
        tableStyle={{ borderRadius: 0, overflow: "hidden" }}
      />
    </div>
  );
};

export default DetectionMatrixStep;
