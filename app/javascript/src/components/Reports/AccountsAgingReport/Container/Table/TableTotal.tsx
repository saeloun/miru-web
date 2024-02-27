import React from "react";

import { currencyFormat } from "helpers";

const TableTotal = ({ currency, report }) => (
  <tr className="flex flex-row items-center py-4 ">
    <td className="flex w-2/12 items-center whitespace-nowrap pr-8 text-left">
      <p className="whitespace-normal pl-14 text-base font-bold text-miru-dark-purple-1000">
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
export default TableTotal;
