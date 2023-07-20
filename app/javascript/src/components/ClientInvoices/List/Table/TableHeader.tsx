import React from "react";

const TableHeader = () => (
  <tr>
    <th
      className="whitespace-nowrap py-5 pr-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 md:font-normal lg:w-1/3 lg:pr-2 lg:pr-2"
      scope="col"
    >
      CLIENT / <br /> INVOICE NO.
    </th>
    <th
      className="hidden w-1/5 px-4 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000 lg:table-cell lg:px-6"
      scope="col"
    >
      ISSUED DATE / <br /> DUE DATE
    </th>
    <th
      className="hidden w-1/6 px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell lg:px-6"
      scope="col"
    >
      AMOUNT
    </th>
    <th
      className="hidden px-2 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000 lg:table-cell lg:px-6"
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

export default TableHeader;
