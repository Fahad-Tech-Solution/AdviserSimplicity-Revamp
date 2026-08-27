import { Alert, Button, Col, Divider, Form, Row, Select, Space } from "antd";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { useAtomValue } from "jotai";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import { RiEdit2Fill } from "react-icons/ri";
import SwitchPopupDisplay from "../../../../../../Common/SwitchPopupDisplay";
import AppModal from "../../../../../../Common/AppModal";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import ServiceFeeModal from "../ServiceFeeModal";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock";
import { confirmRemoveData } from "../../../../../../Common/confirmationModal";

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

function calculateTotalBalance(entries = []) {
  return entries.reduce(
    (sum, item) => sum + parseCurrencyValue(item?.currentBalance),
    0,
  );
}

function buildEntries(count, entries = [], sectionKey) {
  return Array.from({ length: count }, (_, index) => ({
    ...(entries?.[index] || {}),
    Institution: entries?.[index]?.Institution || "",
    accountNumber: entries?.[index]?.accountNumber || "",
    currentBalance: entries?.[index]?.currentBalance || "",
    ...(["SMSFBank", "familyBank"].includes(sectionKey)
      ? {
        serviceFee: entries?.[index]?.serviceFee || "",
        serviceFeeArray: entries?.[index]?.serviceFeeArray || {},
        serviceFeeType: entries?.[index]?.serviceFeeType || "",
      }
      : {}),
  }));
}

function hasMeaningfulValues(initialValues = {}) {
  const entries = initialValues?.entries || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return entries.some((entry) =>
    [entry?.Institution, entry?.accountNumber, entry?.currentBalance].some(
      (value) => String(value ?? "").trim() !== "",
    ),
  );
}

function buildInstitutionOptions(investmentOffers, initialValues) {
  const institutions = investmentOffers?.FinancialInstitutions || [];

  // 1. Filter out soft-deleted items for standard options
  const options = institutions
    .filter((item) => !item?.softDelete)
    .map((item) => ({
      value: String(item?._id ?? item?.value ?? ""),
      label: item?.platformName || item?.label || item?.name || item?._id || "",
    }));

  // 2. Ensure initialValues entries exist in options (re-adding soft-deleted items with proper labels if necessary)
  (initialValues?.entries || []).forEach((entry) => {
    const currentValue = String(entry?.Institution || "").trim();
    if (
      currentValue &&
      !options.some((option) => String(option.value) === currentValue)
    ) {
      const matchedInstitution = institutions.find(
        (item) => String(item?._id ?? item?.value ?? "") === currentValue
      );

      const label =
        matchedInstitution?.platformName ||
        matchedInstitution?.label ||
        matchedInstitution?.name ||
        matchedInstitution?._id ||
        currentValue;

      options.unshift({
        value: currentValue,
        label: label + " (Discontinued)",
        disabled: true,
      });
    }
  });

  return options.filter((option) => option.value && option.label);
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

export default function BankTermDetailsModal({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const renderTitleBlock = useTitleBlock();
  const [openModalData, setOpenModalData] = useState(null);
  const [sortState, setSortState] = useState({
    columnKey: null,
    order: null,
  });
  const config = {
    countLabel: modalData?.countLabel || "no count label",
    pageLimit: modalData?.tableRows || 10,
  };
  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];

  const initialValues = useMemo(
    () => ({
      NumberOfMap: ownerArray.length || undefined,
      entries: ownerArray,
    }),
    [ownerArray],
  );

  const institutionOptions = useMemo(
    () => buildInstitutionOptions(investmentOffers, initialValues),
    [initialValues, investmentOffers],
  );

  const count = Form.useWatch("NumberOfMap", form);
  const entries = Form.useWatch("entries", form) || initialValues.entries || [];

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

  const detailRows = useMemo(
    () =>
      buildEntries(Number(count) || 0, entries, modalData?.sectionKey).map(
        (item, index) => ({
          key: `${modalData?.ownerKey || "owner"}-${index}`,
          formPath: ["entries", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, entries, modalData?.ownerKey],
  );

  const sortedDetailRows = useMemo(() => {
    if (editing || !sortState?.columnKey || !sortState?.order) {
      return detailRows;
    }

    const compareText = (left, right) => {
      if (left && right) return String(left).localeCompare(String(right));
      if (left) return -1;
      if (right) return 1;
      return 0;
    };

    const sorters = {
      Institution: (a, b) => compareText(a?.Institution, b?.Institution),
      accountNumber: (a, b) => compareText(a?.accountNumber, b?.accountNumber),
      currentBalance: (a, b) =>
        parseCurrencyValue(a?.currentBalance) -
        parseCurrencyValue(b?.currentBalance),
    };

    const compare = sorters[sortState.columnKey];
    if (typeof compare !== "function") {
      return detailRows;
    }

    const multiplier = sortState.order === "descend" ? -1 : 1;
    return [...detailRows].sort((a, b) => compare(a, b) * multiplier);
  }, [detailRows, editing, sortState]);

  const openDetailModal = useCallback(
    (_key, payload = {}) => {
      const currentForm = payload?.form || form;
      const fieldPath = payload?.record?.formPath || [];
      const rowValues =
        currentForm?.getFieldValue?.(fieldPath) || payload?.record || {};

      setOpenModal(true);
      setOpenModalData({
        title: `${modalData?.ownerLabel || "Owner"}_Ongoing Annual Fee`,
        width: 720,
        component: <ServiceFeeModal />,
        parentForm: currentForm,
        fieldPath,
        initialValues: rowValues,
        closeModal: () => {
          setOpenModal(false);
          setEditing(true);
        },
        switchToEditMode: () => setEditing(true),
        noCancelButton: true,
      });
    },
    [form],
  );

  const detailColumns = useMemo(() => {
    const columns = [
      {
        title: "No#",
        key: "rowNumber",
        dataIndex: "rowNumber",
        width: 60,
        editable: false,
      },
      {
        title: "Name of Institution",
        key: "Institution",
        dataIndex: "Institution",
        field: "Institution",
        type: "select",
        options: institutionOptions,
        placeholder: "Name of Institution",
        sorter: (a, b) => {
          if (a.Institution && b.Institution) {
            return a.Institution.localeCompare(b.Institution);
          }
          if (a.Institution) return -1;
          if (b.Institution) return 1;
          return 0;
        },
        sortOrder:
          sortState.columnKey === "Institution" ? sortState.order : undefined,
      },
      {
        title: "Account Number",
        key: "accountNumber",
        dataIndex: "accountNumber",
        field: "accountNumber",
        type: "text",
        placeholder: "Account Number",
      },
      {
        title: "Current Balance",
        key: "currentBalance",
        dataIndex: "currentBalance",
        field: "currentBalance",
        type: "text",
        placeholder: "Current Balance",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...(record?.formPath || []), column.field],
            formatCurrencyValue(value?.target?.value),
          );
        },
        sorter: (a, b) =>
          parseCurrencyValue(a?.currentBalance) -
          parseCurrencyValue(b?.currentBalance),
        sortOrder:
          sortState.columnKey === "currentBalance"
            ? sortState.order
            : undefined,
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

    if (["SMSFBank", "familyBank"].includes(modalData?.sectionKey)) {
      columns.splice(columns.length - 1, 0, {
        title: "Ongoing Advice Fee",
        key: "ongoingAdviceFee",
        dataIndex: "serviceFee",
        field: "serviceFee",
        type: "input-action",
        placeholder: "Ongoing Advice Fee",
        disabled: true,
        action: {
          name: "Open Ongoing Advice Fee",
          onClick: (payload) => openDetailModal("ongoingAdviceFee", payload),
        },
        renderView: ({ value, record }) => (
          <SwitchPopupDisplay
            value={value}
            onClick={() =>
              openDetailModal("ongoingAdviceFee", { record, form })
            }
          />
        ),
      });
    }

    return columns;
  }, [
    form,
    institutionOptions,
    modalData?.sectionKey,
    sortState.columnKey,
    sortState.order,
  ]);

  const validationErrors = form
    .getFieldsError()
    .filter((field) => field.errors.length > 0);

  const handleCountChange = (nextValue) => {
    const numericValue = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "entries",
      buildEntries(numericValue, entries, modalData?.sectionKey),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("entries") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("entries", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const handleConfirmAndExit = async () => {
    const values = await form.getFieldsValue(true);
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildEntries(
      countValue,
      values?.entries || [],
      modalData?.sectionKey,
    );
    const totalBalance = calculateTotalBalance(savedEntries);

    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalanceArray"],
      savedEntries,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalance"],
      totalBalance ? toCommaAndDollar(totalBalance) : "",
    );

    setEditing(false);
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

  return (
    <div style={{ padding: "0px 4px 0px 4px" }}>
      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        width={openModalData?.width || 1000}
        noCancelButton={openModalData?.noCancelButton || false}
      >
        {renderModalContent(openModalData)}
      </AppModal>

      <div style={{ marginBottom: 12 }}>
        {renderTitleBlock({
          title: modalData?.title,
          icon: modalData?.icon,
          clossButton: true,
          onClose: () => modalData?.closeModal?.(),
          isEditing: editing,
        })}
        <Divider style={{ margin: "12px 0px 0px 0px" }} />
      </div>

      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          {editing && validationErrors.length > 0 ? (
            <Col xs={24}>
              <Alert
                type="error"
                showIcon
                message="Validation Errors"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                    {validationErrors.map((field) => (
                      <li key={field.name.join(".")}>{field.errors[0]}</li>
                    ))}
                  </ul>
                }
              />
            </Col>
          ) : null}

          <Col xs={24} md={10}>
            <Form.Item
              label={config.countLabel}
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: config.pageLimit },
                  (_, index) => ({
                    value: index + 1,
                    label: index + 1,
                  }),
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={detailColumns}
              data={sortedDetailRows}
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
