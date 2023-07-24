import React, { useState } from "react";

import MobileInvoicesList from "./MobileInvoicesList";
import MobileTableHeader from "./MobileTableHeader";

const MobileTable = ({ invoices, selectedInvoices, setSelectedInvoices }) => {
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
    deselectInvoices(invoices.map(invoice => invoice.id));
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="h-full overflow-x-scroll p-0 font-manrope">
        <div className="z-50 flex h-full w-full flex-col">
          <table className="min-w-full divide-y divide-gray-200 overflow-x-scroll overflow-y-scroll">
            <MobileTableHeader
              handleCheck={handleCheck}
              isChecked={isChecked}
            />
            <tbody>
              {invoices.map((invoice, idx) => (
                <MobileInvoicesList
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
      </div>
    </div>
  );
};

export default MobileTable;
