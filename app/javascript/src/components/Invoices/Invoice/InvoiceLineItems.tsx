import React from "react";

import LineItem from "./LineItem";

const InvoiceLineItems = ({ currency, items, showHeader }) => {
  const getHeader = () => (
    <thead className="my-2 mb-10">
      <tr>
        <th className="text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 sm:w-1/2">
          NAME
        </th>
        <th className=" px-3 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 sm:w-1/5">
          DATE
        </th>
        <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
          RATE
        </th>
        <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
          QTY
        </th>
        <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
          LINE TOTAL
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="px-10 py-5">
      <table className="w-full table-fixed">
        {showHeader ? getHeader() : null}
        <tbody className="w-full">
          <tr className="h-4 md:h-7" />
          {items.length > 0 &&
            items.map(
              item =>
                !item._destroy && (
                  <LineItem currency={currency} item={item} key={item.id} />
                )
            )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceLineItems;
