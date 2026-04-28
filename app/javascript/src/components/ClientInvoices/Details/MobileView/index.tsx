import React from "react";

import { MiruLogoWithTextSVG, ReportsIcon } from "miruIcons";
import { Button } from "StyledComponents";

import CompanyInfo from "components/Invoices/common/CompanyInfo";

import Header from "./Header";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotal from "./InvoiceTotal";

const MobileView = ({ data }) => {
  const { url, invoice, lineItems, company, upi_payment } = data;
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoiceWaived && "line-through";

  return (
    <div className="h-full">
      <Header invoice={invoice} />
      <div className="h-full overflow-y-scroll">
        <CompanyInfo company={company} />
        <InvoiceInfo
          company={company}
          invoice={invoice}
          strikeAmount={strikeAmount}
        />
        <div className="border-b border-border px-4 py-2">
          <InvoiceLineItems
            currency={invoice.currency}
            dateFormat={company.dateFormat || company.date_format}
            items={lineItems}
            showHeader={lineItems.length > 0}
            strikeAmount={strikeAmount}
          />
        </div>
        <InvoiceTotal
          invoice={invoice}
          lineItems={lineItems}
          strikeAmount={strikeAmount}
        />
        {upi_payment?.qr_code_data_uri && (
          <div className="border-b border-border px-4 py-4">
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-center border-b border-border pb-3">
                <img alt="Miru" className="h-6" src={MiruLogoWithTextSVG} />
              </div>
              <img
                alt="UPI QR code"
                className="mx-auto h-40 w-40"
                src={upi_payment.qr_code_data_uri}
              />
              <p className="mt-3 break-all text-center text-sm font-semibold">
                UPI: {upi_payment.upi_id}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 left-0 right-0 z-50 flex w-full items-center justify-between  bg-white p-4 shadow-c1">
        <Button
          className="mr-2 flex w-full items-center justify-center px-4 py-2"
          style="primary"
          disabled={
            invoice.status == "paid" ||
            invoice.status == "waived" ||
            invoice.amount <= 0
          }
          onClick={() => {
            if (invoice.status != "paid") {
              window.location.href = upi_payment?.payment_link || url;
            }
          }}
        >
          <ReportsIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            PAY
          </span>
        </Button>
      </div>
    </div>
  );
};

export default MobileView;
