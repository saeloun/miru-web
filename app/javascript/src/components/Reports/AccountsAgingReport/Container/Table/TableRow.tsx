import React from "react";

import { currencyFormat } from "helpers";
import { Avatar } from "StyledComponents";

const TableRow = ({ currency, report }) => {
  const { id, name, amount_overdue } = report;

  return (
    <tr className="flex flex-row items-center py-4" key={id}>
      <td className="flex w-2/12 items-center whitespace-nowrap pr-8 text-left">
        <Avatar classNameImg="mr-6" />
        <p className="whitespace-normal text-base font-normal text-miru-dark-purple-1000">
          {name}
        </p>
      </td>
      <td className="w-2/12 whitespace-pre-wrap px-8 text-right text-base font-normal text-miru-dark-purple-1000">
        {currencyFormat(currency, amount_overdue.zero_to_thirty_days)}
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, amount_overdue.thirty_one_to_sixty_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, amount_overdue.sixty_one_to_ninety_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap px-8 text-right">
        <p className="text-base	 font-normal text-miru-dark-purple-1000">
          {currencyFormat(currency, amount_overdue.ninety_plus_days)}
        </p>
      </td>
      <td className="w-2/12 whitespace-nowrap pl-8 text-right text-xl font-bold text-miru-dark-purple-1000">
        {currencyFormat(currency, amount_overdue.total)}
      </td>
    </tr>
  );
};

export default TableRow;
