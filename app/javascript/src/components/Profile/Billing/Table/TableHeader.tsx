import React from "react";

const TableHeader = () => (
  <tr>
    <th
      className="px-2 py-1 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      DATE
    </th>
    <th
      className="px-4 py-1 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      DESCRIPTION
    </th>
    <th
      className="px-2 py-1 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      TEAM MEMBERS
    </th>
    <th
      className="px-2 py-1 text-center text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      TOTAL BILL AMT
    </th>
    <th
      className="px-2 py-1 text-center text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      PAYMENT TYPE
    </th>
    <th className="relative px-6 py-3" scope="col" />
  </tr>
);

export default TableHeader;
