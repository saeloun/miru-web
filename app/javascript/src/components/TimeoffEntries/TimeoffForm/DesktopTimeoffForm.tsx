import React, { useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "context/TimesheetEntries";
import dayjs from "dayjs";
import AnimatedTimeInput from "../../ui/animated-time-input";
import AnimatedSelect from "../../ui/animated-select";
import AnimatedTextarea from "../../ui/animated-textarea";
import { AnimatedButton } from "../../ui/animated-button";
import AnimatedDatePicker from "../../ui/animated-date-picker";
import { Card } from "../../ui/card";
import { cn } from "../../../lib/utils";

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
  const datePickerRef = useRef<HTMLDivElement>(null);
  const {
    leaveTypes,
    setNewTimeoffEntryView,
    editTimeoffEntryId,
    setEditTimeoffEntryId,
  } = useTimesheetEntries();

  const leaveTypeOptions =
    leaveTypes?.map(leave => ({
      value: leave.id.toString(),
      label: leave.name,
    })) || [];

  const holidayOptionsFormatted =
    holidayOptions?.map(holiday => ({
      value: holiday.id.toString(),
      label: holiday.name,
    })) || [];

  return (
    <Card className="mt-10 hidden min-h-24 justify-between p-6 shadow-lg lg:flex">
      <div className="flex-1 space-y-6">
        <div
          className={cn(
            "grid gap-4",
            isHolidayEntry() ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}
        >
          <AnimatedSelect
            options={leaveTypeOptions}
            value={leaveTypeId.toString()}
            placeholder="Select leave type"
            onChange={value => setLeaveTypeId(Number(value) || 0)}
          />

          {isHolidayEntry() && (
            <AnimatedSelect
              options={holidayOptionsFormatted}
              value={holidayId.toString()}
              placeholder="Select holiday"
              onChange={value => setHolidayId(Number(value) || 0)}
            />
          )}
        </div>

        <AnimatedTextarea
          name="notes"
          placeholder="Add notes..."
          value={note}
          autoResize
          className="w-full resize-none min-h-[80px]"
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="space-y-6 ml-8">
        <div className="grid grid-cols-1 gap-4">
          <AnimatedDatePicker
            date={dayjs(selectedDate).toDate()}
            onDateChange={handleDateChangeFromDatePicker}
            className="w-[180px]"
          >
            <CustomDatePicker
              date={dayjs(selectedDate).toDate()}
              handleChange={handleDateChangeFromDatePicker}
            />
          </AnimatedDatePicker>

          <div className="w-[180px]">
            <AnimatedTimeInput
              initTime={duration || "08:00"}
              name="timeInput"
              onTimeChange={handleDurationChange}
              allowModeSwitch={false}
              defaultMode="hhmm"
              placeholder="Time off"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 ml-8">
        <AnimatedButton
          disabled={!isValidTimeEntry()}
          animation="bounce"
          onClick={handleSubmit}
        >
          {isDisplayEditTimeoffEntryForm ? "Update Entry" : "Save Entry"}
        </AnimatedButton>

        <AnimatedButton
          variant="outline"
          animation="scale"
          onClick={() => {
            setNewTimeoffEntryView(false);
            if (editTimeoffEntryId) {
              setEditTimeoffEntryId(0);
            }
          }}
        >
          Cancel
        </AnimatedButton>
      </div>
    </Card>
  );
};

export default DesktopTimeoffForm;
