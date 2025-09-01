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

  const getRightArrowAction = () => {
    isDesktop ? handleNextWeek() : handleNextDay();
  };

  const getLeftArrowAction = () => {
    isDesktop ? handlePrevWeek() : handlePreDay();
  };

  const getLabel = () => {
    return isDesktop ? (
      // Week view label for desktop
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
      // Day view label for mobile
      <>
        <span>{parseInt(dayInfo[selectDate]["date"], 10)}</span>
        <span className="mx-1">{dayInfo[selectDate].month}</span>
        <span>{dayInfo[selectDate]["year"]}</span>
      </>
    );
  };

  const getTotal = () => {
    return isDesktop ? weeklyTotalHours : dailyTotalHours[selectDate];
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
              <CaretLeft className="h-5 w-5" />
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
              <CaretRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
