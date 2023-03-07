import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({
  invoices,
  selectInvoices,
  deselectInvoices,
  selectedInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete,
  fetchInvoices,
  isDesktop,
}) => (
  <table
    className="min-w-full divide-y divide-gray-200 overflow-x-scroll lg:mt-4"
    id="invoices-list-table"
  >
    <thead>
      <TableHeader
        deselectInvoices={deselectInvoices}
        invoices={invoices}
        isDesktop={isDesktop}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
      />
    </thead>
    <tbody
      className="min-w-full divide-y divide-gray-200 bg-white"
      data-cy="invoices-list"
    >
      {invoices.map((invoice, index) => (
        <TableRow
          deselectInvoices={deselectInvoices}
          fetchInvoices={fetchInvoices}
          index={index}
          invoice={invoice}
          isDesktop={isDesktop}
          isSelected={selectedInvoices.includes(invoice.id)}
          key={invoice.id}
          selectInvoices={selectInvoices}
          setInvoiceToDelete={setInvoiceToDelete}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      ))}
    </tbody>
  </table>
);

export default Table;
