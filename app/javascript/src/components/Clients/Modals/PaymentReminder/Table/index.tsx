import React, { useState } from "react";

import InvoicesList from "./InvoicesList";
import TableHeader from "./TableHeader";

const Table = ({ invoices, selectedInvoices, setSelectedInvoices }) => {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const deselectInvoices = (invoiceIds: number[]) =>
    setSelectedInvoices(
      selectedInvoices.filter(id => !invoiceIds.includes(id))
    );

  const handleCheck = event => {
    if (event.target.checked) {
      selectAllInvoices();
      setIsChecked(true);
    } else {
      deselectAllInvoices();
      setIsChecked(false);
    }
  };

  const selectInvoices = (invoiceIds: number[]) => {
    setSelectedInvoices(
      Array.from(new Set(selectedInvoices.concat(invoiceIds)))
    );
  };

  const selectAllInvoices = () => {
    setSelectedInvoices(invoices.map(invoice => invoice.id));
  };

  const deselectAllInvoices = () => {
    deselectInvoices(
      invoices
        .filter(invoice => invoice.status !== "overdue")
        .map(invoice => invoice.id)
    );
  };

  return (
    <div className="h-full overflow-y-auto pb-10/100">
      <table className="min-w-full divide-y divide-gray-200 overflow-x-scroll overflow-y-scroll lg:mt-4">
        <TableHeader handleCheck={handleCheck} isChecked={isChecked} />
        <tbody>
          {invoices.map((invoice, idx) => (
            <InvoicesList
              deselectInvoices={deselectInvoices}
              invoice={invoice}
              isSelected={selectedInvoices.includes(invoice.id)}
              key={idx}
              selectInvoices={selectInvoices}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
