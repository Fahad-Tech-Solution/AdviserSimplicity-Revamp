import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  App as AntdApp,
  Button,
  Form,
  Input,
  Space,
  Typography,
} from "antd";
import logo from "../../assets/svg/Enter OTP-pana.svg";
import useApi from "../../hooks/useApi";
import useAuthSession from "../../hooks/useAuthSession";

const { Title, Text } = Typography;
const OTP_EXPIRY_SECONDS = 10 * 60;

function formatRemainingTime(totalSeconds) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function VerifyOtpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { message } = AntdApp.useApp();
  const { saveSessionFromAuthResponse } = useAuthSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);

  const email = location.state?.email ?? "";
  const redirectTo = location.state?.redirectTo ?? "/user";
  const isAdminLogin = location.state?.isAdminLogin ?? false;

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const isOtpExpired = timeLeft === 0;

  const handleVerifyOtp = async (values) => {
    if (isOtpExpired) {
      setError("OTP has expired. Please login again to request a new OTP.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const cleanedOtp = String(values.otp ?? "").replace(/\D/g, "");
      const res = await api.post("/api/auth/login-verify-otp", {
        email,
        otp: cleanedOtp,
      });

      if (res?.action === "dashboard" || res?.action === "superAdmin") {
        saveSessionFromAuthResponse(res, email);
        if (isAdminLogin) {
          navigate("/super-admin", { replace: true });
        } else {
          navigate("/user", { replace: true });
        }
        message.success("OTP verified. Login successful.");
        return;
      } else if (res?.action === "pricing table") {
        saveSessionFromAuthResponse(res, email);

        navigate("/auth/pricing-table", { replace: true });
        message.success("OTP verified. Please select a plan to continue.");
        return;
      }

      message.success("OTP verified. Login successful.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "OTP verification failed.",
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
          Verify OTP
        </Title>
        <Text type="secondary">
          Enter the OTP sent to <strong>{email?.toLowerCase()}</strong> to
          complete login.
        </Text>

        {error ? (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginTop: 16, marginBottom: 6 }}
          />
        ) : null}

        {isOtpExpired ? (
          <Alert
            type="warning"
            message="OTP expired"
            description="Your 10-minute OTP window has expired. Please go back to login and request a new OTP."
            showIcon
            style={{ marginTop: 16, marginBottom: 6 }}
          />
        ) : null}

        <Form
          layout="vertical"
          onFinish={handleVerifyOtp}
          requiredMark={false}
          style={{ marginTop: 18 }}
          styles={{
            label: {
              fontWeight: 600,
              fontSize: 13,
              color: "rgb(55, 65, 81)",
              fontFamily: "Arial,serif",
            },
          }}
        >
          <Form.Item
            name="otp"
            label="OTP"
            rules={[
              { required: true, message: "OTP is required" },
              { len: 6, message: "OTP must be 6 digits" },
              { pattern: /^\d{6}$/, message: "OTP must contain numbers only" },
            ]}
            className="mb-0"
            extra={
              <span
                style={{
                  float: "right",
                  fontWeight: 400,
                  color: "rgba(12, 177, 48, 0.66)",
                  fontSize: 14,
                  fontFamily: "Arial,serif",
                }}
              >
                {formatRemainingTime(timeLeft)}
              </span>
            }
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
            disabled={isOtpExpired}
            style={{ marginTop: 14 }}
          >
            Verify OTP
          </Button>
        </Form>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <Link
            to="/auth/login"
            replace
            style={{ color: "#22c55e" }}
            onClick={() => setError("")}
          >
            Back to login
          </Link>
        </div>
      </div>

      <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-light">
        <img
          src={logo}
          alt="OTP verification illustration"
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
