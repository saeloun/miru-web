import React from "react";

import LineItem from "./LineItem";
import { i18n } from "../../../i18n";

const InvoiceLineItems = ({
  currency,
  items,
  showHeader,
  dateFormat,
  strikeAmount = "",
}) => {
  const getHeader = () => (
    <thead className="border-b border-border">
      <tr>
        <th className="py-5 text-left text-xs font-medium tracking-widest text-muted-foreground sm:w-1/2">
          {i18n.t("invoices.nameHeader")}
        </th>
        <th className="px-3 py-5 text-right text-xs font-medium tracking-widest text-muted-foreground sm:w-1/5">
          {i18n.t("invoices.dateHeader")}
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-muted-foreground">
          {i18n.t("invoices.rate")}
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-muted-foreground">
          {i18n.t("invoices.quantity")}
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-muted-foreground">
          {i18n.t("total").toUpperCase()}
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="px-10 py-5">
      <table className="w-full table-fixed border-collapse">
        {showHeader ? getHeader() : null}
        <tbody className="w-full">
          {items.length > 0 &&
            items.map(
              item =>
                !item._destroy && (
                  <LineItem
                    currency={currency}
                    dateFormat={dateFormat}
                    item={item}
                    key={item.id}
                    strikeAmount={strikeAmount}
                  />
                )
            )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceLineItems;
