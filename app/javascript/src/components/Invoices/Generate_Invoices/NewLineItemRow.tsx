import React from "react";

const NewLineItemRow = ({ item }) => (
  <tr>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.Name}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.Date}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-center ">
      {item.Description}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.Rate}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.Qty}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.LineTotal}
    </td>
  </tr>
);

export default NewLineItemRow;
