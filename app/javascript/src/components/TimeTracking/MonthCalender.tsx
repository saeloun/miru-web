import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { minToHHMM } from "helpers";
import Logger from "js-logger";
import { useUserContext } from "../../context/UserContext";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

import Header from "./Header";

// Day start from monday
dayjs.Ls.en.weekStart = 1;

interface Iprops {
  fetchEntries: (from: string, to: string) => void;
  selectedEmployeeId: number;
  selectedFullDate: string;
  setSelectedFullDate: any;
  entryList: object;
  handleWeekTodayButton: () => void;
  monthsAbbr: string[];
  setWeekDay: React.Dispatch<React.SetStateAction<number>>;
  setSelectDate: React.Dispatch<React.SetStateAction<number>>;
  currentMonthNumber: any;
  setCurrentMonthNumber: any;
  currentYear: any;
  setCurrentYear: any;
  dayInfo: any[];
}

const MonthCalender: React.FC<Iprops> = ({
  fetchEntries,
  selectedEmployeeId,
  entryList,
  selectedFullDate,
  setSelectedFullDate,
  handleWeekTodayButton,
  monthsAbbr,
  setWeekDay,
  setSelectDate,
  currentMonthNumber,
  setCurrentMonthNumber,
  currentYear,
  setCurrentYear,
  dayInfo,
}) => {
  const { company } = useUserContext();
  const dateFormat =
    company?.date_format || company?.dateFormat || "MM-DD-YYYY";

  const [firstDay, setFirstDay] = useState<number>(
    dayjs().startOf("month").weekday()
  );
  const [daysInMonth, setDaysInMonth] = useState<number>(dayjs().daysInMonth());
  const [totalMonthDuration, setTotalMonthDuration] = useState<number>(0);
  const [monthData, setMonthData] = useState<object[]>([]);
  const [startOfTheMonth, setStartOfTheMonth] = useState<string>(
    dayjs().startOf("month").format(dateFormat)
  );

  const [endOfTheMonth, setEndOfTheMonth] = useState<string>(
    dayjs().endOf("month").format(dateFormat)
  );
  const today = dayjs().format(dateFormat);

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
      ).format(dateFormat);

      const totalDuration =
        entryList && entryList[date]
          ? entryList[date]?.reduce(
              (acc: number, cv: number) => cv["duration"] + acc,
              0
            )
          : 0;
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

  const handlePrevMonth = async () => {
    try {
      const startOfTheMonth2MonthsAgo = dayjs(startOfTheMonth, dateFormat)
        .subtract(2, "month")
        .format(dateFormat);

      const endOfTheMonth2MonthsAgo = dayjs(endOfTheMonth, dateFormat)
        .subtract(2, "month")
        .format(dateFormat);
      await fetchEntries(startOfTheMonth2MonthsAgo, endOfTheMonth2MonthsAgo);
      if (currentMonthNumber === 0) {
        setCurrentMonthNumber(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonthNumber(cmn => cmn - 1);
      }
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleNextMonth = async () => {
    try {
      const startOfTheMonth2MonthsLater = dayjs(startOfTheMonth, dateFormat)
        .add(2, "month")
        .format(dateFormat);

      const endOfTheMonth2MonthsLater = dayjs(endOfTheMonth, dateFormat)
        .add(2, "month")
        .format(dateFormat);

      await fetchEntries(
        startOfTheMonth2MonthsLater,
        endOfTheMonth2MonthsLater
      );
      if (currentMonthNumber === 11) {
        setCurrentMonthNumber(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonthNumber(currentMonthNumber + 1);
      }
    } catch (error) {
      Logger.error(error);
    }
  };

  const handleMonthTodayButton = () => {
    handleWeekTodayButton();
    setCurrentMonthNumber(dayjs().month());
    setCurrentYear(dayjs().year());
  };

  const handleWeekday = (date: any) => {
    setSelectedFullDate(date);
    const day = dayjs(date, dateFormat).day();
    setWeekDay(day);
  };

  useEffect(() => {
    if (entryList) {
      handleMonthChange();
      const firstDateOfTheMonth = `${currentYear}-${currentMonthNumber + 1}-01`;
      setDaysInMonth(dayjs(firstDateOfTheMonth).daysInMonth());
      setFirstDay(dayjs(firstDateOfTheMonth).startOf("month").weekday());
      setStartOfTheMonth(
        dayjs(firstDateOfTheMonth).startOf("month").format(dateFormat)
      );

      setEndOfTheMonth(
        dayjs(firstDateOfTheMonth).endOf("month").format(dateFormat)
      );
    }
  }, [entryList, currentMonthNumber, currentYear]);

  return (
    <div className="w-full">
      <Header
        currentWeekNumber={currentMonthNumber}
        currentYear={currentYear}
        handleNextButton={handleNextMonth}
        handlePrevButton={handlePrevMonth}
        handleTodayButton={handleMonthTodayButton}
        nextTooltipText={`${monthsAbbr[(currentMonthNumber + 1) % 12]} ${
          currentMonthNumber === 11 ? currentYear + 1 : currentYear
        }`}
        previousTooltipText={`${
          monthsAbbr[currentMonthNumber === 0 ? 11 : currentMonthNumber - 1]
        } ${currentMonthNumber === 0 ? currentYear - 1 : currentYear}`}
        text={`${monthsAbbr[currentMonthNumber]} ${currentYear}`}
        todayTooltipText={`${monthsAbbr[dayjs().month()]} ${dayjs().year()}`}
        totalMonthDuration={totalMonthDuration}
      />
      <Card className="mt-4">
        <CardContent className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-8 gap-4 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (day, index) => (
                <div
                  key={index}
                  className="text-center text-sm font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              )
            )}
            <div className="text-center text-sm font-semibold text-muted-foreground">
              Total
            </div>
          </div>
          {/* Calendar grid */}
          {monthData.map((weekInfo, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-4 mb-3">
              {Array.from(Array(7).keys()).map(dayNum =>
                weekInfo[dayNum] ? (
                  <button
                    key={dayNum}
                    className={cn(
                      "relative h-20 rounded-lg border-2 bg-card p-2",
                      "hover:bg-accent hover:border-accent-foreground/20 transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      weekInfo[dayNum]["date"] === selectedFullDate
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => {
                      handleWeekday(weekInfo[dayNum].date);
                      setSelectDate(dayNum);
                    }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="flex justify-end">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            weekInfo[dayNum]["date"] === today
                              ? "bg-primary text-primary-foreground px-2 py-0.5 rounded-full"
                              : "text-muted-foreground"
                          )}
                        >
                          {weekInfo[dayNum]["day"]}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold">
                          {(() => {
                            if (weekInfo[dayNum]["totalDuration"] > 0) {
                              return minToHHMM(
                                weekInfo[dayNum]["totalDuration"]
                              );
                            } else if (weekInfo[dayNum]["date"] < today) {
                              return "00:00";
                            }

                            return "";
                          })()}
                        </span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div key={dayNum} className="h-20" />
                )
              )}
              {/* Week total */}
              <div className="h-20 rounded-lg bg-muted/50 border-2 border-border flex items-end justify-end p-2">
                <span className="text-lg font-bold">
                  {(() => {
                    if (weekInfo[7]) {
                      return minToHHMM(weekInfo[7]);
                    } else if (weekInfo[7] === 0) {
                      return "00:00";
                    }
                  })()}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthCalender;
