import type { Company } from "./company";
import type { Client } from "./timeTracking";

export interface Invoice {
  id?: number | string;
  invoiceNumber?: string;
  invoice_number?: number | string;
  clientId?: string;
  client_id?: string;
  client_name?: string;
  client?: Client;
  status: string;
  issueDate?: string;
  issue_date?: string;
  dueDate?: string;
  due_date?: string;
  amount: number;
  amount_due?: number;
  baseCurrencyAmount?: number;
  base_currency_amount?: number;
  currency?: string;
  tax?: number;
  invoiceTaxes?: import("../services/invoiceApi").InvoiceTax[];
  discount?: number;
  reference?: string;
  amountPaid?: number;
  amountDue?: number;
  updatedAt?: string;
  createdAt?: string;
  invoiceLineItems?: import("../services/invoiceApi").InvoiceItem[];
  company?: Company;
  stripe_enabled?: boolean;
}
