/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useRef } from "react";

import { format } from "date-fns";
import dayjs from "dayjs";
import TextareaAutosize from "react-textarea-autosize";
import { TimeInput } from "StyledComponents";

import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "components/TimesheetEntries/context/TimesheetEntriesContext";

const TimeoffForm = () => {
  const { selectedFullDate, setNewTimeoffEntryView } = useTimesheetEntries();
  const LEAVE_TYPES = [
    { label: "Leave Type", value: "" },
    { label: "Annual leave", value: "annual" },
    { label: "Sick leave", value: "sick" },
    { label: "Maternity leave", value: "maternity" },
  ];
  const [note, setNote] = useState<string>("");
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);

  const datePickerRef = useRef();

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
  };

  const handleDurationChange = val => {
    setDuration(val);
  };

  // const handleDisableBtn = () => {
  //   const tse = getPayload();
  //   const message = validateTimesheetEntry(tse, client, projectId);
  //   if (message || submitting) {
  //     return true;
  //   }

  //   return false;
  // };

  return (
    <div
      className={`hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex `}
    >
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            className="h-8 w-full rounded-sm bg-miru-gray-100"
            id="leaves"
            name="leaves"
          >
            {LEAVE_TYPES?.map(leave => (
              <option
                className="text-miru-gray-100"
                key={leave.value}
                value={leave.value}
              >
                {leave.label}
              </option>
            ))}
          </select>
        </div>
        <TextareaAutosize
          cols={60}
          name="notes"
          placeholder=" Notes"
          rows={5}
          value={note}
          className={`
            focus:miru-han-purple-1000 outline-none "h-8" mt-2 w-129 resize-none overflow-y-auto rounded-sm bg-miru-gray-100 px-1
          `}
          onChange={e => setNote(e.target["value"])}
        />
      </div>
      <div className="w-60">
        <div className="mb-2 flex justify-between">
          <div>
            {displayDatePicker && (
              <div className="relative" ref={datePickerRef}>
                <div className="h-100 w-100 absolute top-8 z-10">
                  <CustomDatePicker
                    date={dayjs(selectedDate).toDate()}
                    handleChange={handleDateChangeFromDatePicker}
                  />
                </div>
              </div>
            )}
            <div
              className="formatted-date flex h-8 w-29 items-center justify-center rounded-sm bg-miru-gray-100 p-1 text-sm"
              id="formattedDate"
              onClick={() => {
                setDisplayDatePicker(true);
              }}
            >
              {format(new Date(selectedDate), "do MMM, yyyy")}
            </div>
          </div>
          <TimeInput
            className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
            initTime={duration}
            name="timeInput"
            onTimeChange={handleDurationChange}
          />
        </div>
      </div>
      <div className="max-w-min">
        <button
          // disabled={handleDisableBtn()}
          className={`mb-1 h-8 w-38 rounded border bg-miru-han-purple-1000 py-1 px-6 text-xs font-bold tracking-widest text-white hover:border-transparent
          `}
        >
          SAVE
        </button>
        <button
          className="mt-1 h-8 w-38 rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-xs font-bold tracking-widest text-miru-han-purple-600 hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
          onClick={() => {
            setNewTimeoffEntryView(false);
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default TimeoffForm;
