import { Button, Col, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import SuperFundsAnnualAdviceModal from "./SuperFundsAnnualAdviceModal.jsx";
import SuperFundsBalanceBenefitModal from "./SuperFundsBalanceBenefitModal.jsx";
import SuperFundsBeneficiariesModal from "./SuperFundsBeneficiariesModal.jsx";
import SuperFundsContributionsModal from "./SuperFundsContributionsModal.jsx";
import SuperFundsGroupInsuranceModal from "./SuperFundsGroupInsuranceModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: false,
  pageSize: 5,
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
        entry?.balanceBenefitDetails && typeof entry.balanceBenefitDetails === "object"
          ? entry.balanceBenefitDetails
          : {},
      groupInsurance: entry?.groupInsurance || "No",
      groupInsuranceDetails:
        entry?.groupInsuranceDetails && typeof entry.groupInsuranceDetails === "object"
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
  const funds = investmentOffers?.SuperannuationFunds || [];
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

function PopupDisplay({ value, onClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div
        style={{
          minHeight: 26,
          width: 120,
          padding: "2px 11px 2px 0px",
          lineHeight: "22px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={value || ""}
      >
        {value || ""}
      </div>
      <Button type="primary" size="small" style={{ width: 25, padding: 0 }} onClick={onClick}>
        ↗
      </Button>
    </div>
  );
}

function SwitchPopupDisplay({ value, onClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{value || "No"}</span>
      {value === "Yes" ? (
        <Button type="primary" size="small" style={{ width: 25, padding: 0 }} onClick={onClick}>
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

  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];

  const initialValues = useMemo(() => buildInitialValues(ownerArray), [ownerArray]);
  const count = Form.useWatch("NumberOfMap", form);
  const superFunds = Form.useWatch("superFunds", form) || initialValues.superFunds || [];
  const fundOptions = useMemo(
    () => buildFundOptions(investmentOffers, initialValues?.superFunds || []),
    [initialValues?.superFunds, investmentOffers],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rows = useMemo(
    () =>
      buildSuperFundEntries(Number(count) || 0, superFunds).map((item, index) => ({
        key: `${modalData?.ownerKey || "owner"}-super-${index}`,
        formPath: ["superFunds", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, modalData?.ownerKey, superFunds],
  );

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
    form.setFieldValue("superFunds", buildSuperFundEntries(nextCount, superFunds));
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
        closeModal: () => setDetailModalOpen(false),
      };

      const detailMap = {
        balanceBenefit: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Balance and Details`,
          width: 1280,
          component: <SuperFundsBalanceBenefitModal />,
        },
        groupInsurance: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Group Insurance`,
          width: 1280,
          component: <SuperFundsGroupInsuranceModal />,
        },
        contributions: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Contributions`,
          width: 1180,
          component: <SuperFundsContributionsModal />,
        },
        nominatedBeneficiaries: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Beneficiaries`,
          width: 1180,
          component: <SuperFundsBeneficiariesModal />,
        },
        annualAdvice: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Ongoing Annual Fee`,
          width: 760,
          component: <SuperFundsAnnualAdviceModal />,
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
          currentForm.getFieldValue([...record.formPath, column.field]),
        );

        currentForm.setFieldValue([...record.formPath, column.field], nextValue);

        if (currentValue && currentValue !== nextValue) {
          currentForm.setFieldValue([...record.formPath], {
            platformName: nextValue,
            memberNumber: "",
            balanceBenefit: "",
            balanceBenefitDetails: {},
            groupInsurance: "No",
            groupInsuranceDetails: {},
            contributions: "No",
            contributionsArray: [],
            contributionsStartYear: undefined,
            nominatedBeneficiaries: "No",
            nominatedBeneficiariesDetails: {},
            annualAdvice: "",
            annualAdviceArray: {},
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
      renderView: ({ value, record }) => (
        <PopupDisplay
          value={value}
          onClick={() => openDetailModal("balanceBenefit", { record, form })}
        />
      ),
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
        onClick: (payload) => openDetailModal("nominatedBeneficiaries", payload),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => openDetailModal("nominatedBeneficiaries", { record, form })}
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
      renderView: ({ value, record }) => (
        <PopupDisplay
          value={value}
          onClick={() => openDetailModal("annualAdvice", { record, form })}
        />
      ),
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
          onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildSuperFundEntries(countValue, values?.superFunds || []);

    syncParentValues(savedEntries);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalData?.title}
        width={detailModalData?.width || 1000}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
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
              data={rows}
              tableProps={TABLE_PROPS}
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
                    <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
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
