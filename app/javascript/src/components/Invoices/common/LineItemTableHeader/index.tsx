import React from "react";

const LineItemTableHeader = () => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Name
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Date
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Rate
      </th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Qty
      </th>
      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
        Line Total
      </th>
      <th className="px-4 py-3 w-10" />
    </tr>
  </thead>
);

export default LineItemTableHeader;
