import * as React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({
  invoices,
  selectInvoices,
  deselectInvoices,
  selectedInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete
}) => (
  <table className="min-w-full mt-4 divide-y divide-gray-200">
    <thead>
      <TableHeader
        selectAllInvoices={() =>
          selectInvoices(invoices.map((invoice) => invoice.id))
        }
        deselectAllInvoices={() =>
          deselectInvoices(invoices.map((invoice) => invoice.id))
        }
      />
    </thead>

    <tbody className="min-w-full bg-white divide-y divide-gray-200">
      {invoices.map((invoice) => (
        <TableRow
          key={invoice.id}
          isSelected={selectedInvoices.includes(invoice.id)}
          invoice={invoice}
          selectInvoices={selectInvoices}
          deselectInvoices={deselectInvoices} setShowDeleteDialog={setShowDeleteDialog} setInvoiceToDelete={setInvoiceToDelete} />
      ))}
    </tbody>
  </table>
);

export default Table;
