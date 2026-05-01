import { Button, Col, Divider, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import BeneficiariesModal from "../../../FinancialInvestments/components/SuperFunds/BeneficiariesModal.jsx";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import PensionBenefitsDetailsModal from "./PensionBenefitsDetailsModal.jsx";
import SmsfAnnualPensionPaymentModal from "./SmsfAnnualPensionPaymentModal.jsx";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock.jsx";
import { confirmRemoveData } from "../../../../../../Common/confirmationModal.js";

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

function buildPensionAccountEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => {
    const entry = entries?.[index] || {};
    return {
      pensionBenefits: entry.pensionBenefits || "",
      pensionBenefitsDetails:
        entry.pensionBenefitsDetails &&
        typeof entry.pensionBenefitsDetails === "object"
          ? entry.pensionBenefitsDetails
          : {},
      pensionPayment: entry.pensionPayment || "",
      pensionPaymentDetails:
        entry.pensionPaymentDetails &&
        typeof entry.pensionPaymentDetails === "object"
          ? entry.pensionPaymentDetails
          : {},
      pensionType: entry.pensionType || "",
      nominatedBeneficiaries: entry.nominatedBeneficiaries || "No",
      nominatedBeneficiariesDetails:
        entry.nominatedBeneficiariesDetails &&
        typeof entry.nominatedBeneficiariesDetails === "object"
          ? entry.nominatedBeneficiariesDetails
          : {},
    };
  });
}

function buildInnerInitialValues(accounts = []) {
  const list = Array.isArray(accounts) ? accounts : [];
  const count = list.length || 0;
  return {
    NumberOfMap: count || undefined,
    pensionAccounts: buildPensionAccountEntries(count || 0, list),
  };
}

function hasMeaningfulInnerData(initialValues = {}) {
  const n = Number(initialValues?.NumberOfMap) || 0;
  if (n > 0) return true;
  return (initialValues?.pensionAccounts || []).some((row) =>
    [
      row?.pensionBenefits,
      row?.pensionPayment,
      row?.nominatedBeneficiaries,
    ].some((v) => String(v ?? "").trim() !== ""),
  );
}

export default function SmsfPensionAccountsInnerModal({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const renderTitleBlock = useTitleBlock();

  const memberIndex = modalData?.memberIndex ?? 0;
  const memberLabel = modalData?.memberLabel || "Member";
  const parentForm = modalData?.parentForm;
  const parentPath = ["pensionData", memberIndex];

  const initialValues = useMemo(
    () => buildInnerInitialValues(modalData?.initialAccounts || []),
    [modalData?.initialAccounts],
  );

  const count = Form.useWatch("NumberOfMap", form);
  const watchedAccounts = Form.useWatch("pensionAccounts", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulInnerData(initialValues));
  }, [form, initialValues]);

  const getStoredAccounts = useCallback(
    () =>
      form.getFieldValue("pensionAccounts") ||
      initialValues.pensionAccounts ||
      [],
    [form, initialValues.pensionAccounts],
  );

  const rows = useMemo(
    () =>
      buildPensionAccountEntries(Number(count) || 0, getStoredAccounts()).map(
        (item, index) => ({
          key: `smsf-pension-acct-${memberIndex}-${index}`,
          formPath: ["pensionAccounts", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, getStoredAccounts, memberIndex, watchedAccounts],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "pensionAccounts",
      buildPensionAccountEntries(nextCount, getStoredAccounts()),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const current = form.getFieldValue("pensionAccounts") || [];
    const nextEntries = current.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;
    form.setFieldValue("pensionAccounts", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const openDetailModal = useCallback(
    (type, { record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};
      const commonData = {
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        closeModal: () => {
          setDetailModalOpen(false);
        },
        switchToEditMode: () => setEditing(true),
        noCancelButton: true,
      };

      const detailMap = {
        pensionBenefits: {
          title: `${memberLabel}_Pension Benefits`,
          width: 1500,
          component: <PensionBenefitsDetailsModal />,
        },
        pensionPayment: {
          title: `${memberLabel}_Trust_Annual Pension Payment`,
          width: 900,
          component: <SmsfAnnualPensionPaymentModal />,
        },
        nominatedBeneficiaries: {
          title: `${memberLabel}_Beneficiaries`,
          width: 1180,
          component: <BeneficiariesModal />,
        },
      };

      setDetailModalOpen(true);
      setDetailModalData({
        ...commonData,
        ...(detailMap[type] || {}),
      });
    },
    [memberLabel],
  );

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 50,
      editable: false,
    },
    {
      title: "Pension Benefits",
      dataIndex: "pensionBenefits",
      key: "pensionBenefits",
      field: "pensionBenefits",
      disabled: true,
      type: "input-action",
      placeholder: "Pension Benefits",
      action: {
        name: "Open Pension Benefits",
        onClick: (payload) => openDetailModal("pensionBenefits", payload),
      },
    },
    {
      title: "Annual Pension Payment",
      dataIndex: "pensionPayment",
      key: "pensionPayment",
      field: "pensionPayment",
      disabled: true,
      type: "input-action",
      placeholder: "Annual Pension Payment",
      action: {
        name: "Open Annual Pension Payment",
        onClick: (payload) => openDetailModal("pensionPayment", payload),
      },
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
      onChange: (nextValue, record, column, currentForm) => {
        if (nextValue === "No") {
          currentForm.setFieldValue(
            [...record.formPath, "nominatedBeneficiariesDetails"],
            {},
          );
        }
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
          aria-label={`Remove pension account row ${record?.rowNumber}`}
          onClick={() => confirmRemoveData(() => handleRemoveRow((record?.rowNumber || 1) - 1))}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const nextCount = Number(values?.NumberOfMap) || 0;
    console.log("nextCount", nextCount);
    // if (!nextCount) {
    //   message.warning("Select how many pension accounts apply");
    //   return;
    // }

    const accounts = buildPensionAccountEntries(
      nextCount,
      values?.pensionAccounts || [],
    );

    const totalSum = accounts.reduce(
      (total, entry) => total + parseCurrencyValue(entry?.pensionBenefits),
      0,
    );

    const memberRow = parentForm?.getFieldValue?.(parentPath) || {};
    parentForm?.setFieldValue?.(parentPath, {
      ...memberRow,
      pensionBenefitsTotalArray: accounts,
      pensionBenefitsTotal: totalSum ? toCommaAndDollar(totalSum) : "",
    });

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

      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        noCancelButton={detailModalData?.noCancelButton || false}
        width={detailModalData?.width || 1000}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600 }}>
                Number of Pension Benefits
              </span>
              <Form.Item name="NumberOfMap" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Select"
                  disabled={!editing}
                  style={{ minWidth: 88 }}
                  options={[
                    { value: 1, label: "1" },
                    { value: 2, label: "2" },
                    { value: 3, label: "3" },
                  ]}
                  onChange={handleCountChange}
                />
              </Form.Item>
            </div>
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
