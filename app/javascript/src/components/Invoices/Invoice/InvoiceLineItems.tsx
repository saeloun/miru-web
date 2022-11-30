import React from "react";

import LineItem from "./LineItem";

const InvoiceLineItems = ({ currency, items, showHeader }) => {
  const getHeader = () => (
    <thead className="my-2 mb-10">
      <tr>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest sm:w-1/2">
          NAME
        </th>
        <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest sm:w-1/5">
          DATE
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          RATE
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          QTY
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
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
          <tr className="h-4 md:h-7"></tr>
          {items.length > 0
            && items.map(item => (
              item._destroy ? (
                <></>
              ) : (
                <LineItem
                  currency={currency}
                  key={item.id}
                  item={item}
                />
              )
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceLineItems;
