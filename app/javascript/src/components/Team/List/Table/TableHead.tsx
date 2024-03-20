import React from "react";

const TableHead = () => (
  <thead className="border-miru-gray-200 lg:grid">
    <tr className="flex lg:grid lg:grid-cols-10 lg:gap-4">
      <th className="w-3/5 py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-4 lg:py-5">
        USER
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:table-cell lg:py-5">
        SALARY
      </th>
      <th className="w-2/5 py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-2 lg:py-5">
        ROLE
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:table-cell lg:py-5">
        TYPE
      </th>
    </tr>
  </thead>
);
export default TableHead;
