import axios, { AxiosInstance, AxiosResponse } from "axios";
import { toast } from "sonner";

// API configuration
const API_BASE_URL = "/api/v1";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
  config => {
    const token = document
      .querySelector('[name="csrf-token"]')
      ?.getAttribute("content");
    if (token) {
      config.headers["X-CSRF-TOKEN"] = token;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = "/user/sign_in";
          break;
        case 403:
          toast.error("You don't have permission to perform this action");
          break;
        case 404:
          toast.error("Resource not found");
          break;
        case 422: {
          // Validation errors
          const errors = error.response.data.errors;
          if (errors) {
            Object.values(errors)
              .flat()
              .forEach((err: any) => {
                toast.error(err);
              });
          }
          break;
        }
        case 500:
          toast.error("An unexpected error occurred. Please try again later.");
          break;
        default:
          toast.error(error.response.data.message || "Something went wrong");
      }
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post("/users/login", { user: data }),
    logout: () => apiClient.delete("/users/logout"),
    me: () => apiClient.get("/users/_me"),
    signup: (data: any) => apiClient.post("/users/signup", { user: data }),
    forgotPassword: (email: string) =>
      apiClient.post("/users/forgot_password", { user: { email } }),
    resetPassword: (data: { password: string; reset_password_token: string }) =>
      apiClient.put("/users/reset_password", { user: data }),
  },

  // Dashboard
  dashboard: {
    get: (timeframe?: string) =>
      apiClient.get("/dashboard", { params: { timeframe } }),
    activities: (params?: { offset?: number; per_page?: number }) =>
      apiClient.get("/dashboard/activities", { params }),
  },

  // Clients
  clients: {
    list: (params?: any) => apiClient.get("/clients", { params }),
    get: (id: string) => apiClient.get(`/clients/${id}`),
    create: (data: FormData) =>
      apiClient.post("/clients", data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    update: (id: string, data: FormData) =>
      apiClient.patch(`/clients/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    delete: (id: string) => apiClient.delete(`/clients/${id}`),
    sendPaymentReminder: (id: string, data: any) =>
      apiClient.post(`/clients/${id}/send_payment_reminder`, data),
    addContact: (id: string, data: any) =>
      apiClient.post(`/clients/${id}/add_client_contact`, data),
    invoices: (id: string, params?: any) =>
      apiClient.get(`/clients/${id}/invoices`, { params }),
  },

  // Projects
  projects: {
    list: (params?: any) => apiClient.get("/projects", { params }),
    get: (id: string) => apiClient.get(`/projects/${id}`),
    create: (data: any) => apiClient.post("/projects", data),
    update: (id: string, data: any) => apiClient.patch(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
    search: (query: string) =>
      apiClient.get("/projects/search", { params: { q: query } }),
  },

  // Invoices
  invoices: {
    list: (params?: any) => apiClient.get("/invoices", { params }),
    get: (id: string) => apiClient.get(`/invoices/${id}`),
    create: (data: any) => apiClient.post("/invoices", data),
    update: (id: string, data: any) => apiClient.patch(`/invoices/${id}`, data),
    delete: (id: string) => apiClient.delete(`/invoices/${id}`),
    send: (id: string, data: any) =>
      apiClient.post(`/invoices/${id}/send_invoice`, data),
    sendReminder: (id: string, data: any) =>
      apiClient.post(`/invoices/${id}/send_reminder`, data),
    download: (id: string) => apiClient.get(`/invoices/${id}/download`),
    view: (id: string) => apiClient.get(`/invoices/${id}/view`),
    waive: (id: string) => apiClient.patch(`/invoices/${id}/waived`),
    bulkDelete: (ids: string[]) =>
      apiClient.post("/invoices/bulk_deletion", { ids }),
    bulkDownload: (ids: string[]) =>
      apiClient.get("/invoices/bulk_download", { params: { ids } }),
    recentlyUpdated: () => apiClient.get("/invoices/recently_updated"),
    analytics: {
      monthlyRevenue: () =>
        apiClient.get("/invoices/analytics/monthly_revenue"),
      revenueByStatus: () =>
        apiClient.get("/invoices/analytics/revenue_by_status"),
    },
  },

  // Time Tracking
  timeTracking: {
    list: (params?: any) => apiClient.get("/time-tracking", { params }),
    entries: {
      list: (params?: any) => apiClient.get("/timesheet_entry", { params }),
      create: (data: any) => apiClient.post("/timesheet_entry", data),
      update: (id: string, data: any) =>
        apiClient.patch(`/timesheet_entry/${id}`, data),
      delete: (id: string) => apiClient.delete(`/timesheet_entry/${id}`),
      bulkUpdate: (data: any) =>
        apiClient.patch("/timesheet_entry/bulk_action", data),
      bulkDelete: (ids: string[]) =>
        apiClient.delete("/timesheet_entry/bulk_action", { data: { ids } }),
    },
  },

  // Team
  team: {
    list: (params?: any) => apiClient.get("/team", { params }),
    get: (id: string) => apiClient.get(`/team/${id}/details`),
    update: (id: string, data: any) => apiClient.patch(`/team/${id}`, data),
    delete: (id: string) => apiClient.delete(`/team/${id}`),
    updateAvatar: (id: string, data: FormData) =>
      apiClient.patch(`/team/${id}/avatar`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    deleteAvatar: (id: string) => apiClient.delete(`/team/${id}/avatar`),
    updateNotificationPreferences: (id: string, data: any) =>
      apiClient.patch(`/team/${id}/notification_preferences`, data),
  },

  // Expenses
  expenses: {
    list: (params?: any) => apiClient.get("/expenses", { params }),
    get: (id: string) => apiClient.get(`/expenses/${id}`),
    create: (data: any) => apiClient.post("/expenses", data),
    update: (id: string, data: any) => apiClient.patch(`/expenses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/expenses/${id}`),
    categories: {
      create: (data: any) => apiClient.post("/expense_categories", data),
    },
  },

  // Reports
  reports: {
    clientRevenues: {
      list: (params?: any) =>
        apiClient.get("/reports/client_revenues", { params }),
      download: (params?: any) =>
        apiClient.get("/reports/client_revenues/download", { params }),
    },
    timeEntries: {
      list: (params?: any) =>
        apiClient.get("/reports/time_entries", { params }),
      download: (params?: any) =>
        apiClient.get("/reports/time_entries/download", { params }),
    },
    outstandingInvoices: {
      list: (params?: any) =>
        apiClient.get("/reports/outstanding_overdue_invoices", { params }),
      download: (params?: any) =>
        apiClient.get("/reports/outstanding_overdue_invoices/download", {
          params,
        }),
    },
    accountsAging: {
      list: (params?: any) =>
        apiClient.get("/reports/accounts_aging", { params }),
      download: (params?: any) =>
        apiClient.get("/reports/accounts_aging/download", { params }),
    },
  },

  // Payments
  payments: {
    list: (params?: any) => apiClient.get("/payments", { params }),
    create: (data: any) => apiClient.post("/payments", data),
    settings: {
      get: () => apiClient.get("/payments/settings"),
      connectStripe: (data: any) =>
        apiClient.post("/payments/settings/stripe/connect", data),
      disconnectStripe: () =>
        apiClient.delete("/payments/settings/stripe/disconnect"),
    },
    providers: {
      list: () => apiClient.get("/payments/providers"),
      update: (id: string, data: any) =>
        apiClient.patch(`/payments/providers/${id}`, data),
    },
  },

  // Companies
  companies: {
    list: () => apiClient.get("/companies"),
    create: (data: any) => apiClient.post("/companies", data),
    update: (id: string, data: any) =>
      apiClient.patch(`/companies/${id}`, data),
    deleteLogo: (id: string) => apiClient.delete(`/companies/${id}/purge_logo`),
  },

  // Profile
  profile: {
    update: (data: any) => apiClient.patch("/profile", data),
    bankDetails: {
      list: () => apiClient.get("/profiles/bank_account_details"),
      create: (data: any) =>
        apiClient.post("/profiles/bank_account_details", data),
      update: (accountId: string, data: any) =>
        apiClient.patch(`/profiles/bank_account_details/${accountId}`, data),
    },
  },

  // Workspaces
  workspaces: {
    list: () => apiClient.get("/workspaces"),
    update: (id: string, data: any) =>
      apiClient.patch(`/workspaces/${id}`, data),
  },

  // Invitations
  invitations: {
    create: (data: any) => apiClient.post("/invitations", data),
    update: (id: string, data: any) =>
      apiClient.patch(`/invitations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/invitations/${id}`),
    resend: (id: string) => apiClient.post(`/invitations/${id}/resend`),
  },

  // Holidays
  holidays: {
    list: (year: number) => apiClient.get("/holidays", { params: { year } }),
    update: (year: number, data: any) =>
      apiClient.patch(`/holidays/${year}`, data),
  },

  // Leaves
  leaves: {
    list: () => apiClient.get("/leaves"),
    create: (data: any) => apiClient.post("/leaves", data),
    update: (id: string, data: any) => apiClient.patch(`/leaves/${id}`, data),
    delete: (id: string) => apiClient.delete(`/leaves/${id}`),
    types: {
      list: (leaveId: string) =>
        apiClient.get(`/leaves/${leaveId}/leave_types`),
      create: (leaveId: string, data: any) =>
        apiClient.post(`/leaves/${leaveId}/leave_types`, data),
      update: (leaveId: string, typeId: string, data: any) =>
        apiClient.patch(`/leaves/${leaveId}/leave_types/${typeId}`, data),
      delete: (leaveId: string, typeId: string) =>
        apiClient.delete(`/leaves/${leaveId}/leave_types/${typeId}`),
    },
  },

  // Timeoff Entries
  timeoffEntries: {
    list: (params?: any) => apiClient.get("/timeoff_entries", { params }),
    get: (id: string) => apiClient.get(`/timeoff_entries/${id}`),
    create: (data: any) => apiClient.post("/timeoff_entries", data),
    update: (id: string, data: any) =>
      apiClient.patch(`/timeoff_entries/${id}`, data),
    delete: (id: string) => apiClient.delete(`/timeoff_entries/${id}`),
  },

  // Vendors
  vendors: {
    create: (data: any) => apiClient.post("/vendors", data),
  },

  // Timezones
  timezones: {
    list: () => apiClient.get("/timezones"),
  },
};

export default apiClient;
