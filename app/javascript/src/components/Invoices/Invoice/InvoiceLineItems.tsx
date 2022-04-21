import React from "react";
import LineItem from "./LineItem";

const InvoiceLineItems = ({ items }) => (
  <div className="px-10 py-5">
    <table className="w-full table-fixed">
      <thead className="my-2">
        <tr>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
            NAME
          </th>
          <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
            DATE
          </th>
          <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
            DESCRIPTION
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

      <tbody className="w-full">
        {items.length > 0
          && items.map(item => (
            <LineItem
              key={item.id}
              item={item}
            />
          ))}
      </tbody>
    </table>
  </div>
);

export default InvoiceLineItems;
