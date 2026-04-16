import { Button, Col, Form, Input, Row, Select } from "antd";
import { useEffect } from "react";

const FREQUENCY_OPTIONS = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "6", label: "Half Yearly" },
  { value: "1", label: "Yearly" },
];

const PAYMENT_METHOD_OPTIONS = [
  "Credit Card",
  "Direct Debit",
  "Rollover",
  "Manual",
].map((value) => ({ value, label: value }));

function toNumber(value) {
  return Number(String(value || "").replace(/[^0-9.-]+/g, "")) || 0;
}

function toCurrency(value) {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric) || numeric === 0) return "$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

function toPercent(value) {
  const numeric = Number(String(value || "").replace(/[^0-9.-]+/g, "")) || 0;
  return `${numeric.toFixed(2)}%`;
}

export default function PersonalInsurancePremiumsModal({
  onClose,
  onSave,
  editing,
  value,
  ownerLabel,
}) {
  const [form] = Form.useForm();
  const watchedValues = Form.useWatch([], form) || {};

  useEffect(() => {
    form.setFieldsValue({
      life: value?.life || "$0",
      tpd: value?.tpd || "$0",
      trauma: value?.trauma || "$0",
      ip: value?.ip || "$0",
      frequency: value?.frequency || "1",
      payeeOfPremiums: value?.payeeOfPremiums || ownerLabel || "Client",
      paymentMethod: value?.paymentMethod || undefined,
      commissionRate: value?.commissionRate || "0.00%",
      totalCost: value?.totalCost || "$0",
      commissionPayable: value?.commissionPayable || "$0",
    });
  }, [form, ownerLabel, value]);

  useEffect(() => {
    const totalPremiums =
      toNumber(watchedValues?.life) +
      toNumber(watchedValues?.tpd) +
      toNumber(watchedValues?.trauma) +
      toNumber(watchedValues?.ip);
    const multiplier = Number(watchedValues?.frequency || 1) || 1;
    const rolloverFactor =
      watchedValues?.payeeOfPremiums === "Super Rollover" ? 0.85 : 1;
    const totalCost = totalPremiums * multiplier * rolloverFactor;
    const commissionRate = toNumber(watchedValues?.commissionRate);
    const commissionPayable = totalCost * (commissionRate / 100);

    form.setFieldValue("totalCost", toCurrency(totalCost));
    form.setFieldValue("commissionPayable", toCurrency(commissionPayable));

    if (watchedValues?.payeeOfPremiums === "Super Rollover") {
      form.setFieldValue("paymentMethod", "Rollover");
    }
  }, [
    form,
    watchedValues?.commissionRate,
    watchedValues?.frequency,
    watchedValues?.ip,
    watchedValues?.life,
    watchedValues?.payeeOfPremiums,
    watchedValues?.tpd,
    watchedValues?.trauma,
  ]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) =>
        onSave?.({
          ...values,
          life: toCurrency(values?.life),
          tpd: toCurrency(values?.tpd),
          trauma: toCurrency(values?.trauma),
          ip: toCurrency(values?.ip),
          commissionRate: toPercent(values?.commissionRate),
          totalCost: toCurrency(values?.totalCost),
          commissionPayable: toCurrency(values?.commissionPayable),
        })
      }
      style={{ paddingTop: 20 }}
    >
      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Form.Item name="life" label="Life">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue("life", toCurrency(event?.target?.value))
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="tpd" label="TPD">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue("tpd", toCurrency(event?.target?.value))
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="trauma" label="Trauma">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue("trauma", toCurrency(event?.target?.value))
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="ip" label="IP">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue("ip", toCurrency(event?.target?.value))
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="frequency" label="Frequency">
            <Select
              disabled={!editing}
              options={FREQUENCY_OPTIONS}
              placeholder="Select frequency"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="payeeOfPremiums" label="Payee of Premiums">
            <Select
              disabled={!editing}
              placeholder="Select payee"
              options={[
                { value: ownerLabel || "Client", label: ownerLabel || "Client" },
                { value: "Super Rollover", label: "Super Rollover" },
                { value: "SMSF", label: "SMSF" },
                { value: "Business", label: "Business" },
                { value: "Company (Pty Ltd)", label: "Company (Pty Ltd)" },
                { value: "Family Trust", label: "Family Trust" },
                { value: "Other", label: "Other" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="paymentMethod" label="Payment Method">
            <Select
              disabled={
                !editing || watchedValues?.payeeOfPremiums === "Super Rollover"
              }
              placeholder="Select payment method"
              options={PAYMENT_METHOD_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="commissionRate" label="Commission Rate">
            <Input
              disabled={!editing}
              placeholder="0.00%"
              onBlur={(event) =>
                form.setFieldValue(
                  "commissionRate",
                  toPercent(event?.target?.value),
                )
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="totalCost" label="Total Cost p.a">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="commissionPayable" label="Commission Payable">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button onClick={onClose}>{editing ? "Cancel" : "Close"}</Button>
            {editing ? (
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            ) : null}
          </div>
        </Col>
      </Row>
    </Form>
  );
}
