import React from "react";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import { ReportsIcon } from "miruIcons";
import { Button } from "StyledComponents";

import Header from "./Header";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotal from "./InvoiceTotal";

const MobileView = ({ data }) => {
  const { url, invoice, lineItems, company } = data;
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
        <div className="border-b border-miru-gray-400 px-4 py-2">
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
              window.location.href = url;
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
