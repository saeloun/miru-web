import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Table = ({ leaveDetails }) => (
  <table className="mt-4 min-w-full divide-y divide-gray-200">
    <TableHeader />
    <tbody className="flex flex-col divide-y divide-gray-200 overflow-scroll bg-white">
      {leaveDetails.length ? (
        leaveDetails.map((leave, index) => (
          <TableRow key={index} leave={leave} />
        ))
      ) : (
        <tr className="tracking-wide flex items-center justify-center text-base font-medium text-miru-han-purple-1000 md:h-50">
          <td>No Data Found</td>
        </tr>
      )}
    </tbody>
  </table>
);

export default Table;
