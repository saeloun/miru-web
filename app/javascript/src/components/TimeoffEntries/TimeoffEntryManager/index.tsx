import React from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";

import TimeoffEntryCard from "../EntryCard";
import TimeoffForm from "../TimeoffForm";

const TimeoffEntryManager = ({
  timeoffEntry,
  leaveTypeDetails,
  holidayDetails,
  isDisplayEditTimeoffEntryForm,
}: Iprops) => {
  const { editEntryId, newEntryView } = useTimesheetEntries();

  return (
    <>
      {isDisplayEditTimeoffEntryForm && !editEntryId && !newEntryView ? (
        <TimeoffForm
          isDisplayEditTimeoffEntryForm={isDisplayEditTimeoffEntryForm}
        />
      ) : (
        <TimeoffEntryCard
          holidayDetails={holidayDetails}
          key={timeoffEntry?.id}
          leaveTypeDetails={leaveTypeDetails}
          timeoffEntry={timeoffEntry}
        />
      )}
    </>
  );
};

interface Iprops {
  timeoffEntry: any;
  leaveTypeDetails: any;
  holidayDetails: any;
  isDisplayEditTimeoffEntryForm: boolean;
}

export default TimeoffEntryManager;
