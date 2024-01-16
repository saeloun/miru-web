/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import { minToHHMM } from "helpers";

import timeoffEntryApi from "apis/timeoff-entry";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";

import {
  showDeleteAction,
  showDuplicateAction,
  showUpdateAction,
} from "./utils";

const TimeoffEntryCard = ({
  timeoffEntry,
  currentUserRole,
  leaveTypeDetails,
  holidayDetails,
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
    setEditEntryId,
    setNewEntryView,
  } = useTimesheetEntries();
  const { id, note, duration, bill_status } = timeoffEntry;
  const [isHolidayTimeoffEntry, setIsHolidayTimeoffEntry] =
    useState<boolean>(false);

  useEffect(() => {
    if (timeoffEntry?.holiday_info_id) {
      setIsHolidayTimeoffEntry(true);
    } else {
      setIsHolidayTimeoffEntry(false);
    }
  }, [timeoffEntry]);

  const getPayload = (timeOffEntry: any) => {
    if (timeOffEntry) {
      const payload: Payload = {
        duration: timeOffEntry.duration,
        leave_date: timeOffEntry.leave_date,
        user_id: selectedEmployeeId,
        note,
      };

      if (isHolidayTimeoffEntry) {
        payload["holiday_info_id"] = timeoffEntry?.holiday_info_id;
      } else {
        payload["leave_type_id"] = timeoffEntry?.leave_type_id;
      }

      return { timeoff_entry: { ...payload } };
    }
  };

  const handleCardClick = () => {
    const isDisableCardClick = true;
    if (!isDesktop && !isDisableCardClick) {
      setEditTimeoffEntryId(id);
    }
  };

  const handleEditBtnClick = () => {
    setNewEntryView(false);
    setEditEntryId(0);
    setEditTimeoffEntryId(id);
  };

  const handleDeleteTimeoffEntry = async timeoffEntryId => {
    if (!timeoffEntryId) return;

    setNewEntryView(false);
    setEditEntryId(0);
    const res = await timeoffEntryApi.destroy(timeoffEntryId);

    if (res.status === 200) {
      await handleFilterEntry(selectedFullDate, timeoffEntryId);
    }
  };

  const handleDuplicateTimeoffEntry = async timeoffEntryId => {
    if (!id) return;
    setNewEntryView(false);
    setEditEntryId(0);
    const timeoffEntry = entryList[selectedFullDate]?.find(
      entry => entry.id === timeoffEntryId
    );

    if (timeoffEntry) {
      const payload = getPayload(timeoffEntry);
      if (payload) {
        const res = await timeoffEntryApi.create(payload, selectedEmployeeId);
        if (res.status === 200) {
          await fetchEntries(selectedFullDate, selectedFullDate);
          await fetchEntriesOfMonths();
        }
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
          <p className="text-base font-normal lg:text-lg">
            {isHolidayTimeoffEntry ? "Holiday" : "Leave"}
          </p>
          <p className="mx-2 text-lg">•</p>
          <p className="text-base font-normal lg:text-lg">
            {isHolidayTimeoffEntry
              ? holidayDetails?.name
              : leaveTypeDetails?.name}
          </p>
        </div>
        <div className="flex py-2 lg:hidden" />
        <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm text-miru-dark-purple-200 lg:w-160">
          {note}
        </p>
      </div>
      <p className="text-miu-dark-Purple-1000 flex self-start text-2xl lg:hidden">
        {minToHHMM(duration)}
      </p>
      <div className="hidden w-5/12 items-center justify-between lg:flex">
        <div className="flex w-7/12 items-center justify-between">
          <div className="w-1/3" />
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
            handleEditBtnClick
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

interface Payload {
  duration: number;
  note?: string;
  leave_date: string;
  user_id: number;
  leave_type_id?: number;
  holiday_info_id?: number;
}
interface Iprops {
  timeoffEntry: any;
  leaveTypeDetails: any;
  holidayDetails: any;
  currentUserRole: string;
}

export default TimeoffEntryCard;
