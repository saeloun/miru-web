import React from "react";

import CustomYearPicker from "common/CustomYearPicker";

const Header = ({
  editAction,
  showYearPicker = false,
  currentYear,
  setCurrentYear,
}: Iprops) => (
  <div className="flex h-16 items-center justify-between rounded-xl border border-border bg-card px-4 text-foreground shadow-sm md:px-6">
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
          className="mx-1 w-20 cursor-pointer rounded-md bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
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
