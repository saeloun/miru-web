import React from "react";

import dayjs from "dayjs";
import { currencyFormat, minToHHMM, lineTotalCalc } from "helpers";

const LineItem = ({ currency, item, dateFormat }) => {
  const date = dayjs(item.date).format(dateFormat);

  return (
    <>
      <tr>
        <td className="px-1 pt-5 pb-2 text-left text-base font-medium text-miru-dark-purple-1000 ">
          {item.name}
          {item.first_name} {item.last_name}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-miru-dark-purple-1000 ">
          {date}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-miru-dark-purple-1000 ">
          {currencyFormat(currency, item.rate)}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-miru-dark-purple-1000 ">
          {minToHHMM(item.quantity)}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-miru-dark-purple-1000 ">
          {currencyFormat(currency, lineTotalCalc(item.quantity, item.rate))}
        </td>
      </tr>
      <tr>
        <td
          className="border-b-2 border-miru-gray-200 px-1 pb-3 text-left text-sm font-medium text-miru-dark-purple-400"
          colSpan={2}
        >
          {item.description}
        </td>
        <td className="border-b-2 border-miru-gray-200" colSpan={3} />
      </tr>
    </>
  );
};

export default LineItem;
