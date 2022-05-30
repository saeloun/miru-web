import React from "react";

const Header = ({ title, subTitle, showButtons = false, cancelAction = null, saveAction = null }) => {
  return (
    <div className="h-16 pl-10 p-4 bg-miru-han-purple-1000 flex justify-between  text-white">
      <span className="font-bold text-2xl">{title}</span>
      <span className="font-normal text-sm pt-2">
        {subTitle}
      </span>
      {
        showButtons && (
          <div className="mt-1">
            <button className="border rounded-md px-3 mx-1 " onClick={cancelAction}>CANCEL</button>
            <button className="border rounded-md px-3 mx-1 bg-white text-miru-han-purple-1000" onClick={saveAction}>UPDATE</button>
          </div>
        )
      }
    </div>
  );
};

export default Header;
