/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useRef, useState } from "react";

import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import Loader from "common/Loader/index";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditHolidays from "./EditHolidays";

import Header from "../../Header";

const Holidays = () => {
  const [holidayList, setHolidayList] = useState([]);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const [isEditable, setIsEditable] = useState(true);

  const { isDesktop } = useUserContext();
  const navigate = useNavigate();

  const getData = async () => {
    setIsLoading(true);
  };

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
  }, []);

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
      getData();
      setIsDetailUpdated(false);
    } else {
      navigate("/profile/edit/option");
    }
  };

  const getHolidaysContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (isEditable) {
      return (
        <EditHolidays
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
          optionalHolidaysList={optionalHolidaysList}
          optionalRepetitionType={optionalRepetitionType}
          optionalWrapperRef={optionalWrapperRef}
          setEnableOptionalHolidays={setEnableOptionalHolidays}
          setShowDatePicker={setShowDatePicker}
          setShowOptionalDatePicker={setShowOptionalDatePicker}
          showDatePicker={showDatePicker}
          showOptionalDatePicker={showOptionalDatePicker}
          totalOptionalHolidays={totalOptionalHolidays}
          updateHolidayDetails={handleUpdateHolidayDetails}
          wrapperRef={wrapperRef}
        />
      );
    }

    return (
      <Details
        holidaysList={holidayList}
        optionalHolidayList={optionalHolidaysList}
        showCalendar={showCalendar}
        toggleCalendarModal={toggleCalendarModal}
      />
    );
  };

  return (
    <div className="flex h-full w-full flex-col">
      {isEditable ? (
        <Header
          showButtons
          showYearPicker
          cancelAction={handleCancelAction}
          isDisableUpdateBtn={isDetailUpdated}
          saveAction={handleUpdateHolidayDetails}
          subTitle=""
          title="Holidays"
        />
      ) : (
        <DetailsHeader
          showButtons
          showYearPicker
          editAction={() => setIsEditable(true)}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Holidays"
        />
      )}
      {getHolidaysContent()}
    </div>
  );
};

export default Holidays;
