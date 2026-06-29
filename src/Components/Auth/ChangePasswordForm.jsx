import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import logo from "../../assets/svg/Reset password-pana.svg";
import useApi from "../../hooks/useApi";

const { Title, Text } = Typography;

export default function ChangePasswordForm() {
  const navigate = useNavigate();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError("");

      await api.patch("/auth/change-password", {
        oldPassword: values.oldPassword?.trim(),
        newPassword: values.newPassword?.trim(),
      });

      message.success("Password updated successfully.");
      navigate("/user", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row g-0 h-100">
      <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
        <Title
          level={3}
          style={{ marginBottom: 4, fontFamily: "Georgia,serif" }}
          className="text-center"
        >
          Change Password
        </Title>
        <Text type="secondary">
          Update your password by entering your current password and a new one.
        </Text>

        {error ? (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginTop: 16, marginBottom: 6 }}
          />
        ) : null}

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          style={{ marginTop: 18 }}
        >
          <Form.Item
            name="oldPassword"
            label="Old Password"
            rules={[
              { required: true, message: "Old password is required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
            className="mb-0"
          >
            <Input.Password
              size="large"
              placeholder="Enter your current password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "New password is required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
            className="mb-0 mt-2"
          >
            <Input.Password
              size="large"
              placeholder="Enter your new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
            className="mb-0 mt-2"
          >
            <Input.Password
              size="large"
              placeholder="Confirm your new password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            style={{ marginTop: 14 }}
          >
            Update Password
          </Button>
        </Form>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link to="/auth/login" style={{ color: "#22c55e" }}>
            Back to login
          </Link>
        </div>
      </div>

      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="Change password illustration"
          style={{
            width: "100%",
            maxHeight: 420,
            objectFit: "contain",
            padding: 18,
          }}
        />
      </div>
    </div>
  );
}
