import React from "react";

import { useNavigate } from "react-router-dom";

const SearchDataRow = ({ item }) => {
  const navigate = useNavigate();

  const handleClick = item => {
    navigate(`/clients/${item.value}`);
  };

  return (
    <div
      className="group flex cursor-pointer items-center py-2 last:border-b-0 hover:bg-miru-gray-100"
      onClick={() => handleClick(item)}
    >
      <p className="w-5/12 whitespace-nowrap pl-3 pr-6 text-base font-normal tracking-wider text-miru-dark-purple-1000">
        {item.label}
      </p>
    </div>
  );
};

export default SearchDataRow;
