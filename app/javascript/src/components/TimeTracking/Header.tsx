/* eslint-disable */
import React, { useState, useRef } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

import { minToHHMM } from "helpers";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import CustomDatePicker from "common/CustomDatePicker";

const Header = ({
  setWeekDay = ({}) => {},
  setSelectDate = ({}) => {},
  handlePreDay = () => {
    /* Default empty handler */
  },
  dayInfo = [],
  selectDate = 0,
  handleNextDay = () => {
    /* Default empty handler */
  },
  handleAddEntryDateChange = ({}) => {},
  selectedFullDate = "",
  dailyTotalHours = [],
  view = "",
  totalMonthDuration = 0,
  weeklyTotalHours = "",
  handleNextMonth = () => {
    /* Default empty handler */
  },
  handlePrevMonth = () => {
    /* Default empty handler */
  },
  handleMonthTodayButton = () => {
    /* Default empty handler */
  },
  handleNextWeek = () => {
    /* Default empty handler */
  },
  handlePrevWeek = () => {
    /* Default empty handler */
  },
  monthsAbbr = [],
  currentMonthNumber = 0,
  currentYear = 0,
}) => {
  const [openOsCalendar, setOpenOsCalendar] = useState(false);

  const datePickerRef = useRef(null);
  const { isDesktop } = useUserContext();

  const getTodayAction = () => {
    if (view === "month") {
      handleMonthTodayButton();
    } else {
      setWeekDay(0);
      setSelectDate(dayjs().weekday());
    }
  };

  const getRightArrowAction = () => {
    if (view === "month") {
      handleNextMonth();
    }
    if (view === "day") {
      isDesktop ? handleNextWeek() : handleNextDay();
    }
    if (view === "week") {
      handleNextWeek();
    }
  };

  const getLeftArrowAction = () => {
    if (view === "month") {
      handlePrevMonth();
    }
    if (view === "day") {
      isDesktop ? handlePrevWeek() : handlePreDay();
    }
    if (view === "week") {
      handlePrevWeek();
    }
  };

  const getLabel = () => {
    if (view === "month") {
      return (
        <>
          <span className="mr-2">
            {monthsAbbr[Math.abs(currentMonthNumber)]}
          </span>
          <span>{currentYear}</span>
        </>
      );
    }
    if (view === "day") {
      return isDesktop ? (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      ) : (
        <>
          <span>{parseInt(dayInfo[selectDate]["date"], 10)}</span>
          <span className="mx-1">{dayInfo[selectDate].month}</span>
          <span>{dayInfo[selectDate]["year"]}</span>
        </>
      );
    }
    if (view === "week") {
      return (
        <>
          <span>
            {parseInt(dayInfo[0]["date"], 10)} {dayInfo[0]["month"]} -
          </span>
          <span className="mx-1">
            {parseInt(dayInfo[6]["date"], 10)} {dayInfo[6]["month"]}
          </span>
          <span> {dayInfo[6]["year"]}</span>
        </>
      );
    }
  };

  const getTotal = () => {
    if (view === "month") {
      return minToHHMM(totalMonthDuration);
    }
    if (view === "day") {
      return dailyTotalHours[selectDate];
    }
    if (view === "week") {
      return weeklyTotalHours;
    }
  };

  return (
    <Card className="w-full shadow-sm border border-border bg-card backdrop-blur-sm rounded-lg mb-6">
      <CardContent className="p-5">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={getTodayAction}
            className="px-4 py-2 font-bold text-sm border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            Today
          </Button>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={getLeftArrowAction}
              className="h-10 w-10 p-0 hover:bg-accent transition-all duration-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {!!dayInfo.length && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h2
                    className="text-2xl font-black text-foreground cursor-pointer hover:text-primary transition-colors tracking-tight"
                    onClick={() => {
                      !isDesktop && setOpenOsCalendar(!openOsCalendar);
                    }}
                  >
                    {getLabel()}
                  </h2>
                </div>
                <div
                  className="absolute right-50 top-12 z-50"
                  ref={datePickerRef}
                >
                  {openOsCalendar && (
                    <CustomDatePicker
                      date={dayjs(selectedFullDate).toDate()}
                      setVisibility={setOpenOsCalendar}
                      wrapperRef={datePickerRef}
                      handleChange={date => {
                        setOpenOsCalendar(false);
                        handleAddEntryDateChange(date);
                      }}
                    />
                  )}
                </div>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={getRightArrowAction}
              className="h-10 w-10 p-0 hover:bg-accent transition-all duration-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-lg border border-primary/20">
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total
              </span>
              <span className="text-xl font-black text-primary tracking-tight">
                {getTotal()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
