import React, { useRef } from "react";

import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomTextareaAutosize } from "common/CustomTextareaAutosize";
import DeleteEntryModal from "components/TimesheetEntries/MobileView/DeleteEntryModal";
import { useTimesheetEntries } from "context/TimesheetEntries";
import dayjs from "dayjs";
import {
  CalendarIcon,
  CaretDownIcon,
  CopyIcon,
  DeleteIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "miruIcons";
import {
  Button,
  MobileMoreOptions,
  SidePanel,
  TimeInput,
} from "StyledComponents";

const MobileTimeoffForm = ({
  handleClose,
  showLeavesList,
  setShowLeavesList,
  leaveType,
  setLeaveType,
  setLeaveTypeId,
  holiday,
  setHoliday,
  setHolidayId,
  isHolidayEntry,
  isShowHolidayList,
  setIsShowHolidayList,
  holidayOptions,
  note,
  setNote,
  displayDatePicker,
  setDisplayDatePicker,
  selectedDate,
  setSelectedDate,
  handleDateChangeFromDatePicker,
  incrementOrDecrementTime,
  duration,
  handleDurationChange,
  handleDuplicateTimeoffEntry,
  showDeleteDialog,
  setShowDeleteDialog,
  isValidTimeEntry,
  handleSubmit,
  handleDeleteTimeoffEntry,
}) => {
  const datePickerRef = useRef();
  const {
    leaveTypes,
    setNewTimeoffEntryView,
    editTimeoffEntryId,
    setEditTimeoffEntryId,
  } = useTimesheetEntries();

  return (
    <>
      <SidePanel
        disableOutsideClick
        WrapperClassname="z-50 justify-content-between lg:hidden bg-white"
        setFilterVisibilty={setNewTimeoffEntryView}
      >
        <SidePanel.Header className="mb-2 flex items-center justify-between bg-miru-han-purple-1000 px-5 py-5 text-white lg:bg-white lg:font-bold lg:text-miru-dark-purple-1000">
          <span className="flex w-full items-center justify-center pl-6 text-base font-medium leading-5">
            {editTimeoffEntryId ? "Edit Mark Time Off" : "Mark Time Off"}
          </span>
          <Button style="ternary" onClick={handleClose}>
            <XIcon
              className="text-white lg:text-miru-dark-purple-1000"
              size={16}
            />
          </Button>
        </SidePanel.Header>
        <SidePanel.Body className="sidebar__filters flex h-full flex-col justify-between overflow-y-auto px-4">
          <div className="flex flex-auto flex-col justify-between">
            <div>
              <div className="py-3">
                <div
                  className="relative flex w-full flex-col"
                  onClick={() => {
                    setShowLeavesList(true);
                  }}
                >
                  <CustomInputText
                    disabled={showLeavesList}
                    id="LeaveType"
                    label="Leave Type"
                    name="leaveType"
                    type="text"
                    value={leaveType}
                  />
                  <CaretDownIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {showLeavesList && (
                  <MobileMoreOptions
                    className="h-1/2"
                    setVisibilty={setShowLeavesList}
                    visibilty={showLeavesList}
                  >
                    {leaveTypes.length > 0 ? (
                      leaveTypes.map((eachLeavetype, index) => (
                        <li
                          key={index}
                          className={`flex items-center px-2 pt-3 text-sm font-normal leading-5 text-miru-dark-purple-1000
                            hover:bg-miru-gray-100`}
                          onClick={() => {
                            setLeaveType(eachLeavetype.name);
                            setLeaveTypeId(eachLeavetype.id || 0);
                            setHoliday("");
                            setHolidayId("");
                            setShowLeavesList(false);
                          }}
                        >
                          {eachLeavetype.name}
                        </li>
                      ))
                    ) : (
                      <div className="mt-5 text-center">
                        No Leavetypes present.
                      </div>
                    )}
                  </MobileMoreOptions>
                )}
              </div>
              {isHolidayEntry() && (
                <div className="py-3">
                  <div
                    className="relative flex w-full flex-col"
                    onClick={() => {
                      setIsShowHolidayList(true);
                    }}
                  >
                    <CustomInputText
                      disabled={isShowHolidayList}
                      id="holidays"
                      label="Select Holiday"
                      name="holidays"
                      type="text"
                      value={holiday}
                    />
                    <CaretDownIcon
                      className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                      color="#5B34EA"
                      size={20}
                      weight="bold"
                    />
                  </div>
                  {isShowHolidayList && (
                    <MobileMoreOptions
                      className="h-1/2"
                      setVisibilty={setIsShowHolidayList}
                      visibilty={isShowHolidayList}
                    >
                      {holidayOptions.length > 0 ? (
                        holidayOptions.map((eachHoliday, index) => (
                          <li
                            key={index}
                            className={`flex items-center px-2 pt-3 text-sm font-normal leading-5 text-miru-dark-purple-1000
                              hover:bg-miru-gray-100`}
                            onClick={() => {
                              setHoliday(eachHoliday.name);
                              setHolidayId(eachHoliday.id || 0);
                              setIsShowHolidayList(false);
                            }}
                          >
                            {eachHoliday.name}
                          </li>
                        ))
                      ) : (
                        <div className="mt-5 text-center">
                          No holidays present.
                        </div>
                      )}
                    </MobileMoreOptions>
                  )}
                </div>
              )}
              <div className="py-3">
                <CustomTextareaAutosize
                  id="Description"
                  label="Description"
                  maxRows={12}
                  name="Description"
                  rows={5}
                  value={note}
                  onChange={e => setNote(e.target["value"])}
                />
              </div>
              <div className="flex w-full flex-col py-3">
                <div
                  className="field relative flex w-full flex-col"
                  onClick={() => setDisplayDatePicker(!displayDatePicker)}
                >
                  <CustomInputText
                    disabled
                    id="date"
                    label="Date"
                    name="date"
                    type="text"
                    value={dayjs(selectedDate).format("MM.DD.YYYY")}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                    }}
                  />
                  <CalendarIcon
                    className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
                    color="#5B34EA"
                    size={20}
                    weight="bold"
                  />
                </div>
                {displayDatePicker && (
                  <CustomDatePicker
                    date={new Date(selectedDate)}
                    handleChange={handleDateChangeFromDatePicker}
                    setVisibility={setDisplayDatePicker}
                    wrapperRef={datePickerRef}
                  />
                )}
              </div>
              <div className="flex items-center justify-between rounded border border-miru-gray-1000">
                <Button
                  style="ternary"
                  onClick={() => incrementOrDecrementTime(false)}
                >
                  <MinusIcon
                    className="m-4 text-miru-dark-purple-1000"
                    size={20}
                    weight="bold"
                  />
                </Button>
                <TimeInput
                  className="focus:outline-none w-1/2 cursor-pointer rounded text-center text-xl font-bold text-miru-dark-purple-1000 placeholder:text-miru-dark-purple-200 focus:border-miru-gray-1000 focus:bg-white focus:ring-1 focus:ring-miru-gray-1000"
                  initTime={duration}
                  name="timeInput"
                  onTimeChange={handleDurationChange}
                />
                <Button style="ternary" onClick={incrementOrDecrementTime}>
                  <PlusIcon
                    className="m-4 text-miru-dark-purple-1000"
                    size={20}
                    weight="bold"
                  />
                </Button>
              </div>
            </div>
            {editTimeoffEntryId ? (
              <div className="flex w-full items-center justify-between">
                <Button
                  className="mr-1 flex w-1/2 items-center justify-center py-2 px-10/100"
                  style="secondary"
                  onClick={handleDuplicateTimeoffEntry}
                >
                  <CopyIcon
                    className="mr-2 text-miru-han-purple-1000"
                    size={20}
                  />
                  <span className="font-bold">Duplicate</span>
                </Button>
                <Button
                  className="ml-1 flex w-1/2 items-center justify-center rounded border border-miru-red-400 py-2 px-10/100 text-miru-red-400"
                  style="secondary"
                  onClick={() => {
                    setShowDeleteDialog(true);
                  }}
                >
                  <DeleteIcon className="mr-2 text-miru-red-400" size={20} />
                  <span className="font-bold">Delete</span>
                </Button>
              </div>
            ) : null}
          </div>
          <SidePanel.Footer className="sidebar__footer h-auto w-full justify-around px-0">
            <Button
              className="block w-full p-2 text-center text-base font-bold"
              disabled={!isValidTimeEntry()}
              style="primary"
              onClick={handleSubmit}
            >
              {editTimeoffEntryId ? "Save Changes" : "Save"}
            </Button>
          </SidePanel.Footer>
        </SidePanel.Body>
      </SidePanel>
      {showDeleteDialog ? (
        <DeleteEntryModal
          handleDeleteEntry={handleDeleteTimeoffEntry}
          id={editTimeoffEntryId}
          setEditEntryId={setEditTimeoffEntryId}
          setNewEntryView={setNewTimeoffEntryView}
          setShowDeleteDialog={setShowDeleteDialog}
          showDeleteDialog={showDeleteDialog}
        />
      ) : null}
    </>
  );
};

export default MobileTimeoffForm;
