import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "";

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default http;
