import React from "react";

import dayjs from "dayjs";
import { currencyFormat, minToHHMM, lineTotalCalc } from "helpers";
import { i18n } from "../../../../i18n";

const LineItem = ({ currency, item, dateFormat, strikeAmount = "" }) => {
  const date = dayjs(item.date).format(dateFormat);

  return (
    <li className="rounded-lg border border-border p-4">
      <p className="break-words text-sm font-semibold text-foreground">
        {[item.name, item.first_name, item.last_name].filter(Boolean).join(" ")}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
        {item.description}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm tabular-nums">
        <div className="min-w-0 break-words">
          <dt className="text-muted-foreground">{i18n.t("date")}</dt>
          <dd className="text-foreground">{date}</dd>
        </div>
        <div className="min-w-0 break-words">
          <dt className="text-muted-foreground">{i18n.t("invoices.rate")}</dt>
          <dd className="text-foreground">
            {currencyFormat(currency, item.rate)}
          </dd>
        </div>
        <div className="min-w-0 break-words">
          <dt className="text-muted-foreground">
            {i18n.t("invoices.quantity")}
          </dt>
          <dd className="text-foreground">{minToHHMM(item.quantity)}</dd>
        </div>
        <div className="min-w-0 break-words">
          <dt className="text-muted-foreground">{i18n.t("total")}</dt>
          <dd className={`font-semibold text-foreground ${strikeAmount}`}>
            {currencyFormat(currency, lineTotalCalc(item.quantity, item.rate))}
          </dd>
        </div>
      </dl>
    </li>
  );
};

export default LineItem;
