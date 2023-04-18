import React from "react";

import { TableProps } from "components/payments/interfaces";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const TableOnMobileView = ({ payments, baseCurrency }: TableProps) => (
  <table className="mt-4 min-w-full divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>
    <tbody className="block min-w-full divide-y divide-gray-200 bg-white pb-24">
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

export default TableOnMobileView;
