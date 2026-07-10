/**
 * src/api/axios.js
 * Centralised Axios instance for SkillSphere.
 * Automatically attaches JWT token and handles 401 logout.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

// ── Request interceptor: attach stored token ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ss_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle global 401 ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ss_token");
      localStorage.removeItem("ss_user");
      // Only redirect if we're not already on auth pages
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
