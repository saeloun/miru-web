import React from "react";

const Header = ({
  title,
  subTitle,
  showButtons = false,
  cancelAction,
  saveAction,
  isDisableUpdateBtn = false,
}: Iprops) => (
  <div className="flex h-16 justify-between bg-miru-han-purple-1000 p-4 pl-10  text-white">
    <span className="text-2xl font-bold">{title}</span>
    <span className="pt-2 text-sm font-normal">{subTitle}</span>
    <div
      className={`mt-1 text-center ${showButtons ? "visible" : "invisible"}`}
    >
      <div>
        <button
          className="mx-1 rounded-md border px-3 "
          disabled={!isDisableUpdateBtn}
          onClick={cancelAction}
        >
          CANCEL
        </button>
        <button
          data-cy="update-profile"
          disabled={!isDisableUpdateBtn}
          className={`mx-1 rounded-md border px-3 ${
            !isDisableUpdateBtn ? "cursor-auto bg-miru-gray-1000" : "bg-white"
          } text-miru-han-purple-1000`}
          onClick={saveAction}
        >
          UPDATE
        </button>
      </div>
    </div>
  </div>
);

interface Iprops {
  title: string;
  subTitle: string;
  showButtons?: boolean;
  cancelAction?: () => any;
  saveAction?: () => any;
  isDisableUpdateBtn?: boolean;
}

export default Header;
