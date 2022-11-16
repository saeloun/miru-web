import React, { useEffect, useState } from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({
  invoices,
  selectedInvoices,
  selectInvoices,
  deselectInvoices
}) => {
  const [isChecked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setChecked(selectedInvoices.length == invoices.length);
  }, [selectedInvoices]);

  const selectAllInvoices = () => {
    selectInvoices(invoices.map((invoice) => invoice.id));
  };

  const deselectAllInvoices = () => {
    deselectInvoices(invoices.map((invoice) => invoice.id));
  };

  const handleCheck = (event) => {
    if (event.target.checked) {
      selectAllInvoices();
    } else {
      deselectAllInvoices();
    }
  };

  return (
    <tr>
      <th className="md:pl-6 md:pr-0 px-4 py-5" scope="col">
        <CustomCheckbox
          isChecked={isChecked}
          handleCheck={handleCheck}
          text=""
          checkboxValue={1}
          id={1}
        />
      </th>
      <th
        scope="col"
        className="md:w-1/5 md:pr-2 pr-6 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
      >
        CLIENT /
        INVOICE NO.
      </th>
      <th
        scope="col"
        className="w-1/4 md:px-6 px-4 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
      >
        ISSUED DATE /
        DUE DATE
      </th>
      <th
        scope="col"
        className="w-1/4 px-6 py-5 text-xs font-normal tracking-widest text-right text-miru-black-1000"
      >
        AMOUNT
      </th>
      <th
        scope="col"
        className="px-6 py-5 text-xs font-normal tracking-widest text-right text-miru-black-1000"
      >
        STATUS
      </th>
    </tr>
  );
};

export default TableHeader;
