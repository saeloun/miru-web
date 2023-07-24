import React from "react";

import { CaretDownIcon } from "miruIcons";

const TableHeader = () => (
  <thead className="w-full">
    <tr className="flex w-full flex-row items-center py-5">
      <th
        className="w-3/12 cursor-pointer pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        CATEGORY
      </th>
      <th
        className="flex w-2/12 items-center pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        DATE <CaretDownIcon className="ml-2" size={18} />
      </th>
      <th
        className="w-3/12 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        VENDOR
      </th>
      <th
        className="w-2/12 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        TYPE
      </th>
      <th
        className="w-2/12 pl-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        AMOUNT
      </th>
    </tr>
  </thead>
);

export default TableHeader;
