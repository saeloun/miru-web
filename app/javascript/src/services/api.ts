import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add CSRF token to all requests
api.interceptors.request.use(config => {
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
  if (token) {
    config.headers["X-CSRF-Token"] = token;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = "/user/sign_in";
    }

    return Promise.reject(error);
  }
);

// User/Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/users/login", { user: { email, password } }),
  logout: () => api.delete("/users/logout"),
  me: () => api.get("/users/_me"),
};

// Client APIs
export const clientsApi = {
  list: (params?: any) => api.get("/clients", { params }),
  get: (id: string | number) => api.get(`/clients/${id}`),
  create: (data: any) => api.post("/clients", data),
  update: (id: string | number, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string | number) => api.delete(`/clients/${id}`),
  sendPaymentReminder: (id: string | number, data: any) =>
    api.post(`/clients/${id}/send_payment_reminder`, data),
  addContact: (id: string | number, data: any) =>
    api.post(`/clients/${id}/add_client_contact`, data),
};

// Project APIs
export const projectsApi = {
  list: (params?: any) => api.get("/projects", { params }),
  get: (id: string | number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string | number, data: any) =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string | number) => api.delete(`/projects/${id}`),
  search: (term: string) =>
    api.get("/projects/search", { params: { q: term } }),
};

// Invoice APIs
export const invoicesApi = {
  list: (params?: any) => api.get("/invoices", { params }),
  get: (id: string | number) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post("/invoices", data),
  update: (id: string | number, data: any) =>
    api.patch(`/invoices/${id}`, data),
  delete: (id: string | number) => api.delete(`/invoices/${id}`),
  bulkDelete: (ids: number[]) =>
    api.post("/invoices/bulk_deletion", { invoice_ids: ids }),
  send: (id: string | number, data: any) =>
    api.post(`/invoices/${id}/send_invoice`, data),
  sendReminder: (id: string | number, data: any) =>
    api.post(`/invoices/${id}/send_reminder`, data),
  download: (id: string | number) =>
    api.get(`/invoices/${id}/download`, { responseType: "blob" }),
  bulkDownload: (params: any) => api.get("/invoices/bulk_download", { params }),
  view: (id: string | number) => api.get(`/invoices/${id}/view`),
  waive: (id: string | number) => api.patch(`/invoices/${id}/waived`),
};

// Timesheet APIs
export const timesheetApi = {
  create: (data: any) => api.post("/timesheet_entry", data),
};

// Combined API export for backward compatibility
export const apiService = {
  auth: authApi,
  clients: clientsApi,
  projects: projectsApi,
  invoices: invoicesApi,
  timesheet: timesheetApi,
};

export { api };
export default api;
