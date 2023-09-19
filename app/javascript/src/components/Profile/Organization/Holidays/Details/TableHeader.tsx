import React from "react";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center py-5">
      <th
        className="flex w-6/12 cursor-pointer pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        DATE
      </th>
      <th
        className="w-6/12 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        NAME
      </th>
    </tr>
  </thead>
);

export default TableHeader;
