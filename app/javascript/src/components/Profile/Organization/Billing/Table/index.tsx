import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const data = [];

const Table = () => (
  <table className="mt-1 min-w-full divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>
    <tbody className="min-w-full divide-y  divide-gray-200 bg-miru-gray-100">
      {data.map((data, index) => (
        <TableRow data={data} key={index} />
      ))}
    </tbody>
  </table>
);

export default Table;
