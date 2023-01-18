/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import Loader from "common/Loader/index";
import Toastr from "common/Toastr";
import DetailsHeader from "components/Profile/DetailsHeader";
import { leaveTypes } from "constants/leaveType";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditLeavesAndHolidays from "./EditLeavesAndHolidays";

import Header from "../../Header";

const LeavesAndHolidays = () => {
  const leaveTypeOptions = leaveTypes;

  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const [errDetails, setErrDetails] = useState({}); //eslint-disable-line
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<any>({
    visibility: false,
    index: 0,
  });

  const [enableOptionalHolidays, setEnableOptionalHolidays] =
    useState<any>(false);

  const [showOptionalDatePicker, setShowOptionalDatePicker] = useState<any>({
    visibility: false,
    index: 0,
  });
  const [optionalHolidaysList, setOptionalHolidaysList] = useState([]);
  const [totalOptionalHolidays, setTotalOptionalHolidays] = useState(0);
  const [optionalRepetitionType, setOptionalRepetitionType] =
    useState("per_year");
  const [isEditable, setIsEditable] = useState(true);

  const getData = async () => {
    setIsLoading(true);
  };

  const toggleCalendarModal = () => setShowCalendar(!showCalendar);

  useEffect(() => {
    sendGAPageView();
  }, []);

  const handleAddLeaveType = () => {
    setLeaveBalanceList([
      ...leaveBalanceList,
      ...[
        {
          leaveType: "",
          total: 0,
          countType: "days",
          repetitionType: "per_year",
          carryforwardedCount: 0,
        },
      ],
    ]);
  };

  const updateCondition = (type, value, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index][type] = value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const handleDatePicker = (date, index, isoptionalHoliday) => {
    setIsDetailUpdated(true);
    if (!isoptionalHoliday) {
      const holidayListDetail = [...holidayList];
      holidayListDetail[index].date = date;
      setHolidayList([...holidayListDetail]);
      setShowDatePicker({ visibility: false, index: 0 });
    } else {
      const holidayListDetail = [...optionalHolidaysList];
      holidayListDetail[index].date = date;
      setOptionalHolidaysList([...holidayListDetail]);
      setShowOptionalDatePicker({ visibility: false, index: 0 });
    }
  };

  const handleAddHoliday = isoptionalHoliday => {
    if (!isoptionalHoliday) {
      setHolidayList([
        ...holidayList,
        ...[
          {
            date: "",
            name: "",
          },
        ],
      ]);
    } else {
      setOptionalHolidaysList([
        ...optionalHolidaysList,
        ...[
          {
            date: "",
            name: "",
          },
        ],
      ]);
    }
  };

  const handleDeleteHoliday = (isoptionalHoliday, index) => {
    if (!isoptionalHoliday) {
      const updatedHolidayList = holidayList;
      updatedHolidayList.splice(index, 1);
      setHolidayList([...updatedHolidayList]);
    } else {
      const updatedHolidayList = optionalHolidaysList;
      updatedHolidayList.splice(index, 1);
      setOptionalHolidaysList([...updatedHolidayList]);
    }
  };

  const handleHolidateNameChange = (e, index, isoptionalHoliday) => {
    setIsDetailUpdated(true);
    if (!isoptionalHoliday) {
      const holidayListDetail = [...holidayList];
      holidayListDetail[index].name = e.target.value;
      setHolidayList([...holidayListDetail]);
    } else {
      const holidayListDetail = [...optionalHolidaysList];
      holidayListDetail[index].name = e.target.value;
      setOptionalHolidaysList([...holidayListDetail]);
    }
  };

  const handleCheckboxClick = () => {
    setEnableOptionalHolidays(!enableOptionalHolidays);
  };

  const handleChangeTotalOpHoliday = e => {
    setTotalOptionalHolidays(e.target.value);
    setIsDetailUpdated(true);
  };

  const handleChangeRepetitionOpHoliday = e => {
    setOptionalRepetitionType(e.value);
    setIsDetailUpdated(true);
  };

  const handleupdateLeaveDetails = async () => {
    try {
      setIsEditable(false);
    } catch {
      setIsLoading(false);
      Toastr.error("Error in Updating Leave Details");
    }
  };

  const handleCancelAction = () => {
    getData();
    setIsDetailUpdated(false);
  };

  const handleDeleteLeaveBalance = index => {
    const updatedLeaveBalance = leaveBalanceList;
    updatedLeaveBalance.splice(index, 1);
    setLeaveBalanceList([...updatedLeaveBalance]);
  };

  return (
    <div className="flex w-4/5 flex-col">
      {!isEditable ? (
        <DetailsHeader
          showButtons
          editAction={() => setIsEditable(true)}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Leaves & Holidays"
        />
      ) : (
        <Header
          showButtons
          cancelAction={handleCancelAction}
          isDisableUpdateBtn={isDetailUpdated}
          saveAction={handleupdateLeaveDetails}
          subTitle=""
          title="Leaves & Holidays"
        />
      )}
      {isLoading ? (
        <Loader />
      ) : !isEditable ? (
        <Details
          showCalendar={showCalendar}
          toggleCalendarModal={toggleCalendarModal}
        />
      ) : (
        <EditLeavesAndHolidays
          enableOptionalHolidays={enableOptionalHolidays}
          errDetails={errDetails}
          handleAddHoliday={handleAddHoliday}
          handleAddLeaveType={handleAddLeaveType}
          handleChangeRepetitionOpHoliday={handleChangeRepetitionOpHoliday}
          handleChangeTotalOpHoliday={handleChangeTotalOpHoliday}
          handleCheckboxClick={handleCheckboxClick}
          handleDatePicker={handleDatePicker}
          handleDeleteHoliday={handleDeleteHoliday}
          handleDeleteLeaveBalance={handleDeleteLeaveBalance}
          handleHolidateNameChange={handleHolidateNameChange}
          holidayList={holidayList}
          leaveBalanceList={leaveBalanceList}
          leaveTypeOptions={leaveTypeOptions}
          optionalHolidaysList={optionalHolidaysList}
          optionalRepetitionType={optionalRepetitionType}
          setShowDatePicker={setShowDatePicker}
          setShowOptionalDatePicker={setShowOptionalDatePicker}
          showDatePicker={showDatePicker}
          showOptionalDatePicker={showOptionalDatePicker}
          totalOptionalHolidays={totalOptionalHolidays}
          updateCondition={updateCondition}
        />
      )}
    </div>
  );
};

export default LeavesAndHolidays;
