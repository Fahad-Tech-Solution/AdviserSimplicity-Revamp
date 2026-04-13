import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import {
  InvestmentOffersData,
  discoveryDataAtom,
} from "../../../../../../../store/authState.js";
import { useOwnerOptions } from "../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const LOAN_TYPE_OPTIONS = [
  { value: "i/only", label: "i/only" },
  { value: "P&I", label: "P&I" },
];

const FREQUENCY_OPTIONS = [
  { value: "52", label: "Weekly" },
  { value: "26", label: "Fortnightly" },
  { value: "12", label: "Monthly" },
  { value: "1", label: "Annually" },
];

const LOAN_TERM_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  value: `Year ${index + 1}`,
  label: `Year ${index + 1}`,
}));

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
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

function formatPercentValue(value) {
  const digits = String(getChangedValue(value) ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  return `${Math.min(Number(digits), 100)}%`;
}

function calculateAnnualRepayments(record, currentForm) {
  const repaymentsAmount = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "RepaymentsAmount"]),
  );
  const frequency = Number(
    currentForm.getFieldValue([record.formPath, "Frequency"]) || 0,
  );

  if (repaymentsAmount === undefined || !frequency) {
    currentForm.setFieldValue([record.formPath, "AnnualRepayments"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "AnnualRepayments"],
    formatCurrencyValue(repaymentsAmount * frequency),
  );
}

function buildInitialPerson(person = {}, totalValue = "") {
  return {
    LenderCurrent: person?.LenderCurrent || undefined,
    LoanBalance: formatCurrencyValue(person?.LoanBalance),
    LoanType: person?.LoanType || undefined,
    RepaymentsAmount: formatCurrencyValue(person?.RepaymentsAmount),
    Frequency: person?.Frequency || undefined,
    AnnualRepayments: formatCurrencyValue(person?.AnnualRepayments || totalValue),
    InterestRate: person?.InterestRate || "",
    LoanTerm: person?.LoanTerm || undefined,
    LoanTermRemaining: person?.LoanTermRemaining || undefined,
  };
}

function buildInitialValues(sectionData, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildInitialPerson(sectionData?.client, sectionData?.clientTotal),
    partner: buildInitialPerson(sectionData?.partner, sectionData?.partnerTotal),
  };
}

export default function PersonalLoanModal({ modalData }) {
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const sectionData = discoveryData?.[modalData?.key] || {};
  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const availableOwnerOptions = useMemo(
    () =>
      allowPartner
        ? ownerOptions
        : ownerOptions.filter((option) => option.value === "client"),
    [allowPartner, ownerOptions],
  );

  const lenderOptions = useMemo(() => {
    const institutions = investmentOffers?.FinancialInstitutions || [];
    const mapped = institutions
      .map((item) => ({
        value: String(item?._id ?? item?.value ?? ""),
        label: item?.platformName || item?.label || item?.name || item?._id || "",
      }))
      .filter((option) => option.value && option.label);

    const existingValues = [
      sectionData?.client?.LenderCurrent,
      sectionData?.partner?.LenderCurrent,
    ].filter(Boolean);

    existingValues.forEach((value) => {
      if (!mapped.some((option) => option.value === value)) {
        mapped.unshift({ value, label: value });
      }
    });

    return mapped;
  }, [investmentOffers, sectionData?.client?.LenderCurrent, sectionData?.partner?.LenderCurrent]);

  const PERSONAL_LOAN_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 120 },
    {
      title: "Lender",
      dataIndex: "LenderCurrent",
      key: "LenderCurrent",
      field: "LenderCurrent",
      type: "select",
      options: lenderOptions,
      placeholder: "Lender",
      width: 250,
    },
    {
      title: "Loan Balance",
      dataIndex: "LoanBalance",
      key: "LoanBalance",
      field: "LoanBalance",
      type: "text",
      placeholder: "Loan Balance",
      width: 150,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
    {
      title: "Loan Type",
      dataIndex: "LoanType",
      key: "LoanType",
      field: "LoanType",
      type: "select",
      options: LOAN_TYPE_OPTIONS,
      width: 130,
    },
    {
      title: "Repayments Amount",
      dataIndex: "RepaymentsAmount",
      key: "RepaymentsAmount",
      field: "RepaymentsAmount",
      type: "text",
      placeholder: "Repayments Amount",
      width: 170,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
        calculateAnnualRepayments(record, currentForm);
      },
    },
    {
      title: "Frequency",
      dataIndex: "Frequency",
      key: "Frequency",
      field: "Frequency",
      type: "select",
      options: FREQUENCY_OPTIONS,
      width: 150,
      onChange: (_, record, __, currentForm) => {
        calculateAnnualRepayments(record, currentForm);
      },
    },
    {
      title: "Annual Repayments",
      dataIndex: "AnnualRepayments",
      key: "AnnualRepayments",
      field: "AnnualRepayments",
      type: "text",
      placeholder: "Annual Repayments",
      width: 180,
      disabled: true,
      editable: true,
    },
    {
      title: "Interest Rate (p.a)",
      dataIndex: "InterestRate",
      key: "InterestRate",
      field: "InterestRate",
      type: "text",
      placeholder: "Interest Rate (p.a)",
      width: 170,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatPercentValue(value),
        );
      },
    },
    {
      title: "Loan Term",
      dataIndex: "LoanTerm",
      key: "LoanTerm",
      field: "LoanTerm",
      type: "select",
      options: LOAN_TERM_OPTIONS,
      width: 140,
    },
    {
      title: "Loan Term Remaining",
      dataIndex: "LoanTermRemaining",
      key: "LoanTermRemaining",
      field: "LoanTermRemaining",
      type: "select",
      options: LOAN_TERM_OPTIONS,
      width: 180,
    },
  ];

  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

  const tableColumns = useMemo(
    () =>
      PERSONAL_LOAN_COLUMNS.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [PERSONAL_LOAN_COLUMNS],
  );

  const rows = useMemo(
    () =>
      (selectedOwners || [])
        .filter((owner) => allowPartner || owner === "client")
        .map((owner) => ({
          key: owner,
          formPath: owner,
          ownerLabel:
            availableOwnerOptions.find((option) => option.value === owner)
              ?.label || owner,
          LenderCurrent: form.getFieldValue([owner, "LenderCurrent"]),
          LoanBalance: form.getFieldValue([owner, "LoanBalance"]),
          LoanType: form.getFieldValue([owner, "LoanType"]),
          RepaymentsAmount: form.getFieldValue([owner, "RepaymentsAmount"]),
          Frequency: form.getFieldValue([owner, "Frequency"]),
          AnnualRepayments: form.getFieldValue([owner, "AnnualRepayments"]),
          InterestRate: form.getFieldValue([owner, "InterestRate"]),
          LoanTerm: form.getFieldValue([owner, "LoanTerm"]),
          LoanTermRemaining: form.getFieldValue([owner, "LoanTermRemaining"]),
        })),
    [allowPartner, availableOwnerOptions, form, selectedOwners],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.includes("partner")) {
      form.setFieldValue(
        "owner",
        selectedOwners.filter((owner) => owner === "client"),
      );
    }
  }, [allowPartner, form, selectedOwners]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      client: {
        ...(formValues?.client || {}),
        ...(values?.client || {}),
      },
      partner: {
        ...(formValues?.partner || {}),
        ...(values?.partner || {}),
      },
    };

    const owner = Array.isArray(sourceValues.owner) ? sourceValues.owner : [];
    const clientSelected = owner.includes("client");
    const partnerSelected = allowPartner && owner.includes("partner");

    const payload = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      client: clientSelected
        ? {
            ...(sectionData?.client || {}),
            LenderCurrent: sourceValues?.client?.LenderCurrent || "",
            LoanBalance: formatCurrencyValue(sourceValues?.client?.LoanBalance),
            LoanType: sourceValues?.client?.LoanType || "",
            RepaymentsAmount: formatCurrencyValue(
              sourceValues?.client?.RepaymentsAmount,
            ),
            Frequency: sourceValues?.client?.Frequency || "",
            AnnualRepayments: formatCurrencyValue(
              sourceValues?.client?.AnnualRepayments,
            ),
            InterestRate: sourceValues?.client?.InterestRate || "",
            LoanTerm: sourceValues?.client?.LoanTerm || "",
            LoanTermRemaining: sourceValues?.client?.LoanTermRemaining || "",
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            LenderCurrent: sourceValues?.partner?.LenderCurrent || "",
            LoanBalance: formatCurrencyValue(sourceValues?.partner?.LoanBalance),
            LoanType: sourceValues?.partner?.LoanType || "",
            RepaymentsAmount: formatCurrencyValue(
              sourceValues?.partner?.RepaymentsAmount,
            ),
            Frequency: sourceValues?.partner?.Frequency || "",
            AnnualRepayments: formatCurrencyValue(
              sourceValues?.partner?.AnnualRepayments,
            ),
            InterestRate: sourceValues?.partner?.InterestRate || "",
            LoanTerm: sourceValues?.partner?.LoanTerm || "",
            LoanTermRemaining: sourceValues?.partner?.LoanTermRemaining || "",
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(sourceValues?.client?.LoanBalance)
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.LoanBalance)
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/personalLoans/Update", payload)
        : await post("/api/personalLoans/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Personal Loan"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Personal Loan"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
        colon={false}
        requiredMark={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Owner"
              name="owner"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Owner is required" }]}
            >
              <Select
                options={availableOwnerOptions}
                mode="multiple"
                placeholder="Select owner"
                style={{ width: "100%" }}
                styles={{
                  items: {
                    fontSize: "11px",
                  },
                }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
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
                <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
                {!editing ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    key={"edit"}
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key={"save"}
                    loading={saving}
                    disabled={saving}
                  >
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
