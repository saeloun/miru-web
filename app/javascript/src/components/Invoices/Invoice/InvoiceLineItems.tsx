import React from "react";

import LineItem from "./LineItem";

const InvoiceLineItems = ({
  currency,
  items,
  showHeader,
  dateFormat,
  strikeAmount = "",
}) => {
  const getHeader = () => (
    <thead className="border-b border-miru-gray-400">
      <tr>
        <th className="py-5 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 sm:w-1/2">
          NAME
        </th>
        <th className="px-3 py-5 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 sm:w-1/5">
          DATE
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600">
          RATE
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600">
          QTY
        </th>
        <th className="py-5 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600">
          LINE TOTAL
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
