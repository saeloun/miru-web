import React from "react";

import dayjs from "dayjs";
import { currencyFormat, minToHHMM, lineTotalCalc } from "helpers";

const LineItem = ({ currency, item }) => {
  const date = dayjs(item.date).format("DD-MM-YYYY");
  return (
    <>
      <tr>
        <td className="px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
          {item.name}
          {item.first_name} {item.last_name}
        </td>
        <td className="px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
          {date}
        </td>
        <td className="px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
          {currencyFormat({ baseCurrency: currency, amount: item.rate })}
        </td>
        <td className="px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
          {minToHHMM(item.quantity)}
        </td>
        <td className="px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
          {currencyFormat({ baseCurrency: currency, amount: lineTotalCalc(item.quantity, item.rate) })}
        </td>
      </tr>
      <tr>
        <td className="border-b-2 border-miru-gray-200 px-1 pb-4 font-normal text-xs text-miru-dark-purple-400 text-left" colSpan={2}>
          {item.description}
        </td>
        <td className="border-b-2 border-miru-gray-200" colSpan={3}></td>
      </tr>
    </>
  );
};

export default LineItem;
