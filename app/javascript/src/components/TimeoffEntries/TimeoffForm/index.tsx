/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState, useRef, useEffect } from "react";

import { format } from "date-fns";
import dayjs from "dayjs";
import { minFromHHMM, minToHHMM } from "helpers";
import TextareaAutosize from "react-textarea-autosize";
import { Button, BUTTON_STYLES, TimeInput } from "StyledComponents";

import timeoffEntryApi from "apis/timeoff-entry";
import CustomDatePicker from "common/CustomDatePicker";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";

const TimeoffForm = ({ isDisplayEditTimeoffEntryForm = false }: Iprops) => {
  const datePickerRef = useRef();
  const { isDesktop } = useUserContext();
  const {
    leaveTypes,
    entryList,
    selectedFullDate,
    setUpdateView,
    setNewTimeoffEntryView,
    selectedEmployeeId,
    fetchEntries,
    fetchEntriesOfMonths,
    handleAddEntryDateChange,
    editTimeoffEntryId,
    setEditTimeoffEntryId,
    handleFilterEntry,
    handleRelocateEntry,
    setSelectedFullDate,
  } = useTimesheetEntries();

  const [note, setNote] = useState<string>("");
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);
  const [leaveTypeId, setLeaveTypeId] = useState(0);

  useEffect(() => {
    if (isDisplayEditTimeoffEntryForm) {
      handleFillData();
    }
  }, [isDisplayEditTimeoffEntryForm]);

  const handleFillData = () => {
    const timeoffEntry = entryList[selectedFullDate]?.find(
      entry => entry.id === editTimeoffEntryId
    );

    if (timeoffEntry) {
      setDuration(minToHHMM(timeoffEntry.duration));
      setLeaveTypeId(timeoffEntry.leave_type_id);
      setNote(timeoffEntry.note);
    }
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
  };

  const handleDurationChange = val => {
    setDuration(val);
  };

  const isBtnDisable = () => {
    const isActiveBtn = duration?.length > 0 && selectedDate?.length > 0;

    return !isActiveBtn;
  };

  const getPayload = () => {
    const payload = {
      duration: minFromHHMM(duration),
      leave_date: selectedDate,
      user_id: selectedEmployeeId,
      leave_type_id: leaveTypeId,
      note, // check payload
    };

    return { timeoff_entry: { ...payload } };
  };

  const handleSubmit = () => {
    if (editTimeoffEntryId && isDisplayEditTimeoffEntryForm) {
      handleEditTimeoffEntry();
    } else {
      handleSaveTimeoffEntry();
    }
  };

  const handleSaveTimeoffEntry = async () => {
    const payload = getPayload();
    const res = await timeoffEntryApi.create(payload, selectedEmployeeId);

    if (res.status === 200) {
      const fetchEntriesRes = await fetchEntries(selectedDate, selectedDate);
      if (!isDesktop) {
        fetchEntriesOfMonths();
      }

      if (fetchEntriesRes) {
        setNewTimeoffEntryView(false);
        setUpdateView(true);
        handleAddEntryDateChange(dayjs(selectedDate));
        await fetchEntries(selectedDate, selectedDate);
        fetchEntriesOfMonths();
      }
    }
  };

  const handleEditTimeoffEntry = async () => {
    const payload = getPayload();
    const updateRes = await timeoffEntryApi.update(editTimeoffEntryId, payload);

    if (updateRes.status >= 200 && updateRes.status < 300) {
      if (selectedDate !== selectedFullDate) {
        await handleFilterEntry(selectedFullDate, editTimeoffEntryId);
        await handleRelocateEntry(selectedDate, updateRes.data.entry);
        if (!isDesktop) {
          fetchEntriesOfMonths();
        }
      } else {
        await fetchEntries(selectedDate, selectedDate);
        fetchEntriesOfMonths();
      }
      setEditTimeoffEntryId(0);
      setNewTimeoffEntryView(false);
      setUpdateView(true);
      handleAddEntryDateChange(dayjs(selectedDate));
      setSelectedFullDate(dayjs(selectedDate).format("YYYY-MM-DD"));
    }
  };

  return (
    <div className="mt-10 hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex">
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            className="h-8 w-full rounded-sm bg-miru-gray-100"
            id="leaves"
            name="leaves"
            value={`${leaveTypeId}`}
            onChange={e => setLeaveTypeId(Number(e?.target?.value) || 0)}
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
          disabled={isBtnDisable()}
          style={BUTTON_STYLES.primary}
          className={`mb-1 h-8 w-38 rounded border py-1 px-6 text-xs font-bold uppercase tracking-widest text-white hover:border-transparent ${
            isBtnDisable()
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

interface Iprops {
  isDisplayEditTimeoffEntryForm?: boolean;
}

export default TimeoffForm;
