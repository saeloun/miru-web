import React, { useState } from "react";

import dayjs from "dayjs";
import { DotsThreeVertical, PencilSimple, Trash } from "phosphor-react";

import { currencyFormat } from "helpers/currency";
import { minutesToHHMM } from "helpers/hhmm-parser";
import { lineTotalCalc } from "helpers/lineTotalCalc";

const NewLineItemStatic = ({
  currency,
  item,
  setEdit,
  handleDelete
}) => {
  const [isSideMenuVisible, setSideMenuVisible] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const hoursLogged = minutesToHHMM(item.quantity);
  const date = dayjs(item.date).format("DD.MM.YYYY");
  const totalRate = lineTotalCalc(item.quantity, item.rate);
  const name = item.name || `${item.first_name} ${item.last_name}`;
  return (
    <tr className="invoice-items-row"
      onMouseLeave={() => {
        setSideMenuVisible(false);
        setShowEditMenu(false);
      }}
      onMouseOver={() => { setSideMenuVisible(true); }}
      onMouseEnter={() => { setSideMenuVisible(true); }}
    >
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {name}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {date}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-left ">
        {item.description}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {currencyFormat({ baseCurrency: currency, amount: item.rate })}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {hoursLogged}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 font-normal text-base text-miru-dark-purple-1000 text-right ">
        {currencyFormat({ baseCurrency: currency, amount: totalRate })}
      </td>
      <td className="w-10">
        {
          isSideMenuVisible && <div className="relative">
            <button onClick={() => { setShowEditMenu(true); }} className="w-9 h-9 m-0.5 bg-miru-gray-1000 rounded flex items-center justify-center">
              <DotsThreeVertical size={16} color="#000000" weight="bold" />
            </button>
            {
              showEditMenu && <ul className="absolute bg-white right-0 top-10 w-30 shadow-c1 rounded">
                <li>
                  <button onClick={() => { setEdit(true); }} className="w-full flex items-center px-2.5 text-left py-4 hover:bg-miru-gray-100">
                    <PencilSimple size={16} color="#5b34ea" weight="bold" />
                    <span className="text-miru-han-purple-1000 ml-2">Edit</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => { handleDelete(item); }} className="w-full flex items-center px-2.5 text-left py-4 hover:bg-miru-gray-100">
                    <Trash size={16} color="#E04646" weight="bold" />
                    <span className="text-miru-red-400 ml-2">Delete</span>
                  </button>
                </li>
              </ul>
            }
          </div>
        }
      </td>
    </tr>
  );
};

export default NewLineItemStatic;
