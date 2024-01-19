import React from "react";

const TableHeader = () => (
  <thead>
    <tr className="flex w-full justify-between">
      <th className="flex text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-1/4">
        DATE
      </th>
      <th className="flex w-3/6 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-4/12">
        DESCRIPTION
      </th>
      <th className="flex justify-end text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-3/12">
        HOURS
      </th>
    </tr>
  </thead>
);

export default TableHeader;
