import React from "react";
import BackButton from "./BackButton";
import InvoiceActions from "./InvoiceActions";
import InvoiceStatus from "./InvoiceStatus";

const Header = ({ invoice, handleSendInvoice }) => (
  <>
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-row">
        <BackButton href="/invoices" />
        <InvoiceStatus invoice={invoice} />
      </div>
      <InvoiceActions
        deleteInvoice={() => { alert("Implement me!"); }}
        editInvoice={() => { alert("Implement me!"); }}
        sendInvoice={handleSendInvoice}
      />
    </div>
  </>
);

export default Header;
