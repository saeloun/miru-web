import React from "react";

import Calendar from "react-calendar";

const CalendarComponent = ({ id, name, tileContent, year }) => (
  <div
    className="flex flex-col items-center justify-start bg-miru-gray-100 py-3 px-2"
    key={id}
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
