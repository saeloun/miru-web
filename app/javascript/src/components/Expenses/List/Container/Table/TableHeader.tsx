import React from "react";

const TableHeader = () => (
  <thead>
    <tr>
      <th
        className="hidden w-3/12 cursor-pointer py-5 pr-8 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        CATEGORY
      </th>
      <th
        className="hidden w-2/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        DATE
      </th>
      <th
        className="hidden w-3/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        VENDOR
      </th>
      <th
        className="hidden w-2/12 py-5 pr-8 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:table-cell"
        scope="col"
      >
        TYPE
      </th>
      <th
        className="table-cell w-2/5 py-4 pr-4 text-left text-xs font-medium leading-4 tracking-widest text-miru-black-1000 lg:hidden"
        scope="col"
      >
        CATEGORY/ <br />
        Vendor
      </th>
      <th
        className="table-cell w-1/5 py-4 pr-4 text-left text-xs font-medium leading-4 tracking-widest text-miru-black-1000 lg:hidden"
        scope="col"
      >
        TYPE/ <br />
        DATE
      </th>
      <th
        className="w-1/5 pl-4 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:w-2/12 lg:pl-8"
        scope="col"
      >
        AMOUNT
      </th>
    </tr>
  </thead>
);

export default TableHeader;
