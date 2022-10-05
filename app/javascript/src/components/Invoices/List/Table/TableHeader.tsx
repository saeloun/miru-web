import * as React from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({ selectAllInvoices, deselectAllInvoices }) => {
  const [isChecked, setChecked] = React.useState<boolean>(false);

  const handleCheck = (event) => {
    if (event.target.checked) {
      selectAllInvoices();
    } else {
      deselectAllInvoices();
    }
    setChecked(!isChecked);
  };

  return (
    <tr>
      <th className="pl-6 py-5" scope="col">
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
        className="w-1/5 pr-2 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
      >
        CLIENT /
        INVOICE NO.
      </th>
      <th
        scope="col"
        className="w-1/5 px-6 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
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
