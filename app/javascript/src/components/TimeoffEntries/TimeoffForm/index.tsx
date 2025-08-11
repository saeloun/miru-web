 
import { HOLIDAY_TYPES } from "constants/index";

import React, { useState, useEffect } from "react";

import timeoffEntryApi from "apis/timeoff-entry";
import { useTimesheetEntries } from "context/TimesheetEntries";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { minFromHHMM, minToHHMM } from "helpers";

import DesktopTimeoffForm from "./DesktopTimeoffForm";
import MobileTimeoffForm from "./MobileTimeoffForm";

const TimeoffForm = ({ isDisplayEditTimeoffEntryForm = false }) => {
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
  const [leaveTypeId, setLeaveTypeId] = useState<number | string>("");
  const [leaveType, setLeaveType] = useState<string>("");
  const [holidayId, setHolidayId] = useState<number | string>("");
  const [holiday, setHoliday] = useState<string>("");
  const [isShowHolidayList, setIsShowHolidayList] = useState<boolean>(false);
  const [holidayOptions, setHolidayOptions] = useState([]);
  const [showLeavesList, setShowLeavesList] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

  useEffect(() => {
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
      const tempHolidayOptions =
        holidayList?.filter(holiday => holiday?.category === leaveTypeId) || [];
      setHolidayOptions([...tempHolidayOptions]);
      handleSuggestedHolidayBasedOnDate(tempHolidayOptions);
    } else {
      setIsShowHolidayList(false);
    }
  }, [leaveTypeId]);

  useEffect(() => {
    if (!isDisplayEditTimeoffEntryForm && selectedFullDate !== selectedDate) {
      setSelectedDate(selectedFullDate);
    }
  }, [selectedFullDate, isDisplayEditTimeoffEntryForm]);

  const handleSuggestedHolidayBasedOnDate = (currentHolidayOptions: any[]) => {
    if (!isDisplayEditTimeoffEntryForm && currentHolidayOptions?.length > 0) {
      const suggestedHoliday = currentHolidayOptions?.find(
        holiday => holiday?.date === selectedDate
      );
      setHolidayId(suggestedHoliday?.id || 0);
    }
  };

  const isHolidayEntry = () =>
    leaveTypeId === HOLIDAY_TYPES.NATIONAL ||
    leaveTypeId === HOLIDAY_TYPES.OPTIONAL;

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
        const selectedLeaveType = leaveTypes.find(
          leaveType => leaveType.id === currentHolidayDetails?.category
        );
        setLeaveTypeId(selectedLeaveType?.id);
        setLeaveType(selectedLeaveType?.name);
        setHolidayId(currentHolidayId);
        setHoliday(currentHolidayDetails?.name);
      } else {
        const selectedLeaveType = leaveTypes.find(
          leaveType => leaveType.id === timeoffEntry.leave_type_id
        );
        setLeaveTypeId(timeoffEntry.leave_type_id);
        setLeaveType(selectedLeaveType.name);
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

  const incrementOrDecrementTime = (increment = true) => {
    const currentMinutes = minFromHHMM(duration);
    const updatedMinutes = increment
      ? currentMinutes + 15
      : currentMinutes - 15;
    const updatedDuration = minToHHMM(updatedMinutes);
    setDuration(updatedDuration);
  };

  const isValidTimeEntry = () => {
    const isValidLeaveTypeOrHolidayId =
      (isHolidayEntry() && Number(holidayId) > 0) || Number(leaveTypeId) > 0;

    return (
      isValidLeaveTypeOrHolidayId &&
      duration?.length > 0 &&
      selectedDate?.length > 0
    );
  };

  const getPayload = (timeoffEntry?: any) => {
    if (isValidTimeEntry()) {
      const payload = {
        duration: timeoffEntry?.duration || minFromHHMM(duration),
        leave_date: timeoffEntry?.leave_date
          ? dayjs(timeoffEntry.leave_date).format("YYYY-MM-DD")
          : selectedDate,
        user_id: selectedEmployeeId,
        note: timeoffEntry?.note || note,
      };

      if (isHolidayEntry()) {
        payload["holiday_info_id"] =
          timeoffEntry?.holiday_info_id || Number(holidayId);
        payload["leave_type_id"] = null;
      } else {
        payload["leave_type_id"] =
          timeoffEntry?.leave_type_id || Number(leaveTypeId);
        payload["holiday_info_id"] = null;
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

  const handleClose = () => {
    setNewTimeoffEntryView(false);
    setEditTimeoffEntryId(0);
  };

  const handleDeleteTimeoffEntry = async timeoffEntryId => {
    if (!timeoffEntryId) return;
    setEditTimeoffEntryId(0);
    setNewTimeoffEntryView(false);
    const res = await timeoffEntryApi.destroy(timeoffEntryId);

    if (res.status === 200) {
      await handleFilterEntry(selectedFullDate, timeoffEntryId);
    }
  };

  const handleDuplicateTimeoffEntry = async () => {
    if (!editTimeoffEntryId) return;
    setEditTimeoffEntryId(0);
    setNewTimeoffEntryView(false);
    const timeoffEntry = entryList[selectedFullDate]?.find(
      entry => entry.id === editTimeoffEntryId
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
    <>
      {isDesktop ? (
        <DesktopTimeoffForm
          displayDatePicker={displayDatePicker}
          duration={duration}
          handleDateChangeFromDatePicker={handleDateChangeFromDatePicker}
          handleDurationChange={handleDurationChange}
          handleSubmit={handleSubmit}
          holidayId={holidayId}
          holidayOptions={holidayOptions}
          isDisplayEditTimeoffEntryForm={isDisplayEditTimeoffEntryForm}
          isHolidayEntry={isHolidayEntry}
          isShowHolidayList={isShowHolidayList}
          isValidTimeEntry={isValidTimeEntry}
          leaveTypeId={leaveTypeId}
          note={note}
          selectedDate={selectedDate}
          setDisplayDatePicker={setDisplayDatePicker}
          setHolidayId={setHolidayId}
          setLeaveTypeId={setLeaveTypeId}
          setNote={setNote}
        />
      ) : (
        <MobileTimeoffForm
          displayDatePicker={displayDatePicker}
          duration={duration}
          handleClose={handleClose}
          handleDateChangeFromDatePicker={handleDateChangeFromDatePicker}
          handleDeleteTimeoffEntry={handleDeleteTimeoffEntry}
          handleDuplicateTimeoffEntry={handleDuplicateTimeoffEntry}
          handleDurationChange={handleDurationChange}
          handleSubmit={handleSubmit}
          holiday={holiday}
          holidayOptions={holidayOptions}
          incrementOrDecrementTime={incrementOrDecrementTime}
          isHolidayEntry={isHolidayEntry}
          isShowHolidayList={isShowHolidayList}
          isValidTimeEntry={isValidTimeEntry}
          leaveType={leaveType}
          note={note}
          selectedDate={selectedDate}
          setDisplayDatePicker={setDisplayDatePicker}
          setHoliday={setHoliday}
          setHolidayId={setHolidayId}
          setIsShowHolidayList={setIsShowHolidayList}
          setLeaveType={setLeaveType}
          setLeaveTypeId={setLeaveTypeId}
          setNote={setNote}
          setSelectedDate={setSelectedDate}
          setShowDeleteDialog={setShowDeleteDialog}
          setShowLeavesList={setShowLeavesList}
          showDeleteDialog={showDeleteDialog}
          showLeavesList={showLeavesList}
        />
      )}
    </>
  );
};

export default TimeoffForm;
