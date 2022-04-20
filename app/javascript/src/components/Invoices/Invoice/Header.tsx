import React from "react";
import BackButton from "./BackButton";
import InvoiceActions from "./InvoiceActions";
import InvoiceStatus from "./InvoiceStatus";

const Header = ({ invoice }) => (
  <>
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-row">
        <BackButton onClick={() => window.location.href = "/invoices"}/>
        <InvoiceStatus invoice={invoice} />
      </div>
      <InvoiceActions
        deleteInvoice={() => { alert("Implement me!"); }}
        editInvoice={() => { alert("Implement me!"); }}
        sendInvoice={() => { alert("Implement me!"); }}
      />
    </div>
  </>
);

export default Header;
