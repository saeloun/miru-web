import React from "react";

import { getYear } from "date-fns";
import { XIcon } from "miruIcons";

import CustomYearPicker from "common/CustomYearPicker";

const EditHeader = ({
  title,
  subTitle,
  showButtons = false,
  cancelAction,
  saveAction,
  isDisableUpdateBtn = false,
  showYearPicker = false,
  currentYear = getYear(new Date()),
  setCurrentYear,
}: Iprops) => (
  <>
    <div className="hidden h-16 items-center justify-between bg-miru-han-purple-1000 px-10 py-4 text-white md:flex">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subTitle && <span className="pt-2 text-sm font-normal">{subTitle}</span>}
      {showYearPicker && (
        <CustomYearPicker
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
        />
      )}
      <div
        className={`mt-1 text-center ${showButtons ? "visible" : "invisible"}`}
      >
        <div>
          <button
            className="mx-1 cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white hover:bg-miru-han-purple-600	"
            onClick={cancelAction}
          >
            Cancel
          </button>
          <button
            disabled={isDisableUpdateBtn}
            className={`mx-1 w-20 cursor-pointer rounded-md border px-3 py-2 font-bold text-miru-han-purple-1000 hover:bg-miru-han-purple-600 hover:text-white
              ${isDisableUpdateBtn ? "bg-miru-gray-1000" : "bg-white"}`}
            onClick={saveAction}
          >
            Update
          </button>
        </div>
      </div>
    </div>
    <div className="flex h-12 w-full items-center justify-between bg-miru-han-purple-1000 p-3 text-miru-white-1000 shadow-c1 md:hidden md:w-0">
      <h1 className="mx-auto w-full text-center font-manrope text-base font-medium leading-5.5">
        {title}
      </h1>
      <div>
        <button
          className="outline-none border-none bg-transparent font-manrope font-bold capitalize text-miru-han-purple-1000"
          onClick={cancelAction}
        >
          <XIcon color="#fff" size={16} />
        </button>
      </div>
    </div>
  </>
);

interface Iprops {
  title: string;
  subTitle: string;
  showButtons?: boolean;
  cancelAction?: () => any;
  saveAction?: () => any;
  isDisableUpdateBtn?: boolean;
  showYearPicker?: boolean;
  currentYear?: number;
  setCurrentYear?: () => any;
}

export default EditHeader;
