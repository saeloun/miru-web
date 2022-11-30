import React, { useEffect, useState } from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({
  invoices,
  selectedInvoices,
  selectInvoices,
  deselectInvoices,
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
      <th className="px-4 py-5 md:pl-6 md:pr-0" scope="col">
        <CustomCheckbox
          checkboxValue={1}
          handleCheck={handleCheck}
          id={1}
          isChecked={isChecked}
          text=""
        />
      </th>
      <th
        className="py-5 pr-6 text-left text-xs font-normal tracking-widest text-miru-black-1000 md:w-1/5 md:pr-2"
        scope="col"
      >
        CLIENT / INVOICE NO.
      </th>
      <th
        className="w-1/4 px-4 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000 md:px-6"
        scope="col"
      >
        ISSUED DATE / DUE DATE
      </th>
      <th
        className="w-1/4 px-6 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="px-6 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000"
        scope="col"
      >
        STATUS
      </th>
    </tr>
  );
};

export default TableHeader;
