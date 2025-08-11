 
import React, { useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { format } from "date-fns";
import dayjs from "dayjs";
import TextareaAutosize from "react-textarea-autosize";
import { Button, BUTTON_STYLES, TimeInput } from "StyledComponents";

const DesktopTimeoffForm = ({
  isDisplayEditTimeoffEntryForm,
  leaveTypeId,
  setLeaveTypeId,
  holidayId,
  setHolidayId,
  isHolidayEntry,
  isShowHolidayList,
  holidayOptions,
  note,
  setNote,
  displayDatePicker,
  setDisplayDatePicker,
  selectedDate,
  handleDateChangeFromDatePicker,
  duration,
  handleDurationChange,
  isValidTimeEntry,
  handleSubmit,
}) => {
  const datePickerRef = useRef();
  const {
    leaveTypes,
    setNewTimeoffEntryView,
    editTimeoffEntryId,
    setEditTimeoffEntryId,
  } = useTimesheetEntries();

  return (
    <div className="mt-10 hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex">
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            id="leaves"
            name="leaves"
            value={`${leaveTypeId}`}
            className={`h-8 rounded-sm bg-miru-gray-100 ${
              isShowHolidayList ? "w-12/25" : "w-full"
            }`}
            onChange={e => setLeaveTypeId(e?.target?.value || 0)}
          >
            <option className="text-miru-gray-100" key={0} value={0}>
              Leave Type
            </option>
            {leaveTypes?.length > 0 &&
              leaveTypes?.map(leave => (
                <option
                  className="text-miru-gray-100"
                  key={leave.id}
                  value={leave.id}
                >
                  {leave.name}
                </option>
              ))}
          </select>
          {isHolidayEntry() && (
            <select
              className="ml-4 h-8 w-12/25 rounded-sm bg-miru-gray-100"
              id="holidays"
              name="holidays"
              value={`${holidayId}`}
              onChange={e => setHolidayId(Number(e?.target?.value) || 0)}
            >
              <option className="text-miru-gray-100" key={0} value={0}>
                Select Holiday
              </option>
              {holidayOptions?.length > 0 &&
                holidayOptions?.map(holiday => (
                  <option
                    className="text-miru-gray-100"
                    key={holiday.id}
                    value={holiday.id}
                  >
                    {holiday.name}
                  </option>
                ))}
            </select>
          )}
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
        <Button
          disabled={!isValidTimeEntry()}
          style={BUTTON_STYLES.primary}
          className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold uppercase tracking-widest text-white hover:border-transparent ${
            !isValidTimeEntry()
              ? "cursor-not-allowed bg-miru-gray-1000"
              : "cursor-pointer bg-miru-han-purple-1000 hover:border-transparent"
          }
          `}
          onClick={handleSubmit}
        >
          {isDisplayEditTimeoffEntryForm ? "Update" : "Save"}
        </Button>
        <Button
          className="mt-1 h-8 w-38 rounded border border-miru-han-purple-1000 bg-transparent py-1 px-6 text-xs font-bold uppercase tracking-widest text-miru-han-purple-600 hover:border-transparent hover:bg-miru-han-purple-1000 hover:text-white"
          style={BUTTON_STYLES.secondary}
          onClick={() => {
            setNewTimeoffEntryView(false);
            if (editTimeoffEntryId) {
              setEditTimeoffEntryId(0);
            }
          }}
        >
          CANCEL
        </Button>
      </div>
    </div>
  );
};

export default DesktopTimeoffForm;
