import React from "react";

import { currencyFormat } from "helpers";

import { RevenueByClients } from "../interface";

const TableRow = ({ currency, report }) => {
  const { id, name, unpaidAmount, paidAmount, totalAmount }: RevenueByClients =
    report;

  return (
    <tr className="flex flex-row items-center" key={id}>
      <td className="w-3/5 whitespace-nowrap py-4 pr-6 text-left">
        <p className="whitespace-normal text-base font-normal text-miru-dark-purple-1000">
          {name}
        </p>
      </td>
      <td className="w-2/5 whitespace-pre-wrap px-6 py-4 text-left text-base font-normal text-miru-dark-purple-1000">
        {currencyFormat({ baseCurrency: currency, amount: unpaidAmount })}
      </td>
      <td className="w-1/5 whitespace-nowrap px-6 py-4 text-left">
        <p className="text-base	 font-normal text-miru-dark-purple-1000">
          {currencyFormat({ baseCurrency: currency, amount: paidAmount })}
        </p>
      </td>
      <td className="w-1/5 whitespace-nowrap py-4 pl-6 text-right text-xl font-bold text-miru-dark-purple-1000">
        {currencyFormat({ baseCurrency: currency, amount: totalAmount })}
      </td>
    </tr>
  );
};

export default TableRow;
