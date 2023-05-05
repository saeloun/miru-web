import React from "react";

import { minToHHMM } from "helpers";

const MobileAmountBox = ({
  overdueAmount,
  outstandingAmount,
  totalMinutes,
}) => (
  <div className="block px-4 lg:hidden">
    <div className="bg-miru-gray-100 p-2">
      <table className="w-full">
        <thead className="text-left font-manrope text-xxs not-italic tracking-2 text-miru-dark-purple-1000">
          <tr>
            <th className="w-1/3 border-r font-medium uppercase">
              TOTAL HOURS
            </th>
            <th className="w-1/3 border-r pl-2 font-medium uppercase">
              OVERDUE
            </th>
            <th className="w-1/3 pl-2 font-medium uppercase">OUTSTANDING</th>
          </tr>
        </thead>
        <tbody className="text-left font-manrope text-2xl font-bold not-italic">
          <tr>
            <td className="border-r">{minToHHMM(totalMinutes)}</td>
            <td className="border-r pl-2">{overdueAmount}</td>
            <td className="pl-2">{outstandingAmount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default MobileAmountBox;
