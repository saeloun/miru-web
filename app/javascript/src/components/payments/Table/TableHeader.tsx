import * as React from "react";

const TableHeader = () => (
  <tr>
    <th
      className="py-5 pr-6 pl-0 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      CLIENT / <br />
      INVOICE NUMBER
    </th>
    <th
      className="px-6 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      TRANSACTION DATE
    </th>
    <th
      className="w-2/5 px-6 py-5 text-left text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      NOTES/
      <br />
      TRANSACTION TYPE
    </th>
    <th
      className="px-6 py-5 text-right text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      AMOUNT
    </th>
    <th
      className="py-5 pl-6 pr-0 text-right text-xs font-normal tracking-widest text-miru-black-1000"
      scope="col"
    >
      STATUS
    </th>
  </tr>
);

export default TableHeader;
