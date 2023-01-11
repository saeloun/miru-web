import React, { useEffect, useState } from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({
  invoices,
  selectedInvoices,
  selectInvoices,
  deselectInvoices,
  isDesktop,
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  useEffect(() => {
    setIsChecked(selectedInvoices.length == invoices.length);
  }, [selectedInvoices]);

  const selectAllInvoices = () => {
    selectInvoices(invoices.map(invoice => invoice.id));
  };

  const deselectAllInvoices = () => {
    deselectInvoices(invoices.map(invoice => invoice.id));
  };

  const handleCheck = event => {
    if (event.target.checked) {
      selectAllInvoices();
    } else {
      deselectAllInvoices();
    }
  };

  return (
    <tr>
      <th className="px-4 py-5" scope="col">
        <CustomCheckbox
          checkboxValue={1}
          handleCheck={handleCheck}
          id={1}
          isChecked={isChecked}
          text=""
        />
      </th>
      <th
        className="whitespace-nowrap py-5 pr-0 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:w-1/3 lg:pr-2 lg:pr-2"
        scope="col"
      >
        CLIENT / <br />
        INVOICE NO.
      </th>
      {isDesktop && (
        <th
          className="w-1/5 px-4 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 lg:px-6"
          scope="col"
        >
          ISSUED DATE / DUE DATE
        </th>
      )}
      <th
        className="w-1/6 px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:px-6"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:px-6"
        scope="col"
      >
        STATUS
      </th>
    </tr>
  );
};

export default TableHeader;
