import React from "react";

import Calendar from "react-calendar";

const CalendarComponent = ({
  id,
  name,
  tileContent,
  year,
  isWiderScreen = false,
}) => (
  <div
    key={id}
    className={`flex w-full flex-col items-center justify-start bg-miru-gray-100 py-3 lg:w-1/3 ${
      isWiderScreen ? "px-3" : "px-2"
    }`}
  >
    <span className="text-sm">{name}</span>
    <Calendar
      className="react-calendar-month-picker relative max-h-64"
      showNavigation={false}
      tileContent={tileContent}
      value={new Date(year, id, 1)}
    />
  </div>
);

export default CalendarComponent;
