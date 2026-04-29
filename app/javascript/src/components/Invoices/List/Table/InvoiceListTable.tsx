import React from "react";

import InvoiceListTableHeader from "./InvoiceListTableHeader";
import TableRow from "./TableRow";

const InvoiceListTable = ({
  invoices,
  selectInvoices,
  deselectInvoices,
  selectedInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete,
  fetchInvoices,
  isDesktop,
  isPaymentEnabled,
  setIsPaymentEnabled,
}) => (
  <table
    className="min-w-full divide-y divide-gray-200 overflow-x-scroll lg:mt-4"
    id="invoicesListTable"
  >
    <thead>
      <InvoiceListTableHeader
        deselectInvoices={deselectInvoices}
        invoices={invoices}
        isDesktop={isDesktop}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
      />
    </thead>
    <tbody className="min-w-full divide-y divide-gray-200 bg-white">
      {invoices.map((invoice, index) => (
        <TableRow
          deselectInvoices={deselectInvoices}
          fetchInvoices={fetchInvoices}
          index={index}
          invoice={invoice}
          isDesktop={isDesktop}
          isSelected={selectedInvoices.includes(invoice.id)}
          isPaymentEnabled={isPaymentEnabled}
          key={invoice.id}
          selectInvoices={selectInvoices}
          setInvoiceToDelete={setInvoiceToDelete}
          setIsPaymentEnabled={setIsPaymentEnabled}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      ))}
    </tbody>
  </table>
);

export default InvoiceListTable;
