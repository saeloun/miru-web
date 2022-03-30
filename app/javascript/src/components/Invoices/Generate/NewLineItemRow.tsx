import React from "react";

const NewLineItemRow = ({ item }) => (
  <tr>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.name}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.date}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-center ">
      {item.description}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.rate}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.qty}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.lineTotal}
    </td>
  </tr>
);

export default NewLineItemRow;
