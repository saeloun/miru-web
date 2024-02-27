/* eslint-disable */
import React, { useEffect, useState } from "react";

import * as dayjs from "dayjs";
import * as updateLocale from "dayjs/plugin/updateLocale";
import * as weekday from "dayjs/plugin/weekday";
import { minToHHMM } from "helpers";
import Logger from "js-logger";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import SearchTimeEntries from "common/SearchTimeEntries";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import DatesInWeek from "./DatesInWeek";
import { EmptyStatesMobileView } from "./EmptyStatesMobileView";
import EntryForm from "./TimeEntryForm";
import Header from "./Header";
import MonthCalender from "./MonthCalendar";
import TimeEntryManager from "./TimeEntryManager";
import ViewToggler from "./ViewToggler";
import { TimesheetEntriesContext } from "context/TimesheetEntries";
import TimeoffForm from "components/TimeoffEntries/TimeoffForm";
import { VacationIconSVG } from "miruIcons";

dayjs.extend(updateLocale);
dayjs.extend(weekday);

const monthsAbbr = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
dayjs.updateLocale("en", { monthShort: monthsAbbr });

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimesheetEntries = ({ user, isAdminUser }: Iprops) => {
  const isViewTogglerVisible = false;
  const today = dayjs().format("YYYY-MM-DD");
  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [firstDay, setFirstDay] = useState<number>(
    dayjs().startOf("month").weekday()
  );
  const [startOfTheMonth, setStartOfTheMonth] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );

  const [endOfTheMonth, setEndOfTheMonth] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [view, setView] = useState<string>("month");
  const [newEntryView, setNewEntryView] = useState<boolean>(false);
  const [newTimeoffEntryView, setNewTimeoffEntryView] =
    useState<boolean>(false);
  const [newRowView, setNewRowView] = useState<boolean>(false);
  const [selectDate, setSelectDate] = useState<number>(dayjs().weekday());
  const [weekDay, setWeekDay] = useState<number>(0);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<string>("00:00");
  const [dailyTotalHours, setDailyTotalHours] = useState<number[]>([]);
  const [entryList, setEntryList] = useState<object>({});
  const [selectedFullDate, setSelectedFullDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [editEntryId, setEditEntryId] = useState<number>(0);
  const [editTimeoffEntryId, setEditTimeoffEntryId] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [weeklyTimeoffEntries, setWeeklyTimeoffEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isWeeklyEditing, setIsWeeklyEditing] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(
    user?.id
  );
  const [allEmployeesEntries, setAllEmployeesEntries] = useState<object>({});
  const [clients, setClients] = useState<any>({});
  const [projects, setProjects] = useState<any>({});
  const [employees, setEmployees] = useState<any>([]);
  const [currentMonthNumber, setCurrentMonthNumber] = useState<number>(
    dayjs().month()
  );
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const [hasNationalHoliday, setHasNationalHoliday] = useState<boolean>(false);
  const [hasOptionalHoliday, setHasOptionalHoliday] = useState<boolean>(false);
  const [leaveTypeHashObj, setLeaveTypeHashObj] = useState({});
  const [holidaysHashObj, setHolidaysHashObj] = useState({});
  const [totalMonthDuration, setTotalMonthDuration] = useState<number>(0);
  const [monthData, setMonthData] = useState<object[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [updateView, setUpdateView] = useState(true);
  const { isDesktop } = useUserContext();
  const employeeOptions = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  useEffect(() => {
    sendGAPageView();
    fetchTimeTrackingData();
    !isDesktop && setView("day");
  }, []);

  const fetchTimeTrackingData = async () => {
    try {
      const { data } = await timeTrackingApi.get();
      const {
        clients,
        projects,
        entries,
        employees,
        leave_types,
        holiday_infos,
      } = data;
      setClients(clients);
      setProjects(projects);
      setEmployees(employees);
      setEntryList(entries);
      setLeaveTypes(leave_types);
      setHolidayList(holiday_infos);
      const currentEmployeeEntries = {};
      currentEmployeeEntries[user.id] = entries;
      setAllEmployeesEntries(currentEmployeeEntries);
      setLoading(false);
    } catch (error) {
      Logger.error(error);
      setLoading(false);
    }
  };

  const fetchEntriesOfMonths = () => {
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const startOfTheMonth = dayjs(firstDateOfTheMonth).format("YYYY-MM-DD");
    const endOfTheMonth = dayjs(firstDateOfTheMonth)
      .endOf("month")
      .format("YYYY-MM-DD");

    fetchEntries(
      dayjs(startOfTheMonth).subtract(1, "month").format("DD-MM-YYYY"),
      dayjs(endOfTheMonth).add(1, "month").format("DD-MM-YYYY")
    );
  };

  useEffect(() => {
    !isDesktop && setView("day");
  }, [isDesktop]);

  useEffect(() => {
    handleWeekInfo();
  }, [weekDay]);

  useEffect(() => {
    if (view === "month") return;
    parseWeeklyViewData();
    calculateTotalHours();
  }, [weekDay, entryList, view]);

  useEffect(() => {
    setIsWeeklyEditing(false);
  }, [view]);

  useEffect(() => {
    if (updateView) {
      setSelectedFullDate(
        dayjs()
          .weekday(weekDay + selectDate)
          .format("YYYY-MM-DD")
      );
    }
  }, [selectDate, weekDay, updateView]);

  useEffect(() => {
    if (dayInfo.length <= 0) return;
    fetchEntriesOfMonths();
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (leaveTypes?.length > 0) {
      const hashObj = leaveTypes?.reduce((acc, leaveType) => {
        if (leaveType?.id) {
          acc[leaveType.id] = { ...leaveType };
        }
        return acc;
      }, {});

      setLeaveTypeHashObj({ ...hashObj });
    }
  }, [leaveTypes]);

  useEffect(() => {
    if (holidayList?.length > 0) {
      const hashObj = holidayList?.reduce((acc, holidayDetails) => {
        if (holidayDetails?.id) {
          acc[holidayDetails.id] = { ...holidayDetails };
        }

        if (!hasNationalHoliday && holidayDetails?.category === "national") {
          setHasNationalHoliday(true);
        } else if (
          !hasOptionalHoliday &&
          holidayDetails?.category === "optional"
        ) {
          setHasOptionalHoliday(true);
        }
        return acc;
      }, {});

      setHolidaysHashObj({ ...hashObj });
    }
  }, [holidayList]);

  const handleWeekTodayButton = () => {
    setSelectDate(0);
    setWeekDay(dayjs().weekday());
  };

  const handleWeekInfo = () => {
    const daysInWeek = Array.from(Array(7).keys()).map(weekCounter => {
      const [day, month, date, year] = dayjs()
        .weekday(weekCounter + weekDay)
        ["$d"].toString()
        .split(" ");

      const fullDate = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");

      return {
        day,
        month,
        date,
        year,
        fullDate,
      };
    });
    setDayInfo(() => daysInWeek);
  };

  const fetchEntries = async (
    from: string,
    to: string,
    year?: string | number
  ) => {
    const entryYear = year || currentYear;
    try {
      const res = await timeTrackingApi.getCurrentUserEntries(
        from,
        to,
        entryYear,
        selectedEmployeeId
      );

      if (res.status >= 200 && res.status < 300) {
        const {
          clients,
          projects,
          entries,
          employees,
          leave_types,
          holiday_infos,
        } = res.data;

        const allEntries = { ...allEmployeesEntries };
        allEntries[selectedEmployeeId] = {
          ...allEntries[selectedEmployeeId],
          ...entries,
        };

        setClients(clients);
        setProjects(projects);
        setEmployees(employees);
        setLeaveTypes(leave_types);
        setHolidayList(holiday_infos);
        setAllEmployeesEntries(allEntries);
        setEntryList(allEntries[selectedEmployeeId]);
      }
      setLoading(false);

      return res;
    } catch (error) {
      Logger.error(error);
      setLoading(false);
    }
  };

  const handleFilterEntry = async (date: string, entryId: string | number) => {
    let filteredTimesheetEntry: object;
    const filteredDate = dayjs(date).format("YYYY-MM-DD");
    const newValue = { ...entryList };
    newValue[filteredDate] = newValue[filteredDate].filter(e => {
      if (e["id"] == entryId) {
        filteredTimesheetEntry = e;
      } else {
        return e;
      }
    });
    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: newValue }));
    setEntryList(pv => ({ ...pv, ...newValue }));

    return filteredTimesheetEntry;
  };

  const handleRelocateEntry = async (date: string, entry: object) => {
    const filteredDate = dayjs(date).format("YYYY-MM-DD");
    setEntryList(prevState => {
      const newState = { ...prevState };
      newState[filteredDate] = newState[filteredDate]
        ? [...newState[filteredDate], entry]
        : [entry];

      return newState;
    });
    setAllEmployeesEntries(pv => ({ ...pv, [selectedEmployeeId]: entryList }));
  };

  const handleDeleteEntry = async id => {
    const res = await timesheetEntryApi.destroy(id);
    if (!(res.status === 200)) return;
    await handleFilterEntry(selectedFullDate, id);
  };

  const removeLocalStorageItems = () => {
    localStorage.removeItem("note");
    localStorage.removeItem("duration");
    localStorage.removeItem("client");
    localStorage.removeItem("project");
    localStorage.removeItem("projectId");
    localStorage.removeItem("billable");
    localStorage.removeItem("projectBillable");
  };

  const handleDuplicate = async id => {
    removeLocalStorageItems();
    if (!id) return;
    const entry = entryList[selectedFullDate].find(entry => entry.id === id);
    const data = {
      work_date: entry.work_date,
      duration: entry.duration,
      note: entry.note,
      bill_status:
        entry.bill_status == "billed" ? "unbilled" : entry.bill_status,
    };

    const res = await timesheetEntryApi.create(
      {
        project_id: entry.project_id,
        timesheet_entry: data,
      },
      selectedEmployeeId
    );
    if (res.status === 200) {
      await fetchEntries(selectedFullDate, selectedFullDate);
      await fetchEntriesOfMonths();
    }
  };

  const calculateTotalHours = () => {
    let total = 0;
    const dailyTotal = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const day = dayjs()
        .weekday(weekCounter + weekDay)
        .format("YYYY-MM-DD");
      if (entryList[day]) {
        let dayTotal = 0;
        entryList[day].forEach(e => {
          dayTotal += e.duration;
        });
        dailyTotal.push(minToHHMM(dayTotal));
        total += dayTotal;
      } else {
        dailyTotal.push("00:00");
      }
    }
    setDailyTotalHours(dailyTotal);
    setWeeklyTotalHours(minToHHMM(total));
  };

  const handleNextDay = () => {
    setWeekDay(p => p + 1);
    const from = dayjs().weekday(weekDay).format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay + 1)
      .format("YYYY-MM-DD");
    fetchEntries(from, to);
  };

  const handlePreDay = () => {
    setWeekDay(p => p - 1);

    const from = dayjs().weekday(weekDay).format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay - 1)
      .format("YYYY-MM-DD");

    fetchEntries(from, to);
  };

  const handleNextWeek = () => {
    setWeekDay(p => p + 7);
    const from = dayjs()
      .weekday(weekDay + 7)
      .format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay + 13)
      .format("YYYY-MM-DD");
    const year = dayjs(to).year();
    fetchEntries(from, to, year);
  };

  const handlePrevWeek = () => {
    setWeekDay(p => p - 7);
    const from = dayjs()
      .weekday(weekDay - 7)
      .format("YYYY-MM-DD");

    const to = dayjs()
      .weekday(weekDay - 1)
      .format("YYYY-MM-DD");

    const year = dayjs(to).year();
    fetchEntries(from, to, year);
  };

  const parseWeeklyViewData = () => {
    const weekArr = [];
    const weekTimeoffEntries = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const date = dayjs()
        .weekday(weekDay + weekCounter)
        .format("YYYY-MM-DD");

      if (!entryList[date]) continue;

      entryList[date].forEach(entry => {
        if (entry["type"] == "timesheet") {
          let entryAdded = false;
          weekArr.forEach(rowInfo => {
            if (
              rowInfo["projectId"] === entry["project_id"] &&
              !rowInfo["entries"][weekCounter] &&
              !entryAdded
            ) {
              rowInfo["entries"][weekCounter] = entry;
              entryAdded = true;
            }

            return rowInfo;
          });

          if (entryAdded) return;
          const newRow = [];
          newRow[weekCounter] = entry;
          weekArr.push({
            projectId: entry["project_id"],
            clientName: entry.client,
            projectName: entry.project,
            entries: newRow,
          });
        } else {
          weekTimeoffEntries.push(entry);
        }
      });
    }

    setWeeklyData(() => weekArr);
    setWeeklyTimeoffEntries(weekTimeoffEntries);
  };

  // Month view
  const handlePrevMonth = async () => {
    try {
      let year = currentYear;
      const startOfTheMonth2MonthsAgo = dayjs(startOfTheMonth)
        .subtract(2, "month")
        .format("YYYY-MM-DD");

      const endOfTheMonth2MonthsAgo = dayjs(endOfTheMonth)
        .subtract(2, "month")
        .format("YYYY-MM-DD");

      if (currentMonthNumber === 0) {
        year = year - 1;
        setCurrentMonthNumber(11);
        setCurrentYear(year);
      } else {
        setCurrentMonthNumber(cmn => cmn - 1);
      }
      await fetchEntries(
        startOfTheMonth2MonthsAgo,
        endOfTheMonth2MonthsAgo,
        year
      );
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleNextMonth = async () => {
    try {
      let year = currentYear;
      const startOfTheMonth2MonthsLater = dayjs(startOfTheMonth)
        .add(2, "month")
        .format("YYYY-MM-DD");

      const endOfTheMonth2MonthsLater = dayjs(endOfTheMonth)
        .add(2, "month")
        .format("YYYY-MM-DD");

      if (currentMonthNumber === 11) {
        year = year + 1;
        setCurrentMonthNumber(0);
        setCurrentYear(year);
      } else {
        setCurrentMonthNumber(currentMonthNumber + 1);
      }
      await fetchEntries(
        startOfTheMonth2MonthsLater,
        endOfTheMonth2MonthsLater,
        year
      );
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleMonthTodayButton = () => {
    handleWeekTodayButton();
    setCurrentMonthNumber(dayjs().month());
    setFirstDay(() => dayjs().startOf("month").weekday());
    setCurrentYear(dayjs().year());
  };

  const handleMonthChange = () => {
    const monthData = [];
    let weeksData = [];
    let currentWeekTotalHours = 0;
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const daysInCurrentMonth = dayjs(firstDateOfTheMonth).daysInMonth();
    let dayInWeekCounter = dayjs(firstDateOfTheMonth)
      .startOf("month")
      .weekday();

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      // Ex. date = "2020-01-01"
      const date = dayjs(
        `${currentYear}-${currentMonthNumber + 1}-${i}`
      ).format("YYYY-MM-DD");

      const totalDuration = entryList[date]?.reduce(
        (acc: number, cv: number) => cv["duration"] + acc,
        0
      );
      if (totalDuration) currentWeekTotalHours += totalDuration;
      weeksData[dayInWeekCounter] = {
        date,
        day: i,
        totalDuration,
      };
      // if the day is sunday, create a new week
      if (dayInWeekCounter === 6) {
        if (weeksData[6].date < today) {
          weeksData[7] = currentWeekTotalHours;
        } else weeksData[7] = currentWeekTotalHours || null;
        currentWeekTotalHours = 0;
        monthData.push(weeksData);
        weeksData = [];
        dayInWeekCounter = 0;
      } else {
        dayInWeekCounter++;
      }
    }
    if (weeksData.length) {
      if (weeksData[weeksData.length - 1].date < today) {
        weeksData[7] = currentWeekTotalHours;
      } else weeksData[7] = currentWeekTotalHours || null;
      monthData.push(weeksData);
    }

    setTotalMonthDuration(
      monthData.reduce((acc: number, cv: any[]) => cv[7] + acc, 0)
    );
    setMonthData(monthData);
  };

  const handleAddEntryDateChange = date => {
    const date1 = dayjs(date).weekday(dayjs().weekday());
    const date2 = dayjs();

    const days = date1.diff(date2, "days");
    setWeekDay(days > 0 ? days + 1 : days); //The difference between selected date to current date is always comes 1 day less. This condition resolves that issue.
    setSelectDate(dayjs(date).weekday());
    setCurrentMonthNumber(dayjs(date).get("month"));
    setCurrentYear(dayjs(date).year());
  };

  if (loading) {
    return <Loader />;
  }

  const TimeTrackingLayout = () => (
    <TimesheetEntriesContext.Provider
      value={{
        view,
        dayInfo,
        currentMonthNumber,
        currentYear,
        dailyTotalHours,
        isWeeklyEditing,
        handleAddEntryDateChange,
        handleNextDay,
        handleNextWeek,
        handlePreDay,
        handlePrevWeek,
        monthsAbbr,
        selectDate,
        selectedFullDate,
        setSelectDate,
        setWeekDay,
        weeklyTotalHours,
        handleMonthTodayButton,
        handleNextMonth,
        handlePrevMonth,
        totalMonthDuration,
        employeeOptions,
        clients,
        editEntryId,
        entryList,
        setEntryList,
        weeklyData,
        fetchEntries,
        fetchEntriesOfMonths,
        handleDeleteEntry,
        handleDuplicate,
        handleFilterEntry,
        handleRelocateEntry,
        projects,
        removeLocalStorageItems,
        selectedEmployeeId,
        setEditEntryId,
        setNewEntryView,
        setNewRowView,
        setIsWeeklyEditing,
        newTimeoffEntryView,
        setNewTimeoffEntryView,
        setSelectedFullDate,
        setUpdateView,
        setSelectedEmployeeId,
        monthData,
        setStartOfTheMonth,
        setEndOfTheMonth,
        setFirstDay,
        handleMonthChange,
        isDesktop,
        newRowView,
        leaveTypes,
        setLeaveTypes,
        leaveTypeHashObj,
        setLeaveTypeHashObj,
        editTimeoffEntryId,
        setEditTimeoffEntryId,
        holidayList,
        holidaysHashObj,
        hasNationalHoliday,
        hasOptionalHoliday,
        weeklyTimeoffEntries,
        setWeeklyTimeoffEntries,
      }}
    >
      <div className="pb-14">
        {!isDesktop && <Header />}
        <div className="mt-0 h-full p-4 lg:mt-6 lg:p-0">
          <h2 className="header__title hidden lg:inline">Time Tracking</h2>
          <div className="mt-8 mb-6 flex items-center justify-between">
            {isDesktop && (
              <nav className="flex">
                {["month", "week", "day"].map((item, index) => (
                  <button
                    key={index}
                    className={`mr-10 tracking-widest
                      ${
                        item === view
                          ? "border-b-2 border-miru-han-purple-1000 font-bold text-miru-han-purple-1000"
                          : "font-medium text-miru-han-purple-600"
                      }`}
                    onClick={() => setView(item)}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </nav>
            )}
            {isDesktop && isViewTogglerVisible && (
              <ViewToggler view={view} setView={setView} />
            )}

            {!isDesktop && isAdminUser && (
              <label className="text-sm font-normal leading-5 text-miru-dark-purple-1000">
                Time entries for
              </label>
            )}
            {isAdminUser && selectedEmployeeId && (
              <SearchTimeEntries
                employeeList={employeeOptions}
                selectedEmployeeId={selectedEmployeeId}
                setSelectedEmployeeId={setSelectedEmployeeId}
              />
            )}
          </div>
          <div>
            <div className="mb-6">
              {isDesktop && <Header />}

              {view === "month" ? <MonthCalender /> : <DatesInWeek />}
            </div>
            {!editEntryId && newEntryView && view !== "week" && <EntryForm />}
            {newTimeoffEntryView && <TimeoffForm />}
            <div className="flex">
              {view !== "week" &&
                !newEntryView &&
                !newTimeoffEntryView &&
                isDesktop && (
                  <button
                    className="flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-lg font-bold tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
                    onClick={() => {
                      setNewEntryView(true);
                      setEditEntryId(0);
                      setEditTimeoffEntryId(0);
                    }}
                  >
                    + NEW ENTRY
                  </button>
                )}
              {/* --- On mobile view we don't need New Entry button for Empty States --- */}
              {view !== "week" &&
                !newEntryView &&
                !isDesktop &&
                entryList[selectedFullDate] && (
                  <button
                    className="flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-lg font-bold tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
                    onClick={() => {
                      setNewEntryView(true);
                      setEditEntryId(0);
                    }}
                  >
                    + NEW ENTRY
                  </button>
                )}
              {view !== "week" &&
                !newEntryView &&
                !newTimeoffEntryView &&
                isDesktop && (
                  <button
                    className="ml-2 flex h-10 w-full items-center justify-center rounded border-2 border-miru-han-purple-600 p-2 text-lg font-bold uppercase tracking-widest text-miru-han-purple-600 lg:h-14 lg:p-4"
                    onClick={() => {
                      setNewTimeoffEntryView(true);
                    }}
                  >
                    <img src={VacationIconSVG} className="icon" />
                    <span className="ml-2">Mark Time Off</span>
                  </button>
                )}
            </div>
          </div>
          {/* Render existing time entry cards in bottom */}
          <TimeEntryManager />
          {/* mobile view Empty state condition */}
          {view !== "week" && !entryList[selectedFullDate] && !isDesktop && (
            <EmptyStatesMobileView />
          )}
        </div>
      </div>
    </TimesheetEntriesContext.Provider>
  );

  const Main = withLayout(TimeTrackingLayout, !isDesktop, !isDesktop);

  return isDesktop ? TimeTrackingLayout() : <Main />;
};

interface Iprops {
  isAdminUser: boolean;
  user: any;
}

export default TimesheetEntries;
