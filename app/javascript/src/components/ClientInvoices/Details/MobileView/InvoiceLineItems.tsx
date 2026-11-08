import React from "react";

import LineItem from "./LineItem";

const InvoiceLineItems = ({
  currency,
  items,
  dateFormat,
  strikeAmount = "",
}) => (
  <ul className="space-y-3 py-5">
    {items.map(
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
  </ul>
);

export default InvoiceLineItems;
