import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import logo from "../../assets/svg/Mobile login-pana.svg";
import adminLogo from "../../assets/svg/Telecommuting-pana.svg";
import useApi from "../../hooks/useApi";
import useAuthSession from "../../hooks/useAuthSession";

const { Title, Text } = Typography;

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const { saveSessionFromAuthResponse } = useAuthSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdminLogin = useMemo(
    () => location.pathname === "/auth/admin-login",
    [location.pathname],
  );

  const handleLogin = async (values) => {
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        email: values.email.toLowerCase().trim(),
        passwordHash: values.passwordHash.trim(),
        roleName: isAdminLogin ? "superAdmin" : "Adviser",
      };

      let res = await api.post("/auth/login-v2", payload);

      if (res?.requiresOtp) {
        message.success(res?.message);
        navigate("/auth/otp-validation", {
          replace: true,
          state: {
            email: values.email.toLowerCase().trim(),
            isAdminLogin: isAdminLogin,
          },
        });
      } else {
        saveSessionFromAuthResponse(res, values.email);

        if (res?.action === "pricing table") {
          navigate("/auth/pricing-table", { replace: true });
          message.success(res?.subscription?.message);
        } else {
          if (isAdminLogin) {
            navigate("/super-admin", { replace: true });
          } else {
            navigate("/user", { replace: true });
          }
          message.success(res?.message);
        }
      }
    } catch (err) {
      let msg = err?.response?.data?.message || err?.message || "Login failed.";
      //if error is 401, show "Invalid email or password"
      // if (err?.response?.status === 401) {
      //   msg = "Invalid email or password";
      // }
      message.error(msg);
      setError(msg);
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
          {isAdminLogin ? "Admin Login" : "Login"}
        </Title>
        <Text type="secondary">Enter your credentials to continue.</Text>

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
          onFinish={handleLogin}
          requiredMark={false}
          style={{ marginTop: 18 }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
            className="mb-0"
          >
            <Input placeholder="someone@example.com" size="large" />
          </Form.Item>

          <Form.Item
            name="passwordHash"
            label="Password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
            className="mb-0 mt-2"
          >
            <Input.Password
              size="large"
              placeholder="Password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <div style={{ textAlign: "right", marginBottom: 14 }}>
            <Link to="/auth/forget-password" style={{ color: "#22c55e" }}>
              Forgot Password?
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
          >
            Login
          </Button>
        </Form>

        {!isAdminLogin && (
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <Text type="secondary">Don&apos;t have an account? </Text>
            <Link to="/auth/register" style={{ color: "#22c55e" }}>
              Register
            </Link>
          </div>
        )}
      </div>
      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={!isAdminLogin ? logo : adminLogo}
          alt="Login illustration"
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
