import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("decentracert_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/verify")) {
      localStorage.removeItem("decentracert_token");
      localStorage.removeItem("decentracert_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
