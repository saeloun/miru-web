import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";
import { i18n } from "../../../i18n";

const InvoiceInfo = ({ invoice, company, strikeAmount = "" }) => {
  const { date_format } = company;
  const { currency, issue_date, due_date, invoice_number, reference, amount } =
    invoice;
  const formattedDate = date => dayjs(date).format(date_format);

  return (
    <>
      <div className="group">
        <p className="flex text-xs font-normal text-foreground">
          {i18n.t("invoices.dateOfIssue")}
        </p>
        <p className="text-base font-normal text-foreground">
          {formattedDate(issue_date)}
        </p>
        <p className="mt-4 text-xs font-normal text-foreground">
          {i18n.t("invoices.dueDate")}
        </p>
        <p className="text-base font-normal text-foreground">
          {formattedDate(due_date)}
        </p>
      </div>
      <div className="group">
        <p className="text-xs font-normal text-foreground">
          {i18n.t("invoices.invoiceNumber")}
        </p>
        <p className="text-base font-normal text-foreground">
          {invoice_number}
        </p>
        <p className="mt-4 text-xs font-normal text-foreground">
          {i18n.t("invoices.reference")}
        </p>
        <p className="text-base font-normal text-foreground">{reference}</p>
      </div>
      <div>
        <p className="text-right text-xs font-normal text-foreground">
          {i18n.t("amount")}
        </p>
        <p
          className={`mt-6 text-2xl font-normal tracking-tight text-foreground ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </p>
      </div>
    </>
  );
};

export default InvoiceInfo;
