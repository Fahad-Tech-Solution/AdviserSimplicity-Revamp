import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import logo from "../../assets/svg/Mobile login-pana.svg";
import adminLogo from "../../assets/svg/Telecommuting-pana.svg";

const { Title, Text } = Typography;

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
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

      // Placeholder auth flow: replace with real API call.
      localStorage.setItem("token", "sample-token");
      localStorage.setItem(
        "permissions",
        JSON.stringify(["fact find", "prospects"]),
      );
      localStorage.setItem("loggedInEmail", values.email.toLowerCase());

      if (isAdminLogin) {
        localStorage.setItem("permissions", JSON.stringify(["superAdmin"]));
        navigate("/super/admin", { replace: true });
        return;
      }

      navigate("/user", { replace: true });
    } catch {
      setError("Login failed. Please try again.");
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
            <Link to="/auth/forget-password" style={{ color: "#36b446" }}>
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
            <Link to="/auth/register" style={{ color: "#36b446" }}>
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
