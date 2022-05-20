import React from "react";

const Header = ({title, subTitle}) => {
  return (
    <div className="h-16 pl-20 py-4 bg-miru-han-purple-1000 flex text-white">
      <span className="font-bold text-2xl">{title}</span>
      <span className="font-normal text-sm pt-2 ml-4">
        {subTitle}
      </span>
    </div>
  );
};

export default Header;
