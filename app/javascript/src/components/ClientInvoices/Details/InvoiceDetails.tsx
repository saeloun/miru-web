import React from "react";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import ClientInfo from "components/Invoices/Invoice/ClientInfo";
import InvoiceLineItems from "components/Invoices/Invoice/InvoiceLineItems";
import { MiruLogoWithTextSVG } from "miruIcons";

import { i18n } from "../../../i18n";

import InvoiceInfo from "./InvoiceInfo";
import InvoiceTotalSummary from "./InvoiceTotalSummary";

const InvoiceDetails = ({
  invoice,
  company,
  lineItems,
  client,
  logo,
  bankPayment,
  upiPayment,
}) => {
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoiceWaived && "line-through";
  const bankRows = [
    {
      label: i18n.t("paymentSettingsPage.bankName"),
      value: bankPayment?.bank_name,
    },
    {
      label: i18n.t("paymentSettingsPage.accountNumber"),
      value: bankPayment?.bank_account_number,
    },
    {
      label: i18n.t("paymentSettingsPage.routingNumber"),
      value: bankPayment?.bank_routing_number,
    },
    {
      label: i18n.t("paymentSettingsPage.swiftCode"),
      value: bankPayment?.bank_swift_code,
    },
  ].filter(row => row.value);

  const sortedLineItems = [...lineItems].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
      <CompanyInfo company={company} logo={logo} />
      <div className="flex h-36 justify-between border-b-2 border-border px-10 py-5">
        <ClientInfo client={client} />
        <InvoiceInfo
          company={company}
          invoice={invoice}
          strikeAmount={strikeAmount}
        />
      </div>
      <InvoiceLineItems
        currency={invoice.currency}
        dateFormat={company.dateFormat || company.date_format}
        items={sortedLineItems}
        showHeader={lineItems.length > 0}
        strikeAmount={strikeAmount}
      />
      <InvoiceTotalSummary
        invoice={invoice}
        lineItems={lineItems}
        strikeAmount={strikeAmount}
      />
      {(upiPayment?.qr_code_data_uri || bankRows.length > 0) && (
        <div className="grid gap-4 border-t-2 border-border bg-background px-10 py-6 md:grid-cols-2">
          {upiPayment?.qr_code_data_uri && (
            <div className="max-w-xs rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-center border-b border-border pb-3">
                <img alt="Miru" className="h-6" src={MiruLogoWithTextSVG} />
              </div>
              <img
                alt="UPI QR code"
                className="mx-auto h-40 w-40"
                src={upiPayment.qr_code_data_uri}
              />
              <p className="mt-3 text-center text-sm font-semibold text-foreground">
                UPI: {upiPayment.upi_id}
              </p>
            </div>
          )}
          {bankRows.length > 0 && (
            <div className="rounded-lg border border-border bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {bankPayment?.title || i18n.t("invoices.bankDetails")}
              </p>
              <div className="mt-3 grid gap-3 text-sm">
                {bankRows.map(row => (
                  <div
                    className="flex items-start justify-between gap-4"
                    key={row.label}
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="break-all text-right font-medium text-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default InvoiceDetails;
