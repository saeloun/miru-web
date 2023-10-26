import React from "react";

import { XIcon } from "miruIcons";
import { Modal } from "StyledComponents";

import CustomYearPicker from "common/CustomYearPicker";
import { yearCalendar } from "constants/leaveType";

import CalendarComponent from "./CalendarComponent";

const HolidayModal = ({
  tileContent,
  toggleCalendarModal,
  showCalendar,
  currentYear,
  setCurrentYear,
}) => (
  <Modal
    customStyle="min-w-60v lg:p-0 lg:pb-6"
    isOpen={showCalendar}
    onClose={toggleCalendarModal}
  >
    <div className="modal__position mx-0 h-10 w-full items-center bg-miru-han-purple-1000 px-4 text-white">
      <span className="flex-1 pl-4 text-base">
        Public and optional holidays
      </span>
      <CustomYearPicker
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
      />
      <div className="modal__close flex-1 text-right">
        <button className="modal__button" onClick={toggleCalendarModal}>
          <XIcon color="#CDD6DF" size={15} />
        </button>
      </div>
    </div>
    <div className="modal__form flex-col px-4">
      <div className="mt-3 flex flex-row items-center justify-end">
        <div className="mr-4 flex flex-row items-center text-sm">
          <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-chart-pink-600" />{" "}
          Holidays
        </div>
        <div className="flex flex-row items-center text-sm">
          <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-gray-800" /> Optional
          Holidays
        </div>
      </div>
      {Object.keys(yearCalendar).map((quarters, key) => (
        <div
          className="flex flex-col justify-between pt-4 lg:flex-row"
          key={key}
        >
          {yearCalendar[quarters].quarter.map(
            (
              month,
              key //eslint-disable-line
            ) => (
              <CalendarComponent
                id={month.id}
                key={key}
                name={month.name}
                tileContent={tileContent}
                year={currentYear}
              />
            )
          )}
        </div>
      ))}
    </div>
  </Modal>
);

export default HolidayModal;
