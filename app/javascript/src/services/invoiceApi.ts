import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import axios from "../apis/api";

dayjs.extend(customParseFormat);

export interface InvoiceItem {
  id: string;
  name?: string;
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
  taxRate?: number;
  date?: string;
  work_date?: string;
  timesheet_entry_id?: string;
  lineTotal?: number;
  _destroy?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  logo?: string;
  currency?: string;
  clientCurrency?: string;
  previousInvoiceNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string;
  client: Client;
  status:
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "viewed"
    | "declined"
    | "sending"
    | "waived";
  issueDate: string;
  dueDate: string;
  amount: number;
  baseCurrencyAmount?: number;
  currency: string;
  tax?: number;
  discount?: number;
  reference?: string;
  amountPaid?: number;
  amountDue?: number;
  updatedAt?: string;
  createdAt?: string;
  invoiceLineItems?: InvoiceItem[];
  company?: {
    phone: string;
    address: string;
    email: string;
    name: string;
    baseCurrency: string;
    dateFormat: string;
    taxId?: string;
    vatNumber?: string;
    gstNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankRoutingNumber?: string;
    bankSwiftCode?: string;
  };
}

export interface InvoiceFormData {
  id?: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  dateFormat?: string;
  reference?: string;
  invoiceLineItems: InvoiceItem[];
  tax?: number;
  discount?: number;
  currency: string;
  status:
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "viewed"
    | "declined"
    | "sending"
    | "waived";
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  recentlyUpdatedInvoices: Invoice[];
  recentlyUpdatedTotalCount: number;
  summary: {
    draftAmount: string | number;
    openAmount?: string | number;
    outstandingAmount: string | number;
    overdueAmount: string | number;
    draftCount?: number;
    openCount?: number;
    outstandingCount?: number;
    overdueCount?: number;
    paidCount?: number;
    totalCount?: number;
    totalAmount: string | number;
    currency: string;
  };
  meta?: {
    i18n?: {
      locale?: string;
      default_locale?: string;
      transliteration_enabled?: boolean;
    };
    formatting?: {
      currency?: string;
      decimal_precision?: number;
    };
    timezone?: string;
    generated_at?: string;
  };
  pagy: {
    page: number;
    pages: number;
    total: number;
  };
}

export interface InvoiceFilters {
  query?: string;
  status?: string;
  clientId?: string;
  dateRange?: string;
  fromDateRange?: string;
  toDateRange?: string;
  page?: number;
  invoicesPerPage?: number;
  per?: number;
}

class InvoiceApiService {
  private baseUrl = "/api/v1";

  private normalizeInvoiceLineItemDate(
    date: string | undefined,
    dateFormat?: string
  ) {
    if (!date) return date;

    const parsedDate = dayjs(
      date,
      [
        dateFormat,
        "YYYY-MM-DD",
        "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
        "MM-DD-YYYY",
        "MM/DD/YYYY",
        "DD-MM-YYYY",
        "DD/MM/YYYY",
        "DD.MM.YYYY",
      ].filter(Boolean),
      true
    );

    if (parsedDate.isValid()) {
      return parsedDate.format("YYYY-MM-DD");
    }

    const fallbackParsedDate = dayjs(date);

    return fallbackParsedDate.isValid()
      ? fallbackParsedDate.format("YYYY-MM-DD")
      : date;
  }

  /**
   * Fetch invoices with optional filters and pagination
   */
  async getInvoices(
    filters: InvoiceFilters = {}
  ): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const url = `/invoices${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await axios.get(url);

    return {
      invoices: (response.data.invoices || []).map((inv: any) =>
        this.transformApiInvoice(inv)
      ),
      recentlyUpdatedInvoices: (
        response.data.recentlyUpdatedInvoices ||
        response.data.recently_updated_invoices ||
        []
      ).map((inv: any) => this.transformApiInvoice(inv)),
      recentlyUpdatedTotalCount:
        Number(
          response.data.recentlyUpdatedTotalCount ||
            response.data.recently_updated_total_count ||
            0
        ) || 0,
      summary: response.data.summary || {
        draftAmount: 0,
        openAmount: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        draftCount: 0,
        openCount: 0,
        outstandingCount: 0,
        overdueCount: 0,
        paidCount: 0,
        totalCount: 0,
        totalAmount: 0,
        currency: "USD",
      },
      meta: response.data.meta,
      pagy: response.data.pagination_details ||
        response.data.pagy || { page: 1, pages: 1, total: 0 },
    };
  }

  /**
   * Fetch a single invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    const response = await axios.get(`/invoices/${id}`);

    return this.transformApiInvoice(response.data);
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    const response = await axios.post(`/invoices`, {
      invoice: this.formatInvoiceForApi(invoiceData),
    });

    return this.transformApiInvoice(response.data.invoice || response.data);
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(
    id: string,
    invoiceData: InvoiceFormData
  ): Promise<Invoice> {
    const response = await axios.patch(`/invoices/${id}`, {
      invoice: this.formatInvoiceForApi(invoiceData),
    });

    return this.transformApiInvoice(response.data.invoice || response.data);
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    await axios.delete(`/invoices/${id}`);
  }

  /**
   * Send an invoice via email
   */
  async sendInvoice(
    id: string,
    emailData: {
      subject: string;
      message: string;
      recipients: string[];
    }
  ): Promise<{ message: string }> {
    const response = await axios.post(`/invoices/${id}/send_invoice`, {
      invoice_email: emailData,
    });

    return response.data;
  }

  async sendReminder(
    id: string,
    emailData: {
      subject: string;
      message: string;
      recipients: string[];
    }
  ): Promise<{ message: string }> {
    const response = await axios.post(`/invoices/${id}/send_reminder`, {
      invoice_email: emailData,
    });

    return response.data;
  }

  async waiveInvoice(id: string): Promise<{ message?: string }> {
    const response = await axios.patch(`/invoices/waived/${id}`);

    return response.data;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(id: string): Promise<Blob> {
    const response = await axios.get(`/invoices/${id}/download`, {
      responseType: "blob",
    });

    return response.data;
  }

  /**
   * Fetch clients for invoice creation
   */
  async getClients(): Promise<Client[]> {
    const response = await axios.get(`/clients`);

    // Transform the client_details response to match our Client interface
    return (response.data.client_details || []).map((clientDetail: any) => ({
      id: clientDetail.id,
      name: clientDetail.name,
      email: clientDetail.email,
      address: clientDetail.address || "",
      logo: clientDetail.logo,
      currency: clientDetail.currency,
      clientCurrency:
        clientDetail.clientCurrency || clientDetail.client_currency,
      previousInvoiceNumber:
        clientDetail.previousInvoiceNumber ||
        clientDetail.previous_invoice_number,
    }));
  }

  /**
   * Format invoice data for API submission
   */
  private formatInvoiceForApi(invoiceData: InvoiceFormData) {
    return {
      invoice_number: invoiceData.invoiceNumber,
      client_id: invoiceData.clientId,
      issue_date: invoiceData.issueDate,
      due_date: invoiceData.dueDate,
      reference: invoiceData.reference,
      tax: invoiceData.tax || 0,
      discount: invoiceData.discount || 0,
      currency: invoiceData.currency,
      status: invoiceData.status,
      invoice_line_items_attributes: invoiceData.invoiceLineItems.map(item => ({
        id:
          invoiceData.id &&
          item.id &&
          item.id !== "new" &&
          !String(item.id).startsWith("draft-")
            ? item.id
            : undefined,
        name:
          item.name ||
          item.description ||
          `${item.first_name || ""} ${item.last_name || ""}`.trim(),
        description: item.description || "",
        date: this.normalizeInvoiceLineItemDate(
          item.date || item.work_date,
          invoiceData.dateFormat
        ),
        timesheet_entry_id: item.timesheet_entry_id,
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount:
          item.amount ??
          item.lineTotal ??
          (item.quantity ?? 0) * (item.rate ?? 0),
        _destroy: item._destroy || false,
      })),
    };
  }

  /**
   * Transform API invoice response to our Invoice interface
   */
  transformApiInvoice(apiInvoice: any): Invoice {
    // Helper function to safely format address
    const formatAddress = (addressData: any): string => {
      if (typeof addressData === "string") {
        return addressData;
      }

      if (typeof addressData === "object" && addressData) {
        // Handle address object with individual fields
        const parts = [];
        if (addressData.address_line_1) parts.push(addressData.address_line_1);

        if (addressData.address_line_2) parts.push(addressData.address_line_2);

        if (addressData.city) parts.push(addressData.city);

        if (addressData.state) parts.push(addressData.state);

        if (addressData.pin) parts.push(addressData.pin);

        if (addressData.country) parts.push(addressData.country);

        return parts.join("\n");
      }

      return "";
    };

    return {
      id: apiInvoice.id,
      invoiceNumber: apiInvoice.invoiceNumber || apiInvoice.invoice_number,
      clientId:
        apiInvoice.clientId || apiInvoice.client_id || apiInvoice.client?.id,
      client: {
        id: apiInvoice.client?.id || apiInvoice.client_id || "",
        name: apiInvoice.client?.name || apiInvoice.client_name || "",
        email: apiInvoice.client?.email || "",
        address: formatAddress(apiInvoice.client?.address),
        logo: apiInvoice.client?.logo,
        phone: apiInvoice.client?.phone || "",
        currency:
          apiInvoice.client?.clientCurrency ||
          apiInvoice.client?.currency ||
          apiInvoice.currency,
        clientCurrency:
          apiInvoice.client?.clientCurrency ||
          apiInvoice.client?.client_currency ||
          apiInvoice.client?.currency ||
          apiInvoice.currency,
        previousInvoiceNumber:
          apiInvoice.client?.previousInvoiceNumber ||
          apiInvoice.client?.previous_invoice_number,
      },
      status: apiInvoice.status,
      issueDate: apiInvoice.issueDate || apiInvoice.issue_date,
      dueDate: apiInvoice.dueDate || apiInvoice.due_date,
      amount: parseFloat(apiInvoice.amount || 0),
      baseCurrencyAmount: parseFloat(
        apiInvoice.baseCurrencyAmount || apiInvoice.base_currency_amount || 0
      ),
      currency: apiInvoice.currency,
      tax: parseFloat(apiInvoice.tax || 0),
      discount: parseFloat(apiInvoice.discount || 0),
      reference: apiInvoice.reference,
      amountPaid: parseFloat(
        apiInvoice.amountPaid || apiInvoice.amount_paid || 0
      ),
      amountDue: parseFloat(apiInvoice.amountDue || apiInvoice.amount_due || 0),
      updatedAt: apiInvoice.updatedAt || apiInvoice.updated_at,
      createdAt: apiInvoice.createdAt || apiInvoice.created_at,
      invoiceLineItems: (
        apiInvoice.invoiceLineItems ||
        apiInvoice.invoice_line_items ||
        []
      ).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        quantity: parseFloat(item.quantity || 0),
        rate: parseFloat(item.rate || 0),
        date: item.date || item.work_date,
        work_date: item.work_date || item.date,
        timesheet_entry_id: item.timesheet_entry_id || item.timesheetEntryId,
        amount:
          item.amount === null ||
          item.amount === undefined ||
          item.amount === ""
            ? undefined
            : parseFloat(item.amount),
        lineTotal:
          item.lineTotal === null ||
          item.lineTotal === undefined ||
          item.lineTotal === ""
            ? undefined
            : parseFloat(item.lineTotal),
      })),
      company: {
        ...apiInvoice.company,
        logo: apiInvoice.company?.logo || "",
        phone: apiInvoice.company?.phone || apiInvoice.company?.phone_number,
        baseCurrency:
          apiInvoice.company?.baseCurrency || apiInvoice.company?.currency,
        dateFormat:
          apiInvoice.company?.dateFormat || apiInvoice.company?.date_format,
        address: apiInvoice.company?.address
          ? formatAddress(apiInvoice.company.address)
          : "",
        taxId: apiInvoice.company?.taxId || apiInvoice.company?.tax_id,
        vatNumber:
          apiInvoice.company?.vatNumber || apiInvoice.company?.vat_number,
        gstNumber:
          apiInvoice.company?.gstNumber || apiInvoice.company?.gst_number,
        bankName: apiInvoice.company?.bankName || apiInvoice.company?.bank_name,
        bankAccountNumber:
          apiInvoice.company?.bankAccountNumber ||
          apiInvoice.company?.bank_account_number,
        bankRoutingNumber:
          apiInvoice.company?.bankRoutingNumber ||
          apiInvoice.company?.bank_routing_number,
        bankSwiftCode:
          apiInvoice.company?.bankSwiftCode ||
          apiInvoice.company?.bank_swift_code,
      },
    };
  }
}

export const invoiceApi = new InvoiceApiService();
