import React from "react";

import CustomCheckbox from "common/CustomCheckbox";

const TableHeader = ({ handleCheck, isChecked }) => (
  <thead>
    <tr>
      <th className="py-5" scope="col">
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
        className="w-1/4 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
        scope="col"
      >
        INVOICE NO.
      </th>
      <th
        className="w-1/4 whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:px-2"
        scope="col"
      >
        ISSUE DATE
      </th>
      <th
        className="whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:pr-2"
        scope="col"
      >
        DUE DATE
      </th>
      <th
        className="hidden w-1/5 px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="hidden w-1/6 px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell"
        scope="col"
      >
        STATUS
      </th>
    </tr>
  </thead>
);

export default TableHeader;
