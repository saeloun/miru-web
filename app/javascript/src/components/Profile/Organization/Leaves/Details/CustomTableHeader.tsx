import React from "react";

const CustomTableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center py-5">
      <th
        className="flex w-4/12 cursor-pointer pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        LEAVE TYPE
      </th>
      <th
        className="w-4/12 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        TOTAL
      </th>
      <th
        className="w-4/12 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        Employees
      </th>
    </tr>
  </thead>
);

export default CustomTableHeader;
