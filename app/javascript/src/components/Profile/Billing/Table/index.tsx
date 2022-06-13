import * as React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const data = [];

const Table = () => (
  <table className="min-w-full mt-1 divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>

    <tbody className="min-w-full bg-miru-gray-100  divide-y divide-gray-200">
      {data.map((data) => (
        <TableRow
          data={data}
        />
      ))}
    </tbody>
  </table>
);

export default Table;
