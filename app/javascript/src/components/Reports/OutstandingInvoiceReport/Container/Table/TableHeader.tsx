import React from "react";

const TableHeader = () => (
  <thead>
    <tr className="flex flex-row items-center">
      <th
        className="w-1/2 py-4 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:w-4/12 lg:py-3"
        scope="col"
      >
        CLIENT /
        <br />
        INVOICE NO.
      </th>
      <th
        className="hidden w-3/12 py-3 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        ISSUED DATE /
        <br />
        DUE DATE
      </th>
      <th
        className="hidden w-2/12 py-3 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        AMOUNT
      </th>
      <th
        className="hidden w-3/12 py-3 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        STATUS
      </th>
      <th
        className="table-cell w-1/2 px-2 py-4 text-right text-xs font-medium leading-4 tracking-widest text-miru-black-1000 lg:hidden lg:px-6"
        scope="col"
      >
        STATUS/ <br />
        AMOUNT
      </th>
    </tr>
  </thead>
);

export default TableHeader;
