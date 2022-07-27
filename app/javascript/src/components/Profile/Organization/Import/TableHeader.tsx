import * as React from "react";

const TableHeader = () => (
  <tr>
    <th className="px-2 py-1 w-1/2 text-xs font-normal tracking-widest text-left text-miru-dark-purple-600" scope="col">
      FIELD
    </th>
    <th
      scope="col"
      className="px-4 py-1 w-1/2 text-xs font-normal tracking-widest text-left text-miru-dark-purple-600"
    >
      COLUMN NAME
    </th>
  </tr>
);

export default TableHeader;
