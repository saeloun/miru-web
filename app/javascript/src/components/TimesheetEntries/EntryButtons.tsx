import React from "react";

import { VacationIconSVG } from "miruIcons";
import { Button } from "StyledComponents";

import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";

const EntryButtons = () => {
  const {
    setEditEntryId,
    setNewEntryView,
    setEditTimeoffEntryId,
    setNewTimeoffEntryView,
  } = useTimesheetEntries();

  const { isDesktop } = useUserContext();

  const DesktopButtons = () => (
    <div className="flex items-center justify-between">
      <Button
        className="w-full py-4 text-lg tracking-wider"
        size="medium"
        style="secondary"
        onClick={() => {
          setNewEntryView(true);
          setEditEntryId(0);
          setEditTimeoffEntryId(0);
        }}
      >
        + NEW ENTRY
      </Button>
      <Button
        className="ml-2 flex w-full items-center justify-center py-4 text-lg tracking-wider"
        size="medium"
        style="secondary"
        onClick={() => {
          setNewTimeoffEntryView(true);
        }}
      >
        <img alt="Vacation Icon" className="icon mr-4" src={VacationIconSVG} />
        MARK TIME OFF
      </Button>
    </div>
  );

  const MobileButtons = () => (
    <div className="flex items-center justify-between">
      <Button
        className="w-full"
        size="medium"
        style="secondary"
        onClick={() => {
          setNewEntryView(true);
          setEditEntryId(0);
        }}
      >
        + NEW ENTRY
      </Button>
      <Button
        className="ml-1 flex w-full items-center justify-center"
        size="medium"
        style="secondary"
        onClick={() => {
          setNewTimeoffEntryView(true);
        }}
      >
        <img alt="Vacation Icon" className="icon mr-2" src={VacationIconSVG} />
        MARK TIME OFF
      </Button>
    </div>
  );

  return <div>{isDesktop ? <DesktopButtons /> : <MobileButtons />}</div>;
};

export default EntryButtons;
