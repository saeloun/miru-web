import React from "react";

import BackButton from "./BackButton";
import InvoiceActions from "./InvoiceActions";
import InvoiceStatus from "./InvoiceStatus";

const Header = ({
  invoice,
  handleSendInvoice,
  setShowDeleteDialog,
  setInvoiceToWaive,
  setInvoiceToDelete,
  setShowWavieDialog,
  setShowConnectPaymentDialog,
  isStripeEnabled,
  setShowHistory,
}) => {
  const invoiceWaived = invoice?.status === "waived";

  return (
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-row">
        <BackButton href="/invoices" />
        <InvoiceStatus invoice={invoice} />
      </div>
      {!invoiceWaived && (
        <InvoiceActions
          editInvoiceLink={`/invoices/${invoice.id}/edit`}
          invoice={invoice}
          isStripeEnabled={isStripeEnabled}
          sendInvoice={handleSendInvoice}
          setShowConnectPaymentDialog={setShowConnectPaymentDialog}
          setShowHistory={setShowHistory}
          deleteInvoice={() => {
            setShowDeleteDialog(true);
            setInvoiceToDelete(invoice.id);
          }}
          wavieInvoice={() => {
            setShowWavieDialog(true);
            setInvoiceToWaive(invoice.id);
          }}
        />
      )}
    </div>
  );
};

export default Header;
