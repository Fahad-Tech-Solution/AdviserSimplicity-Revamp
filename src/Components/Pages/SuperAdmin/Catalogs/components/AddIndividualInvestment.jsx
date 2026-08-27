import { useState } from "react";
import { App as AntdApp, Button, Form, Input, Typography } from "antd";
import { MdAdd } from "react-icons/md";
import useApi from "../../../../../hooks/useApi";

const { Text, Title } = Typography;
const FORM_ID = "add-individual-investment-form";
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

function FieldLabel({ children, required = false }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
      {children}
      {required ? (
        <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
      ) : null}
    </span>
  );
}

export default function AddIndividualInvestment({
  data = {},
  onClose,
  onSuccess,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const platform = data?.row ?? {};
  const platformFK = platform._id ?? platform.id;

  const handleFinish = async (values) => {
    if (!platformFK) {
      message.error("Platform reference is missing. Go back and try again.");
      return;
    }

    const payload = {
      investmentName: String(values.investmentName ?? "").trim(),
      investmentCode: String(values.investmentCode ?? "").trim(),
      platformFK,
    };

    setSubmitting(true);
    try {
      let res;
      if (data?.editing) {
        payload._id = data?.record?._id;
        res = await api.patch("/investmentoffer/Update", payload);
      } else {
        res = await api.post("/investmentoffer/Add", payload);
      }
      message.success("Investment added successfully.");
      form.resetFields();
      onSuccess?.(res);
      onClose?.();
    } catch (error) {
      message.error(
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Failed to add investment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="add-individual-investment-modal"
      style={{ padding: "4px 0 8px" }}
    >
      <style>
        {`
          .add-individual-investment-modal .ant-form-item-label {
            padding-bottom: 4px !important;
          }
          .add-individual-investment-modal .ant-form-item {
            margin-bottom: 18px !important;
          }
          .add-individual-investment-modal .ant-form-item-extra {
            margin-top: 6px;
            min-height: 0;
          }
          .add-individual-investment-modal .ant-input {
            border-radius: 8px !important;
            min-height: 40px !important;
            padding: 8px 12px !important;
          }
          .add-individual-investment-modal .ant-input:focus,
          .add-individual-investment-modal .ant-input-focused {
            border-color: ${PRIMARY_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12) !important;
          }
        `}
      </style>

      <Text
        style={{
          display: "block",
          color: PRIMARY_GREEN,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "2.5px",
          marginBottom: 6,
        }}
      >
        {data.editing ? "" : "NEW"}
      </Text>

      <Title
        level={3}
        style={{
          ...headingStyle,
          margin: 0,
          fontWeight: 500,
          fontSize: 26,
        }}
      >
        {data.editing ? "Update" : "Add"} Investment
      </Title>

      <Text
        style={{
          display: "block",
          marginTop: 6,
          marginBottom: 20,
          fontSize: 13,
          color: "#6b7280",
          lineHeight: 1.5,
        }}
      >
        {data.editing ? "Update a this" : "Add a new"}    underlying investment to this entity.
      </Text>

      <div
        style={{
          height: 1,
          background: "#e5e7eb",
          marginBottom: 24,
        }}
      />

      <Form
        id={FORM_ID}
        initialValues={data?.record || {}}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
      >
        <Form.Item
          name="investmentName"
          label={<FieldLabel required>Investment Name</FieldLabel>}
          rules={[{ required: true, message: "Enter investment name" }]}
          extra={
            <Text style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.45 }}>
              The name advisers will see in their discovery dropdowns.
            </Text>
          }
        >
          <Input placeholder="e.g. Balanced" />
        </Form.Item>

        <Form.Item
          name="investmentCode"
          label={<FieldLabel>Investment Code</FieldLabel>}
          // rules={[{ required: true, message: "Enter investment code" }]}
          extra={
            <Text style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.45 }}>
              APIR, ARSN, or ticker code that uniquely identifies this
              investment.
            </Text>
          }
        >
          <Input placeholder="e.g. AUS0100AU" />
        </Form.Item>
      </Form>

      <div
        style={{
          height: 1,
          background: "#e5e7eb",
          marginTop: 4,
          marginBottom: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          form={FORM_ID}
          loading={submitting}
          icon={<MdAdd size={16} />}
          style={{
            background: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            fontWeight: 700,
            borderRadius: 8,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {data.editing ? "Update" : "Add"} Investment
        </Button>
      </div>
    </div>
  );
}
