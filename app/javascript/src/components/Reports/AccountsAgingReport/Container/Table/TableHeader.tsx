import React from "react";

const TableHeader = ({ sortClientList }) => (
  <thead>
    <tr className="flex flex-row items-center py-5">
      <th
        className="flex w-2/12 cursor-pointer pr-8 text-left text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
        onClick={sortClientList}
      >
        CLIENT
      </th>
      <th
        className="w-2/12 pr-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        0 - 30 <br />
        DAYS
      </th>
      <th
        className="w-2/12 pr-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        31 - 60 <br />
        DAYS
      </th>
      <th
        className="w-2/12 pr-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        61 - 90 <br />
        DAYS
      </th>
      <th
        className="w-2/12 pr-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        90+ <br />
        dAYS
      </th>
      <th
        className="w-2/12 pl-8 text-right text-xs font-normal tracking-widest text-miru-dark-purple-600"
        scope="col"
      >
        TOTAL
      </th>
    </tr>
  </thead>
);

export default TableHeader;
