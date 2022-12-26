import React from "react";

import { EditIcon, DeleteIcon } from "miruIcons";

const DiscountMenu = ({
  setShowDiscount,
  setShowDiscountMenu,
  setAddDiscount,
  setDiscount,
}) => (
  <div className="absolute mt-16 w-28 rounded-lg bg-white py-2">
    <ul className="list-none">
      <li
        className="flex cursor-pointer rounded bg-white py-2.5 px-4 hover:bg-miru-gray-100"
        onClick={() => {
          setShowDiscountMenu(false);
          setShowDiscount(false);
          setAddDiscount(true);
        }}
      >
        <EditIcon color="#5B34EA" size={18} />
        <span className="pl-2 text-sm font-medium text-miru-han-purple-1000">
          Edit
        </span>
      </li>
      <li
        className="flex cursor-pointer rounded bg-white py-2.5 px-4 hover:bg-miru-gray-100"
        onClick={() => {
          setShowDiscountMenu(false);
          setDiscount(null);
          setShowDiscount(false);
          setAddDiscount(false);
        }}
      >
        <DeleteIcon color="#E04646" size={18} />
        <span className="pl-2 text-sm font-medium text-miru-red-400">
          Remove
        </span>
      </li>
    </ul>
  </div>
);

export default DiscountMenu;
