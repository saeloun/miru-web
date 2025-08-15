// features/invoices/api/index.ts
// Centralized API module for all invoice-related requests

import { apiClient } from "@/lib/api-client";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "paid"
    | "overdue"
    | "declined"
    | "waived";
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  client: {
    id: string;
    name: string;
    email: string;
    logo?: string;
  };
  company: {
    id: string;
    name: string;
    baseCurrency: string;
  };
  lineItems?: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  date?: string;
}

export interface InvoiceSummary {
  overdueAmount: number;
  outstandingAmount: number;
  draftAmount: number;
  currency: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  invoiceCount: number;
}

export interface InvoiceFilters {
  clients: Array<{ id: string; name: string }>;
  statuses: string[];
  dateRanges: string[];
}

// API endpoints
const ENDPOINTS = {
  invoices: "/internal_api/v1/invoices",
  summary: "/internal_api/v1/invoices/summary",
  recentlyUpdated: "/internal_api/v1/invoices/recently_updated",
  monthlyRevenue: "/internal_api/v1/invoices/analytics/monthly_revenue",
  bulkActions: "/internal_api/v1/invoices/bulk_actions",
  send: (id: string) => `/internal_api/v1/invoices/${id}/send`,
  download: (id: string) => `/internal_api/v1/invoices/${id}/download`,
} as const;

class InvoicesAPI {
  // GET requests
  async getInvoices(params?: {
    page?: number;
    perPage?: number;
    status?: string[];
    clientId?: string;
    dateRange?: { from: Date; to: Date };
    search?: string;
  }) {
    return apiClient.get<{ data: Invoice[]; meta: any }>(ENDPOINTS.invoices, {
      params,
    });
  }

  async getInvoice(id: string) {
    return apiClient.get<Invoice>(`${ENDPOINTS.invoices}/${id}`);
  }

  async getSummary() {
    return apiClient.get<{ data: InvoiceSummary }>(ENDPOINTS.summary);
  }

  async getRecentlyUpdated(limit = 10) {
    return apiClient.get<{ data: Invoice[] }>(ENDPOINTS.recentlyUpdated, {
      params: { limit },
    });
  }

  async getMonthlyRevenue() {
    return apiClient.get<{ data: MonthlyRevenue[] }>(ENDPOINTS.monthlyRevenue);
  }

  async getFilters() {
    return apiClient.get<{ data: InvoiceFilters }>(
      `${ENDPOINTS.invoices}/filters`
    );
  }

  // POST requests
  async createInvoice(data: Partial<Invoice>) {
    return apiClient.post<Invoice>(ENDPOINTS.invoices, data);
  }

  async sendInvoice(
    id: string,
    data: { recipients: string[]; subject: string; message: string }
  ) {
    return apiClient.post(ENDPOINTS.send(id), { invoice_email: data });
  }

  // PUT/PATCH requests
  async updateInvoice(id: string, data: Partial<Invoice>) {
    return apiClient.patch<Invoice>(`${ENDPOINTS.invoices}/${id}`, data);
  }

  // DELETE requests
  async deleteInvoice(id: string) {
    return apiClient.delete(`${ENDPOINTS.invoices}/${id}`);
  }

  // Bulk actions
  async bulkDelete(invoiceIds: string[]) {
    return apiClient.post(ENDPOINTS.bulkActions, {
      action: "delete",
      invoice_ids: invoiceIds,
    });
  }

  async bulkDownload(invoiceIds: string[]) {
    return apiClient.post(
      ENDPOINTS.bulkActions,
      {
        action: "download",
        invoice_ids: invoiceIds,
      },
      { responseType: "blob" }
    );
  }

  async bulkSend(invoiceIds: string[]) {
    return apiClient.post(ENDPOINTS.bulkActions, {
      action: "send",
      invoice_ids: invoiceIds,
    });
  }

  // File operations
  async downloadInvoice(id: string) {
    return apiClient.get(ENDPOINTS.download(id), {
      responseType: "blob",
    });
  }

  async exportInvoices(format: "csv" | "pdf" | "excel", filters?: any) {
    return apiClient.post(
      `${ENDPOINTS.invoices}/export`,
      { format, filters },
      { responseType: "blob" }
    );
  }
}

export const invoicesApi = new InvoicesAPI();
