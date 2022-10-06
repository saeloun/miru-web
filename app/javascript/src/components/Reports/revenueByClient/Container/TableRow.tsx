import React from "react";

import { currencyFormat } from "helpers";

import { RevenueByClients } from "../interface";

const TableRow = ({
  currency,
  report
}) => {
  const { id, name, unpaidAmount, paidAmount, totalAmount }: RevenueByClients = report;
  return (
    <tr key={id} className="flex flex-row items-center">
      <td className="w-3/5 pr-6 py-4 text-left whitespace-nowrap">
        <p className="font-normal whitespace-normal text-base text-miru-dark-purple-1000">
          {name}
        </p>
      </td>
      <td className="w-2/5 px-6 py-4 text-left text-base font-normal text-miru-dark-purple-1000 whitespace-pre-wrap">
        {currencyFormat({ baseCurrency: currency, amount: unpaidAmount })}
      </td>
      <td className="w-1/5 px-6 py-4 text-left whitespace-nowrap">
        <p className="font-normal	 text-base text-miru-dark-purple-1000">
          {currencyFormat({ baseCurrency: currency, amount: paidAmount })}
        </p>
      </td>
      <td className="w-1/5 pl-6 py-4 text-xl text-right whitespace-nowrap font-bold text-miru-dark-purple-1000">
        {currencyFormat({ baseCurrency: currency, amount: totalAmount })}
      </td>
    </tr>
  );
};

export default TableRow;
