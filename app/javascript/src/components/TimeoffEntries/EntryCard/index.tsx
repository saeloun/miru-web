/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { minToHHMM } from "helpers";
import { Badge } from "StyledComponents";

import timeoffEntryApi from "apis/timeoff-entry";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";

import {
  showDeleteAction,
  showDuplicateAction,
  showUpdateAction,
} from "./utils";

const TimeoffEntryCard = ({
  // handleDeleteEntry,
  // setEditEntryId,
  leaveEntry,
  currentUserRole,
  // setNewEntryView,
  // handleDuplicate,
  leaveTypeDetails,
}: Iprops) => {
  const { isDesktop } = useUserContext();
  const {
    entryList,
    setEditTimeoffEntryId,
    handleFilterEntry,
    selectedFullDate,
    selectedEmployeeId,
    fetchEntries,
    fetchEntriesOfMonths,
  } = useTimesheetEntries();
  const { id, note, duration, bill_status } = leaveEntry;

  const getPayload = (timeOffEntry: any) => {
    let payload = {};
    if (timeOffEntry) {
      payload = {
        duration: timeOffEntry.duration,
        leave_date: timeOffEntry.leave_date,
        user_id: selectedEmployeeId,
        leave_type_id: timeOffEntry.leave_type_id,
        note, // check payload
      };
    }

    return { timeoff_entry: { ...payload } };
  };

  const handleCardClick = () => {
    if (!isDesktop) {
      setEditTimeoffEntryId(id);
      // setNewEntryView(true);
    }
  };

  const handleDeleteTimeoffEntry = async timeoffEntryId => {
    const res = await timeoffEntryApi.destroy(timeoffEntryId);

    if (res.status === 200) {
      await handleFilterEntry(selectedFullDate, timeoffEntryId);
    }
  };

  const handleDuplicateTimeoffEntry = async timeoffEntryId => {
    if (!id) return;
    const timeoffEntry = entryList[selectedFullDate]?.find(
      entry => entry.id === timeoffEntryId
    );

    if (timeoffEntry) {
      const payload = getPayload(timeoffEntry);
      const res = await timeoffEntryApi.create(payload, selectedEmployeeId);
      if (res.status === 200) {
        await fetchEntries(selectedFullDate, selectedFullDate);
        await fetchEntriesOfMonths();
      }
    }
  };

  return (
    <div
      className="week-card flex w-full items-center justify-between border-b border-miru-gray-200 py-4 lg:mt-10 lg:rounded-lg lg:border-b-0 lg:p-6 lg:shadow-2xl"
      onClick={handleCardClick}
    >
      <div className="w-7/12 flex-auto">
        <div className="text-miu-dark-Purple-1000 flex">
          <p className="text-base font-normal lg:text-lg">Leave</p>
          <p className="mx-2 text-lg">•</p>
          <p className="text-base font-normal lg:text-lg">
            {leaveTypeDetails?.name}
          </p>
        </div>
        <div className="flex py-2 lg:hidden">
          <Badge
            // className={`${getStatusCssClass(bill_status)} uppercase`}
            text={bill_status}
          />
        </div>
        <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm text-miru-dark-purple-200 lg:w-160">
          {note}
        </p>
      </div>
      <p className="text-miu-dark-Purple-1000 flex self-start text-2xl lg:hidden">
        {minToHHMM(duration)}
      </p>
      <div className="hidden w-5/12 items-center justify-between lg:flex">
        <div className="flex w-7/12 items-center justify-between">
          <div>
            <Badge
              // className={`${getStatusCssClass(bill_status)} uppercase`}
              text={bill_status}
            />
          </div>
          <p className="mx-auto text-2xl xl:text-4xl">{minToHHMM(duration)}</p>
        </div>
        <div className="flex w-5/12 items-center justify-evenly">
          {showDuplicateAction(
            bill_status,
            currentUserRole,
            id,
            handleDuplicateTimeoffEntry
          )}
          {showUpdateAction(
            bill_status,
            currentUserRole,
            id,
            setEditTimeoffEntryId
          )}
          {showDeleteAction(
            bill_status,
            currentUserRole,
            id,
            handleDeleteTimeoffEntry
          )}
        </div>
      </div>
    </div>
  );
};

interface Iprops {
  leaveEntry: any;
  leaveTypeDetails: any;
  // handleDeleteEntry: (id: number) => void; // eslint-disable-line
  // setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  currentUserRole: string;
  // setNewEntryView: any;
  // handleDuplicate: any;
}

export default TimeoffEntryCard;
