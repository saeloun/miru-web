import React from "react";

import CustomYearPicker from "common/CustomYearPicker";
import { getYear } from "date-fns";
import { X } from "phosphor-react";
import { useLocation } from "react-router-dom";
import { i18n } from "../../../i18n";

import { Button } from "../../ui/button";

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
      <div className="mb-6 hidden flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subTitle && (
            <p className="text-sm text-muted-foreground">{subTitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showYearPicker && (
            <CustomYearPicker
              currentYear={currentYear}
              setCurrentYear={setCurrentYear}
            />
          )}
          {showButtons && (
            <>
              <Button onClick={cancelAction} type="button" variant="outline">
                {i18n.t("cancel")}
              </Button>
              <Button
                disabled={isDisableUpdateBtn}
                onClick={saveAction}
                type="button"
              >
                {i18n.t("update")}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 text-foreground backdrop-blur md:hidden">
        <h1 className="flex-1 text-center text-base font-semibold leading-6">
          {title}
        </h1>
        <button
          className="ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
          onClick={cancelAction}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
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
