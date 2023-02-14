import React from "react";

import CalendarComponent from "../Organization/LeavesAndHolidays/CalendarComponent";

const QuarterlyCalendar = ({ tileContent, quarterlyMap }) => (
  <div className="flex flex-row justify-between bg-miru-gray-100">
    {quarterlyMap.map(
      (
        month,
        key //eslint-disable-line
      ) => (
        <CalendarComponent
          isWiderScreen
          id={month.id}
          key={key}
          name={month.name}
          tileContent={tileContent}
          year="2023"
        />
      )
    )}
  </div>
);

export default QuarterlyCalendar;
