import React from "react";

import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

const CalendarHeader = ({ prevQuarter, nextQuarter, name }) => (
  <div className="mt-4 flex h-10 justify-between bg-miru-han-purple-1000 text-white">
    <div className="flex flex-auto flex-row items-center justify-center">
      <button className="pr-2" onClick={prevQuarter}>
        <CaretCircleLeftIcon size={13} weight="bold" />
      </button>
      <span className="px-2 ">{name} 2023</span>
      <button className="pl-2" onClick={nextQuarter}>
        <CaretCircleRightIcon size={13} weight="bold" />
      </button>
    </div>
  </div>
);

export default CalendarHeader;
