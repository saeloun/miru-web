import * as React from "react";

const TableHeader = () => (
  <tr>
    <th className="px-2 py-1 text-xs font-normal tracking-widest text-left text-miru-black-1000" scope="col">
        DATE
    </th>
    <th
      scope="col"
      className="px-4 py-1 text-xs font-normal tracking-widest text-left text-miru-black-1000"
    >
        DESCRIPTION
    </th>
    <th
      scope="col"
      className="px-2 py-1 text-xs font-normal tracking-widest text-left text-miru-black-1000"
    >
        TEAM MEMBERS
    </th>
    <th
      scope="col"
      className="px-2 py-1 text-xs font-normal tracking-widest text-center text-miru-black-1000"
    >
        TOTAL BILL AMT
    </th>
    <th
      scope="col"
      className="px-2 py-1 text-xs font-normal tracking-widest text-center text-miru-black-1000"
    >
        PAYMENT TYPE
    </th>
    <th scope="col" className="relative px-6 py-3"></th>
  </tr>
);

export default TableHeader;
