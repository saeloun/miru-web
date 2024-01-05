import React from "react";

const NavArrowBtn = ({ id, icon, handleClick }) => (
  <button
    className="flex flex-col items-center justify-center"
    id={id}
    onClick={handleClick}
  >
    {icon}
  </button>
);

export default NavArrowBtn;
