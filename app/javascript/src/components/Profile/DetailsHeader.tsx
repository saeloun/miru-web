import React from "react";

const DetailsHeader = ({
  title,
  subTitle,
  showButtons = false,
  editAction,
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
          className="mx-1 w-20 cursor-pointer rounded-md border bg-miru-han-purple-1000 px-3 text-white"
          disabled={isDisableUpdateBtn}
          onClick={editAction}
        >
          Edit
        </button>
      </div>
    </div>
  </div>
);

interface Iprops {
  title: string;
  subTitle: string;
  showButtons?: boolean;
  editAction?: () => any;
  isDisableUpdateBtn?: boolean;
}

export default DetailsHeader;
