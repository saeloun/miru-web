import React from "react";
import SearchTimeEntries from "common/SearchTimeEntries";
import Header from "./Header";

interface TimeTrackingHeaderProps {
  isDesktop: boolean;
  view: string;
  setView: (view: string) => void;
  selectedEmployeeId: number;
  setSelectedEmployeeId: (id: number) => void;
  employeeOptions: Array<{ value: string; label: string }>;
  dayInfo: any[];
  handleWeekTodayButton: () => void;
  handleNextDay: () => void;
  handleNextWeek: () => void;
  handlePreDay: () => void;
  handlePrevWeek: () => void;
  selectDate: number;
  selectedFullDate: string;
  setSelectDate: (date: number) => void;
  setWeekDay: (week: number) => void;
  weeklyTotalHours: string;
  monthsAbbr: string[];
  currentMonthNumber: number;
  currentYear: number;
}

const TimeTrackingHeader: React.FC<TimeTrackingHeaderProps> = ({
  isDesktop,
  view,
  setView,
  selectedEmployeeId,
  setSelectedEmployeeId,
  employeeOptions,
  dayInfo,
  handleWeekTodayButton,
  handleNextDay,
  handleNextWeek,
  handlePreDay,
  handlePrevWeek,
  selectDate,
  selectedFullDate,
  setSelectDate,
  setWeekDay,
  weeklyTotalHours,
  monthsAbbr,
  currentMonthNumber,
  currentYear,
}) => {
  if (!isDesktop) {
    return null;
  }

  return (
    <>
      <SearchTimeEntries
        setSelectedEmployeeId={setSelectedEmployeeId}
        selectedEmployeeId={selectedEmployeeId}
        view={view}
        setView={setView}
        employeeOptions={employeeOptions}
      />
      {(view === "day" || view === "week") && (
        <div className="mt-2">
          <Header
            currentMonthNumber={currentMonthNumber}
            currentYear={currentYear}
            dayInfo={dayInfo}
            handleWeekTodayButton={handleWeekTodayButton}
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
        </div>
      )}
    </>
  );
};

export default TimeTrackingHeader;
