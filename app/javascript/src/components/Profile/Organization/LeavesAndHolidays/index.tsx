/* eslint-disable @typescript-eslint/no-var-requires */
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
      <Header
        showButtons
        cancelAction={handleCancelAction}
        isDisableUpdateBtn={isDetailUpdated}
        saveAction={handleupdateLeaveDetails}
        subTitle=""
        title="Leaves & Holidays"
      />
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-4 h-full bg-miru-gray-100 p-10">
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Leave Balance</div>
            <div className="w-full p-2">
              <div className="flex flex-col">
                {leaveBalanceList.map((leaveBalance, index) => (
                  <div key={index}>
                    <div className="flex w-11/12 flex-col">
                      <label className="mb-2">Leave type</label>
                      <Select
                        className="mt-2"
                        classNamePrefix="react-select-filter"
                        options={leaveTypeOptions}
                        styles={customStyles}
                        value={
                          leaveBalance.leaveType
                            ? leaveTypeOptions.filter(
                                option =>
                                  option.value === leaveBalance.leaveType
                              )
                            : leaveTypeOptions[0]
                        }
                        onChange={e => handleLeaveTypeChange(e, index)}
                      />
                    </div>
                    <div className="flex w-full flex-row">
                      <div className="flex w-7/12 flex-col pt-2 pr-2 pb-2">
                        <label className="mb-2">Total</label>
                        <div className="flex flex-row">
                          <div className="w-2/12 pr-1">
                            <input
                              className="w-full border p-1"
                              data-cy="standard-rate"
                              id="company_rate"
                              min={0}
                              name="company_rate"
                              type="number"
                              value={leaveBalance.total}
                              onChange={e => handleTotalChange(e, index)}
                            />
                          </div>
                          <div className="w-5/12 px-2">
                            <Select
                              className=""
                              classNamePrefix="react-select-filter"
                              options={countTypeOptions}
                              styles={customStyles}
                              value={
                                leaveBalance.countType
                                  ? countTypeOptions.filter(
                                      option =>
                                        option.value === leaveBalance.countType
                                    )
                                  : countTypeOptions[0]
                              }
                              onChange={e => handleCountTypeChange(e, index)}
                            />
                          </div>
                          <div className="w-5/12 px-2">
                            <Select
                              className=""
                              classNamePrefix="react-select-filter"
                              options={repetitionType}
                              styles={customStyles}
                              value={
                                leaveBalance.repetitionType
                                  ? repetitionType.filter(
                                      option =>
                                        option.value ===
                                        leaveBalance.repetitionType
                                    )
                                  : repetitionType[0]
                              }
                              onChange={e =>
                                handleRepetitionTypeChange(e, index)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex w-4/12 flex-col pt-2 pr-2 pb-2">
                        <label className="mb-2">Carry forward (days)</label>
                        <input
                          className="w-full border py-1 px-1"
                          data-cy="standard-rate"
                          id="company_rate"
                          min={0}
                          name="company_rate"
                          type="number"
                          value={leaveBalance.carryforwardedCount}
                          onChange={e =>
                            handleCarryForwardCountChange(e, index)
                          }
                        />
                        {errDetails.companyRateErr && (
                          <span className="text-sm text-red-600">
                            {errDetails.companyRateErr}
                          </span>
                        )}
                      </div>
                      <div className="flex w-1/12 items-end justify-center pb-4">
                        <button
                          data-cy="delete-logo"
                          onClick={() => handleDeleteLeaveBalance(index)}
                        >
                          <DeleteIcon
                            className="ml-2 cursor-pointer rounded-full"
                            color="#5b34ea"
                            style={{ minWidth: "40px" }}
                          />
                        </button>
                      </div>
                      <Divider />
                    </div>
                    {errDetails.companyPhoneErr && (
                      <span className="text-sm text-red-600">
                        {errDetails.companyPhoneErr}
                      </span>
                    )}
                  </div>
                ))}
                <div
                  className="dotted-btn mt-4 w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
                  onClick={handleAddLeaveType}
                >
                  + Add Another Leave Type
                </div>
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Holidays</div>
            <div className="w-full p-2">
              <div className="flex flex-col">
                {holidayList.map((holiday, index) => (
                  <div className="flex flex-row" key={index}>
                    <div className="flex w-11/12 flex-row py-2">
                      <div className="field w-1/2 border bg-white pr-1">
                        <div
                          className="relative"
                          onClick={() =>
                            setShowDatePicker({
                              visibility: !showDatePicker.visibility,
                              index,
                            })
                          }
                        >
                          <input
                            disabled
                            className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-white px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                            placeholder="Date"
                            type="text"
                            value={
                              holiday.date &&
                              dayjs(holiday.date).format("DD.MM.YYYY")
                            }
                          />
                          <CalendarIcon
                            className="absolute top-0 right-0 m-2"
                            color="#5B34EA"
                            size={20}
                          />
                        </div>
                        {index == showDatePicker.index &&
                          showDatePicker.visibility && (
                            <CustomDatePicker
                              date={holiday.date}
                              handleChange={e =>
                                handleDatePicker(e, index, false)
                              }
                            />
                          )}
                      </div>
                      <div className="w-1/2 pl-1">
                        <input
                          className="w-full border py-1 px-1"
                          data-cy="standard-rate"
                          id="company_rate"
                          name="company_rate"
                          placeholder="Name"
                          type="text"
                          value={holiday.name}
                          onChange={e =>
                            handleHolidateNameChange(e, index, false)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex w-1/12 items-end justify-center pb-4">
                      <button
                        data-cy="delete-logo"
                        onClick={() => handleDeleteHoliday(false, index)}
                      >
                        <DeleteIcon
                          className="ml-2 cursor-pointer rounded-full"
                          color="#5b34ea"
                          style={{ minWidth: "40px" }}
                        />
                      </button>
                    </div>
                    {errDetails.companyPhoneErr && (
                      <span className="text-sm text-red-600">
                        {errDetails.companyPhoneErr}
                      </span>
                    )}
                  </div>
                ))}
                <div
                  className="dotted-btn mt-4 w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
                  onClick={() => handleAddHoliday(false)}
                >
                  + Add Holiday
                </div>
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Optional Holidays</div>
            <div className="w-full p-2">
              <div className="flex w-11/12 flex-row justify-between">
                <span>Enable optional holidays</span>
                <div>
                  <label className="switch">
                    <input type="checkbox" onChange={handleCheckboxClick} />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
              {enableOptionalHolidays && (
                <div className="mt-3 flex flex-col">
                  <label> Total optional holidays </label>
                  <div className="flex w-11/12 flex-row py-2">
                    <input
                      className="w-1/2 border py-1 px-1"
                      data-cy="standard-rate"
                      id="company_rate"
                      min={0}
                      name="company_rate"
                      type="number"
                      value={totalOptionalHolidays}
                      onChange={handleChangeTotalOpHoliday}
                    />
                    <div className="w-1/2 px-2">
                      <Select
                        className=""
                        classNamePrefix="react-select-filter"
                        options={repetitionType}
                        styles={customStyles}
                        value={
                          optionalRepetitionType
                            ? repetitionType.filter(
                                option =>
                                  option.value === optionalRepetitionType
                              )
                            : repetitionType[0]
                        }
                        onChange={handleChangeRepetitionOpHoliday}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label> List of optional holidays </label>
                    {optionalHolidaysList.map((optionalHoliday, index) => (
                      <div className="flex flex-row" key={index}>
                        <div className="flex w-11/12 flex-row py-3">
                          <div className="field w-1/2 border bg-white pr-1">
                            <div
                              className="relative"
                              onClick={() =>
                                setShowOptionalDatePicker({
                                  visibility:
                                    !showOptionalDatePicker.visibility,
                                  index,
                                })
                              }
                            >
                              <input
                                disabled
                                className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-white px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                                placeholder="Date"
                                type="text"
                                value={
                                  optionalHoliday.date &&
                                  dayjs(optionalHoliday.date).format(
                                    "DD.MM.YYYY"
                                  )
                                }
                              />
                              <CalendarIcon
                                className="absolute top-0 right-0 m-2"
                                color="#5B34EA"
                                size={20}
                              />
                            </div>
                            {showOptionalDatePicker.index == index &&
                              showOptionalDatePicker.visibility && (
                                <CustomDatePicker
                                  date={optionalHoliday.date}
                                  handleChange={e =>
                                    handleDatePicker(e, index, true)
                                  }
                                />
                              )}
                          </div>
                          <div className="w-1/2 pl-1">
                            <input
                              className="w-full border py-1 px-1"
                              data-cy="standard-rate"
                              id="company_rate"
                              name="company_rate"
                              placeholder="Name"
                              type="text"
                              value={optionalHoliday.name}
                              onChange={e =>
                                handleHolidateNameChange(e, index, true)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex w-1/12 items-end justify-center pb-4">
                          <button
                            data-cy="delete-logo"
                            onClick={() => handleDeleteHoliday(true, index)}
                          >
                            <DeleteIcon
                              className="ml-2 cursor-pointer rounded-full"
                              color="#5b34ea"
                              style={{ minWidth: "40px" }}
                            />
                          </button>
                        </div>
                        {errDetails.companyPhoneErr && (
                          <span className="text-sm text-red-600">
                            {errDetails.companyPhoneErr}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className="dotted-btn mt-4 w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
                    onClick={() => handleAddHoliday(true)}
                  >
                    + Add Optional Holiday
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesAndHolidays;
