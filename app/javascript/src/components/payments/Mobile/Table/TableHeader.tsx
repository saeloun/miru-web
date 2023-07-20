import React from "react";

const TableHeader = () => (
  <tr className="block md:hidden">
    <th
      className="w-full pt-6 pb-2 pr-6 pl-0 text-left font-manrope text-xs font-normal uppercase tracking-xs-widest text-miru-dark-purple-600"
      scope="col"
    >
      CLIENT/ <br />
      INVOICE NUMBER
    </th>
    <th
      className="w-full pt-6 pb-2 pl-0 text-right font-manrope text-xs font-normal uppercase tracking-xs-widest text-miru-dark-purple-600"
      scope="col"
    >
      STATUS/ <br />
      AMOUNT
    </th>
  </tr>
);

export default TableHeader;
