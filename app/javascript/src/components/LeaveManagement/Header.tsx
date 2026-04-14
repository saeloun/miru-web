import React from "react";

import SearchTimeEntries from "common/SearchTimeEntries";
import { i18n } from "../../i18n";
import { Button } from "../ui/button";
import { CaretLeft, CaretRight } from "phosphor-react";

const Header = ({
  currentYear,
  isAdminUser,
  employeeList,
  selectedEmployeeId,
  setCurrentYear,
  setSelectedEmployeeId,
}) => (
  <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {i18n.t("leaveManagement.summaryLabel")}
      </p>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {i18n.t("navbar.myLeaves")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {i18n.t("leaveManagement.summaryDescription")}
        </p>
      </div>
    </div>
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
      <div className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-1.5 shadow-sm">
        <Button
          className="h-8 w-8 shrink-0 rounded-lg"
          onClick={() => setCurrentYear(currentYear - 1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CaretLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[5.5rem] px-1 text-center text-sm font-semibold text-foreground">
          {currentYear}
        </div>
        <Button
          className="h-8 w-8 shrink-0 rounded-lg"
          onClick={() => setCurrentYear(currentYear + 1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <CaretRight className="h-4 w-4" />
        </Button>
      </div>
      {isAdminUser && selectedEmployeeId && (
        <div className="min-w-[15rem] lg:min-w-[16rem]">
          <SearchTimeEntries
            employeeList={employeeList}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
        </div>
      )}
    </div>
  </div>
);

export default Header;
