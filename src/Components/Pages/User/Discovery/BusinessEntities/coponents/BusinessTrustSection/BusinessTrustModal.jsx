import { Button, Col, Form, Row, Select, Space } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import BusinessTrustTrusteeInnerModal from "./BusinessTrustTrusteeInnerModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const TRUSTEE_TYPE_OPTIONS = [
  { value: "Corporate", label: "Corporate" },
  { value: "Individual", label: "Individual" },
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

function formatNumericInput(value, { currency = false } = {}) {
  const digits = parseDigitsValue(getChangedValue(value));
  if (!digits) return "";
  return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function buildEmptyTrust() {
  return {
    businessName: "",
    aBN: "",
    businessAddress: "",
    postcodeSuburb: "",
    trusteeType: undefined,
    trusteeName: "",
    aNC: "",
    distributionReceived: "",
    businessValuation: "",
    directorsOfCorporateTrustee: [],
  };
}

function normalizeTrust(entry = {}) {
  return {
    businessName: entry?.businessName || "",
    aBN: String(entry?.aBN ?? "").replace(/[^0-9]/g, ""),
    businessAddress: entry?.businessAddress || "",
    postcodeSuburb: entry?.postcodeSuburb || "",
    trusteeType: entry?.trusteeType || undefined,
    trusteeName: entry?.trusteeName || "",
    aNC: String(entry?.aNC ?? "").replace(/[^0-9]/g, ""),
    distributionReceived: formatCurrencyValue(entry?.distributionReceived),
    businessValuation: formatCurrencyValue(entry?.businessValuation),
    directorsOfCorporateTrustee: Array.isArray(entry?.directorsOfCorporateTrustee)
      ? entry.directorsOfCorporateTrustee.map((d) => ({
          directorName: String(d?.directorName ?? "").trim(),
        }))
      : [],
  };
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.tradingTrusts || [];
  if ((Number(initialValues?.NumberOfMap) || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.businessName,
      row?.aBN,
      row?.businessAddress,
      row?.postcodeSuburb,
      row?.trusteeType,
      row?.trusteeName,
      row?.aNC,
      row?.distributionReceived,
      row?.businessValuation,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function buildEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) =>
    entries?.[index] ? entries[index] : buildEmptyTrust(),
  );
}

function buildInitialValues(sectionData = {}) {
  const trusts = Array.isArray(sectionData?.currentBalanceArray)
    ? sectionData.currentBalanceArray.map(normalizeTrust)
    : [];

  return {
    NumberOfMap: trusts.length || undefined,
    tradingTrusts: trusts,
  };
}

function trusteeTypeLabel(value) {
  return TRUSTEE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "";
}

export default function BusinessTrustModal({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);

  const parentForm = modalData?.parentForm;
  const ownerKey = modalData?.ownerKey;

  const sectionData = parentForm?.getFieldValue?.(ownerKey) || {};

  const initialValues = useMemo(
    () => buildInitialValues(sectionData),
    [sectionData?.currentBalanceArray, sectionData?.clientFK],
  );

  const count = Form.useWatch("NumberOfMap", form);
  const tradingTrusts =
    Form.useWatch("tradingTrusts", form) || initialValues.tradingTrusts;

  useEffect(() => {
    const currentCount = form.getFieldValue("NumberOfMap");
    const currentRows = form.getFieldValue("tradingTrusts");
    const hasUserInput =
      currentCount !== undefined || (Array.isArray(currentRows) && currentRows.length > 0);

    if (!hasUserInput) {
      form.setFieldsValue(initialValues);
      setEditing(!hasMeaningfulValues(initialValues));
    }
  }, [form, initialValues]);

  const syncParentValues = (nextEntries) => {
    const totalValuation = nextEntries.reduce(
      (sum, item) => sum + parseCurrencyValue(item?.businessValuation),
      0,
    );

    parentForm?.setFieldValue?.([ownerKey, "currentBalanceArray"], nextEntries);
    parentForm?.setFieldValue?.(
      [ownerKey, "currentBalance"],
      totalValuation ? toCommaAndDollar(totalValuation) : "",
    );
  };

  const openTrusteeInnerModal = useCallback(
    (rowIndex) => {
      const trust = form.getFieldValue(["tradingTrusts", rowIndex]) || {};
      const trusteeType = trust?.trusteeType;
      if (!trusteeType) return;

      const isCorporate = trusteeType === "Corporate";
      setDetailModalOpen(true);
      setDetailModalData({
        title: isCorporate ? "Company Directors" : "Trustee Name",
        width: 720,
        component: <BusinessTrustTrusteeInnerModal />,
        parentForm: form,
        rowIndex,
        countLabel: isCorporate ? "Number of Directors :" : "Number of Trustees :",
        columnHead: isCorporate ? "Director Name" : "Trustee Name",
        maxCount: modalData?.tableRows || 4,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [form, modalData?.tableRows],
  );

  const detailRows = useMemo(
    () =>
      buildEntries(Number(count) || 0, tradingTrusts).map((item, index) => ({
        key: `trading-trust-${index}`,
        formPath: ["tradingTrusts", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, tradingTrusts],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    const current = form.getFieldValue("tradingTrusts") || [];
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue("tradingTrusts", buildEntries(nextCount, current));
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("tradingTrusts") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("tradingTrusts", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 50,
      editable: false,
    },
    {
      title: "Business Name",
      dataIndex: "businessName",
      key: "businessName",
      field: "businessName",
      type: "textarea",
      placeholder: "Business Name",
    },
    {
      title: "ABN",
      dataIndex: "aBN",
      key: "aBN",
      field: "aBN",
      type: "text",
      placeholder: "ABN",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          String(getChangedValue(value) ?? "").replace(/[^0-9]/g, ""),
        );
      },
    },
    {
      title: "Business Address",
      dataIndex: "businessAddress",
      key: "businessAddress",
      field: "businessAddress",
      type: "textarea",
      placeholder: "Business Address",
    },
    {
      title: "Postcode/Suburb",
      dataIndex: "postcodeSuburb",
      key: "postcodeSuburb",
      field: "postcodeSuburb",
      type: "postalcode-search",
      placeholder: "Postcode/Suburb",
    },

    {
      title: "Trustee Type",
      dataIndex: "trusteeType",
      key: "trusteeType",
      field: "trusteeType",
      type: "select",
      options: TRUSTEE_TYPE_OPTIONS,
      placeholder: "Select",
    },
   
    {
      title: "Trustee Name",
      dataIndex: "trusteeName",
      key: "trusteeName",
      field: "trusteeName",
      type: "text",
      placeholder: "Trustee Name",
      disabled: ({ form: currentForm, record }) =>
        currentForm.getFieldValue([...record.formPath, "trusteeType"]) === "Individual",
    },
    {
      title: "ACN",
      dataIndex: "aNC",
      key: "aNC",
      field: "aNC",
      type: "text",
      placeholder: "ACN",
      disabled: ({ form: currentForm, record }) =>
        currentForm.getFieldValue([...record.formPath, "trusteeType"]) === "Individual",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          String(getChangedValue(value) ?? "").replace(/[^0-9]/g, ""),
        );
      },
    },
  
    {
      title: "Distribution Received",
      dataIndex: "distributionReceived",
      key: "distributionReceived",
      field: "distributionReceived",
      type: "text",
      placeholder: "Distribution Received",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
    {
      title: "Business Valuation",
      dataIndex: "businessValuation",
      key: "businessValuation",
      field: "businessValuation",
      type: "text",
      placeholder: "Business Valuation",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      editable: false,
      width: 70,
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
    const values = await form.validateFields();
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildEntries(
      countValue,
      Array.isArray(values?.tradingTrusts) ? values.tradingTrusts : [],
    ).map(normalizeTrust);

    syncParentValues(savedEntries);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalData?.title}
        width={detailModalData?.width || 720}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        colon={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Form.Item label="Number of Trusts :" name="NumberOfMap" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from({ length: modalData?.tableRows || 3 }, (_, index) => ({
                  value: index + 1,
                  label: index + 1,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={detailRows}
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
