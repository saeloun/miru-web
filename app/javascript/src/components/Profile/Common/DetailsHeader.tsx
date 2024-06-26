import React from "react";

import { getYear } from "date-fns";

import CustomYearPicker from "common/CustomYearPicker";

const DetailsHeader = ({
  title,
  subTitle,
  showButtons = false,
  editAction,
  isDisableUpdateBtn = false,
  showYearPicker = false,
  currentYear = getYear(new Date()),
  setCurrentYear,
}: Iprops) => (
  <div className="flex h-16 items-center justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white">
    <span className="text-2xl font-bold">{title}</span>
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
          className="mx-1 w-20 cursor-pointer rounded-md border bg-miru-han-purple-1000 p-2 font-bold text-white hover:bg-miru-han-purple-600"
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
  showYearPicker?: boolean;
  currentYear?: number;
  setCurrentYear?: () => any;
}

export default DetailsHeader;
