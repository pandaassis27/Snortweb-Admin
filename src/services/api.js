import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
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
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post("/auth/login", credentials),
  register: (data) => API.post("/auth/register", data),
  getProfile: () => API.get("/auth/profile"),
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
