import { Button, Col, Divider, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import NattyAiScanCard from "../../../../../../Common/NattyAiScanCard";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import SuperFundsBalanceBenefitModal from "./SuperFundsBalanceBenefitModal.jsx";
import SuperFundsGroupInsuranceModal from "./SuperFundsGroupInsuranceModal.jsx";
import BeneficiariesModal from "./BeneficiariesModal.jsx";
import ContributionsModal from "./ContributionsModal.jsx";
import AnnualAdviceModal from "./AnnualAdviceModal.jsx";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock.jsx";
import { confirmRemoveData } from "../../../../../../Common/confirmationModal.js";
import NattyAiScanCardTestSample from "../../../../../../Common/NattyAiScanCardTestSample.jsx";
import { parseSuperStatement } from "../../../../../../../utils/pdf/pdfParcing.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  pageSize: 5,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const SUPER_PDF_SCAN_KEYS = [
  {
    key: "platformName",
    labels: [
      "Fund Name",
      "Super Fund",
      "Superannuation Fund",
      "Fund",
      "Provider",
      "Your fund",
      "Fund provider",
      "AustralianSuper",
      "Australian Super",
      "Aus Super",
      "REST Super",
      "Hostplus",
      "HESTA",
      "UniSuper",
      "CBUS",
      "Aware Super",
      "Colonial First State",
      "MLC",
      "AMP",
    ],
  },
  {
    key: "memberNumber",
    labels: [
      "Member number",
      "Member Number",
      "Member No",
      "Member no",
      "Membership Number",
      "Membership No",
      "Member #",
      "Member ID",
      "Member account number",
      "Account number",
      "Membership no",
    ],
  },
  {
    key: "balanceBenefit",
    labels: [
      "Balance",
      "Your balance",
      "Total Benefit Amount",
      "Account Balance",
      "Total Balance",
      "Super Balance",
      "Closing Balance",
      "Total Account Balance",
      "Current Balance",
      "Balance and Benefits",
      "Accumulation balance",
      "Total value",
      "Benefit balance",
      "Member balance",
    ],
  },
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

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function buildInitialValues(ownerArray = []) {
  return {
    NumberOfMap: ownerArray.length || undefined,
    superFunds: ownerArray,
  };
}

function buildSuperFundEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => {
    const entry = entries?.[index] || {};
    return {
      platformName: normalizeSelectValue(entry?.platformName),
      memberNumber: entry?.memberNumber || "",
      balanceBenefit: entry?.balanceBenefit || "",
      balanceBenefitDetails:
        entry?.balanceBenefitDetails &&
          typeof entry.balanceBenefitDetails === "object"
          ? entry.balanceBenefitDetails
          : {},
      groupInsurance: entry?.groupInsurance || "No",
      groupInsuranceDetails:
        entry?.groupInsuranceDetails &&
          typeof entry.groupInsuranceDetails === "object"
          ? entry.groupInsuranceDetails
          : {},
      contributions: entry?.contributions || "No",
      contributionsArray: Array.isArray(entry?.contributionsArray)
        ? entry.contributionsArray
        : [],
      contributionsStartYear: entry?.contributionsStartYear || undefined,
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
  const rows = initialValues?.superFunds || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.platformName,
      row?.memberNumber,
      row?.balanceBenefit,
      row?.groupInsurance,
      row?.contributions,
      row?.nominatedBeneficiaries,
      row?.annualAdvice,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function buildFundOptions(investmentOffers, entries = []) {
  const offers =
    investmentOffers &&
      typeof investmentOffers === "object" &&
      !Array.isArray(investmentOffers)
      ? investmentOffers
      : {};

  const funds = offers.SuperannuationFunds || [];
  const options = funds.map((item) => ({
    value: String(item?._id ?? item?.value ?? ""),
    label: item?.platformName || item?.label || item?.name || item?._id || "",
  }));

  entries.forEach((entry) => {
    const currentValue = normalizeSelectValue(entry?.platformName);
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

export default function SuperFunds({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [sortState, setSortState] = useState({
    columnKey: null,
    order: null,
  });
  const [scanTargetRow, setScanTargetRow] = useState(1);
  const renderTitleBlock = useTitleBlock();
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
  const watchedSuperFunds = Form.useWatch("superFunds", form);
  const fundOptions = useMemo(
    () => buildFundOptions(investmentOffers, initialValues?.superFunds || []),
    [initialValues?.superFunds, investmentOffers],
  );

  useEffect(() => {
    // Only set initial values if form is pristine / empty
    const currentValues = form.getFieldValue("superFunds");
    if (!currentValues || currentValues.length === 0) {
      form.setFieldsValue(initialValues);
      setEditing(!hasMeaningfulValues(initialValues));
    }
  }, [form, initialValues]);

  useEffect(() => {
    if (!editing) return;
    setSortState({
      columnKey: null,
      order: null,
    });
  }, [editing]);

  const getStoredSuperFunds = useCallback(
    () => form.getFieldValue("superFunds") || initialValues.superFunds || [],
    [form, initialValues.superFunds],
  );

  const rows = useMemo(
    () =>
      buildSuperFundEntries(Number(count) || 0, getStoredSuperFunds()).map(
        (item, index) => ({
          key: `${modalData?.ownerKey || "owner"}-super-${index}`,
          formPath: ["superFunds", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, getStoredSuperFunds, modalData?.ownerKey, watchedSuperFunds],
  );

  const sortedRows = useMemo(() => {
    if (
      editing ||
      sortState?.columnKey !== "balanceBenefit" ||
      !sortState?.order
    ) {
      return rows;
    }

    const compare = (a, b) =>
      parseCurrencyValue(a?.balanceBenefit) -
      parseCurrencyValue(b?.balanceBenefit);

    const multiplier = sortState.order === "descend" ? -1 : 1;
    return [...rows].sort((a, b) => compare(a, b) * multiplier);
  }, [editing, rows, sortState]);

  const syncParentValues = (nextEntries) => {
    const totalBalance = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.balanceBenefit),
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
      "superFunds",
      buildSuperFundEntries(nextCount, getStoredSuperFunds()),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("superFunds") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("superFunds", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const openDetailModal = useCallback(
    (type, { record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};
      const selectedFund = normalizeSelectValue(rowValues?.platformName);

      if (!selectedFund) {
        message.error("Please select fund name first");
        return;
      }

      const fund =
        investmentOffers?.SuperannuationFunds?.find(
          (item) => String(item?._id) === selectedFund,
        ) || null;

      const fundLabel = getOptionLabel(fundOptions, selectedFund);

      const commonData = {
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        fundLabel,
        platform: fund,
        closeModal: () => {
          setDetailModalOpen(false);
        },
        switchToEditMode: () => setEditing(true),
        noCancelButton: true,
      };

      const detailMap = {
        balanceBenefit: {
          title: `${modalData?.ownerLabel || "Owner"}_${fundLabel}_Balance and Benefits`,
          width: 1280,
          ownerLabel: modalData?.ownerLabel,
          component: <SuperFundsBalanceBenefitModal />,
        },
        groupInsurance: {
          title: `${modalData?.ownerLabel || "Owner"}_${fundLabel}_Group Insurance`,
          width: 1280,
          component: <SuperFundsGroupInsuranceModal />,
        },
        contributions: {
          title: `${modalData?.ownerLabel || "Owner"}_${fundLabel}_Contributions`,
          width: 1000,
          component: <ContributionsModal />,
        },
        nominatedBeneficiaries: {
          title: `${modalData?.ownerLabel || "Owner"}_${fundLabel}_Beneficiaries`,
          width: 1180,
          component: <BeneficiariesModal />,
        },
        annualAdvice: {
          title: `${modalData?.ownerLabel || "Owner"}_${fundLabel}_Ongoing Annual Fee`,
          width: 760,
          component: <AnnualAdviceModal />,
        },
      };

      setDetailModalOpen(true);
      setDetailModalData({
        ...commonData,
        ...(detailMap[type] || {}),
      });
    },
    [fundOptions, investmentOffers?.SuperannuationFunds, modalData?.ownerLabel],
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
      title: "Fund Name",
      dataIndex: "platformName",
      key: "platformName",
      field: "platformName",
      type: "select",
      options: fundOptions,
      placeholder: "Select Fund",
      onChange: (value, record, column, currentForm) => {
        const nextValue = normalizeSelectValue(value);
        const currentValue = normalizeSelectValue(
          record.platformName,
        );

        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextValue,
        );

        if (currentValue && currentValue !== nextValue) {
          currentForm.setFieldValue([...record.formPath], {
            ...record,
            platformName: nextValue,
            balanceBenefitDetails: {
              ...record.balanceBenefitDetails,
              portfolioArray: [],
              portfolioValue: []
            },
          });
        }
      },
    },
    {
      title: "Member Number",
      dataIndex: "memberNumber",
      key: "memberNumber",
      field: "memberNumber",
      type: "text",
      placeholder: "Member Number",
    },
    {
      title: "Balance and Details",
      dataIndex: "balanceBenefit",
      key: "balanceBenefit",
      field: "balanceBenefit",
      disabled: true,
      type: "input-action",
      placeholder: "Balance Benefit",
      action: {
        name: "Open Balance and Details",
        onClick: (payload) => openDetailModal("balanceBenefit", payload),
      },
      sorter: (a, b) =>
        parseCurrencyValue(a?.balanceBenefit) -
        parseCurrencyValue(b?.balanceBenefit),
      sortOrder:
        sortState.columnKey === "balanceBenefit" ? sortState.order : undefined,
    },
    {
      title: "Insurance",
      dataIndex: "groupInsurance",
      key: "groupInsurance",
      field: "groupInsurance",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Insurance",
        onClick: (payload) => openDetailModal("groupInsurance", payload),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => openDetailModal("groupInsurance", { record, form })}
        />
      ),
    },
    {
      title: "Contributions",
      dataIndex: "contributions",
      key: "contributions",
      field: "contributions",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Contributions",
        onClick: (payload) => openDetailModal("contributions", payload),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => openDetailModal("contributions", { record, form })}
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
      title: "Ongoing Advice Fee",
      dataIndex: "annualAdvice",
      key: "annualAdvice",
      field: "annualAdvice",
      disabled: true,
      type: "input-action",
      placeholder: "Ongoing Advice Fee",
      action: {
        name: "Open Ongoing Fee",
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
    const savedEntries = buildSuperFundEntries(
      countValue,
      values?.superFunds || [],
    );

    syncParentValues(savedEntries);
    setEditing(true);
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

  // Handle scanned data populating the parent form directly
  const handleScanComplete = (extractedJson) => {
    console.log("Full Nested Extracted JSON:", extractedJson);

    // 1. Prepare formatted entries array
    const scannedFundEntries = buildSuperFundEntries(1, [extractedJson]);

    // 2. Set local modal form state (updates the EditableDynamicTable)
    form.setFieldsValue({
      NumberOfMap: 1,
      superFunds: scannedFundEntries,
    });

    // 3. Sync values back up to parent form
    syncParentValues(scannedFundEntries);

    // 4. Force state to stay in edit mode
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
            // <NattyAiScanCardTestSample onScanComplete={handleScanComplete} />
            <NattyAiScanCard
              title="Natty AI - Scan Super Fund Statement"
              subtitle="Auto-fills super fund details, account numbers, and balances."
              parseFunction={parseSuperStatement}
              onScanComplete={handleScanComplete}
            />
          ) : null}
          <Col xs={24} md={6}>
            <Form.Item
              label="Number of Super Funds"
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: modalData?.tableRows || 5 },
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
