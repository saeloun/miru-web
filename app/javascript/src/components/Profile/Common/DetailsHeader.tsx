import React from "react";

import CustomYearPicker from "common/CustomYearPicker";
import { getYear } from "date-fns";
import { useLocation } from "react-router-dom";
import { i18n } from "../../../i18n";

import { Button } from "../../ui/button";

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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            <Button
              disabled={isDisableUpdateBtn}
              onClick={editAction}
              type="button"
              variant="outline"
            >
              {i18n.t("edit")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
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
          <Button
            disabled={isDisableUpdateBtn}
            onClick={editAction}
            type="button"
            variant="outline"
          >
            {i18n.t("edit")}
          </Button>
        )}
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
