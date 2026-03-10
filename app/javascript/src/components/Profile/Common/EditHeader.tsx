import React from "react";

import CustomYearPicker from "common/CustomYearPicker";
import { getYear } from "date-fns";
import { XIcon } from "miruIcons";
import { useLocation } from "react-router-dom";

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
}: Iprops) => {
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith("/settings");

  return (
    <>
      <div
        className={
          isSettingsPage
            ? "mb-6 hidden items-center justify-end gap-3 md:flex"
            : "hidden h-16 items-center justify-between bg-primary px-10 py-4 text-white md:flex"
        }
      >
        {!isSettingsPage && (
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        )}
        {!isSettingsPage && subTitle && (
          <span className="pt-2 text-sm font-normal">{subTitle}</span>
        )}
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
              className={
                isSettingsPage
                  ? "mx-1 cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  : "mx-1 cursor-pointer rounded-md border border-white bg-primary px-3 py-2 font-bold text-white hover:bg-primary/90"
              }
              onClick={cancelAction}
            >
              Cancel
            </button>
            <button
              disabled={isDisableUpdateBtn}
              className={
                isSettingsPage
                  ? `mx-1 w-20 cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-white ${
                      isDisableUpdateBtn
                        ? "bg-muted cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90"
                    }`
                  : `mx-1 w-20 cursor-pointer rounded-md border px-3 py-2 font-bold text-primary hover:bg-primary/90 hover:text-white
              ${isDisableUpdateBtn ? "bg-secondary" : "bg-white"}`
              }
              onClick={saveAction}
            >
              Update
            </button>
          </div>
        </div>
      </div>
      <div className="flex h-12 w-full items-center justify-between bg-primary p-3 text-primary-foreground shadow-c1 md:hidden md:w-0">
        <h1 className="mx-auto w-full text-center font-sans text-base font-medium leading-5.5">
          {title}
        </h1>
        <div>
          <button
            className="outline-none border-none bg-transparent font-sans font-bold capitalize text-primary"
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
  currentYear?: number;
  setCurrentYear?: () => any;
}

export default EditHeader;
