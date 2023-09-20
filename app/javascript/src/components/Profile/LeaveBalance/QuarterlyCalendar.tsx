import React from "react";

import CalendarComponent from "../Organization/Holidays/CalendarComponent";

const QuarterlyCalendar = ({ tileContent, quarterlyMap }) => (
  <div className="flex flex-row justify-between bg-miru-gray-100">
    {quarterlyMap.map(month => (
      <CalendarComponent
        isWiderScreen
        id={month.id}
        key={month.id}
        name={month.name}
        tileContent={tileContent}
        year="2023"
      />
    ))}
  </div>
);

export default QuarterlyCalendar;
