import * as React from "react";

const InvoiceTable = () => {

  return (
    <table className="w-full table-fixed">
      <thead className="py-2">
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left">NAME</th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left">DATE</th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left ">DESCRIPTION</th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left">RATE</th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left">QTY</th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right">LINE TOTAL</th>

      </thead>
      <tbody className="w-full ">
        <tr className="w-full">
          <td colSpan={6} >
            <button className=" w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed">
              + NEW LINE ITEM
            </button>
          </td>
        </tr>
        <tr className="w-full">
          <td className="p-2 pl-0 w-full">
            <input type="text" className="bg-white rounded w-full " />
          </td>
          <td className="p-2 w-full">
            <input type="date" className="bg-white rounded w-full" />
          </td>
          <td className="p-2 w-full">
            <input type="text" className="bg-white rounded w-full" />
          </td>
          <td className="p-2 w-full">
            <input type="text" className="bg-white rounded w-full" />
          </td>
          <td className="p-2 w-full">
            <input type="text" className="bg-white rounded w-full" />
          </td>
          <td className="p-2 pr-0 text-right">$90</td>
        </tr>

      </tbody>
    </table>
  );
};

export default InvoiceTable;
