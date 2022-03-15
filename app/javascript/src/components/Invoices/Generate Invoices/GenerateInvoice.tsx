import * as React from "react";
import InvoiceTable from "./InvoiveTable";

const GenerateInvoice = () => {
  return (
    <div className="bg-miru-gray-100">
      {/* Row 1 */}
      <div className="flex justify-between border-b-2 border-miru-gray-400 p-10">
        <div className="flex">
          {/* <img src={SaelounLogo}/> */}
          <div className="">
            <p className="font-bold text-3xl text-miru-dark-purple-1000">
              Saeloun Inc.
            </p>
            <p className="font-normal text-base text-miru-dark-purple-1000">
              +1-234-454
            </p>
          </div>
        </div>

        <div>
          <p className="font-normal text-base text-miru-dark-purple-1000 w-36">
            31R Providence Rd Westford MA, 01886
          </p>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex justify-between border-b-2 border-miru-gray-400 p-10">
        <div className="">
          <p className="font-normal text-xs text-miru-dark-purple-1000">
            Billed to
          </p>
          <p className="font-bold text-base text-miru-dark-purple-1000">
            {" "}
            Microsoft
          </p>
          <p className="font-normal text-xs text-miru-dark-purple-1000 w-52">
            One Microsoft Way Redmond,Washington 98052-6399
          </p>
        </div>
        <div className="">
          <p className="font-normal text-xs text-miru-dark-purple-1000">
            Date of Issue
          </p>
          <p className="font-normal text-base text-miru-dark-purple-1000">
            23.12.2021
          </p>
          <p className="font-normal text-xs text-miru-dark-purple-1000 mt-2">
            Due Date
          </p>
          <p className="font-normal text-base text-miru-dark-purple-1000">
            23.1.2022
          </p>
        </div>
        <div className="">
          <p className="font-normal text-xs text-miru-dark-purple-1000">
            Invoice Number
          </p>
          <p className="font-normal text-base text-miru-dark-purple-1000">
            6335 7871
          </p>
          <p className="font-normal text-xs text-miru-dark-purple-1000 mt-2">
            Reference
          </p>
        </div>
        <div className="">
          <p className="font-normal text-xs text-miru-dark-purple-1000">
            Amount
          </p>
          <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-2">
            $90.00
          </p>
        </div>
      </div>

      {/* Row 3 */}
      <div className="flex flex-col px-10 py-3">
        <InvoiceTable />
        <div className=" w-full flex justify-end">
          <table className=" w-1/3">
            <tr>
              <th className="font-normal text-base text-miru-dark-purple-1000 text-right">
                Sub total
              </th>
              <th className="font-bold text-base text-miru-dark-purple-1000 text-right">
                $90.00
              </th>
            </tr>
            <tr>
              <th className="font-bold text-xs text-miru-han-purple-1000 text-right">
                ADD DISCOUNT
              </th>
              <th className=""></th>
            </tr>
          </table>
        </div>
      </div>

      {/* Row 4 */}
      <div className="px-10 pb-5 flex justify-end">
        <table className="border-t-2 miru-gray-400 w-1/3 pt-2">
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right ">
              Tax
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $90.00
            </td>
          </tr>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right">
              Total
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $0.00
            </td>
          </tr>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right">
              Amount Paid
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $90.00
            </td>
          </tr>
          <tr>
            <td className="font-normal text-base text-miru-dark-purple-1000 text-right">
              Amount Due
            </td>
            <td className="font-bold text-base text-miru-dark-purple-1000 text-right">
              $0.00
            </td>
          </tr>
          <tr>
            <td className="font-bold text-xs text-miru-han-purple-1000 text-right">
              REQUEST DEPOSIT
            </td>
            <td></td>
          </tr>
        </table>
      </div>
    </div>
  );
};

export default GenerateInvoice;
