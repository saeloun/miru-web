import * as React from "react";

const TableHeader = () => (
  <tr>
    <th
      scope="col"
      className="pr-6 pl-0 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
    >
      CLIENT / <br />
      INVOICE NUMBER
    </th>
    <th
      scope="col"
      className="px-6 py-5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
    >
      TRANSACTION DATE
    </th>
    <th
      scope="col"
      className="px-6 py-5 w-2/5 text-xs font-normal tracking-widest text-left text-miru-black-1000"
    >
      NOTES/
      <br />
      TRANSACTION TYPE
    </th>
    <th
      scope="col"
      className="px-6 py-5 text-xs font-normal tracking-widest text-right text-miru-black-1000"
    >
      AMOUNT
    </th>
    <th
      scope="col"
      className="pl-6 pr-0 py-5 text-xs font-normal tracking-widest text-right text-miru-black-1000"
    >
      STATUS
    </th>
  </tr>
);

export default TableHeader;
