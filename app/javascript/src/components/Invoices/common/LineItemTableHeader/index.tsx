import React from "react";

const LineItemTableHeader = () => (
  <thead className="my-2">
    <tr>
      <th className="text-left text-xs font-normal tracking-widest text-miru-dark-purple-600 sm:w-1/2">
        NAME
      </th>
      <th className=" px-3 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600 sm:w-1/5">
        DATE
      </th>
      <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
        RATE
      </th>
      <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
        QTY
      </th>
      <th className="text-right text-xs font-normal tracking-widest text-miru-dark-purple-600">
        LINE TOTAL
      </th>
      <th className="w-10" />
    </tr>
  </thead>
);

export default LineItemTableHeader;
