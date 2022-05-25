import React from "react";

const Header = ({ title, subTitle, showButtons = false, cancelAction = function(){0}, saveAction = function(){0}, isDisableUpdateBtn = false }) => {
  return (
    <div className="h-16 pl-10 py-4 bg-miru-han-purple-1000 flex text-white">
      <span className="font-bold text-2xl">{title}</span>
      <span className="font-normal text-sm pt-2 ml-4">
        {subTitle}
      </span>
      {
        showButtons && (
          <div className="place-items-center">
            <button className="border rounded-md px-3 mx-1" onClick={cancelAction}>CANCEL</button>
            <button className="border rounded-md px-3 mx-1 bg-white text-miru-han-purple-1000" onClick={saveAction} disabled={isDisableUpdateBtn}>UPDATE</button>
          </div>
        )
      }
    </div>
  );
};

export default Header;
