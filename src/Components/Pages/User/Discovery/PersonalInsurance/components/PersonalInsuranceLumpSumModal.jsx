import { Button, Col, Form, Input, Row, Select, Switch } from "antd";
import { useEffect } from "react";

const PREMIUM_TYPE_OPTIONS = [
  { value: "Stepped", label: "Stepped" },
  { value: "Level", label: "Level" },
];

const TPD_DEFINITION_OPTIONS = [
  { value: "Any", label: "Any" },
  { value: "Own", label: "Own" },
  { value: "Split (Own)", label: "Split (Own)" },
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

export default function PersonalInsuranceLumpSumModal({
  onClose,
  onSave,
  editing,
  value,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      life: value?.life || "$0",
      TPD: value?.TPD || "$0",
      trauma: value?.trauma || "$0",
      premiumType: value?.premiumType || undefined,
      TPDDefinition: value?.TPDDefinition || undefined,
      traumaPlus: Boolean(value?.traumaPlus),
      CPI: Boolean(value?.CPI),
      superlinked: Boolean(value?.superlinked),
    });
  }, [form, value]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) =>
        onSave?.({
          ...values,
          life: toCurrency(values?.life),
          TPD: toCurrency(values?.TPD),
          trauma: toCurrency(values?.trauma),
        })
      }
      requiredMark={false}
      style={{ paddingTop: 20 }}
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
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
        <Col xs={24} md={8}>
          <Form.Item name="TPD" label="TPD">
            <Input
              disabled={!editing}
              placeholder="$0"
              onBlur={(event) =>
                form.setFieldValue("TPD", toCurrency(event?.target?.value))
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
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
          <Form.Item name="TPDDefinition" label="TPD Definition">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select TPD definition"
              options={TPD_DEFINITION_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="traumaPlus"
            label="Trauma Plus"
            valuePropName="checked"
          >
            <Switch disabled={!editing} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="CPI" label="CPI" valuePropName="checked">
            <Switch disabled={!editing} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
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
