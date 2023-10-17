import React from "react";

import CustomYearPicker from "common/CustomYearPicker";

const Header = ({
  cancelAction,
  saveAction,
  showYearPicker = false,
  currentYear,
  setCurrentYear,
  isDisableUpdateBtn,
}: Iprops) => (
  <div className="h-16 w-0 justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white md:flex md:w-full">
    <span className="text-2xl font-bold">Leaves</span>
    {showYearPicker && (
      <CustomYearPicker
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
      />
    )}
    <div className="visible mt-1 text-center">
      <div>
        <button
          className="mx-1 w-20 rounded-md border px-3 "
          onClick={cancelAction}
        >
          Cancel
        </button>
        <button
          disabled={isDisableUpdateBtn}
          className={`mx-1 w-20 rounded-md border px-3 ${
            isDisableUpdateBtn ? "cursor-auto bg-miru-gray-1000" : "bg-white"
          } text-miru-han-purple-1000`}
          onClick={saveAction}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

interface Iprops {
  cancelAction?: () => any;
  saveAction?: () => any;
  isDisableUpdateBtn?: boolean;
  showYearPicker?: boolean;
  currentYear: any;
  setCurrentYear: () => any;
}

export default Header;
