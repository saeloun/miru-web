import * as React from "react";

const InvoiceTable = () => {
  return (
    <table className="w-full table-fixed">
      <thead className="my-2">
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
          NAME
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
          DATE
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
          DESCRIPTION
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          RATE
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest pr-2">
          QTY
        </th>
        <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          LINE TOTAL
        </th>
      </thead>
      <tbody className="w-full ">
        <tr className="w-full ">
          <td colSpan={6} className="py-4">
            <button className=" py-1 tracking-widest w-full bg-white font-bold text-base text-center text-miru-dark-purple-200 rounded-md border-2 border-miru-dark-purple-200 border-dashed">
              + NEW LINE ITEM
            </button>
          </td>
        </tr>
        <tr className="w-full my-1">
          <td className="p-1  w-full">
            <input
              type="text"
              className=" p-1 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 "
            />
          </td>
          <td className="p-1 w-full">
            <input
              type="date"
              placeholder="Date"
              className=" p-1 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
            />
          </td>
          <td className="p-1 w-full">
            <input
              type="text"
              className=" p-1 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
            />
          </td>
          <td className=" w-full">
            <input
              type="text"
              className=" p-1 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
            />
          </td>
          <td className="p-1 w-full">
            <input
              type="text"
              className=" p-1 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000"
            />
          </td>
          <td className="text-right font-normal text-base text-miru-dark-purple-1000">
            $90
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default InvoiceTable;
