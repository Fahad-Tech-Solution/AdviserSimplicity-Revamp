import { Button, Col, Divider, Form, Row, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const FREQUENCY_OPTIONS = [
  { label: "Weekly", value: 52 },
  { label: "Fortnightly", value: 26 },
  { label: "Monthly", value: 12 },
  { label: "Quarterly", value: 4 },
  { label: "Half Yearly", value: 2 },
  { label: "Annually", value: 1 },
];

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function normalizeFrequency(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function buildInitialValues(rowValues = {}) {
  const details = rowValues?.pensionPaymentDetails;
  const d =
    details && typeof details === "object" && !Array.isArray(details)
      ? details
      : {};
  return {
    regularAmount: d.regularAmount || rowValues?.pensionPayment || "",
    frequency: normalizeFrequency(d.frequency),
    total: d.total || "",
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return [
    initialValues?.regularAmount,
    initialValues?.frequency,
    initialValues?.total,
  ].some((v) => String(v ?? "").trim() !== "");
}

export default function SmsfAnnualPensionPaymentModal({ modalData }) {
  const renderTitleBlock = useTitleBlock();
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => buildInitialValues(modalData?.initialValues || {}),
    [modalData?.initialValues],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const regularAmount = Form.useWatch("regularAmount", form);
  const frequency = Form.useWatch("frequency", form);
  const total = Form.useWatch("total", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const recalculateTotal = (currentForm) => {
    const amt = parseCurrencyValue(currentForm.getFieldValue("regularAmount"));
    const freq = Number(currentForm.getFieldValue("frequency")) || 0;
    const product = amt * freq;
    currentForm.setFieldValue(
      "total",
      product ? toCommaAndDollar(product) : "",
    );
  };

  const rowData = useMemo(
    () => [
      {
        key: "annual-pension-payment",
        formPath: [],
        rowNumber: 1,
        regularAmount: regularAmount ?? initialValues?.regularAmount ?? "",
        frequency: frequency ?? initialValues?.frequency ?? "",
        total: total ?? initialValues?.total ?? "",
      },
    ],
    [frequency, initialValues, regularAmount, total],
  );

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      title: "Regular Amount",
      dataIndex: "regularAmount",
      key: "regularAmount",
      field: "regularAmount",
      type: "text",
      placeholder: "Regular Amount",
      onChange: (value, record, column, currentForm) => {
        const digits = parseDigitsValue(getChangedValue(value));
        currentForm.setFieldValue(
          "regularAmount",
          digits ? toCommaAndDollar(digits) : "",
        );
        recalculateTotal(currentForm);
      },
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      field: "frequency",
      type: "select",
      options: FREQUENCY_OPTIONS,
      placeholder: "Select Frequency",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue("frequency", value);
        recalculateTotal(currentForm);
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      field: "total",
      type: "text",
      disabled: true,
      placeholder: "Total",
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const totalValue = parseCurrencyValue(values?.total);
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const entry = {
      regularAmount: values.regularAmount || "",
      frequency: values.frequency ?? "",
      total: values.total || "",
    };
    const updatedRow = {
      ...currentRow,
      pensionPaymentDetails: entry,
      pensionPayment: totalValue ? toCommaAndDollar(totalValue) : "",
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
    modalData?.switchToEditMode?.();
  };

  return (
    <div style={{ padding: "0px 4px 0px 4px" }}>
      <div style={{ marginBottom: 12 }}>
        {renderTitleBlock({
          title: modalData?.title,
          icon: modalData?.icon || null,
          clossButton: true,
          onClose: () => modalData?.closeModal?.(),
          isEditing: editing,
        })}
        <Divider style={{ margin: "12px 0px 0px 0px" }} />
      </div>
      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={rowData}
              tableProps={TABLE_PROPS}
            />
          </Col>
          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <Space>
                {!editing ? (
                  <>
                    <Button onClick={() => modalData?.closeModal?.()}>
                      Cancel
                    </Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button type="primary" onClick={handleConfirmAndExit}>
                    Confirm and Exit
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
