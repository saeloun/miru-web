/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useRef, useState } from "react";

import { getYear } from "date-fns";
import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import holidaysApi from "apis/holidays";
import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditHolidays from "./EditHolidays";

const Holidays = () => {
  const [holidayList, setHolidayList] = useState([]);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<any>({
    visibility: false,
    index: 0,
  });
  const wrapperRef = useRef(null);
  const optionalWrapperRef = useRef(null);
  const modalWrapperRef = useRef(null);

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
  const [isEditable, setIsEditable] = useState(false);

  const { isDesktop } = useUserContext();
  const navigate = useNavigate();

  useOutsideClick(wrapperRef, () => {
    setShowDatePicker({
      visibility: false,
      index: 0,
    });
  });

  useOutsideClick(optionalWrapperRef, () => {
    setShowOptionalDatePicker({
      visibility: false,
      index: 0,
    });
  });

  useOutsideClick(modalWrapperRef, () => {
    setShowCalendar(false);
  });

  const toggleCalendarModal = () => setShowCalendar(!showCalendar);

  useEffect(() => {
    sendGAPageView();
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    await holidaysApi.allHolidays();
    setIsLoading(false);
  };

  const handleDatePicker = (date, index, isoptionalHoliday) => {
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
  };

  const handleChangeRepetitionOpHoliday = e => {
    setOptionalRepetitionType(e.value);
  };

  const handleUpdateHolidayDetails = async () => {
    try {
      setIsEditable(false);
    } catch {
      setIsLoading(false);
      Toastr.error("Error in Updating Leave Details");
    }
  };

  const handleCancelAction = () => {
    if (isDesktop) {
      setIsDetailUpdated(false);
      setIsEditable(false);
    } else {
      navigate("/profile/edit/option");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-70v items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {isEditable ? (
        <EditHolidays
          currentYear={currentYear}
          enableOptionalHolidays={enableOptionalHolidays}
          handleAddHoliday={handleAddHoliday}
          handleCancelAction={handleCancelAction}
          handleChangeRepetitionOpHoliday={handleChangeRepetitionOpHoliday}
          handleChangeTotalOpHoliday={handleChangeTotalOpHoliday}
          handleCheckboxClick={handleCheckboxClick}
          handleDatePicker={handleDatePicker}
          handleDeleteHoliday={handleDeleteHoliday}
          handleHolidateNameChange={handleHolidateNameChange}
          holidayList={holidayList}
          isDesktop={isDesktop}
          isDisableUpdateBtn={isDetailUpdated}
          optionalHolidaysList={optionalHolidaysList}
          optionalRepetitionType={optionalRepetitionType}
          optionalWrapperRef={optionalWrapperRef}
          setCurrentYear={setCurrentYear}
          setEnableOptionalHolidays={setEnableOptionalHolidays}
          setShowDatePicker={setShowDatePicker}
          setShowOptionalDatePicker={setShowOptionalDatePicker}
          showDatePicker={showDatePicker}
          showOptionalDatePicker={showOptionalDatePicker}
          totalOptionalHolidays={totalOptionalHolidays}
          updateHolidayDetails={handleUpdateHolidayDetails}
          wrapperRef={wrapperRef}
        />
      ) : (
        <Details
          currentYear={currentYear}
          editAction={() => setIsEditable(true)}
          holidaysList={holidayList}
          optionalHolidayList={optionalHolidaysList}
          setCurrentYear={setCurrentYear}
          showCalendar={showCalendar}
          toggleCalendarModal={toggleCalendarModal}
        />
      )}
    </div>
  );
};

export default Holidays;
