import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ invoices }) => (
  <table
    className="min-w-full divide-y divide-border overflow-y-scroll lg:mt-4"
    id="invoicesListTable"
  >
    <thead>
      <TableHeader />
    </thead>
    <tbody className="min-w-full divide-y divide-border bg-card">
      {invoices.map((invoice, index) => (
        <TableRow index={index} invoice={invoice} key={invoice.id} />
      ))}
    </tbody>
  </table>
);

export default Table;
