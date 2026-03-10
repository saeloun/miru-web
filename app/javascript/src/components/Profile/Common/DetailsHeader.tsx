import React from "react";

import CustomYearPicker from "common/CustomYearPicker";
import { getYear } from "date-fns";
import { useLocation } from "react-router-dom";

const DetailsHeader = ({
  title,
  subTitle,
  showButtons = false,
  editAction,
  isDisableUpdateBtn = false,
  showYearPicker = false,
  currentYear = getYear(new Date()),
  setCurrentYear,
}: Iprops) => {
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith("/settings");

  if (isSettingsPage) {
    return (
      <div className="mb-6 flex items-center justify-end gap-3">
        {showYearPicker && (
          <CustomYearPicker
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
          />
        )}
        {showButtons && (
          <button
            className="cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            disabled={isDisableUpdateBtn}
            onClick={editAction}
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between bg-primary p-4 pl-10 text-white">
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
            className="mx-1 w-20 cursor-pointer rounded-md border bg-primary p-2 font-bold text-white hover:bg-primary/90"
            disabled={isDisableUpdateBtn}
            onClick={editAction}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

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
