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
}) => (
  <table className="mt-4 min-w-full divide-y divide-gray-200 overflow-x-scroll">
    <thead>
      <TableHeader
        deselectInvoices={deselectInvoices}
        invoices={invoices}
        selectInvoices={selectInvoices}
        selectedInvoices={selectedInvoices}
      />
    </thead>
    <tbody
      className="min-w-full divide-y divide-gray-200 bg-white"
      data-cy="invoices-list"
    >
      {invoices.map(invoice => (
        <TableRow
          deselectInvoices={deselectInvoices}
          fetchInvoices={fetchInvoices}
          invoice={invoice}
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
