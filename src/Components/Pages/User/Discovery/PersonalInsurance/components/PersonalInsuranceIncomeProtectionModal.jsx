import { Button, Col, Form, Input, Row, Select, Switch } from "antd";
import { useEffect } from "react";

const WAITING_PERIOD_OPTIONS = [
  "30 Days",
  "60 Days",
  "90 Days",
  "120 Days",
  "180 Days",
  "2 Years",
].map((value) => ({ value, label: value }));

const BENEFIT_PERIOD_OPTIONS = [
  "2 Years",
  "5 Years",
  "To Age 60",
  "To Age 65",
  "To Age 70",
].map((value) => ({ value, label: value }));

const PREMIUM_TYPE_OPTIONS = [
  { value: "Stepped", label: "Stepped" },
  { value: "Level", label: "Level" },
];

const BENEFIT_TYPE_OPTIONS = [
  { value: "Agreed", label: "Agreed" },
  { value: "Indemnity", label: "Indemnity" },
];

function toCurrency(value) {
  const numeric = Number(String(value || "").replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(numeric) || numeric === 0) return "$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export default function PersonalInsuranceIncomeProtectionModal({
  onClose,
  onSave,
  editing,
  value,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      monthlyAmount: value?.monthlyAmount || "$0",
      waitingPeriod: value?.waitingPeriod || undefined,
      benefitPeriod: value?.benefitPeriod || undefined,
      ownOccPeriod: value?.ownOccPeriod || undefined,
      premiumType: value?.premiumType || undefined,
      benefitType: value?.benefitType || undefined,
      CPI: Boolean(value?.CPI),
      increasingClaims: Boolean(value?.increasingClaims),
      accidentOption: Boolean(value?.accidentOption),
      superlinked: Boolean(value?.superlinked),
    });
  }, [form, value]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) =>
        onSave?.({
          ...values,
          monthlyAmount: toCurrency(values?.monthlyAmount),
        })
      }
      style={{ paddingTop: 20 }}
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="monthlyAmount" label="Monthly Amount">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue(
                  "monthlyAmount",
                  toCurrency(event?.target?.value),
                )
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="waitingPeriod" label="Waiting Period">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select waiting period"
              options={WAITING_PERIOD_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="benefitPeriod" label="Benefit Period">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select benefit period"
              options={BENEFIT_PERIOD_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="ownOccPeriod" label="Own Occ Period">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select own occ period"
              options={BENEFIT_PERIOD_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="premiumType" label="Premium Type">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select premium type"
              options={PREMIUM_TYPE_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="benefitType" label="Benefit Type">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select benefit type"
              options={BENEFIT_TYPE_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="CPI" label="CPI" valuePropName="checked">
            <Switch disabled={!editing} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name="increasingClaims"
            label="Increasing Claims"
            valuePropName="checked"
          >
            <Switch disabled={!editing} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name="accidentOption"
            label="Accident Option"
            valuePropName="checked"
          >
            <Switch disabled={!editing} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name="superlinked"
            label="Superlinked"
            valuePropName="checked"
          >
            <Switch disabled={!editing} />
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
