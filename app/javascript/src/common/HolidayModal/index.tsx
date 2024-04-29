import React from "react";

import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";

import CustomYearPicker from "common/CustomYearPicker";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { yearCalendar } from "constants/leaveType";
import { useUserContext } from "context/UserContext";

import CalendarComponent from "./CalendarComponent";

const HolidayModal = ({
  tileContent,
  toggleCalendarModal,
  showCalendar,
  currentYear,
  setCurrentYear,
}) => {
  const { isDesktop } = useUserContext();

  const CalendarForm = () => (
    <div className="modal__form flex-col bg-white lg:px-4">
      <div className="mt-3 flex w-full items-center justify-between lg:justify-end">
        <div className="flex flex-row items-center">
          <div className="mr-4 flex flex-row items-center text-xs font-medium lg:text-sm">
            <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-chart-pink-600" />
            Holidays
          </div>
          <div className="flex flex-row items-center text-xs font-medium lg:text-sm">
            <div className="mr-2 h-4 w-4 rounded-2xl bg-miru-gray-800" />
            Optional Holidays
          </div>
        </div>
        <CustomYearPicker
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          wrapperClassName="text-miru-han-purple-1000 flex items-center justify-end lg:hidden text-sm"
        />
      </div>
      {Object.keys(yearCalendar).map((quarters, key) => (
        <div className="flex flex-col gap-4 pt-4 lg:flex-row" key={key}>
          {yearCalendar[quarters].quarter.map((month, key) => (
            <CalendarComponent
              id={month.id}
              key={key}
              name={month.name}
              tileContent={tileContent}
              year={currentYear}
            />
          ))}
        </div>
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <Modal
        customStyle="min-w-60v lg:p-0 lg:pb-6 hidden lg:block"
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
            <Button className="modal__button" onClick={toggleCalendarModal}>
              <XIcon color="#CDD6DF" size={15} />
            </Button>
          </div>
        </div>
        <CalendarForm />
      </Modal>
    );
  }

  if (showCalendar) {
    return (
      <div className="absolute inset-0 z-50 bg-white">
        <MobileEditHeader
          backHref="/leave-management/"
          href=""
          showEdit={false}
          title="Public & Optional Holidays"
        />
        <div className="my-12">
          <CalendarForm />
        </div>
      </div>
    );
  }
};

export default HolidayModal;
