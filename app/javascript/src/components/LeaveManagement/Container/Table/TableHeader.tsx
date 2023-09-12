import React from "react";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center py-5">
      <th
        className="flex w-1/3 cursor-pointer pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-3/12"
        scope="col"
      >
        DATE
      </th>
      <th
        className="w-1/3 pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-4/12"
        scope="col"
      >
        DESCRIPTION
      </th>
      <th
        className="hidden pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:table-cell lg:w-2/12"
        scope="col"
      >
        STATUS
      </th>
      <th
        className="hidden pl-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:table-cell lg:w-3/12"
        scope="col"
      >
        HOURS
      </th>
      <th
        className="table-cell w-1/3 pl-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:hidden"
        scope="col"
      >
        Hours/ <br /> Status
      </th>
    </tr>
  </thead>
);

export default TableHeader;
