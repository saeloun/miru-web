/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable */
import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import { CalendarIcon, DeleteIcon } from "miruIcons";
import Select from "react-select";

import CustomDatePicker from "common/CustomDatePicker";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
import Toastr from "common/Toastr";
import { leaveTypes } from "constants/leaveType";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../../Header";
import DetailsHeader from "components/Profile/DetailsHeader";
import Details from "./Details";

const countTypeOptions = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

const repetitionType = [
  { value: "per_week", label: "per week" },
  { value: "per_month", label: "per month" },
  { value: "per_quarter", label: "per quarter" },
  { value: "per_year", label: "per year" },
];

const customStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
    minHeight: 32,
    padding: "0",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
  }),
};

// const initialState = {
//   leaveBalance: [
//     {
//       leaveType: "",
//       total: 0,
//       countType: "days",
//       repetitionType: "per_year",
//       carryforwardedCount: 0
//     }
//   ],
//   holidays: [],
//   optionalHolidays: {
//     enableOptionHoliday: false,
//     totalHolidays: 0,
//     repetitionType: "per_year",
//     optionalHolidaysList: []
//   }
// }

const LeavesAndHolidays = () => {
  const leaveTypeOptions = leaveTypes;

  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  /* eslint-disable no-unused-vars */
  const [errDetails, setErrDetails] = useState({
    companyNameErr: "",
    companyPhoneErr: "",
    companyRateErr: "",
  });
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleRepetitionTypeChange = (e, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index].repetitionType = e.value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const handleCountTypeChange = (e, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index].countType = e.value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const handleTotalChange = (e, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index].total = e.target.value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const handleLeaveTypeChange = (e, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index].leaveType = e.value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const handleCarryForwardCountChange = (e, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index].carryforwardedCount = e.target.value;
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
      //   setIsLoading(true);
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
          isDisableUpdateBtn={false}
          editAction={() => setIsEditable(false)}
          subTitle=""
          title="Leaves & Holidays"
        />
      ) : (
        <Header
          showButtons
          cancelAction={handleCancelAction}
          isDisableUpdateBtn={!isDetailUpdated}
          saveAction={handleupdateLeaveDetails}
          subTitle=""
          title="Leaves & Holidays"
        />
      )}
      {isLoading ? <Loader /> : <Details />}
    </div>
  );
};

export default LeavesAndHolidays;
