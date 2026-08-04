import { Button, Col, Divider, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import DynamicFormField from "../../../../../../Common/DynamicFormField.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import AnnualAdviceModal from "../SuperFunds/AnnualAdviceModal.jsx";
import BeneficiariesModal from "../SuperFunds/BeneficiariesModal.jsx";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock.jsx";
import { confirmRemoveData } from "../../../../../../Common/confirmationModal.js";
import NattyAiScanCard from "../../../../../../Common/NattyAiScanCard.jsx";
import { parseAnnuityStatement } from "../../../../../../../utils/pdf/pdfParcing.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  pageSize: 5,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const SOURCE_OF_FUNDS_OPTIONS = [
  { value: "Ordinary", label: "Ordinary" },
  { value: "Super", label: "Super" },
];

const ANNUITY_TYPE_OPTIONS = [
  { value: "Fixed Term", label: "Fixed Term" },
  { value: "Lifetime", label: "Lifetime" },
];

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  value: String(index + 1),
  label: `Year ${index + 1}`,
}));

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function buildInitialValues(ownerArray = []) {
  return {
    NumberOfMap: ownerArray.length || undefined,
    annuities: ownerArray,
  };
}

function buildAnnuityEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => {
    const entry = entries?.[index] || {};
    return {
      productProvider: normalizeSelectValue(entry?.productProvider),
      accountNumber: entry?.accountNumber || "",
      sourceFunds: normalizeSelectValue(entry?.sourceFunds),
      originalInvestmentAmount: entry?.originalInvestmentAmount || "",
      returnCapitalValue: entry?.returnCapitalValue || "",
      annualAnnuityPayment: entry?.annualAnnuityPayment || "",
      annualAnnuityPaymentArray:
        entry?.annualAnnuityPaymentArray &&
          typeof entry.annualAnnuityPaymentArray === "object"
          ? entry.annualAnnuityPaymentArray
          : {},
      annuityType: normalizeSelectValue(entry?.annuityType),
      term: normalizeSelectValue(entry?.term),
      yearsMaturity: normalizeSelectValue(entry?.yearsMaturity),
      nominatedBeneficiaries: entry?.nominatedBeneficiaries || "No",
      nominatedBeneficiariesDetails:
        entry?.nominatedBeneficiariesDetails &&
          typeof entry.nominatedBeneficiariesDetails === "object"
          ? entry.nominatedBeneficiariesDetails
          : {},
      annualAdvice: entry?.annualAdvice || "",
      annualAdviceArray:
        entry?.annualAdviceArray && typeof entry.annualAdviceArray === "object"
          ? entry.annualAdviceArray
          : {},
    };
  });
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.annuities || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.productProvider,
      row?.accountNumber,
      row?.sourceFunds,
      row?.originalInvestmentAmount,
      row?.returnCapitalValue,
      row?.annualAnnuityPayment,
      row?.annuityType,
      row?.term,
      row?.yearsMaturity,
      row?.nominatedBeneficiaries,
      row?.annualAdvice,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function buildProviderOptions(investmentOffers, entries = []) {
  const providers = investmentOffers?.Annuities || [];
  const options = providers.map((item) => ({
    value: String(item?._id ?? item?.value ?? ""),
    label: item?.platformName || item?.label || item?.name || item?._id || "",
  }));

  entries.forEach((entry) => {
    const currentValue = normalizeSelectValue(entry?.productProvider);
    if (
      currentValue &&
      !options.some((option) => String(option.value) === currentValue)
    ) {
      options.unshift({ value: currentValue, label: currentValue });
    }
  });

  return options.filter((option) => option.value && option.label);
}

function getOptionLabel(options = [], value) {
  return (
    options.find((option) => String(option.value) === String(value))?.label ||
    value ||
    ""
  );
}

function resolveSorterKey(sorter) {
  return (
    sorter?.field ||
    sorter?.columnKey ||
    sorter?.column?.dataIndex ||
    sorter?.column?.key ||
    null
  );
}

function SwitchPopupDisplay({ value, onClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{value || "No"}</span>
      {value === "Yes" ? (
        <Button
          type="primary"
          size="small"
          style={{ width: 25, padding: 0 }}
          onClick={onClick}
        >
          ↗
        </Button>
      ) : null}
    </div>
  );
}

export default function Annuities({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [sortState, setSortState] = useState({
    columnKey: null,
    order: null,
  });
  const renderTitleBlock = useTitleBlock();
  const [scanTargetRow, setScanTargetRow] = useState(1);

  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];

  const initialValues = useMemo(
    () => buildInitialValues(ownerArray),
    [ownerArray],
  );
  const count = Form.useWatch("NumberOfMap", form);
  const watchedAnnuities = Form.useWatch("annuities", form);
  const providerOptions = useMemo(
    () =>
      buildProviderOptions(investmentOffers, initialValues?.annuities || []),
    [initialValues?.annuities, investmentOffers],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    if (!editing) return;
    setSortState({
      columnKey: null,
      order: null,
    });
  }, [editing]);

  const getStoredAnnuities = useCallback(
    () => form.getFieldValue("annuities") || initialValues.annuities || [],
    [form, initialValues.annuities],
  );

  const rows = useMemo(
    () =>
      buildAnnuityEntries(Number(count) || 0, getStoredAnnuities()).map(
        (item, index) => ({
          key: `${modalData?.ownerKey || "owner"}-annuity-${index}`,
          formPath: ["annuities", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, getStoredAnnuities, modalData?.ownerKey, watchedAnnuities],
  );

  const sortedRows = useMemo(() => {
    if (
      editing ||
      sortState?.columnKey !== "originalInvestmentAmount" ||
      !sortState?.order
    ) {
      return rows;
    }

    const compare = (a, b) =>
      parseCurrencyValue(a?.originalInvestmentAmount) -
      parseCurrencyValue(b?.originalInvestmentAmount);

    const multiplier = sortState.order === "descend" ? -1 : 1;
    return [...rows].sort((a, b) => compare(a, b) * multiplier);
  }, [editing, rows, sortState]);

  const syncParentValues = (nextEntries) => {
    const totalBalance = nextEntries.reduce(
      (total, item) =>
        total + parseCurrencyValue(item?.originalInvestmentAmount),
      0,
    );

    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalanceArray"],
      nextEntries,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalance"],
      totalBalance ? toCommaAndDollar(totalBalance) : "",
    );
  };

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "annuities",
      buildAnnuityEntries(nextCount, getStoredAnnuities()),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("annuities") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("annuities", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const openDetailModal = useCallback(
    (type, { record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};
      const selectedProvider = normalizeSelectValue(rowValues?.productProvider);

      if (!selectedProvider) {
        message.error("Please select provider name first");
        return;
      }

      const provider =
        investmentOffers?.Annuities?.find(
          (item) => String(item?._id) === selectedProvider,
        ) || null;

      const providerLabel = getOptionLabel(providerOptions, selectedProvider);
      const commonData = {
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        providerLabel,
        platform: provider,
        closeModal: () => {
          setDetailModalOpen(false);
        },
        switchToEditMode: () => setEditing(true),
        noCancelButton: true,
      };

      const detailMap = {
        annualAnnuityPayment: {
          title: `${modalData?.ownerLabel || "Owner"}_${providerLabel}_Annual Annuity Payment`,
          width: 760,
          component: <AnnualAdviceModal />,
          valueKey: "annualAnnuityPayment",
          arrayKey: "annualAnnuityPaymentArray",
          feeLabel: "Annuity Payment",
          totalLabel: "Annual Annuity Payment",
        },
        nominatedBeneficiaries: {
          title: `${modalData?.ownerLabel || "Owner"}_${providerLabel}_Beneficiaries`,
          width: 1180,
          component: <BeneficiariesModal />,
        },
        annualAdvice: {
          title: `${modalData?.ownerLabel || "Owner"}_${providerLabel}_Annual Ongoing Fee`,
          width: 760,
          component: <AnnualAdviceModal />,
          valueKey: "annualAdvice",
          arrayKey: "annualAdviceArray",
          feeLabel: "Ongoing Fee",
          totalLabel: "Annual Ongoing Fee",
        },
      };

      setDetailModalOpen(true);
      setDetailModalData({
        ...commonData,
        ...(detailMap[type] || {}),
      });
    },
    [investmentOffers?.Annuities, modalData?.ownerLabel, providerOptions],
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
      title: "Product Provider",
      dataIndex: "productProvider",
      key: "productProvider",
      field: "productProvider",
      type: "select",
      options: providerOptions,
      placeholder: "Select Provider",
    },
    {
      title: "Account Number",
      dataIndex: "accountNumber",
      key: "accountNumber",
      field: "accountNumber",
      type: "text",
      placeholder: "Account Number",
    },
    {
      title: "Source of Funds",
      dataIndex: "sourceFunds",
      key: "sourceFunds",
      field: "sourceFunds",
      type: "select",
      options: SOURCE_OF_FUNDS_OPTIONS,
      placeholder: "Select Source",
    },
    {
      title: "Initial Investment",
      dataIndex: "originalInvestmentAmount",
      key: "originalInvestmentAmount",
      field: "originalInvestmentAmount",
      type: "text",
      placeholder: "Initial Investment",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
      sorter: (a, b) =>
        parseCurrencyValue(a?.originalInvestmentAmount) -
        parseCurrencyValue(b?.originalInvestmentAmount),
      sortOrder:
        sortState.columnKey === "originalInvestmentAmount"
          ? sortState.order
          : undefined,
    },
    {
      title: "Return of Capital Value",
      dataIndex: "returnCapitalValue",
      key: "returnCapitalValue",
      field: "returnCapitalValue",
      type: "text",
      placeholder: "Return of Capital",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Annual Annuity Payment",
      dataIndex: "annualAnnuityPayment",
      key: "annualAnnuityPayment",
      field: "annualAnnuityPayment",
      disabled: true,
      type: "input-action",
      placeholder: "Annual Annuity Payment",
      action: {
        name: "Open Annual Annuity Payment",
        onClick: (payload) => openDetailModal("annualAnnuityPayment", payload),
      },
    },
    {
      title: "Annuity Type",
      dataIndex: "annuityType",
      key: "annuityType",
      field: "annuityType",
      type: "select",
      options: ANNUITY_TYPE_OPTIONS,
      placeholder: "Select Type",
      onChange: (value, record, column, currentForm) => {
        const nextValue = normalizeSelectValue(value);
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextValue,
        );
        if (nextValue === "Lifetime") {
          currentForm.setFieldValue([...record.formPath, "term"], "");
          currentForm.setFieldValue([...record.formPath, "yearsMaturity"], "");
        }
      },
    },
    {
      title: "Term",
      dataIndex: "term",
      key: "term",
      field: "term",
      renderEdit: ({ record, column, form: currentForm }) => (
        <DynamicFormField
          form={currentForm}
          name={[...record.formPath, column.field]}
          type="select"
          options={YEAR_OPTIONS}
          placeholder="Select Term"
          disabled={
            currentForm.getFieldValue([...record.formPath, "annuityType"]) ===
            "Lifetime"
          }
          formItemProps={{ style: { marginBottom: 0 } }}
        />
      ),
    },
    {
      title: "Years to Maturity",
      dataIndex: "yearsMaturity",
      key: "yearsMaturity",
      field: "yearsMaturity",
      renderEdit: ({ record, column, form: currentForm }) => (
        <DynamicFormField
          form={currentForm}
          name={[...record.formPath, column.field]}
          type="select"
          options={YEAR_OPTIONS}
          placeholder="Select Years"
          disabled={
            currentForm.getFieldValue([...record.formPath, "annuityType"]) ===
            "Lifetime"
          }
          formItemProps={{ style: { marginBottom: 0 } }}
        />
      ),
    },
    {
      title: "Beneficiaries",
      dataIndex: "nominatedBeneficiaries",
      key: "nominatedBeneficiaries",
      field: "nominatedBeneficiaries",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Beneficiaries",
        onClick: (payload) =>
          openDetailModal("nominatedBeneficiaries", payload),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() =>
            openDetailModal("nominatedBeneficiaries", { record, form })
          }
        />
      ),
    },
    {
      title: "Annual Advice Fee",
      dataIndex: "annualAdvice",
      key: "annualAdvice",
      field: "annualAdvice",
      disabled: true,
      type: "input-action",
      placeholder: "Annual Advice Fee",
      action: {
        name: "Open Annual Advice Fee",
        onClick: (payload) => openDetailModal("annualAdvice", payload),
      },
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      editable: false,
      renderView: () => "--",
      renderEdit: ({ record }) => (
        <Button
          type="text"
          danger
          aria-label={`Remove row ${record?.rowNumber}`}
          onClick={() => confirmRemoveData(() => handleRemoveRow((record?.rowNumber || 1) - 1))}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildAnnuityEntries(
      countValue,
      values?.annuities || [],
    );

    syncParentValues(savedEntries);
    // setEditing(false);
    modalData?.closeModal?.();
    modalData?.switchToEditMode?.();
  };

  const handleTableChange = (_pagination, _filters, sorter) => {
    const nextSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setSortState({
      columnKey: resolveSorterKey(nextSorter),
      order: nextSorter?.order || null,
    });
  };

  const fundOptions = useMemo(
    () =>
      buildProviderOptions(
        investmentOffers,
        initialValues?.annuities || [],
      ),
    [initialValues?.annuities, investmentOffers],
  );

  const ANNUITY_PDF_SCAN_KEYS = [
    {
      key: "productProvider",
      type: "text",
      labels: [
        "Product Provider",
        "Provider",
        "Issuer",
        "Institution",
        "Challenger",
        "TAL",
        "CommInsure",
        "Resolution Life",
        "Allianz",
        "Fiducian",
      ],
    },
    {
      key: "accountNumber",
      type: "id",
      labels: [
        "Account Number",
        "Account No",
        "Policy Number",
        "Policy No",
        "Contract Number",
        "Contract No",
        "Reference Number",
      ],
    },
    {
      key: "sourceFunds",
      type: "text",
      labels: [
        "Source of Funds",
        "Fund Source",
        "Purchase Source",
        "Superannuation",
        "Non-Superannuation",
      ],
    },
    {
      key: "originalInvestmentAmount",
      type: "currency",
      labels: [
        "Initial Investment",
        "Original Investment Amount",
        "Purchase Price",
        "Initial Deposit",
        "Capital Amount",
        "Investment Amount",
      ],
    },
    {
      key: "returnCapitalValue",
      type: "currency",
      labels: [
        "Return of Capital Value",
        "Return of Capital",
        "Capital Value",
        "Residual Capital Value",
        "RCV",
        "Guaranteed Withdrawal Value",
      ],
    },
    {
      key: "annualAnnuityPayment",
      type: "currency",
      labels: [
        "Annual Annuity Payment",
        "Annuity Payment",
        "Annual Payment Amount",
        "Regular Income",
        "Annual Payment",
        "Payment Amount",
      ],
    },
    {
      key: "annuityType",
      type: "text",
      labels: [
        "Annuity Type",
        "Type of Annuity",
        "Plan Type",
        "Lifetime",
        "Term Certain",
        "Fixed Term",
      ],
    },
    {
      key: "term",
      type: "text",
      labels: [
        "Term",
        "Annuity Term",
        "Contract Term",
        "Term Duration",
        "Term (Years)",
      ],
    },
    {
      key: "yearsMaturity",
      type: "text",
      labels: [
        "Years to Maturity",
        "Maturity Period",
        "Remaining Term",
        "Years Remaining",
      ],
    },
    {
      key: "nominatedBeneficiaries",
      type: "text",
      labels: [
        "Beneficiaries",
        "Nominated Beneficiaries",
        "Reversionary Beneficiary",
      ],
    },
    {
      key: "annualAdvice",
      type: "currency",
      labels: [
        "Annual Advice Fee",
        "Ongoing Advice Fee",
        "Advice Fee",
        "Adviser Fee",
        "Annual Fee",
      ],
    },
  ];

  const resolveSuperFundScanValue = useCallback(
    (key, rawValue) => {
      if (key !== "platformName") return rawValue;

      const normalized = String(rawValue || "").trim().toLowerCase();
      if (!normalized) return rawValue;

      const exactMatch = fundOptions.find(
        (option) => String(option.label).trim().toLowerCase() === normalized,
      );
      if (exactMatch) return exactMatch.value;

      const partialMatch = fundOptions.find((option) => {
        const label = String(option.label).trim().toLowerCase();
        return label.includes(normalized) || normalized.includes(label);
      });
      return partialMatch?.value || rawValue;
    },
    [fundOptions],
  );


  const handleScanComplete = (extractedJson) => {
    console.log("Extracted Annuities JSON:", extractedJson);

    // Set form fields with extracted annuity data
    form.setFieldsValue(extractedJson);

    // Sync with parent form state
    syncParentValues([extractedJson]);

    // Force form to stay in edit mode
    setEditing(true);
  };


  return (
    <div style={{ padding: "0px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        noCancelButton={detailModalData?.noCancelButton || false}
        width={detailModalData?.width || 1000}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

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

          {editing ? (
            <NattyAiScanCard
              title="Natty AI - Scan Annuity Statement(s)"
              subtitle="Drag & drop annuity statements here, or click Scan PDF(s). Auto-fills provider, account number, investments, payments, and fees."
              parseFunction={parseAnnuityStatement}
              onScanComplete={handleScanComplete}
            />
          ) : null}


          <Col xs={24} md={4}>
            <Form.Item
              label="Number of Annuities"
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: modalData?.tableRows || 3 },
                  (_, index) => ({ value: index + 1, label: index + 1 }),
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={sortedRows}
              tableProps={{
                ...TABLE_PROPS,
                onChange: handleTableChange,
              }}
            />
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
