import React from "react";
import dayjs from "dayjs";

const LineItem = ({ item }) => {
  const date = dayjs(item.date).format("DD.MM.YYYY");
  return (
    <tr>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {item.name}
        {item.first_name} {item.last_name}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {date}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {item.description}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {item.rate}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {item.qty / 60}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {(item.qty / 60) * item.rate}
      </td>
    </tr>
  );
};

export default LineItem;
