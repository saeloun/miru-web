import React from "react";

import { currencyFormat } from "helpers";

const TableTotal = ({ currency, clientList }) => {
  const report = clientList.reduce(
    (acc, client) => {
      acc.zero_to_thirty_days += parseFloat(
        client.amount_overdue.zero_to_thirty_days
      );

      acc.thirty_one_to_sixty_days += parseFloat(
        client.amount_overdue.thirty_one_to_sixty_days
      );

      acc.sixty_one_to_ninety_days += parseFloat(
        client.amount_overdue.sixty_one_to_ninety_days
      );

      acc.ninety_plus_days += parseFloat(
        client.amount_overdue.ninety_plus_days
      );
      acc.total += parseFloat(client.amount_overdue.total);

      return acc;
    },
    {
      zero_to_thirty_days: 0.0,
      thirty_one_to_sixty_days: 0.0,
      sixty_one_to_ninety_days: 0.0,
      ninety_plus_days: 0.0,
      total: 0.0,
    }
  );

  return (
    <tr className="flex flex-row items-center py-4">
      <td className="flex w-2/12 items-center whitespace-nowrap pr-8 text-left">
        <p className="whitespace-normal text-base font-bold text-miru-dark-purple-1000">
          Total
        </p>
      </td>
      <td className="w-2/12 whitespace-pre-wrap px-8 text-right text-base font-normal text-miru-dark-purple-1000">
        {currencyFormat(currency, report.zero_to_thirty_days)}
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, report.thirty_one_to_sixty_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, report.sixty_one_to_ninety_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	 font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, report.ninety_plus_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap pl-8 text-right text-xl font-bold text-miru-dark-purple-1000">
        {currencyFormat(currency, report.total)}
      </td>
    </tr>
  );
};

export default TableTotal;
