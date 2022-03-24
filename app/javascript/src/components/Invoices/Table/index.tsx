import * as React from "react";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = () => (
  <table className="min-w-full divide-y divide-gray-200 mt-4">
    <TableHeader />
    <tbody className="bg-white min-w-full divide-y divide-gray-200">
      <TableRow />
    </tbody>
  </table>
);

export default Table;
