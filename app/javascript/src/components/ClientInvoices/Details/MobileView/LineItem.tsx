import React from "react";

import dayjs from "dayjs";
import { currencyFormat, minToHHMM, lineTotalCalc } from "helpers";

const LineItem = ({ currency, item, dateFormat, strikeAmount = "" }) => {
  const date = dayjs(item.date).format(dateFormat);

  return (
    <>
      <tr className="w-full">
        <td className="flex flex-col px-1 py-3 text-left text-xs font-medium text-miru-dark-purple-1000 ">
          <span className="text-sm">
            {item.name}
            {item.first_name} {item.last_name}
          </span>
          <span className="text-miru-dark-purple-400">{date}</span>
        </td>
        <td className="w-2/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000">
          {currencyFormat(currency, item.rate)}
        </td>
        <td className="w-3/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000">
          {minToHHMM(item.quantity)}
        </td>
        <td
          className={`w-3/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000 ${strikeAmount}`}
        >
          {currencyFormat(currency, lineTotalCalc(item.quantity, item.rate))}
        </td>
      </tr>
      <tr>
        <td
          className="w-full border-b border-miru-gray-200 px-1 pb-6 text-left text-xs font-medium text-miru-dark-purple-400 last:border-0"
          colSpan={6}
        >
          {item.description}
        </td>
      </tr>
    </>
  );
};

export default LineItem;
