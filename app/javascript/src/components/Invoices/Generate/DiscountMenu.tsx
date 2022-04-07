import React from "react";
import { PencilSimple, DotsThreeVertical, Trash } from "phosphor-react";

const Discountmenu = ({ setShowDiscount,setShowDiscountMenu,setAddDiscount,setDiscount }) => (
  <div className="bg-white rounded-lg w-28 mt-16 py-2 absolute">
    <ul className="list-none">
      <li
        className="flex py-2.5 px-4 cursor-pointer bg-white hover:bg-miru-gray-100 rounded"
        onClick={() => {
          setShowDiscountMenu(false);
          setShowDiscount(false);
          setAddDiscount(true);
        }}
      >
        <PencilSimple size={18} color="#5B34EA" />
        <p className="pl-2 font-medium text-sm text-miru-han-purple-1000">Edit</p>
      </li>
      <li
        className="flex py-2.5 px-4 cursor-pointer bg-white hover:bg-miru-gray-100 rounded"
        onClick={() => {
          setShowDiscountMenu(false);
          setDiscount(null);
          setShowDiscount(false);
          setAddDiscount(false);
        }}
      >
        <Trash size={18} color="#E04646" />
        <p className="pl-2 font-medium text-sm text-miru-red-400">Remove</p>
      </li>
    </ul>
  </div>
);

export default Discountmenu;
