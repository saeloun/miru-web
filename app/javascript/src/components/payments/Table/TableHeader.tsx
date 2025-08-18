import React from "react";

const TableHeader = () => (
  <tr>
    <th
      className="whitespace-nowrap py-5 pr-4 pl-0 text-left text-xs font-medium tracking-widest text-miru-black-1000 w-[25%] lg:pr-2"
      scope="col"
    >
      INVOICE # / CLIENT
    </th>
    <th
      className="w-[20%] px-4 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000 lg:px-6"
      scope="col"
    >
      DATE / TYPE
    </th>
    <th
      className="w-[25%] px-2 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000 lg:px-6"
      scope="col"
    >
      NOTES
    </th>
    <th
      className="w-[15%] px-2 py-5 text-right text-xs font-medium tracking-widest text-miru-black-1000 lg:px-6"
      scope="col"
    >
      AMOUNT
    </th>
    <th
      className="w-[15%] px-2 py-5 text-right text-xs font-medium tracking-widest text-miru-black-1000 lg:px-6"
      scope="col"
    >
      STATUS
    </th>
  </tr>
);

export default TableHeader;
