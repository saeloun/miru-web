import { ApiStatus as InvoiceStatus } from "constants/index";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import * as Yup from "yup";
import { i18n } from "../../../../../i18n";

export const isEmailValid = (email: string): boolean => {
  const schema = Yup.string().email();

  return schema.isValidSync(email);
};

export const getInitialRecipients = (invoice: any): string[] =>
  Array.from(
    new Set(
      [
        invoice.client.email,
        ...(invoice.client.clientMembersEmails || []),
      ].filter(Boolean)
    )
  );

export const emailSubject = (invoice: any, isSendReminder = false): string => {
  if (isSendReminder) {
    return i18n.t("invoices.reminderSubject", {
      number: invoice.invoiceNumber,
    });
  }

  return i18n.t("invoices.invoiceSentSubject", {
    company: invoice.company.name,
    number: invoice.invoiceNumber,
  });
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
    return i18n.t("invoices.reminderBody", {
      company: invoice.company.name,
      number: invoice.invoiceNumber,
      dueDate,
    });
  }

  return i18n.t("invoices.invoiceSentBody", {
    company: invoice.company.name,
    number: invoice.invoiceNumber,
    amount: formattedAmount,
    dueDate,
  });
};

export const isDisabled = (status: string): boolean =>
  status === InvoiceStatus.LOADING || status === InvoiceStatus.SUCCESS;

export const buttonText = (status: string): string => {
  switch (status) {
    case InvoiceStatus.SUCCESS:
      return i18n.t("invoices.invoiceWillBeSent");
    case InvoiceStatus.LOADING:
      return i18n.t("invoices.processing");
    default:
      return i18n.t("invoices.sendInvoice");
  }
};
