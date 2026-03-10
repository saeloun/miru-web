import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const data = [];

const Table = () => (
  <table className="mt-1 min-w-full divide-y divide-border">
    <thead>
      <TableHeader />
    </thead>
    <tbody className="min-w-full divide-y divide-border bg-muted/40">
      {data.map((data, index) => (
        <TableRow data={data} key={index} />
      ))}
    </tbody>
  </table>
);

export default Table;
