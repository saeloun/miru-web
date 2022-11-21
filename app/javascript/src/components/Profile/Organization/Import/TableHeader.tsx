import * as React from "react";

const TableHeader = () => (
  <tr>
    <th className="table__import_header" scope="col">
      FIELD
    </th>
    <th scope="col" className="table__import_header">
      COLUMN NAME
    </th>
  </tr>
);

export default TableHeader;
