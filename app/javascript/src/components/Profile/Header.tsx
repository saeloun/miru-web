import React from "react";

const Header = ({
  title,
  subTitle,
  showButtons = false,
  cancelAction = function () { 0; },
  saveAction = function () { 0; },
  isDisableUpdateBtn = false
}) => (
  <div className="h-16 pl-10 p-4 bg-miru-han-purple-1000 flex justify-between  text-white">
    <span className="font-bold text-2xl">{title}</span>
    <span className="font-normal text-sm pt-2">
      {subTitle}
    </span>
    {
      (
        <div className={`mt-1 text-center ${showButtons ? "visible" : "invisible"}`}>
          <div>
            <button
              className="border rounded-md px-3 mx-1 "
              onClick={cancelAction}
              disabled={!isDisableUpdateBtn}
            >
              CANCEL
            </button>
            <button
              className={
                `border rounded-md px-3 mx-1 ${!isDisableUpdateBtn ? "bg-miru-gray-1000 cursor-auto" : "bg-white"} text-miru-han-purple-1000`
              }
              onClick={saveAction}
              disabled={!isDisableUpdateBtn}
            >
              UPDATE
            </button>
          </div>
        </div>
      )
    }
  </div>
);

export default Header;
