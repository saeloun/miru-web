import React, { useState } from "react";

import dayjs from "dayjs";
import { currencyFormat, minToHHMM, lineTotalCalc } from "helpers";
import { DotsThreeVerticalIcon, EditIcon, DeleteIcon } from "miruIcons";

const NewLineItemStatic = ({ currency, item, setIsEdit, handleDelete }) => {
  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const hoursLogged = minToHHMM(item.quantity);
  const date = dayjs(item.date).format("DD.MM.YYYY");
  const totalRate = lineTotalCalc(item.quantity, item.rate);
  const name = item.name || `${item.first_name} ${item.last_name}`;

  return (
    <tr
      className="invoice-items-row"
      onMouseEnter={() => {
        setIsSideMenuVisible(true);
      }}
      onMouseLeave={() => {
        setIsSideMenuVisible(false);
        setShowEditMenu(false);
      }}
      onMouseOver={() => {
        setIsSideMenuVisible(true);
      }}
    >
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-left text-base font-normal text-miru-dark-purple-1000 ">
        {name}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-left text-base font-normal text-miru-dark-purple-1000 ">
        {date}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-left text-base font-normal text-miru-dark-purple-1000 ">
        {item.description}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
        {currencyFormat({ baseCurrency: currency, amount: item.rate })}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
        {hoursLogged}
      </td>
      <td className="border-b-2 border-miru-gray-200 px-1 py-3 text-right text-base font-normal text-miru-dark-purple-1000 ">
        {currencyFormat({ baseCurrency: currency, amount: totalRate })}
      </td>
      <td className="w-10">
        {isSideMenuVisible && (
          <div className="relative">
            <button
              className="m-0.5 flex h-9 w-9 items-center justify-center rounded bg-miru-gray-1000"
              onClick={() => {
                setShowEditMenu(true);
              }}
            >
              <DotsThreeVerticalIcon color="#000000" size={16} weight="bold" />
            </button>
            {showEditMenu && (
              <ul className="absolute right-0 top-10 w-30 rounded bg-white shadow-c1">
                <li>
                  <button
                    className="flex w-full items-center px-2.5 py-4 text-left hover:bg-miru-gray-100"
                    onClick={() => {
                      setIsEdit(true);
                    }}
                  >
                    <EditIcon color="#5b34ea" size={16} weight="bold" />
                    <span className="ml-2 text-miru-han-purple-1000">Edit</span>
                  </button>
                </li>
                <li>
                  <button
                    className="flex w-full items-center px-2.5 py-4 text-left hover:bg-miru-gray-100"
                    onClick={() => {
                      handleDelete(item);
                    }}
                  >
                    <DeleteIcon color="#E04646" size={16} weight="bold" />
                    <span className="ml-2 text-miru-red-400">Delete</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default NewLineItemStatic;
