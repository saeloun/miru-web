import React from "react";

import dayjs from "dayjs";
import { currencyFormat, lineTotalCalc, minToHHMM } from "helpers";

import { sections } from "../../utils";

const LineItemRow = ({
  currency,
  item,
  dateFormat,
  setEditItem,
  setActiveSection,
  isInvoicePreviewCall,
  strikeAmount = "",
}) => {
  const { first_name, last_name, name, date, rate, quantity, description } =
    item;

  return (
    <>
      <tr
        className="w-full cursor-pointer"
        onClick={() => {
          if (!isInvoicePreviewCall) {
            setEditItem(item);
            setActiveSection(sections.editLineItem);
          }
        }}
      >
        <td className="flex flex-col px-1 py-3 text-left text-xs font-medium text-miru-dark-purple-1000 ">
          <span className="text-sm">
            {first_name || name} {last_name}
          </span>
          <span className="text-miru-dark-purple-400">
            {dayjs(date).format(dateFormat)}
          </span>
        </td>
        <td className="w-2/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000 ">
          {currencyFormat(currency, rate)}
        </td>
        <td className="w-3/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000 ">
          {minToHHMM(quantity)}
        </td>
        <td
          className={`w-3/12 px-1 py-3 text-right text-xs font-medium text-miru-dark-purple-1000 ${strikeAmount}`}
        >
          {currencyFormat(currency, lineTotalCalc(quantity, rate))}
        </td>
      </tr>
      <tr>
        <td
          className="w-full border-b border-miru-gray-200 px-1 pb-6 text-left text-xs font-medium text-miru-dark-purple-400 last:border-0"
          colSpan={6}
        >
          {description}
        </td>
      </tr>
    </>
  );
};

export default LineItemRow;
