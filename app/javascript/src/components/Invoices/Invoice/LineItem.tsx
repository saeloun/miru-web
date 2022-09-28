import React from "react";

import dayjs from "dayjs";

import { currencyFormat } from "helpers/currency";
import { minutesToHHMM } from "helpers/hhmm-parser";
import { lineTotalCalc } from "helpers/lineTotalCalc";

const LineItem = ({ currency, item }) => {
  const date = dayjs(item.date).format("DD-MM-YYYY");
  return (
    <tr>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {item.name}
        {item.first_name} {item.last_name}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {date}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {item.description}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {currencyFormat({ baseCurrency: currency, amount: item.rate })}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {minutesToHHMM(item.quantity)}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {currencyFormat({ baseCurrency: currency, amount: lineTotalCalc(item.quantity, item.rate) })}
      </td>
    </tr>
  );
};

export default LineItem;
