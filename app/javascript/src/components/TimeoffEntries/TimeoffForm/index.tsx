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

import { HOLIDAY_TYPES } from "../constants";

const TimeoffForm = ({ isDisplayEditTimeoffEntryForm = false }: Iprops) => {
  const datePickerRef = useRef();
  const { isDesktop } = useUserContext();
  const {
    leaveTypes,
    setLeaveTypes,
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
    holidayList,
    holidaysHashObj,
    hasNationalHoliday,
    hasOptionalHoliday,
  } = useTimesheetEntries();

  const [note, setNote] = useState<string>("");
  const [displayDatePicker, setDisplayDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(selectedFullDate);
  const [leaveTypeId, setLeaveTypeId] = useState<number | string>(0);
  const [holidayId, setHolidayId] = useState(0);
  const [isShowHolidayList, setIsShowHolidayList] = useState<boolean>(false);
  const [holidayOptions, setHolidayOptions] = useState([]);

  useEffect(() => {
    // Append National and Optional holiday as a leave type
    const tempLeaveTypes = [...leaveTypes];
    if (hasNationalHoliday) {
      const isNationalHolidayAlreadyAdded = leaveTypes?.find(
        leave => leave.category === HOLIDAY_TYPES.NATIONAL
      );
      if (!isNationalHolidayAlreadyAdded) {
        const nationalHolidayLeaveTypeObj = {
          id: HOLIDAY_TYPES.NATIONAL,
          name: "National Holiday",
          category: HOLIDAY_TYPES.NATIONAL,
        };
        tempLeaveTypes.push({ ...nationalHolidayLeaveTypeObj });
      }
    }

    if (hasOptionalHoliday) {
      const isOptionalHolidayAlreadyAdded = leaveTypes?.find(
        leave => leave.category === HOLIDAY_TYPES.OPTIONAL
      );
      if (!isOptionalHolidayAlreadyAdded) {
        const optionalHolidayLeaveTypeObj = {
          id: HOLIDAY_TYPES.OPTIONAL,
          name: "Optional Holiday",
          category: HOLIDAY_TYPES.OPTIONAL,
        };
        tempLeaveTypes.push({ ...optionalHolidayLeaveTypeObj });
      }
    }

    if (leaveTypes?.length !== tempLeaveTypes?.length) {
      setLeaveTypes([...tempLeaveTypes]);
    }
  }, [hasNationalHoliday, hasOptionalHoliday]);

  useEffect(() => {
    if (isDisplayEditTimeoffEntryForm) {
      handleFillData();
    }
  }, [isDisplayEditTimeoffEntryForm]);

  useEffect(() => {
    if (isHolidayEntry()) {
      setIsShowHolidayList(true);
      const tempHolidayOptions =
        holidayList?.filter(holiday => holiday?.category === leaveTypeId) || [];
      setHolidayOptions([...tempHolidayOptions]);
      setSuggestedHolidayBasedOnDate(tempHolidayOptions);
    } else {
      setIsShowHolidayList(false);
    }
  }, [leaveTypeId]);

  const setSuggestedHolidayBasedOnDate = (currentHolidayOptions: any[]) => {
    if (!isDisplayEditTimeoffEntryForm && currentHolidayOptions?.length > 0) {
      const suggestedHoliday = currentHolidayOptions?.find(
        holiday => holiday?.date === selectedDate
      );
      setHolidayId(suggestedHoliday?.id || 0);
    }
  };

  const handleFillData = () => {
    const timeoffEntry = entryList[selectedFullDate]?.find(
      entry => entry.id === editTimeoffEntryId
    );

    if (timeoffEntry) {
      setDuration(minToHHMM(timeoffEntry?.duration || 0));
      setNote(timeoffEntry?.note || "");

      if (timeoffEntry?.holiday_info_id) {
        const currentHolidayId = timeoffEntry.holiday_info_id || 0;
        const currentHolidayDetails = holidaysHashObj[currentHolidayId];

        setLeaveTypeId(currentHolidayDetails?.category);
        setHolidayId(currentHolidayId);
      } else {
        setLeaveTypeId(timeoffEntry.leave_type_id);
      }
    }
  };

  const handleDateChangeFromDatePicker = (date: Date) => {
    setSelectedDate(dayjs(date).format("YYYY-MM-DD"));
    setDisplayDatePicker(false);
  };

  const handleDurationChange = val => {
    setDuration(val);
  };

  const isHolidayEntry = () =>
    leaveTypeId === HOLIDAY_TYPES.NATIONAL ||
    leaveTypeId === HOLIDAY_TYPES.OPTIONAL;

  const isValidTimeEntry = () => {
    const isValidLeaveTypeOrHolidayId =
      (isHolidayEntry() && holidayId > 0) || Number(leaveTypeId) > 0;

    return (
      isValidLeaveTypeOrHolidayId &&
      duration?.length > 0 &&
      selectedDate?.length > 0
    );
  };

  const getPayload = () => {
    if (isValidTimeEntry()) {
      const payload: Payload = {
        duration: minFromHHMM(duration),
        leave_date: selectedDate,
        user_id: selectedEmployeeId,
        note,
      };

      if (isHolidayEntry()) {
        payload["holiday_info_id"] = Number(holidayId);
      } else {
        payload["leave_type_id"] = Number(leaveTypeId);
      }

      return { timeoff_entry: { ...payload } };
    }
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
    if (payload) {
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
        }
      }
    }
  };

  const handleEditTimeoffEntry = async () => {
    const payload = getPayload();
    if (payload) {
      const updateRes = await timeoffEntryApi.update(
        editTimeoffEntryId,
        payload
      );

      if (updateRes.status >= 200 && updateRes.status < 300) {
        if (selectedDate !== selectedFullDate) {
          await handleFilterEntry(selectedFullDate, editTimeoffEntryId);
          await handleRelocateEntry(selectedDate, updateRes.data.timeoff_entry);
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
    }
  };

  return (
    <div className="mt-10 hidden min-h-24 justify-between rounded-lg p-4 shadow-2xl lg:flex">
      <div className="w-1/2">
        <div className="mb-2 flex w-129 justify-between">
          <select
            className="h-8 w-12/25 rounded-sm bg-miru-gray-100"
            id="leaves"
            name="leaves"
            value={`${leaveTypeId}`}
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
          {isShowHolidayList && (
            <select
              className="h-8 w-12/25 rounded-sm bg-miru-gray-100"
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

interface Payload {
  duration: number;
  note?: string;
  leave_date: string;
  user_id: number;
  leave_type_id?: number;
  holiday_info_id?: number;
}
interface Iprops {
  isDisplayEditTimeoffEntryForm?: boolean;
}

export default TimeoffForm;
