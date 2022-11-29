import React from "react";

const LineItemTableHeader = () => (
  <thead className="my-2">
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
      <th className="w-10"></th>
    </tr>
  </thead>
);

export default LineItemTableHeader;
