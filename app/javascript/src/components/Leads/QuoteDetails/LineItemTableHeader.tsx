import React from "react";

const LineItemTableHeader = () => (
  <thead className="my-2">
    <tr>
      <th className="text-miru-dark-purple-1000 font-normal text-xs text-left tracking-widest">
          NAME
      </th>
      <th className=" px-3 text-miru-dark-purple-1000 font-normal text-xs text-left tracking-widest">
          DESCRIPTION
      </th>
      <th className="text-miru-dark-purple-1000 font-normal text-xs text-left tracking-widest">
          COMMENT
      </th>
      <th className="text-miru-dark-purple-1000 font-normal text-xs text-right tracking-widest">
          NUMBER OF RESOURCE
      </th>
      <th className="text-miru-dark-purple-1000 font-normal text-xs text-right tracking-widest">
          RESOURCE EXPERTISE LEVEL
      </th>
      <th className="text-miru-dark-purple-1000 font-normal text-xs text-right tracking-widest">
          ESTIMATED HOURS
      </th>
      <th className="w-10"></th>
    </tr>
  </thead>
);

export default LineItemTableHeader;
