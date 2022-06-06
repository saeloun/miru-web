import React from "react";

const LineItemTableHeader = () => (
  <thead className="my-2">
    <tr>
      <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
          NAME
      </th>
      <th className=" px-3 text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest">
          DESCRIPTION
      </th>
      <th className="text-miru-dark-purple-600 font-normal text-xs text-left tracking-widest w-2/5">
          KIND
      </th>
      <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          NUMBER OF RESOURCE
      </th>
      <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          RESOURCE EXPERTISE LEVEL
      </th>
      <th className="text-miru-dark-purple-600 font-normal text-xs text-right tracking-widest">
          PRICE
      </th>
      <th className="w-10"></th>
    </tr>
  </thead>
);

export default LineItemTableHeader;
