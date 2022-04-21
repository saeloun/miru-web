import React from "react";

const LineItem = ({ item }) => (
  <tr>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.name}
      {item.first_name} {item.last_name}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.date}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
      {item.description}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.rate}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {item.quantity/60}
    </td>
    <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
      {(item.quantity/60) * item.rate}
    </td>
  </tr>
);

export default LineItem;
