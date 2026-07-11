import axios from "axios";
import toast from "react-hot-toast";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling (401, 429)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 Unauthorized - token expired or invalid
      if (error.response.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        // We will dispatch a custom event to notify AuthContext to log out gracefully
        window.dispatchEvent(new Event("auth-unauthorized"));
      }

      // 429 Too Many Requests - rate limiting
      if (error.response.status === 429) {
        toast.error("Too many requests. Please slow down.");
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post("/auth/login", credentials),
  register: (data) => API.post("/auth/register", data),
  getProfile: (config = {}) =>
    API.get("/auth/profile", {
      ...config,

    }),
};

export const projectAPI = {
  getAll: () => API.get("/projects"),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post("/projects", data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
};

export const reviewAPI = {
  getAll: () => API.get("/reviews"),
  getById: (id) => API.get(`/reviews/${id}`),
  create: (data) => API.post("/reviews", data),
  update: (id, data) => API.put(`/reviews/${id}`, data),
  delete: (id) => API.delete(`/reviews/${id}`),
};

export const inquiryAPI = {
  getAll: () => API.get("/inquiries"),
  getById: (id) => API.get(`/inquiries/${id}`),
  update: (id, data) => API.put(`/inquiries/${id}`, data),
  delete: (id) => API.delete(`/inquiries/${id}`),
};

export default API;
