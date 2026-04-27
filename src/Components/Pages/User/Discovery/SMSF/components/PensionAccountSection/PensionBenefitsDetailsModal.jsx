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

const PENSION_TYPE_OPTIONS = [
  { value: "Account Based", label: "Account Based" },
  { value: "TTR", label: "TTR" },
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

function hasMeaningfulValues(initialValues = {}) {
  return Object.values(initialValues || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim() !== "";
  });
}

export default function PensionBenefitsDetailsModal({ modalData }) {
  const renderTitleBlock = useTitleBlock();
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => modalData?.initialValues?.pensionBenefitsDetails || {},
    [modalData?.initialValues],
  );

  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const fundType = Form.useWatch("fundType", form);
  const portfolioValue = Form.useWatch("portfolioValue", form);
  const commencementDate = Form.useWatch("commencementDate", form);
  const eligibleServiceDate = Form.useWatch("eligibleServiceDate", form);
  const purchasePrice = Form.useWatch("purchasePrice", form);
  const taxFree = Form.useWatch("taxFree", form);
  const taxFreeComponent = Form.useWatch("taxFreeComponent", form);
  const taxableComponent = Form.useWatch("taxableComponent", form);
  const unrestrictedNonPreserved = Form.useWatch(
    "unrestrictedNonPreserved",
    form,
  );
  const restrictedNonPreserved = Form.useWatch("restrictedNonPreserved", form);
  const preservedAmount = Form.useWatch("preservedAmount", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "smsf-pension-benefits",
        formPath: [],
        rowNumber: 1,
        fundType: fundType ?? initialValues?.fundType ?? "",
        portfolioValue: portfolioValue ?? initialValues?.portfolioValue ?? "",
        commencementDate:
          commencementDate ?? initialValues?.commencementDate ?? "",
        eligibleServiceDate:
          eligibleServiceDate ?? initialValues?.eligibleServiceDate ?? "",
        purchasePrice: purchasePrice ?? initialValues?.purchasePrice ?? "",
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
      commencementDate,
      eligibleServiceDate,
      fundType,
      initialValues,
      portfolioValue,
      preservedAmount,
      purchasePrice,
      restrictedNonPreserved,
      taxFree,
      taxFreeComponent,
      taxableComponent,
      unrestrictedNonPreserved,
    ],
  );

  const recalculate = (currentForm, columnField, changedValue) => {
    if (columnField === "portfolioValue") {
      const digits = parseDigitsValue(getChangedValue(changedValue));
      currentForm.setFieldValue(
        "portfolioValue",
        digits ? toCommaAndDollar(digits) : "",
      );
    }
    if (columnField === "purchasePrice") {
      currentForm.setFieldValue(
        "purchasePrice",
        formatCurrencyValue(getChangedValue(changedValue)),
      );
    }
    if (columnField === "taxFree") {
      currentForm.setFieldValue("taxFree", formatPercentValue(changedValue));
    }
    if (columnField === "restrictedNonPreserved") {
      currentForm.setFieldValue(
        "restrictedNonPreserved",
        formatCurrencyValue(getChangedValue(changedValue)),
      );
    }
    if (columnField === "preservedAmount") {
      currentForm.setFieldValue(
        "preservedAmount",
        formatCurrencyValue(getChangedValue(changedValue)),
      );
    }

    const nextPortfolioValue = parseCurrencyValue(
      currentForm.getFieldValue("portfolioValue"),
    );
    const nextTaxFreePercent = parsePercentValue(
      currentForm.getFieldValue("taxFree"),
    );
    const nextRestricted = parseCurrencyValue(
      currentForm.getFieldValue("restrictedNonPreserved"),
    );
    const nextPreserved = parseCurrencyValue(
      currentForm.getFieldValue("preservedAmount"),
    );

    const nextTaxFreeComponent = nextPortfolioValue * (nextTaxFreePercent / 100);
    const nextTaxableComponent = nextPortfolioValue - nextTaxFreeComponent;
    const nextUnrestricted = nextPortfolioValue - (nextRestricted + nextPreserved);

    currentForm.setFieldValue(
      "taxFreeComponent",
      nextPortfolioValue ? toCommaAndDollar(nextTaxFreeComponent) : "",
    );
    currentForm.setFieldValue(
      "taxableComponent",
      nextPortfolioValue ? toCommaAndDollar(nextTaxableComponent) : "",
    );
    currentForm.setFieldValue(
      "unrestrictedNonPreserved",
      nextPortfolioValue ? toCommaAndDollar(nextUnrestricted) : "",
    );
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
      title: "Pension Type",
      dataIndex: "fundType",
      key: "fundType",
      field: "fundType",
      type: "select",
      options: PENSION_TYPE_OPTIONS,
      placeholder: "Select Pension Type",
    },
    {
      title: "Account Balance",
      dataIndex: "portfolioValue",
      key: "portfolioValue",
      field: "portfolioValue",
      type: "text",
      placeholder: "Account Balance",
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
      title: "Purchase Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      field: "purchasePrice",
      type: "text",
      placeholder: "Purchase Price",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Tax Free %",
      dataIndex: "taxFree",
      key: "taxFree",
      field: "taxFree",
      type: "text",
      placeholder: "Tax Free %",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Tax Free Component",
      dataIndex: "taxFreeComponent",
      key: "taxFreeComponent",
      field: "taxFreeComponent",
      type: "text",
      disabled: true,
      placeholder: "Tax Free Component",
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
      title: "Unrestricted Non Preserved",
      dataIndex: "unrestrictedNonPreserved",
      key: "unrestrictedNonPreserved",
      field: "unrestrictedNonPreserved",
      type: "text",
      disabled: true,
      placeholder: "Unrestricted Non Preserved",
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
      title: "Preserved Amount",
      dataIndex: "preservedAmount",
      key: "preservedAmount",
      field: "preservedAmount",
      type: "text",
      placeholder: "Preserved Amount",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const portfolioStr = values?.portfolioValue || "";
    const updatedRow = {
      ...currentRow,
      pensionBenefitsDetails: values,
      pensionBenefits: portfolioStr,
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
