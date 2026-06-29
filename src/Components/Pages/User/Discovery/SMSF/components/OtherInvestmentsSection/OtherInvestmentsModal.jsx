import { Button, Col, Form, message, Row, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

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

function buildInitialValues(sectionData = {}) {
  return {
    investmentName: sectionData?.investmentName || "",
    currentValue: formatCurrencyValue(sectionData?.currentValue),
    costBase: formatCurrencyValue(sectionData?.costBase),
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return [initialValues?.investmentName, initialValues?.currentValue, initialValues?.costBase].some(
    (v) => String(v ?? "").trim() !== "",
  );
}

export default function OtherInvestmentsModal({ modalData }) {
  const [form] = Form.useForm();
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const sectionData = discoveryData?.[modalData?.key] || {};
  const initialValues = useMemo(
    () => buildInitialValues(sectionData),
    [sectionData?.investmentName, sectionData?.currentValue, sectionData?.costBase],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK || !hasMeaningfulValues(initialValues));
  }, [form, initialValues, sectionData?.clientFK]);

  // Keep view-mode in sync (same approach as InvestmentLoanModal)
  const formSnapshot = Form.useWatch([], form);

  const investmentName = Form.useWatch("investmentName", form) ?? initialValues.investmentName;
  const currentValue = Form.useWatch("currentValue", form) ?? initialValues.currentValue;
  const costBase = Form.useWatch("costBase", form) ?? initialValues.costBase;

  const rows = useMemo(
    () => [
      {
        key: "other-investment",
        formPath: [],
        investmentName,
        currentValue,
        costBase,
      },
    ],
    [costBase, currentValue, formSnapshot, investmentName],
  );

  const columns = [
    {
      title: "Name of Investment",
      dataIndex: "investmentName",
      key: "investmentName",
      field: "investmentName",
      type: "text",
      placeholder: "Name of Investment",
      width: 220,
    },
    {
      title: "Current Value",
      dataIndex: "currentValue",
      key: "currentValue",
      field: "currentValue",
      type: "text",
      placeholder: "Current Value",
      width: 170,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue([column.field], formatNumericInput(value, { currency: true }));
      },
    },
    {
      title: "Cost Base",
      dataIndex: "costBase",
      key: "costBase",
      field: "costBase",
      type: "text",
      placeholder: "Cost Base",
      width: 170,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue([column.field], formatNumericInput(value, { currency: true }));
      },
    },
  ];

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
    };

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      investmentName: sourceValues?.investmentName || "",
      currentValue: formatCurrencyValue(sourceValues?.currentValue),
      costBase: formatCurrencyValue(sourceValues?.costBase),
      clientTotal: formatCurrencyValue(sourceValues?.currentValue),
    };

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch(`/${modalData?.key}/Update`, payload)
        : await post(`/${modalData?.key}/Add`, payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(`${modalData?.title || "Other Investments"} updated successfully`);
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Other Investments"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
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
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={rows}
              tableProps={TABLE_PROPS}
              rowPathKey="formPath"
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
                  <Button type="primary" htmlType="button" onClick={() => setEditing(true)}>
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="button"
                    loading={saving}
                    disabled={saving}
                    onClick={(e) => {
                      e?.preventDefault?.();
                      e?.stopPropagation?.();
                      form.submit();
                    }}
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

