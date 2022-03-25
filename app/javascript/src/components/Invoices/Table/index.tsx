import * as React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ updatedInvoiceList, handleSelectAll, handleSelectCheckbox }) => (
  <table className="min-w-full divide-y divide-gray-200 mt-4">
    <thead>
      <TableHeader handleSelectAll={handleSelectAll}/>
    </thead>
    <tbody className="bg-white min-w-full divide-y divide-gray-200">
      {
        updatedInvoiceList.map(invoice => <TableRow handleSelectCheckbox={handleSelectCheckbox} invoice={invoice}/>)
      }

    </tbody>
  </table>
);

export default Table;
