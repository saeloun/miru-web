import React from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { X, CaretLeft, CaretRight } from "phosphor-react";
import { yearCalendar } from "constants/leaveType";
import { Calendar } from "../ui/calendar";
import { useUserContext } from "context/UserContext";
import CustomYearPicker from "common/CustomYearPicker";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { cn } from "../../lib/utils";

interface HolidayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  tileContent: (props: { date: Date }) => React.ReactNode;
}

const HolidayCalendarModal: React.FC<HolidayCalendarModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  setCurrentYear,
  tileContent,
}) => {
  const { isDesktop } = useUserContext();

  const CalendarComponent = ({ id, name, year }) => {
    const monthDate = new Date(year, id, 1);
    
    // Get holidays for this month
    const getHolidayForDate = (date: Date) => {
      // This should come from your holiday data
      // For now, returning mock data for demonstration
      const dateStr = date.toISOString().split('T')[0];
      // You would check against actual holiday data here
      return null;
    };
    
    const modifiers = {
      holiday: (date: Date) => {
        // Check if date is a holiday
        const holiday = getHolidayForDate(date);
        return holiday !== null;
      },
      optionalHoliday: (date: Date) => {
        // Check if date is an optional holiday
        return false; // Implement based on your data
      }
    };
    
    const modifiersClassNames = {
      holiday: "bg-miru-chart-pink-600 text-white hover:bg-miru-chart-pink-700",
      optionalHoliday: "bg-miru-gray-800 text-white hover:bg-miru-gray-900"
    };
    
    return (
      <div className="flex w-full flex-col items-center justify-start bg-miru-gray-100 py-4 px-3 lg:w-1/3 rounded-lg shadow-sm">
        <span className="text-base font-semibold text-miru-dark-purple-1000 mb-3">
          {name}
        </span>
        <Calendar
          mode="single"
          month={monthDate}
          className="w-full border-0 bg-transparent"
          classNames={{
            months: "w-full",
            month: "w-full space-y-2",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "hidden", // Hide month label since we show it above
            nav: "hidden", // Hide navigation
            table: "w-full border-collapse",
            head_row: "flex justify-around",
            head_cell: "text-miru-dark-purple-600 text-xs font-normal w-8",
            row: "flex justify-around mt-1",
            cell: cn(
              "h-8 w-8 text-center text-xs p-0 relative",
              "[&:has([aria-selected])]:bg-transparent",
              "first:[&:has([aria-selected])]:rounded-l-md",
              "last:[&:has([aria-selected])]:rounded-r-md"
            ),
            day: cn(
              "h-8 w-8 p-0 font-normal text-xs",
              "hover:bg-miru-gray-200 rounded",
              "aria-selected:opacity-100"
            ),
            day_today: "bg-miru-gray-200 text-miru-dark-purple-1000 font-semibold",
            day_selected: "bg-transparent",
            day_outside: "text-miru-dark-purple-400 opacity-50",
            day_disabled: "text-miru-dark-purple-400 opacity-30",
          }}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          disabled={true}
          showOutsideDays={false}
        />
      </div>
    );
  };

  const CalendarForm = () => (
    <div className="flex flex-col bg-white p-6">
      <div className="mb-8 flex w-full items-center justify-between lg:justify-end">
        <div className="flex flex-row items-center gap-6">
          <div className="flex flex-row items-center text-sm font-semibold lg:text-base">
            <div className="mr-3 h-4 w-4 rounded-full bg-miru-chart-pink-600 shadow-sm" />
            Holidays
          </div>
          <div className="flex flex-row items-center text-sm font-semibold lg:text-base">
            <div className="mr-3 h-4 w-4 rounded-full bg-miru-gray-800 shadow-sm" />
            Optional Holidays
          </div>
        </div>
        <CustomYearPicker
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          wrapperClassName="text-miru-han-purple-1000 flex items-center justify-end lg:hidden text-sm font-semibold"
        />
      </div>
      <div className="space-y-6">
        {Object.keys(yearCalendar).map((quarter, quarterIndex) => (
          <div
            className="flex flex-col gap-4 lg:flex-row lg:gap-6"
            key={quarterIndex}
          >
            {yearCalendar[quarter].quarter.map((month, monthIndex) => (
              <CalendarComponent
                id={month.id}
                key={`${quarterIndex}-${monthIndex}`}
                name={month.name}
                year={currentYear}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Mobile view
  if (!isDesktop && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <MobileEditHeader
          backHref="/profiles/leaves/"
          href=""
          showEdit={false}
          title="Public & Optional Holidays"
        />
        <div className="mt-12">
          <CalendarForm />
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 [&>button]:hidden">
        {/* Custom header matching original design */}
        <div className="flex h-14 w-full items-center bg-miru-han-purple-1000 px-6 text-white">
          <DialogTitle className="flex-1 text-lg font-bold">
            Public and optional holidays
          </DialogTitle>
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center justify-center text-white">
              <CustomYearPicker
                currentYear={currentYear}
                setCurrentYear={setCurrentYear}
                wrapperClassName="flex items-center justify-center text-white"
                yearClassName="text-white font-semibold text-base bg-transparent border-none outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              type="button"
              className="p-2.5 hover:bg-white/20 transition-all duration-200 rounded-full hover:scale-105 active:scale-95 group"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-white group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
        {/* Calendar content */}
        <div className="overflow-y-auto max-h-[calc(90vh-3.5rem)]">
          <CalendarForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HolidayCalendarModal;
