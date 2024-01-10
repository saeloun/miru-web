import React from "react";

import TimeoffEntryCard from "../EntryCard";
import TimeoffForm from "../TimeoffForm";

const TimeoffEntryManager = ({
  leaveEntry,
  currentUserRole,
  leaveTypeDetails,
  isDisplayEditTimeoffEntryForm,
}: Iprops) => (
  <>
    {isDisplayEditTimeoffEntryForm ? (
      <TimeoffForm
        isDisplayEditTimeoffEntryForm={isDisplayEditTimeoffEntryForm}
      />
    ) : (
      <TimeoffEntryCard
        currentUserRole={currentUserRole}
        key={leaveEntry?.id}
        leaveEntry={leaveEntry}
        leaveTypeDetails={leaveTypeDetails}
      />
    )}
  </>
);

interface Iprops {
  leaveEntry: any;
  leaveTypeDetails: any;
  currentUserRole: string;
  isDisplayEditTimeoffEntryForm: boolean;
}

export default TimeoffEntryManager;
