import * as React from "react";

const InvoiceTotal = () => (
  <>
    <div className="px-10 pt-3 pb-10 mb-5 w-full flex justify-end">
      <table className=" w-1/3">
        <tr>
          <th className="font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Sub total
          </th>
          <th className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              $90.00
          </th>
        </tr>
        <tr className="pb-5 border-b-2 miru-gray-400 ">
          <th className="pt-2 pr-10 pb-3 font-bold text-xs text-miru-han-purple-1000 text-right tracking-widest">
              ADD DISCOUNT
          </th>
          <th></th>
        </tr>

        <tr>
          <td className=" pt-4 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Tax
          </td>
          <td className=" pt-4 font-bold text-base text-miru-dark-purple-1000 text-right ">
              $90.00
          </td>
        </tr>
        <tr>
          <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Total
          </td>
          <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $0.00
          </td>
        </tr>
        <tr>
          <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Paid
          </td>
          <td className="font-bold text-base text-miru-dark-purple-1000 text-right ">
              $90.00
          </td>
        </tr>
        <tr>
          <td className="pt-1 font-normal text-base text-miru-dark-purple-1000 text-right pr-10">
              Amount Due
          </td>
          <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $0.00
          </td>
        </tr>
        <tr>
          <td className="pt-2 font-bold text-xs text-miru-han-purple-1000 text-right tracking-widest pr-10">
              REQUEST DEPOSIT
          </td>
          <td></td>
        </tr>
      </table>
    </div>
  </>
);

export default InvoiceTotal;
