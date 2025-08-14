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
    <span className="text-sm font-medium text-miru-dark-purple-1000">
      {name}
    </span>
    <Calendar
      className="react-calendar-month-picker relative max-h-64"
      showNavigation={false}
      tileContent={tileContent}
      value={new Date(year, id, 1)}
      tileDisabled={() => true}
      onClickDay={(value, event) => {
        // Prevent default calendar day click behavior
        event.preventDefault();
      }}
    />
  </div>
);

export default CalendarComponent;
