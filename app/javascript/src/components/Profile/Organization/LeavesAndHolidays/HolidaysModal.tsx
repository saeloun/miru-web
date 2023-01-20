import React from "react";

import { CaretCircleLeftIcon, CaretCircleRightIcon, XIcon } from "miruIcons";

import { yearCalendar } from "constants/leaveType";

import CalendarComponent from "./CalendarComponent";

const HolidayModal = ({ tileContent, toggleCalendarModal, wrapperRef }) => (
  <div
    className="modal__modal main-modal"
    style={{ background: "rgba(29, 26, 49,0.6)" }}
  >
    <div className="modal__container modal-container overflow-y-auto; z-50 mx-auto w-full max-w-4xl rounded-xl bg-white shadow-lg">
      <div
        className="modal__content modal-content max-h-90v items-center overflow-y-auto px-0 pt-0"
        ref={wrapperRef}
      >
        <div className="modal__position mx-0 h-10 items-center bg-miru-han-purple-1000 text-white">
          <span className="flex-1 pl-4 text-base">
            {" "}
            Public and optional holidays{" "}
          </span>
          <div className="flex flex-auto flex-row items-center justify-center">
            <button className="pr-2 ">
              <CaretCircleLeftIcon size={13} weight="bold" />
            </button>
            <span className="px-2 ">2023</span>
            <button className="pl-2">
              <CaretCircleRightIcon size={13} weight="bold" />
            </button>
          </div>
          <div className="modal__close flex-1 text-right">
            <button className="modal__button" onClick={toggleCalendarModal}>
              <XIcon color="#CDD6DF" size={15} />
            </button>
          </div>
        </div>
        <div className="modal__form flex-col">
          <div className="mt-3 flex flex-row items-center justify-end px-4">
            <div className="mr-4 flex flex-row items-center text-sm">
              <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-chart-pink-600" />{" "}
              Holidays
            </div>
            <div className="flex flex-row items-center text-sm">
              <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-gray-800" />{" "}
              Optional Holidays
            </div>
          </div>
          {Object.keys(yearCalendar).map((quarters, key) => (
            <div className="flex flex-row justify-around pt-4" key={key}>
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
                    year="2023"
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HolidayModal;
