import http from "./http";

export async function loginApi(payload) {
  const { data } = await http.post("/api/auth/login", payload);
  return data;
}

export async function registerApi(payload) {
  const { data } = await http.post("/api/auth/register", payload);
  return data;
}

export async function forgotPasswordApi(email) {
  const { data } = await http.patch("/api/auth/forgot-password", { email });
  return data;
}

export async function verifyOtpApi(payload) {
  const { data } = await http.post("/api/auth/verify-otp", payload);
  return data;
}

export async function resetPasswordApi(payload) {
  const { data } = await http.patch("/api/auth/reset-password", payload);
  return data;
}
