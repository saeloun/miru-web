import * as React from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({ handleSelectAll }) => {
  const [isChecked, setChecked] = React.useState(false);

  const handleCheck = (event) => {
    handleSelectAll(event.target.checked);
    setChecked(!isChecked);
  };

  return (
    <tr>
      <th className="px-6 py-5" scope="col">
        <CustomCheckbox isChecked={isChecked} handleCheck={handleCheck} text='' checkboxValue={1} id={1} />
      </th>
      <th
        scope="col"
        className="px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-wider"
      >
          CLIENT/INVOICE NO.
      </th>
      <th
        scope="col"
        className="px-6 py-5 text-left font-normal text-xs text-miru-dark-purple-600 tracking-wider"
      >
            ISSUED DATE/DUE DATE
      </th>
      <th
        scope="col"
        className="px-6 py-5 text-center font-normal text-xs text-miru-dark-purple-600 tracking-wider"
      >
            AMOUNT
      </th>
      <th
        scope="col"
        className="px-6 py-5 text-center font-normal text-xs text-miru-dark-purple-600 tracking-wider"
      >
            STATUS
      </th>
      <th scope="col" className="relative px-6 py-3"></th>
      <th scope="col" className="relative px-6 py-3"></th>
    </tr>
  );
};

export default TableHeader;
