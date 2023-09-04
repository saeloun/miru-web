import React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Details = ({ leavesList }) => (
  <div className="mt-4 min-h-80v bg-miru-gray-100 p-4 lg:p-10">
    <div className="flex w-full flex-col">
      <div className="w-full pb-6 text-left text-xl font-semibold">Leaves</div>
      <table className="flex w-full flex-col">
        <TableHeader />
        <tbody>
          {leavesList.map((leave, index) => (
            <TableRow key={index} leave={leave} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
export default Details;
