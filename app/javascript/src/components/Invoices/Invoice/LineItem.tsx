import React from "react";

import dayjs from "dayjs";
import {
  currencyFormat,
  getLineItemDisplayName,
  minToHHMM,
  lineTotalCalc,
} from "helpers";

type LineItemProps = {
  currency: string;
  dateFormat: string;
  strikeAmount?: string;
  item: {
    amount?: number | string | null;
    date: string;
    description: string;
    first_name?: string | null;
    last_name?: string | null;
    lineTotal?: number | string | null;
    name?: string | null;
    quantity: number | string;
    rate: number | string;
  };
};

const LineItem = ({
  currency,
  item,
  dateFormat,
  strikeAmount = "",
}: LineItemProps) => {
  const date = dayjs(item.date).format(dateFormat);
  const displayName = getLineItemDisplayName(item);

  return (
    <>
      <tr>
        <td className="px-1 pt-5 pb-2 text-left text-base font-medium text-foreground ">
          {displayName}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-foreground ">
          {date}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-foreground ">
          {currencyFormat(currency, item.rate)}
        </td>
        <td className="px-1 pt-5 pb-2 text-right text-base font-medium text-foreground ">
          {minToHHMM(item.quantity)}
        </td>
        <td
          className={`px-1 pt-5 pb-2 text-right text-base font-medium text-foreground ${strikeAmount}`}
        >
          {currencyFormat(currency, lineTotalCalc(item.quantity, item.rate))}
        </td>
      </tr>
      <tr>
        <td
          className="border-b-2 border-border px-1 pb-3 text-left text-sm font-medium text-muted-foreground"
          colSpan={2}
        >
          {item.description}
        </td>
        <td className="border-b-2 border-border" colSpan={3} />
      </tr>
    </>
  );
};

export default LineItem;
