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
  fetchInvoices
}) => (

  <table className="min-w-full mt-4 divide-y divide-gray-200 overflow-x-scroll">
    <thead>
      <TableHeader
        invoices={invoices}
        selectedInvoices={selectedInvoices}
        selectInvoices={selectInvoices}
        deselectInvoices={deselectInvoices}
      />
    </thead>

    <tbody className="min-w-full bg-white divide-y divide-gray-200" data-cy="invoices-list">
      {invoices.map((invoice) => (
        <TableRow
          key={invoice.id}
          isSelected={selectedInvoices.includes(invoice.id)}
          invoice={invoice}
          selectInvoices={selectInvoices}
          deselectInvoices={deselectInvoices}
          setShowDeleteDialog={setShowDeleteDialog}
          setInvoiceToDelete={setInvoiceToDelete}
          fetchInvoices={fetchInvoices}
        />
      ))}
    </tbody>
  </table>
);

export default Table;
