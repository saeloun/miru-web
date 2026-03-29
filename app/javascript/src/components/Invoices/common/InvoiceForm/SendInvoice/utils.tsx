import { ApiStatus as InvoiceStatus } from "constants/index";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import * as Yup from "yup";

export const isEmailValid = (email: string): boolean => {
  const schema = Yup.string().email();

  return schema.isValidSync(email);
};

export const emailSubject = (invoice: any, isSendReminder = false): string => {
  if (isSendReminder) {
    return `Reminder to complete payments for unpaid invoice (${invoice.invoiceNumber})`;
  }

  return `${invoice.company.name} sent you an invoice (${invoice.invoiceNumber})`;
};

export const emailBody = (invoice: any, isSendReminder = false): string => {
  const formattedAmount = currencyFormat(
    invoice.company.baseCurrency || invoice.company.currency,
    invoice.amount
  );

  const dueDate = dayjs(invoice.dueDate, invoice.company.dateFormat).format(
    invoice.company.dateFormat || "DD.MM.YYYY"
  );

  if (isSendReminder) {
    return `${invoice.company.name} has sent you a reminder for invoice (${invoice.invoiceNumber}) that's due on ${dueDate}.`;
  }

  return `${invoice.company.name} has sent you an invoice (${invoice.invoiceNumber}) for ${formattedAmount} that's due on ${dueDate}.`;
};

export const isDisabled = (status: string): boolean =>
  status === InvoiceStatus.LOADING || status === InvoiceStatus.SUCCESS;

export const buttonText = (status: string): string => {
  switch (status) {
    case InvoiceStatus.SUCCESS:
      return "🎉 Invoice will be sent!";
    case InvoiceStatus.LOADING:
      return "processing...";
    default:
      return "Send Invoice";
  }
};
