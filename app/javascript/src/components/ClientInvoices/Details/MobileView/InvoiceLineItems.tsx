import React from "react";

import LineItemTableHeader from "components/Invoices/common/LineItemTableHeader";

import LineItem from "./LineItem";

const InvoiceLineItems = ({
  currency,
  items,
  showHeader,
  dateFormat,
  strikeAmount = "",
}) => (
  <div className="py-5">
    <table className="w-full table-fixed border-collapse">
      {showHeader ? <LineItemTableHeader /> : null}
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

export default InvoiceLineItems;
