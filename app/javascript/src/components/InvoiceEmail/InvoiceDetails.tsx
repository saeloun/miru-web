import React from "react";

import InvoiceInfo from "./InvoiceInfo";
import InvoiceTotalSummary from "./InvoiceTotalSummary";
import { MiruLogoWithTextSVG } from "miruIcons";

import CompanyInfo from "../Invoices/common/CompanyInfo";
import ClientInfo from "../Invoices/Invoice/ClientInfo";
import InvoiceLineItems from "../Invoices/Invoice/InvoiceLineItems";

const InvoiceDetails = ({
  invoice,
  company,
  lineItems,
  client,
  logo,
  upiPayment,
}) => {
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoiceWaived && "line-through";

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
      {upiPayment?.qr_code_data_uri && (
        <div className="border-t-2 border-border bg-background px-10 py-6">
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
        </div>
      )}
    </>
  );
};

export default InvoiceDetails;
