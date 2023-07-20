import React from "react";

import dayjs from "dayjs";

export const getDateWithType = (holiday, date) =>
  holiday.find(o => o.date === dayjs(date).format("DD-MM-YYYY"));

export const CalendarButton = ({ result, date, className }) => (
  <button
    className={`holiday-wrapper ${className}`}
    data-bs-placement="right"
    data-bs-toggle="tooltip"
    title={result.name}
  >
    {date.getDate()}
  </button>
);

export const getCalendarButton = (className, date, result) => (
  <CalendarButton className={className} date={date} result={result} />
);

export const TileContentWrapper = ({
  date,
  holiday,
  annualLeave,
  partialAnnualLeave,
  sickLeave,
  maternityLeave,
  upcomingOptionHoliday,
}) => {
  let result;
  if ((result = getDateWithType(holiday, date))) {
    return getCalendarButton("holiday", date, result);
  } else if ((result = getDateWithType(annualLeave, date))) {
    return getCalendarButton("annual-leave", date, result);
  } else if ((result = getDateWithType(partialAnnualLeave, date))) {
    return getCalendarButton("annual-leave-partial", date, result);
  } else if ((result = getDateWithType(sickLeave, date))) {
    return getCalendarButton("sick-leave", date, result);
  } else if ((result = getDateWithType(maternityLeave, date))) {
    return getCalendarButton("maternity-leave", date, result);
  } else if ((result = getDateWithType(upcomingOptionHoliday, date))) {
    return getCalendarButton("optional-holiday", date, result);
  }

  return <button>{date.getDate()}</button>;
};
