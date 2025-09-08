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
      <th className="py-5 lg:px-3" scope="col">
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={1}
          handleCheck={handleCheck}
          id={1}
          isChecked={isChecked}
          text=""
          wrapperClassName="h-8 w-8 m-auto rounded-3xl p-2 hover:bg-miru-gray-1000"
        />
      </th>
      <th
        className="whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 lg:w-1/3 lg:pr-2"
        scope="col"
      >
        CLIENT / INVOICE NO.
      </th>
      {isDesktop && (
        <th
          className="w-1/5 px-4 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000 lg:px-6"
          scope="col"
        >
          ISSUED DATE / DUE DATE
        </th>
      )}
      <th
        className="hidden w-1/6 px-2 py-5 text-right text-xs font-medium tracking-widest text-miru-black-1000 lg:table-cell lg:px-6"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="hidden px-2 py-5 text-right text-xs font-medium tracking-widest text-miru-black-1000 lg:table-cell lg:px-6"
        scope="col"
      >
        STATUS
      </th>
      <th
        className="table-cell px-2 py-5 text-right text-xs font-medium leading-4 tracking-widest text-miru-black-1000 lg:hidden lg:px-6"
        scope="col"
      >
        STATUS/ <br />
        AMOUNT
      </th>
    </tr>
  );
};

export default TableHeader;
