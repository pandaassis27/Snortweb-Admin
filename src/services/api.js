import axios from "axios";
import toast from "react-hot-toast";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
console.log("[DEBUG_AUTH] Initializing API Service. VITE_API_URL:", VITE_API_URL);

const API = axios.create({
  baseURL: VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Request interceptor to attach JWT token and log request
API.interceptors.request.use(
  (config) => {
    // Log the request method and URL
    console.log(`[DEBUG_AUTH] API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Log payload securely (mask password)
    if (config.data) {
      const safeData = { ...config.data };
      if (safeData.password) safeData.password = "***MASKED***";
      console.log(`[DEBUG_AUTH] Request Payload:`, safeData);
    }

    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for generic error handling (401, 429) and debug logs
API.interceptors.response.use(
  (response) => {
    console.log(`[DEBUG_AUTH] API Response Status: ${response.status} OK`);
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response) {
      console.log(`[DEBUG_AUTH] API Response Status: ${error.response.status}`);
      console.log(`[DEBUG_AUTH] API Response Error JSON:`, error.response.data);
      
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
      console.log(`[DEBUG_AUTH] API Network Error (No response received)`);
      toast.error("Network error. Please check your connection.", { id: 'network-error' });
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
  getAll: (params, config = {}) => API.get("/projects", { params, ...config }),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post("/projects", data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  bulkDelete: (ids) => API.post("/projects/bulk-delete", { ids }),
};

export const reviewAPI = {
  getAll: (params, config = {}) => API.get("/reviews", { params, ...config }),
  getById: (id) => API.get(`/reviews/${id}`),
  create: (data) => API.post("/reviews", data),
  update: (id, data) => API.put(`/reviews/${id}`, data),
  delete: (id) => API.delete(`/reviews/${id}`),
  bulkDelete: (ids) => API.post("/reviews/bulk-delete", { ids }),
};

export const inquiryAPI = {
  getAll: (params, config = {}) => API.get("/inquiries", { params, ...config }),
  getById: (id) => API.get(`/inquiries/${id}`),
  update: (id, data) => API.put(`/inquiries/${id}`, data),
  delete: (id) => API.delete(`/inquiries/${id}`),
  bulkDelete: (ids) => API.post("/inquiries/bulk-delete", { ids }),
};

export const mediaAPI = {
  getAll: (params) => API.get("/media", { params }),
  upload: (data, config = {}) => API.post("/media", data, { ...config, headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => API.delete(`/media/${id}`),
};

export const auditAPI = {
  getAll: (params, config = {}) => API.get("/audit-logs", { params, ...config }),
};

export const dashboardAPI = {
  getStats: (config = {}) => API.get("/dashboard/stats", config),
};

export default API;
