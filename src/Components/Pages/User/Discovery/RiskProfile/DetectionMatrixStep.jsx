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

  if (conflicts.length === 0) {
    return (
      <div
        style={{
          background: "rgb(240, 253, 244)",
          border: "1.5px solid rgb(187, 247, 208)",
          borderRadius: 12,
          padding: "48px 24px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div style={{ fontSize: 40, color: "#faad14" }}>✅</div>

        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "rgb(22, 163, 74)",
          }}
        >
          No Inconsistencies Detected
        </div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 13,
            color: "rgb(107, 114, 128)",
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          All answers appear consistent. Proceed to the Risk Result step.
        </div>
      </div>
    );
  }

  return (
    <div>
      {conflicts.length > 0 && (
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
              style={{
                fontSize: 14,
                color: "rgb(55, 65, 81)",
                fontWeight: 600,
              }}
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
                One or more responses may be inconsistent with the client's
                stated objectives or tolerance for risk. Review each alert below
                and confirm with the client before finalising the risk profile.
              </div>
            </div>
          </div>
        </div>
      )}

      <DynamicDataTable
        columns={columns}
        data={conflicts}
        bordered={true}
        showCount={false}
        noPagination
        bodyFontSize={13}
        tableStyle={{ borderRadius: 0, overflow: "hidden" }}
      />

      {conflicts.length > 0 && (
        <div
          style={{
            background: "rgb(255, 251, 235)",
            border: "1.5px solid rgb(252, 211, 77)",
            borderRadius: 12,
            padding: "14px 18px",
            margin: "18px 0px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 24, color: "#faad14" }}>🔒</div>
          <div>
            <div
              style={{
                fontSize: 14,
                color: "rgb(55, 65, 81)",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgb(146, 64, 14)",
                }}
              >
                Action Required — Inconsistencies Detected
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
                There are 1 inconsistency in the client's responses. Please go
                back and review the flagged questions before proceeding to the
                Risk Result.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionMatrixStep;
