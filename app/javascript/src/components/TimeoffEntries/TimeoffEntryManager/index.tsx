import React from "react";

import { useTimesheetEntries } from "context/TimesheetEntries";

import TimeoffEntryCard from "../EntryCard";
import TimeoffForm from "../TimeoffForm";

const TimeoffEntryManager = ({
  timeoffEntry,
  leaveTypeDetails,
  holidayDetails,
  isDisplayEditTimeoffEntryForm,
  showDateLabelForWeekView,
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
          leaveTypeDetails={leaveTypeDetails}
          showDateLabelForWeekView={showDateLabelForWeekView}
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
  showDateLabelForWeekView?: boolean;
}

export default TimeoffEntryManager;
