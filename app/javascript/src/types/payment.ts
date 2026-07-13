export interface Payment {
  id: number | string;
  amount: number;
  status: string;
  invoiceId?: number | string | null;
  invoiceNumber?: string;
  clientName?: string;
  transactionDate?: string;
  transactionType?: string;
  transactionId?: string;
  note?: string;
  currency?: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
  payment_date?: string;
  transaction_id?: string;
  payment_method?: string;
  client_name?: string;
  invoice_number?: string;
  notes?: string;
  razorpayPayout?: {
    id: number | string;
    externalId?: string;
    status: string;
    triggeredBy: string;
    failureReason?: string;
    recipientUpiId?: string;
  };
}
