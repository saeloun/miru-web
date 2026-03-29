/* eslint-disable */
import React, { useState, useRef } from "react";
import dayjs from "dayjs";
import { CaretLeft, CaretRight, Calendar, Clock } from "phosphor-react";

import { minToHHMM } from "helpers";
import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import CustomDatePicker from "common/CustomDatePicker";

const Header = ({
  setWeekDay,
  setSelectDate,
  handlePreDay,
  dayInfo = [],
  selectDate = 0,
  handleNextDay,
  handleAddEntryDateChange,
  selectedFullDate = "",
  dailyTotalHours = [],
  weeklyTotalHours = "",
  handleNextWeek,
  handlePrevWeek,
}) => {
  const [openOsCalendar, setOpenOsCalendar] = useState(false);

  const datePickerRef = useRef(null);
  const { isDesktop } = useUserContext();

  const getTodayAction = () => {
    setWeekDay(0);
    setSelectDate(dayjs().weekday());
  };

  const getLastWeekAction = () => {
    setWeekDay(p => p - 7);
  };

  const getRightArrowAction = () => {
    isDesktop ? handleNextWeek() : handleNextDay();
  };

  const getLeftArrowAction = () => {
    isDesktop ? handlePrevWeek() : handlePreDay();
  };

  const getLabel = () => {
    if (!dayInfo.length) return null;

    return isDesktop ? (
      <>
        <span>Week of</span>
        <span className="mx-1">
          {dayInfo[0]["month"]} {parseInt(dayInfo[0]["date"], 10)}
        </span>
        <span>to</span>
        <span className="mx-1">
          {dayInfo[6]["month"]} {parseInt(dayInfo[6]["date"], 10)},
        </span>
        <span>{dayInfo[6]["year"]}</span>
      </>
    ) : (
      <>
        <span>{dayInfo[selectDate].day},</span>
        <span className="mx-1">
          {dayInfo[selectDate].month}{" "}
          {parseInt(dayInfo[selectDate]["date"], 10)},
        </span>
        <span>{dayInfo[selectDate]["year"]}</span>
      </>
    );
  };

  const getTotal = () => {
    return isDesktop ? weeklyTotalHours : dailyTotalHours[selectDate];
  };

  return (
    <Card className="mb-6 w-full rounded-lg border border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getTodayAction}
              className="px-4 py-2 font-bold text-sm border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Today
            </Button>
            {isDesktop && (
              <Button
                variant="ghost"
                size="sm"
                onClick={getLastWeekAction}
                className="px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Last week
              </Button>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={getLeftArrowAction}
              className="h-10 w-10 shrink-0 p-0 hover:bg-accent transition-all duration-200"
            >
              <CaretLeft className="h-5 w-5" />
            </Button>
            {!!dayInfo.length && (
              <>
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" />
                  <h2
                    className="cursor-pointer text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:text-xl"
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
              className="h-10 w-10 shrink-0 p-0 hover:bg-accent transition-all duration-200"
            >
              <CaretRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="weekly-total ml-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-right min-w-0 shrink-0 sm:px-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {getTotal() || "00:00"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
