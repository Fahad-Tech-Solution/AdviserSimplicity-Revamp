import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, App as AntdApp, Button, Form, Input, Spin } from "antd";
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

  const [qrUrl, setQrUrl] = useState(""); // base64 data URL of the QR image
  const [expiresIn, setExpiresIn] = useState(null);
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

        console.log("authResponse in AuthAppSetupForm:", authResponse);
        const res = await api.post(AUTH_ENDPOINTS.AUTH_APP_SETUP, {
          email,
          roleName,
        },// send bearer token if authResponse is present
          authResponse ? { headers: { Authorization: `Bearer ${authResponse.enrollmentToken}` } } : {}
        );
        // Backend returns { qrCode: "data:image/png;base64,...", expiresInMinutes }
        if (mounted) {
          setQrUrl(res?.qrCode ?? "");
          setExpiresIn(res?.expiresInMinutes ?? null);
        }
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
      const token = String(values.otp ?? "").replace(/\D/g, "");
      const res = await api.post(AUTH_ENDPOINTS.AUTH_APP_VERIFY, {
        email,
        token,
        roleName,
      },
        authResponse ? { headers: { Authorization: `Bearer ${authResponse.enrollmentToken}` } } : {});
      // Validation passed -> subscription check (res must carry the session/action;
      // authResponse is NOT merged because its action is "registerAuthenticator").
      finishLogin(res, email);
    } catch (err) {
      // Validation failed -> back to login (per flow)
      message.error(
        err?.response?.data?.message || err?.message || "Authenticator validation failed.",
      );
      // navigate(loginPathFor(isAdminLogin), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const qrNode = loadingQr ? (
    <Spin />
  ) : qrUrl ? (
    <div className="text-center">
      <img
        src={qrUrl}
        alt="Authenticator QR code"
        style={{ width: 220, height: 220, objectFit: "contain" }}
      />
      {expiresIn ? (
        <div style={{ marginTop: 8, fontSize: 13, color: "rgba(0,0,0,0.45)" }}>
          Scan this QR code with your authenticator app.
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <AuthSplit
      title="Set Up Authenticator"
      subtitle="Scan the QR code with your authenticator app, then enter the 6-digit code."
      aside={qrNode}
    >
      {error ? (
        <Alert type="error" message={error} showIcon style={{ marginTop: 16 }} />
      ) : null}

      {/* QR is hidden in the right column on small screens, so show it here too */}
      <div className="d-md-none text-center" style={{ marginTop: 16 }}>
        {qrNode}
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