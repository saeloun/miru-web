import React from "react";

import CustomYearPicker from "common/CustomYearPicker";

const Header = ({
  editAction,
  showYearPicker = false,
  currentYear,
  setCurrentYear,
}: Iprops) => (
  <div className="flex h-16 justify-between bg-miru-han-purple-1000 p-4 pl-10  text-white">
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
          className="mx-1 w-20 cursor-pointer rounded-md border bg-miru-han-purple-1000 px-3 text-white"
          onClick={editAction}
        >
          Edit
        </button>
      </div>
    </div>
  </div>
);

interface Iprops {
  editAction?: () => any;
  showYearPicker?: boolean;
  currentYear: any;
  setCurrentYear: () => any;
}

export default Header;
