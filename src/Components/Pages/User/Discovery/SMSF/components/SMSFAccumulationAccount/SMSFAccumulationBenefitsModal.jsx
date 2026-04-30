import { Button, Col, Form, Divider, Row, Space } from "antd";
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

function formatPercentValue(value) {
  const digits = parseDigitsValue(getChangedValue(value));
  if (!digits) return "";
  return `${Math.min(Number(digits), 100)}%`;
}

function parsePercentValue(value) {
  return Math.min(
    Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0,
    100,
  );
}

function buildInitialValues(rowValues = {}) {
  const raw = Array.isArray(rowValues?.accumulationBenefitsArray)
    ? rowValues.accumulationBenefitsArray[0] || {}
    : rowValues?.accumulationBenefitsArray || {};

  const accountBalance =
    raw?.accountBalance ||
    raw?.currentBalance ||
    rowValues?.accumulationBenefits ||
    "";
  const taxFreeComponent = raw?.taxFreeComponent || "";
  const taxableComponent = raw?.taxableComponent || "";
  const restrictedNonPreserved = raw?.restrictedNonPreserved || "";
  const unrestrictedNonPreserved =
    raw?.unrestrictedNonPreserved || raw?.unRestrictedNonPreserved || "";
  const preservedAmount = raw?.preservedAmount || "";
  const taxFreePercent = parseCurrencyValue(accountBalance)
    ? `${Math.min(
        100,
        (
          (parseCurrencyValue(taxFreeComponent) /
            parseCurrencyValue(accountBalance)) *
          100
        ).toFixed(2),
      )}%`
    : "";

  return {
    accountBalance,
    commencementDate: raw?.commencementDate || "",
    eligibleServiceDate: raw?.eligibleServiceDate || "",
    taxFree: taxFreePercent,
    taxFreeComponent,
    taxableComponent,
    unrestrictedNonPreserved,
    restrictedNonPreserved,
    preservedAmount,
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return Object.values(initialValues || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim() !== "";
  });
}

export default function SMSFAccumulationBenefitsModal({ modalData }) {
  const renderTitleBlock = useTitleBlock();
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => buildInitialValues(modalData?.initialValues || {}),
    [modalData?.initialValues],
  );

  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const accountBalance = Form.useWatch("accountBalance", form);
  const taxFree = Form.useWatch("taxFree", form);
  const taxFreeComponent = Form.useWatch("taxFreeComponent", form);
  const taxableComponent = Form.useWatch("taxableComponent", form);
  const unrestrictedNonPreserved = Form.useWatch(
    "unrestrictedNonPreserved",
    form,
  );
  const restrictedNonPreserved = Form.useWatch("restrictedNonPreserved", form);
  const preservedAmount = Form.useWatch("preservedAmount", form);
  const commencementDate = Form.useWatch("commencementDate", form);
  const eligibleServiceDate = Form.useWatch("eligibleServiceDate", form);
  const formSnapshot = Form.useWatch([], form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "smsf-accumulation-benefits",
        formPath: [],
        rowNumber: 1,
        accountBalance: accountBalance ?? initialValues?.accountBalance ?? "",
        commencementDate:
          commencementDate ?? initialValues?.commencementDate ?? "",
        eligibleServiceDate:
          eligibleServiceDate ?? initialValues?.eligibleServiceDate ?? "",
        taxFree: taxFree ?? initialValues?.taxFree ?? "",
        taxFreeComponent:
          taxFreeComponent ?? initialValues?.taxFreeComponent ?? "",
        taxableComponent:
          taxableComponent ?? initialValues?.taxableComponent ?? "",
        unrestrictedNonPreserved:
          unrestrictedNonPreserved ??
          initialValues?.unrestrictedNonPreserved ??
          "",
        restrictedNonPreserved:
          restrictedNonPreserved ?? initialValues?.restrictedNonPreserved ?? "",
        preservedAmount:
          preservedAmount ?? initialValues?.preservedAmount ?? "",
      },
    ],
    [
      accountBalance,
      commencementDate,
      eligibleServiceDate,
      formSnapshot,
      initialValues,
      preservedAmount,
      restrictedNonPreserved,
      taxFree,
      taxFreeComponent,
      taxableComponent,
      unrestrictedNonPreserved,
    ],
  );

  const recalculate = (currentForm, columnField, changedValue) => {
    try {
      const rawChangedValue = getChangedValue(changedValue);

      if (
        [
          "accountBalance",
          "taxFreeComponent",
          "restrictedNonPreserved",
          "unrestrictedNonPreserved",
        ].includes(columnField)
      ) {
        currentForm.setFieldValue(
          columnField,
          formatCurrencyValue(rawChangedValue),
        );
      }

      const nextAccountBalance =
        columnField === "accountBalance"
          ? parseCurrencyValue(rawChangedValue)
          : parseCurrencyValue(currentForm.getFieldValue("accountBalance"));
      const nextTaxFreeComponent =
        columnField === "taxFreeComponent"
          ? parseCurrencyValue(rawChangedValue)
          : parseCurrencyValue(currentForm.getFieldValue("taxFreeComponent"));
      const nextRestricted =
        columnField === "restrictedNonPreserved"
          ? parseCurrencyValue(rawChangedValue)
          : parseCurrencyValue(currentForm.getFieldValue("restrictedNonPreserved"));
      const nextUnrestricted =
        columnField === "unrestrictedNonPreserved"
          ? parseCurrencyValue(rawChangedValue)
          : parseCurrencyValue(currentForm.getFieldValue("unrestrictedNonPreserved"));

      const nextTaxableComponent = nextAccountBalance - nextTaxFreeComponent;
      const nextPreservedAmount =
        nextAccountBalance - nextRestricted - nextUnrestricted;
      const nextTaxFreePercent = nextAccountBalance
        ? `${Math.min(
            100,
            ((nextTaxFreeComponent / nextAccountBalance) * 100).toFixed(2),
          )}%`
        : "";

      currentForm.setFieldValue(
        "taxableComponent",
        nextAccountBalance ? toCommaAndDollar(nextTaxableComponent) : "",
      );
      currentForm.setFieldValue(
        "preservedAmount",
        nextAccountBalance ? toCommaAndDollar(nextPreservedAmount) : "",
      );
      currentForm.setFieldValue("taxFree", nextTaxFreePercent);
    } catch (error) {
      console.error("Failed to recalculate accumulation benefits:", error);
    }
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      // title: "Accumulation Balance",
      title: "Current Balance",
      dataIndex: "accountBalance",
      key: "accountBalance",
      field: "accountBalance",
      type: "text",
      placeholder: "Accumulation Balance",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Commencement Date",
      dataIndex: "commencementDate",
      key: "commencementDate",
      field: "commencementDate",
      type: "date",
    },
    {
      title: "Eligible Service Date",
      dataIndex: "eligibleServiceDate",
      key: "eligibleServiceDate",
      field: "eligibleServiceDate",
      type: "date",
    },
    {
      title: "Tax Free Component",
      dataIndex: "taxFreeComponent",
      key: "taxFreeComponent",
      field: "taxFreeComponent",
      type: "text",
      placeholder: "Tax Free Component",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Taxable Component",
      dataIndex: "taxableComponent",
      key: "taxableComponent",
      field: "taxableComponent",
      type: "text",
      disabled: true,
      placeholder: "Taxable Component",
    },

    {
      title: "Restricted Non Preserved",
      dataIndex: "restrictedNonPreserved",
      key: "restrictedNonPreserved",
      field: "restrictedNonPreserved",
      type: "text",
      placeholder: "Restricted Non Preserved",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Unrestricted Non Preserved",
      dataIndex: "unrestrictedNonPreserved",
      key: "unrestrictedNonPreserved",
      field: "unrestrictedNonPreserved",
      type: "text",
      placeholder: "Unrestricted Non Preserved",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Preserved Amount",
      dataIndex: "preservedAmount",
      key: "preservedAmount",
      field: "preservedAmount",
      type: "text",
      disabled: true,
      placeholder: "Preserved Amount",
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};

    const accumulationBalance = values?.accountBalance || "";
    const legacyEntry = {
      currentBalance: values?.accountBalance || "",
      commencementDate: values?.commencementDate || "",
      eligibleServiceDate: values?.eligibleServiceDate || "",
      taxFreeComponent: values?.taxFreeComponent || "",
      taxableComponent: values?.taxableComponent || "",
      restrictedNonPreserved: values?.restrictedNonPreserved || "",
      unRestrictedNonPreserved: values?.unrestrictedNonPreserved || "",
      unrestrictedNonPreserved: values?.unrestrictedNonPreserved || "",
      preservedAmount: values?.preservedAmount || "",
    };
    const updatedRow = {
      ...currentRow,
      accumulationBenefits: accumulationBalance,
      accumulationBenefitsArray: [legacyEntry],
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
    modalData?.switchToEditMode?.();
    modalData?.noCancelButton?.();
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
                    Save
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
