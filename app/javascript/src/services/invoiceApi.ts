import axios from "../apis/api";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  logo?: string;
  currency?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
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
  invoiceLineItems?: InvoiceItem[];
  company?: {
    name: string;
    baseCurrency: string;
    dateFormat: string;
  };
}

export interface InvoiceFormData {
  id?: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
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
  summary: {
    draftAmount: string | number;
    outstandingAmount: string | number;
    overdueAmount: string | number;
    totalAmount: string | number;
    currency: string;
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
        response.data.recently_updated_invoices ||
        response.data.recentlyUpdatedInvoices ||
        []
      ).map((inv: any) => this.transformApiInvoice(inv)),
      summary: response.data.summary || {
        draftAmount: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        totalAmount: 0,
        currency: "USD",
      },
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

    return this.transformApiInvoice(response.data.invoice);
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

    return this.transformApiInvoice(response.data.invoice);
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
      invoice_line_items_attributes: invoiceData.invoiceLineItems.map(
        (item, index) => ({
          id: item.id === "new" ? undefined : item.id,
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          _destroy: false,
        })
      ),
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
      client: {
        id: apiInvoice.client?.id || apiInvoice.client_id || "",
        name: apiInvoice.client?.name || apiInvoice.client_name || "",
        email: apiInvoice.client?.email || "",
        address: formatAddress(apiInvoice.client?.address),
        logo: apiInvoice.client?.logo,
        currency:
          apiInvoice.client?.clientCurrency ||
          apiInvoice.client?.currency ||
          apiInvoice.currency,
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
      invoiceLineItems: (
        apiInvoice.invoiceLineItems ||
        apiInvoice.invoice_line_items ||
        []
      ).map((item: any) => ({
        id: item.id,
        description: item.description || item.name,
        quantity: parseFloat(item.quantity || 0),
        rate: parseFloat(item.rate || 0),
        amount: parseFloat(item.amount || 0),
      })),
      company: apiInvoice.company,
    };
  }
}

export const invoiceApi = new InvoiceApiService();
