import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Spin } from "antd";
import useApi from "../../hooks/useApi";
import AuthSplit from "./AuthSplit";
import QrCodeDisplay from "./QrCodeDisplay";
import useFinishLogin from "./useFinishLogin";
import {
  AUTH_ENDPOINTS,
  AUTH_ROUTES,
  getRoleName,
  loginPathFor,
} from "./authFlow";

/**
 * Flow: user auth app registration -> scannable QR -> validate auth app
 *   valid   -> check subscription (pricing table / dashboard)
 *   invalid -> back to Login
 */
export default function AuthAppSetupForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const finishLogin = useFinishLogin();

  const [qrUrl, setQrUrl] = useState("");
  const [loadingQr, setLoadingQr] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { email, isAdminLogin = false, authResponse } = location.state ?? {};
  const roleName = getRoleName(isAdminLogin);

  useEffect(() => {
    if (!email) return;
    let mounted = true;

    (async () => {
      try {
        const res = await api.post(AUTH_ENDPOINTS.AUTH_APP_SETUP, { email, roleName });
        if (mounted) setQrUrl(res?.qrCodeUrl ?? "");
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.message || err?.message || "Could not load QR code.",
          );
        }
      } finally {
        if (mounted) setLoadingQr(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  if (!email || !authResponse) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;

  const handleValidate = async (values) => {
    try {
      setSubmitting(true);
      setError("");
      const otp = String(values.otp ?? "").replace(/\D/g, "");
      const res = await api.post(AUTH_ENDPOINTS.AUTH_APP_VERIFY, {
        email,
        otp,
        roleName,
      });
      // Validation passed -> subscription check
      finishLogin(res?.action ? res : { ...authResponse, ...res }, email, isAdminLogin);
    } catch (err) {
      // Validation failed -> back to login (per flow)
      message.error(
        err?.response?.data?.message || err?.message || "Authenticator validation failed.",
      );
      navigate(loginPathFor(isAdminLogin), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplit
      title="Set Up Authenticator"
      subtitle="Scan the QR code with your authenticator app, then enter the 6-digit code."
      aside={
        loadingQr ? <Spin /> : qrUrl ? <QrCodeDisplay backendUrl={qrUrl} /> : null
      }
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} />
      ) : null}

      {/* QR is hidden in the right column on small screens, so show it here too */}
      <div className="d-md-none text-center" style={{ marginTop: 16 }}>
        {loadingQr ? <Spin /> : qrUrl ? <QrCodeDisplay backendUrl={qrUrl} /> : null}
      </div>

      <Form
        layout="vertical"
        onFinish={handleValidate}
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
          disabled={loadingQr || !qrUrl}
          style={{ marginTop: 14 }}
        >
          Validate &amp; Continue
        </Button>
      </Form>

      <div style={{ marginTop: 14, textAlign: "center" }}>
        <Link to={loginPathFor(isAdminLogin)} replace style={{ color: "#22c55e" }}>
          Back to login
        </Link>
      </div>
    </AuthSplit>
  );
}
