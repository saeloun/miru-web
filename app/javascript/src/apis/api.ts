import axios from "axios";
import { Toastr } from "StyledComponents";

import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
} from "utils/storage";

class ApiHandler {
  axios: any;
  constructor() {
    this.axios = axios.create({
      baseURL: "/api/v1",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN":
          document
            .querySelector('[name="csrf-token"]')
            ?.getAttribute("content") || "",
      },
    });

    this.axios.interceptors.response.use(
      (response: any) => {
        if (response) {
          const { data, status } = response;
          (response as any).success = status === 200;
          const { reset_session, notice } = data;
          if (data && !reset_session && notice) {
            Toastr.success(notice);
          }
        }

        return response;
      },
      (error: any) => {
        if (error.response?.status === 401) {
          const token = getValueFromLocalStorage("authToken");
          if (token) {
            clearCredentialsFromLocalStorage();
            Toastr.error(
              error.response?.data?.error ||
                "Session expired. Please login again."
            );
            setTimeout(() => (window.location.href = "/"), 500);
          }

          return Promise.reject(error);
        }

        if (error.response?.status !== 401) {
          Toastr.error(
            error.response?.data?.errors ||
              error.response?.data?.error ||
              error.response?.data?.notice ||
              error.message ||
              (error as any).notice ||
              "Something went wrong!"
          );
        }

        if (error.response?.status === 423) {
          setTimeout(() => (window.location.href = "/"), 500);
        }

        return Promise.reject(error);
      }
    );

    this.axios.interceptors.request.use(
      async (config: any) => config,
      (error: any) => Promise.reject(error)
    );
  }
}

const Api = new ApiHandler();

export default Api.axios;

// Single-entry inlined API modules
const http = Api.axios;

// Auth
export const authenticationApi = {
  signin: (payload: any) => http.post("/users/login", { user: payload }),
  signup: (payload: any) => http.post("/users/signup", { user: payload }),
  forgotPassword: (payload: any) =>
    http.post("/users/forgot_password", { user: payload }),
  resetPassword: (payload: any) =>
    http.put("/users/reset_password", { user: payload }),
  sendEmailConfirmation: (payload: any) =>
    http.post(`/users/resend_confirmation_email`, { user: payload }),
  googleAuth: async () => {
    const response = await fetch("/users/auth/google_oauth2", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      credentials: "same-origin",
    });

    return response.json();
  },
};

// Clients
const clientsPath = "/clients";
const multipartHeaders = { headers: { "Content-Type": "multipart/form-data" } };
export const clientsApi = {
  get: (queryParam: string) => http.get(`${clientsPath}${queryParam}`),
  create: (payload: any) =>
    http.post(`${clientsPath}`, payload, multipartHeaders),
  show: (id: any, queryParam: string) =>
    http.get(`${clientsPath}/${id}${queryParam}`),
  update: (id: any, payload: any) =>
    http.patch(`${clientsPath}/${id}`, payload, multipartHeaders),
  destroy: (id: any) => http.delete(`${clientsPath}/${id}`),
  sendPaymentReminder: (id: any, payload: any) =>
    http.post(`${clientsPath}/${id}/send_payment_reminder`, payload),
  addClientContact: (id: any, payload: any) =>
    http.post(`${clientsPath}/${id}/add_client_contact`, payload),
  invoices: (query = "") =>
    http.get(
      query ? `${clientsPath}/invoices?${query}` : `${clientsPath}/invoices`
    ),
};
export const clientApi = clientsApi;

// Client Members
export const clientMembersApi = {
  get: (clientId: any) => http.get(`/clients/${clientId}/client_members`),
  update: (id: any, clientId: any, payload: any) =>
    http.patch(`/clients/${clientId}/client_members/${id}`, payload),
  destroy: (id: any, clientId: any) =>
    http.delete(`/clients/${clientId}/client_members/${id}`),
};

// Companies
const companiesPath = "/companies";
export const companiesApi = {
  index: () => http.get(`${companiesPath}`),
  create: (payload: any) => http.post(companiesPath, payload),
  update: (id: any, payload: any) =>
    http.put(`${companiesPath}/${id}`, payload),
  destroy: (id: any) => http.delete(`${companiesPath}/${id}`),
  removeLogo: (id: any) => http.delete(`${companiesPath}/${id}/purge_logo`),
};

// Company Users
export const companyUsersApi = { get: () => http.get(`/employments`) };

// Company Profile
export const companyProfileApi = { get: () => http.get(`/timezones`) };

// Devices
export const deviceApi = {
  get: (userId: any) => http.get(`/users/${userId}/devices`),
  update: (userId: any, data: any) =>
    http.patch(`/users/${userId}/devices`, data),
};

// Download helper
export const downloadBlob = (url: string) =>
  http({ method: "GET", url, responseType: "blob" });
export const downloadApi = { downloadBlob };

// Expenses
const expensesPath = "/expenses";
export const expensesApi = {
  index: (query = "") =>
    http.get(query ? `${expensesPath}?${query}` : expensesPath),
  create: (payload: any) => http.post(expensesPath, payload, multipartHeaders),
  show: (id: any) => http.get(`${expensesPath}/${id}`),
  update: (id: any, payload: any, config?: any) =>
    http.patch(`${expensesPath}/${id}`, payload, config),
  destroy: (id: any) => http.delete(`${expensesPath}/${id}`),
  createCategory: (payload: any) => http.post(`/expense_categories`, payload),
  createVendors: (payload: any) => http.post(`/vendors`, payload),
};

// Generate Invoice
export const generateInvoiceApi = {
  get: () => http.get(`/generate_invoice`),
  getLineItems: (queryParams: string) =>
    http.get(`/generate_invoice?${queryParams}`),
};
export const generateInvoice = generateInvoiceApi;

// Google Calendar
export const googleCalendarApi = {
  redirect: () => http.get(`/calendars/redirect`),
  callback: () => http.get(`/calendars/callback`),
};

// Holidays
export const holidaysApi = {
  allHolidays: () => http.get(`/holidays`),
  updateHolidays: (year: any, payload: any) =>
    http.patch(`/holidays/${year}`, payload),
};

// Invoices
const invoicesPath = "/invoices";
export const invoicesApi = {
  get: (query = "") =>
    http.get(query ? `${invoicesPath}?${query}` : `${invoicesPath}`),
  post: (body: any) => http.post(`${invoicesPath}`, body),
  patch: (id: any, body: any) => http.post(`${invoicesPath}/${id}`, body),
  destroy: (id: any) => http.delete(`${invoicesPath}/${id}`),
  destroyBulk: (invoice_ids: any) =>
    http.post(`${invoicesPath}/bulk_deletion`, invoice_ids),
  getInvoice: (id: any) => http.get(`${invoicesPath}/${id}`),
  editInvoice: (id: any) => http.get(`${invoicesPath}/${id}/edit`),
  downloadInvoice: (id: any) =>
    http.get(`${invoicesPath}/${id}/download`, { responseType: "blob" }),
  bulkDownloadInvoices: (queryString: string) =>
    http.get(`${invoicesPath}/bulk_download?${queryString}`),
  updateInvoice: (id: any, body: any) =>
    http.patch(`${invoicesPath}/${id}/`, body),
  sendInvoice: (id: any, payload: any) =>
    http.post(`${invoicesPath}/${id}/send_invoice`, payload),
  viewInvoice: (id: any) => http.get(`${invoicesPath}/${id}/view`),
  paymentSuccess: (id: any) =>
    http.get(`${invoicesPath}/${id}/payments/success`),
  wavieInvoice: (id: any) => http.patch(`${invoicesPath}/waived/${id}`),
  invoiceLogs: (id: any) => http.get(`${invoicesPath}/action_trails/${id}`),
  sendReminder: (id: any, payload: any) =>
    http.post(`${invoicesPath}/${id}/send_reminder`, payload),
  getDownloadStatus: (downloadId: any) =>
    http.get(`invoices/bulk_download/status`, {
      params: { download_id: downloadId },
    }),
  getMonthlyRevenue: () =>
    http.get(`${invoicesPath}/analytics/monthly_revenue`),
  getRevenueByStatus: () =>
    http.get(`${invoicesPath}/analytics/revenue_by_status`),
  getRecentlyUpdated: (page = 1, perPage = 10) =>
    http.get(`${invoicesPath}/recently_updated`, {
      params: { page, per_page: perPage },
    }),
};

// Leaves
export const leavesApi = {
  allLeaves: () => http.get(`/leaves`),
  customLeaves: (year: any, payload: any) =>
    http.patch(`/custom_leaves/${year}`, payload),
  updateLeaveWithLeaveTypes: (year: any, payload: any) =>
    http.patch(`/leave_with_leave_type/${year}`, payload),
};

// Logout
export const logoutApi = () => http.delete(`/users/logout`);

// Payment Settings
export const paymentSettingsApi = {
  get: () => http.get(`/payments/settings`),
  connectStripe: () => http.post(`/payments/settings/stripe/connect`),
  disconnectStripe: () => http.delete(`/payments/settings/stripe/disconnect`),
};
export const paymentSettings = paymentSettingsApi;

// Payments
export const paymentsApi = {
  get: (queryParams = "") => http.get(`/payments${queryParams}`),
  create: (payload: any) => http.post(`/payments`, payload),
  show: (id: any, queryParam: string) =>
    http.get(`/payments/${id}${queryParam}`),
  update: (id: any, payload: any) => http.patch(`/payments/${id}`, payload),
  destroy: (id: any) => http.delete(`/payments/${id}`),
  getInvoiceList: () => http.get(`/payments/new`),
};
export const payments = paymentsApi;
export const payment = paymentsApi;

// Payment Providers
export const paymentsProvidersApi = {
  get: () => http.get(`/payments/providers`),
  update: (id: any, provider: any) =>
    http.patch(`/payments/providers/${id}`, provider),
};
export const PaymentsProviders = paymentsProvidersApi;

// Preferences
export const preferencesApi = {
  get: (userId: number | string) =>
    http.get(`team/${userId}/notification_preferences`),
  updatePreference: (userId: number | string, payload: any) =>
    http.patch(`team/${userId}/notification_preferences`, payload),
  updateAll: (userId: number | string, payload: any) =>
    http.patch(`team/${userId}/notification_preferences`, payload),
};

// Profile
export const profileApi = {
  update: (payload: any) => http.put(`/profile`, payload),
};

// Profiles
export const profilesApi = {
  get: () => http.get(`/profiles/bank_account_details`),
  post: (body: any) => http.post(`/profiles/bank_account_details`, body),
  put: (id: any, body: any) =>
    http.put(`/profiles/bank_account_details/${id}`, body),
};

// Project Members
export const projectMembersApi = {
  update: (id: any, payload: any) =>
    http.put(`/project_members/${id}`, payload),
};

// Projects
export const projectsApi = {
  get: () => http.get(`/projects`),
  create: (payload: any) => http.post(`/projects`, payload),
  show: (id: any, timeFrame = "week") =>
    http.get(`/projects/${id}?time_frame=${timeFrame}`),
  update: (id: any, payload: any) => http.patch(`/projects/${id}`, payload),
  destroy: (id: any) => http.delete(`/projects/${id}`),
  search: (term: string) => http.get(`/projects/search?search_term=${term}`),
};
export const projectApi = projectsApi;

// Reports (Time Entries)
export const reportsApi = {
  get: (queryParams: string) => http.get(`/reports/time_entries${queryParams}`),
  download: (type: string, queryParams: string) =>
    http({
      method: "GET",
      url: `/reports/time_entries/download.${type}${queryParams}`,
      responseType: "blob",
    }),
};

// Reports: Accounts Aging
export const reportsAccountsAgingApi = {
  get: () => http.get(`/reports/accounts_aging`),
  download: (type: string, queryParams: string) =>
    downloadBlob(`/reports/accounts_aging/download.${type}${queryParams}`),
};
export const accountsAgingApi = reportsAccountsAgingApi;

// Reports: Outstanding/Overdue
export const reportsOutstandingOverdueInvoiceApi = {
  get: () => http.get(`/reports/outstanding_overdue_invoices/`),
  download: (type: string) =>
    downloadBlob(`/reports/outstanding_overdue_invoices//download.${type}`),
};
export const outstandingOverdueInvoiceApi = reportsOutstandingOverdueInvoiceApi;

// Reports: Client Revenue
export const reportsClientRevenueApi = {
  get: (from: any, to: any, clientIds: any) =>
    http.get(
      `/reports/client_revenues/?duration_from=${from}&duration_to=${to}&client_ids=[${clientIds}]`
    ),
  newReport: () => http.get(`/reports/client_revenues/new`),
  download: (type: string, queryParams: string) =>
    downloadBlob(`/reports/client_revenues//download.${type}${queryParams}`),
};
export const clientRevenueApi = reportsClientRevenueApi;

// Team
const teamPath = "/team";
export const teamApi = {
  get: (query = "") => http.get(query ? `${teamPath}?${query}` : teamPath),
  search: (term: string) => {
    const payload: any = { "q[first_name_or_last_name_or_email_cont]": term };
    const queryParams = new URLSearchParams(payload).toString();

    return http.get(`${teamPath}?${queryParams}`);
  },
  destroyTeamMember: (id: any) => http.delete(`${teamPath}/${id}`),
  updateTeamMember: (id: any, payload: any) =>
    http.put(`${teamPath}/${id}`, payload),
  destroyTeamMemberAvatar: (id: any) => http.delete(`${teamPath}/${id}/avatar`),
  updateTeamMemberAvatar: (id: any, payload: any, config?: any) =>
    http.put(`${teamPath}/${id}/avatar`, payload, config),
  updateTeamMembers: (payload: any) =>
    http.put(`${teamPath}/update_team_members`, payload),
  inviteMember: (payload: any) => http.post(`/invitations`, payload),
  resendInvite: (id: any) => http.post(`/invitations/${id}/resend`),
  updateInvitedMember: (id: any, payload: any) =>
    http.put(`/invitations/${id}`, payload),
  deleteInvitedMember: (id: any) => http.delete(`/invitations/${id}`),
};

// Teams
export const teamsApi = {
  get: (id: any) => http.get(`team/${id}/details`),
  updateUser: (userId: any, payload: any) =>
    http.put(`team/${userId}/details`, payload),
  getAddress: (userId: any) => http.get(`users/${userId}/addresses`),
  createAddress: (userId: any, payload: any) =>
    http.post(`/users/${userId}/addresses`, payload),
  updateAddress: (userId: any, addrId: any, payload: any) =>
    http.put(`users/${userId}/addresses/${addrId}`, payload),
  getEmployments: () => http.get(`employments`),
  getEmploymentDetails: (id: any) => http.get(`employments/${id}`),
  updateEmploymentDetails: (id: any, payload: any) =>
    http.patch(`employments/${id}`, payload),
  getPreviousEmployments: (id: any) =>
    http.get(`users/${id}/previous_employments`),
  updatePreviousEmployments: (id: any, payload: any) =>
    http.put(`bulk_previous_employments/${id}`, payload),
};

// Timeoff Entries
export const timeoffEntriesApi = {
  get: (userId: number | string, year: number | string) =>
    http.get(`/timeoff_entries?user_id=${userId}&year=${year}`),
  create: (payload: any, userId: number | string) =>
    http.post(`/timeoff_entries?user_id=${userId}`, payload),
  update: (id: number | string, payload: any) =>
    http.put(`/timeoff_entries/${id}`, payload),
  destroy: (id: number | string) => http.delete(`/timeoff_entries/${id}`),
};

// Timesheet Entry
export const timesheetEntryApi = {
  index: (params?: {
    from?: string;
    to?: string;
    user_id?: string | number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append("from", params.from);

    if (params?.to) queryParams.append("to", params.to);

    if (params?.user_id) queryParams.append("user_id", String(params.user_id));
    const queryString = queryParams.toString();
    const url = queryString
      ? `/timesheet_entry?${queryString}`
      : `/timesheet_entry`;

    return http.get(url);
  },
  create: (params: any, userId?: string | number) => {
    const url = userId
      ? `/timesheet_entry?user_id=${userId}`
      : `/timesheet_entry`;

    return http.post(url, params);
  },
  list: (from: string, to: string, uid?: string | number) =>
    http.get(
      `/timesheet_entry?from=${from}&to=${to}${uid ? `&user_id=${uid}` : ""}`
    ),
  update: (id: string | number, payload: any) =>
    http.put(`/timesheet_entry/${id}`, payload),
  destroy: (id: string | number) => http.delete(`/timesheet_entry/${id}`),
  destroyBulk: (payload: any) =>
    http.delete(`/timesheet_entry/bulk_action/`, { data: { source: payload } }),
  updateBulk: (payload: any) =>
    http.patch(`/timesheet_entry/bulk_action/`, payload),
};

// Time Tracking
export const timeTrackingApi = {
  get: async (userId?: number) => {
    try {
      const url = userId
        ? `/time-tracking?user_id=${userId}`
        : "/time-tracking";
      const response = await http.get(url);

      return {
        data: {
          entries: response.data.entries || {},
          clients: response.data.clients || [],
          projects: response.data.projects || {},
          employees: response.data.employees || [],
        },
      };
    } catch (error) {
      console.error("Error fetching time tracking data:", error);

      return {
        data: { entries: {}, clients: [], projects: {}, employees: [] },
      };
    }
  },
  getCurrentUserEntries: (from: any, to: any, year: any, uid: any) =>
    http.get(
      `/timesheet_entry?from=${from}&to=${to}&year=${year}&user_id=${uid}`
    ),
};

// Wise removed

// Workspaces
export const workspacesApi = {
  get: () => http.get(`/workspaces`),
  update: (id: any) => http.put(`/workspaces/${id}`),
};
export const WorkspaceApi = workspacesApi;
