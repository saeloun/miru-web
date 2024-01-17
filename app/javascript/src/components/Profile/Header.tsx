import React, { useState } from "react";

import { getYear } from "date-fns";
import { XIcon } from "miruIcons";

import CustomYearPicker from "common/CustomYearPicker";

const Header = ({
  title,
  subTitle,
  showButtons = false,
  cancelAction,
  saveAction,
  isDisableUpdateBtn = false,
  showYearPicker = false,
}: Iprops) => {
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));

  return (
    <>
      <div className="hidden h-16 w-0 justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white md:flex md:w-full">
        <span className="text-2xl font-bold">{title}</span>
        <span className="pt-2 text-sm font-normal">{subTitle}</span>
        {showYearPicker && (
          <CustomYearPicker
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
          />
        )}
        <div
          className={`mt-1 text-center ${
            showButtons ? "visible" : "invisible"
          }`}
        >
          <div>
            <button
              className="mx-1 w-20 rounded-md border px-3 "
              onClick={cancelAction}
            >
              Cancel
            </button>
            <button
              disabled={!isDisableUpdateBtn}
              className={`mx-1 w-20 rounded-md border px-3 ${
                !isDisableUpdateBtn
                  ? "cursor-auto bg-miru-gray-1000"
                  : "bg-white"
              } text-miru-han-purple-1000`}
              onClick={saveAction}
            >
              Save
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
};

interface Iprops {
  title: string;
  subTitle: string;
  showButtons?: boolean;
  cancelAction?: () => any;
  saveAction?: () => any;
  isDisableUpdateBtn?: boolean;
  showYearPicker?: boolean;
}

export default Header;
