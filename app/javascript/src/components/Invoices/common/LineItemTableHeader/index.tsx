import React from "react";

const LineItemTableHeader = () => (
  <thead className="my-2 border-b border-miru-gray-400 lg:border-0">
    <tr>
      <th className="w-4/12 pt-2 pb-4 text-left text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:w-1/2 lg:py-0 lg:font-normal">
        <dt className="hidden lg:inline">NAME</dt>
        <dt className="lg:hidden">
          NAME/
          <br /> DATE
        </dt>
      </th>
      <th className="hidden px-3 pt-2 pb-4 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:flex lg:w-1/5 lg:py-0 lg:font-normal">
        DATE
      </th>
      <th className="w-2/12 pt-2 pb-4 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:w-auto lg:py-0 lg:font-normal">
        RATE
      </th>
      <th className="w-3/12 pt-2 pb-4 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:w-auto lg:py-0 lg:font-normal">
        QTY
      </th>
      <th className="w-3/12 pt-2 pb-4 text-right text-xs font-medium tracking-widest text-miru-dark-purple-600 lg:w-auto lg:py-0 lg:font-normal">
        <dt className="hidden lg:inline"> LINE TOTAL</dt>
        <dt className="lg:hidden">
          LINE
          <br /> TOTAL
        </dt>
      </th>
      <th className="w-0 pt-2 pb-4 lg:w-10 lg:py-0" />
    </tr>
  </thead>
);

export default LineItemTableHeader;
