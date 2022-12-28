import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ payments, baseCurrency }) => (
  <table className="mt-4 min-w-full divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>
    <tbody className="min-w-full divide-y divide-gray-200 bg-white">
      {payments.map(
        (payment, index) =>
          payment && (
            <TableRow
              baseCurrency={baseCurrency}
              key={index}
              payment={payment}
            />
          )
      )}
    </tbody>
  </table>
);

export default Table;
