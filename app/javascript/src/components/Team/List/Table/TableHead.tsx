import React from "react";

const TableHead = () => (
  <thead className="grid border-miru-gray-200">
    <tr className="grid grid-cols-4 gap-4 lg:grid-cols-12">
      <th className="col-span-2 py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-4 lg:py-5">
        USER
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:table-cell lg:py-5">
        SALARY
      </th>
      <th className="col-span-2 py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:py-5">
        ROLE
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:table-cell lg:py-5">
        CLIENT
      </th>
      <th className="col-span-2 hidden py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:table-cell lg:py-5">
        TYPE
      </th>
    </tr>
  </thead>
);

export default TableHead;
