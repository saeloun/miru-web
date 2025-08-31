import React from "react";

import { useUserContext } from "context/UserContext";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ expenses, fetchExpenses }) => {
  const { company } = useUserContext();

  return (
    <table className="w-full min-w-full divide-y divide-gray-200 overflow-y-scroll">
      <TableHeader />
      <tbody>
        {expenses?.map(expense => (
          <TableRow
            currency={company.base_currency}
            expense={expense}
            fetchExpenses={fetchExpenses}
            key={expense.id}
          />
        ))}
      </tbody>
    </table>
  );
};

export default Table;
