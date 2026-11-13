import { useNavigate } from "react-router-dom";
import { App as AntdApp } from "antd";
import useAuthSession from "../../hooks/useAuthSession";
import { AUTH_ROUTES } from "./authFlow";

/**
 * Final step of the flow ("Check subscription"):
 *  - no subscription -> pricing table
 *  - subscribed      -> dashboard
 * Same behaviour the original LoginForm / VerifyOtpForm had.
 */
export default function useFinishLogin() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const { saveSessionFromAuthResponse } = useAuthSession();

  return (res, email, isAdminLogin, successText) => {
    saveSessionFromAuthResponse(res, email);

    if (res?.action === "pricing table") {
      navigate(AUTH_ROUTES.PRICING, { replace: true });
      message.success(
        successText || res?.subscription?.message || "Please select a plan to continue.",
      );
      return;
    }

    navigate(isAdminLogin ? "/super-admin" : "/user", { replace: true });
    message.success(successText || res?.message || "Login successful.");
  };
}
