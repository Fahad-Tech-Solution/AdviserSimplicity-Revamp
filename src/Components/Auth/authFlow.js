// Central place for the NEW auth-flow endpoints and helpers.
// Existing endpoints (/auth/login-v2, /auth/login-verify-otp) are still used inline
// in LoginForm / VerifyOtpForm and are unchanged.
//
// TODO: confirm these paths and payloads with your backend. They are placeholders.
export const AUTH_ENDPOINTS = {
  SEND_EMAIL_OTP: "/auth/send-email-otp", // body: { email, roleName }
  AUTH_APP_SETUP: "/auth/auth-app/setup", // body: { email, roleName } -> { qrCodeUrl }
  AUTH_APP_VERIFY: "/auth/auth-app/verify", // body: { email, otp, roleName } -> auth response
};

export const getRoleName = (isAdminLogin) => (isAdminLogin ? "superAdmin" : "Adviser");

export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  ADMIN_LOGIN: "/auth/admin-login",
  OTP: "/auth/otp-validation",
  CHOOSE_METHOD: "/auth/choose-method",
  AUTH_APP_PROMPT: "/auth/auth-app-prompt",
  AUTH_APP_SETUP: "/auth/auth-app-setup",
  AUTH_APP_VERIFY: "/auth/auth-app-verify",
  PRICING: "/auth/pricing-table",
};

export const loginPathFor = (isAdminLogin) =>
  isAdminLogin ? AUTH_ROUTES.ADMIN_LOGIN : AUTH_ROUTES.LOGIN;
