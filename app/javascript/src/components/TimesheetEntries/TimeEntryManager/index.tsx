import React from "react";

import TimeoffEntryManager from "components/TimeoffEntries/TimeoffEntryManager";
import { useTimesheetEntries } from "context/TimesheetEntries";

import EntryCard from "../EntryCard";
import EntryForm from "../TimeEntryForm";
import WeekView from "../WeekView";

const TimeEntryManager = () => {
  const {
    view,
    entryList,
    editEntryId,
    editTimeoffEntryId,
    handleDeleteEntry,
    selectedFullDate,
    setEditEntryId,
    setNewEntryView,
    handleDuplicate,
    leaveTypeHashObj,
    holidaysHashObj,
  } = useTimesheetEntries();

  return (
    <>
      {view === "week" ? (
        <WeekView />
      ) : (
        // Entry cards for day and month
        entryList &&
        entryList[selectedFullDate] &&
        entryList[selectedFullDate]?.map(entry =>
          editEntryId === entry.id ? (
            // Edit time entry form
            <EntryForm key={entry.id} />
          ) : (
            <div key={entry.id}>
              {entry?.type === "timesheet" && !entry?.leave_type_id ? (
                <EntryCard
                  handleDeleteEntry={handleDeleteEntry}
                  handleDuplicate={handleDuplicate}
                  setEditEntryId={setEditEntryId}
                  setNewEntryView={setNewEntryView}
                  {...entry}
                />
              ) : (
                <TimeoffEntryManager
                  timeoffEntry={entry}
                  holidayDetails={
                    holidaysHashObj[entry?.holiday_info_id || null]
                  }
                  isDisplayEditTimeoffEntryForm={
                    editTimeoffEntryId === entry?.id
                  }
                  leaveTypeDetails={
                    leaveTypeHashObj[entry?.leave_type_id] || null
                  }
                />
              )}
            </div>
          )
        )
      )}
    </>
  );
};

export default TimeEntryManager;
