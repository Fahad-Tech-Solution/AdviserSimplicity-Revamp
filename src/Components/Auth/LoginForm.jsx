import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Space, Typography } from "antd";
import { ClockCircleOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import logo from "../../assets/svg/Mobile login-pana.svg";
import adminLogo from "../../assets/svg/Telecommuting-pana.svg";
import useApi from "../../hooks/useApi";
import useAuthSession from "../../hooks/useAuthSession";
import { AUTH_ROUTES } from "./authFlow";

const { Title, Text } = Typography;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const { saveSessionFromAuthResponse } = useAuthSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loginAttemptsFailed, setLoginAttemptsFailed] = useState(0);

  const isAdminLogin = useMemo(
    () => location.pathname === "/auth/admin-login",
    [location.pathname],
  );

  // Timer effect counting down every 1 second (1000ms)
  useEffect(() => {
    if (loginAttemptsFailed > 0) {
      const timer = setInterval(() => {
        setLoginAttemptsFailed((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loginAttemptsFailed]);

  const handleLogin = async (values) => {
    try {
      setSubmitting(true);
      setError("");

      const email = values.email.toLowerCase().trim();
      const payload = {
        email,
        passwordHash: values.passwordHash.trim(),
        roleName: isAdminLogin ? "superAdmin" : "Adviser",
      };

      const res = await api.post("/auth/login-v2", payload);

      if (res?.authAppIntegrated === true) {
        // Credentials valid + auth app already integrated -> let the user choose
        // between Email OTP and Authenticator App OTP.
        navigate(AUTH_ROUTES.CHOOSE_METHOD, {
          replace: true,
          state: { email, isAdminLogin },
        });
      } else if (res?.requiresOtp) {
        // Credentials valid + no auth app -> OTP was sent to email.
        message.success(res?.message);
        navigate(AUTH_ROUTES.OTP, {
          replace: true,
          state: {
            email,
            isAdminLogin,
            authAppIntegrated: false,
          },
        });
      } else {
        // Existing behaviour kept as fallback.
        saveSessionFromAuthResponse(res, values.email);

        if (res?.action === "pricing table") {
          navigate(AUTH_ROUTES.PRICING, { replace: true });
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
      const msg = err?.response?.data?.message || err?.message || "Login failed.";
      if (err?.response?.status === 429) {
        message.error(msg);
        setError(msg);
        setLoginAttemptsFailed(err?.response?.data?.retryAfter);
      } else {
        const text = err?.response?.status === 401 ? "Invalid email or password" : msg;
        message.error(text);
        setError(text);
      }
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

        {(error || loginAttemptsFailed > 0) && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16, marginBottom: 16 }}
            message={error || "Too many failed login attempts"}
            description={
              loginAttemptsFailed > 0 ? (
                <Space size="small" style={{ marginTop: 4 }}>
                  <ClockCircleOutlined />
                  <span>Remaining cooling time:</span>
                  <Text type="danger" strong>
                    {formatTime(loginAttemptsFailed)}
                  </Text>
                </Space>
              ) : null
            }
          />
        )}

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