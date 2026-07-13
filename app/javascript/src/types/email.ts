export interface InvoiceEmail {
  subject: string;
  message: string;
  recipients: string[];
}

export type SendPaymentReminderEmail = InvoiceEmail;
