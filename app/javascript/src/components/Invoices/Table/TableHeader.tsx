import * as React from "react";

const TableHeader = () => {
  return (
    <thead>
      <tr>
        <th scope="col">
          <input type="checkbox" />
        </th>
        <th
          scope="col"
          className="px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-wider"
        >
              CLIENT/INVOICE NO.
        </th>
        <th
          scope="col"
          className="px-6 py-5 text-left font-normal text-xs text-miru-dark-purple-600 tracking-wider"
        >
              ISSUED DATE/DUE DATE
        </th>
        <th
          scope="col"
          className="px-6 py-5 text-center font-normal text-xs text-miru-dark-purple-600 tracking-wider"
        >
              AMOUNT
        </th>
        <th
          scope="col"
          className="px-6 py-5 text-center font-normal text-xs text-miru-dark-purple-600 tracking-wider"
        >
              STATUS
        </th>
        <th scope="col" className="relative px-6 py-3"></th>
        <th scope="col" className="relative px-6 py-3"></th>
      </tr>
    </thead>
  );
};

export default TableHeader;
