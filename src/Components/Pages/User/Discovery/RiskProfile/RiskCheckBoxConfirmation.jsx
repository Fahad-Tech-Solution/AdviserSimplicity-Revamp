import { Button, Checkbox, Divider, Space } from "antd";
import React, { useMemo, useState } from "react";
import { CheckOutlined } from "@ant-design/icons";
import useTitleBlock from "../../../../../hooks/useTitleBlock";

function areAllChecked(values, confirmationLabels) {
  return (confirmationLabels || []).every((item) =>
    Boolean(values?.[item.key]),
  );
}

export default function RiskCheckBoxConfirmation({ modalData }) {
  const renderTitleBlock = useTitleBlock();
  const confirmationLabels = modalData?.CONFIRMATION_LABELS || [];
  const participant = modalData?.participant || {};

  const initialValues = useMemo(
    () =>
      confirmationLabels.reduce((acc, item) => {
        acc[item.key] = Boolean(participant?.[item.key]);
        return acc;
      }, {}),
    [confirmationLabels, participant],
  );

  const [values, setValues] = useState(initialValues);
  const [editing, setEditing] = useState(
    () => !areAllChecked(initialValues, confirmationLabels),
  );

  const allChecked = areAllChecked(values, confirmationLabels);

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 12 }}>
        {renderTitleBlock({
          title: "Terms and Conditions",
          titleStyle: {
            fontSize: "16px",
            fontWeight: "600",
            color: "rgb(17, 24, 39)",
          },
          clossButton: true,
          onClose: () => modalData?.closeModal?.(),
        })}
        <Divider style={{ margin: "12px 0px 0px 0px" }} />
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {confirmationLabels.map((item) => {
          const checked = Boolean(values?.[item.key]);

          return (
            <label
              key={item.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 18px",
                borderRadius: 16,
                border: checked
                  ? "1px solid rgb(187, 247, 208)"
                  : "1px solid rgb(229, 231, 235)",
                background: checked
                  ? "rgb(240, 253, 244)"
                  : "rgb(255, 255, 255)",
                cursor: editing ? "pointer" : "default",
              }}
            >
              <Checkbox
                checked={checked}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [item.key]: event.target.checked,
                  }))
                }
                style={{ marginTop: 2 }}
              />
              <div
                style={{
                  flex: 1,
                  color: "rgb(55, 65, 81)",
                  fontSize: 13,
                  lineHeight: 1.8,
                  fontFamily: "Arial",
                }}
              >
                {item.label}
              </div>
            </label>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 28,
        }}
      >
        <Space>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          ) : null}
          <Button
            type="primary"
            icon={allChecked ? <CheckOutlined /> : undefined}
            disabled={!allChecked}
            onClick={() => {
              modalData?.closeModal?.({ values });
            }}
          >
            Accept
          </Button>
        </Space>
      </div>
    </div>
  );
}
