import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "";

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  // Authorization header is centrally synced from Recoil in App.jsx
  if (http.defaults.headers.common.Authorization) {
    config.headers.Authorization = http.defaults.headers.common.Authorization;
  }

  return config;
});

export default http;
