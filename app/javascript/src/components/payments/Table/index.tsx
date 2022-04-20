import * as React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ payments }) => (
  <table className="min-w-full mt-4 divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>

    <tbody className="min-w-full bg-white divide-y divide-gray-200">
      {payments.map((member) => member && <TableRow member={member} />)}
    </tbody>
  </table>
);

export default Table;
