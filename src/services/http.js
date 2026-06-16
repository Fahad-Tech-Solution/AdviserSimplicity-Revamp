import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Cookie-based auth: the backend sets an HttpOnly session/JWT cookie on login.
 * The browser sends it automatically on every request when withCredentials is true.
 * Do NOT read or store the token in JS, localStorage, or jotai.
 *
 * Dev: leave VITE_API_BASE_URL empty so `/api/*` is proxied by vite.config.js.
 * Production (GitHub Pages): set VITE_API_BASE_URL to the real API host.
 */
const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Optional: dispatch logout / redirect to login when session cookie expires.
      // Keep this lightweight — route guards handle unauthenticated UI.
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    return Promise.reject(error);
  },
);

export default http;
