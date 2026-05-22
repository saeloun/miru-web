import axios from "axios";
import { Toastr } from "StyledComponents";
import { getActiveLocale } from "../i18n";

import { clearCredentialsFromLocalStorage } from "utils/storage";
import {
  getCsrfToken,
  getSessionRequestHeaders,
  getStoredAuthHeaders,
  shouldAttachStoredAuthHeaders,
} from "utils/authHeaders";
import { reportClientError } from "utils/runtimeRecovery";

const AUTH_PATH_PREFIXES = [
  "/user/sign_in",
  "/login",
  "/signup",
  "/password/new",
  "/password/edit",
  "/users/password/edit",
  "/email_confirmation",
];

class ApiHandler {
  axios: any;
  sessionValidationPromise: Promise<boolean> | null;

  constructor() {
    this.sessionValidationPromise = null;
    this.axios = axios.create({
      baseURL: "/api/v1",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": this.getCsrfToken(),
      },
    });

    this.axios.interceptors.response.use(
      (response: any) => {
        if (response) {
          const { data, status, config } = response;
          (response as any).success = status >= 200 && status < 300;
          const shouldSkipSuccessToast = Boolean(config?.skipSuccessToast);
          const { reset_session, notice } = data || {};
          if (data && !reset_session && notice && !shouldSkipSuccessToast) {
            Toastr.success(notice);
          }
        }

        return response;
      },
      async (error: any) => {
        if (error.response?.status === 401) {
          const requestConfig = (error.config || {}) as {
            __sessionValidated?: boolean;
            url?: string;
          };

          if (
            !requestConfig.__sessionValidated &&
            !this.isSessionValidationBypassed(requestConfig.url)
          ) {
            const sessionStillUnauthorized =
              await this.isSessionStillUnauthorized();
            if (!sessionStillUnauthorized) {
              reportClientError("api-401-recovered", error, {
                reason: "transient-401-session-still-valid",
                requestUrl: requestConfig.url || "",
              });

              return this.axios({
                ...requestConfig,
                __sessionValidated: true,
              });
            }
          }

          this.handleUnauthorizedSession(error);

          return Promise.reject(error);
        }

        const shouldSkipGlobalErrorToast = Boolean(
          error?.config?.skipErrorToast
        );
        // Skip generic toast if field_errors are present and non-empty (handled by the component)
        const fieldErrors = error.response?.data?.field_errors;
        if (
          !shouldSkipGlobalErrorToast &&
          (!fieldErrors || Object.keys(fieldErrors).length === 0)
        ) {
          Toastr.error(
            error.response?.data?.errors ||
              error.response?.data?.error ||
              error.response?.data?.notice ||
              error.message ||
              error.notice ||
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
      async (config: any) => {
        config.headers ||= {};

        if (config?.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }

        if (shouldAttachStoredAuthHeaders(config.url)) {
          Object.entries(getStoredAuthHeaders()).forEach(([key, value]) => {
            config.headers[key] = value;
          });
        }

        config.headers["X-CSRF-TOKEN"] = this.getCsrfToken();
        config.headers["X-Miru-Locale"] = getActiveLocale();

        return config;
      },
      (error: any) => Promise.reject(error)
    );
  }

  getCsrfToken() {
    return getCsrfToken();
  }

  isAuthPage() {
    const currentPath = window.location.pathname;

    return AUTH_PATH_PREFIXES.some(path => currentPath.startsWith(path));
  }

  isSessionValidationBypassed(url?: string) {
    if (!url) return false;

    const bypassPaths = [
      "/users/login",
      "/users/signup",
      "/users/forgot_password",
      "/users/reset_password",
      "/users/logout",
      "/users/_me",
    ];

    return bypassPaths.some(path => url.includes(path));
  }

  async isSessionStillUnauthorized() {
    if (!this.sessionValidationPromise) {
      this.sessionValidationPromise = fetch("/api/v1/users/_me", {
        method: "GET",
        headers: getSessionRequestHeaders(),
        credentials: "include",
      })
        .then(response => !response.ok)
        .catch(() => true)
        .finally(() => {
          this.sessionValidationPromise = null;
        });
    }

    return this.sessionValidationPromise;
  }

  handleUnauthorizedSession(error: any) {
    clearCredentialsFromLocalStorage();

    reportClientError("api-401-invalid-session", error, {
      reason: "confirmed-unauthorized",
      requestUrl: error?.config?.url || "",
    });

    if (!this.isAuthPage()) {
      Toastr.error(
        error.response?.data?.error || "Session expired. Please login again."
      );
      setTimeout(() => (window.location.href = "/"), 500);
    }
  }
}

const Api = new ApiHandler();

export default Api.axios;

// Single-entry inlined API modules
const http = Api.axios;

// Auth
export const authenticationApi = {
  signin: (payload: any) =>
    http.post("/users/login", {
      user: {
        ...payload,
        locale: getActiveLocale(),
      },
    }),
  signup: (payload: any) =>
    http.post("/users/signup", {
      user: {
        ...payload,
        locale: getActiveLocale(),
      },
    }),
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
      },
      credentials: "same-origin",
    });

    return response.json();
  },
};

export const passkeysApi = {
  index: () => http.get("/users/passkeys"),
  registrationOptions: () => http.post("/users/passkeys/registration_options"),
  create: (payload: any) => http.post("/users/passkeys", payload),
  authenticate: (payload: any) =>
    http.post("/users/passkeys/authenticate", payload),
  updateRequirement: (payload: any) =>
    http.patch("/users/passkeys/requirement", payload),
  destroy: (id: number) => http.delete(`/users/passkeys/${id}`),
};

export const totpApi = {
  show: () => http.get("/users/totp"),
  setup: () => http.post("/users/totp/setup"),
  confirm: (payload: any) => http.post("/users/totp/confirm", payload),
  authenticate: (payload: any) =>
    http.post("/users/totp/authenticate", payload),
  regenerateRecoveryCodes: () => http.post("/users/totp/recovery_codes"),
  destroy: () => http.delete("/users/totp"),
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

// Invoice Signature
export const invoiceSignatureApi = {
  show: (companyId: any) =>
    http.get(`${companiesPath}/${companyId}/invoice_signature`),
  create: (companyId: any, payload: FormData) =>
    http.post(`${companiesPath}/${companyId}/invoice_signature`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  destroy: (companyId: any) =>
    http.delete(`${companiesPath}/${companyId}/invoice_signature`),
};

// Company Users
export const companyUsersApi = { get: () => http.get(`/employments`) };

// Company Profile
export const companyProfileApi = { get: () => http.get(`/timezones`) };

// Devices
export const deviceApi = {
  get: (userId: any) => http.get(`/users/${userId}/devices`),
  create: (userId: any, data: any) =>
    http.post(`/users/${userId}/devices`, data),
  update: (userId: any, deviceId: any, data: any) =>
    http.patch(`/users/${userId}/devices/${deviceId}`, data),
  destroy: (userId: any, deviceId: any) =>
    http.delete(`/users/${userId}/devices/${deviceId}`),
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
  approve: (id: any) => http.patch(`${expensesPath}/${id}/approve`),
  reject: (id: any) => http.patch(`${expensesPath}/${id}/reject`),
  markPaid: (id: any) => http.patch(`${expensesPath}/${id}/mark_paid`),
};

export const invoiceLineItemsApi = {
  getLineItems: (queryParams: string) =>
    http.get(`/invoices/line_items?${queryParams}`),
};

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
  patch: (id: any, body: any) => http.patch(`${invoicesPath}/${id}`, body),
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
  paymentSuccess: (id?: string, query = "") =>
    http.get(`${invoicesPath}/${id}/payments/success${query}`),
  waiveInvoice: (id: any) => http.patch(`${invoicesPath}/waived/${id}`),
  invoiceLogs: (id: any) => http.get(`${invoicesPath}/action_trails/${id}`),
  sendReminder: (id: any, payload: any) =>
    http.post(`${invoicesPath}/${id}/send_reminder`, payload),
  getDownloadStatus: (downloadId: any) =>
    http.get(`/invoices/bulk_download/status`, {
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
export const logoutApi = (config = {}) => http.delete(`/users/logout`, config);

// Payment Settings
export const paymentSettingsApi = {
  get: () => http.get(`/payments/settings`),
  updateUpi: (provider: any) =>
    http.patch(`/payments/settings/upi`, { provider }),
  updateRazorpay: (provider: any) =>
    http.patch(`/payments/settings/razorpay`, { provider }),
  connectStripe: () => http.post(`/payments/settings/stripe/connect`),
  disconnectStripe: () => http.delete(`/payments/settings/stripe/disconnect`),
};
export const paymentSettings = paymentSettingsApi;

export const taxConfigurationsApi = {
  get: () => http.get(`/tax_configurations`),
  create: (taxConfiguration: any) =>
    http.post(`/tax_configurations`, {
      tax_configuration: taxConfiguration,
    }),
  update: (id: string | number, taxConfiguration: any) =>
    http.patch(`/tax_configurations/${id}`, {
      tax_configuration: taxConfiguration,
    }),
  destroy: (id: string | number) => http.delete(`/tax_configurations/${id}`),
};

// Payments
export const paymentsApi = {
  get: (queryParams = "") => http.get(`/payments${queryParams}`),
  create: (payload: any) => http.post(`/payments`, payload),
  show: (id: any, queryParam: string) =>
    http.get(`/payments/${id}${queryParam}`),
  withdraw: (id: string | number) => http.post(`/payments/${id}/withdraw`),
  update: (id: any, payload: any) => http.patch(`/payments/${id}`, payload),
  destroy: (id: any) => http.delete(`/payments/${id}`),
  getInvoiceList: () => http.get(`/payments/new`),
  bulkDownload: (ids: (string | number)[]) =>
    http.get(`/payments/bulk_download`, {
      params: { ids: ids.join(",") },
      responseType: "blob",
    }),
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
    http.get(`/team/${userId}/notification_preferences`),
  updatePreference: (userId: number | string, payload: any) =>
    http.patch(`/team/${userId}/notification_preferences`, payload),
  updateAll: (userId: number | string, payload: any) =>
    http.patch(`/team/${userId}/notification_preferences`, payload),
};

// Profile
export const profileApi = {
  update: (payload: any) => http.put(`/profile`, payload),
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
  search: (term: string) =>
    http.get(
      `/projects/search?${new URLSearchParams({
        search_term: term,
      }).toString()}`
    ),
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
  get: () => http.get(`/reports/outstanding_overdue_invoices`),
  download: (type: string) =>
    downloadBlob(`/reports/outstanding_overdue_invoices/download.${type}`),
};
export const outstandingOverdueInvoiceApi = reportsOutstandingOverdueInvoiceApi;

// Reports: Client Revenue
export const reportsClientRevenueApi = {
  get: (from: any, to: any, clientIds: any) =>
    http.get(
      `/reports/client_revenues?${new URLSearchParams({
        duration_from: String(from),
        duration_to: String(to),
        client_ids: `[${(Array.isArray(clientIds) ? clientIds : [clientIds])
          .flat()
          .filter(id => id !== null && id !== undefined && id !== "")
          .join(",")}]`,
      }).toString()}`
    ),
  newReport: () => http.get(`/reports/client_revenues/new`),
  download: (type: string, queryParams: string) =>
    downloadBlob(`/reports/client_revenues/download.${type}${queryParams}`),
};
export const clientRevenueApi = reportsClientRevenueApi;

export const analyticsApi = {
  getRevenueForecast: (
    horizon: number | string,
    extraParams: Record<string, any> = {}
  ) =>
    http.get(`/analytics/revenue_forecasts`, {
      params: { horizon, ...extraParams },
    }),
  downloadExport: (
    reportType: string,
    format: "csv" | "pdf",
    params: Record<string, any>
  ) =>
    http.get(`/internal_api/v1/analytics/exports/${reportType}.${format}`, {
      baseURL: "",
      params,
      responseType: "blob",
    }),
  getSavedReports: () =>
    http.get(`/internal_api/v1/analytics/reports`, {
      baseURL: "",
    }),
  createSavedReport: (payload: any) =>
    http.post(`/internal_api/v1/analytics/reports`, payload, {
      baseURL: "",
    }),
  getSavedReport: (id: number | string) =>
    http.get(`/internal_api/v1/analytics/reports/${id}`, {
      baseURL: "",
    }),
  deleteSavedReport: (id: number | string) =>
    http.delete(`/internal_api/v1/analytics/reports/${id}`, {
      baseURL: "",
    }),
  getComparison: (params: Record<string, any>) =>
    http.get(`/internal_api/v1/analytics/comparison`, {
      baseURL: "",
      params,
    }),
  getTeamProductivity: (params: Record<string, any>) =>
    http.get(`/internal_api/v1/analytics/team_productivity`, {
      baseURL: "",
      params,
    }),
  getClientAnalysis: (params: Record<string, any>) =>
    http.get(`/internal_api/v1/analytics/client_analysis`, {
      baseURL: "",
      params,
    }),
  getExpenseTrends: (params: Record<string, any>) =>
    http.get(`/internal_api/v1/analytics/expense_trends`, {
      baseURL: "",
      params,
    }),
};

// Team
const teamPath = "/team";
export const teamApi = {
  get: (query = "") => http.get(query ? `${teamPath}?${query}` : teamPath),
  search: (term: string) => {
    const payload: any = { "q[first_name_or_last_name_or_email_cont]": term };
    const queryParams = new URLSearchParams(payload).toString();

    return http.get(`${teamPath}?${queryParams}`);
  },
  getRemovalImpact: (id: any) => http.get(`${teamPath}/${id}/removal_impact`),
  destroyTeamMember: (id: any) => http.delete(`${teamPath}/${id}`),
  updateTeamMember: (id: any, payload: any) =>
    http.put(`${teamPath}/${id}`, payload),
  destroyTeamMemberAvatar: (id: any, config?: any) =>
    http.delete(`${teamPath}/${id}/avatar`, config),
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

// Subscriptions
export const subscriptionsApi = {
  show: () => http.get(`/subscription`),
  trial: () => http.post(`/subscription/trial`),
  checkout: (interval = "monthly") =>
    http.post(`/subscription/checkout`, { interval }),
  portal: () => http.post(`/subscription/portal`),
};

// Teams
export const teamsApi = {
  get: (id: any) => http.get(`/team/${id}/details`),
  updateUser: (userId: any, payload: any) =>
    http.put(`/team/${userId}/details`, payload),
  getAddress: (userId: any) => http.get(`/users/${userId}/addresses`),
  createAddress: (userId: any, payload: any) =>
    http.post(`/users/${userId}/addresses`, payload),
  updateAddress: (userId: any, addrId: any, payload: any) =>
    http.put(`/users/${userId}/addresses/${addrId}`, payload),
  getEmployments: () => http.get(`/employments`),
  getEmploymentDetails: (id: any) => http.get(`/employments/${id}`),
  updateEmploymentDetails: (id: any, payload: any) =>
    http.patch(`/employments/${id}`, payload),
  getPreviousEmployments: (id: any) =>
    http.get(`/users/${id}/previous_employments`),
  updatePreviousEmployments: (id: any, payload: any) =>
    http.put(`/bulk_previous_employments/${id}`, payload),
};

// Timeoff Entries
export const timeoffEntriesApi = {
  get: (userId: number | string, year: number | string) =>
    http.get(`/timeoff_entries`, {
      params: {
        user_id: userId,
        year,
      },
    }),
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
    http.get(`/timesheet_entry`, {
      params: {
        from,
        to,
        ...(uid ? { user_id: uid } : {}),
      },
    }),
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
  get: async ({
    userId,
    from,
    to,
    year,
  }: {
    userId?: number;
    from?: string;
    to?: string;
    year?: number | string;
  } = {}) =>
    http.get("/time-tracking", {
      params: {
        ...(userId ? { user_id: userId } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(year ? { year } : {}),
      },
    }),
  getCurrentUserEntries: (from: any, to: any, year: any, uid: any) =>
    http.get(`/timesheet_entry`, {
      params: {
        from,
        to,
        year,
        user_id: uid,
      },
    }),
};

export const desktopCurrentTimerApi = {
  get: () => http.get("/desktop/current_timer", { skipErrorToast: true }),
  update: (payload: any) =>
    http.put(
      "/desktop/current_timer",
      { current_timer: payload },
      { skipErrorToast: true }
    ),
};

// Workspaces
export const workspacesApi = {
  get: () => http.get(`/workspaces`),
  update: (id: any) => http.put(`/workspaces/${id}`),
};
export const WorkspaceApi = workspacesApi;
