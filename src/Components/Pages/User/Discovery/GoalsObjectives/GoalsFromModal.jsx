import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button, Col, Form, Row, Space, message } from "antd";
import { RiEdit2Fill } from "react-icons/ri";
import parse from "html-react-parser";
import EditableDynamicTable from "../../../../Common/EditableDynamicTable.jsx";
import useApi from "../../../../../hooks/useApi.js";
import { toCommaAndDollar } from "../../../../../hooks/helpers.js";
import {
  goalsDataAtom,
  SelectedClient,
} from "../../../../../store/authState.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const WHEN_OPTIONS = [
  { label: "Now", value: "Now" },
  { label: "Ongoing", value: "Ongoing" },
  ...Array.from({ length: 10 }, (_, index) => ({
    label: `Year ${index + 1}`,
    value: `Year ${index + 1}`,
  })),
];

function parseCurrencyValue(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/[^0-9.-]+/g, "")) || 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function buildAutoDescription(cardData = {}) {
  const values = Array.isArray(cardData?.descriptionArray)
    ? cardData.descriptionArray
    : [];

  return values
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .join("<br/><br/>");
}


function hasMeaningfulGoalData(values = {}) {
  return ["scopeOfAdvice", "when", "estimatedValue", "description"].some(
    (key) => String(values?.[key] ?? "").trim() !== "",
  );
}

function buildInitialValues(currentGoalData = {}, cardData = {}) {
  const fallbackScope = cardData?.scopeOfAdvice || "";
  const description = String(currentGoalData?.description ?? "").trim();
  const autoDescription = buildAutoDescription(cardData);

  return {
    scopeOfAdvice: currentGoalData?.scopeOfAdvice || fallbackScope,
    when: currentGoalData?.when || "",
    estimatedValue: formatCurrencyValue(currentGoalData?.estimatedValue),
    description: description || autoDescription,
  };
}

export default function GoalsFromModal({ modalData }) {
  const [form] = Form.useForm();
  const { post, patch } = useApi();
  const selectedClient = useAtomValue(SelectedClient);
  const setGoalsData = useSetAtom(goalsDataAtom);
  const formattedContentRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const goalKey = modalData?.key;
  const cardData = modalData?.cardData || {};
  const currentGoalData = useAtomValue(goalsDataAtom)?.[goalKey] || {};

  const initialValues = useMemo(
    () => buildInitialValues(currentGoalData, cardData),
    [cardData, currentGoalData],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(
      !currentGoalData?.clientFK &&
        !currentGoalData?._id &&
        !hasMeaningfulGoalData(initialValues),
    );
  }, [currentGoalData?._id, currentGoalData?.clientFK, form, initialValues]);

  const scopeOfAdvice =
    Form.useWatch("scopeOfAdvice", form) ?? initialValues.scopeOfAdvice;

  const when = Form.useWatch("when", form) ?? initialValues.when;

  const estimatedValue =
    Form.useWatch("estimatedValue", form) ?? initialValues.estimatedValue;

  const description =
    Form.useWatch("description", form) ?? initialValues.description;

  useEffect(() => {
    if (!editing || !formattedContentRef.current) return;

    const nextHtml = String(description ?? "");
    if (formattedContentRef.current.innerHTML !== nextHtml) {
      formattedContentRef.current.innerHTML = nextHtml;
    }
  }, [description, editing]);

  const rows = useMemo(
    () => [
      {
        key: "goal-detail-row",
        rowNumber: 1,
        formPath: [],
        scopeOfAdvice,
        when,
        estimatedValue,
      },
    ],
    [estimatedValue, scopeOfAdvice, when],
  );

  const columns = useMemo(
    () => [
      // {
      //   title: "No#",
      //   dataIndex: "rowNumber",
      //   key: "rowNumber",
      //   width: 50,
      //   editable: false,
      // },
      {
        title: "Scope of Advice",
        dataIndex: "scopeOfAdvice",
        key: "scopeOfAdvice",
        field: "scopeOfAdvice",
        type: "select",
        justText: true,
      },
      {
        title: "When",
        dataIndex: "when",
        key: "when",
        type: "select",
        options: WHEN_OPTIONS,
      },
      {
        title: "Estimated Value",
        dataIndex: "estimatedValue",
        key: "estimatedValue",
        field: "estimatedValue",
        type: "text",
        placeholder: "$0",
        onChange: (value, _record, column, currentForm) => {
          currentForm.setFieldValue(
            column.field,
            formatCurrencyValue(value?.target?.value ?? value),
          );
        },
      },
    ],
    [cardData],
  );

  const handleCancel = () => {
    if (editing && hasMeaningfulGoalData(initialValues)) {
      form.setFieldsValue(initialValues);
      setEditing(false);
      return;
    }

    modalData?.closeModal?.();
  };

  const handleConfirmAndExit = async () => {
    try {
      await form.validateFields();
      setSaving(true);

      const values = form.getFieldsValue(true);
      
      const nextDescription = String(
        formattedContentRef.current?.innerHTML ?? values?.description ?? "",
      ).trim();

      const payload = {
        ...currentGoalData,
        ...values,
        description: nextDescription,
        clientFK: currentGoalData?.clientFK || selectedClient?._id,
      };

      const saved =
        currentGoalData?.clientFK || currentGoalData?._id
          ? await patch(`/api/${goalKey}/Update`, payload)
          : await post(`/api/${goalKey}/Add`, payload);

      setGoalsData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [goalKey]: saved && typeof saved === "object" ? saved : payload,
      }));

      message.success(`${modalData?.title || "Goal"} saved successfully`);
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      if (error?.errorFields) return;

      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to save ${modalData?.title || "goal"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        colon={false}
        layout="vertical"
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={rows}
              tableProps={TABLE_PROPS}
            />
          </Col>

          <Col xs={24}>
            <Form.Item label="Description" style={{ marginBottom: 0 }}>
              {editing ? (
                <div
                  ref={formattedContentRef}
                  className="GoalsFromDiscription"
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onInput={(event) => {
                    form.setFieldValue(
                      "description",
                      event.currentTarget.innerHTML,
                    );
                  }}
                  style={{
                    minHeight: "10vh",
                    maxHeight: "45vh",
                    overflowY: "auto",
                    background: "#fff",
                    fontSize: "14px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                  }}
                />
              ) : (
                <div
                  className="GoalsFromDiscription"
                  style={{
                    minHeight: "10vh",
                    background: "#fafafa",
                    overflowY: "auto",
                    fontSize: "14px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {description ? parse(description) : null}
                </div>
              )}
            </Form.Item>
          </Col>

          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Space>
                {!editing ? (
                  <>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={handleConfirmAndExit}
                    >
                      Confirm & Exit
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
