import React, { useEffect, useState } from "react";

import timesheetEntryApi from "apis/timesheet-entry";
import timeTrackingApi from "apis/timeTracking";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import SearchTimeEntries from "common/SearchTimeEntries";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";
import { minFromHHMM, minToHHMM } from "helpers";
import Logger from "js-logger";
import { sendGAPageView } from "utils/googleAnalytics";

import DatesInWeek from "./DatesInWeek";
import { EmptyStatesMobileView } from "./EmptyStatesMobileView";
import EntryCard from "./EntryCard";
import EntryForm from "./EntryForm";
import { ModernTimeEntryForm } from "./ModernTimeEntryForm";
import Header from "./Header";
import ScheduleCalendar from "../ui/schedule-calendar";
import WeeklyEntries from "./WeeklyEntries";
import EntryDetailsModal from "./EntryDetailsModal";

dayjs.extend(updateLocale);
dayjs.extend(weekday);

const monthsAbbr = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_");
dayjs.updateLocale("en", { monthShort: monthsAbbr });

// Day start from monday
dayjs.Ls.en.weekStart = 1;

const TimeTracking: React.FC<Iprops> = ({ user, isAdminUser }) => {
  const { isDesktop, company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";

  const [dayInfo, setDayInfo] = useState<any[]>([]);
  const [view, setView] = useState<string>("week"); // Default to week view
  const [newEntryView, setNewEntryView] = useState<boolean>(false);
  const [newRowView, setNewRowView] = useState<boolean>(false);
  const [selectDate, setSelectDate] = useState<number>(dayjs().weekday());
  const [weekDay, setWeekDay] = useState<number>(0);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<string>("00:00");
  const [dailyTotalHours, setDailyTotalHours] = useState<number[]>([]);
  const [entryList, setEntryList] = useState<object>({});
  const [selectedFullDate, setSelectedFullDate] = useState<string>(
    dayjs().format(dateFormat)
  );
  const [editEntryId, setEditEntryId] = useState<number>(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
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
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [updateView, setUpdateView] = useState(true);
  const [showModernForm, setShowModernForm] = useState<boolean>(false);
  const [modernFormEntry, setModernFormEntry] = useState<any>(null);
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [modalSelectedDate, setModalSelectedDate] = useState<string>("");
  const employeeOptions = employees.map(e => ({
    value: `${e["id"]}`,
    label: `${e["first_name"]} ${e["last_name"]}`,
  }));

  useEffect(() => {
    sendGAPageView();
    fetchTimeTrackingData();
    // Default to week view
    setView("week");
  }, []);

  const fetchTimeTrackingData = async (employeeId?: number) => {
    try {
      const targetEmployeeId = employeeId || selectedEmployeeId || user.id;
      const { data } = await timeTrackingApi.get(targetEmployeeId);
      const { clients, projects, entries, employees } = data;

      // Ensure clients is an array
      const clientsArray = Array.isArray(clients) ? clients : [];
      setClients(clientsArray);
      
      // Ensure projects is an object keyed by client name
      const projectsObj = projects || {};
      setProjects(projectsObj);
      
      // Ensure employees is an array
      const employeesArray = Array.isArray(employees) ? employees : [];
      setEmployees(employeesArray);
      
      // Ensure entries is an object
      const entriesObj = entries || {};
      setEntryList(entriesObj);
      
      const currentEmployeeEntries = {};
      currentEmployeeEntries[targetEmployeeId] = entriesObj;
      setAllEmployeesEntries(currentEmployeeEntries);
      setLoading(false);
    } catch (error) {
      Logger.error(error);
      setLoading(false);
    }
  };

  const fetchEntriesOfMonths = () => {
    const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
    const startOfTheMonth = dayjs(firstDateOfTheMonth).format(dateFormat);
    const endOfTheMonth = dayjs(firstDateOfTheMonth)
      .endOf("month")
      .format(dateFormat);

    // API expects DD-MM-YYYY format
    const from = dayjs(startOfTheMonth)
      .subtract(1, "month")
      .format("DD-MM-YYYY");
    const to = dayjs(endOfTheMonth).add(1, "month").format("DD-MM-YYYY");

    // fetchEntriesOfMonths called for selectedEmployeeId and date range

    fetchEntries(from, to);
  };

  // View is always "day" by default, user can change it manually

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
          .format(dateFormat)
      );
    }
  }, [selectDate, weekDay, updateView]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchTimeTrackingData(selectedEmployeeId);
      fetchEntriesOfMonths();
    }
  }, [selectedEmployeeId]);

  const handleWeekTodayButton = () => {
    setSelectDate(0);
    setWeekDay(dayjs().weekday());
  };

  const handleWeekInfo = () => {
    const daysInWeek = Array.from(Array(7).keys()).map(weekCounter => {
      const dayjsObj = dayjs().weekday(weekCounter + weekDay);
      const [day, month, date, year] = dayjsObj["$d"].toString().split(" ");

      const fullDate = dayjs()
        .weekday(weekCounter + weekDay)
        .format(dateFormat);

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

  const fetchEntries = async (from: string, to: string) => {
    try {
      const res = await timesheetEntryApi.list(from, to, selectedEmployeeId);
      if (res.status >= 200 && res.status < 300) {
        const allEntries = { ...allEmployeesEntries };
        allEntries[selectedEmployeeId] = {
          ...allEntries[selectedEmployeeId],
          ...res.data.entries,
        };
        // Setting entryList with fetched entries
        setAllEmployeesEntries(allEntries);
        setEntryList(allEntries[selectedEmployeeId]);
      }
      setLoading(false);

      return res;
    } catch (error) {
      // Log error for debugging
      Logger.error(error);
      setLoading(false);
    }
  };

  const handleFilterEntry = async (date: string, entryId: string | number) => {
    let filteredTimesheetEntry: object;
    const filteredDate = dayjs(date).format(dateFormat);
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
    const filteredDate = dayjs(date).format(dateFormat);
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
        .format(dateFormat);
      if (entryList && entryList[day]) {
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
    const from = dayjs().weekday(weekDay).format(dateFormat);

    const to = dayjs()
      .weekday(weekDay + 1)
      .format(dateFormat);
    fetchEntries(from, to);
  };

  const handlePreDay = () => {
    setWeekDay(p => p - 1);

    const from = dayjs().weekday(weekDay).format(dateFormat);

    const to = dayjs()
      .weekday(weekDay - 1)
      .format(dateFormat);

    fetchEntries(from, to);
  };

  const handleNextWeek = () => {
    setWeekDay(p => p + 7);
    const from = dayjs()
      .weekday(weekDay + 7)
      .format(dateFormat);

    const to = dayjs()
      .weekday(weekDay + 13)
      .format(dateFormat);
    fetchEntries(from, to);
  };

  const handlePrevWeek = () => {
    setWeekDay(p => p - 7);
    const from = dayjs()
      .weekday(weekDay - 7)
      .format(dateFormat);

    const to = dayjs()
      .weekday(weekDay - 1)
      .format(dateFormat);
    fetchEntries(from, to);
  };

  const parseWeeklyViewData = () => {
    const weekArr = [];
    for (let weekCounter = 0; weekCounter < 7; weekCounter++) {
      const date = dayjs()
        .weekday(weekDay + weekCounter)
        .format(dateFormat);

      if (!entryList || !entryList[date]) continue;

      entryList[date].forEach(entry => {
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
      });
    }

    setWeeklyData(() => weekArr);
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

  const handleOpenModernForm = (entry = null) => {
    setModernFormEntry(entry);
    setShowModernForm(true);
  };

  const handleCloseModernForm = () => {
    setShowModernForm(false);
    setModernFormEntry(null);
  };

  const handleSaveModernEntry = async (formData: any) => {
    try {
      const payload = {
        work_date: formData.date,
        duration: minFromHHMM(formData.duration),
        note: formData.note,
        bill_status: formData.billable ? "unbilled" : "non_billable",
      };

      if (modernFormEntry) {
        // Update existing entry
        const res = await timesheetEntryApi.update(modernFormEntry.id, {
          project_id: formData.projectId,
          timesheet_entry: payload,
        });
        if (res.status >= 200 && res.status < 300) {
          await fetchEntries(formData.date, formData.date);
          fetchEntriesOfMonths();
        }
      } else {
        // Create new entry
        const res = await timesheetEntryApi.create(
          {
            project_id: formData.projectId,
            timesheet_entry: payload,
          },
          selectedEmployeeId
        );
        if (res.status === 200) {
          await fetchEntries(formData.date, formData.date);
          fetchEntriesOfMonths();
        }
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      throw error;
    }
  };

  if (loading) {
    return <Loader />;
  }

  const TimeTrackingLayout = () => (
    <div className="pb-14">
      {!isDesktop && (
        <Header
          currentMonthNumber={currentMonthNumber}
          currentYear={currentYear}
          dailyTotalHours={dailyTotalHours}
          dayInfo={dayInfo}
          handleAddEntryDateChange={handleAddEntryDateChange}
          handleNextDay={handleNextDay}
          handleNextWeek={handleNextWeek}
          handlePreDay={handlePreDay}
          handlePrevWeek={handlePrevWeek}
          monthsAbbr={monthsAbbr}
          selectDate={selectDate}
          selectedFullDate={selectedFullDate}
          setSelectDate={setSelectDate}
          setWeekDay={setWeekDay}
          view={view}
          weeklyTotalHours={weeklyTotalHours}
        />
      )}
      <div className="mt-0 h-full p-4 lg:mt-6 lg:p-0">
        <div className="mb-6 flex items-center justify-between">
          {isDesktop && (
            <div className="flex flex-col items-start gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Time Tracking
              </h1>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-lg backdrop-blur-sm border border-border">
                {["week", "month"].map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "px-6 py-2 rounded-md font-bold text-sm transition-all duration-200 tracking-wide",
                      item === view
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    onClick={() => setView(item)}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isDesktop && isAdminUser && (
            <h3 className="text-lg font-bold leading-6 text-foreground">
              Time entries for
            </h3>
          )}
          {/* Show dropdown for admin users to switch between employees */}
          {isAdminUser && employeeOptions.length > 0 && (
            <SearchTimeEntries
              employeeList={employeeOptions}
              selectedEmployeeId={selectedEmployeeId}
              setSelectedEmployeeId={setSelectedEmployeeId}
            />
          )}
          {/* Show current user name for non-admin users */}
          {!isAdminUser && user && (
            <div className="text-sm text-muted-foreground">
              Viewing entries for: {user.first_name} {user.last_name}
            </div>
          )}
        </div>
        <div>
          {/* Use calendar view */}
          {view === "month" ? (
            <>
              <ScheduleCalendar
                events={Object.entries(entryList).flatMap(
                  ([date, entries]: [string, any[]]) =>
                    entries.map((entry, index) => {
                      const duration = minToHHMM(entry.duration);
                      const projectName =
                        entry.project || entry.project_name || "No Project";

                      // Get project initials (first letters of each word, max 2-3 letters)
                      const getInitials = (name: string) =>
                        name
                          .split(" ")
                          .map(word => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 3);
                      const projectInitials = getInitials(projectName);

                      return {
                        id: entry.id,
                        title: `${projectInitials} • ${duration}`,
                        description: entry.note || "",
                        start: `${date}`,
                        end: `${date}`,
                        calendarId: "timesheet",
                        _customContent: {
                          projectName,
                          clientName:
                            entry.client || entry.client_name || "No Client",
                          duration,
                          note: entry.note || "No description",
                          billable: entry.bill_status,
                        },
                      };
                    })
                )}
                onEventClick={event => {
                  setEditEntryId(event.id);
                  setNewEntryView(true);
                }}
                onDateClick={date => {
                  const formattedDate = dayjs(date).format(dateFormat);
                  setSelectedFullDate(formattedDate);
                  setModalSelectedDate(formattedDate);
                  setShowEntryModal(true);
                  // Open modal to show day's entries
                  setNewEntryView(false);
                  setEditEntryId(0);
                }}
              />
              {/* Removed inline entry listing - now using modal */}
            </>
          ) : (
            isDesktop && (
              <div className="mb-6 week-view" data-view="week">
                <Header
                  currentMonthNumber={currentMonthNumber}
                  currentYear={currentYear}
                  dailyTotalHours={dailyTotalHours}
                  dayInfo={dayInfo}
                  handleAddEntryDateChange={handleAddEntryDateChange}
                  handleNextDay={handleNextDay}
                  handleNextWeek={handleNextWeek}
                  handlePreDay={handlePreDay}
                  handlePrevWeek={handlePrevWeek}
                  monthsAbbr={monthsAbbr}
                  selectDate={selectDate}
                  selectedFullDate={selectedFullDate}
                  setSelectDate={setSelectDate}
                  setWeekDay={setWeekDay}
                  view={view}
                  weeklyTotalHours={weeklyTotalHours}
                />
                <DatesInWeek
                  dayInfo={dayInfo}
                  selectDate={selectDate}
                  setSelectDate={(index) => {
                    setSelectDate(index);
                    // Show modal with selected day's entries
                    const selectedDayInfo = dayInfo[index];
                    if (selectedDayInfo) {
                      const formattedDate = dayjs(selectedDayInfo.fullDate).format(dateFormat);
                      setModalSelectedDate(formattedDate);
                      setShowEntryModal(true);
                    }
                  }}
                  view={view}
                />
              </div>
            )
          )}
          {!editEntryId && newEntryView && view !== "week" && (
            <EntryForm
              clients={clients}
              editEntryId={editEntryId}
              entryList={entryList}
              fetchEntries={fetchEntries}
              fetchEntriesofMonth={fetchEntriesOfMonths}
              handleAddEntryDateChange={handleAddEntryDateChange}
              handleDeleteEntry={handleDeleteEntry}
              handleFilterEntry={handleFilterEntry}
              handleRelocateEntry={handleRelocateEntry}
              projects={projects}
              removeLocalStorageItems={removeLocalStorageItems}
              selectedEmployeeId={selectedEmployeeId}
              selectedFullDate={selectedFullDate}
              setEditEntryId={setEditEntryId}
              setNewEntryView={setNewEntryView}
              setSelectedFullDate={setSelectedFullDate}
              setUpdateView={setUpdateView}
            />
          )}
          {view !== "week" && !newEntryView && (
            <Button
              size="default"
              className="w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              onClick={() => handleOpenModernForm()}
            >
              <span className="text-lg mr-2">+</span>
              Add Entry
            </Button>
          )}
          {/* Removed duplicate mobile NEW ENTRY button for month view */}
          {/* --- weekly view with smaller button --- */}
          {view === "week" && !newRowView && (
            <Button
              size="default"
              className="w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              onClick={() => setNewRowView(true)}
            >
              <span className="text-lg mr-2">+</span>
              Add Entry
            </Button>
          )}
          {view === "week" && newRowView && (
            <WeeklyEntries
              clientName=""
              clients={clients}
              dayInfo={dayInfo}
              entries={[]}
              entryList={entryList}
              isWeeklyEditing={isWeeklyEditing}
              key={0}
              newRowView={newRowView}
              projectId={null}
              projectName=""
              projects={projects}
              selectedEmployeeId={selectedEmployeeId}
              setEntryList={setEntryList}
              setIsWeeklyEditing={setIsWeeklyEditing}
              setNewRowView={setNewRowView}
              setWeeklyData={setWeeklyData}
              weeklyData={weeklyData}
            />
          )}
        </div>
        {/* entry cards for day and month */}
        {view !== "week" &&
          entryList[selectedFullDate] &&
          entryList[selectedFullDate].map((entry, weekCounter) =>
            editEntryId === entry.id ? (
              <EntryForm
                clients={clients}
                editEntryId={editEntryId}
                entryList={entryList}
                fetchEntries={fetchEntries}
                fetchEntriesofMonth={fetchEntriesOfMonths}
                handleAddEntryDateChange={handleAddEntryDateChange}
                handleDeleteEntry={handleDeleteEntry}
                handleFilterEntry={handleFilterEntry}
                handleRelocateEntry={handleRelocateEntry}
                key={entry.id}
                projects={projects}
                removeLocalStorageItems={removeLocalStorageItems}
                selectedEmployeeId={selectedEmployeeId}
                selectedFullDate={selectedFullDate}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
                setSelectedFullDate={setSelectedFullDate}
                setUpdateView={setUpdateView}
              />
            ) : (
              <EntryCard
                handleDeleteEntry={handleDeleteEntry}
                handleDuplicate={handleDuplicate}
                key={weekCounter}
                setEditEntryId={setEditEntryId}
                setNewEntryView={setNewEntryView}
                {...entry}
              />
            )
          )}
        {/* mobile view Empty state condition */}
        {view !== "week" && !entryList[selectedFullDate] && !isDesktop && (
          <EmptyStatesMobileView
            setEditEntryId={setEditEntryId}
            setNewEntryView={setNewEntryView}
          />
        )}
        {/* entry cards for week */}
        {view === "week" && (
          <div>
            {weeklyData.map((entry, weekCounter) => (
              <WeeklyEntries
                key={weekCounter + 1}
                {...entry}
                clients={clients}
                dayInfo={dayInfo}
                entryList={entryList}
                isWeeklyEditing={isWeeklyEditing}
                newRowView={newRowView}
                parseWeeklyViewData={parseWeeklyViewData}
                projects={projects}
                selectedEmployeeId={selectedEmployeeId}
                setEntryList={setEntryList}
                setIsWeeklyEditing={setIsWeeklyEditing}
                setNewRowView={setNewRowView}
              />
            ))}
          </div>
        )}
      </div>
      {/* Modern Time Entry Form */}
      <ModernTimeEntryForm
        isOpen={showModernForm}
        onClose={handleCloseModernForm}
        onSave={handleSaveModernEntry}
        selectedDate={dayjs(selectedFullDate).toDate()}
        existingEntry={modernFormEntry}
        projects={Object.values(projects).flat()}
        clients={clients}
      />

      {/* Entry Details Modal for Month View */}
      <EntryDetailsModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setNewEntryView(false);
          setEditEntryId(0);
        }}
        selectedDate={modalSelectedDate}
        entries={entryList[modalSelectedDate] || []}
        editEntryId={editEntryId}
        setEditEntryId={setEditEntryId}
        handleDeleteEntry={handleDeleteEntry}
        handleDuplicate={handleDuplicate}
        setNewEntryView={setNewEntryView}
        newEntryView={newEntryView}
        // Form props
        clients={clients}
        projects={projects}
        entryList={entryList}
        fetchEntries={fetchEntries}
        fetchEntriesofMonth={fetchEntriesOfMonths}
        handleAddEntryDateChange={handleAddEntryDateChange}
        handleFilterEntry={handleFilterEntry}
        handleRelocateEntry={handleRelocateEntry}
        removeLocalStorageItems={removeLocalStorageItems}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedFullDate={setSelectedFullDate}
        setUpdateView={setUpdateView}
      />
    </div>
  );

  const Main = withLayout(TimeTrackingLayout, !isDesktop, !isDesktop);

  return isDesktop ? TimeTrackingLayout() : <Main />;
};

interface Iprops {
  isAdminUser: boolean;
  user: any;
}

export default TimeTracking;
