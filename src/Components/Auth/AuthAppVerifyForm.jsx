import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Alert, Button, Form, Input } from "antd";
import logo from "../../assets/svg/Enter OTP-pana.svg";
import useApi from "../../hooks/useApi";
import AuthSplit from "./AuthSplit";
import useFinishLogin from "./useFinishLogin";
import {
  AUTH_ENDPOINTS,
  AUTH_ROUTES,
  getRoleName,
  loginPathFor,
} from "./authFlow";

/**
 * Flow: user chose "Auth app OTP" on the multi-choice screen.
 *   valid   -> check subscription (pricing table / dashboard)
 *   invalid -> error; user can retry or switch to Email OTP
 */
export default function AuthAppVerifyForm() {
  const location = useLocation();
  const api = useApi();
  const finishLogin = useFinishLogin();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const email = location.state?.email ?? "";
  const isAdminLogin = location.state?.isAdminLogin ?? false;

  if (!email) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;

  const handleVerify = async (values) => {
    try {
      setSubmitting(true);
      setError("");
      const otp = String(values.otp ?? "").replace(/\D/g, "");
      const res = await api.post(AUTH_ENDPOINTS.AUTH_APP_VERIFY, {
        email,
        otp,
        roleName: getRoleName(isAdminLogin),
      });
      finishLogin(res, email, isAdminLogin, "Verified. Login successful.");
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Verification failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplit
      title="Authenticator App"
      subtitle="Enter the 6-digit code from your authenticator app."
      image={logo}
      alt="Authenticator verification"
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} />
      ) : null}

      <Form
        layout="vertical"
        onFinish={handleVerify}
        requiredMark={false}
        style={{ marginTop: 18 }}
      >
        <Form.Item
          name="otp"
          label="Authenticator code"
          rules={[
            { required: true, message: "Code is required" },
            { pattern: /^\d{6}$/, message: "Code must be 6 digits" },
          ]}
          className="mb-0"
        >
          <Input.OTP
            length={6}
            size="large"
            inputMode="numeric"
            formatter={(value) => value.replace(/\D/g, "")}
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
          Verify
        </Button>
      </Form>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <Link
          to={AUTH_ROUTES.CHOOSE_METHOD}
          replace
          state={{ email, isAdminLogin }}
          style={{ color: "#22c55e" }}
        >
          Use Email OTP instead
        </Link>
        <span style={{ margin: "0 8px" }}>|</span>
        <Link to={loginPathFor(isAdminLogin)} replace style={{ color: "#22c55e" }}>
          Back to login
        </Link>
      </div>
    </AuthSplit>
  );
}
