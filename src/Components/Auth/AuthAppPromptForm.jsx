import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, message, Space, Typography } from "antd";
import logo from "../../assets/svg/Enter OTP-pana.svg";
import AuthSplit from "./AuthSplit";
import { AUTH_ROUTES, loginPathFor } from "./authFlow";
import { IoPlaySkipForwardOutline } from "react-icons/io5";

const { Text } = Typography;

/**
 * Flow: after the email OTP is verified for a user WITHOUT an auth app:
 *   "Auth App Integration choose?"
 *     Yes -> /auth/auth-app-setup (QR registration)
 *     No  -> back to Login
 */
export default function AuthAppPromptForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const { email, isAdminLogin = false, authResponse } = location.state ?? {};

  if (!email || !authResponse) return <Navigate to={AUTH_ROUTES.LOGIN} replace />;

  const handleSkip = () => {
    try {
      // 1. Complete the login using the existing authResponse token
      // Example: login(authResponse);

      message.success("Logged in successfully!");

      // 2. Redirect to your app's main dashboard or home route
      navigate(isAdminLogin ? "/admin/dashboard" : "/dashboard", {
        replace: true
      });
    } catch (error) {
      message.error("Failed to complete login. Please try again.");
    }
  };

  return (
    <AuthSplit
      title="Authenticator App"
      subtitle="Would you like to secure your account with an authenticator app?"
      image={logo}
      alt="Authenticator app"
    >
      <Text style={{ marginTop: 12 }}>
        You will scan a QR code with Google Authenticator, Authy or a similar app.
      </Text>

      <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 18 }}>
        <Button
          type="primary"
          block
          size="large"
          onClick={() =>
            navigate(AUTH_ROUTES.AUTH_APP_SETUP, {
              replace: true,
              state: { email, isAdminLogin, authResponse },
            })
          }
        >
          Yes, set it up
        </Button>
        <Button
          block
          size="large"
          onClick={handleSkip}
        >
          <IoPlaySkipForwardOutline />  Skip for now
        </Button>
      </Space>
    </AuthSplit>
  );
}
