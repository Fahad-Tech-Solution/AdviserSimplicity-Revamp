import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Space } from "antd";
import { MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import logo from "../../assets/svg/Enter OTP-pana.svg";
import useApi from "../../hooks/useApi";
import AuthSplit from "./AuthSplit";
import {
  AUTH_ENDPOINTS,
  AUTH_ROUTES,
  getRoleName,
  loginPathFor,
} from "./authFlow";

/**
 * Flow: "Auth app integrated = Yes" -> Multi choose option
 *   - Email OTP    -> send OTP to email -> /auth/otp-validation
 *   - Auth app OTP -> /auth/auth-app-verify
 */
export default function ChooseMethodForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const email = location.state?.email ?? "";
  const isAdminLogin = location.state?.isAdminLogin ?? false;

  if (!email) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;

  const handleEmailOtp = async () => {
    try {
      setSending(true);
      setError("");
      const res = await api.post(AUTH_ENDPOINTS.SEND_EMAIL_OTP, {
        email,
        roleName: getRoleName(isAdminLogin),
      });
      message.success(res?.message || "OTP sent to your email.");
      navigate(AUTH_ROUTES.OTP, {
        replace: true,
        state: { email, isAdminLogin, authAppIntegrated: true },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Could not send OTP.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleAuthApp = () => {
    navigate(AUTH_ROUTES.AUTH_APP_VERIFY, {
      replace: true,
      state: { email, isAdminLogin },
    });
  };

  return (
    <AuthSplit
      title="Choose Verification"
      subtitle="Select how you want to verify your login."
      image={logo}
      alt="Choose verification method"
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} />
      ) : null}

      <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 18 }}>
        <Button
          block
          size="large"
          icon={<MailOutlined />}
          loading={sending}
          onClick={handleEmailOtp}
        >
          Email OTP
        </Button>
        <Button
          type="primary"
          block
          size="large"
          icon={<SafetyCertificateOutlined />}
          disabled={sending}
          onClick={handleAuthApp}
        >
          Authenticator App OTP
        </Button>
      </Space>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <Link to={loginPathFor(isAdminLogin)} replace style={{ color: "#22c55e" }}>
          Back to login
        </Link>
      </div>
    </AuthSplit>
  );
}
