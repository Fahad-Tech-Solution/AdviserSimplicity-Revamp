import { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useSetAtom } from "jotai";
import AppModal from "../../../Common/AppModal";
import useApi from "../../../../hooks/useApi";
import { getInitials } from "../../../../hooks/helpers";
import { advisersDataAtom } from "../../../../store/authState";

const { Text, Title } = Typography;
const FORM_ID = "adviser-form";
const PRIMARY_GREEN = "#22c55e";
const headingStyle = { fontFamily: "Georgia, serif" };

const AU_STATES = [
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "SA", label: "SA" },
  { value: "WA", label: "WA" },
  { value: "TAS", label: "TAS" },
  { value: "NT", label: "NT" },
  { value: "ACT", label: "ACT" },
];

const ADVISER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "companyName",
  "LicenseeName",
  "ABN",
  "companyAddress",
  "state",
  "ASIC",
  "AFSNumber",
  "AFSName",
  "referralID",
];

function generateReferralId(firstName = "", lastName = "") {
  const initials = getInitials(`${firstName} ${lastName}`.trim()) || "XX";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `ADV-${initials}-${suffix}`;
}

function FieldLabel({ children, required = false }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
      {children}
      {required ? (
        <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
      ) : null}
    </span>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: PRIMARY_GREEN,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Text>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      </div>
      {children}
    </div>
  );
}

function pickAdviserValues(record = {}) {
  const values = ADVISER_FIELDS.reduce((acc, key) => {
    acc[key] = record[key] ?? "";
    return acc;
  }, {});

  if (!values.referralID && record.referralId) {
    values.referralID = record.referralId;
  }

  return values;
}

function normalizeSavedAdviser(res, payload, editingAdviser, isEdit) {
  const record = res?.user ?? res?.adviser ?? res?.data ?? res;

  if (
    record &&
    typeof record === "object" &&
    (record._id || record.id || record.email)
  ) {
    return record;
  }

  if (isEdit) {
    return {
      ...editingAdviser,
      ...payload,
      _id: editingAdviser._id,
    };
  }

  return {
    ...payload,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function upsertAdviserInAtom(setAdvisers, saved, { isEdit, editingAdviser }) {
  setAdvisers((prev) => {
    const list = Array.isArray(prev) ? prev : [];

    if (isEdit) {
      const id = saved._id ?? saved.id ?? editingAdviser?._id;
      return list.map((item) =>
        (item._id ?? item.id) === id ? { ...item, ...saved } : item,
      );
    }

    return [saved, ...list];
  });
}

/**
 * Add / edit adviser modal.
 * POST /api/user/Add/Adviser | PATCH /api/user/Update/Adviser
 */
export default function AdviserForm({
  open,
  onClose,
  onSuccess,
  editingAdviser = null,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const setAdvisers = useSetAtom(advisersDataAtom);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(editingAdviser?._id);
  const editingKey = editingAdviser?._id ?? null;

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      form.setFieldsValue(pickAdviserValues(editingAdviser));
    } else {
      form.setFieldsValue({
        ...pickAdviserValues(),
        referralID: generateReferralId("", ""),
        state: "NSW",
      });
    }
  }, [open, editingKey, isEdit, form, editingAdviser]);

  const handleGenerateReferralId = () => {
    const { firstName = "", lastName = "" } = form.getFieldsValue([
      "firstName",
      "lastName",
    ]);
    form.setFieldValue("referralID", generateReferralId(firstName, lastName));
  };

  const handleFinish = async (values) => {
    const payload = pickAdviserValues(values);

    setSubmitting(true);
    try {
      let res;
      if (isEdit) {
        res = await api.patch("/api/user/Update/Adviser", {
          ...payload,
          _id: editingAdviser._id,
        });
        message.success("Adviser updated.");
      } else {
        res = await api.post("/api/user/Add/Adviser", payload);
        message.success("Adviser added.");
      }

      const saved = normalizeSavedAdviser(res, payload, editingAdviser, isEdit);
      upsertAdviserInAtom(setAdvisers, saved, { isEdit, editingAdviser });
      onSuccess?.(saved, { isEdit });
      form.resetFields();
      onClose?.();
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEdit ? "Edit Adviser" : "Add Adviser";
  const submitLabel = isEdit ? "Save changes" : "Create adviser";

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title=""
      width={720}
      destroyOnClose
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
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
            style={{
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div style={{ paddingTop: 4, paddingBottom: 8 }}>
        <style>
          {`
            .ant-form-item-label {
              padding-bottom: 2px !important;
            }
            .ant-form-item {
              margin-bottom: 10px !important;
            }
          `}
        </style>
        {!isEdit ? (
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
            NEW
          </Text>
        ) : null}

        <Title
          level={3}
          style={{
            ...headingStyle,
            margin: 0,
            fontWeight: 500,
            fontSize: 26,
          }}
        >
          {modalTitle}
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
          {isEdit
            ? "Update adviser account details and business information."
            : "Create a new adviser account and assign a subscription plan."}
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
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <FormSection title="Personal details">
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="firstName"
                  label={<FieldLabel required>First Name</FieldLabel>}
                  rules={[
                    { required: true, message: "Enter first name" },
                    {
                      min: 2,
                      message: "First name must be at least 2 characters",
                    },
                    {
                      pattern: /^[A-Za-z]+$/,
                      message: "First name can only contain letters",
                    },
                  ]}
                >
                  <Input placeholder="Natalie" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastName"
                  label={<FieldLabel required>Last Name</FieldLabel>}
                  rules={[
                    { required: true, message: "Enter last name" },
                    {
                      min: 2,
                      message: "Last name must be at least 2 characters",
                    },
                    {
                      pattern: /^[A-Za-z]+$/,
                      message: "Last name can only contain letters",
                    },
                  ]}
                >
                  <Input placeholder="Wong" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="phoneNumber"
                  label={<FieldLabel>Phone</FieldLabel>}
                >
                  <Input
                    placeholder="+61 412 345 678"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label={<FieldLabel required>Email Address</FieldLabel>}
                  rules={[
                    { required: true, message: "Enter email" },
                    { type: "email", message: "Enter a valid email" },
                  ]}
                >
                  <Input
                    placeholder="nat@advisor.com.au"
                    autoComplete="off"
                    style={{ borderRadius: 8 }}
                    disabled={isEdit}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label={<FieldLabel required>User ID</FieldLabel>}
                  required
                >
                  <div style={{ display: "flex", gap: 8 }}>
                    <Form.Item
                      name="referralID"
                      noStyle
                      rules={[{ required: true, message: "Enter user ID" }]}
                    >
                      <Input
                        placeholder="ADV-NW-7842"
                        style={{ borderRadius: 8, flex: 1 }}
                        readOnly
                      />
                    </Form.Item>
                    <Button
                      type="default"
                      icon={<ReloadOutlined />}
                      onClick={handleGenerateReferralId}
                      disabled={isEdit}
                      aria-label="Generate user ID"
                      style={{ height: 32, width: 40, flexShrink: 0 }}
                    />
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Business details">
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="companyName"
                  label={<FieldLabel>Company Name</FieldLabel>}
                >
                  <Input
                    placeholder="Nat Advisory Pty Ltd"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="LicenseeName"
                  label={<FieldLabel>Licensee Name</FieldLabel>}
                >
                  <Input
                    placeholder="John Licensee"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="state" label={<FieldLabel>State</FieldLabel>}>
                  <Select
                    placeholder="NSW"
                    options={AU_STATES}
                    style={{ borderRadius: 8 }}
                    getPopupContainer={(trigger) => trigger.parentNode}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="ABN" label={<FieldLabel>ABN</FieldLabel>}>
                  <Input
                    placeholder="12 345 678 901"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="companyAddress"
                  label={<FieldLabel>Company Address</FieldLabel>}
                >
                  <Input
                    placeholder="123 Collins Street, Melbourne VIC 3000"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="AFSNumber"
                  label={<FieldLabel>AFS Number</FieldLabel>}
                  rules={[{ required: true, message: "Enter AFS Number" }]}
                >
                  <Input
                    placeholder="AFSL 234567"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="AFSName"
                  label={<FieldLabel>AFS Name</FieldLabel>}
                  rules={[{ required: true, message: "Enter AFS Name" }]}
                >
                  <Input
                    placeholder="Financial Services Ltd"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="ASIC"
                  label={<FieldLabel>ASIC</FieldLabel>}
                  rules={[{ required: true, message: "Enter ASIC" }]}
                >
                  <Input
                    placeholder="ASIC number"
                    type="number"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </FormSection>
        </Form>
      </div>
    </AppModal>
  );
}
